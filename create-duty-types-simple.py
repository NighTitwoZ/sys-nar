#!/usr/bin/env python3
"""
Простой скрипт для создания типов нарядов
"""

import requests
import time

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

def create_duty_type(name, description, priority, people_per_day):
    """Создание типа наряда"""
    data = {
        "name": name,
        "description": description,
        "priority": priority,
        "people_per_day": people_per_day
    }
    
    try:
        response = requests.post(f"{API_BASE_URL}/duty-types", json=data)
        if response.status_code == 200:
            print(f"✅ Создан тип наряда: {name} ({people_per_day} чел/сутки)")
            return response.json()
        else:
            print(f"❌ Ошибка создания типа наряда {name}: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка создания типа наряда {name}: {e}")
        return None

def main():
    print("🚀 Создание типов нарядов")
    print("=" * 40)
    
    # Ожидание готовности API
    if not wait_for_api():
        return
    
    # Типы нарядов
    duty_types_data = [
        ("Дежурство по организации", "Общее дежурство по организации", 1, 2),
        ("Дежурство по IT", "Дежурство в IT-отделе", 2, 1),
        ("Дежурство по безопасности", "Дежурство в отделе безопасности", 3, 3),
        ("Дежурство по производству", "Дежурство в производственном отделе", 2, 2),
        ("Дежурство по бухгалтерии", "Дежурство в бухгалтерии", 1, 1),
        ("Дежурство по кадрам", "Дежурство в отделе кадров", 1, 1),
        ("Дежурство по охране", "Дежурство по охране территории", 4, 4),
        ("Дежурство по связи", "Дежурство по связи и коммуникациям", 2, 1)
    ]
    
    print("\n🎯 Создание типов нарядов...")
    
    # Создание типов нарядов
    created_count = 0
    for name, description, priority, people_per_day in duty_types_data:
        duty_type = create_duty_type(name, description, priority, people_per_day)
        if duty_type:
            created_count += 1
    
    print(f"\n🎉 Создание завершено!")
    print("=" * 40)
    print(f"📊 Создано типов нарядов: {created_count}")
    
    print("\n🌐 Откройте http://localhost:3000/duty-types для просмотра")

if __name__ == "__main__":
    main() 