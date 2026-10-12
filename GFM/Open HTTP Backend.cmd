@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"
if not exist "%~dp0runtime\node.exe" (
  echo The bundled runtime is missing. Extract the complete ZIP folder first.
  pause
  exit /b 1
)
"%~dp0runtime\node.exe" "%~dp0launch.cjs"
if errorlevel 1 (
  echo.
  echo Startup could not complete. Read the message above.
  pause
  exit /b 1
)
exit /b 0
