# 🔧 Устранение проблем с системой распределения нарядов

## 🚨 Частые проблемы и их решения

### 1. Ошибка "Ошибка при загрузке подразделений"

**Симптомы:**
- На странице подразделений отображается ошибка
- В консоли браузера видны ошибки API

**Причины и решения:**

#### A. Backend не подключен к базе данных
```bash
# Проверьте логи backend
docker-compose logs backend

# Если видите ошибки подключения к PostgreSQL:
docker-compose restart backend
```

#### B. База данных не инициализирована
```bash
# Пересоздайте базу данных
docker-compose down -v
docker-compose up -d
```

#### C. Проблемы с сетью Docker
```bash
# Перезапустите все сервисы
docker-compose restart
```

### 2. Ошибка "Ошибка при загрузке типов нарядов"

**Симптомы:**
- На странице типов нарядов отображается ошибка
- API возвращает ошибки

**Решения:**
```bash
# Проверьте статус всех контейнеров
docker-compose ps

# Перезапустите backend
docker-compose restart backend

# Проверьте API напрямую
curl http://localhost:8000/api/duty-types
```

### 3. Frontend не загружается

**Симптомы:**
- Страница не открывается
- Белый экран
- Ошибки JavaScript

**Решения:**
```bash
# Перезапустите frontend
docker-compose restart frontend

# Проверьте логи frontend
docker-compose logs frontend

# Очистите кэш браузера
# Ctrl+Shift+R (жесткая перезагрузка)
```

### 4. Проблемы с портами

**Симптомы:**
- Контейнеры не запускаются
- Ошибки "port already in use"

**Решения:**
```bash
# Проверьте занятые порты
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :5432

# Остановите конфликтующие процессы
# Или измените порты в docker-compose.yml
```

### 5. Проблемы с базой данных

**Симптомы:**
- Backend не может подключиться к PostgreSQL
- Ошибки миграции

**Решения:**
```bash
# Полная пересоздание базы данных
docker-compose down -v
docker-compose up -d

# Проверьте подключение к БД
docker-compose exec postgres psql -U naradi_user -d naradi_db -c "\dt"
```

## 🔍 Диагностика проблем

### 1. Проверка статуса системы
```bash
# Запустите скрипт проверки
.\check-status.ps1
```

### 2. Просмотр логов
```bash
# Все сервисы
docker-compose logs

# Конкретный сервис
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Логи в реальном времени
docker-compose logs -f backend
```

### 3. Проверка API
```bash
# Health check
curl http://localhost:8000/health

# Тест endpoints
curl http://localhost:8000/api/departments
curl http://localhost:8000/api/duty-types
```

### 4. Проверка базы данных
```bash
# Подключение к PostgreSQL
docker-compose exec postgres psql -U naradi_user -d naradi_db

# Список таблиц
\dt

# Проверка данных
SELECT * FROM departments;
SELECT * FROM duty_types;
```

## 🛠️ Полная переустановка

Если ничего не помогает:

```bash
# 1. Остановите все контейнеры
docker-compose down

# 2. Удалите все данные
docker-compose down -v
docker system prune -f

# 3. Пересоберите образы
docker-compose up -d --build

# 4. Дождитесь запуска (2-3 минуты)
# 5. Создайте тестовые данные
python init-test-data.py
```

## 📋 Чек-лист для диагностики

- [ ] Docker Desktop запущен
- [ ] Все контейнеры работают (`docker-compose ps`)
- [ ] Backend подключен к базе данных (логи backend)
- [ ] API отвечает (`http://localhost:8000/health`)
- [ ] Frontend доступен (`http://localhost:3000`)
- [ ] База данных содержит таблицы
- [ ] Нет конфликтов портов

## 🆘 Получение помощи

Если проблема не решается:

1. **Соберите информацию:**
   ```bash
   docker-compose ps
   docker-compose logs
   ```

2. **Проверьте системные требования:**
   - Docker Desktop 4.0+
   - Windows 10/11
   - 4GB RAM минимум

3. **Создайте issue** с описанием:
   - Что вы делали
   - Какая ошибка возникла
   - Логи системы
   - Версия Docker

## 🔄 Автоматическое восстановление

Для быстрого восстановления системы:

```bash
# Скрипт автоматического восстановления
.\check-status.ps1

# Если есть проблемы, запустите:
docker-compose down -v
docker-compose up -d --build
python init-test-data.py
```

---

**💡 Совет:** Большинство проблем решается перезапуском контейнеров или пересозданием базы данных. 