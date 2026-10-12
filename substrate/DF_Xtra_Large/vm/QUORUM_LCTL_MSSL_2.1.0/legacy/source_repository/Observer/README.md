# JA21 Observer — Individual JA Agent Language Scripts

This package contains six standalone `.jaa` scripts for repository section `01. Observer`.

## Scripts

1. `01_observer_prompts.jaa` — observes prompt records and prompt-integrity findings.
2. `02_observer_uploads.jaa` — observes upload metadata, integrity, and routing.
3. `03_observer_runtime_events.jaa` — observes, correlates, and validates runtime events.
4. `04_observer_decisions.jaa` — observes decision basis, policy alignment, rationale, and approval.
5. `05_observer_errors.jaa` — observes errors, classifications, safety checks, recovery routing, and causes.
6. `06_observer_evidence.jaa` — observes claim-evidence links, provenance, strength, and the evidence ledger.

## Analytical roles

- **SOPHIA** performs semantic analysis, classification, correlation, and claim linkage.
- **CHARLOTTE** performs integrity, policy, safety, sequence, and provenance validation.
- **LANDON** routes normalized records into the observer ledger.
- **Professor** produces human-readable explanations and rationale.
- **Podium** publishes the internal audit/evidence output after required approval gates.

## JA21 profile alignment

The scripts follow the attached JA Agent Language corpus profile:

- `ja source 0.3`
- `use Agent`
- explicit `policy no_network`
- explicit agent identity, role, confidence goal, memory, and budget
- typed tools with approved capability requirements
- authorization before execution
- policy gating
- MCRT recording
- capability-boundary assertion
- deterministic goal termination

## Repository paths

Each script expects its corresponding stream beneath:

`repository/01_observer/`

The runtime may remap these paths if the host repository uses another root.
