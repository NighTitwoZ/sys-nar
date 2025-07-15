#!/usr/bin/env python3
"""
Скрипт для тестирования новой логики распределения нарядов
"""

import requests
import json
from datetime import datetime

# Конфигурация
API_BASE_URL = "http://localhost:8000/api"

def test_distribution():
    """Тестирование распределения нарядов"""
    print("🧪 Тестирование новой логики распределения нарядов")
    print("=" * 60)
    
    # Данные для запроса
    current_date = datetime.now()
    request_data = {
        "year": current_date.year,
        "month": current_date.month
    }
    
    try:
        print(f"📅 Генерируем распределение на {current_date.month}/{current_date.year}...")
        
        response = requests.post(
            f"{API_BASE_URL}/duty-distribution/generate",
            json=request_data
        )
        
        if response.status_code == 200:
            distribution = response.json()
            
            print(f"✅ Распределение создано успешно!")
            print(f"📊 Подразделений в распределении: {len(distribution)}")
            
            # Анализируем распределение
            analyze_distribution(distribution)
            
        else:
            print(f"❌ Ошибка создания распределения: {response.status_code}")
            print(f"Ответ: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")

def analyze_distribution(distribution):
    """Анализ распределения нарядов"""
    print("\n📋 Анализ распределения:")
    print("-" * 40)
    
    # Словари для анализа
    employee_dates = {}  # Сотрудник -> даты нарядов
    date_employees = {}  # Дата -> сотрудники
    duty_type_dates = {}  # Тип наряда -> даты -> количество человек
    
    total_duties = 0
    
    for dept in distribution:
        print(f"\n🏢 Подразделение: {dept['department_name']}")
        dept_duties = dept['duties']
        print(f"   Нарядов: {len(dept_duties)}")
        
        for duty in dept_duties:
            total_duties += 1
            date = duty['date']
            employee_id = duty['employee_id']
            employee_name = duty['employee_name']
            duty_type_name = duty['duty_type_name']
            people_per_day = duty['people_per_day']
            
            # Отслеживаем даты сотрудника
            if employee_id not in employee_dates:
                employee_dates[employee_id] = []
            employee_dates[employee_id].append(date)
            
            # Отслеживаем сотрудников на дату
            if date not in date_employees:
                date_employees[date] = []
            date_employees[date].append(employee_id)
            
            # Отслеживаем типы нарядов
            if duty_type_name not in duty_type_dates:
                duty_type_dates[duty_type_name] = {}
            if date not in duty_type_dates[duty_type_name]:
                duty_type_dates[duty_type_name][date] = 0
            duty_type_dates[duty_type_name][date] += 1
    
    print(f"\n📊 Общая статистика:")
    print(f"   Всего нарядов: {total_duties}")
    print(f"   Уникальных сотрудников: {len(employee_dates)}")
    print(f"   Дней с нарядами: {len(date_employees)}")
    
    # Проверяем нарушения
    print(f"\n🔍 Проверка нарушений:")
    
    # 1. Проверяем, не назначен ли один человек на несколько нарядов в один день
    violations = 0
    for date, employees in date_employees.items():
        if len(employees) != len(set(employees)):
            violations += 1
            print(f"   ❌ Нарушение: {date} - дублирование сотрудников")
    
    if violations == 0:
        print("   ✅ Нет дублирования сотрудников в один день")
    
    # 2. Проверяем ограничения по количеству человек в наряде
    duty_violations = 0
    for duty_type, dates in duty_type_dates.items():
        for date, count in dates.items():
            # Находим people_per_day для этого типа наряда
            for dept in distribution:
                for duty in dept['duties']:
                    if duty['duty_type_name'] == duty_type and duty['date'] == date:
                        people_per_day = duty['people_per_day']
                        if count > people_per_day:
                            duty_violations += 1
                            print(f"   ❌ Нарушение: {duty_type} на {date} - {count} человек вместо {people_per_day}")
                        break
    
    if duty_violations == 0:
        print("   ✅ Соблюдены ограничения по количеству человек в наряде")
    
    # 3. Проверяем интервалы между нарядами
    interval_violations = 0
    for employee_id, dates in employee_dates.items():
        dates.sort()
        for i in range(1, len(dates)):
            date1 = datetime.fromisoformat(dates[i-1])
            date2 = datetime.fromisoformat(dates[i])
            days_diff = (date2 - date1).days
            if days_diff < 3:
                interval_violations += 1
                print(f"   ❌ Нарушение: сотрудник {employee_id} - {days_diff} дней между нарядами")
    
    if interval_violations == 0:
        print("   ✅ Соблюдены интервалы между нарядами (минимум 3 дня)")
    
    print(f"\n🎉 Анализ завершен!")

if __name__ == "__main__":
    test_distribution() 