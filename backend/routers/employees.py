from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from database import get_db
from models.models import Employee, Department, DutyType, EmployeeDutyType
from pydantic import BaseModel

router = APIRouter()

class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    position: str
    department_id: int
    status: str = "НЛ"

class EmployeeResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    position: str
    department_id: int
    is_active: bool
    status: str
    
    class Config:
        from_attributes = True

@router.get("/", response_model=List[EmployeeResponse])
async def get_employees(db: AsyncSession = Depends(get_db)):
    """Получить список всех сотрудников"""
    result = await db.execute(select(Employee).order_by(Employee.last_name, Employee.first_name))
    employees = result.scalars().all()
    return employees

@router.get("/department/{department_id}")
async def get_employees_by_department(department_id: int, db: AsyncSession = Depends(get_db)):
    """Получить сотрудников подразделения с их типами нарядов"""
    result = await db.execute(
        select(Employee)
        .where(Employee.department_id == department_id)
        .options(selectinload(Employee.employee_duty_types).selectinload(EmployeeDutyType.duty_type))
        .order_by(Employee.last_name, Employee.first_name)
    )
    employees = result.scalars().all()
    
    # Формируем ответ с типами нарядов
    employees_with_duty_types = []
    for employee in employees:
        employee_data = {
            'id': employee.id,
            'first_name': employee.first_name,
            'last_name': employee.last_name,
            'middle_name': employee.middle_name,
            'position': employee.position,
            'department_id': employee.department_id,
            'is_active': employee.is_active,
            'status': employee.status,
            'duty_types': []
        }
        
        # Добавляем типы нарядов
        for emp_duty_type in employee.employee_duty_types:
            if emp_duty_type.is_active and emp_duty_type.duty_type:
                employee_data['duty_types'].append({
                    'id': emp_duty_type.duty_type.id,
                    'name': emp_duty_type.duty_type.name,
                    'duty_category': emp_duty_type.duty_type.duty_category,
                    'people_per_day': emp_duty_type.duty_type.people_per_day
                })
        
        employees_with_duty_types.append(employee_data)
    
    return employees_with_duty_types

@router.get("/department/{department_id}/with-status")
async def get_employees_by_department_with_status(department_id: int, db: AsyncSession = Depends(get_db)):
    """Получить сотрудников подразделения только с их статусами для системы нарядов"""
    result = await db.execute(
        select(Employee)
        .where(Employee.department_id == department_id)
        .where(Employee.is_active == True)
        .order_by(Employee.last_name, Employee.first_name)
    )
    employees = result.scalars().all()
    
    # Формируем упрощенный ответ только со статусами
    employees_with_status = []
    for employee in employees:
        employee_data = {
            'id': employee.id,
            'first_name': employee.first_name,
            'last_name': employee.last_name,
            'middle_name': employee.middle_name,
            'position': employee.position,
            'status': employee.status
        }
        employees_with_status.append(employee_data)
    
    return employees_with_status

@router.post("/", response_model=EmployeeResponse)
async def create_employee(employee: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    """Создать нового сотрудника"""
    # Проверяем существование подразделения
    dept_result = await db.execute(
        select(Department).where(Department.id == employee.department_id)
    )
    if not dept_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    
    db_employee = Employee(**employee.model_dump())
    db.add(db_employee)
    await db.commit()
    await db.refresh(db_employee)
    return db_employee

@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: int, db: AsyncSession = Depends(get_db)):
    """Получить сотрудника по ID"""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    return employee

@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(employee_id: int, employee: EmployeeCreate, db: AsyncSession = Depends(get_db)):
    """Обновить сотрудника"""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    db_employee = result.scalar_one_or_none()
    
    if not db_employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Проверяем существование подразделения
    dept_result = await db.execute(select(Department).where(Department.id == employee.department_id))
    department = dept_result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=404, detail="Подразделение не найдено")
    
    # Обновляем данные
    for field, value in employee.model_dump().items():
        setattr(db_employee, field, value)
    
    await db.commit()
    await db.refresh(db_employee)
    return db_employee

@router.delete("/{employee_id}")
async def delete_employee(employee_id: int, db: AsyncSession = Depends(get_db)):
    """Удалить сотрудника"""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    await db.delete(employee)
    await db.commit()
    return {"message": "Сотрудник удален"}

@router.patch("/{employee_id}/status")
async def update_employee_status(employee_id: int, status_data: dict, db: AsyncSession = Depends(get_db)):
    """Обновить статус сотрудника"""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Проверяем, что статус является допустимым
    valid_statuses = ["НЛ", "Б", "К", "НВ", "НГ", "О"]
    new_status = status_data.get("status")
    
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Недопустимый статус")
    
    employee.status = new_status
    await db.commit()
    await db.refresh(employee)
    
    return {"message": "Статус обновлен", "status": employee.status}

@router.get("/{employee_id}/duty-types")
async def get_employee_duty_types(employee_id: int, db: AsyncSession = Depends(get_db)):
    """Получить типы нарядов сотрудника"""
    # Проверяем существование сотрудника
    emp_result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = emp_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Получаем типы нарядов сотрудника
    result = await db.execute(
        select(EmployeeDutyType)
        .where(EmployeeDutyType.employee_id == employee_id)
        .options(selectinload(EmployeeDutyType.duty_type))
    )
    employee_duty_types = result.scalars().all()
    
    return employee_duty_types

@router.post("/{employee_id}/duty-types")
async def add_employee_duty_type(employee_id: int, duty_type_data: dict, db: AsyncSession = Depends(get_db)):
    """Добавить тип наряда сотруднику"""
    # Проверяем существование сотрудника
    emp_result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = emp_result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Проверяем существование типа наряда
    duty_type_result = await db.execute(select(DutyType).where(DutyType.id == duty_type_data["duty_type_id"]))
    duty_type = duty_type_result.scalar_one_or_none()
    if not duty_type:
        raise HTTPException(status_code=404, detail="Тип наряда не найден")
    
    # Проверяем, не назначен ли уже этот тип наряда
    existing_result = await db.execute(
        select(EmployeeDutyType).where(
            EmployeeDutyType.employee_id == employee_id,
            EmployeeDutyType.duty_type_id == duty_type_data["duty_type_id"]
        )
    )
    existing = existing_result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Тип наряда уже назначен сотруднику")
    
    # Создаем связь
    employee_duty_type = EmployeeDutyType(
        employee_id=employee_id,
        duty_type_id=duty_type_data["duty_type_id"]
    )
    db.add(employee_duty_type)
    await db.commit()
    await db.refresh(employee_duty_type)
    
    return {"message": "Тип наряда добавлен сотруднику"} 