# evidence index (DF_Fabric)

| question | file |
|---|---|
| what was measured over the four nodes, and did it pass? | `conformance/DF_GATE_RESULTS.json` (+ `conformance/logs/fabric_run_*.json`) |
| what is claimed, item by item? | `reports/DF_CAPABILITY_LEDGER.json` / `.md` |
| what does NOT work, and why? | `reports/DF_BLOCKED_REGISTER.md` |
| which container does what (the index)? | `DF_INDEX.md` |
| the federation, the topology, the pinned nodes | `fabric/FEDERATION.json`, `fabric/TOPOLOGY.json`, `fabric/NODES.json` |
| the fabric as a PA-LCTL bundle | `fabric/FABRIC.pal` (+ `FABRIC_SEAL.json`) |
| how VM concepts map to fabric constructs | `spec/DF_LANGUAGE_MAP.md`, `spec/DF_FABRIC_SPEC.md` |
| every translated claim as a record | `corpus/DF_Fabric_Translation_Corpus.jsonl.gz` |
| per-node evidence | `../DF_<node>/conformance/DF_GATE_RESULTS.json` |
