# JA Security Policy Feature Atlas

The atlas organizes all 32 policy features into five learning tracks. Corpus counts refer to all 10,000 records; curated counts refer to the 1,000-program pack.

## Identity and Authority

| Feature | Corpus | Curated | Pass | Expected fail | Dominant operator |
|---|---:|---:|---:|---:|---|
| `principal` | 312 | 1 | 232 | 80 | `principal_declare` |
| `identity` | 312 | 61 | 234 | 78 | `classify` |
| `group` | 312 | 61 | 233 | 79 | `audit` |
| `role` | 313 | 1 | 235 | 78 | `authorize` |
| `capability` | 314 | 1 | 237 | 77 | `allow` |
| `scope` | 312 | 1 | 235 | 77 | `principal_declare` |

## Policy Decision Rules

| Feature | Corpus | Curated | Pass | Expected fail | Dominant operator |
|---|---:|---:|---:|---:|---|
| `allow_rule` | 313 | 61 | 235 | 78 | `classify` |
| `deny_rule` | 312 | 1 | 233 | 79 | `require` |
| `require_rule` | 314 | 61 | 237 | 77 | `capability_declare` |
| `conflict_resolution` | 312 | 62 | 234 | 78 | `audit` |
| `policy_composition` | 313 | 1 | 237 | 76 | `delegate` |
| `explanation` | 312 | 62 | 232 | 80 | `capability_declare` |

## Delegation and Permission Lifecycle

| Feature | Corpus | Curated | Pass | Expected fail | Dominant operator |
|---|---:|---:|---:|---:|---|
| `delegation` | 313 | 61 | 236 | 77 | `explain` |
| `attenuation` | 312 | 1 | 232 | 80 | `allow` |
| `revocation` | 313 | 62 | 236 | 77 | `audit` |
| `time_bound_permission` | 312 | 1 | 234 | 78 | `delegate` |
| `human_approval` | 312 | 1 | 233 | 79 | `authorize` |
| `agent_policy` | 313 | 62 | 237 | 76 | `deny` |
| `tool_policy` | 312 | 1 | 234 | 78 | `delegate` |
| `model_access_policy` | 312 | 61 | 234 | 78 | `explain` |

## Data, Secrets, and Sandboxes

| Feature | Corpus | Curated | Pass | Expected fail | Dominant operator |
|---|---:|---:|---:|---:|---|
| `resource` | 312 | 61 | 232 | 80 | `explain` |
| `data_classification` | 312 | 61 | 234 | 78 | `classify` |
| `secret_policy` | 313 | 1 | 236 | 77 | `authorize` |
| `redaction` | 312 | 1 | 234 | 78 | `authorize` |
| `retention_rule` | 314 | 1 | 238 | 76 | `require` |
| `deletion_rule` | 312 | 61 | 232 | 80 | `capability_declare` |
| `network_sandbox` | 312 | 1 | 232 | 80 | `require` |
| `process_sandbox` | 313 | 62 | 236 | 77 | `capability_declare` |

## Enforcement and Assurance

| Feature | Corpus | Curated | Pass | Expected fail | Dominant operator |
|---|---:|---:|---:|---:|---|
| `runtime_enforcement` | 313 | 1 | 236 | 77 | `principal_declare` |
| `static_proof` | 312 | 63 | 232 | 80 | `deny` |
| `audit_rule` | 312 | 1 | 232 | 80 | `allow` |
| `fail_closed` | 313 | 62 | 236 | 77 | `deny` |
