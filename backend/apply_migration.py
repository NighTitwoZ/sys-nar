import psycopg2
import os

# Подключение к базе данных через переменные окружения
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@postgres:5432/naradi_db')

def apply_migration():
    try:
        # Парсим URL базы данных
        if DATABASE_URL.startswith('postgresql://'):
            url = DATABASE_URL.replace('postgresql://', '')
            credentials, host_db = url.split('@')
            user, password = credentials.split(':')
            host, db = host_db.split('/')
            host, port = host.split(':')
        else:
            raise ValueError("Неверный формат DATABASE_URL")
        
        # Подключаемся к базе данных
        conn = psycopg2.connect(
            host=host,
            port=port,
            database=db,
            user=user,
            password=password
        )
        
        cur = conn.cursor()
        
        # SQL для создания таблицы
        sql = """
        -- Создание таблицы для дней дежурства подразделений в академических нарядах
        CREATE TABLE IF NOT EXISTS department_duty_days (
            id SERIAL PRIMARY KEY,
            department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
            duty_type_id INTEGER NOT NULL REFERENCES duty_types(id) ON DELETE CASCADE,
            duty_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(department_id, duty_type_id, duty_date)
        );

        -- Создание индексов для оптимизации запросов
        CREATE INDEX IF NOT EXISTS idx_department_duty_days_department_id ON department_duty_days(department_id);
        CREATE INDEX IF NOT EXISTS idx_department_duty_days_duty_type_id ON department_duty_days(duty_type_id);
        CREATE INDEX IF NOT EXISTS idx_department_duty_days_duty_date ON department_duty_days(duty_date);
        CREATE INDEX IF NOT EXISTS idx_department_duty_days_composite ON department_duty_days(department_id, duty_type_id, duty_date);
        """
        
        # Выполняем миграцию
        cur.execute(sql)
        conn.commit()
        
        print("✅ Миграция успешно применена!")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Ошибка при применении миграции: {e}")

if __name__ == "__main__":
    apply_migration() 