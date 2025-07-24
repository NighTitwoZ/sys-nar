from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Date, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

class Department(Base):
    """Модель подразделения (Структура)"""
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("departments.id"), nullable=True)  # ### MIGRATION: add parent_id for hierarchy
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    subdepartments = relationship("Department", backref="parent", remote_side=[id])  # Дочерние подразделения
    groups = relationship("Group", back_populates="department")

class Group(Base):
    """Модель группы (новый уровень)"""
    __tablename__ = "groups"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    department = relationship("Department", back_populates="groups")
    employees = relationship("Employee", back_populates="group")

class Employee(Base):
    """Модель сотрудника"""
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    middle_name = Column(String(100), nullable=True)
    position = Column(String(255), nullable=False)
    rank = Column(String(100), nullable=True)  # Звание сотрудника
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True)  # Новое поле для связи с группой
    is_active = Column(Boolean, default=True)
    status = Column(String(10), nullable=False, default="НЛ")  # НЛ, Б, К, НВ, НГ, О
    status_updated_at = Column(DateTime(timezone=True), nullable=True)  # Время последнего изменения статуса
    duty_count = Column(Integer, default=0)  # Количество нарядов, которые сотрудник уже отходил
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    department = relationship("Department")
    group = relationship("Group", back_populates="employees")
    employee_duty_types = relationship("EmployeeDutyType", back_populates="employee")
    duty_records = relationship("DutyRecord", back_populates="employee")
    status_details = relationship("EmployeeStatusDetails", back_populates="employee")
    status_schedules = relationship("EmployeeStatusSchedule", back_populates="employee")
    
    # Виртуальная связь для получения типов нарядов
    @property
    def duty_types(self):
        """Получить активные типы нарядов сотрудника"""
        return [edt.duty_type for edt in self.employee_duty_types if edt.is_active]

class DutyType(Base):
    """Модель типа наряда"""
    __tablename__ = "duty_types"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duty_category = Column(String(50), default="academic")  # Вид наряда: academic/division
    people_per_day = Column(Integer, default=1)  # Количество человек в сутки
    days_duration = Column(Integer, default=1)  # Сколько дней занимает наряд
    priority = Column(Integer, default=1)  # Приоритет наряда  # MIGRATION
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    employee_duty_types = relationship("EmployeeDutyType", back_populates="duty_type")

class EmployeeDutyType(Base):
    """Связующая таблица сотрудник-тип наряда"""
    __tablename__ = "employee_duty_types"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    duty_type_id = Column(Integer, ForeignKey("duty_types.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связи
    employee = relationship("Employee", back_populates="employee_duty_types")
    duty_type = relationship("DutyType", back_populates="employee_duty_types")

class DutyRecord(Base):
    """Модель записи о наряде"""
    __tablename__ = "duty_records"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    duty_type_id = Column(Integer, ForeignKey("duty_types.id"), nullable=False)
    duty_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    employee = relationship("Employee", back_populates="duty_records")
    duty_type = relationship("DutyType")

class EmployeeStatusDetails(Base):
    """Модель деталей статуса сотрудника"""
    __tablename__ = "employee_status_details"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    status = Column(String(10), nullable=False)  # НЛ, Б, К, НВ, НГ, О
    start_date = Column(Date, nullable=False)  # Дата начала статуса
    notes = Column(Text, nullable=True)  # Примечания
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связи
    employee = relationship("Employee", back_populates="status_details")

class DepartmentDutyDay(Base):
    """Модель дня дежурства подразделения в академическом наряде"""
    __tablename__ = "department_duty_days"
    
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    duty_type_id = Column(Integer, ForeignKey("duty_types.id"), nullable=False)
    duty_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связи
    department = relationship("Department")
    duty_type = relationship("DutyType")

class EmployeeStatusSchedule(Base):
    """Модель расписания статусов сотрудника"""
    __tablename__ = "employee_status_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    status = Column(String(10), nullable=False)  # Б, К, О (Болен, Командировка, Отпуск)
    start_date = Column(Date, nullable=False)  # Дата начала статуса
    end_date = Column(Date, nullable=False)  # Дата окончания статуса
    notes = Column(Text, nullable=True)  # Примечания
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    employee = relationship("Employee", back_populates="status_schedules") 