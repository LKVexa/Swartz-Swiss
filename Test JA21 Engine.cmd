@echo off
setlocal
call "%~dp0host\portable-env.cmd"
if errorlevel 1 exit /b %ERRORLEVEL%
cd /d "%~dp0"
set PYTHONDONTWRITEBYTECODE=1
set "PY="
where py.exe >nul 2>nul && set "PY=py.exe -3"
if not defined PY where python.exe >nul 2>nul && set "PY=python.exe"
if defined PY goto verify_python
echo Python is not available; running the PowerShell integrity verifier instead.
call "%~dp0Verify JA21 Virtual Browser.cmd"
exit /b %ERRORLEVEL%
:verify_python
%PY% "%~dp0tools\verify_package.py"
exit /b %ERRORLEVEL%
