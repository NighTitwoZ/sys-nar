import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

async def create_table():
    # Параметры подключения к базе данных
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://naradi_user:naradi_password@localhost:5432/naradi_db')
    
    try:
        # Подключаемся к базе данных
        conn = await asyncpg.connect(DATABASE_URL)
        
        # SQL-скрипт для создания таблицы
        sql_script = """
        -- Создание таблицы предпочтений сотрудников по дежурствам
        CREATE TABLE IF NOT EXISTS employee_duty_preferences (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            preference_type VARCHAR(20) NOT NULL CHECK (preference_type IN ('preferred', 'unavailable')),
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(employee_id, date, preference_type)
        );

        -- Создание индексов для оптимизации запросов
        CREATE INDEX IF NOT EXISTS idx_employee_duty_preferences_employee_id ON employee_duty_preferences(employee_id);
        CREATE INDEX IF NOT EXISTS idx_employee_duty_preferences_date ON employee_duty_preferences(date);
        CREATE INDEX IF NOT EXISTS idx_employee_duty_preferences_type ON employee_duty_preferences(preference_type);
        CREATE INDEX IF NOT EXISTS idx_employee_duty_preferences_employee_date ON employee_duty_preferences(employee_id, date);

        -- Создание триггера для автоматического обновления updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_employee_duty_preferences_updated_at 
            BEFORE UPDATE ON employee_duty_preferences 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        -- Комментарии к таблице и колонкам
        COMMENT ON TABLE employee_duty_preferences IS 'Предпочтения сотрудников по дежурствам';
        COMMENT ON COLUMN employee_duty_preferences.employee_id IS 'ID сотрудника';
        COMMENT ON COLUMN employee_duty_preferences.date IS 'Дата предпочтения';
        COMMENT ON COLUMN employee_duty_preferences.preference_type IS 'Тип предпочтения: preferred - предпочтительная дата, unavailable - нельзя заступать';
        COMMENT ON COLUMN employee_duty_preferences.notes IS 'Примечания к предпочтению';
        """
        
        # Выполняем SQL-скрипт
        await conn.execute(sql_script)
        
        print("✅ Таблица employee_duty_preferences успешно создана!")
        
        # Проверяем, что таблица создана
        result = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'employee_duty_preferences'
        """)
        
        if result:
            print("✅ Таблица найдена в базе данных")
        else:
            print("❌ Таблица не найдена в базе данных")
            
    except Exception as e:
        print(f"❌ Ошибка при создании таблицы: {e}")
    finally:
        if 'conn' in locals():
            await conn.close()

if __name__ == "__main__":
    asyncio.run(create_table()) 