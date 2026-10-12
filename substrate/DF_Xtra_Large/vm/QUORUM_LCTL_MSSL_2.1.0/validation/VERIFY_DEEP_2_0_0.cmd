@echo off
setlocal
set "ROOT=%~dp0.."
python "%ROOT%\qualification\run_qualification.py" || exit /b 1
python "%ROOT%\validation\verify_repository.py" || exit /b 1
echo PASS: deep 2.0.0 structural qualification
