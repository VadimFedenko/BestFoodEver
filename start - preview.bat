@echo off
chcp 65001 >nul
echo ========================================
echo Running Best Food Ever
echo ========================================
echo.

REM Проверка наличия node_modules
if not exist "node_modules" (
    echo Установка зависимостей...
    call npm install
    echo.
)

REM Запуск dev сервера
echo Запуск dev сервера...
echo.
call npm run preview

pause


















