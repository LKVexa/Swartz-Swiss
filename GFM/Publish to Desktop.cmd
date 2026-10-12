@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"
powershell.exe -NoLogo -NoProfile -File "%~dp0Publish to Desktop.ps1"
if errorlevel 1 (
  echo Desktop publication could not complete. Read the message above.
  pause
  exit /b 1
)
exit /b 0
