@echo off
chcp 65001 >nul
echo ========================================
echo Previewing Best Food Ever
echo ========================================
echo.

REM Checking for node_modules
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Starting preview server
echo Starting preview server...
echo.
call npm run preview

pause

