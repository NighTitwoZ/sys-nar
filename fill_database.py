#!/usr/bin/env python3
"""
Скрипт для заполнения базы данных тестовыми данными
Алгоритм заполнения:
- Структуры: 1фак, 2фак, 3фак, 4фак, 5фак, 6фак, 7фак, 8фак, 9фак, Академ-каф
- Подразделения в каждой структуре: 1курс, 2курс, 3курс, 4курс, 5курс, Управление, 1каф, 2каф, 3каф
- Для каждого подразделения: 3 типа нарядов
"""

import asyncio
import os
import sys
import random
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

# Структуры (факультеты)
STRUCTURES = [
    "1фак", "2фак", "3фак", "4фак", "5фак", 
    "6фак", "7фак", "8фак", "9фак", "Академ-каф"
]

# Подразделения в каждой структуре
DEPARTMENTS = [
    "1курс", "2курс", "3курс", "4курс", "5курс", 
    "Управление", "1каф", "2каф", "3каф"
]

# Типы нарядов (3 для каждого подразделения)
DUTY_TYPES = [
    "Дежурство по роте",
    "Дежурство по батальону", 
    "Дежурство по полку",
    "Дежурство по дивизии",
    "Дежурство по корпусу",
    "Дежурство по армии",
    "Дежурство по округу",
    "Дежурство по гарнизону",
    "Дежурство по части",
    "Дежурство по соединению"
]

# Фамилии для генерации сотрудников
LAST_NAMES = [
    "Иванов", "Петров", "Сидоров", "Козлов", "Смирнов",
    "Попов", "Соколов", "Лебедев", "Новиков", "Морозов",
    "Петров", "Волков", "Алексеев", "Лебедев", "Семенов",
    "Егоров", "Павлов", "Козлов", "Степанов", "Николаев"
]

# Имена для генерации сотрудников
FIRST_NAMES = [
    "Александр", "Сергей", "Дмитрий", "Андрей", "Алексей",
    "Максим", "Евгений", "Владимир", "Артем", "Игорь",
    "Николай", "Михаил", "Павел", "Роман", "Денис",
    "Антон", "Виктор", "Константин", "Илья", "Василий"
]

# Отчества для генерации сотрудников
MIDDLE_NAMES = [
    "Александрович", "Сергеевич", "Дмитриевич", "Андреевич", "Алексеевич",
    "Максимович", "Евгеньевич", "Владимирович", "Артемович", "Игоревич",
    "Николаевич", "Михайлович", "Павлович", "Романович", "Денисович",
    "Антонович", "Викторович", "Константинович", "Ильич", "Васильевич"
]

# Должности
POSITIONS = [
    "Командир роты", "Заместитель командира роты", "Старшина роты",
    "Командир взвода", "Заместитель командира взвода", "Старшина взвода",
    "Командир отделения", "Заместитель командира отделения", "Старший сержант",
    "Сержант", "Младший сержант", "Ефрейтор", "Рядовой"
]

class DatabaseFiller:
    def __init__(self, database_url):
        self.engine = create_async_engine(database_url, echo=False)
        self.AsyncSessionLocal = sessionmaker(
            self.engine, class_=AsyncSession, expire_on_commit=False
        )
        
    async def create_tables(self):
        """Создание таблиц"""
        print("Создание таблиц...")
        
        # Создаем таблицы на основе моделей
        async with self.engine.begin() as conn:
            # Создаем таблицу departments
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS departments (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    parent_id INTEGER REFERENCES departments(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            
            # Создаем таблицу employees
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS employees (
                    id SERIAL PRIMARY KEY,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    middle_name VARCHAR(100),
                    position VARCHAR(255) NOT NULL,
                    department_id INTEGER NOT NULL REFERENCES departments(id),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            
            # Создаем таблицу duty_types
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS duty_types (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    description TEXT,
                    priority INTEGER DEFAULT 1,
                    people_per_day INTEGER DEFAULT 1,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            
            # Создаем таблицу employee_duty_types
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS employee_duty_types (
                    id SERIAL PRIMARY KEY,
                    employee_id INTEGER NOT NULL REFERENCES employees(id),
                    duty_type_id INTEGER NOT NULL REFERENCES duty_types(id),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            
            # Создаем таблицу duty_records
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS duty_records (
                    id SERIAL PRIMARY KEY,
                    employee_id INTEGER NOT NULL REFERENCES employees(id),
                    duty_type_id INTEGER NOT NULL REFERENCES duty_types(id),
                    duty_date DATE NOT NULL,
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
        
        print("OK: Таблицы созданы")
    
    async def create_structures(self):
        """Создание структур (факультетов)"""
        print("Создание структур (факультетов)...")
        
        async with self.AsyncSessionLocal() as session:
            structures = []
            for structure_name in STRUCTURES:
                # Проверяем, существует ли уже структура
                result = await session.execute(
                    text("SELECT id FROM departments WHERE name = :name AND parent_id IS NULL"),
                    {"name": structure_name}
                )
                if result.fetchone():
                    print(f"   Пропуск: Структура '{structure_name}' уже существует")
                    continue
                    
                result = await session.execute(
                    text("""
                        INSERT INTO departments (name, description, parent_id) 
                        VALUES (:name, :description, NULL) 
                        RETURNING id
                    """),
                    {
                        "name": structure_name,
                        "description": f"Факультет {structure_name}"
                    }
                )
                structure_id = result.fetchone()[0]
                structures.append({"id": structure_id, "name": structure_name})
                print(f"   OK: Создана структура: {structure_name}")
            
            await session.commit()
            return structures
    
    async def create_departments(self, structures):
        """Создание подразделений в каждой структуре"""
        print("Создание подразделений...")
        
        async with self.AsyncSessionLocal() as session:
            departments = []
            for structure in structures:
                print(f"   Структура: {structure['name']}")
                for dept_name in DEPARTMENTS:
                    # Проверяем, существует ли уже подразделение
                    result = await session.execute(
                        text("SELECT id FROM departments WHERE name = :name AND parent_id = :parent_id"),
                        {"name": dept_name, "parent_id": structure['id']}
                    )
                    if result.fetchone():
                        print(f"      Пропуск: Подразделение '{dept_name}' уже существует")
                        continue
                        
                    result = await session.execute(
                        text("""
                            INSERT INTO departments (name, description, parent_id) 
                            VALUES (:name, :description, :parent_id) 
                            RETURNING id
                        """),
                        {
                            "name": dept_name,
                            "description": f"Подразделение {dept_name} в структуре {structure['name']}",
                            "parent_id": structure['id']
                        }
                    )
                    dept_id = result.fetchone()[0]
                    departments.append({"id": dept_id, "name": dept_name, "structure": structure['name']})
                    print(f"      OK: Создано подразделение: {dept_name}")
            
            await session.commit()
            return departments
    
    async def create_duty_types(self):
        """Создание типов нарядов"""
        print("Создание типов нарядов...")
        
        async with self.AsyncSessionLocal() as session:
            duty_types = []
            for duty_name in DUTY_TYPES:
                # Проверяем, существует ли уже тип наряда
                result = await session.execute(
                    text("SELECT id FROM duty_types WHERE name = :name"),
                    {"name": duty_name}
                )
                if result.fetchone():
                    print(f"   Пропуск: Тип наряда '{duty_name}' уже существует")
                    continue
                    
                result = await session.execute(
                    text("""
                        INSERT INTO duty_types (name, description, duty_category, people_per_day) 
                        VALUES (:name, :description, :duty_category, :people_per_day) 
                        RETURNING id
                    """),
                    {
                        "name": duty_name,
                        "description": f"Тип наряда: {duty_name}",
                        "duty_category": random.choice(["academic", "division"]),
                        "people_per_day": random.randint(1, 3)
                    }
                )
                duty_type_id = result.fetchone()[0]
                duty_types.append({"id": duty_type_id, "name": duty_name})
                print(f"   OK: Создан тип наряда: {duty_name}")
            
            await session.commit()
            return duty_types
    
    async def create_employees(self, departments):
        """Создание сотрудников для каждого подразделения"""
        print("Создание сотрудников...")
        
        async with self.AsyncSessionLocal() as session:
            employees = []
            for department in departments:
                print(f"   Подразделение: {department['name']}")
                
                # Создаем от 5 до 15 сотрудников для каждого подразделения
                num_employees = random.randint(5, 15)
                
                for i in range(num_employees):
                    result = await session.execute(
                        text("""
                            INSERT INTO employees (first_name, last_name, middle_name, position, department_id, is_active) 
                            VALUES (:first_name, :last_name, :middle_name, :position, :department_id, TRUE) 
                            RETURNING id, first_name, last_name
                        """),
                        {
                            "first_name": random.choice(FIRST_NAMES),
                            "last_name": random.choice(LAST_NAMES),
                            "middle_name": random.choice(MIDDLE_NAMES),
                            "position": random.choice(POSITIONS),
                            "department_id": department['id']
                        }
                    )
                    employee_data = result.fetchone()
                    employees.append({
                        "id": employee_data[0],
                        "first_name": employee_data[1],
                        "last_name": employee_data[2],
                        "department": department['name']
                    })
                    print(f"      OK: Создан сотрудник: {employee_data[2]} {employee_data[1]}")
            
            await session.commit()
            return employees
    
    async def assign_duty_types_to_employees(self, employees, duty_types):
        """Назначение типов нарядов сотрудникам"""
        print("Назначение типов нарядов сотрудникам...")
        
        async with self.AsyncSessionLocal() as session:
            assignments_count = 0
            for employee in employees:
                # Каждому сотруднику назначаем от 1 до 3 типов нарядов
                num_duty_types = random.randint(1, 3)
                selected_duty_types = random.sample(duty_types, min(num_duty_types, len(duty_types)))
                
                for duty_type in selected_duty_types:
                    # Проверяем, не назначен ли уже этот тип наряда сотруднику
                    result = await session.execute(
                        text("""
                            SELECT id FROM employee_duty_types 
                            WHERE employee_id = :employee_id AND duty_type_id = :duty_type_id
                        """),
                        {"employee_id": employee['id'], "duty_type_id": duty_type['id']}
                    )
                    if result.fetchone():
                        continue
                        
                    await session.execute(
                        text("""
                            INSERT INTO employee_duty_types (employee_id, duty_type_id, is_active) 
                            VALUES (:employee_id, :duty_type_id, TRUE)
                        """),
                        {"employee_id": employee['id'], "duty_type_id": duty_type['id']}
                    )
                    assignments_count += 1
                    print(f"   OK: Назначен тип '{duty_type['name']}' сотруднику {employee['last_name']}")
            
            await session.commit()
            return assignments_count
    
    async def close(self):
        """Закрытие соединения с базой данных"""
        await self.engine.dispose()

async def main():
    """Основная функция заполнения базы данных"""
    print("=" * 60)
    print("ЗАПОЛНЕНИЕ БАЗЫ ДАННЫХ ТЕСТОВЫМИ ДАННЫМИ")
    print("=" * 60)
    
    # URL базы данных
    database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://naradi_user:naradi_password@localhost:5432/naradi_db")
    
    # Создаем экземпляр заполнителя базы данных
    filler = DatabaseFiller(database_url)
    
    try:
        # Создание таблиц
        await filler.create_tables()
        
        # Создание структур
        structures = await filler.create_structures()
        
        # Создание подразделений
        departments = await filler.create_departments(structures)
        
        # Создание типов нарядов
        duty_types = await filler.create_duty_types()
        
        # Создание сотрудников
        employees = await filler.create_employees(departments)
        
        # Назначение типов нарядов сотрудникам
        assignments_count = await filler.assign_duty_types_to_employees(employees, duty_types)
        
        print("\n" + "=" * 60)
        print("ЗАПОЛНЕНИЕ БАЗЫ ДАННЫХ ЗАВЕРШЕНО УСПЕШНО!")
        print("=" * 60)
        print(f"Статистика:")
        print(f"   - Структур создано: {len(structures)}")
        print(f"   - Подразделений создано: {len(departments)}")
        print(f"   - Типов нарядов создано: {len(duty_types)}")
        print(f"   - Сотрудников создано: {len(employees)}")
        print(f"   - Назначений типов нарядов: {assignments_count}")
        print("\nОткройте http://localhost:3000 для работы с системой")
        
    except Exception as e:
        print(f"ОШИБКА: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await filler.close()
    
    return True

if __name__ == "__main__":
    # Запускаем заполнение
    success = asyncio.run(main())
    
    if success:
        print("\nГотово!")
    else:
        print("\nПроизошла ошибка при заполнении базы данных")
        sys.exit(1) 