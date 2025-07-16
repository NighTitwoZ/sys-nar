#!/usr/bin/env python3
"""
Простой скрипт для запуска заполнения базы данных
"""

import subprocess
import sys
import os

def check_dependencies():
    """Проверка и установка зависимостей"""
    print("Проверка зависимостей...")
    
    try:
        import sqlalchemy
        print("OK: SQLAlchemy установлен")
    except ImportError:
        print("Установка SQLAlchemy...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "sqlalchemy[asyncio]"])
    
    try:
        import asyncpg
        print("OK: asyncpg установлен")
    except ImportError:
        print("Установка asyncpg...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "asyncpg"])

def main():
    """Основная функция"""
    print("=" * 60)
    print("ЗАПУСК ЗАПОЛНЕНИЯ БАЗЫ ДАННЫХ")
    print("=" * 60)
    
    # Проверяем зависимости
    check_dependencies()
    
    # Устанавливаем переменную окружения для подключения к БД
    if not os.getenv("DATABASE_URL"):
        os.environ["DATABASE_URL"] = "postgresql+asyncpg://naradi_user:naradi_password@localhost:5432/naradi_db"
    
    print(f"Подключение к БД: {os.environ['DATABASE_URL']}")
    
    # Запускаем основной скрипт
    try:
        from fill_database import main as fill_main
        import asyncio
        
        success = asyncio.run(fill_main())
        
        if success:
            print("\n" + "=" * 60)
            print("ЗАПОЛНЕНИЕ БАЗЫ ДАННЫХ ЗАВЕРШЕНО УСПЕШНО!")
            print("Откройте http://localhost:3000 для работы с системой")
            print("=" * 60)
        else:
            print("\nОШИБКА: Не удалось заполнить базу данных")
            sys.exit(1)
            
    except Exception as e:
        print(f"ОШИБКА: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 