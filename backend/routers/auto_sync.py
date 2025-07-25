from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from database import get_db
from models.models import Employee, EmployeeStatusSchedule
from datetime import datetime, date
import asyncio
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

async def sync_employee_status_auto(employee_id: int, db: AsyncSession):
    """Автоматическая синхронизация статуса сотрудника"""
    try:
        # Получаем сотрудника
        employee_result = await db.execute(select(Employee).where(Employee.id == employee_id))
        employee = employee_result.scalar_one_or_none()
        
        if not employee:
            logger.warning(f"Сотрудник с ID {employee_id} не найден")
            return
        
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
            logger.info(f"Сотрудник {employee.last_name} {employee.first_name}: статус обновлен на {current_status.status}")
        else:
            employee.status = "НЛ"  # Нет статуса - обычное состояние
            employee.status_updated_at = datetime.utcnow()
            logger.info(f"Сотрудник {employee.last_name} {employee.first_name}: статус сброшен на НЛ")
        
        await db.commit()
        
    except Exception as e:
        logger.error(f"Ошибка при синхронизации статуса сотрудника {employee_id}: {str(e)}")
        await db.rollback()

async def sync_all_employees_status_auto(db: AsyncSession):
    """Автоматическая синхронизация статусов всех сотрудников"""
    try:
        logger.info("Начало автоматической синхронизации статусов всех сотрудников")
        
        # Получаем всех активных сотрудников
        employees_result = await db.execute(
            select(Employee).where(Employee.is_active == True)
        )
        employees = employees_result.scalars().all()
        
        updated_count = 0
        today = date.today()
        
        for employee in employees:
            try:
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
                
            except Exception as e:
                logger.error(f"Ошибка при синхронизации сотрудника {employee.id}: {str(e)}")
                continue
        
        await db.commit()
        logger.info(f"Автоматическая синхронизация завершена. Обновлено {updated_count} сотрудников")
        
    except Exception as e:
        logger.error(f"Ошибка при автоматической синхронизации: {str(e)}")
        await db.rollback()

@router.post("/sync-all")
async def trigger_sync_all_employees(db: AsyncSession = Depends(get_db)):
    """Запустить синхронизацию всех сотрудников (для тестирования)"""
    try:
        await sync_all_employees_status_auto(db)
        return {"message": "Синхронизация всех сотрудников выполнена успешно"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при синхронизации: {str(e)}")

@router.post("/sync-employee/{employee_id}")
async def trigger_sync_employee(employee_id: int, db: AsyncSession = Depends(get_db)):
    """Запустить синхронизацию конкретного сотрудника (для тестирования)"""
    try:
        await sync_employee_status_auto(employee_id, db)
        return {"message": f"Синхронизация сотрудника {employee_id} выполнена успешно"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при синхронизации: {str(e)}")

# Функция для запуска автоматической синхронизации
async def start_auto_sync():
    """Запуск автоматической синхронизации"""
    while True:
        try:
            # Получаем текущее время
            now = datetime.now()
            
            # Запускаем синхронизацию в 00:01 каждый день
            if now.hour == 0 and now.minute == 1:
                logger.info("Запуск ежедневной автоматической синхронизации статусов")
                
                # Создаем новую сессию базы данных
                from database import engine
                async with engine.begin() as conn:
                    # Создаем AsyncSession
                    from sqlalchemy.ext.asyncio import AsyncSession
                    async with AsyncSession(conn) as session:
                        await sync_all_employees_status_auto(session)
                
                # Ждем 2 минуты, чтобы не запускать синхронизацию несколько раз
                await asyncio.sleep(120)
            else:
                # Проверяем каждую минуту
                await asyncio.sleep(60)
                
        except Exception as e:
            logger.error(f"Ошибка в автоматической синхронизации: {str(e)}")
            await asyncio.sleep(60)  # Ждем минуту перед следующей попыткой 