@echo off
echo ============================================
echo Starting MyPrescription Local Infrastructure
echo ============================================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

REM Navigate to infrastructure directory
cd /d "%~dp0mypresc-infrastructure"

REM Check if .env.local exists, else create from example or use default
if not exist ".env.local" (
    echo Warning: .env.local not found. Starting with default vars...
)

REM Start Docker Compose
echo Launching containers...
docker-compose -f docker-compose.local.yml --env-file .env.local up --build

if %errorlevel% neq 0 (
    echo Error: Failed to start Docker Compose.
    pause
    exit /b 1
)
