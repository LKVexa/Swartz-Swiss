# JA Data Engine Runtime Contract

The runtime executes approved plans inside a sandbox. It consumes only declared capabilities, maintains deterministic test modes, bounds resource use, records checkpoints and recovery, and emits an MCRT receipt for every completed or denied execution.

Local file execution is distinct from network execution. Distributed work requires an explicit deployment profile; no worker may infer additional authority from its placement. Stream state, transaction state, shard assignment, and emitted artifacts must remain traceable to the originating plan and policy decision.
