import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from models.models import Base, Department, Employee, DutyType, EmployeeDutyType
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://naradi_user:naradi_password@postgres:5432/naradi_db"

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# --- Данные для тестовой иерархии ---
MAJOR_DEPARTMENTS = [
    "1фак", "2фак", "3фак", "4фак", "5фак", "6фак", "7фак", "8фак", "9фак", "Спецфак", "Академ_каф"
]

MINOR_DEPARTMENTS = {
    "1фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "Управление"],
    "2фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "Управление"],
    "3фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "Управление"],
    "4фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "Управление"],
    "5фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "Управление"],
    "6фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "Управление"],
    "7фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "Управление"],
    "8фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "Управление"],
    "9фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "Управление"],
    "Спецфак": ["1курс", "2курс", "3курс", "4курс", "5курс", "Управление"],
    "Академ_каф": ["1каф", "2каф", "3каф", "Управление"],
}

DUTY_TYPES = [
    ("Дежурный", "Обычный дежурный", 1, 2),
    ("Ответственный", "Ответственный по смене", 2, 1),
]

async def clear_all(session: AsyncSession):
    # Удаляем все записи с учётом связей
    await session.execute(text("DELETE FROM duty_records"))
    await session.execute(text("DELETE FROM employee_duty_types"))
    await session.execute(text("DELETE FROM employees"))
    await session.execute(text("DELETE FROM duty_types"))
    await session.execute(text("DELETE FROM departments"))
    await session.commit()

async def init_data():
    async with AsyncSessionLocal() as session:
        # Очищаем все таблицы
        await clear_all(session)

        # 1. Создаём типы нарядов
        duty_type_objs = []
        for name, desc, priority, people_per_day in DUTY_TYPES:
            dt = DutyType(name=name, description=desc, priority=priority, people_per_day=people_per_day)
            session.add(dt)
            duty_type_objs.append(dt)
        await session.commit()
        await session.refresh(duty_type_objs[0])
        await session.refresh(duty_type_objs[1])

        # 2. Создаём крупные подразделения (папки)
        major_depts = {}
        for major_name in MAJOR_DEPARTMENTS:
            major = Department(name=major_name, description=f"Крупное подразделение {major_name}")
            session.add(major)
            await session.flush()  # Получить id
            major_depts[major_name] = major
        await session.commit()

        # 3. Создаём малые подразделения (вложенные в крупные)
        minor_depts = []
        for major_name, minors in MINOR_DEPARTMENTS.items():
            major = major_depts[major_name]
            for minor_name in minors:
                minor = Department(
                    name=f"{major_name}_{minor_name}", 
                    description=f"{minor_name} в {major_name}", 
                    parent_id=major.id
                )
                session.add(minor)
                await session.flush()
                minor_depts.append(minor)
        await session.commit()

        # 4. Создаём сотрудников только в малых подразделениях
        for minor in minor_depts:
            for i in range(1, 21):  # 20 сотрудников в каждом малом подразделении
                emp = Employee(
                    first_name=f"Имя{i}",
                    last_name=f"Фамилия{i}",
                    middle_name=f"Отчество{i}",
                    position="Сотрудник",
                    department_id=minor.id,
                    is_active=True
                )
                session.add(emp)
                await session.flush()
                # Назначаем 2 типа наряда каждому сотруднику
                for dt in duty_type_objs:
                    edt = EmployeeDutyType(employee_id=emp.id, duty_type_id=dt.id, is_active=True)
                    session.add(edt)
        await session.commit()
        
        print("Тестовые данные успешно инициализированы!")
        print(f"Создано крупных подразделений: {len(MAJOR_DEPARTMENTS)}")
        print(f"Создано малых подразделений: {len(minor_depts)}")
        print(f"Создано сотрудников: {len(minor_depts) * 20}")

if __name__ == "__main__":
    asyncio.run(init_data()) 