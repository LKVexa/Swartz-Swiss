# QUORUM Requirement-Evidence Classifier Replacement

## Problem

The current `vm/world/qualification/qualify_world.py` derives requirement status from words appearing in requirement prose. This is not a valid qualification authority.

A requirement such as “canonical coordinates are independent of render coordinates” is not asking for an external independent laboratory. Therefore the word `independent` must not force BLOCKED.

## Replacement model

Create a machine-readable evidence registry:

```text
requirement_id
required_profile
applicability
required_evidence[]
required_commands[]
required_tests[]
pass_predicate
partial_predicate
blocked_predicate
failure_predicate
```

Status derivation must be:

```text
if capability_not_applicable_to_claimed_profile:
    NOT_APPLICABLE
elif mandatory_capability_missing:
    BLOCKED
elif mandatory_test_executed_and_failed:
    REGRESSED or FAIL
elif all_required_evidence_fresh_and_pass:
    OPERATIONAL
elif implementation_exists_but_evidence_incomplete:
    PARTIAL
else:
    NOT_STARTED
```

## Evidence freshness

Every evidence object must carry:

- build/release hash;
- world-package hash;
- source commit/package hash if available;
- tool/runtime versions;
- test command;
- exit code;
- timestamp;
- qualification profile;
- evidence SHA-256.

## Non-negotiable rule

**Do not solve the 26 blockers by deleting `blocked_terms` and changing labels.**  
The classifier change removes false semantics; the 26 gate workflows supply the missing direct proof.
