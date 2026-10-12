@echo off
setlocal
cd /d "%~dp0"
call "%~dp0host\portable-env.cmd"
if errorlevel 1 exit /b %ERRORLEVEL%
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0host\Snapshot-PortableWorkspace.ps1" -Root "%~dp0."
set "RC=%ERRORLEVEL%"
if not "%RC%"=="0" echo SNAPSHOT FAILED with code %RC%.
pause
exit /b %RC%
