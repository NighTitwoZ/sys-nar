from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Dict, Any
from database import get_db
from models.models import Department, Employee, DutyType, DutyRecord, EmployeeDutyType
from pydantic import BaseModel
from datetime import datetime, date, timedelta
import calendar
import random
from fastapi.responses import StreamingResponse
import io
import logging
import traceback

try:
    import openpyxl
except ImportError:
    openpyxl = None

router = APIRouter()

class DutyDistributionRequest(BaseModel):
    year: int
    month: int

class DutyDistributionResponse(BaseModel):
    department_id: int
    department_name: str
    duties: List[Dict[str, Any]]

@router.post("/generate", response_model=List[DutyDistributionResponse])
async def generate_duty_distribution(
    request: DutyDistributionRequest, 
    db: AsyncSession = Depends(get_db)
):
    """Генерировать распределение нарядов на месяц с улучшенной логикой"""
    
    # Получаем количество дней в месяце
    _, days_in_month = calendar.monthrange(request.year, request.month)
    
    # Получаем все типы нарядов
    duty_types_result = await db.execute(select(DutyType))
    duty_types = duty_types_result.scalars().all()
    
    # Получаем всех сотрудников с их типами нарядов
    employees_result = await db.execute(
        select(Employee, EmployeeDutyType, DutyType)
        .join(EmployeeDutyType, Employee.id == EmployeeDutyType.employee_id)
        .join(DutyType, EmployeeDutyType.duty_type_id == DutyType.id)
        .where(Employee.is_active == True)
        .where(EmployeeDutyType.is_active == True)
    )
    
    employees_data = employees_result.all()
    
    # Группируем сотрудников по типам нарядов
    duty_types_employees = {}
    for emp, emp_duty, duty_type in employees_data:
        if duty_type.id not in duty_types_employees:
            duty_types_employees[duty_type.id] = {
                'duty_type': duty_type,
                'employees': []
            }
        duty_types_employees[duty_type.id]['employees'].append(emp)
    
    # Словарь для отслеживания занятости сотрудников по дням
    employee_busy_dates = {}
    
    # Словарь для отслеживания количества человек в нарядах по дням
    duty_slots_by_date = {}
    
    distribution = []
    
    # Генерируем наряды для каждого типа
    for duty_type_id, data in duty_types_employees.items():
        duty_type = data['duty_type']
        employees = data['employees']
        duties = []
        # 1. Собираем competing_departments
        competing_departments = set(emp.department_id for emp in employees)
        # 2. Для каждого дня
        for day in range(1, days_in_month + 1):
            duty_date = date(request.year, request.month, day)
            date_key = duty_date.isoformat()
            if date_key not in duty_slots_by_date:
                duty_slots_by_date[date_key] = {}
            current_count = duty_slots_by_date[date_key].get(duty_type_id, 0)
            slots_left = duty_type.people_per_day - current_count
            if slots_left <= 0:
                continue
            # 3. Считаем department_duty_counts (по памяти + базе)
            department_duty_counts = {dept_id: 0 for dept_id in competing_departments}
            for emp in employees:
                count = 0
                # В памяти
                count += sum(1 for d in employee_busy_dates.get(emp.id, set()) if d <= date_key)
                # В базе
                count_result = await db.execute(
                    select(func.count(DutyRecord.id))
                    .where(DutyRecord.employee_id == emp.id)
                    .where(DutyRecord.duty_type_id == duty_type.id)
                    .where(func.extract('year', DutyRecord.duty_date) == duty_date.year)
                    .where(func.extract('month', DutyRecord.duty_date) == duty_date.month)
                )
                count += count_result.scalar() or 0
                department_duty_counts[emp.department_id] += count
            # 4. Для каждого подразделения
            for dept_id in competing_departments:
                dept_employees = [emp for emp in employees if emp.department_id == dept_id]
                selected_employees = await select_employees_for_duty_global(
                    dept_employees, duty_date, slots_left, employee_busy_dates, db,
                    department_duty_counts, dept_id, competing_departments
                )
                for employee in selected_employees:
                    if employee.id not in employee_busy_dates:
                        employee_busy_dates[employee.id] = set()
                    employee_busy_dates[employee.id].add(date_key)
                    duty_slots_by_date[date_key][duty_type_id] = duty_slots_by_date[date_key].get(duty_type_id, 0) + 1
                    duties.append({
                        'date': date_key,
                        'employee_id': employee.id,
                        'employee_name': f"{employee.last_name} {employee.first_name}",
                        'duty_type_id': duty_type.id,
                        'duty_type_name': duty_type.name,
                        'people_per_day': duty_type.people_per_day
                    })
                    slots_left -= 1
                    if slots_left <= 0:
                        break
                if slots_left <= 0:
                    break
        # Группируем по подразделениям для ответа
        dept_result = await db.execute(select(Department))
        departments = dept_result.scalars().all()
        for dept in departments:
            dept_duties = [d for d in duties if any(
                emp.id == d['employee_id'] and emp.department_id == dept.id 
                for emp in employees
            )]
            if dept_duties:
                distribution.append({
                    'department_id': dept.id,
                    'department_name': dept.name,
                    'duties': dept_duties
                })
    
    # Сохраняем все наряды в базу
    for dept in distribution:
        for duty in dept['duties']:
            db.add(DutyRecord(
                employee_id=duty['employee_id'],
                duty_type_id=duty['duty_type_id'],
                duty_date=date.fromisoformat(duty['date'])
            ))
    await db.commit()
    return distribution

async def select_employees_for_duty_global(
    employees: List[Employee],
    duty_date: date,
    people_needed: int,
    employee_busy_dates: Dict[int, set],
    db: AsyncSession,
    department_duty_counts: dict = None,  # department_id -> count
    current_department_id: int = None,    # id подразделения, для которого сейчас выбираем
    competing_departments: set = None     # id подразделений, у которых есть этот тип наряда
) -> List[Employee]:
    """Выбирает сотрудников для наряда с учетом глобальных ограничений, равномерности и баланса между подразделениями"""
    date_key = duty_date.isoformat()
    # Получаем количество нарядов каждого сотрудника в этом месяце и дату последнего наряда
    employee_duty_counts = {}
    employee_last_duty_dates = {}
    for employee in employees:
        # Количество нарядов в месяце
        count_result = await db.execute(
            select(func.count(DutyRecord.id))
            .where(DutyRecord.employee_id == employee.id)
            .where(func.extract('year', DutyRecord.duty_date) == duty_date.year)
            .where(func.extract('month', DutyRecord.duty_date) == duty_date.month)
        )
        count_in_db = count_result.scalar()
        count_in_memory = len(employee_busy_dates.get(employee.id, set()))
        employee_duty_counts[employee.id] = (count_in_db or 0) + count_in_memory
        # Дата последнего наряда (учитываем employee_busy_dates)
        all_dates = set()
        last_duty_result = await db.execute(
            select(DutyRecord.duty_date)
            .where(DutyRecord.employee_id == employee.id)
            .order_by(DutyRecord.duty_date.desc())
            .limit(1)
        )
        last_duty_date_db = last_duty_result.scalar()
        if last_duty_date_db:
            all_dates.add(last_duty_date_db)
        for d in employee_busy_dates.get(employee.id, set()):
            all_dates.add(date.fromisoformat(d))
        last_duty_date = max(all_dates) if all_dates else None
        employee_last_duty_dates[employee.id] = last_duty_date
    # Фильтруем доступных сотрудников
    available_employees = []
    for employee in employees:
        if employee.id in employee_busy_dates and date_key in employee_busy_dates[employee.id]:
            continue
        last_duty_date = employee_last_duty_dates[employee.id]
        if last_duty_date is not None:
            days_since_last = (duty_date - last_duty_date).days
            if days_since_last < 3:
                continue
        available_employees.append(employee)
    if not available_employees:
        return []
    # --- Новый блок: баланс между подразделениями ---
    if department_duty_counts and current_department_id and competing_departments and len(competing_departments) > 1:
        # Приоритет подразделениям с меньшим количеством нарядов по этому типу
        dept_count = department_duty_counts.get(current_department_id, 0)
        min_dept_count = min(department_duty_counts[dept_id] for dept_id in competing_departments)
        if dept_count > min_dept_count:
            # Если у текущего подразделения больше нарядов, чем у других, не выбираем сотрудников из него
            return []
    # --- Конец блока ---
    available_employees.sort(key=lambda emp: (employee_duty_counts[emp.id], employee_last_duty_dates[emp.id] or date.min))
    if available_employees:
        min_count = employee_duty_counts[available_employees[0].id]
        min_employees = [emp for emp in available_employees if employee_duty_counts[emp.id] == min_count]
        min_employees.sort(key=lambda emp: employee_last_duty_dates[emp.id] or date.min)
        selected_employees = min_employees[:people_needed]
        return selected_employees
    return []

@router.get("/department/{department_id}")
async def get_duty_distribution_by_department(
    department_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить распределение нарядов для конкретного подразделения"""
    
    # Получаем подразделение
    dept_result = await db.execute(select(Department).where(Department.id == department_id))
    department = dept_result.scalar_one_or_none()
    
    if not department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    
    # Получаем все записи нарядов для сотрудников подразделения
    duty_records_result = await db.execute(
        select(DutyRecord, Employee, DutyType)
        .join(Employee, DutyRecord.employee_id == Employee.id)
        .join(DutyType, DutyRecord.duty_type_id == DutyType.id)
        .where(Employee.department_id == department_id)
        .order_by(DutyRecord.duty_date, Employee.last_name, Employee.first_name)
    )
    
    duty_records = duty_records_result.all()
    
    # Формируем ответ
    distribution_data = []
    for duty_record, employee, duty_type in duty_records:
        distribution_data.append({
            'id': duty_record.id,
            'duty_type_name': duty_type.name,
            'date': duty_record.duty_date.isoformat(),
            'employee_name': f"{employee.last_name} {employee.first_name}",
            'department_name': department.name
        })
    
    return distribution_data 

@router.get("/duty-type/{duty_type_id}")
async def get_duty_distribution_by_type(
    duty_type_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить распределение нарядов по типу наряда (таблица: дата, ФИО, подразделение)"""
    duty_records_result = await db.execute(
        select(DutyRecord, Employee, Department)
        .join(Employee, DutyRecord.employee_id == Employee.id)
        .join(Department, Employee.department_id == Department.id)
        .where(DutyRecord.duty_type_id == duty_type_id)
        .order_by(DutyRecord.duty_date, Employee.last_name, Employee.first_name)
    )
    duty_records = duty_records_result.all()
    result = []
    for duty_record, employee, department in duty_records:
        result.append({
            'date': duty_record.duty_date.isoformat(),
            'employee_name': f"{employee.last_name} {employee.first_name}",
            'department_name': department.name
        })
    return result

@router.get("/all")
async def get_all_duties(
    year: int = Query(..., description="Год"),
    month: int = Query(..., description="Месяц"),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import extract
    duty_records_result = await db.execute(
        select(DutyRecord, Employee, Department, DutyType)
        .join(Employee, DutyRecord.employee_id == Employee.id)
        .join(Department, Employee.department_id == Department.id)
        .join(DutyType, DutyRecord.duty_type_id == DutyType.id)
        .where(extract('year', DutyRecord.duty_date) == year)
        .where(extract('month', DutyRecord.duty_date) == month)
        .order_by(Department.id, DutyRecord.duty_date, Employee.last_name, Employee.first_name)
    )
    duty_records = duty_records_result.all()
    result = []
    for duty_record, employee, department, duty_type in duty_records:
        result.append({
            'id': duty_record.id,
            'date': duty_record.duty_date.isoformat(),
            'employee_name': f"{employee.last_name} {employee.first_name}",
            'department_id': department.id,
            'department_name': department.name,
            'duty_type_id': duty_type.id,
            'duty_type_name': duty_type.name
        })
    return result

@router.delete("/clear")
async def clear_duty_records(
    year: int = Query(..., description="Год"),
    month: int = Query(..., description="Месяц"),
    db: AsyncSession = Depends(get_db)
):
    """Удалить все наряды за указанный месяц и год"""
    from models.models import DutyRecord
    from sqlalchemy import extract
    result = await db.execute(
        select(DutyRecord).where(
            extract('year', DutyRecord.duty_date) == year,
            extract('month', DutyRecord.duty_date) == month
        )
    )
    records = result.scalars().all()
    for record in records:
        await db.delete(record)
    await db.commit()
    return {"message": f"Удалено {len(records)} нарядов за {month:02d}.{year}"} 

@router.get("/export")
async def export_duties_to_excel(
    year: int = Query(..., description="Год"),
    month: int = Query(..., description="Месяц"),
    db: AsyncSession = Depends(get_db)
):
    """Экспортировать наряды за месяц/год в Excel (xlsx)"""
    try:
        # Получаем все записи нарядов за месяц/год
        duty_records_result = await db.execute(
            select(DutyRecord, Employee, Department, DutyType)
            .join(Employee, DutyRecord.employee_id == Employee.id)
            .join(Department, Employee.department_id == Department.id)
            .join(DutyType, DutyRecord.duty_type_id == DutyType.id)
            .where(func.extract('year', DutyRecord.duty_date) == year)
            .where(func.extract('month', DutyRecord.duty_date) == month)
            .order_by(DutyRecord.duty_date, Department.name, Employee.last_name, Employee.first_name)
        )
        duty_records = duty_records_result.all()
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = f"Наряды {month:02d}.{year}"
        ws.append(["Дата", "ФИО", "Подразделение", "Тип наряда"])
        if not duty_records:
            ws.append(["Нет данных", "", "", ""])
        else:
            for duty_record, employee, department, duty_type in duty_records:
                ws.append([
                    duty_record.duty_date.strftime("%d-%m-%Y"),
                    f"{employee.last_name} {employee.first_name}",
                    department.name,
                    duty_type.name
                ])
        stream = io.BytesIO()
        wb.save(stream)
        stream.seek(0)
        filename = f"duty_distribution_{year}_{month:02d}.xlsx"
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export error: {e}") 

@router.get("/export/department/{department_id}")
async def export_department_duties_to_excel(
    department_id: int,
    year: int = Query(..., description="Год"),
    month: int = Query(..., description="Месяц"),
    db: AsyncSession = Depends(get_db)
):
    """Экспортировать наряды по подразделению в Excel (сотрудники × даты)"""
    try:
        from sqlalchemy import extract
        # Получаем все записи нарядов для подразделения за месяц/год
        duty_records_result = await db.execute(
            select(DutyRecord, Employee, DutyType)
            .join(Employee, DutyRecord.employee_id == Employee.id)
            .join(DutyType, DutyRecord.duty_type_id == DutyType.id)
            .where(Employee.department_id == department_id)
            .where(extract('year', DutyRecord.duty_date) == year)
            .where(extract('month', DutyRecord.duty_date) == month)
            .order_by(Employee.last_name, Employee.first_name, DutyRecord.duty_date)
        )
        duty_records = duty_records_result.all()
        # Собираем уникальные даты и сотрудников
        dates = sorted({duty_record.duty_date for duty_record, _, _ in duty_records})
        employees = []
        emp_set = set()
        for duty_record, employee, _ in duty_records:
            if employee.id not in emp_set:
                employees.append((employee.id, f"{employee.last_name} {employee.first_name}"))
                emp_set.add(employee.id)
        # Строим мапу: (employee_id, date) -> тип наряда
        duty_map = {}
        for duty_record, employee, duty_type in duty_records:
            duty_map[(employee.id, duty_record.duty_date)] = duty_type.name
        import openpyxl
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = f"Подразделение {department_id}"
        # Первая строка — даты
        header = ["Сотрудник"] + [date.strftime("%d-%m") for date in dates]
        ws.append(header)
        # Данные по сотрудникам
        for emp_id, emp_name in employees:
            row = [emp_name]
            for date in dates:
                row.append(duty_map.get((emp_id, date), ""))
            ws.append(row)
        stream = io.BytesIO()
        wb.save(stream)
        stream.seek(0)
        filename = f"department_{department_id}_duties_{year}_{month:02d}.xlsx"
        return StreamingResponse(
            stream,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export error: {e}") 