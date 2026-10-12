# Virtual Device / Service ABI 2

## Legacy services

| Service | Meaning | Determinism |
|---:|---|---|
| 0 | no-op | deterministic |
| 1 | append low byte of R0 to bounded console buffer | deterministic |
| 2 | write VM virtual step clock to R0 | deterministic |
| 3 | write deterministic LCG output to R0 | deterministic |

## RC-PW world services

Service IDs 16-31 implement the hosted reference folded-world bridge and are specified in `../world/spec/WORLD_SERVICE_ABI.md`.

Services must be present in the image capability manifest. Unknown or unauthorized service IDs trap. The separate APDU reference endpoint remains bounded to 4,096 bytes. No network device is implemented.
