#!/usr/bin/env python3
"""Regenerate the 4.7.0 evidence inputs on the current toolchain, then assemble the ledger.

Added by the August 2026 audit remediation. tools/qualify470.py --assemble only *assembles* the
ledger from captured inputs (BUILD_A/B hashes, RUN_*.log, SANITIZER.log, SIZE_GATE.log, ...) and
refuses to run when the current build does not match BUILD_B.sha256 — which is always the case on a
different compiler. The capture procedure was not shipped. This script performs it:

  1. two clean builds -> BUILD_A.sha256 / BUILD_B.sha256 (byte-identical required)
  2. make operational, then every suite binary and Python check captured to RUN_*.log
  3. make sanitize -> SANITIZER.log (+ SANITIZER_470_FILE.log), make size -> SIZE_GATE.log, core-scan -> CORE_SCAN.log
  4. tools/brim_verify.py / lctl430.py provenance -> BRIM_VERIFY.log / PROVENANCE_VERIFY.log
  5. tools/br_bench.c (development build) x5 -> PERFORMANCE_470.json + DELTA.json vs PERFORMANCE_BASELINE.json
  6. python3 tools/qualify470.py --assemble  (ledger, ACCEPTANCE.json, QUALIFICATION.json, MASTER_MANIFEST.sha256)
  7. RELEASE_CONTENTS.sha256 regenerated over the whole tree (also: --contents-only, run by `make qualify`)

Run:  make regenerate-evidence   (or python3 tools/regenerate_evidence470.py)
"""
import hashlib, json, os, subprocess, sys
from pathlib import Path
R = Path(__file__).resolve().parents[1]; E = R / "evidence"; B = R / ".build"
D = "deploy/BOTTLE_ROCKET_SIM_CORE_4.7.0"
def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()
def run(cmd, check=True, env=None):
    p = subprocess.run(cmd, cwd=R, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
    if check and p.returncode: print(p.stdout[-6000:]); raise SystemExit(f"FAILED: {' '.join(map(str, cmd))} -> {p.returncode}")
    return p
def build_hashes():
    return "".join(f"{sha(R/x)}  {x}\n" for x in [".build/libbrvm_core.a", D + ".brimg", D + ".brir.json", D + ".provenance.json"])
def release_contents():
    rows = []
    for f in sorted(x for x in R.rglob("*") if x.is_file()):
        rel = f.relative_to(R).as_posix()
        if rel == "RELEASE_CONTENTS.sha256" or rel.startswith(".build/") or "__pycache__" in rel: continue
        rows.append(f"{sha(f)}  {rel}\n")
    (R / "RELEASE_CONTENTS.sha256").write_text("".join(rows))
    run(["sha256sum", "-c", "--quiet", "RELEASE_CONTENTS.sha256"]); print("    RELEASE_CONTENTS.sha256 OK", len(rows), "entries")
def main():
    if "--contents-only" in sys.argv:
        release_contents(); return
    print("[1] deterministic double build")
    run(["make", "clean"]); run(["make", "core", "image"]); A = build_hashes()
    run(["make", "clean"]); run(["make", "core", "image"]); Bh = build_hashes()
    if A != Bh: raise SystemExit("clean rebuild is not byte-identical")
    (E / "BUILD_A.sha256").write_text(A); (E / "BUILD_B.sha256").write_text(Bh)
    print("[2] operational + suite captures")
    run(["make", "operational"])
    caps = {"RUN_BR410.log": [".build/t410"], "RUN_BR430.log": [".build/t430"], "RUN_BR440.log": [".build/t440"], "RUN_BR450.log": [".build/t450"],
            "RUN_BR460.log": [".build/t460"], "RUN_BR470.log": [".build/t470"], "RUN_BR470_PROD.log": [".build/t470p"], "RUN_APDU_FUZZ.log": [".build/t470f"],
            "RUN_BR470_FILE.log": [".build/t470x"], "RUN_HW_ANCHOR.log": [".build/thw"],
            "RUN_SEMANTIC.log": [sys.executable, "tests/test_430_semantic.py"], "RUN_TOOLCHAIN460.log": [sys.executable, "tests/test_460_toolchain.py"],
            "RUN_STATIC470.log": [sys.executable, "tests/test_470_static.py"],
            "BRIM_VERIFY.log": [sys.executable, "tools/brim_verify.py", D + ".brimg", "--manifest", D + ".provenance.json"],
            "PROVENANCE_VERIFY.log": [sys.executable, "tools/lctl430.py", "provenance", "src/BOOT.lctlc", D + ".brimg", D + ".provenance.json"]}
    for name, cmd in caps.items():
        p = run(cmd); (E / name).write_text(p.stdout if p.stdout.endswith("\n") else p.stdout + "\n"); print("   ", name, "ok")
    print("[3] sanitizer, size, core-scan")
    p = run(["make", "sanitize"]); (E / "SANITIZER.log").write_text(p.stdout)
    if "SANITIZER_470_PASS" not in p.stdout: raise SystemExit("sanitizer marker missing")
    p = run([".build/san_br470x"]); (E / "SANITIZER_470_FILE.log").write_text(p.stdout)
    p = run(["make", "size"]); (E / "SIZE_GATE.log").write_text("\n".join(l for l in p.stdout.splitlines() if l.startswith(("production_exec_source_bytes", "repository_build_spec_bytes"))) + "\n")
    run(["make", "core-scan"]); (E / "CORE_SCAN.log").write_text("PASS_CORE_HOST_FREE\n")
    print("[4] performance (development build of tools/br_bench.c)")
    run(["make", ".build/br_bench"])
    samples = []
    for _ in range(5):
        p = run([".build/br_bench"]); samples.append(json.loads(p.stdout.strip().splitlines()[-1]))
    keys = ["instructions_per_second", "arithmetic_ops_per_second", "load_store_ops_per_second", "branch_ops_per_second"]
    med = {k: sorted(s[k] for s in samples)[2] for k in keys}
    (E / "PERFORMANCE_470.json").write_text(json.dumps({"median": med, "record": "BR.PerformanceMedian", "release": "4.7.0", "samples": 5, "tool": "tools/br_bench.c compiled with -DBR_DEVELOPMENT=1 (raw code loading is disabled in production builds)"}, indent=2, sort_keys=True) + "\n")
    base = json.loads((E / "PERFORMANCE_BASELINE.json").read_text())["median"]
    delta = {k + "_percent": (med[k] / base[k] - 1) * 100 for k in keys}
    (E / "DELTA.json").write_text(json.dumps({"baseline": "4.6.0", "candidate": "4.7.0", "delta_percent": delta, "note": "same-host medians; baseline retained from the 4.6.0 evidence, so cross-host deltas are informational only", "policy": "recorded; correctness/size gates are not waived by throughput"}, indent=2, sort_keys=True) + "\n")
    (E / "APDU_CORPUS.sha256").write_text("".join(f"{sha(f)}  {f.relative_to(R).as_posix()}\n" for f in sorted((R / "tests/fuzz/apdu").glob("*.bin"))))
    print("[5] assemble ledger")
    p = run([sys.executable, "tools/qualify470.py", "--assemble"]); print("   ", p.stdout.strip().splitlines()[-1][:200])
    print("[6] RELEASE_CONTENTS.sha256")
    release_contents()
    print("EVIDENCE REGENERATION COMPLETE")
if __name__ == "__main__": main()
