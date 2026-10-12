# QUORUM Common Evidence Contract

Every one of the 315 requirements must emit a dedicated evidence receipt.

Minimum fields:

```json
{
  "requirement_id": "",
  "stage": 0,
  "old_status": "PARTIAL",
  "new_status": "",
  "claimed_profile": "",
  "implementation_paths": [],
  "semantic_contracts": [],
  "test_family": [],
  "test_commands": [],
  "exit_codes": [],
  "positive_cases": [],
  "boundary_cases": [],
  "negative_cases": [],
  "fault_injection": [],
  "deterministic_replay": {},
  "canonical_digest_before": "",
  "canonical_digest_after": "",
  "semantic_ledger_digest": "",
  "resource_profile": {},
  "tool_versions": {},
  "evidence_paths": [],
  "evidence_sha256": [],
  "blockers": [],
  "notes": ""
}
```

## OPERATIONAL predicate

A PARTIAL requirement may become OPERATIONAL only when:

1. the actual target implementation contains the required behavior;
2. all requirement-specific positive/boundary/negative tests pass;
3. relevant replay/recovery/property/performance tests pass;
4. prior passing VM/RC-PW tests remain passing;
5. evidence is fresh and hash-bound;
6. the evidence profile is sufficient for the requirement;
7. no unresolved critical correctness defect contradicts the claim.

If a higher profile is required but unavailable, keep the higher-profile cell PARTIAL/BLOCKED rather than falsifying evidence.
