@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"
"%~dp0GfmJa21.exe" --verify
if errorlevel 1 (
  echo Verification could not complete. Read the report in workspace\verification.
  pause
  exit /b 1
)
exit /b 0
