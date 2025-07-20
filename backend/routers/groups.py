from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from database import get_db
from models.models import Group, Department, Employee
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    department_id: int

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class GroupResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    department_id: int
    department_name: str
    employee_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.post("/", response_model=GroupResponse)
async def create_group(
    group: GroupCreate,
    db: AsyncSession = Depends(get_db)
):
    """Создать новую группу"""
    
    # Проверяем, что подразделение существует
    dept_result = await db.execute(select(Department).where(Department.id == group.department_id))
    department = dept_result.scalar_one_or_none()
    
    if not department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    
    # Создаем группу
    new_group = Group(
        name=group.name,
        description=group.description,
        department_id=group.department_id
    )
    
    db.add(new_group)
    await db.commit()
    await db.refresh(new_group)
    
    # Получаем количество сотрудников в группе
    employee_count_result = await db.execute(
        select(func.count(Employee.id)).where(Employee.group_id == new_group.id)
    )
    employee_count = employee_count_result.scalar() or 0
    
    return GroupResponse(
        id=new_group.id,
        name=new_group.name,
        description=new_group.description,
        department_id=new_group.department_id,
        department_name=department.name,
        employee_count=employee_count,
        created_at=new_group.created_at,
        updated_at=new_group.updated_at
    )

@router.get("/", response_model=List[GroupResponse])
async def get_groups(
    department_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db)
):
    """Получить список групп"""
    
    query = (
        select(Group, Department, func.count(Employee.id).label('employee_count'))
        .join(Department, Group.department_id == Department.id)
        .outerjoin(Employee, Group.id == Employee.group_id)
    )
    
    if department_id:
        query = query.where(Group.department_id == department_id)
    
    query = query.group_by(Group.id, Department.id)
    query = query.order_by(Group.name)
    
    result = await db.execute(query)
    groups_data = result.all()
    
    return [
        GroupResponse(
            id=group.id,
            name=group.name,
            description=group.description,
            department_id=group.department_id,
            department_name=department.name,
            employee_count=employee_count,
            created_at=group.created_at,
            updated_at=group.updated_at
        )
        for group, department, employee_count in groups_data
    ]

@router.get("/department/{department_id}", response_model=List[GroupResponse])
async def get_groups_by_department(
    department_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить группы конкретного подразделения"""
    
    # Проверяем существование подразделения
    dept_result = await db.execute(select(Department).where(Department.id == department_id))
    department = dept_result.scalar_one_or_none()
    
    if not department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    
    query = (
        select(Group, Department, func.count(Employee.id).label('employee_count'))
        .join(Department, Group.department_id == Department.id)
        .outerjoin(Employee, Group.id == Employee.group_id)
        .where(Group.department_id == department_id)
        .group_by(Group.id, Department.id)
        .order_by(Group.name)
    )
    
    result = await db.execute(query)
    groups_data = result.all()
    
    return [
        GroupResponse(
            id=group.id,
            name=group.name,
            description=group.description,
            department_id=group.department_id,
            department_name=department.name,
            employee_count=employee_count,
            created_at=group.created_at,
            updated_at=group.updated_at
        )
        for group, department, employee_count in groups_data
    ]

@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить группу по ID"""
    
    result = await db.execute(
        select(Group, Department, func.count(Employee.id).label('employee_count'))
        .join(Department, Group.department_id == Department.id)
        .outerjoin(Employee, Group.id == Employee.group_id)
        .where(Group.id == group_id)
        .group_by(Group.id, Department.id)
    )
    
    group_data = result.first()
    
    if not group_data:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    
    group, department, employee_count = group_data
    
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        department_id=group.department_id,
        department_name=department.name,
        employee_count=employee_count,
        created_at=group.created_at,
        updated_at=group.updated_at
    )

@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: int,
    group_update: GroupUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Обновить группу"""
    
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    
    # Обновляем поля
    if group_update.name is not None:
        group.name = group_update.name
    if group_update.description is not None:
        group.description = group_update.description
    
    await db.commit()
    await db.refresh(group)
    
    # Получаем информацию о подразделении и количестве сотрудников
    dept_result = await db.execute(select(Department).where(Department.id == group.department_id))
    department = dept_result.scalar_one_or_none()
    
    employee_count_result = await db.execute(
        select(func.count(Employee.id)).where(Employee.group_id == group.id)
    )
    employee_count = employee_count_result.scalar() or 0
    
    return GroupResponse(
        id=group.id,
        name=group.name,
        description=group.description,
        department_id=group.department_id,
        department_name=department.name if department else "",
        employee_count=employee_count,
        created_at=group.created_at,
        updated_at=group.updated_at
    )

@router.delete("/{group_id}")
async def delete_group(
    group_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Удалить группу"""
    
    result = await db.execute(select(Group).where(Group.id == group_id))
    group = result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    
    # Проверяем, есть ли сотрудники в группе
    employee_count_result = await db.execute(
        select(func.count(Employee.id)).where(Employee.group_id == group_id)
    )
    employee_count = employee_count_result.scalar() or 0
    
    if employee_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Нельзя удалить группу, в которой есть сотрудники ({employee_count} чел.)"
        )
    
    await db.delete(group)
    await db.commit()
    
    return {"message": "Группа успешно удалена"}

@router.get("/{group_id}/employees")
async def get_group_employees(
    group_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить сотрудников группы"""
    
    # Проверяем, что группа существует
    group_result = await db.execute(select(Group).where(Group.id == group_id))
    group = group_result.scalar_one_or_none()
    
    if not group:
        raise HTTPException(status_code=404, detail="Группа не найдена")
    
    # Получаем сотрудников группы
    employees_result = await db.execute(
        select(Employee)
        .where(Employee.group_id == group_id)
        .order_by(Employee.last_name, Employee.first_name)
    )
    employees = employees_result.scalars().all()
    
    return [
        {
            "id": emp.id,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "middle_name": emp.middle_name,
            "position": emp.position,
            "status": emp.status,
            "is_active": emp.is_active
        }
        for emp in employees
    ] 