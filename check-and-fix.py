#!/usr/bin/env python3
"""
Скрипт для проверки и исправления проблем с данными
"""

import requests
import time
import json

# Конфигурация
API_BASE_URL = "http://localhost:8000/api"

def wait_for_api():
    """Ожидание готовности API"""
    print("⏳ Ожидание готовности API...")
    max_retries = 30
    for i in range(max_retries):
        try:
            response = requests.get(f"{API_BASE_URL.replace('/api', '')}/health", timeout=5)
            if response.status_code == 200:
                print("✅ API готов к работе")
                return True
        except requests.exceptions.RequestException:
            pass
        print(f"   Попытка {i+1}/{max_retries}...")
        time.sleep(2)
    
    print("❌ API недоступен")
    return False

def check_endpoint(endpoint, name):
    """Проверка endpoint"""
    try:
        response = requests.get(f"{API_BASE_URL}{endpoint}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {name}: {len(data)} записей")
            return data
        else:
            print(f"❌ {name}: Ошибка {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ {name}: Ошибка сети - {e}")
        return None

def create_test_data():
    """Создание тестовых данных"""
    print("\n🔧 Создание тестовых данных...")
    
    # Создаем подразделение
    dept_data = {
        "name": "Тестовое подразделение",
        "description": "Подразделение для тестирования"
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/departments", json=dept_data)
        if response.status_code == 200:
            dept = response.json()
            print(f"✅ Создано подразделение: {dept['name']}")
            
            # Создаем тип наряда
            duty_type_data = {
                "name": "Тестовый наряд",
                "description": "Наряд для тестирования",
                "priority": 1,
                "people_per_day": 2
            }
            
            response = requests.post(f"{API_BASE_URL}/duty-types", json=duty_type_data)
            if response.status_code == 200:
                duty_type = response.json()
                print(f"✅ Создан тип наряда: {duty_type['name']}")
                
                # Создаем сотрудника
                emp_data = {
                    "first_name": "Иван",
                    "last_name": "Иванов",
                    "middle_name": "Иванович",
                    "position": "Тестировщик",
                    "department_id": dept['id']
                }
                
                response = requests.post(f"{API_BASE_URL}/employees", json=emp_data)
                if response.status_code == 200:
                    emp = response.json()
                    print(f"✅ Создан сотрудник: {emp['last_name']} {emp['first_name']}")
                    
                    # Назначаем тип наряда сотруднику
                    assignment_data = {
                        "employee_id": emp['id'],
                        "duty_type_id": duty_type['id']
                    }
                    
                    response = requests.post(f"{API_BASE_URL}/employee-duty-types", json=assignment_data)
                    if response.status_code == 200:
                        print(f"✅ Назначен тип наряда сотруднику")
                    else:
                        print(f"❌ Ошибка назначения типа наряда: {response.text}")
                else:
                    print(f"❌ Ошибка создания сотрудника: {response.text}")
            else:
                print(f"❌ Ошибка создания типа наряда: {response.text}")
        else:
            print(f"❌ Ошибка создания подразделения: {response.text}")
    except Exception as e:
        print(f"❌ Ошибка создания тестовых данных: {e}")

def main():
    print("🔍 Проверка состояния системы")
    print("=" * 50)
    
    # Ожидание готовности API
    if not wait_for_api():
        return
    
    # Проверяем основные endpoints
    print("\n📊 Проверка данных:")
    
    departments = check_endpoint("/departments", "Подразделения")
    duty_types = check_endpoint("/duty-types", "Типы нарядов")
    employees = check_endpoint("/employees", "Сотрудники")
    
    # Если данных нет, создаем тестовые
    if not departments or not duty_types or not employees:
        print("\n⚠️ Обнаружены проблемы с данными")
        create_test_data()
        
        # Проверяем снова
        print("\n📊 Повторная проверка данных:")
        check_endpoint("/departments", "Подразделения")
        check_endpoint("/duty-types", "Типы нарядов")
        check_endpoint("/employees", "Сотрудники")
    
    print("\n🎉 Проверка завершена!")
    print("🌐 Откройте http://localhost:3000 для работы с системой")

if __name__ == "__main__":
    main() 