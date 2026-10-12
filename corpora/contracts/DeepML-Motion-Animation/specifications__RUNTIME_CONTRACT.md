
# DeepML Motion/Animation Runtime Contract

The runtime executes only compiler-admitted motion packages and records deterministic evidence for each update, transition, solver pass, and integration boundary.

## Core duties

- Verify package, source, semantic, R12, and MCRT identities.
- Enforce deterministic and no-network policies.
- Evaluate transforms in a declared hierarchy and coordinate order.
- Sample clips and curves using the declared clock, rate, interpolation, and boundary rules.
- Normalize blends and apply masks in stable order.
- Run IK and constraints with bounded iteration, tolerances, and explicit failure results.
- Preserve root motion, contacts, retarget state, procedural seeds, and physics handoffs.
- Record state-machine transitions, motion-matching choices, trajectory inputs, and tie-break decisions.
- Coordinate scene, timeline, portal, cinematic, and crowd adapters through versioned interfaces.
- Emit output hashes or declared tolerance evidence together with a replay trace.

## Failure discipline

A policy denial, invalid rig, missing bind pose, nonconvergent IK solve, foot-slide tolerance failure, unreachable state, invalid retarget map, replay mismatch, or unsupported adapter is evidence. The runtime stops at the declared boundary and reports the source identity, stage, diagnostic, state snapshot, and replay context.
