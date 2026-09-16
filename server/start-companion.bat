@echo off
title Sonance — PC Companion
cd /d "%~dp0"

echo Opening Sonance Web Dashboard...
start http://localhost:5005

echo Starting Sonance Companion Server...
node agent.js
pause
