@echo off
setlocal EnableExtensions
set "ROOT=%~dp0.."
python "%ROOT%\validation\verify_repository.py" || exit /b 1
set "LCTL=%ROOT%\toolchain\lctl_1_6_1_rc1\START_LCTL_1_6_1.cmd"
for %%F in ("%ROOT%\execution\*.lctlc") do call "%LCTL%" column-verify "%%~fF" >nul || exit /b 1
for /D %%D in ("%ROOT%\modules\*") do for %%F in ("%%~fD\execution\*.lctlc") do call "%LCTL%" column-verify "%%~fF" >nul || exit /b 1
echo PASS: all Columned LCTL plans lowered and canonical-verified
exit /b 0
