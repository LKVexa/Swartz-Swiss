# Semantic Operator Registry

Derived from all 10,000 records; counts model corpus use, not native support.

| Operator | Records | Features | Effects | Capabilities |
|---|---:|---|---|---|
| `allow` | 1000 | `capability`, `audit_rule`, `attenuation`, `role` | `state.read` | `approval.verify`, `ledger.append`, `policy.enforce` |
| `audit` | 1000 | `revocation`, `group`, `conflict_resolution`, `require_rule` | `ledger.append` | `policy.evaluate`, `secret.reference`, `delegation.issue:bounded` |
| `authorize` | 1000 | `human_approval`, `redaction`, `secret_policy`, `role` | `state.write` | `approval.verify`, `policy.enforce`, `ledger.append` |
| `capability_declare` | 1000 | `deletion_rule`, `process_sandbox`, `require_rule`, `explanation` | `pure` | `policy.evaluate`, `secret.reference`, `delegation.issue:bounded` |
| `classify` | 1000 | `identity`, `allow_rule`, `data_classification`, `fail_closed` | `state.read` | `policy.evaluate`, `delegation.issue:bounded`, `secret.reference` |
| `delegate` | 1000 | `tool_policy`, `policy_composition`, `time_bound_permission`, `secret_policy` | `pure` | `approval.verify`, `ledger.append`, `policy.enforce` |
| `deny` | 1000 | `static_proof`, `agent_policy`, `fail_closed`, `conflict_resolution` | `state.write` | `policy.evaluate`, `secret.reference`, `delegation.issue:bounded` |
| `explain` | 1000 | `delegation`, `model_access_policy`, `resource`, `require_rule` | `secret.read` | `policy.evaluate`, `delegation.issue:bounded`, `secret.reference` |
| `principal_declare` | 1000 | `runtime_enforcement`, `principal`, `scope`, `attenuation` | `ledger.append` | `approval.verify`, `ledger.append`, `policy.enforce` |
| `require` | 1000 | `deny_rule`, `retention_rule`, `network_sandbox`, `scope` | `secret.read` | `approval.verify`, `ledger.append`, `policy.enforce` |
