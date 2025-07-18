from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from routers import departments, employees, duty_types, duty_distribution, employee_duty_types, academic_duty, groups
import redis.asyncio as redis
import asyncio
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Создание таблиц при запуске
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ожидание готовности базы данных с повторными попытками
    max_retries = 30
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Попытка подключения к базе данных {attempt + 1}/{max_retries}")
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ Успешное подключение к базе данных")
            break
        except Exception as e:
            logger.warning(f"❌ Ошибка подключения к БД (попытка {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                logger.info(f"⏳ Ожидание {retry_delay} секунд перед следующей попыткой...")
                await asyncio.sleep(retry_delay)
            else:
                logger.error("❌ Не удалось подключиться к базе данных после всех попыток")
                raise
    
    # Инициализация Redis с повторными попытками
    redis_retries = 10
    for attempt in range(redis_retries):
        try:
            logger.info(f"Попытка подключения к Redis {attempt + 1}/{redis_retries}")
            app.state.redis = redis.from_url("redis://redis:6379", encoding="utf-8", decode_responses=True)
            # Проверка подключения
            await app.state.redis.ping()
            logger.info("✅ Успешное подключение к Redis")
            break
        except Exception as e:
            logger.warning(f"❌ Ошибка подключения к Redis (попытка {attempt + 1}): {e}")
            if attempt < redis_retries - 1:
                await asyncio.sleep(1)
            else:
                logger.error("❌ Не удалось подключиться к Redis, продолжаем без кэширования")
                app.state.redis = None
    
    yield
    
    # Закрытие соединений
    if hasattr(app.state, 'redis') and app.state.redis:
        await app.state.redis.close()

app = FastAPI(
    title="Система распределения нарядов",
    description="API для управления подразделениями, сотрудниками и распределения нарядов",
    version="1.0.0",
    lifespan=lifespan
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(departments.router, prefix="/api/departments", tags=["Подразделения"])
app.include_router(employees.router, prefix="/api/employees", tags=["Сотрудники"])
app.include_router(duty_types.router, prefix="/api/duty-types", tags=["Типы нарядов"])
app.include_router(duty_distribution.router, prefix="/api/duty-distribution", tags=["Распределение нарядов"])
app.include_router(employee_duty_types.router, prefix="/api/employee-duty-types", tags=["Связи сотрудников с типами нарядов"])
app.include_router(academic_duty.router, prefix="/api/academic-duty", tags=["Академические наряды"])
app.include_router(groups.router, prefix="/api/groups", tags=["Группы"])

@app.get("/")
async def root():
    return {"message": "Система распределения нарядов API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 