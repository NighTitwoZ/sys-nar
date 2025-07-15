# Скрипт проверки состояния системы распределения нарядов

Write-Host "🔍 Проверка состояния системы..." -ForegroundColor Cyan

# Проверка Docker
Write-Host "`n📦 Проверка Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker не установлен или не запущен" -ForegroundColor Red
    Write-Host "   Запустите Docker Desktop и повторите попытку" -ForegroundColor Yellow
    exit 1
}

# Проверка Docker Compose
Write-Host "`n🐳 Проверка Docker Compose..." -ForegroundColor Yellow
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose не найден" -ForegroundColor Red
    exit 1
}

# Проверка контейнеров
Write-Host "`n🚀 Проверка контейнеров..." -ForegroundColor Yellow
try {
    $containers = docker-compose ps
    Write-Host "📊 Статус контейнеров:" -ForegroundColor Cyan
    Write-Host $containers
} catch {
    Write-Host "❌ Ошибка при проверке контейнеров" -ForegroundColor Red
}

# Проверка портов
Write-Host "`n🔌 Проверка портов..." -ForegroundColor Yellow

$ports = @(3000, 8000, 5432, 6379)
foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet
        if ($connection) {
            Write-Host "✅ Порт $port открыт" -ForegroundColor Green
        } else {
            Write-Host "❌ Порт $port закрыт" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Порт $port недоступен" -ForegroundColor Red
    }
}

# Проверка доступности сервисов
Write-Host "`n🌐 Проверка доступности сервисов..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend API доступен" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend API недоступен (код: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend API недоступен" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Frontend доступен" -ForegroundColor Green
    } else {
        Write-Host "❌ Frontend недоступен (код: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Frontend недоступен" -ForegroundColor Red
}

Write-Host "`n📋 Рекомендации:" -ForegroundColor Cyan
Write-Host "• Если контейнеры не запущены: docker-compose up -d" -ForegroundColor White
Write-Host "• Если порты заняты: проверьте другие приложения" -ForegroundColor White
Write-Host "• Если сервисы недоступны: docker-compose logs" -ForegroundColor White
Write-Host "• Для полной пересборки: docker-compose down -v && docker-compose up -d --build" -ForegroundColor White

Write-Host "`n🎯 Доступные URL:" -ForegroundColor Cyan
Write-Host "• Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "• Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "• API документация: http://localhost:8000/docs" -ForegroundColor White
Write-Host "• Health check: http://localhost:8000/health" -ForegroundColor White 