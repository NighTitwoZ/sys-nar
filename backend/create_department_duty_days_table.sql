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