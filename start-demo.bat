@echo off
setlocal

cd /d "%~dp0"
set "APP_PORT=3000"

echo ==============================================
echo Smart Event Booking - Demo Launcher
echo ==============================================

where npm >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm is not available in PATH.
  echo Install Node.js and try again.
  pause
  exit /b 1
)

echo [1/4] Trying to start MongoDB service...
sc query MongoDB >nul 2>&1
if errorlevel 1 (
  echo [WARN] MongoDB Windows service not found. Skipping service start.
  echo        If using local MongoDB, ensure it is running manually.
) else (
  net start MongoDB >nul 2>&1
  if errorlevel 1 (
    echo [WARN] Could not start MongoDB service (may already be running or need admin rights).
  ) else (
    echo [OK] MongoDB service started.
  )
)

echo [2/4] Checking .env file...
if not exist ".env" (
  if exist ".env.example" (
    copy /Y ".env.example" ".env" >nul
    echo [OK] Created .env from .env.example. Update secrets if needed.
  ) else (
    echo [WARN] .env and .env.example are missing.
  )
) else (
  echo [OK] .env found.
)

for /f "tokens=1,2 delims==" %%A in ('findstr /B "PORT=" ".env" 2^>nul') do (
  if not "%%B"=="" set "APP_PORT=%%B"
)

if not exist "node_modules" (
  echo [INFO] node_modules not found. Installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
)

echo [3/4] Starting app server in a new window...
start "Smart Event Booking Server" cmd /k "cd /d ""%~dp0"" && npm start"

echo [4/4] Opening browser...
timeout /t 5 /nobreak >nul
start "" "http://localhost:%APP_PORT%"

echo ----------------------------------------------
echo Demo is launching.
echo Use these credentials:
echo Admin: admin@eventsystem.com / Password123!
echo User : user@eventsystem.com / Password123!
echo ----------------------------------------------

endlocal
