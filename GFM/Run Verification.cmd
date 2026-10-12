@echo off
setlocal DisableDelayedExpansion
cd /d "%~dp0"
"%~dp0runtime\node.exe" "%~dp0verify-install.cjs"
if errorlevel 1 goto failed
"%~dp0runtime\node.exe" --test --test-concurrency=1 tests\cylinder-em.test.cjs tests\independent-em-validation.cjs tests\audit-physics.test.cjs tests\plasma-mode-validation.cjs tests\gr-reference.test.cjs tests\audit-api.test.cjs tests\view-mapping.test.cjs tests\combined-layers.test.cjs tests\pulse-diagnostics.test.cjs tests\pulse-wormhole-view.test.cjs tests\combined-ui.test.cjs tests\browser-backend.test.cjs tests\preview-build.test.cjs tests\server-scheduler.test.cjs tests\server.test.cjs tests\launcher.test.cjs
if errorlevel 1 goto failed
echo.
echo All mathematical and API checks passed.
pause
exit /b 0
:failed
echo.
echo Verification stopped. Read the result above.
pause
exit /b 1
