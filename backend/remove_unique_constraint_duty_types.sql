-- Удаление ограничения уникальности из поля name в таблице duty_types
-- Это позволит создавать наряды с одинаковыми названиями в разных подразделениях

-- Проверяем, существует ли ограничение уникальности
DO $$
BEGIN
    -- Удаляем ограничение уникальности, если оно существует
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'duty_types_name_key' 
        AND table_name = 'duty_types'
    ) THEN
        ALTER TABLE duty_types DROP CONSTRAINT duty_types_name_key;
        RAISE NOTICE 'Ограничение уникальности duty_types_name_key удалено';
    ELSE
        RAISE NOTICE 'Ограничение уникальности duty_types_name_key не найдено';
    END IF;
END $$; 