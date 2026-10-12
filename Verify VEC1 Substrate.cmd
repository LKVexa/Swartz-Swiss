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
  echo ERROR: Python 3 is required to operate the VEC1 electron substrate.
  echo        The browser itself does not need Python; it seals substrate state natively.
  pause
  exit /b 2
)
echo === VEC node binding =========================================================
%PY% "%~dp0substrate\vec1\vecctl.py" nodes
set "EC=%ERRORLEVEL%"
if not "%EC%"=="0" exit /b %EC%
if "%EC%"=="3" echo NOTE: exit 3 is BLOCKED, not broken. Nodes that are not vendored here fail closed.
echo.
echo === VEC1 control-plane suite =================================================
pushd "%~dp0substrate"
%PY% -B -m unittest discover -s tests
set "EC=%ERRORLEVEL%"
popd
if not "%EC%"=="0" exit /b %EC%
echo.
echo === VEC1 preflight ===========================================================
%PY% "%~dp0substrate\vec1\vecctl.py" doctor --verbose
set "EC=%ERRORLEVEL%"
pause
exit /b %EC%
