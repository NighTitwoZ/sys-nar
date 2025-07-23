from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List, Optional
from database import get_db
from models.models import Department
from pydantic import BaseModel

router = APIRouter()

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None

class DepartmentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[DepartmentResponse])
async def get_departments(db: AsyncSession = Depends(get_db)):
    """Получить список всех структур (крупных подразделений)"""
    result = await db.execute(select(Department).where(Department.parent_id == None).order_by(Department.name))
    departments = result.scalars().all()
    return departments

@router.get("/with-stats", response_model=List[dict])
async def get_departments_with_stats(db: AsyncSession = Depends(get_db)):
    """Получить список всех структур с статистикой"""
    from models.models import Employee, EmployeeDutyType, DutyType
    from sqlalchemy import func
    
    # Получаем все структуры
    result = await db.execute(select(Department).where(Department.parent_id == None).order_by(Department.name))
    structures = result.scalars().all()
    
    response = []
    for structure in structures:
        # Получаем все дочерние подразделения структуры
        subdepts_result = await db.execute(
            select(Department).where(Department.parent_id == structure.id)
        )
        subdepartments = subdepts_result.scalars().all()
        
        # Получаем ID всех дочерних подразделений
        subdepartment_ids = [dept.id for dept in subdepartments]
        
        # Подсчитываем количество сотрудников в структуре
        employees_count = 0
        status_stats = {}
        if subdepartment_ids:
            emp_result = await db.execute(
                select(func.count(Employee.id))
                .where(Employee.department_id.in_(subdepartment_ids))
                .where(Employee.is_active == True)
            )
            employees_count = emp_result.scalar() or 0
            
            # Подсчитываем статистику по статусам для всей структуры
            status_result = await db.execute(
                select(Employee.status, func.count(Employee.id))
                .where(Employee.department_id.in_(subdepartment_ids))
                .where(Employee.is_active == True)
                .group_by(Employee.status)
            )
            status_stats = dict(status_result.all())
        
        # Подсчитываем количество типов нарядов в структуре
        duty_types_count = 0
        people_per_day_total = 0
        if subdepartment_ids:
            # Получаем статистику по каждому подразделению
            for subdept_id in subdepartment_ids:
                # Подсчитываем количество типов нарядов в подразделении
                subdept_duty_types_result = await db.execute(
                    select(DutyType.id, DutyType.people_per_day)
                    .join(EmployeeDutyType, DutyType.id == EmployeeDutyType.duty_type_id)
                    .join(Employee, EmployeeDutyType.employee_id == Employee.id)
                    .where(Employee.department_id == subdept_id)
                    .where(EmployeeDutyType.is_active == True)
                    .distinct()
                )
                subdept_duty_types_data = subdept_duty_types_result.all()
                duty_types_count += len(subdept_duty_types_data)
                people_per_day_total += sum(dt.people_per_day for dt in subdept_duty_types_data)
        
        response.append({
            "id": structure.id,
            "name": structure.name,
            "description": structure.description,
            "created_at": structure.created_at,
            "updated_at": structure.updated_at,
            "employees_count": employees_count,
            "employee_statuses": status_stats,
            "duty_types_count": duty_types_count,
            "people_per_day_total": people_per_day_total
        })
    
    return response

@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(department_id: int, db: AsyncSession = Depends(get_db)):
    """Получить подразделение по ID"""
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    
    if not department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    
    return department

@router.get("/{department_id}/subdepartments", response_model=List[DepartmentResponse])
async def get_subdepartments(department_id: int, db: AsyncSession = Depends(get_db)):
    """Получить подразделения конкретной структуры"""
    result = await db.execute(select(Department).where(Department.parent_id == department_id).order_by(Department.name))
    subdepartments = result.scalars().all()
    return subdepartments

@router.get("/{department_id}/subdepartments-with-stats", response_model=List[dict])
async def get_subdepartments_with_stats(department_id: int, db: AsyncSession = Depends(get_db)):
    """Получить подразделения конкретной структуры с статистикой"""
    from models.models import Employee, EmployeeDutyType, DutyType
    from sqlalchemy import func
    
    # Получаем подразделения структуры
    result = await db.execute(select(Department).where(Department.parent_id == department_id).order_by(Department.name))
    subdepartments = result.scalars().all()
    
    response = []
    for subdept in subdepartments:
        # Подсчитываем количество сотрудников в подразделении
        emp_result = await db.execute(
            select(func.count(Employee.id))
            .where(Employee.department_id == subdept.id)
            .where(Employee.is_active == True)
        )
        employees_count = emp_result.scalar() or 0
        
        # Подсчитываем статистику по статусам
        status_result = await db.execute(
            select(Employee.status, func.count(Employee.id))
            .where(Employee.department_id == subdept.id)
            .where(Employee.is_active == True)
            .group_by(Employee.status)
        )
        status_stats = dict(status_result.all())
        
        # Подсчитываем количество типов нарядов в подразделении
        duty_types_result = await db.execute(
            select(DutyType.id, DutyType.people_per_day)
            .join(EmployeeDutyType, DutyType.id == EmployeeDutyType.duty_type_id)
            .join(Employee, EmployeeDutyType.employee_id == Employee.id)
            .where(Employee.department_id == subdept.id)
            .where(EmployeeDutyType.is_active == True)
            .distinct()
        )
        duty_types_data = duty_types_result.all()
        duty_types_count = len(duty_types_data)
        people_per_day_total = sum(dt.people_per_day for dt in duty_types_data)
        
        response.append({
            "id": subdept.id,
            "name": subdept.name,
            "description": subdept.description,
            "created_at": subdept.created_at,
            "updated_at": subdept.updated_at,
            "employees_count": employees_count,
            "employee_statuses": status_stats,
            "duty_types_count": duty_types_count,
            "people_per_day_total": people_per_day_total
        })
    
    return response

@router.post("/", response_model=DepartmentResponse)
async def create_department(department: DepartmentCreate, db: AsyncSession = Depends(get_db)):
    """Создать новое подразделение"""
    db_department = Department(**department.model_dump())
    db.add(db_department)
    await db.commit()
    await db.refresh(db_department)
    return db_department

@router.put("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int, 
    department: DepartmentCreate, 
    db: AsyncSession = Depends(get_db)
):
    """Обновить подразделение"""
    result = await db.execute(select(Department).where(Department.id == department_id))
    db_department = result.scalar_one_or_none()
    
    if not db_department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    
    # Обновляем только name и description, сохраняем parent_id
    db_department.name = department.name
    db_department.description = department.description
    # parent_id остается неизменным
    
    await db.commit()
    await db.refresh(db_department)
    return db_department

@router.delete("/{department_id}")
async def delete_department(department_id: int, db: AsyncSession = Depends(get_db)):
    """Удалить подразделение"""
    from models.models import Employee, EmployeeDutyType
    
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    
    if not department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    
    # Если это структура (родительское подразделение), удаляем все дочерние подразделения
    if department.parent_id is None:
        # Получаем все дочерние подразделения
        subdepartments_result = await db.execute(
            select(Department).where(Department.parent_id == department_id)
        )
        subdepartments = subdepartments_result.scalars().all()
        
        # Удаляем сотрудников и их связи с типами нарядов для всех дочерних подразделений
        for subdept in subdepartments:
            # Получаем сотрудников подразделения
            employees_result = await db.execute(
                select(Employee).where(Employee.department_id == subdept.id)
            )
            employees = employees_result.scalars().all()
            
            # Удаляем связи сотрудников с типами нарядов
            for employee in employees:
                await db.execute(
                    text("DELETE FROM employee_duty_types WHERE employee_id = :employee_id"),
                    {"employee_id": employee.id}
                )
            
            # Удаляем сотрудников подразделения
            await db.execute(
                text("DELETE FROM employees WHERE department_id = :department_id"),
                {"department_id": subdept.id}
            )
            
            # Удаляем дочернее подразделение
            await db.delete(subdept)
    
    # Удаляем сотрудников и их связи с типами нарядов для самого подразделения
    employees_result = await db.execute(
        select(Employee).where(Employee.department_id == department_id)
    )
    employees = employees_result.scalars().all()
    
    # Удаляем связи сотрудников с типами нарядов
    for employee in employees:
        await db.execute(
            text("DELETE FROM employee_duty_types WHERE employee_id = :employee_id"),
            {"employee_id": employee.id}
        )
    
    # Удаляем сотрудников подразделения
    await db.execute(
        text("DELETE FROM employees WHERE department_id = :department_id"),
        {"department_id": department_id}
    )
    
    # Удаляем само подразделение
    await db.delete(department)
    await db.commit()
    
    return {"message": "Подразделение удалено"} 