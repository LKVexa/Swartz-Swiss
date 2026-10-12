# AUDIT_ERRATA — findings that could not or should not be fixed in code

Produced by the August 2026 audit of the BOTTLE ROCKET / QUORUM packages. Findings F1–F8 were remediated in the
patched packages (see CHANGES_AUDIT_FIXES.md in the fixes bundle). The items below are recorded here so that the
package tells the truth about them.

## F9 — "ISA 4.1" names two different instruction sets

Two divergent lineages both call themselves BOTTLE ROCKET 4.7.0:

| Package | Header / spec authority | Opcodes | ABI | Source dialect | Compiler |
|---|---|---|---|---|---|
| Large.zip (BOTTLE_ROCKET_4.7.0_..._61K) | `BR_ISA_MAJOR=1, BR_ISA_MINOR=1` (BR/1.1, marker 21), `BR_ABI_VERSION=2`; spec/BR_SPEC.json isa 1.1, 41 opcodes, abi 2, 22 services | 41 | 2 | LCTLC/1.2 | tools/lctl430.py (Python) |
| Medium.zip (BOTTLE_ROCKET_5.0.0_VM_110K_RC, "frozen 4.7 core") | `BR_ISA_MAJOR=4, BR_ISA_MINOR=1` (ISA 4.1), `BR_ABI_VERSION=0x00010000` (ABI 1.0); spec/BR_SPEC.json isa 4.1, 32 opcodes, 20 services | 32 | 1.0 | LCTLC/1.1 | src/brlctlc.c (native C) |

The Large.zip README is self-consistent (BR/1.1 + ABI/2 + LCTLC/1.2). The expository note BR-EXN-02 (Large.pdf)
labels the same package "ISA 4.1, ABI 2, Device ABI 1.0": the ISA label there is wrong for the code it describes.
Readers should treat "ISA 4.1" as meaning the 5.0.0-lineage instruction set (32 opcodes) and "BR/1.1" as the
Large.zip instruction set (41 opcodes). The two are not binary compatible and their LCTLC dialects (1.1 vs 1.2)
reject each other on the first line.

## F10 — compacted C sources

5.0.0 and 4.7.0 ship minified C (single lines of up to 35,170 and 5,966 characters; identifiers such as N46, Z22, K7)
to stay inside the 110,000-/61,000-byte source ceilings. GCC disables column tracking on these files, warnings lose
their location, and human review is impractical. `include/brvm_compat_names.h` (5.0.0) maps the compacted names but
does not restore readable code. Not remediable without the un-minified sources; the recommended fix is readable
sources plus a build-time minifier that is itself checked into the package.

## F11 — evidence ledgers are toolchain-bound

Both C packages bind their evidence to the hashes of binaries built on one compiler. The patched packages were
re-qualified on Ubuntu GCC 13.3 / OpenSSL 3.0.13 (see the regenerated TOOLCHAIN/ENVIRONMENT records); on any other
toolchain `make qualify` (4.7.0) and the 4.9 replay expectations (5.0.0) must be regenerated with the scripts added
by this remediation (`tools/regenerate_evidence470.py`, `qualification/reseal_after_patch.py`). Local rebuilds are
byte-identical on the same toolchain (BUILD_A == BUILD_B) — the ledgers are deterministic, just not portable.

## F12 — corpus negative class not testable by row-wrapping

64 of the 512 Columned-LCTL corpus negatives (class `header_outside_frame`) are accepted by the LCTL 1.6.1
column-verify once the sample row is placed inside a valid frame, because the sample *is* a header line and the
verifier tolerates a repeated header inside a frame. This is a property of the corpus fixture and the reference
verifier, not of any VM. All 448 remaining negatives are rejected by the reference verifier and by every VM
front-end; all 512 are rejected by every VM front-end.

## Corpora

No VM in this set can execute the Columned-LCTL corpus (quantum-circuit programs for the LCTL 1.6.1 Java runtime)
or the MSSL writers' corpus (sealed semantic documents, not code). Each VM accepts only its own dialect. This is
recorded as a scope statement rather than a defect; a translator from LCTLC/1.0 vm-rows to LCTLC/1.1 would give
the 5.0.0 core a route to the corpus's machine datasets.
