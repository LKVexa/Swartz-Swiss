# BOTTLE ROCKET 4.9.0 Independent Replay Package

This directory is the handoff surface for an independent builder/operator. `run.py --check-only` validates package completeness without claiming independence. `run.py --execute` performs the deterministic local replay: checksum/freeze checks, clean operational build, Core-61, BRIM-51, documentation checks, source/image hash comparison, and secure execution. A real BR-490-11-R09 PASS requires this package to be run by an independent operator on an independent machine; a successful local run is necessary but not sufficient.
