from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from database import get_db
from models.models import Employee, EmployeeStatusSchedule
from pydantic import BaseModel
from datetime import datetime, date

router = APIRouter()

@router.get("/test")
async def test_endpoint():
    """Тестовый endpoint для проверки работы роутера"""
    return {"message": "Employee status schedules router is working"}

@router.get("/check-table")
async def check_table(db: AsyncSession = Depends(get_db)):
    """Проверить существование таблицы employee_status_schedules"""
    try:
        # Проверяем, существует ли таблица
        result = await db.execute("SELECT COUNT(*) FROM employee_status_schedules")
        count = result.scalar()
        return {"message": "Table exists", "count": count}
    except Exception as e:
        return {"message": "Table does not exist or error", "error": str(e)}

class StatusScheduleCreate(BaseModel):
    status: str
    start_date: str
    end_date: str
    notes: Optional[str] = None

class StatusScheduleResponse(BaseModel):
    id: int
    employee_id: int
    status: str
    start_date: str
    end_date: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

@router.get("/employees/{employee_id}/status-schedules", response_model=List[StatusScheduleResponse])
async def get_employee_status_schedules(
    employee_id: int, 
    year: Optional[int] = None,
    month: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Получить расписание статусов сотрудника"""
    try:
        print(f"DEBUG: Получение статусов для сотрудника {employee_id}, год: {year}, месяц: {month}")
        
        # Проверяем существование сотрудника
        employee_result = await db.execute(select(Employee).where(Employee.id == employee_id))
        employee = employee_result.scalar_one_or_none()
        if not employee:
            print(f"DEBUG: Сотрудник {employee_id} не найден")
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        print(f"DEBUG: Сотрудник найден: {employee.first_name} {employee.last_name}")
        
        # Формируем запрос
        query = select(EmployeeStatusSchedule).where(EmployeeStatusSchedule.employee_id == employee_id)
        
        # Если указаны год и месяц, фильтруем по ним
        if year and month:
            start_date = date(year, month, 1)
            if month == 12:
                end_date = date(year + 1, 1, 1) - date.resolution
            else:
                end_date = date(year, month + 1, 1) - date.resolution
            
            print(f"DEBUG: Фильтрация по периоду: {start_date} - {end_date}")
            
            query = query.where(
                and_(
                    EmployeeStatusSchedule.start_date <= end_date,
                    EmployeeStatusSchedule.end_date >= start_date
                )
            )
        
        query = query.order_by(EmployeeStatusSchedule.start_date)
        
        print(f"DEBUG: Выполнение запроса к базе данных")
        result = await db.execute(query)
        schedules = result.scalars().all()
        
        print(f"DEBUG: Найдено {len(schedules)} статусов")
        
        return schedules
        
    except Exception as e:
        print(f"ERROR: Ошибка при получении статусов: {str(e)}")
        print(f"ERROR: Тип ошибки: {type(e)}")
        import traceback
        print(f"ERROR: Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.post("/employees/{employee_id}/status-schedules", response_model=StatusScheduleResponse)
async def create_employee_status_schedule(
    employee_id: int,
    schedule_data: StatusScheduleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Создать новое расписание статуса для сотрудника"""
    # Проверяем существование сотрудника
    employee_result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = employee_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Проверяем валидность статуса
    valid_statuses = ['Б', 'К', 'О']  # Болен, Командировка, Отпуск
    if schedule_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Неверный статус. Допустимые значения: {', '.join(valid_statuses)}")
    
    # Парсим даты
    try:
        start_date = datetime.strptime(schedule_data.start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(schedule_data.end_date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте формат YYYY-MM-DD")
    
    # Проверяем, что начальная дата не позже конечной
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Дата начала не может быть позже даты окончания")
    
    # Проверяем пересечения с существующими расписаниями
    existing_schedules = await db.execute(
        select(EmployeeStatusSchedule).where(
            and_(
                EmployeeStatusSchedule.employee_id == employee_id,
                and_(
                    EmployeeStatusSchedule.start_date <= end_date,
                    EmployeeStatusSchedule.end_date >= start_date
                )
            )
        )
    )
    
    if existing_schedules.scalars().first():
        raise HTTPException(status_code=400, detail="На указанный период уже установлен статус")
    
    # Создаем новое расписание
    new_schedule = EmployeeStatusSchedule(
        employee_id=employee_id,
        status=schedule_data.status,
        start_date=start_date,
        end_date=end_date,
        notes=schedule_data.notes
    )
    
    db.add(new_schedule)
    await db.commit()
    await db.refresh(new_schedule)
    
    return new_schedule

@router.delete("/employees/status-schedules/{schedule_id}")
async def delete_employee_status_schedule(
    schedule_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Удалить расписание статуса сотрудника"""
    # Находим расписание
    schedule_result = await db.execute(
        select(EmployeeStatusSchedule).where(EmployeeStatusSchedule.id == schedule_id)
    )
    schedule = schedule_result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Расписание статуса не найдено")
    
    # Удаляем расписание
    await db.delete(schedule)
    await db.commit()
    
    return {"message": "Расписание статуса успешно удалено"}

@router.put("/employees/status-schedules/{schedule_id}", response_model=StatusScheduleResponse)
async def update_employee_status_schedule(
    schedule_id: int,
    schedule_data: StatusScheduleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Обновить расписание статуса сотрудника"""
    # Находим расписание
    schedule_result = await db.execute(
        select(EmployeeStatusSchedule).where(EmployeeStatusSchedule.id == schedule_id)
    )
    schedule = schedule_result.scalar_one_or_none()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Расписание статуса не найдено")
    
    # Проверяем валидность статуса
    valid_statuses = ['Б', 'К', 'О']  # Болен, Командировка, Отпуск
    if schedule_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Неверный статус. Допустимые значения: {', '.join(valid_statuses)}")
    
    # Парсим даты
    try:
        start_date = datetime.strptime(schedule_data.start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(schedule_data.end_date, '%Y-%m-%d').date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте формат YYYY-MM-DD")
    
    # Проверяем, что начальная дата не позже конечной
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Дата начала не может быть позже даты окончания")
    
    # Проверяем пересечения с существующими расписаниями (исключая текущее)
    existing_schedules = await db.execute(
        select(EmployeeStatusSchedule).where(
            and_(
                EmployeeStatusSchedule.employee_id == schedule.employee_id,
                EmployeeStatusSchedule.id != schedule_id,
                and_(
                    EmployeeStatusSchedule.start_date <= end_date,
                    EmployeeStatusSchedule.end_date >= start_date
                )
            )
        )
    )
    
    if existing_schedules.scalars().first():
        raise HTTPException(status_code=400, detail="На указанный период уже установлен статус")
    
    # Обновляем расписание
    schedule.status = schedule_data.status
    schedule.start_date = start_date
    schedule.end_date = end_date
    schedule.notes = schedule_data.notes
    schedule.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(schedule)
    
    return schedule 