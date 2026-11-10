@echo off
rem Double-click to create the desktop shortcut (runs install-windows.ps1).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-windows.ps1"
pause
