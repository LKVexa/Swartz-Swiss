@echo off
setlocal
call "%~dp0host\portable-env.cmd"
if errorlevel 1 exit /b %ERRORLEVEL%
cd /d "%~dp0"
set PYTHONDONTWRITEBYTECODE=1
set PY=
where py.exe >nul 2>nul && set "PY=py.exe -3"
if not defined PY where python.exe >nul 2>nul && set "PY=python.exe"
if not defined PY (
  echo ERROR: Python 3 is required to audit the VEC1 electron substrate.
  pause
  exit /b 2
)
echo Re-deriving every state hash and ledger chain the presenter wrote...
%PY% "%~dp0substrate\vec1\vecctl.py" presenter-audit
set "EC=%ERRORLEVEL%"
if "%EC%"=="4" echo INTEGRITY FAILURE: state or a ledger chain did not verify.
pause
exit /b %EC%
