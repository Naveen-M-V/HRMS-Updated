@echo off
echo ========================================
echo   HRMS - Starting Localhost Servers
echo ========================================
echo.

echo Starting Backend Server...
start "HRMS Backend" cmd /k "cd /d e:\Websites\HRMS\hrms\backend && npm start"

timeout /t 5 /nobreak >nul

echo Starting Frontend Server...
start "HRMS Frontend" cmd /k "cd /d e:\Websites\HRMS\hrms\frontend && npm start"

echo.
echo ========================================
echo   Servers Starting...
echo ========================================
echo   Backend:  http://localhost:5003
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to exit this window...
pause >nul
