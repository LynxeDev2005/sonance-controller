@echo off
setlocal
echo =======================================================
echo   Stopping Sonance Companion Server...
echo =======================================================

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5005') do (
  if not "%%a"=="" if not "%%a"=="0" (
    echo Stopping process PID: %%a ...
    taskkill /f /pid %%a >nul 2>&1
  )
)

echo [SUCCESS] Sonance Companion stopped.
pause
