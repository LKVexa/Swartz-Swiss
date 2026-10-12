# LCTL-C Compact Alias Catalog

Aliases affect spelling only. The lowerer expands each alias before semantic verification.

| Compact | Canonical |
|---|---|
| `Q` | `QREG` |
| `C` | `CREG` |
| `QB` | `QUBIT` |
| `MZ` | `MEASURE_Z` |
| `MX` | `MEASURE_X` |
| `MY` | `MEASURE_Y` |
| `P0` | `PREP0` |
| `P1` | `PREP1` |
| `P+` | `PREP_PLUS` |
| `P-` | `PREP_MINUS` |
| `BAR` | `BARRIER` |
| `.` | `NOP` |
| `IF` | `CLASSICAL_IF` |
| `REG` | `REGION` |
| `DEP` | `DEPENDENCY` |
| `CM` | `COMM_MODEL` |
| `PART` | `PARTITION` |
| `MSG` | `MESSAGE` |
| `QBIND` | `QSTATE_BIND` |
| `QMOVE` | `QSTATE_MOVE` |
| `LK` | `LINK` |
| `EPR` | `EPR_RESERVE` |
| `TEL` | `TELEPORT` |
| `RCX` | `REMOTE_CNOT` |
| `ESWAP` | `ENTANGLEMENT_SWAP` |

Canonical names remain legal in LCTL-C and are preferred when an alias would reduce clarity.
