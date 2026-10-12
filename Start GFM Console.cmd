@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"
"%~dp0GfmJa21.exe"
if errorlevel 1 (
  echo.
  echo GFM console startup failed. Read the message above.
  echo Boot details are under workspace\logs.
  pause
  exit /b 1
)
exit /b 0
