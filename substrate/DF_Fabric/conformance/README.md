# conformance/ (DF_Fabric)

`DF_GATE_RESULTS.json` is what the assembly host measured with `adapter/dfabric/gates.py::run_fabric_battery` over the four node containers built beside this one -- the same battery `./VERIFY` runs. `logs/` holds every fabric run record (`fabric_run_*.json`: per-node witnesses, placement ledger, BSP supersteps, collective schedules, the sealed event log hash and its replay self-check) and the core selfcheck output. `G0.1`/`G0.2` predate the seal here and PASS in the post-seal record.
