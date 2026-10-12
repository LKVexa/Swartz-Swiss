@echo off
cd /d "%~dp0"
set "PORT=8791"
if exist "%~dp0runtime\node\node.exe" (
  "%~dp0runtime\node\node.exe" launch.cjs
  goto finish
)
where node >nul 2>nul
if not errorlevel 1 (
  node launch.cjs
  goto finish
)
if exist "C:\Users\russe\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
  "C:\Users\russe\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" launch.cjs
  goto finish
)
echo Node.js 18 or newer is required.
:finish
pause
