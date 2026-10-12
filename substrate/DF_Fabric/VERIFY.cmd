@echo off
REM DF_Fabric\VERIFY.cmd -- hashes, manifest, schemas, citations, core selfcheck, node registry, then the fabric battery over the bound nodes
setlocal
set ROOT=%~dp0
cd /d "%ROOT%"
if "%PYTHON%"=="" set PYTHON=python
"%PYTHON%" -B adapter\dfabric\cli.py fabric-verify %*
endlocal
