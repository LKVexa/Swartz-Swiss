@echo off
setlocal
call "%~dp0host\portable-env.cmd"
if errorlevel 1 exit /b %ERRORLEVEL%
cd /d "%~dp0"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -STA -ExecutionPolicy Bypass -File "%~dp0host\Verify-JA21Browser.ps1"
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" pause
exit /b %EC%
