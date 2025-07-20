#!/usr/bin/env python3
"""
Выполнение SQL-файла для удаления ограничения
"""

import asyncio
from database import engine
from sqlalchemy import text

async def run_sql():
    print("🔧 Выполнение SQL для удаления ограничения...")
    
    try:
        # Читаем SQL-файл
        with open('/app/drop_constraint.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        print("📄 Содержимое SQL-файла:")
        print(sql_content)
        
        async with engine.begin() as conn:
            # Выполняем SQL
            result = await conn.execute(text(sql_content))
            print("✅ SQL выполнен успешно!")
            
    except Exception as e:
        print(f"❌ Ошибка при выполнении SQL: {e}")

if __name__ == "__main__":
    asyncio.run(run_sql()) 