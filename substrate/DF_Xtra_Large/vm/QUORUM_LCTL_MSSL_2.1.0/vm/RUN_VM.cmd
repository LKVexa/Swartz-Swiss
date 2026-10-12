@echo off
setlocal
set "ROOT=%~dp0"
py -3 "%ROOT%toolchain\quorum_vm.py" run "%ROOT%deploy\CORE.signed.brimg" --trust "%ROOT%keys\TRUST_STORE.json" --snapshot "%ROOT%evidence\last_run_snapshot.json" --trace "%ROOT%evidence\last_run_trace.json"
exit /b %ERRORLEVEL%
