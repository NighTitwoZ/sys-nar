#!/usr/bin/env python3
"""
Проверка ограничения уникальности в базе данных внутри контейнера
"""

import asyncio
from database import engine
from sqlalchemy import text

async def check_constraint():
    print("🔍 Проверка ограничения уникальности в базе данных...")
    
    try:
        async with engine.begin() as conn:
            # Проверяем существование ограничения
            result = await conn.execute(text("""
                SELECT constraint_name, table_name, column_name
                FROM information_schema.table_constraints 
                WHERE constraint_name = 'duty_types_name_key' 
                AND table_name = 'duty_types';
            """))
            
            constraints = result.fetchall()
            
            if constraints:
                print("❌ Ограничение уникальности ВСЕ ЕЩЕ СУЩЕСТВУЕТ!")
                for row in constraints:
                    print(f"   Ограничение: {row[0]}")
                    print(f"   Таблица: {row[1]}")
                    print(f"   Колонка: {row[2]}")
                
                # Пытаемся удалить ограничение
                print("\n🔧 Попытка удаления ограничения...")
                await conn.execute(text("""
                    ALTER TABLE duty_types DROP CONSTRAINT IF EXISTS duty_types_name_key;
                """))
                print("✅ Ограничение удалено!")
                
            else:
                print("✅ Ограничение уникальности НЕ НАЙДЕНО!")
                
    except Exception as e:
        print(f"❌ Ошибка при проверке: {e}")

if __name__ == "__main__":
    asyncio.run(check_constraint()) 