#!/usr/bin/env python3
"""
Миграция для добавления таблицы групп
Добавляет новый уровень иерархии: Структура-Подразделение-Группа-Сотрудник
"""

import asyncio
import os
import sys
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Добавляем путь к модулям проекта
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_database_url

async def run_migration():
    """Выполнение миграции"""
    print("🔄 Выполнение миграции: добавление таблицы групп")
    print("=" * 60)
    
    # Создаем подключение к базе данных
    engine = create_async_engine(get_database_url())
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            # 1. Создаем таблицу групп
            print("📋 Создание таблицы groups...")
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS groups (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            
            # 2. Добавляем поле group_id в таблицу employees
            print("👥 Добавление поля group_id в таблицу employees...")
            await session.execute(text("""
                ALTER TABLE employees 
                ADD COLUMN IF NOT EXISTS group_id INTEGER REFERENCES groups(id) ON DELETE SET NULL
            """))
            
            # 3. Создаем индексы для оптимизации
            print("📊 Создание индексов...")
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_groups_department_id ON groups(department_id)
            """))
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_employees_group_id ON employees(group_id)
            """))
            
            # 4. Создаем триггер для обновления updated_at
            print("⏰ Создание триггеров...")
            await session.execute(text("""
                CREATE OR REPLACE FUNCTION update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = NOW();
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            """))
            
            await session.execute(text("""
                DROP TRIGGER IF EXISTS update_groups_updated_at ON groups
            """))
            await session.execute(text("""
                CREATE TRIGGER update_groups_updated_at
                    BEFORE UPDATE ON groups
                    FOR EACH ROW
                    EXECUTE FUNCTION update_updated_at_column()
            """))
            
            await session.commit()
            print("✅ Миграция успешно завершена!")
            
            # 5. Проверяем структуру таблиц
            print("\n📋 Проверка структуры таблиц:")
            
            # Проверяем таблицу groups
            result = await session.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'groups' 
                ORDER BY ordinal_position
            """))
            print("Таблица 'groups':")
            for row in result.fetchall():
                print(f"  - {row[0]}: {row[1]} ({'NULL' if row[2] == 'YES' else 'NOT NULL'})")
            
            # Проверяем таблицу employees
            result = await session.execute(text("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = 'employees' AND column_name = 'group_id'
            """))
            print("\nПоле 'group_id' в таблице 'employees':")
            for row in result.fetchall():
                print(f"  - {row[0]}: {row[1]} ({'NULL' if row[2] == 'YES' else 'NOT NULL'})")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Ошибка при выполнении миграции: {e}")
            raise
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration()) 