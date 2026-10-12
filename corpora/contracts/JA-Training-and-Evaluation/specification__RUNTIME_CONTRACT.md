# JA Training Runtime Contract

The runtime consumes an accepted R12 experiment plan, resolves only authorized local artifacts, establishes deterministic seeds, records software and hardware provenance, runs training and evaluation as separate phases, writes complete checkpoints, applies registry decisions only after evaluation, and emits an MCRT lineage receipt.

The runtime must preserve partial evidence on failure and must never convert an execution success into an automatic promotion.
