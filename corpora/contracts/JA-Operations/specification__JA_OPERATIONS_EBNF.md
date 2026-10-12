# JA Operations Language — Provisional EBNF

```ebnf
program          = source_header, module_decl, use_decl, policy_decl, workspace_decl,
                   { assertion }, emit_decl ;
source_header    = "ja", "source", version ;
module_decl      = "module", qualified_name ;
use_decl         = "use", "Operations" ;
policy_decl      = "policy", ("explicit_network" | "no_network") ;
workspace_decl   = "workspace", identifier, "{", { workspace_item }, "}" ;
workspace_item   = target_decl | compiler_decl | dependency_decl | environment_decl |
                   resource_decl | network_decl | secret_decl | service_decl |
                   health_decl | upgrade_decl | rollback_decl | package_decl |
                   storage_decl | metric_decl | log_decl | trace_decl ;
target_decl      = "target", identifier ;
compiler_decl    = "compiler", "profile", identifier ;
dependency_decl  = "dependencies", ("locked" | "declared") ;
environment_decl = "environment", identifier ;
resource_decl    = "resource", "cpu", integer, "memory", size, ["gpu", integer] ;
network_decl     = "network", ("disabled" | "declared" | "implicit") ;
secret_decl      = "secret", identifier, "reference", string ;
service_decl     = "service", identifier, "replicas", integer ;
health_decl      = "health_check", identifier, "every", duration ;
upgrade_decl     = "upgrade", identifier ;
rollback_decl    = "rollback", "on", identifier ;
package_decl     = "package", identifier ;
assertion        = "assert", expression ;
emit_decl        = "emit", ("package" | "deployment" | "installer"), string ;
```

This grammar is a provisional publication profile inferred from the corpus. It is not represented as an official production grammar.
