from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.models import EmployeeDutyType, Employee, DutyType
from typing import List
from pydantic import BaseModel

router = APIRouter()

class EmployeeDutyTypeResponse(BaseModel):
    id: int
    employee_id: int
    duty_type_id: int
    is_active: bool
    
    class Config:
        from_attributes = True

class EmployeeDutyTypeUpdate(BaseModel):
    is_active: bool

@router.get("/employee/{employee_id}", response_model=List[EmployeeDutyTypeResponse])
async def get_employee_duty_types(employee_id: int, db: AsyncSession = Depends(get_db)):
    """Получить типы нарядов сотрудника"""
    # Проверяем существование сотрудника
    employee_result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = employee_result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Получаем типы нарядов сотрудника
    result = await db.execute(
        select(EmployeeDutyType)
        .where(EmployeeDutyType.employee_id == employee_id)
    )
    employee_duty_types = result.scalars().all()
    
    return employee_duty_types

@router.put("/{employee_duty_type_id}", response_model=EmployeeDutyTypeResponse)
async def update_employee_duty_type(
    employee_duty_type_id: int, 
    update_data: EmployeeDutyTypeUpdate, 
    db: AsyncSession = Depends(get_db)
):
    """Обновить связь сотрудника с типом наряда"""
    result = await db.execute(select(EmployeeDutyType).where(EmployeeDutyType.id == employee_duty_type_id))
    employee_duty_type = result.scalar_one_or_none()
    
    if not employee_duty_type:
        raise HTTPException(status_code=404, detail="Связь не найдена")
    
    # Обновляем поле is_active
    employee_duty_type.is_active = update_data.is_active
    
    await db.commit()
    await db.refresh(employee_duty_type)
    
    return employee_duty_type

@router.delete("/{employee_duty_type_id}")
async def delete_employee_duty_type(employee_duty_type_id: int, db: AsyncSession = Depends(get_db)):
    """Удалить связь сотрудника с типом наряда"""
    result = await db.execute(select(EmployeeDutyType).where(EmployeeDutyType.id == employee_duty_type_id))
    employee_duty_type = result.scalar_one_or_none()
    
    if not employee_duty_type:
        raise HTTPException(status_code=404, detail="Связь не найдена")
    
    await db.delete(employee_duty_type)
    await db.commit()
    return {"message": "Связь удалена"} 