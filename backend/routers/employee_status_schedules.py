from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
from database import get_db
from models.models import Employee, EmployeeStatusSchedule
from pydantic import BaseModel
from datetime import datetime, date, timedelta

router = APIRouter()

class StatusScheduleCreate(BaseModel):
    status: str
    start_date: date
    end_date: date
    notes: Optional[str] = None

class StatusScheduleResponse(BaseModel):
    id: int
    employee_id: int
    status: str
    start_date: date
    end_date: date
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
    # Проверяем существование сотрудника
    employee_result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = employee_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Формируем запрос
    query = select(EmployeeStatusSchedule).where(EmployeeStatusSchedule.employee_id == employee_id)
    
    # Если указаны год и месяц, фильтруем по ним
    if year and month:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - date.resolution
        else:
            end_date = date(year, month + 1, 1) - date.resolution
        
        query = query.where(
            and_(
                EmployeeStatusSchedule.start_date <= end_date,
                EmployeeStatusSchedule.end_date >= start_date
            )
        )
    
    query = query.order_by(EmployeeStatusSchedule.start_date)
    
    result = await db.execute(query)
    schedules = result.scalars().all()
    
    return schedules

@router.get("/employees/{employee_id}/current-status")
async def get_employee_current_status(
    employee_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить текущий статус сотрудника на основе расписания"""
    # Проверяем существование сотрудника
    employee_result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = employee_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Получаем текущую дату
    today = date.today()
    
    # Ищем активный статус на сегодня
    status_result = await db.execute(
        select(EmployeeStatusSchedule).where(
            and_(
                EmployeeStatusSchedule.employee_id == employee_id,
                EmployeeStatusSchedule.start_date <= today,
                EmployeeStatusSchedule.end_date >= today
            )
        )
    )
    
    current_status = status_result.scalar_one_or_none()
    
    if current_status:
        return {
            "status": current_status.status,
            "notes": current_status.notes,
            "start_date": current_status.start_date,
            "end_date": current_status.end_date
        }
    else:
        return {
            "status": "НЛ",  # Нет статуса - обычное состояние
            "notes": None,
            "start_date": None,
            "end_date": None
        }

@router.post("/employees/{employee_id}/sync-status")
async def sync_employee_status(
    employee_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Синхронизировать статус сотрудника с расписанием"""
    # Проверяем существование сотрудника
    employee_result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = employee_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Получаем текущую дату
    today = date.today()
    
    # Ищем активный статус на сегодня
    status_result = await db.execute(
        select(EmployeeStatusSchedule).where(
            and_(
                EmployeeStatusSchedule.employee_id == employee_id,
                EmployeeStatusSchedule.start_date <= today,
                EmployeeStatusSchedule.end_date >= today
            )
        )
    )
    
    current_status = status_result.scalar_one_or_none()
    
    # Обновляем статус сотрудника
    if current_status:
        employee.status = current_status.status
        employee.status_updated_at = datetime.utcnow()
    else:
        employee.status = "НЛ"  # Нет статуса - обычное состояние
        employee.status_updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(employee)
    
    return {
        "message": "Статус сотрудника синхронизирован",
        "current_status": employee.status,
        "updated_at": employee.status_updated_at
    }

@router.post("/sync-all-employees")
async def sync_all_employees_status(db: AsyncSession = Depends(get_db)):
    """Синхронизировать статусы всех сотрудников с их расписаниями"""
    try:
        # Получаем всех активных сотрудников
        employees_result = await db.execute(
            select(Employee).where(Employee.is_active == True)
        )
        employees = employees_result.scalars().all()
        
        updated_count = 0
        today = date.today()
        
        for employee in employees:
            # Ищем активный статус на сегодня
            status_result = await db.execute(
                select(EmployeeStatusSchedule).where(
                    and_(
                        EmployeeStatusSchedule.employee_id == employee.id,
                        EmployeeStatusSchedule.start_date <= today,
                        EmployeeStatusSchedule.end_date >= today
                    )
                )
            )
            
            current_status = status_result.scalar_one_or_none()
            
            # Обновляем статус сотрудника
            if current_status:
                employee.status = current_status.status
            else:
                employee.status = "НЛ"  # Нет статуса - обычное состояние
            
            employee.status_updated_at = datetime.utcnow()
            updated_count += 1
        
        await db.commit()
        
        return {
            "message": f"Статусы {updated_count} сотрудников синхронизированы",
            "updated_count": updated_count
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при синхронизации: {str(e)}")
async def get_employee_current_status(
    employee_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить текущий статус сотрудника на основе расписания"""
    # Проверяем существование сотрудника
    employee_result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = employee_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Получаем текущую дату
    today = date.today()
    
    # Ищем активный статус на сегодня
    status_result = await db.execute(
        select(EmployeeStatusSchedule).where(
            and_(
                EmployeeStatusSchedule.employee_id == employee_id,
                EmployeeStatusSchedule.start_date <= today,
                EmployeeStatusSchedule.end_date >= today
            )
        )
    )
    
    current_status = status_result.scalar_one_or_none()
    
    if current_status:
        return {
            "status": current_status.status,
            "notes": current_status.notes,
            "start_date": current_status.start_date,
            "end_date": current_status.end_date
        }
    else:
        return {
            "status": "НЛ",  # Нет статуса - обычное состояние
            "notes": None,
            "start_date": None,
            "end_date": None
        }

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
    
    # Получаем даты из модели
    start_date = schedule_data.start_date
    end_date = schedule_data.end_date
    
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
    
    # Синхронизируем статус сотрудника
    await sync_employee_status(employee_id, db)
    
    # Запускаем автоматическую синхронизацию для этого сотрудника
    try:
        from . import auto_sync
        await auto_sync.sync_employee_status_auto(employee_id, db)
    except Exception as e:
        logger.warning(f"Ошибка при автоматической синхронизации: {e}")
    
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
    
    # Синхронизируем статус сотрудника
    await sync_employee_status(schedule.employee_id, db)
    
    # Запускаем автоматическую синхронизацию для этого сотрудника
    try:
        from . import auto_sync
        await auto_sync.sync_employee_status_auto(schedule.employee_id, db)
    except Exception as e:
        logger.warning(f"Ошибка при автоматической синхронизации: {e}")
    
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
    
    # Получаем даты из модели
    start_date = schedule_data.start_date
    end_date = schedule_data.end_date
    
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
    
    # Синхронизируем статус сотрудника
    await sync_employee_status(schedule.employee_id, db)
    
    # Запускаем автоматическую синхронизацию для этого сотрудника
    try:
        from . import auto_sync
        await auto_sync.sync_employee_status_auto(schedule.employee_id, db)
    except Exception as e:
        logger.warning(f"Ошибка при автоматической синхронизации: {e}")
    
    return schedule

@router.delete("/employees/{employee_id}/status-schedules/month")
async def delete_employee_status_schedules_for_month(
    employee_id: int,
    year: int,
    month: int,
    db: AsyncSession = Depends(get_db)
):
    """Удалить все статусы сотрудника за указанный месяц"""
    try:
        # Проверяем, что сотрудник существует
        employee_result = await db.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        employee = employee_result.scalar_one_or_none()
        
        if not employee:
            raise HTTPException(status_code=404, detail="Сотрудник не найден")
        
        # Вычисляем начальную и конечную даты месяца
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1) - timedelta(days=1)
        else:
            end_date = date(year, month + 1, 1) - timedelta(days=1)
        
        # Находим все статусы, которые пересекаются с указанным месяцем
        schedules_result = await db.execute(
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
        
        schedules = schedules_result.scalars().all()
        
        if not schedules:
            return {"message": "Статусы за указанный месяц не найдены"}
        
        # Удаляем найденные статусы
        deleted_count = 0
        for schedule in schedules:
            await db.delete(schedule)
            deleted_count += 1
        
        await db.commit()
        
        # Синхронизируем статус сотрудника
        await sync_employee_status(employee_id, db)
        
        # Запускаем автоматическую синхронизацию для этого сотрудника
        try:
            from . import auto_sync
            await auto_sync.sync_employee_status_auto(employee_id, db)
        except Exception as e:
            logger.warning(f"Ошибка при автоматической синхронизации: {e}")
        
        return {
            "message": f"Удалено {deleted_count} статусов за {month}/{year}",
            "deleted_count": deleted_count
        }
        
    except Exception as e:
        await db.rollback()
        logger.error(f"Ошибка при удалении статусов за месяц: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении статусов: {str(e)}") 