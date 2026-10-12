@echo off
setlocal
cd /d "%~dp0"
call "%~dp0host\portable-env.cmd"
if errorlevel 1 exit /b %ERRORLEVEL%
if not exist "%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" (
  echo ERROR: Windows PowerShell is required to host JA21 Portable Desktop.
  exit /b 2
)
set "JA21_VERSION=unknown"
if exist "%~dp0VERSION" set /p JA21_VERSION=<"%~dp0VERSION"
echo JA21 Portable Desktop %JA21_VERSION%
echo Application: "%~dp0"
echo Workspace:   "%JA21_PORTABLE_ROOT%"
echo Host AppData is not used for JA21-owned mutable state in this process.
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -STA -ExecutionPolicy Bypass -File "%~dp0host\Start-JA21Browser.ps1"
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" (
  echo.
  echo JA21 Portable Desktop exited with code %EC%.
  if exist "%JA21_PORTABLE_ROOT%\logs\boot-latest.log" (
    echo.
    echo ===== JA21 boot-latest.log =====
    type "%JA21_PORTABLE_ROOT%\logs\boot-latest.log"
    echo ===== end boot log =============
  )
  pause
)
exit /b %EC%
