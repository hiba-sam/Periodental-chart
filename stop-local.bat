@echo off
echo ============================================
echo Stopping MyPrescription Local Infrastructure
echo ============================================

REM Navigate to infrastructure directory
cd /d "%~dp0mypresc-infrastructure"

REM Stop Docker Compose
echo Stopping containers...
docker-compose -f docker-compose.local.yml --env-file .env.local down

if %errorlevel% neq 0 (
    echo Error: Failed to stop Docker Compose.
    pause
    exit /b 1
)

echo Check completed.
pause
