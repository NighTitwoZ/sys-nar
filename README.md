# Система распределения нарядов

Современная веб-система для автоматического распределения нарядов между сотрудниками подразделений с учетом различных критериев.

## 🚀 Технологии

### Backend
- **FastAPI** - современный веб-фреймворк для Python
- **PostgreSQL** - реляционная база данных
- **SQLAlchemy** - ORM для работы с базой данных
- **Redis** - кэширование и сессии
- **Pydantic** - валидация данных

### Frontend
- **React 18** - библиотека для создания пользовательских интерфейсов
- **TypeScript** - типизированный JavaScript
- **Vite** - быстрый сборщик
- **Tailwind CSS** - утилитарный CSS фреймворк
- **React Router** - маршрутизация
- **Axios** - HTTP клиент

### Infrastructure
- **Docker** - контейнеризация
- **Docker Compose** - оркестрация контейнеров
- **Nginx** - обратный прокси-сервер

## 📋 Функциональность

### Основные возможности:
- ✅ Управление подразделениями
- ✅ Управление сотрудниками
- ✅ Назначение типов нарядов сотрудникам
- ✅ Автоматическое распределение нарядов
- ✅ Выбор месяца для распределения
- ✅ Экспорт результатов в CSV
- ✅ Современный адаптивный интерфейс

### Алгоритм распределения:
- Учет количества дней с последнего наряда
- Равномерное распределение нагрузки
- Приоритизация по типам нарядов
- Учет активности сотрудников

## 🛠️ Установка и запуск

### Предварительные требования
- Docker
- Docker Compose

### Быстрый запуск

1. **Клонирование репозитория**
```bash
git clone <repository-url>
cd Naradi
```

2. **Запуск проекта**
```bash
docker-compose up -d
```

3. **Открытие в браузере**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Swagger документация: http://localhost:8000/docs

### Разработка

1. **Запуск в режиме разработки**
```bash
# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

2. **Работа с базой данных**
```bash
# Подключение к PostgreSQL
docker-compose exec postgres psql -U naradi_user -d naradi_db

# Сброс базы данных
docker-compose down -v
docker-compose up -d
```

## 📁 Структура проекта

```
Naradi/
├── backend/                 # Backend API
│   ├── main.py             # Основной файл FastAPI
│   ├── database.py         # Конфигурация БД
│   ├── models/             # Модели данных
│   ├── routers/            # API роутеры
│   ├── requirements.txt    # Python зависимости
│   └── Dockerfile          # Docker образ backend
├── frontend/               # React приложение
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы приложения
│   │   ├── services/       # API сервисы
│   │   └── main.tsx        # Точка входа
│   ├── package.json        # Node.js зависимости
│   └── Dockerfile          # Docker образ frontend
├── nginx/                  # Nginx конфигурация
│   └── nginx.conf
├── docker-compose.yml      # Оркестрация контейнеров
└── README.md              # Документация
```

## 🔧 API Endpoints

### Подразделения
- `GET /api/departments` - список подразделений
- `GET /api/departments/{id}` - подразделение по ID
- `POST /api/departments` - создание подразделения
- `PUT /api/departments/{id}` - обновление подразделения
- `DELETE /api/departments/{id}` - удаление подразделения

### Сотрудники
- `GET /api/employees` - список сотрудников
- `GET /api/employees/department/{id}` - сотрудники подразделения
- `POST /api/employees` - создание сотрудника

### Типы нарядов
- `GET /api/duty-types` - список типов нарядов
- `POST /api/duty-types` - создание типа наряда

### Распределение нарядов
- `POST /api/duty-distribution/generate` - генерация распределения

## 🎯 Использование

### 1. Создание подразделений
1. Перейдите на страницу "Подразделения"
2. Нажмите "Добавить подразделение"
3. Заполните название и описание

### 2. Добавление сотрудников
1. Выберите подразделение
2. Нажмите "Добавить сотрудника"
3. Заполните данные сотрудника

### 3. Назначение типов нарядов
1. Создайте типы нарядов через API
2. Назначьте типы сотрудникам

### 4. Распределение нарядов
1. Перейдите на страницу "Распределение нарядов"
2. Выберите год и месяц
3. Нажмите "Сгенерировать"
4. Экспортируйте результат в CSV при необходимости

## 🔒 Безопасность

- Все контейнеры запускаются от непривилегированных пользователей
- Используются переменные окружения для конфиденциальных данных
- CORS настроен для безопасного взаимодействия frontend и backend

## 📊 Мониторинг

### Логи
```bash
# Просмотр логов всех сервисов
docker-compose logs

# Логи конкретного сервиса
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Health Check
- Backend: http://localhost:8000/health
- Frontend: http://localhost:3000

## 🚀 Развертывание на сервере

### Продакшн настройки

1. **Создайте .env файл**
```env
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://naradi_user:your_secure_password@postgres:5432/naradi_db
```

2. **Запуск в продакшн режиме**
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

3. **Настройка SSL (опционально)**
- Добавьте SSL сертификаты
- Обновите nginx.conf для HTTPS

## 🤝 Разработка

### Добавление новых функций

1. **Backend**
   - Создайте модель в `models/models.py`
   - Добавьте роутер в `routers/`
   - Обновите `main.py`

2. **Frontend**
   - Создайте компонент в `src/components/`
   - Добавьте страницу в `src/pages/`
   - Обновите роутинг в `App.tsx`

### Тестирование
```bash
# Backend тесты
docker-compose exec backend pytest

# Frontend тесты
docker-compose exec frontend npm test
```

## 📝 Лицензия

MIT License

## 🆘 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs`
2. Убедитесь, что все порты свободны
3. Проверьте доступность базы данных
4. Создайте issue в репозитории

---

**Система распределения нарядов** - современное решение для автоматизации процессов управления нарядами в организациях. 