# BR-410-01 — Create brvm-core

Decision: **OPERATIONAL** in the 4.1.0 host-reference production-execution-boundary scope.

All 10 atomic requirements have fresh generated evidence. Core behavior is separated from host services through the 16-call HAL; negative, deterministic, sanitizer, size and regression gates pass.

## Scope limits
Native Windows deployment, physical SIM/UICC/eSIM qualification, and independent external LCTL verifier qualification are not asserted by this host run. These are external/non-blocking to this package’s source-contract gate.
