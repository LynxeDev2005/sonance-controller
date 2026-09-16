@echo off
setlocal
echo ===================================================
echo   Installing PC Control Agent to Windows Startup
echo ===================================================

set "SCRIPT_DIR=%~dp0"
set "AGENT_JS=%SCRIPT_DIR%agent.js"
set "VBS_FILE=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\PCControlAgent.vbs"

echo Creating silent background runner in Startup folder:
echo %VBS_FILE%

(
  echo Set WshShell = CreateObject("WScript.Shell"^)
  echo WshShell.CurrentDirectory = "%SCRIPT_DIR%"
  echo WshShell.Run "node agent.js", 0, False
) > "%VBS_FILE%"

echo.
echo [SUCCESS] PC Control Agent has been installed to Windows Startup!
echo It will now run silently in the background automatically when your PC turns on.
echo.
echo To start it right now in the background, executing:
wscript "%VBS_FILE%"
echo Agent is now active!
pause
