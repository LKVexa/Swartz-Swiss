@echo off
setlocal
set ROOT=%~dp0
python "%ROOT%world\qualification\remediate_26.py"
if errorlevel 1 exit /b %errorlevel%
python "%ROOT%world\qualification\qualify_world.py"
exit /b %errorlevel%
