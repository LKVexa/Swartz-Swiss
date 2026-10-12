@echo off
setlocal
set ROOT=%~dp0
python "%ROOT%toolchain\quorum_vm.py" compile "%ROOT%src\WORLD_DEMO.lctlc" "%ROOT%world\evidence\WORLD_DEMO.payload.json" --brir "%ROOT%world\evidence\WORLD_DEMO.brir.json"
if errorlevel 1 exit /b %errorlevel%
python "%ROOT%toolchain\quorum_vm.py" sign "%ROOT%world\evidence\WORLD_DEMO.payload.json" --key "%ROOT%keys\DEV_ONLY_private_seed.hex" --key-id dev-root --out "%ROOT%world\evidence\WORLD_DEMO.signed.brimg"
if errorlevel 1 exit /b %errorlevel%
python "%ROOT%toolchain\quorum_vm.py" run "%ROOT%world\evidence\WORLD_DEMO.signed.brimg" --trust "%ROOT%keys\TRUST_STORE.json" --snapshot "%ROOT%world\evidence\WORLD_DEMO.snapshot.json" --trace "%ROOT%world\evidence\WORLD_DEMO.trace.json"
exit /b %errorlevel%
