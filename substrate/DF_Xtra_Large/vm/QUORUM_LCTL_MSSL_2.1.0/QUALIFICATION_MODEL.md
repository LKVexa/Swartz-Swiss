# Qualification Model — 2.1.0 Open-Gate Profiles

Qualification now uses two independent axes: **gate availability** and **certification profile**. A gate is OPEN when the repository contains a runnable evidence path for that level. OPEN is not synonymous with production certification.

| Level | Availability | Evidence-backed profile | Production/external boundary |
|---|---|---|---|
| L4 | OPEN | Reference-domain fixture execution: 66/66 PASS | Production domain fidelity not claimed |
| L5 | OPEN | Legacy source/contract differential: 66/66 PASS | Executable legacy-runtime equivalence unavailable |
| L6 | OPEN | Exact reference-domain replay: 66/66 PASS; native LCTL replay evidence retained | Production-domain replay not claimed |
| L7 | OPEN | Reference security: 66/66 PASS; native failure/recovery evidence retained | Production attack-surface certification not claimed |
| L8 | OPEN | Measured deterministic reference runtime: 66/66 PASS; native LCTL benchmark evidence retained | Production workload performance not claimed |
| L9 | OPEN | Local/offline reference operational profile and five cross-plane scenarios PASS | Physical distributed profile requires external authenticated authority/receipts |

The former strict sequential coupling is retired. Evidence from one level may be evaluated independently without falsely converting unavailable evidence in another profile into PASS.
