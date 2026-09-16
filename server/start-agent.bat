@echo off
title PC Control Companion Agent
cd /d "%~dp0"
echo Starting PC Control Agent...
node agent.js
pause
