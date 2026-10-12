# JA Interface Runtime Contract

## Runtime responsibilities
- Instantiate a target adapter from a validated interface artifact.
- Allocate local and shared state under declared scopes.
- Propagate derived and reactive values deterministically.
- Resolve resources and localization bundles through approved adapters.
- Enforce capability and policy gates before commands or host bridges run.
- Maintain accessibility tree, focus order, keyboard workflow, and reduced-motion behavior.
- Synchronize animation, scene, timeline, and VFX bindings using declared clocks.
- Produce structured runtime events and an MCRT receipt.

## Sandbox baseline
- Network access is denied under `policy no_network`.
- Unknown-code execution is disabled.
- Secrets are redacted from diagnostics and receipts.
- File and host operations require explicit capabilities.
- Administrative actions require explicit approval evidence.
- Recovery is bounded and replay-visible.

## MCRT receipt minimum
The receipt records source hash, AST node, semantic judgment, R12 record,
target profile, observed effects, consumed capabilities, deterministic class,
policy status, result, causal parents, output identities, and certification status.

## Evidence limitation
The uploaded corpus models runtime results. This suite does not transform those
modeled results into claims of native execution.
