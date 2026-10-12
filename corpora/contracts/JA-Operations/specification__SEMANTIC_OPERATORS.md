# Semantic Operator Registry

The registry is derived from the complete technical corpus. Counts indicate modeled use, not native compiler support.

| Operator | Records | Principal features | Effects | Capabilities |
|---|---:|---|---|---|
| `build` | 1000 | `msslb_packaging`, `workspace_build`, `environment`, `deployment_probe` | `ledger.append`, `file.write`, `secret.read` | `secret.read:reference_only`, `ledger.append`, `package.write` |
| `deploy` | 1000 | `reproducibility_policy`, `release_channel`, `clean_room_build`, `air_gapped_deployment` | `process.spawn`, `secret.read`, `network.connect` | `build.execute`, `deployment.modify:approved`, `network.connect:declared` |
| `install` | 1000 | `offline_deployment`, `deployment_timeline`, `metric`, `target_platform` | `deployment.modify`, `process.spawn`, `network.connect` | `secret.read:reference_only`, `package.write`, `ledger.append` |
| `observe` | 1000 | `network_binding`, `trace`, `lockfile`, `worker` | `ledger.append`, `file.write`, `secret.read` | `build.execute`, `network.connect:declared`, `deployment.modify:approved` |
| `package` | 1000 | `dependency`, `storage_binding`, `deployment_probe`, `target_platform` | `process.spawn`, `secret.read`, `network.connect` | `secret.read:reference_only`, `ledger.append`, `package.write` |
| `probe` | 1000 | `gpu_requirement`, `compiler_profile`, `air_gapped_deployment`, `worker` | `file.read`, `ledger.append`, `file.write` | `build.execute`, `deployment.modify:approved`, `network.connect:declared` |
| `resolve` | 1000 | `logging`, `rollback_rule`, `worker`, `landon_worker` | `file.read`, `ledger.append`, `file.write` | `build.execute`, `deployment.modify:approved`, `network.connect:declared` |
| `rollback` | 1000 | `project_build`, `resource_requirement`, `health_check`, `clean_room_build` | `network.connect`, `deployment.modify`, `ledger.append` | `build.execute`, `network.connect:declared`, `deployment.modify:approved` |
| `scale` | 1000 | `service`, `scaling_rule`, `upgrade_strategy`, `environment` | `process.spawn`, `secret.read`, `network.connect` | `secret.read:reference_only`, `ledger.append`, `package.write` |
| `upgrade` | 1000 | `artifact_repository`, `desktop_installer`, `secret_reference`, `metric` | `network.connect`, `deployment.modify`, `ledger.append` | `secret.read:reference_only`, `ledger.append`, `package.write` |
