-- Создание таблицы предпочтений сотрудников по дежурствам
CREATE TABLE IF NOT EXISTS employee_duty_preferences (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    preference_type VARCHAR(20) NOT NULL CHECK (preference_type IN ('preferred', 'unavailable')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS ix_employee_duty_preferences_id ON employee_duty_preferences(id);
CREATE INDEX IF NOT EXISTS ix_employee_duty_preferences_employee_id ON employee_duty_preferences(employee_id);
CREATE INDEX IF NOT EXISTS ix_employee_duty_preferences_date ON employee_duty_preferences(date);
CREATE INDEX IF NOT EXISTS ix_employee_duty_preferences_type ON employee_duty_preferences(preference_type);

-- Создание уникального индекса для предотвращения дублирования
CREATE UNIQUE INDEX IF NOT EXISTS ix_employee_duty_preferences_unique 
ON employee_duty_preferences(employee_id, date, preference_type);

-- Создание триггера для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
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