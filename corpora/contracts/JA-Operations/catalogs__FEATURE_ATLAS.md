# JA Operations Feature Atlas

The atlas organizes all 32 language features into five operational learning tracks. Counts refer to the complete 10,000-record corpus; curated counts refer to the 1,000-script laboratory pack.

## Build Foundations

| Feature | Corpus | Curated | Pass | Expected fail | Dominant semantic operator |
|---|---:|---:|---:|---:|---|
| `workspace_build` | 312 | 1 | 232 | 80 | `build` |
| `project_build` | 312 | 61 | 234 | 78 | `rollback` |
| `dependency` | 314 | 1 | 237 | 77 | `package` |
| `lockfile` | 312 | 61 | 232 | 80 | `observe` |
| `compiler_profile` | 312 | 61 | 233 | 79 | `probe` |
| `target_platform` | 313 | 1 | 235 | 78 | `install` |
| `environment` | 312 | 1 | 235 | 77 | `build` |

## Resources and Services

| Feature | Corpus | Curated | Pass | Expected fail | Dominant semantic operator |
|---|---:|---:|---:|---:|---|
| `resource_requirement` | 313 | 61 | 235 | 78 | `rollback` |
| `gpu_requirement` | 313 | 62 | 236 | 77 | `probe` |
| `service` | 312 | 1 | 233 | 79 | `scale` |
| `worker` | 314 | 61 | 237 | 77 | `resolve` |
| `landon_worker` | 312 | 62 | 232 | 80 | `resolve` |
| `scaling_rule` | 314 | 1 | 238 | 76 | `scale` |

## Observability and Reliability

| Feature | Corpus | Curated | Pass | Expected fail | Dominant semantic operator |
|---|---:|---:|---:|---:|---|
| `health_check` | 312 | 61 | 234 | 78 | `rollback` |
| `metric` | 313 | 1 | 236 | 77 | `install` |
| `logging` | 312 | 61 | 232 | 80 | `resolve` |
| `trace` | 312 | 61 | 234 | 78 | `observe` |
| `deployment_probe` | 312 | 1 | 232 | 80 | `package` |
| `rollback_rule` | 313 | 62 | 236 | 77 | `resolve` |

## Deployment and Release

| Feature | Corpus | Curated | Pass | Expected fail | Dominant semantic operator |
|---|---:|---:|---:|---:|---|
| `deployment_timeline` | 312 | 1 | 234 | 78 | `install` |
| `release_channel` | 313 | 62 | 237 | 76 | `deploy` |
| `upgrade_strategy` | 312 | 1 | 232 | 80 | `scale` |
| `network_binding` | 313 | 61 | 236 | 77 | `observe` |
| `storage_binding` | 312 | 1 | 232 | 80 | `package` |
| `secret_reference` | 312 | 1 | 234 | 78 | `upgrade` |

## Packaging, Reproducibility, and Air Gap

| Feature | Corpus | Curated | Pass | Expected fail | Dominant semantic operator |
|---|---:|---:|---:|---:|---|
| `msslb_packaging` | 313 | 1 | 236 | 77 | `build` |
| `desktop_installer` | 313 | 1 | 237 | 76 | `upgrade` |
| `artifact_repository` | 312 | 1 | 234 | 78 | `upgrade` |
| `reproducibility_policy` | 312 | 63 | 232 | 80 | `deploy` |
| `clean_room_build` | 313 | 62 | 236 | 77 | `deploy` |
| `offline_deployment` | 312 | 1 | 233 | 79 | `install` |
| `air_gapped_deployment` | 312 | 62 | 234 | 78 | `probe` |
