#!/usr/bin/env python3
import asyncio
import sys
import os

# Добавляем путь к backend
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from database import engine, Base
from models.models import EmployeeStatusSchedule, Employee

async def check_database():
    """Проверить состояние базы данных"""
    try:
        print("🔍 Проверка базы данных...")
        
        # Создаем таблицы
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Таблицы созданы/обновлены")
        
        # Проверяем, существует ли таблица employee_status_schedules
        async with engine.begin() as conn:
            result = await conn.execute("SELECT COUNT(*) FROM employee_status_schedules")
            count = result.scalar()
            print(f"✅ Таблица employee_status_schedules существует, записей: {count}")
        
        # Проверяем, есть ли сотрудники
        async with engine.begin() as conn:
            result = await conn.execute("SELECT COUNT(*) FROM employees")
            count = result.scalar()
            print(f"✅ Таблица employees существует, записей: {count}")
            
            if count > 0:
                result = await conn.execute("SELECT id, first_name, last_name FROM employees LIMIT 5")
                employees = result.fetchall()
                print("📋 Примеры сотрудников:")
                for emp in employees:
                    print(f"   ID: {emp[0]}, Имя: {emp[1]} {emp[2]}")
        
        print("🎉 Проверка завершена успешно!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(check_database()) 