#!/usr/bin/env python3
"""
Скрипт для миграции базы данных - добавление поля duty_category в таблицу duty_types
"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

async def migrate_duty_category():
    """Выполняет миграцию для добавления поля duty_category"""
    
    # Получаем параметры подключения к базе данных
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/naradi_db')
    
    try:
        # Подключаемся к базе данных
        conn = await asyncpg.connect(database_url)
        print("✅ Подключение к базе данных установлено")
        
        # Проверяем, существует ли уже поле duty_category
        check_query = """
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'duty_types' AND column_name = 'duty_category';
        """
        
        result = await conn.fetch(check_query)
        
        if result:
            print("⚠️  Поле duty_category уже существует в таблице duty_types")
            return
        
        # Добавляем новое поле duty_category
        alter_query = """
        ALTER TABLE duty_types 
        ADD COLUMN duty_category VARCHAR(50) NOT NULL DEFAULT 'internal';
        """
        
        await conn.execute(alter_query)
        print("✅ Поле duty_category добавлено в таблицу duty_types")
        
        # Добавляем комментарий к полю
        comment_query = """
        COMMENT ON COLUMN duty_types.duty_category IS 'Категория наряда: internal - внутри подразделения, academic - академический';
        """
        
        await conn.execute(comment_query)
        print("✅ Комментарий добавлен к полю duty_category")
        
        # Обновляем существующие записи (все существующие наряды считаем внутренними)
        update_query = """
        UPDATE duty_types 
        SET duty_category = 'internal' 
        WHERE duty_category IS NULL OR duty_category = '';
        """
        
        await conn.execute(update_query)
        print("✅ Существующие записи обновлены")
        
        # Проверяем результат
        check_result_query = "SELECT id, name, duty_category FROM duty_types LIMIT 5;"
        result = await conn.fetch(check_result_query)
        
        print("\n📋 Результат миграции (первые 5 записей):")
        for row in result:
            print(f"  ID: {row['id']}, Название: {row['name']}, Категория: {row['duty_category']}")
        
        await conn.close()
        print("\n✅ Миграция успешно завершена!")
        
    except Exception as e:
        print(f"❌ Ошибка при выполнении миграции: {e}")
        raise

if __name__ == "__main__":
    print("🚀 Запуск миграции для добавления поля duty_category...")
    asyncio.run(migrate_duty_category()) 