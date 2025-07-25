-- Создание таблицы employee_status_schedules
CREATE TABLE IF NOT EXISTS employee_status_schedules (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    status VARCHAR(10) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Создание индекса
CREATE INDEX IF NOT EXISTS ix_employee_status_schedules_id ON employee_status_schedules(id);
CREATE INDEX IF NOT EXISTS ix_employee_status_schedules_employee_id ON employee_status_schedules(employee_id);
CREATE INDEX IF NOT EXISTS ix_employee_status_schedules_dates ON employee_status_schedules(start_date, end_date); 