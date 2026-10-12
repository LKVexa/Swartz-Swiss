@echo off
rem JA21 9.8.7 portable process envelope. CALL this before PowerShell/Python.
if not defined JA21_PORTABLE_ROOT set "JA21_PORTABLE_ROOT=%~dp0..\workspace"
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Initialize-PortableWorkspace.ps1"
if errorlevel 1 exit /b 1
for %%D in ("%JA21_PORTABLE_ROOT%") do set "JA21_PORTABLE_ROOT=%%~fD"
set "JA21_WEB_DATA_ROOT=%JA21_PORTABLE_ROOT%\state\webview2"
set "JA21_VEC1_STATE_ROOT=%JA21_PORTABLE_ROOT%\state\vec1"
set "JA21_DOWNLOADS_ROOT=%JA21_PORTABLE_ROOT%\downloads"
set "JA21_TEMP_ROOT=%JA21_PORTABLE_ROOT%\temp"
set "LOCALAPPDATA=%JA21_PORTABLE_ROOT%\host-env\LocalAppData"
set "APPDATA=%JA21_PORTABLE_ROOT%\host-env\RoamingAppData"
set "TEMP=%JA21_PORTABLE_ROOT%\temp"
set "TMP=%JA21_PORTABLE_ROOT%\temp"
set "HOME=%JA21_PORTABLE_ROOT%\home"
set "PYTHONPYCACHEPREFIX=%JA21_PORTABLE_ROOT%\cache\pycache"
set "PYTHONDONTWRITEBYTECODE=1"
exit /b 0
