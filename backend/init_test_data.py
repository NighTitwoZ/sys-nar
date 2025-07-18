import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from models.models import Base, Department, Employee, DutyType, EmployeeDutyType
from sqlalchemy import text
from database import get_db
import random

# --- Списки для генерации ФИО ---
FIRST_NAMES = [
    "Александр", "Алексей", "Андрей", "Артем", "Владимир", "Дмитрий", "Евгений", "Иван", 
    "Максим", "Михаил", "Николай", "Павел", "Сергей", "Юрий", "Анатолий", "Борис",
    "Василий", "Виктор", "Геннадий", "Георгий", "Даниил", "Егор", "Захар", "Игорь",
    "Кирилл", "Константин", "Леонид", "Матвей", "Олег", "Петр", "Роман", "Степан",
    "Тимофей", "Федор", "Ярослав", "Анна", "Елена", "Ирина", "Мария", "Наталья",
    "Ольга", "Татьяна", "Юлия", "Ангелина", "Валентина", "Вера", "Галина", "Дарья",
    "Екатерина", "Жанна", "Зинаида", "Инна", "Кристина", "Лариса", "Любовь", "Маргарита",
    "Надежда", "Полина", "Раиса", "Светлана", "Тамара", "Ульяна", "Фаина", "Эльвира"
]

LAST_NAMES = [
    "Иванов", "Смирнов", "Кузнецов", "Попов", "Васильев", "Петров", "Соколов", "Михайлов",
    "Новиков", "Федоров", "Морозов", "Волков", "Алексеев", "Лебедев", "Семенов", "Егоров",
    "Павлов", "Козлов", "Степанов", "Николаев", "Орлов", "Андреев", "Макаров", "Никитин",
    "Захаров", "Зайцев", "Соловьев", "Борисов", "Яковлев", "Григорьев", "Романов", "Воробьев",
    "Сергеев", "Кузьмин", "Фролов", "Александров", "Дмитриев", "Королев", "Гусев", "Киселев",
    "Ильин", "Максимов", "Поляков", "Сорокин", "Виноградов", "Ковалев", "Белов", "Медведев",
    "Антонов", "Тарасов", "Жуков", "Баранов", "Филиппов", "Комаров", "Давыдов", "Беляев",
    "Герасимов", "Богданов", "Осипов", "Сидоров", "Матвеев", "Титов", "Марков", "Миронов",
    "Крылов", "Куликов", "Карпов", "Власов", "Мельников", "Денисов", "Гаврилов", "Тихонов",
    "Казаков", "Афанасьев", "Данилов", "Савельев", "Тимофеев", "Фомин", "Чернов", "Абрамов",
    "Мартынов", "Ефимов", "Федотов", "Щербаков", "Назаров", "Калинин", "Исаев", "Чернышев",
    "Быков", "Маслов", "Родионов", "Коновалов", "Лазарев", "Воронин", "Климов", "Филатов",
    "Пономарев", "Голубев", "Кудрявцев", "Прохоров", "Наумов", "Потапов", "Журавлев", "Овчинников",
    "Трофимов", "Леонов", "Соболев", "Ермаков", "Колесников", "Гончаров", "Емельянов", "Никифоров",
    "Грачев", "Котов", "Гришин", "Ефремов", "Архипов", "Громов", "Кириллов", "Малышев",
    "Панов", "Моисеев", "Румянцев", "Акимов", "Кондратьев", "Бирюков", "Горбунов", "Анисимов",
    "Еремин", "Тихомиров", "Галкин", "Лукьянов", "Михеев", "Скворцов", "Юдин", "Белоусов",
    "Нестеров", "Симонов", "Прокофьев", "Харитонов", "Князев", "Цветков", "Левин", "Митрофанов",
    "Воронов", "Аксенов", "Софронов", "Мальцев", "Логинов", "Горшков", "Савин", "Краснов",
    "Майоров", "Демидов", "Елисеев", "Рыбаков", "Сафонов", "Плотников", "Демин", "Хохлов",
    "Фадеев", "Молчанов", "Игнатов", "Литвинов", "Ершов", "Ушаков", "Дементьев", "Рябов",
    "Мухин", "Калашников", "Леонтьев", "Лобанов", "Кузин", "Корнеев", "Евдокимов", "Бородин",
    "Платонов", "Некрасов", "Балашов", "Бобров", "Жданов", "Блинов", "Игнатьев", "Коротков",
    "Муравьев", "Крюков", "Беляков", "Богомолов", "Дроздов", "Лаврентьев", "Зуев", "Петухов",
    "Ларин", "Никулин", "Серов", "Терентьев", "Зотов", "Устинов", "Фокин", "Самойлов",
    "Константинов", "Савин", "Григорьев", "Романов", "Воробьев", "Сергеев", "Кузьмин", "Фролов"
]

MIDDLE_NAMES = [
    "Александрович", "Алексеевич", "Андреевич", "Артемович", "Владимирович", "Дмитриевич", 
    "Евгеньевич", "Иванович", "Максимович", "Михайлович", "Николаевич", "Павлович", 
    "Сергеевич", "Юрьевич", "Анатольевич", "Борисович", "Васильевич", "Викторович",
    "Геннадьевич", "Георгиевич", "Данилович", "Егорович", "Захарович", "Игоревич",
    "Кириллович", "Константинович", "Леонидович", "Матвеевич", "Олегович", "Петрович",
    "Романович", "Степанович", "Тимофеевич", "Федорович", "Ярославович", "Александровна",
    "Алексеевна", "Андреевна", "Артемовна", "Владимировна", "Дмитриевна", "Евгеньевна",
    "Ивановна", "Максимовна", "Михайловна", "Николаевна", "Павловна", "Сергеевна",
    "Юрьевна", "Анатольевна", "Борисовна", "Васильевна", "Викторовна", "Геннадьевна",
    "Георгиевна", "Даниловна", "Егоровна", "Захаровна", "Игоревна", "Кирилловна",
    "Константиновна", "Леонидовна", "Матвеевна", "Олеговна", "Петровна", "Романовна",
    "Степановна", "Тимофеевна", "Федоровна", "Ярославовна"
]

# --- Структура подразделений ---
FACULTIES = [
    "1фак", "2фак", "3фак", "4фак", "5фак", "6фак", "7фак", "8фак", "9фак", "Сфак", "Академ-каф"
]

DEPARTMENTS_BY_FACULTY = {
    "1фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "1каф", "2каф", "3каф", "Управление"],
    "2фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "1каф", "2каф", "3каф", "Управление"],
    "3фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "1каф", "2каф", "3каф", "Управление"],
    "4фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "1каф", "2каф", "3каф", "Управление"],
    "5фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "1каф", "2каф", "3каф", "Управление"],
    "6фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "1каф", "2каф", "3каф", "Управление"],
    "7фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "1каф", "2каф", "3каф", "Управление"],
    "8фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "1каф", "2каф", "3каф", "Управление"],
    "9фак": ["1курс", "2курс", "3курс", "4курс", "5курс", "1каф", "2каф", "3каф", "Управление"],
    "Сфак": ["1курс", "2курс", "3курс", "4курс", "5курс", "1каф", "2каф", "3каф", "Управление"],
    "Академ-каф": ["1каф", "2каф", "3каф", "4каф", "5каф"],
}

# --- Типы нарядов ---
DUTY_TYPES_DEPARTMENT = [
    ("Дежурный по подразделению", "Дежурство внутри подразделения", 1, 2, "department"),
    ("Ответственный по подразделению", "Ответственный дежурный по подразделению", 2, 1, "department"),
    ("Контрольный по подразделению", "Контрольный дежурный по подразделению", 3, 1, "department"),
    ("Оперативный по подразделению", "Оперативный дежурный по подразделению", 4, 1, "department"),
]

DUTY_TYPES_ACADEMIC = [
    ("Академический дежурный", "Дежурство академического характера", 1, 2, "academic"),
    ("Академический ответственный", "Ответственный академический дежурный", 2, 1, "academic"),
]

async def clear_all(session: AsyncSession):
    """Очищает все таблицы базы данных"""
    print("Очищаем базу данных...")
    await session.execute(text("DELETE FROM employee_duty_types"))
    await session.execute(text("DELETE FROM employees"))
    await session.execute(text("DELETE FROM duty_types"))
    await session.execute(text("DELETE FROM departments"))
    await session.commit()
    print("База данных очищена")

async def create_duty_types(session: AsyncSession):
    """Создает типы нарядов"""
    print("Создаем типы нарядов...")
    
    duty_types = []
    
    # Создаем типы нарядов по подразделениям
    for name, desc, priority, people_per_day, category in DUTY_TYPES_DEPARTMENT:
        dt = DutyType(
            name=name, 
            description=desc, 
            priority=priority, 
            people_per_day=people_per_day,
            duty_category=category
        )
        session.add(dt)
        duty_types.append(dt)
    
    # Создаем академические типы нарядов
    for name, desc, priority, people_per_day, category in DUTY_TYPES_ACADEMIC:
        dt = DutyType(
            name=name, 
            description=desc, 
            priority=priority, 
            people_per_day=people_per_day,
            duty_category=category
        )
        session.add(dt)
        duty_types.append(dt)
    
    await session.commit()
    
    # Обновляем объекты для получения ID
    for dt in duty_types:
        await session.refresh(dt)
    
    print(f"Создано {len(duty_types)} типов нарядов")
    return duty_types

async def create_departments(session: AsyncSession):
    """Создает структуру подразделений"""
    print("Создаем структуру подразделений...")
    
    faculty_depts = {}
    all_departments = []
    
    # Создаем факультеты (крупные подразделения)
    for faculty_name in FACULTIES:
        faculty = Department(
            name=faculty_name, 
            description=f"Факультет {faculty_name}"
        )
        session.add(faculty)
        await session.flush()
        faculty_depts[faculty_name] = faculty
        all_departments.append(faculty)
    
    await session.commit()
    
    # Создаем подразделения внутри факультетов
    for faculty_name, dept_names in DEPARTMENTS_BY_FACULTY.items():
        faculty = faculty_depts[faculty_name]
        for dept_name in dept_names:
            department = Department(
                name=f"{faculty_name}_{dept_name}",
                description=f"{dept_name} факультета {faculty_name}",
                parent_id=faculty.id
            )
            session.add(department)
            await session.flush()
            all_departments.append(department)
    
    await session.commit()
    
    print(f"Создано {len(FACULTIES)} факультетов")
    print(f"Создано {len(all_departments) - len(FACULTIES)} подразделений")
    return all_departments

async def create_employees(session: AsyncSession, departments, duty_types):
    """Создает сотрудников и назначает им типы нарядов"""
    print("Создаем сотрудников...")
    
    # Получаем только подразделения (не факультеты)
    sub_departments = [dept for dept in departments if dept.parent_id is not None]
    
    employee_count = 0
    
    for department in sub_departments:
        print(f"Создаем сотрудников для подразделения {department.name}...")
        
        for i in range(1, 41):  # 40 сотрудников в каждом подразделении
            # Генерируем случайные ФИО
            first_name = random.choice(FIRST_NAMES)
            last_name = random.choice(LAST_NAMES)
            middle_name = random.choice(MIDDLE_NAMES)
            
            employee = Employee(
                first_name=first_name,
                last_name=last_name,
                middle_name=middle_name,
                position="Сотрудник",
                department_id=department.id,
                is_active=True
            )
            session.add(employee)
            await session.flush()
            
            # Назначаем типы нарядов
            # 4 типа наряда по подразделению
            for dt in duty_types[:4]:  # Первые 4 - по подразделению
                edt = EmployeeDutyType(
                    employee_id=employee.id, 
                    duty_type_id=dt.id, 
                    is_active=True
                )
                session.add(edt)
            
            # 2 академических типа наряда
            for dt in duty_types[4:]:  # Последние 2 - академические
                edt = EmployeeDutyType(
                    employee_id=employee.id, 
                    duty_type_id=dt.id, 
                    is_active=True
                )
                session.add(edt)
            
            employee_count += 1
        
        # Коммитим каждые 100 сотрудников для экономии памяти
        if employee_count % 100 == 0:
            await session.commit()
            print(f"Создано {employee_count} сотрудников...")
    
    await session.commit()
    print(f"Всего создано {employee_count} сотрудников")

async def init_data():
    """Основная функция инициализации данных"""
    async for session in get_db():
        try:
            # 1. Очищаем базу данных
            await clear_all(session)
            
            # 2. Создаем типы нарядов
            duty_types = await create_duty_types(session)
            
            # 3. Создаем структуру подразделений
            departments = await create_departments(session)
            
            # 4. Создаем сотрудников и назначаем типы нарядов
            await create_employees(session, departments, duty_types)
            
            print("\n=== ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА ===")
            print(f"Факультетов: {len(FACULTIES)}")
            print(f"Подразделений: {len(departments) - len(FACULTIES)}")
            print(f"Типов нарядов: {len(duty_types)}")
            print(f"Сотрудников: {len(departments) - len(FACULTIES)} * 40 = {(len(departments) - len(FACULTIES)) * 40}")
            print("База данных успешно заполнена!")
            break
            
        except Exception as e:
            print(f"Ошибка при инициализации: {e}")
            await session.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(init_data()) 