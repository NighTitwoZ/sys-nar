@echo off
echo Остановка Docker Compose...
docker-compose down

echo Запуск Docker Compose...
docker-compose up -d --build

echo Ожидание запуска сервисов...
timeout /t 10 /nobreak

echo Проверка статуса...
docker-compose ps

echo Готово!
pause 