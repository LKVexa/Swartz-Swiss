@echo off
REM DF_Fabric\RUN.cmd -- run a bundle's row-sequence witness on the fabric (replica + pipeline + BSP), default fabric/FABRIC.pal
setlocal
set ROOT=%~dp0
cd /d "%ROOT%"
if "%PYTHON%"=="" set PYTHON=python
"%PYTHON%" -B adapter\dfabric\cli.py fabric-run %*
endlocal
