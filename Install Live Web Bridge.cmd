@echo off
setlocal
call "%~dp0host\portable-env.cmd"
if errorlevel 1 exit /b %ERRORLEVEL%
set "ROOT=%~dp0"
if not exist "%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" (
  echo REFUSED: Windows PowerShell was not found.
  pause
  exit /b 2
)
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%ROOT%host\Install-WebView2Bridge.ps1" -Root "%ROOT%."
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" (
  echo.
  echo LIVE WEB BRIDGE SETUP FAILED with code %RC%.
  pause
  exit /b %RC%
)
echo.
echo LIVE WEB BRIDGE SETUP COMPLETE.
pause
exit /b 0
