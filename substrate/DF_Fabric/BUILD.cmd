@echo off
REM DF_Fabric\BUILD.cmd -- BUILD every node container found beside this one
setlocal
set ROOT=%~dp0
cd /d "%ROOT%"
if "%PYTHON%"=="" set PYTHON=python
"%PYTHON%" -B adapter\dfabric\cli.py fabric-build %*
endlocal
