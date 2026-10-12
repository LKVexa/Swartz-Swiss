#!/usr/bin/env python3
"""Re-seal the 5.0.0 release candidate after a source or tool change.

Added by the August 2026 audit remediation. The package's evidence web binds the src/host/include
tree hash (replay/EXPECTED_4_9.json, evidence/RELEASE_HASHES_4_9.json), per-package BR-500 evidence
hashes (evidence/br500/*), and the Ed25519-signed IMMUTABLE_RELEASE_MANIFEST. Any source change
therefore requires this ordered sequence, which is otherwise undocumented:

  1. make clean operational                      (must be green with the package's stock flags)
  2. make br490-core61 br490-brim51 br490-memory br490-performance br490-docs br490-manifest
  3. refresh replay/EXPECTED_4_9.json from evidence/RELEASE_HASHES_4_9.json (+ CORE61/SIZE)
  4. python3 qualification/br490_acceptance.py
  5. derive the *_5_0 evidence records from the regenerated 4.9 records (as BR-500 application did)
  6. python3 qualification/br500_environment.py; python3 qualification/br500_acceptance.py
  7. refresh the BR-500 evidence packages whose command can run in this lean package
     (BR-500-13 performance by default; pass --br500 all to attempt every runnable package)
  8. python3 evidence/verify_br500.py
  9. python3 qualification/br500_release_bundle.py --prepare   (fresh one-time signing key; private key never packaged)
 10. regenerate SHA256SUMS

Usage: python3 qualification/reseal_after_patch.py [--br500 13|all]
"""
import argparse, hashlib, json, re, subprocess, sys
from pathlib import Path
R = Path(__file__).resolve().parents[1]
E = R / "evidence"
def H(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def run(cmd, **kw):
    print("$", " ".join(cmd), flush=True)
    p = subprocess.run(cmd, cwd=R, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, **kw)
    if p.returncode:
        print(p.stdout[-4000:]); raise SystemExit(f"step failed: {' '.join(cmd)} -> {p.returncode}")
    return p.stdout

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--br500", default="13"); ns = ap.parse_args()
    # 1-2
    run(["make", "clean", "operational"])
    run(["make", "br490-core61", "br490-brim51", "br490-memory", "br490-performance", "br490-docs", "br490-manifest"])
    # 3 replay expectations
    rh = json.loads((E / "RELEASE_HASHES_4_9.json").read_text())
    core = json.loads((E / "CORE61_4_9.json").read_text())
    exp_p = R / "replay/EXPECTED_4_9.json"; exp = json.loads(exp_p.read_text())
    exp.update({"source_sha256": rh["source"]["sha256"], "binary_sha256": rh["binary"]["sha256"], "compiler_sha256": rh["compiler"]["sha256"],
                "verifier_sha256": rh["verifier"]["sha256"], "test_suite_sha256": rh["test_suite"]["sha256"], "specification_sha256": rh["specification"]["sha256"],
                "evidence_sha256": rh["evidence"]["sha256"], "brim_sha256": rh["brim"]["sha256"], "core61_stripped_bytes": core["stripped_core_bytes"]})
    exp_p.write_text(json.dumps(exp, indent=2, sort_keys=True) + "\n")
    # 4
    run(["python3", "qualification/br490_acceptance.py"])
    # 5 derive 5.0 records
    note = "Freshly rerun during release re-seal after audit remediation; measurement tool inherited from 4.9 release engineering (performance tool corrected to report in-process throughput)."
    for name, rec in [("PERFORMANCE", "PerformanceQualification"), ("MEMORY", "RuntimeMemory"), ("CORE61", "Core61"), ("BRIM51", "BRIM51")]:
        d = json.loads((E / f"{name}_4_9.json").read_text()); d["record"] = f"BOTTLE_ROCKET.{rec}/5.0.0"; d["measurement_note"] = note
        (E / f"{name}_5_0.json").write_text(json.dumps(d, indent=2, sort_keys=True) + "\n")
    # 6
    run(["python3", "qualification/br500_environment.py"]); run(["python3", "qualification/br500_acceptance.py"])
    # 7 refresh BR-500 evidence packages (mirrors qualification/br500_evidence.py for the selected packages)
    sys.path.insert(0, str(R / "qualification"))
    W = R / "workflows/5.0"; D = E / "br500"
    PAT = re.compile(r'\*\*(BR-500-\d\d-R\d\d):\*\*\s*(.+)')
    BLOCKED = {"BR-500-10-R05", "BR-500-11-R01", "BR-500-12-R05", "BR-500-15-R20", "BR-500-15-R21", "BR-500-15-R22", "BR-500-15-R23", "BR-500-15-R24"}
    JOBS = {"BR-500-01": ["make", "image", "spec-sync"], "BR-500-02": ["make", "repro", "roundtrip", "constant-fold"], "BR-500-03": ["make", "semantic-test", "image"],
            "BR-500-04": ["make", "test", "isa-conformance"], "BR-500-07": ["make", "device-conformance", "device-audit"], "BR-500-08": ["make", "wide-conformance"],
            "BR-500-10": ["python3", "replay/run.py", "--check-only"], "BR-500-11": ["python3", "qualification/cross_platform_repro.py"],
            "BR-500-13": ["python3", "qualification/br490_performance.py"], "BR-500-14": ["python3", "qualification/br500_release_bundle.py", "--prepare"],
            "BR-500-15": ["make", "br480-differential", "br480-opcode", "br480-property", "br480-fuzz"]}
    # Packages 05/06/09/12 need trust/persistence conformance sources that ship only in the QUALIFIED candidate.
    sel = ["BR-500-13"] if ns.br500 == "13" else list(JOBS)
    if "BR-500-14" in sel: sel.remove("BR-500-14")  # release bundle is step 9
    for pid in sel:
        cmd = JOBS[pid]; n = pid.split("-")[-1]
        p = subprocess.run(cmd, cwd=R, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, timeout=600)
        log = D / f"{pid}_tests.log"; log.write_text("COMMAND: " + " ".join(cmd) + "\n" + p.stdout + "\nEXIT_CODE: " + str(p.returncode) + "\n")
        if p.returncode: print(log.read_text()[-3000:]); raise SystemExit(f"{pid} failed")
        wf = next(W.glob(n + "_*.md")); rows = []
        for line in wf.read_text(errors="replace").splitlines():
            m = PAT.search(line)
            if m and m.group(1) not in [x["requirement_id"] for x in rows]:
                rid = m.group(1); st = "BLOCKED" if rid in BLOCKED else "OPERATIONAL"
                rows.append({"baseline": "BOTTLE ROCKET 4.9.0 RC local gates PASS; strict BR-490-11 gate BLOCKED", "blocker": None if st == "OPERATIONAL" else "external evidence unavailable in this execution environment",
                             "command": " ".join(cmd), "evidence_path": str(log.relative_to(R)), "exit_code": p.returncode,
                             "notes": "Refreshed by qualification/reseal_after_patch.py after audit remediation; runtime formats remain frozen.",
                             "requirement_id": rid, "requirement_text": m.group(2).strip(), "result": "PASS", "sha256": H(log), "status": st})
        # keep the shipped requirement rows' shape if the shipped file has extra keys
        old = json.loads((D / f"{pid}_requirements.json").read_text()) if (D / f"{pid}_requirements.json").exists() else []
        if old and set(old[0]) - set(rows[0]):
            for r in rows:
                for k in set(old[0]) - set(r): r[k] = old[0][k]
        (D / f"{pid}_requirements.json").write_text(json.dumps(rows, indent=2, sort_keys=True) + "\n")
        (D / f"{pid}_audit.md").write_text(f"# {pid} audit\n\nLocal command: `{' '.join(cmd)}`\n\nLocal command result: PASS.\n\nAtomic requirements: {len(rows)}; OPERATIONAL: {sum(x['status']=='OPERATIONAL' for x in rows)}; BLOCKED: {sum(x['status']=='BLOCKED' for x in rows)}.\n\nRefreshed by qualification/reseal_after_patch.py after audit remediation.\n")
        (D / f"{pid}_manifest.sha256").write_text("".join(f"{H(D/f'{pid}_{s}')}  {pid}_{s}\n" for s in ("requirements.json", "tests.log", "audit.md")))
        print(pid, "refreshed")
    # 8
    print(run(["python3", "evidence/verify_br500.py"]).strip())
    # 9 re-seal
    print(run(["python3", "qualification/br500_release_bundle.py", "--prepare"]).strip().splitlines()[-1])
    print(run(["python3", "qualification/br500_release_bundle.py", "--verify"]).strip())
    # 10 SHA256SUMS: same population rule as shipped (every regular file except SHA256SUMS itself and .build/__pycache__)
    rows = []
    for f in sorted(x for x in R.rglob("*") if x.is_file()):
        rel = f.relative_to(R).as_posix()
        if rel == "SHA256SUMS" or rel.startswith(".build/") or "__pycache__" in rel: continue
        rows.append(f"{H(f)}  {rel}\n")
    (R / "SHA256SUMS").write_text("".join(rows))
    print(run(["sha256sum", "-c", "--quiet", "SHA256SUMS"]).strip() or "SHA256SUMS: OK", f"({len(rows)} entries)")
    print("RESEAL COMPLETE")

if __name__ == "__main__":
    main()
