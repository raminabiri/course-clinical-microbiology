@echo off
rem Opens the handbook in its own app window (Edge or Chrome), or the default browser.
setlocal
set "APPDIR=%~dp0"
set "URL=file:///%APPDIR:\=/%index.html"
set "PROFILE=%LOCALAPPDATA%\ClinicalMicrobiologyApp"
set "FLAGS=--app="%URL%" --user-data-dir="%PROFILE%" --no-first-run --no-default-browser-check --window-size=1400,900"
for %%B in ("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe") do (
  if exist %%B (
    start "" %%B %FLAGS%
    exit /b
  )
)
start "" "%APPDIR%index.html"
