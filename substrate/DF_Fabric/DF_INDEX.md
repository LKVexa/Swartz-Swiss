# DF Containers -- index

**DF-PA21.2-1.0.0** -- the four container VMs (`Small.zip`, `Medium.zip`, `Large.zip`, `Xtra_Large.zip`) translated
into distributed-fabric container VMs in the language of the PA21.2 corpora (PA-LCTL 1.6.x, the
hyperfederated execution fabric), plus one fabric container that federates them.

Extract all five zips **into the same folder**; `DF_Fabric` finds its four nodes beside it.

```
DF_Small/       DF_Medium/      DF_Large/       DF_Xtra_Large/      DF_Fabric/
./BUILD         ./BUILD         ./BUILD         ./BUILD (no-op)     ./BUILD   (builds all four)
./VERIFY        ./VERIFY        ./VERIFY        ./VERIFY            ./VERIFY  (the fabric battery)
./RUN x.pal     ./RUN x.pal     ./RUN x.pal     ./RUN x.pal         ./RUN [bundle.pal] [--profile ...]
```

## Which container does what

| container | what it is | dialect | result | rows / lowering | gates (assembly host) | zip sha256 |
|---|---|---|---|---|---|---|
| `DF_Small` | BOTTLE ROCKET 3.0.0-MODEL | MSSL/ASM-1 | `R2` | 84 | pre-seal 16/18 · post-seal `./VERIFY` **18/18** | `d64085ac90f44b24...` |
| `DF_Medium` | BOTTLE ROCKET 5.0.0 (frozen 4.7.0 core, ISA 4.1) | LCTLC/1.1 | `R2` | 84 | pre-seal 18/20 · post-seal `./VERIFY` **20/20** | `7c57c6ce49f7ff4c...` |
| `DF_Large` | BOTTLE ROCKET 4.7.0 (BR/1.1, 61K) | LCTLC/1.2 | `R2` | 84 | pre-seal 16/18 · post-seal `./VERIFY` **18/18** | `7acac542729a118c...` |
| `DF_Xtra_Large` | QUORUM VM 5.0.0-candidate inside QUORUM LCTL/MSSL 2.1.0 | LCTLC/1.0 | `R0` | 21,843 | pre-seal 17/19 · post-seal `./VERIFY` **19/19** | `c0432c148083baf0...` |

"pre-seal" = the battery run from the delivered bytes before `MANIFEST.json`/`SHA256SUMS.txt` existed (its two hash
gates are SKIPPED by construction and every other gate PASSED); "post-seal" = the container's own `./VERIFY` launcher
run on the sealed container (records in `_assembly/`, delivered beside the zips). Every SKIPPED gate names its reason.

## Capability matrix (measured)

| container | compile source | sign images | trust chain | device ABI | deterministic replay | step bound |
|---|---|---|---|---|---|---|
| `DF_Small` | yes | yes | yes, root external (issuer-key admission, version monotonicity); no production authority included | APDU/1 (12 commands) via `serve`; offline, no network | yes (rebuilt image bit-identical to the shipped one) | 4096 steps in the CLI (BUDGET trap 8) |
| `DF_Medium` | yes | yes | yes | Device ABI 1.0, 8 device classes, per-run quotas; no network device by default | yes (release/bin rebuilt bit-identical; replay/EXPECTED checked) | 4096 steps in the CLI (trap 24); `max_steps` in the unit header is provenance |
| `DF_Large` | yes | yes, dev-mode | designed (BRTM/1: root -> BRTP/1 policy -> BRMF/1 manifest -> BRIM); no CLI provisioning path | Device ABI 1.0, 22 services, per-run quotas | yes (double clean build BUILD_A == BUILD_B; ledger hash mismatches 0) | 4096 steps in the CLI (BUDGET trap 8) |
| `DF_Xtra_Large` | yes | yes | flat trust store (key_id -> public key) with rollback floor; dev key ships in the package | services 0-3 legacy + 16-47 RC-PW world (semantic world ABI 3); no network device | yes (every step SHA-256-hashes the VM state into the trace; runs byte-identical to shipped evidence) | `--max-steps` (default 1,000,000; TRAP_RESOURCE beyond) |

`DF_Fabric`: pre-seal 14/16 (2 skipped: the two hash gates, by construction) on the assembly host -- replica, pipeline
and BSP fabric programs over all four nodes, cross-node differential agreement on every shipped
bundle, deterministic event-log replay in three profiles, load-balanced segment placement, the
dialect bridge, and the negative image-portability finding.

## The rule everything here is judged by

> No item is operational because its source file exists. Operational status requires native executable evidence satisfying that item's promotion gate.

Every OPERATIONAL item in every `reports/DF_CAPABILITY_LEDGER.json` cites a gate in that
container's `conformance/DF_GATE_RESULTS.json`; a gate that could not run on a host is SKIPPED
with its reason, never PASS. `./VERIFY` re-measures everything on your machine.

## What is not claimed, in one place

* No node has a qubit; every quantum feature is `UNSUPPORTED` and `native_gate_set()` is empty.
* `PHYSICAL_PARALLEL_QPU_EXECUTION` and `PHYSICAL_DISTRIBUTED_QPU_EXECUTION` are `BLOCKED_EXTERNAL_AUTHORITY`.
* The fabric is a model of a federation executed on **one host** with local processes (`NETWORK=deny`);
  `distributed_state` is capped at `DISTRIBUTED_CLASSICAL_EMULATION`.
* Every VM's own blockers (`strict_gate: BLOCKED`, `EXTERNAL_NOT_QUALIFIED`, `CONDITIONAL_EXTERNAL_AUTHORITY`,
  the 4.7.0 production CLI's refusal to run unprovisioned images) are inherited verbatim, not lifted.
* Images are not portable between nodes (measured); the fabric moves sealed rows and lowers per node.

## Provenance

Language corpora: the 22 `PA_*_PA21.2` packages and `PA21.2_EVIDENCE` as delivered on
`worklaptop1` (with the PA21.6/7/18/31 updates applied), digests in every container's
`authority/DF_SOURCE_AUTHORITY.json`. VM containers: the four zips in `Desktop/VMs`, digests in
each node container's `node/PAYLOAD_DIGEST.json`. `DF_SHA256SUMS.txt` beside this file binds the
five zips.
