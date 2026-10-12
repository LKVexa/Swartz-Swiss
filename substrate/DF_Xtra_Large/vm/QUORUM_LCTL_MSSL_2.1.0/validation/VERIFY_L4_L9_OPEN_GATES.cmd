@echo off
setlocal
set "ROOT=%~dp0.."
python "%ROOT%\qualification\verify_open_gate_evidence.py"
exit /b %ERRORLEVEL%
