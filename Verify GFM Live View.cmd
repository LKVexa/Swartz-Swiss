@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"
"%~dp0GfmJa21.exe" --verify-live
if errorlevel 1 (
  echo Live verification failed. Read workspace\verification\native-live.json.
  pause
  exit /b 1
)
"%~dp0GFM\runtime\node.exe" "%~dp0integration\compare-native.cjs"
if errorlevel 1 (
  pause
  exit /b 1
)
"%~dp0GFM\runtime\node.exe" "%~dp0integration\compare-native-phase.cjs"
if errorlevel 1 (
  pause
  exit /b 1
)
exit /b 0
