#!/usr/bin/env python3
import asyncio
import sys
import os

# Добавляем путь к backend
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from database import engine, Base
from models.models import EmployeeStatusSchedule, Employee

async def fix_database():
    """Исправить базу данных"""
    try:
        print("🔧 Исправление базы данных...")
        
        # Создаем все таблицы
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Все таблицы созданы/обновлены")
        
        # Проверяем, существует ли таблица employee_status_schedules
        async with engine.begin() as conn:
            try:
                result = await conn.execute("SELECT COUNT(*) FROM employee_status_schedules")
                count = result.scalar()
                print(f"✅ Таблица employee_status_schedules существует, записей: {count}")
            except Exception as e:
                print(f"❌ Таблица employee_status_schedules не существует: {e}")
                print("🔧 Создаем таблицу вручную...")
                
                # Создаем таблицу вручную
                await conn.execute("""
                    CREATE TABLE IF NOT EXISTS employee_status_schedules (
                        id SERIAL PRIMARY KEY,
                        employee_id INTEGER NOT NULL REFERENCES employees(id),
                        status VARCHAR(10) NOT NULL,
                        start_date DATE NOT NULL,
                        end_date DATE NOT NULL,
                        notes TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        updated_at TIMESTAMP WITH TIME ZONE
                    )
                """)
                
                # Создаем индексы
                await conn.execute("""
                    CREATE INDEX IF NOT EXISTS ix_employee_status_schedules_id 
                    ON employee_status_schedules(id)
                """)
                
                await conn.execute("""
                    CREATE INDEX IF NOT EXISTS ix_employee_status_schedules_employee_id 
                    ON employee_status_schedules(employee_id)
                """)
                
                await conn.execute("""
                    CREATE INDEX IF NOT EXISTS ix_employee_status_schedules_dates 
                    ON employee_status_schedules(start_date, end_date)
                """)
                
                print("✅ Таблица employee_status_schedules создана")
        
        # Проверяем, есть ли сотрудники
        async with engine.begin() as conn:
            result = await conn.execute("SELECT COUNT(*) FROM employees")
            count = result.scalar()
            print(f"✅ Таблица employees существует, записей: {count}")
            
            if count > 0:
                result = await conn.execute("SELECT id, first_name, last_name FROM employees LIMIT 3")
                employees = result.fetchall()
                print("📋 Примеры сотрудников:")
                for emp in employees:
                    print(f"   ID: {emp[0]}, Имя: {emp[1]} {emp[2]}")
        
        print("🎉 База данных исправлена успешно!")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        print(f"📋 Traceback: {traceback.format_exc()}")

if __name__ == "__main__":
    asyncio.run(fix_database()) 