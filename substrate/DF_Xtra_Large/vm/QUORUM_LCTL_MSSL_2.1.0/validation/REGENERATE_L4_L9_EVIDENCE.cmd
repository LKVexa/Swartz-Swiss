@echo off
setlocal
set "ROOT=%~dp0.."
python "%ROOT%\qualification\open_gate_runtime.py"
echo Evidence regenerated. Rebuild SHA256SUMS.txt before treating repository-integrity verification as current.
exit /b %ERRORLEVEL%
