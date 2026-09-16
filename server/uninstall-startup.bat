@echo off
setlocal
echo =======================================================
echo   Removing Sonance Companion from Windows Startup
echo =======================================================

set "VBS_FILE=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SonanceCompanion.vbs"

if exist "%VBS_FILE%" (
  del /f "%VBS_FILE%"
  echo [SUCCESS] Removed %VBS_FILE%
  echo Sonance Companion will no longer automatically start on Windows boot.
) else (
  echo [INFO] Startup launcher was not found. Nothing to remove.
)

pause
