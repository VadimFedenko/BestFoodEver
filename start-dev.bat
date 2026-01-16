@echo off
chcp 65001 >nul
echo ========================================
echo Running Best Food Ever
echo ========================================
echo.

REM Checking for node_modules
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Starting dev server
echo Starting dev server...
echo.
call npm run dev

pause

