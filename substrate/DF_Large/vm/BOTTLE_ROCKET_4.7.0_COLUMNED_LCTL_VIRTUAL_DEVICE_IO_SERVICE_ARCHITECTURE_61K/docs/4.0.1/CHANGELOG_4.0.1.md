# BOTTLE ROCKET 4.0.1 change log

## Truth and size accounting
- Replaced the ambiguous legacy repository-size gate with explicit source-repository, deterministic packed-source ZIP, release executable, stripped executable, debug executable, BRIM, LCTL-source, generated-evidence, and production-source measurements.
- Defined the <61,000-byte boundary as production source required to build/operate the host-reference VM: `Makefile`, `host/brctl.c`, `src/**`, and `spec/**`. Qualification tools, tests, evidence, build outputs, and deploy outputs are measured separately and are not required runtime behavior.
- Kept BRIM independently capped at 51,200 bytes.

## Runtime memory truth
- Corrected the 4.0.0 wide-stack omission. Runtime accounting now includes all 256 × 1,048,576-bit stack words, the 16-register bank, two scratch words, update/fragment buffer, VM inline state, allocator-usable sizes/overhead, RSS, and native stack evidence.
- Added per-subsystem process high-water measurements for execution, assembly/parser, cryptographic verification, and persistence/recovery paths.

## Verification and fail-closed LCTL handling
- Made local strict LCTL-C 1.0 verification mandatory before image generation.
- Added rejection tests for unsupported language versions, malformed column counts, duplicate/ambiguous `br.*` fields, unknown `br.*` fields, malformed immediates, missing mode metadata, and noncanonical ordering.
- Hardened `brctl assemble` to reject malformed BR metadata, extra columns, unsupported LCTLC versions, malformed headers, and malformed numeric immediates.

## Reproducibility, performance, and evidence
- Added deterministic clean-build comparison, deterministic BRIM comparison, deterministic source archives with fixed timestamps/ordering, build-artifact hashing, toolchain/dependency capture, and stack-usage capture.
- Added direct VM performance baselines for instruction, wide arithmetic, load/store, and branch execution plus command-path timing for signature verification, BRIM load/execute, startup, persistence commit, recovery, and replay rejection.
- Replaced manually maintained PASS evidence with generated JSON/Markdown/log/hash artifacts and a 94-row operational ledger covering BR-401-01 through BR-401-09.
