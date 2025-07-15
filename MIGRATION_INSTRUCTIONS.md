# Инструкция по выполнению миграции базы данных

## Добавление поля duty_category в таблицу duty_types

### Описание изменений
Добавлено новое поле `duty_category` в таблицу `duty_types` для разделения типов нарядов на:
- `internal` - Наряд внутри подразделения
- `academic` - Наряд академический

### Способы выполнения миграции

#### Способ 1: Через Python-скрипт (рекомендуется)

1. Установите зависимости для миграции:
```bash
pip install -r migration_requirements.txt
```

2. Запустите скрипт миграции:
```bash
python migrate_duty_category.py
```

#### Способ 2: Через Docker (если контейнеры запущены)

1. Выполните SQL-команду в контейнере PostgreSQL:
```bash
docker exec naradi_postgres psql -U postgres -d naradi_db -c "ALTER TABLE duty_types ADD COLUMN duty_category VARCHAR(50) NOT NULL DEFAULT 'internal';"
```

2. Добавьте комментарий к полю:
```bash
docker exec naradi_postgres psql -U postgres -d naradi_db -c "COMMENT ON COLUMN duty_types.duty_category IS 'Категория наряда: internal - внутри подразделения, academic - академический';"
```

3. Обновите существующие записи:
```bash
docker exec naradi_postgres psql -U postgres -d naradi_db -c "UPDATE duty_types SET duty_category = 'internal' WHERE duty_category IS NULL OR duty_category = '';"
```

#### Способ 3: Через SQL-файл

1. Выполните SQL-скрипт:
```bash
docker exec -i naradi_postgres psql -U postgres -d naradi_db < add_duty_category_migration.sql
```

### Проверка результата

После выполнения миграции проверьте, что поле добавлено:

```sql
SELECT id, name, duty_category FROM duty_types LIMIT 5;
```

### Что изменилось в коде

1. **Модель базы данных** (`backend/models/models.py`):
   - Добавлено поле `duty_category` в модель `DutyType`

2. **API** (`backend/routers/duty_types.py`):
   - Обновлены Pydantic модели для включения поля `duty_category`
   - Добавлена валидация категории наряда
   - Обновлены эндпоинты для работы с новым полем

3. **Фронтенд**:
   - Обновлены интерфейсы TypeScript
   - Добавлено поле выбора категории в модальное окно создания типа наряда
   - Добавлена колонка "Категория" в таблицы отображения типов нарядов
   - Добавлено цветовое кодирование категорий (синий для внутренних, фиолетовый для академических)

### После миграции

1. Перезапустите бэкенд:
```bash
docker-compose restart backend
```

2. Перезапустите фронтенд:
```bash
docker-compose restart frontend
```

3. Проверьте работу приложения - теперь при создании нового типа наряда можно выбрать категорию.

### Откат изменений (если потребуется)

Для удаления поля duty_category:

```sql
ALTER TABLE duty_types DROP COLUMN duty_category;
```

**Внимание**: Это удалит все данные о категориях нарядов! 