from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from database import get_db
from models.models import EmployeeDutyPreference, Employee
from datetime import datetime, date
from pydantic import BaseModel

router = APIRouter(prefix="/employees", tags=["employee-duty-preferences"])

class DutyPreferenceCreate(BaseModel):
    date: str
    preference_type: str
    notes: Optional[str] = None

class DutyPreferenceResponse(BaseModel):
    id: int
    employee_id: int
    date: str
    preference_type: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        # Преобразуем date в строку
        data = {
            'id': obj.id,
            'employee_id': obj.employee_id,
            'date': obj.date.isoformat() if obj.date else None,
            'preference_type': obj.preference_type,
            'notes': obj.notes,
            'created_at': obj.created_at,
            'updated_at': obj.updated_at
        }
        return cls(**data)

@router.get("/{employee_id}/duty-preferences", response_model=List[DutyPreferenceResponse])
async def get_employee_duty_preferences(
    employee_id: int,
    year: int = Query(..., description="Год"),
    month: int = Query(..., description="Месяц"),
    preference_type: Optional[str] = Query(None, description="Тип предпочтения: preferred или unavailable"),
    db: AsyncSession = Depends(get_db)
):
    """Получить предпочтения сотрудника за указанный месяц"""
    
    # Проверяем существование сотрудника
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Получаем первый и последний день месяца
    first_day = date(year, month, 1)
    if month == 12:
        last_day = date(year + 1, 1, 1) - date.resolution
    else:
        last_day = date(year, month + 1, 1) - date.resolution
    
    # Строим запрос
    query = select(EmployeeDutyPreference).where(
        EmployeeDutyPreference.employee_id == employee_id,
        EmployeeDutyPreference.date >= first_day,
        EmployeeDutyPreference.date <= last_day
    )
    
    # Если указан тип предпочтения, добавляем фильтр
    if preference_type:
        if preference_type not in ['preferred', 'unavailable']:
            raise HTTPException(status_code=400, detail="Неверный тип предпочтения")
        query = query.where(EmployeeDutyPreference.preference_type == preference_type)
    
    result = await db.execute(query)
    preferences = result.scalars().all()
    
    return [DutyPreferenceResponse.from_orm(pref) for pref in preferences]

@router.post("/{employee_id}/duty-preferences", response_model=DutyPreferenceResponse)
async def create_employee_duty_preference(
    employee_id: int,
    preference: DutyPreferenceCreate,
    db: AsyncSession = Depends(get_db)
):
    """Создать предпочтение сотрудника"""
    
    # Проверяем существование сотрудника
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Проверяем тип предпочтения
    if preference.preference_type not in ['preferred', 'unavailable']:
        raise HTTPException(status_code=400, detail="Неверный тип предпочтения")
    
    # Парсим дату
    try:
        preference_date = datetime.strptime(preference.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте YYYY-MM-DD")
    
    # Проверяем, не существует ли уже такое предпочтение
    result = await db.execute(
        select(EmployeeDutyPreference).where(
            EmployeeDutyPreference.employee_id == employee_id,
            EmployeeDutyPreference.date == preference_date,
            EmployeeDutyPreference.preference_type == preference.preference_type
        )
    )
    existing_preference = result.scalar_one_or_none()
    
    if existing_preference:
        raise HTTPException(status_code=400, detail="Предпочтение на эту дату уже существует")
    
    # Создаем новое предпочтение
    new_preference = EmployeeDutyPreference(
        employee_id=employee_id,
        date=preference_date,
        preference_type=preference.preference_type,
        notes=preference.notes
    )
    
    db.add(new_preference)
    await db.commit()
    await db.refresh(new_preference)
    
    return DutyPreferenceResponse.from_orm(new_preference)

@router.delete("/duty-preferences/{preference_id}")
async def delete_employee_duty_preference(
    preference_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Удалить предпочтение сотрудника"""
    
    result = await db.execute(select(EmployeeDutyPreference).where(EmployeeDutyPreference.id == preference_id))
    preference = result.scalar_one_or_none()
    
    if not preference:
        raise HTTPException(status_code=404, detail="Предпочтение не найдено")
    
    await db.delete(preference)
    await db.commit()
    
    return {"message": "Предпочтение удалено"}

@router.delete("/{employee_id}/duty-preferences/month")
async def delete_all_employee_duty_preferences_for_month(
    employee_id: int,
    year: int = Query(..., description="Год"),
    month: int = Query(..., description="Месяц"),
    db: AsyncSession = Depends(get_db)
):
    """Удалить все предпочтения сотрудника за указанный месяц"""
    
    # Проверяем существование сотрудника
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Получаем первый и последний день месяца
    first_day = date(year, month, 1)
    if month == 12:
        last_day = date(year + 1, 1, 1) - date.resolution
    else:
        last_day = date(year, month + 1, 1) - date.resolution
    
    # Находим все предпочтения за месяц
    result = await db.execute(
        select(EmployeeDutyPreference).where(
            EmployeeDutyPreference.employee_id == employee_id,
            EmployeeDutyPreference.date >= first_day,
            EmployeeDutyPreference.date <= last_day
        )
    )
    preferences = result.scalars().all()
    
    # Удаляем все найденные предпочтения
    for preference in preferences:
        await db.delete(preference)
    
    await db.commit()
    
    return {"message": f"Удалено {len(preferences)} предпочтений за {month}/{year}"}

@router.put("/duty-preferences/{preference_id}", response_model=DutyPreferenceResponse)
async def update_employee_duty_preference(
    preference_id: int,
    preference: DutyPreferenceCreate,
    db: AsyncSession = Depends(get_db)
):
    """Обновить предпочтение сотрудника"""
    
    result = await db.execute(select(EmployeeDutyPreference).where(EmployeeDutyPreference.id == preference_id))
    db_preference = result.scalar_one_or_none()
    
    if not db_preference:
        raise HTTPException(status_code=404, detail="Предпочтение не найдено")
    
    # Проверяем тип предпочтения
    if preference.preference_type not in ['preferred', 'unavailable']:
        raise HTTPException(status_code=400, detail="Неверный тип предпочтения")
    
    # Парсим дату
    try:
        preference_date = datetime.strptime(preference.date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Неверный формат даты. Используйте YYYY-MM-DD")
    
    # Проверяем, не существует ли уже такое предпочтение (кроме текущего)
    result = await db.execute(
        select(EmployeeDutyPreference).where(
            EmployeeDutyPreference.employee_id == db_preference.employee_id,
            EmployeeDutyPreference.date == preference_date,
            EmployeeDutyPreference.preference_type == preference.preference_type,
            EmployeeDutyPreference.id != preference_id
        )
    )
    existing_preference = result.scalar_one_or_none()
    
    if existing_preference:
        raise HTTPException(status_code=400, detail="Предпочтение на эту дату уже существует")
    
    # Обновляем предпочтение
    db_preference.date = preference_date
    db_preference.preference_type = preference.preference_type
    db_preference.notes = preference.notes
    
    await db.commit()
    await db.refresh(db_preference)
    
    return DutyPreferenceResponse.from_orm(db_preference) 