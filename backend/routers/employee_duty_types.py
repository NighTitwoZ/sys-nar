from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.models import EmployeeDutyType, Employee, DutyType

router = APIRouter()

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