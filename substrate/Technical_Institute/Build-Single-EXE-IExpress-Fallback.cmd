@echo off
setlocal EnableExtensions DisableDelayedExpansion
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Build-Single-EXE.ps1" -ForceIExpress
set "RC=%errorlevel%"
if not "%RC%"=="0" pause
exit /b %RC%
