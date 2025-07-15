from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
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
    result = await db.execute(select(Department).where(Department.parent_id == None))
    departments = result.scalars().all()
    return departments

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
    result = await db.execute(select(Department).where(Department.parent_id == department_id))
    subdepartments = result.scalars().all()
    return subdepartments

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
    
    for key, value in department.model_dump().items():
        setattr(db_department, key, value)
    
    await db.commit()
    await db.refresh(db_department)
    return db_department

@router.delete("/{department_id}")
async def delete_department(department_id: int, db: AsyncSession = Depends(get_db)):
    """Удалить подразделение"""
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    
    if not department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    
    await db.delete(department)
    await db.commit()
    return {"message": "Подразделение удалено"} 