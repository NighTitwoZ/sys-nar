-- Миграция для добавления поля duty_category в таблицу duty_types
-- Выполнить в базе данных PostgreSQL

-- Добавляем новое поле duty_category с значением по умолчанию
ALTER TABLE duty_types 
ADD COLUMN duty_category VARCHAR(50) NOT NULL DEFAULT 'internal';

-- Добавляем комментарий к полю
COMMENT ON COLUMN duty_types.duty_category IS 'Категория наряда: internal - внутри подразделения, academic - академический';

-- Обновляем существующие записи (все существующие наряды считаем внутренними)
UPDATE duty_types 
SET duty_category = 'internal' 
WHERE duty_category IS NULL OR duty_category = '';

-- Проверяем результат
SELECT id, name, duty_category FROM duty_types LIMIT 5; 