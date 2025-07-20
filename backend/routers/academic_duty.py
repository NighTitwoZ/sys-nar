from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from database import get_db
from models.models import DutyType, Department, Employee, DutyRecord, DepartmentDutyDay
from pydantic import BaseModel
from datetime import date

router = APIRouter()

class AcademicDutyCreate(BaseModel):
    employee_id: int
    duty_type_id: int
    duty_date: str
    notes: Optional[str] = None

class DepartmentDutyDayCreate(BaseModel):
    department_id: int
    duty_type_id: int
    duty_date: str

class DepartmentDutyDayResponse(BaseModel):
    id: int
    department_id: int
    department_name: str
    duty_type_id: int
    duty_type_name: str
    duty_date: str
    
    class Config:
        from_attributes = True

class AcademicDutyResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    duty_type_id: int
    duty_type_name: str
    duty_date: str
    notes: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/duty-types", response_model=List[dict])
async def get_academic_duty_types(db: AsyncSession = Depends(get_db)):
    """Получить список академических типов нарядов"""
    result = await db.execute(
        select(DutyType)
        .where(DutyType.duty_category == "academic")
        .order_by(DutyType.name)
    )
    duty_types = result.scalars().all()
    return [
        {
            "id": dt.id,
            "name": dt.name,
            "description": dt.description,
            "duty_category": dt.duty_category,
            "people_per_day": dt.people_per_day
        }
        for dt in duty_types
    ]

@router.get("/departments", response_model=List[dict])
async def get_departments(db: AsyncSession = Depends(get_db)):
    """Получить список всех подразделений"""
    result = await db.execute(select(Department).order_by(Department.name))
    departments = result.scalars().all()
    return [
        {
            "id": dept.id,
            "name": dept.name,
            "description": dept.description
        }
        for dept in departments
    ]

@router.get("/departments/{department_id}/employees", response_model=List[dict])
async def get_department_employees(department_id: int, db: AsyncSession = Depends(get_db)):
    """Получить список сотрудников подразделения"""
    result = await db.execute(
        select(Employee)
        .where(Employee.department_id == department_id)
        .where(Employee.is_active == True)
        .order_by(Employee.last_name, Employee.first_name)
    )
    employees = result.scalars().all()
    return [
        {
            "id": emp.id,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "middle_name": emp.middle_name,
            "position": emp.position,
            "department_id": emp.department_id
        }
        for emp in employees
    ]

@router.post("/assign", response_model=AcademicDutyResponse)
async def assign_academic_duty(duty: AcademicDutyCreate, db: AsyncSession = Depends(get_db)):
    """Назначить сотрудника на академический наряд"""
    
    # Проверяем существование сотрудника
    employee_result = await db.execute(
        select(Employee).where(Employee.id == duty.employee_id)
    )
    employee = employee_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Проверяем существование типа наряда
    duty_type_result = await db.execute(
        select(DutyType).where(DutyType.id == duty.duty_type_id)
    )
    duty_type = duty_type_result.scalar_one_or_none()
    if not duty_type:
        raise HTTPException(status_code=404, detail="Тип наряда не найден")
    
    # Проверяем, что тип наряда является академическим
    if duty_type.duty_category != "academic":
        raise HTTPException(status_code=400, detail="Тип наряда не является академическим")
    
    # Парсим дату
    try:
        duty_date = date.fromisoformat(duty.duty_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты")
    
    # Проверяем, не назначен ли уже сотрудник на этот тип наряда в эту дату
    existing_duty_result = await db.execute(
        select(DutyRecord).where(
            and_(
                DutyRecord.employee_id == duty.employee_id,
                DutyRecord.duty_type_id == duty.duty_type_id,
                DutyRecord.duty_date == duty_date
            )
        )
    )
    existing_duty = existing_duty_result.scalar_one_or_none()
    if existing_duty:
        raise HTTPException(status_code=400, detail="Сотрудник уже назначен на этот тип наряда в эту дату")
    
    # Создаем запись о наряде
    duty_record = DutyRecord(
        employee_id=duty.employee_id,
        duty_type_id=duty.duty_type_id,
        duty_date=duty_date,
        notes=duty.notes
    )
    
    db.add(duty_record)
    await db.commit()
    await db.refresh(duty_record)
    
    # Возвращаем ответ с именами
    return {
        "id": duty_record.id,
        "employee_id": duty_record.employee_id,
        "employee_name": f"{employee.last_name} {employee.first_name}",
        "duty_type_id": duty_record.duty_type_id,
        "duty_type_name": duty_type.name,
        "duty_date": duty_record.duty_date.isoformat(),
        "notes": duty_record.notes
    }

@router.get("/records", response_model=List[AcademicDutyResponse])
async def get_academic_duty_records(
    year: Optional[int] = None,
    month: Optional[int] = None,
    duty_type_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Получить записи академических нарядов с фильтрацией"""
    
    query = (
        select(DutyRecord, Employee, DutyType)
        .join(Employee, DutyRecord.employee_id == Employee.id)
        .join(DutyType, DutyRecord.duty_type_id == DutyType.id)
        .where(DutyType.duty_category == "academic")
    )
    
    # Фильтр по типу наряда
    if duty_type_id:
        query = query.where(DutyType.id == duty_type_id)
    
    # Фильтр по подразделению
    if department_id:
        query = query.where(Employee.department_id == department_id)
    
    # Фильтр по году и месяцу
    if year is not None and month is not None:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - date.resolution
        else:
            end_date = date(year, month + 1, 1) - date.resolution
        query = query.where(
            and_(
                DutyRecord.duty_date >= start_date,
                DutyRecord.duty_date <= end_date
            )
        )
    
    result = await db.execute(query.order_by(DutyRecord.duty_date))
    records = result.all()
    
    return [
        {
            "id": record.DutyRecord.id,
            "employee_id": record.DutyRecord.employee_id,
            "employee_name": f"{record.Employee.last_name} {record.Employee.first_name}",
            "duty_type_id": record.DutyRecord.duty_type_id,
            "duty_type_name": record.DutyType.name,
            "duty_date": record.DutyRecord.duty_date.isoformat(),
            "notes": record.DutyRecord.notes
        }
        for record in records
    ]

@router.delete("/records/{record_id}")
async def delete_academic_duty_record(record_id: int, db: AsyncSession = Depends(get_db)):
    """Удалить запись академического наряда"""
    
    # Проверяем существование записи
    result = await db.execute(
        select(DutyRecord, DutyType)
        .join(DutyType, DutyRecord.duty_type_id == DutyType.id)
        .where(DutyRecord.id == record_id)
        .where(DutyType.duty_category == "academic")
    )
    record_data = result.first()
    
    if not record_data:
        raise HTTPException(status_code=404, detail="Запись академического наряда не найдена")
    
    # Удаляем запись
    await db.delete(record_data.DutyRecord)
    await db.commit()
    
    return {"message": "Запись академического наряда удалена"}

# Новые endpoints для работы с днями подразделения

@router.post("/department-days", response_model=DepartmentDutyDayResponse)
async def assign_department_duty_day(duty_day: DepartmentDutyDayCreate, db: AsyncSession = Depends(get_db)):
    """Назначить день дежурства подразделения в академическом наряде"""
    
    # Проверяем существование подразделения
    department_result = await db.execute(
        select(Department).where(Department.id == duty_day.department_id)
    )
    department = department_result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    
    # Проверяем существование типа наряда
    duty_type_result = await db.execute(
        select(DutyType).where(DutyType.id == duty_day.duty_type_id)
    )
    duty_type = duty_type_result.scalar_one_or_none()
    if not duty_type:
        raise HTTPException(status_code=404, detail="Тип наряда не найден")
    
    # Проверяем, что тип наряда является академическим
    if duty_type.duty_category != "academic":
        raise HTTPException(status_code=400, detail="Тип наряда не является академическим")
    
    # Парсим дату
    try:
        duty_date = date.fromisoformat(duty_day.duty_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты")
    
    # Проверяем, не назначен ли уже день дежурства для этого подразделения и типа наряда
    existing_day_result = await db.execute(
        select(DepartmentDutyDay).where(
            and_(
                DepartmentDutyDay.department_id == duty_day.department_id,
                DepartmentDutyDay.duty_type_id == duty_day.duty_type_id,
                DepartmentDutyDay.duty_date == duty_date
            )
        )
    )
    existing_day = existing_day_result.scalar_one_or_none()
    if existing_day:
        raise HTTPException(status_code=400, detail="День дежурства уже назначен для этого подразделения и типа наряда")
    
    # Создаем запись о дне дежурства
    duty_day_record = DepartmentDutyDay(
        department_id=duty_day.department_id,
        duty_type_id=duty_day.duty_type_id,
        duty_date=duty_date
    )
    
    db.add(duty_day_record)
    await db.commit()
    await db.refresh(duty_day_record)
    
    # Возвращаем ответ с именами
    return {
        "id": duty_day_record.id,
        "department_id": duty_day_record.department_id,
        "department_name": department.name,
        "duty_type_id": duty_day_record.duty_type_id,
        "duty_type_name": duty_type.name,
        "duty_date": duty_day_record.duty_date.isoformat()
    }

@router.get("/department-days", response_model=List[DepartmentDutyDayResponse])
async def get_department_duty_days(
    year: Optional[int] = None,
    month: Optional[int] = None,
    duty_type_id: Optional[int] = None,
    department_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Получить дни дежурства подразделений в академических нарядах с фильтрацией"""
    
    query = (
        select(DepartmentDutyDay, Department, DutyType)
        .join(Department, DepartmentDutyDay.department_id == Department.id)
        .join(DutyType, DepartmentDutyDay.duty_type_id == DutyType.id)
        .where(DutyType.duty_category == "academic")
    )
    
    # Фильтр по типу наряда
    if duty_type_id:
        query = query.where(DutyType.id == duty_type_id)
    
    # Фильтр по подразделению
    if department_id:
        query = query.where(Department.id == department_id)
    
    # Фильтр по году и месяцу
    if year is not None and month is not None:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - date.resolution
        else:
            end_date = date(year, month + 1, 1) - date.resolution
        query = query.where(
            and_(
                DepartmentDutyDay.duty_date >= start_date,
                DepartmentDutyDay.duty_date <= end_date
            )
        )
    
    result = await db.execute(query.order_by(DepartmentDutyDay.duty_date))
    records = result.all()
    
    return [
        {
            "id": record.DepartmentDutyDay.id,
            "department_id": record.DepartmentDutyDay.department_id,
            "department_name": record.Department.name,
            "duty_type_id": record.DepartmentDutyDay.duty_type_id,
            "duty_type_name": record.DutyType.name,
            "duty_date": record.DepartmentDutyDay.duty_date.isoformat()
        }
        for record in records
    ]

@router.delete("/department-days/{day_id}")
async def delete_department_duty_day(day_id: int, db: AsyncSession = Depends(get_db)):
    """Удалить день дежурства подразделения"""
    
    # Проверяем существование записи
    result = await db.execute(
        select(DepartmentDutyDay, DutyType)
        .join(DutyType, DepartmentDutyDay.duty_type_id == DutyType.id)
        .where(DepartmentDutyDay.id == day_id)
        .where(DutyType.duty_category == "academic")
    )
    record_data = result.first()
    
    if not record_data:
        raise HTTPException(status_code=404, detail="День дежурства подразделения не найден")
    
    # Удаляем запись
    await db.delete(record_data.DepartmentDutyDay)
    await db.commit()
    
    return {"message": "День дежурства подразделения удален"} 