@echo off
setlocal
cd /d "%~dp0"
if "%PYTHON%"=="" set PYTHON=python
%PYTHON% world\qualification\qualify_315.py
set RC=%ERRORLEVEL%
endlocal & exit /b %RC%
