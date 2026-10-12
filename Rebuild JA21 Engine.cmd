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
  echo ERROR: Python 3 is required to rebuild JA21 policy IR. It is not required to launch the browser.
  exit /b 2
)
%PY% "%~dp0tools\ja21_core.py" "%~dp0source\browser.ja" -o "%~dp0engine\ja21\browser.ir.json"
if errorlevel 1 exit /b %ERRORLEVEL%
%PY% "%~dp0tools\ja21_core.py" "%~dp0source\renderer.ja" -o "%~dp0engine\ja21\renderer.ir.json"
if errorlevel 1 exit /b %ERRORLEVEL%
%PY% "%~dp0tools\ja21_core.py" "%~dp0source\web_engine.ja" -o "%~dp0engine\ja21\web_engine.ir.json"
if errorlevel 1 exit /b %ERRORLEVEL%
%PY% -B "%~dp0tools\build_native_engine.py"
if errorlevel 1 exit /b %ERRORLEVEL%
echo JA21 policy IR and native DF_Medium engine rebuilt and regression-tested.
echo Run tools\reseal.py only after reviewing the successfully rebuilt sources and provenance.
exit /b 0
