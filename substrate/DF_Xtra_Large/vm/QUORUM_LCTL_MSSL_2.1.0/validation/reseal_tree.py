#!/usr/bin/env python3
"""Re-seal MSSL κ seals and regenerate the root SHA256SUMS.txt.

Added by the August 2026 audit remediation (findings F2/F3). The tree's own VERIFY_ALL.sh failed as
shipped because seven MSSL authority documents carried stale or placeholder κ seals, and because the
root manifest binds vm/deploy and vm/evidence files that `make -C vm operational` regenerates in place.
This script makes the tree self-consistent again after any edit or VM gate run:

  1. every *.mssl: recompute κ = sha256(bytes from 'α≡' up to ',κ≡') and rewrite the κ value if it
     differs (placeholder or stale); the hashed span itself is never modified;
  2. regenerate SHA256SUMS.txt over every regular file except SHA256SUMS.txt itself (__pycache__ excluded);
  3. print what changed.

Use validation/RESEAL_AFTER_VM_GATE.sh for the full sequence (VM gate -> reseal -> VERIFY_ALL).
"""
import hashlib, re, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def main():
    fixed = []
    for p in sorted(ROOT.rglob("*.mssl")):
        b = p.read_bytes()
        try:
            start = b.index("α≡".encode()); end = b.index(",κ≡".encode())
        except ValueError:
            print("MSSL_PARSE", p.relative_to(ROOT)); continue
        want = hashlib.sha256(b[start:end]).hexdigest()
        s = b.decode("utf-8")
        m = re.search(r'κ≡"sha256:([^"]*)"', s)
        if not m:
            print("MSSL_NO_KAPPA", p.relative_to(ROOT)); continue
        if m.group(1) != want:
            s2 = s[:m.start(1)] + want + s[m.end(1):]
            p.write_bytes(s2.encode("utf-8")); fixed.append((str(p.relative_to(ROOT)), m.group(1)[:24], want[:24]))
    for f, old, new in fixed: print(f"RESEALED {f}: {old}... -> {new}...")
    rows = []
    for f in sorted(x for x in ROOT.rglob("*") if x.is_file()):
        rel = f.relative_to(ROOT).as_posix()
        if rel == "SHA256SUMS.txt" or "__pycache__" in rel: continue
        rows.append(f"{hashlib.sha256(f.read_bytes()).hexdigest()}  {rel}\n")
    (ROOT / "SHA256SUMS.txt").write_text("".join(rows))
    print(f"SHA256SUMS.txt regenerated: {len(rows)} entries; MSSL seals repaired: {len(fixed)}")
if __name__ == "__main__": main()
