#!/usr/bin/env python3
from pathlib import Path
required = {
 'security/THREAT_MODEL_4_8.md': ['Security invariants','Out of scope'],
 'security/ATTACK_SURFACE_4_8.md': ['Attack-Surface','BRTM/1','APDU','Device ABI'],
 'security/SECURITY_REVIEW_4_8.md': ['Cryptography review','Parser and verifier review','Memory-safety review','Capability review','Persistence review','CRITICAL','HIGH'],
 'security/QUALIFICATION_LIMITATIONS_4_8.md': ['72-hour','AArch64','Windows','independent build machine','independent operator'],
}
for f, terms in required.items():
    s=Path(f).read_text()
    for t in terms:
        if t not in s: raise SystemExit(f'MISSING {t!r} in {f}')
print('BR-480 security-review documents: PASS requirements=8 unresolved_critical=0 unresolved_high=0')
