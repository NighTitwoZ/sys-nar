#!/usr/bin/env python3
"""
Упрощенное удаление ограничения уникальности
"""

import asyncio
from database import engine
from sqlalchemy import text

async def drop_constraint():
    print("🔧 Удаление ограничения уникальности...")
    
    try:
        async with engine.begin() as conn:
            # Проверяем, существует ли ограничение
            print("1️⃣ Проверка существования ограничения...")
            result = await conn.execute(text("""
                SELECT constraint_name
                FROM information_schema.table_constraints 
                WHERE constraint_name = 'duty_types_name_key' 
                AND table_name = 'duty_types';
            """))
            
            constraints = result.fetchall()
            
            if constraints:
                print("❌ Ограничение уникальности НАЙДЕНО!")
                for row in constraints:
                    print(f"   Ограничение: {row[0]}")
                
                # Удаляем ограничение
                print("\n2️⃣ Удаление ограничения...")
                await conn.execute(text("""
                    ALTER TABLE duty_types DROP CONSTRAINT IF EXISTS duty_types_name_key;
                """))
                print("✅ Ограничение удалено!")
                
                # Проверяем, что ограничение удалено
                print("\n3️⃣ Проверка удаления...")
                result = await conn.execute(text("""
                    SELECT constraint_name
                    FROM information_schema.table_constraints 
                    WHERE constraint_name = 'duty_types_name_key' 
                    AND table_name = 'duty_types';
                """))
                
                constraints_after = result.fetchall()
                
                if not constraints_after:
                    print("✅ Ограничение успешно удалено!")
                else:
                    print("❌ Ограничение все еще существует!")
                    
            else:
                print("✅ Ограничение уникальности НЕ НАЙДЕНО!")
                
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    asyncio.run(drop_constraint()) 