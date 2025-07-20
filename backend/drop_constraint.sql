-- Удаление ограничения уникальности из поля name в таблице duty_types
-- Это позволит создавать наряды с одинаковыми названиями в разных подразделениях

-- Проверяем, существует ли ограничение уникальности
SELECT constraint_name, table_name, column_name
FROM information_schema.table_constraints 
WHERE constraint_name = 'duty_types_name_key' 
AND table_name = 'duty_types';

-- Удаляем ограничение уникальности, если оно существует
ALTER TABLE duty_types DROP CONSTRAINT IF EXISTS duty_types_name_key;

-- Проверяем, что ограничение удалено
SELECT constraint_name, table_name, column_name
FROM information_schema.table_constraints 
WHERE constraint_name = 'duty_types_name_key' 
AND table_name = 'duty_types'; 