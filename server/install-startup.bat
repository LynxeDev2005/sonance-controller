@echo off
setlocal
echo =======================================================
echo   Installing Sonance Companion to Windows Startup
echo =======================================================

set "SCRIPT_DIR=%~dp0"
set "VBS_FILE=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\SonanceCompanion.vbs"

echo Creating silent background launcher in Startup folder:
echo %VBS_FILE%

(
  echo Set WshShell = CreateObject("WScript.Shell"^)
  echo WshShell.CurrentDirectory = "%SCRIPT_DIR%"
  echo WshShell.Run "node agent.js", 0, False
) > "%VBS_FILE%"

echo.
echo [SUCCESS] Sonance Companion is now configured to start automatically on Windows boot!
echo.
echo Launching silent background process right now...
wscript "%VBS_FILE%"
echo Companion is now running in the background!
echo Web Dashboard available at: http://localhost:5005
pause
