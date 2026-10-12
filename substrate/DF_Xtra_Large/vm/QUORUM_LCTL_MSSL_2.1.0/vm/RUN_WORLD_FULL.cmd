@echo off
setlocal
cd /d "%~dp0"
if "%PYTHON%"=="" set PYTHON=python
%PYTHON% toolchain\quorum_vm.py compile src\WORLD_FULL.lctlc world\evidence\WORLD_FULL.payload.json --brir world\evidence\WORLD_FULL.brir.json || exit /b 1
%PYTHON% toolchain\quorum_vm.py sign world\evidence\WORLD_FULL.payload.json --key keys\DEV_ONLY_private_seed.hex --key-id dev-root --out world\evidence\WORLD_FULL.signed.brimg || exit /b 1
%PYTHON% toolchain\quorum_vm.py run world\evidence\WORLD_FULL.signed.brimg --trust keys\TRUST_STORE.json --snapshot world\evidence\WORLD_FULL.snapshot.json --trace world\evidence\WORLD_FULL.trace.json || exit /b 1
endlocal
