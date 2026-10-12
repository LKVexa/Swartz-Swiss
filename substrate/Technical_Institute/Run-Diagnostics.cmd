@echo off
setlocal EnableExtensions DisableDelayedExpansion
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Run-Diagnostics.ps1"
set "RC=%errorlevel%"
echo.
echo Diagnostic exit code: %RC%
pause
exit /b %RC%
