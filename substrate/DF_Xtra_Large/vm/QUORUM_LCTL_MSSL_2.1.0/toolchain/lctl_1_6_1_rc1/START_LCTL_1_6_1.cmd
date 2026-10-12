@echo off
setlocal
set ROOT=%~dp0
java -jar "%ROOT%runtime\bin\lctl-hyperfederated.jar" %*
exit /b %errorlevel%
