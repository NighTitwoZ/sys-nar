from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from database import get_db
from models.models import DutyType, EmployeeDutyType, Employee
from pydantic import BaseModel

router = APIRouter()

class DutyTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duty_category: Optional[str] = "academic"
    people_per_day: Optional[int] = 1
    days_duration: Optional[int] = 1
    priority: Optional[int] = 1

class DutyTypeCreateForDepartment(BaseModel):
    name: str
    description: Optional[str] = None
    duty_category: str = "academic"
    people_per_day: int = 1
    days_duration: int = 1
    department_id: int

class DutyTypeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    duty_category: str
    people_per_day: int
    days_duration: int
    priority: int
    
    class Config:
        from_attributes = True

class DutyTypeWithDepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    duty_category: str
    people_per_day: int
    days_duration: int
    department_name: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[DutyTypeResponse])
async def get_duty_types(db: AsyncSession = Depends(get_db)):
    """Получить список всех типов нарядов"""
    result = await db.execute(select(DutyType).order_by(DutyType.name))
    duty_types = result.scalars().all()
    return duty_types

@router.get("/unique", response_model=List[DutyTypeResponse])
async def get_unique_duty_types(db: AsyncSession = Depends(get_db)):
    """Получить список уникальных типов нарядов (без дублирования)"""
    result = await db.execute(
        select(DutyType)
        .distinct()
        .order_by(DutyType.name)
    )
    duty_types = result.scalars().all()
    return duty_types

@router.get("/{duty_type_id}", response_model=DutyTypeResponse)
async def get_duty_type(duty_type_id: int, db: AsyncSession = Depends(get_db)):
    """Получить конкретный тип наряда по ID"""
    result = await db.execute(select(DutyType).where(DutyType.id == duty_type_id))
    duty_type = result.scalar_one_or_none()
    
    if not duty_type:
        raise HTTPException(status_code=404, detail="Тип наряда не найден")
    
    return duty_type

@router.get("/department/{department_id}", response_model=List[DutyTypeResponse])
async def get_duty_types_by_department(department_id: int, db: AsyncSession = Depends(get_db)):
    """Получить типы нарядов для конкретного подразделения"""
    # Получаем всех сотрудников подразделения
    from models.models import Employee, EmployeeDutyType
    
    # Получаем сотрудников подразделения
    employees_result = await db.execute(
        select(Employee).where(Employee.department_id == department_id)
    )
    employees = employees_result.scalars().all()
    
    if not employees:
        return []
    
    # Получаем ID сотрудников
    employee_ids = [emp.id for emp in employees]
    
    # Получаем типы нарядов, назначенные сотрудникам этого подразделения
    duty_types_result = await db.execute(
        select(DutyType)
        .join(EmployeeDutyType, DutyType.id == EmployeeDutyType.duty_type_id)
        .where(EmployeeDutyType.employee_id.in_(employee_ids))
        .where(EmployeeDutyType.is_active == True)
        .distinct()
        .order_by(DutyType.name)
    )
    duty_types = duty_types_result.scalars().all()
    
    return duty_types

@router.post("/", response_model=DutyTypeResponse)
async def create_duty_type(duty_type: DutyTypeCreate, db: AsyncSession = Depends(get_db)):
    db_duty_type = DutyType(
        name=duty_type.name,
        description=duty_type.description,
        duty_category=duty_type.duty_category,
        people_per_day=duty_type.people_per_day,
        days_duration=duty_type.days_duration,
        priority=duty_type.priority
    )
    db.add(db_duty_type)
    await db.commit()
    await db.refresh(db_duty_type)
    return db_duty_type

@router.post("/department", response_model=DutyTypeResponse)
async def create_duty_type_for_department(duty_type: DutyTypeCreateForDepartment, db: AsyncSession = Depends(get_db)):
    """Создать новый тип наряда и назначить его всем сотрудникам подразделения"""
    # Проверяем существование подразделения
    department_result = await db.execute(
        select(Employee).where(Employee.department_id == duty_type.department_id)
    )
    employees = department_result.scalars().all()
    
    if not employees:
        raise HTTPException(status_code=404, detail="Подразделение не найдено или в нем нет сотрудников")
    
    # Для нарядов "По подразделению" всегда создаем новый наряд для подразделения
    if duty_type.duty_category == 'department':
        # Проверяем, существует ли уже такой наряд в этом подразделении
        existing_duty_type_result = await db.execute(
            select(DutyType)
            .join(EmployeeDutyType, DutyType.id == EmployeeDutyType.duty_type_id)
            .join(Employee, EmployeeDutyType.employee_id == Employee.id)
            .where(
                DutyType.name == duty_type.name,
                DutyType.duty_category == 'department',
                Employee.department_id == duty_type.department_id
            )
        )
        existing_duty_type = existing_duty_type_result.scalar_one_or_none()
        
        if existing_duty_type:
            # Если наряд уже существует в этом подразделении, используем его
            db_duty_type = existing_duty_type
        else:
            # Создаем новый наряд для подразделения (всегда новый, независимо от других подразделений)
            db_duty_type = DutyType(
                name=duty_type.name,
                description=duty_type.description,
                duty_category=duty_type.duty_category,
                people_per_day=duty_type.people_per_day,
                days_duration=duty_type.days_duration
            )
            db.add(db_duty_type)
            await db.commit()
            await db.refresh(db_duty_type)
    else:
        # Для академических нарядов проверяем только по названию
        existing_duty_type_result = await db.execute(
            select(DutyType).where(DutyType.name == duty_type.name)
        )
        existing_duty_type = existing_duty_type_result.scalar_one_or_none()
        
        if existing_duty_type:
            # Если тип наряда уже существует, используем его
            db_duty_type = existing_duty_type
        else:
            # Создаем новый тип наряда
            db_duty_type = DutyType(
                name=duty_type.name,
                description=duty_type.description,
                duty_category=duty_type.duty_category,
                people_per_day=duty_type.people_per_day,
                days_duration=duty_type.days_duration
            )
            db.add(db_duty_type)
            await db.commit()
            await db.refresh(db_duty_type)
    
    # Проверяем, не назначен ли уже этот тип наряда сотрудникам подразделения
    employee_ids = [emp.id for emp in employees]
    existing_assignments_result = await db.execute(
        select(EmployeeDutyType).where(
            EmployeeDutyType.duty_type_id == db_duty_type.id,
            EmployeeDutyType.employee_id.in_(employee_ids)
        )
    )
    existing_assignments = existing_assignments_result.scalars().all()
    
    # Создаем множество ID сотрудников, которым уже назначен этот тип наряда
    assigned_employee_ids = {assignment.employee_id for assignment in existing_assignments}
    
    # Назначаем тип наряда только тем сотрудникам, которым он еще не назначен
    for employee in employees:
        if employee.id not in assigned_employee_ids:
            employee_duty_type = EmployeeDutyType(
                employee_id=employee.id,
                duty_type_id=db_duty_type.id,
                is_active=True
            )
            db.add(employee_duty_type)
    
    await db.commit()
    return db_duty_type

@router.put("/{duty_type_id}", response_model=DutyTypeResponse)
async def update_duty_type(duty_type_id: int, duty_type: DutyTypeCreate, db: AsyncSession = Depends(get_db)):
    """Обновить тип наряда"""
    result = await db.execute(select(DutyType).where(DutyType.id == duty_type_id))
    db_duty_type = result.scalar_one_or_none()
    
    if not db_duty_type:
        raise HTTPException(status_code=404, detail="Тип наряда не найден")
    
    # Обновляем поля
    for field, value in duty_type.model_dump().items():
        setattr(db_duty_type, field, value)
    
    await db.commit()
    await db.refresh(db_duty_type)
    return db_duty_type

@router.delete("/{duty_type_id}")
async def delete_duty_type(duty_type_id: int, db: AsyncSession = Depends(get_db)):
    """Удалить тип наряда"""
    result = await db.execute(select(DutyType).where(DutyType.id == duty_type_id))
    duty_type = result.scalar_one_or_none()
    
    if not duty_type:
        raise HTTPException(status_code=404, detail="Тип наряда не найден")
    
    # Проверяем, не используется ли тип наряда
    emp_duty_result = await db.execute(
        select(EmployeeDutyType).where(EmployeeDutyType.duty_type_id == duty_type_id)
    )
    emp_duty_types = emp_duty_result.scalars().all()
    
    if emp_duty_types:
        # Удаляем все связи с сотрудниками
        for emp_duty_type in emp_duty_types:
            await db.delete(emp_duty_type)
        await db.commit()
    
    # Удаляем сам тип наряда
    await db.delete(duty_type)
    await db.commit()
    return {"message": "Тип наряда удален"} 

@router.delete("/{duty_type_id}/department/{department_id}")
async def remove_duty_type_from_department(duty_type_id: int, department_id: int, db: AsyncSession = Depends(get_db)):
    """Удалить тип наряда только из конкретного подразделения"""
    # Проверяем существование типа наряда
    result = await db.execute(select(DutyType).where(DutyType.id == duty_type_id))
    duty_type = result.scalar_one_or_none()
    
    if not duty_type:
        raise HTTPException(status_code=404, detail="Тип наряда не найден")
    
    # Получаем всех сотрудников подразделения
    employees_result = await db.execute(
        select(Employee).where(Employee.department_id == department_id)
    )
    employees = employees_result.scalars().all()
    
    if not employees:
        raise HTTPException(status_code=404, detail="Подразделение не найдено или в нем нет сотрудников")
    
    # Получаем ID сотрудников подразделения
    employee_ids = [emp.id for emp in employees]
    
    # Удаляем связи типа наряда только с сотрудниками этого подразделения
    emp_duty_result = await db.execute(
        select(EmployeeDutyType).where(
            EmployeeDutyType.duty_type_id == duty_type_id,
            EmployeeDutyType.employee_id.in_(employee_ids)
        )
    )
    emp_duty_types = emp_duty_result.scalars().all()
    
    if emp_duty_types:
        for emp_duty_type in emp_duty_types:
            await db.delete(emp_duty_type)
        await db.commit()
        return {"message": f"Тип наряда '{duty_type.name}' удален из подразделения"}
    else:
        raise HTTPException(status_code=404, detail="Тип наряда не назначен сотрудникам этого подразделения") 

@router.get("/all-with-departments", response_model=List[DutyTypeWithDepartmentResponse])
async def get_all_duty_types_with_departments(db: AsyncSession = Depends(get_db)):
    """Получить все типы нарядов с информацией о подразделениях"""
    # Получаем все типы нарядов с информацией о подразделениях
    result = await db.execute(
        select(
            DutyType.id,
            DutyType.name,
            DutyType.description,
            DutyType.duty_category,
            DutyType.people_per_day,
            DutyType.days_duration,
            Employee.department_id
        )
        .join(EmployeeDutyType, DutyType.id == EmployeeDutyType.duty_type_id)
        .join(Employee, EmployeeDutyType.employee_id == Employee.id)
        .where(EmployeeDutyType.is_active == True)
        .distinct()
    )
    
    duty_types_with_dept = result.all()
    
    # Получаем названия подразделений
    department_ids = list(set([row.department_id for row in duty_types_with_dept]))
    departments_result = await db.execute(
        select(Employee.id, Employee.department_id, Employee.department_id.label('dept_id'))
        .where(Employee.department_id.in_(department_ids))
    )
    
    # Создаем словарь для маппинга department_id -> department_name
    from models.models import Department
    dept_result = await db.execute(
        select(Department.id, Department.name)
        .where(Department.id.in_(department_ids))
    )
    dept_mapping = {dept.id: dept.name for dept in dept_result.all()}
    
    # Формируем результат
    response = []
    for row in duty_types_with_dept:
        dept_name = dept_mapping.get(row.department_id, "Неизвестное подразделение")
        response.append({
            "id": row.id,
            "name": row.name,
            "description": row.description,
            "duty_category": row.duty_category,
            "people_per_day": row.people_per_day,
            "department_name": dept_name
        })
    
    return response

@router.get("/structure/{structure_id}/all-with-departments", response_model=List[DutyTypeWithDepartmentResponse])
async def get_duty_types_by_structure_with_departments(structure_id: int, db: AsyncSession = Depends(get_db)):
    """Получить все типы нарядов структуры с информацией о подразделениях"""
    from models.models import Department
    
    # Получаем все дочерние подразделения структуры
    subdepartments_result = await db.execute(
        select(Department).where(Department.parent_id == structure_id)
    )
    subdepartments = subdepartments_result.scalars().all()
    
    if not subdepartments:
        return []
    
    # Получаем ID всех дочерних подразделений
    subdepartment_ids = [dept.id for dept in subdepartments]
    
    # Получаем всех сотрудников из дочерних подразделений
    employees_result = await db.execute(
        select(Employee).where(Employee.department_id.in_(subdepartment_ids))
    )
    structure_employees = employees_result.scalars().all()
    
    if not structure_employees:
        return []
    
    # Получаем ID сотрудников структуры
    structure_employee_ids = [emp.id for emp in structure_employees]
    
    # Получаем типы нарядов с информацией о подразделениях для структуры
    result = await db.execute(
        select(
            DutyType.id,
            DutyType.name,
            DutyType.description,
            DutyType.duty_category,
            DutyType.people_per_day,
            DutyType.days_duration,
            Employee.department_id
        )
        .join(EmployeeDutyType, DutyType.id == EmployeeDutyType.duty_type_id)
        .join(Employee, EmployeeDutyType.employee_id == Employee.id)
        .where(EmployeeDutyType.employee_id.in_(structure_employee_ids))
        .where(EmployeeDutyType.is_active == True)
        .distinct()
        .order_by(DutyType.name)
    )
    
    duty_types_with_dept = result.all()
    
    # Получаем названия подразделений
    department_ids = list(set([row.department_id for row in duty_types_with_dept]))
    dept_result = await db.execute(
        select(Department.id, Department.name)
        .where(Department.id.in_(department_ids))
    )
    dept_mapping = {dept.id: dept.name for dept in dept_result.all()}
    
    # Формируем результат
    response = []
    for row in duty_types_with_dept:
        dept_name = dept_mapping.get(row.department_id, "Неизвестное подразделение")
        response.append({
            "id": row.id,
            "name": row.name,
            "description": row.description,
            "duty_category": row.duty_category,
            "people_per_day": row.people_per_day,
            "department_name": dept_name
        })
    
    return response

@router.get("/structure/{structure_id}/all", response_model=List[DutyTypeWithDepartmentResponse])
async def get_all_duty_types_by_structure(structure_id: int, db: AsyncSession = Depends(get_db)):
    """Получить все типы нарядов, которые есть в подразделениях структуры (включая не назначенные сотрудникам)"""
    from models.models import Department
    
    # Получаем все дочерние подразделения структуры
    subdepartments_result = await db.execute(
        select(Department).where(Department.parent_id == structure_id)
    )
    subdepartments = subdepartments_result.scalars().all()
    
    if not subdepartments:
        return []
    
    # Получаем ID всех дочерних подразделений
    subdepartment_ids = [dept.id for dept in subdepartments]
    
    # Получаем все типы нарядов, которые назначены сотрудникам подразделений структуры
    result = await db.execute(
        select(
            DutyType.id,
            DutyType.name,
            DutyType.description,
            DutyType.duty_category,
            DutyType.people_per_day,
            DutyType.days_duration,
            Employee.department_id
        )
        .join(EmployeeDutyType, DutyType.id == EmployeeDutyType.duty_type_id)
        .join(Employee, EmployeeDutyType.employee_id == Employee.id)
        .where(Employee.department_id.in_(subdepartment_ids))
        .where(EmployeeDutyType.is_active == True)
        .distinct()
        .order_by(DutyType.name)
    )
    
    duty_types_with_dept = result.all()
    
    # Получаем названия подразделений
    department_ids = list(set([row.department_id for row in duty_types_with_dept]))
    dept_result = await db.execute(
        select(Department.id, Department.name)
        .where(Department.id.in_(department_ids))
    )
    dept_mapping = {dept.id: dept.name for dept in dept_result.all()}
    
    # Формируем результат
    response = []
    for row in duty_types_with_dept:
        dept_name = dept_mapping.get(row.department_id, "Неизвестное подразделение")
        response.append({
            "id": row.id,
            "name": row.name,
            "description": row.description,
            "duty_category": row.duty_category,
            "people_per_day": row.people_per_day,
            "department_name": dept_name
        })
    
    return response 