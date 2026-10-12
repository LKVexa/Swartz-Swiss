# JA Security Policy Language — Provisional EBNF

```ebnf
program       = source_header, module_decl, use_decl, policy_mode, { declaration }, policy_block, { assertion }, emit_decl ;
source_header = "ja", "source", version ;
module_decl   = "module", qualified_name ;
use_decl      = "use", "Security" ;
policy_mode   = "policy", ("no_network" | "explicit_network") ;
declaration   = principal_decl | group_decl | role_decl | resource_decl | capability_decl ;
principal_decl= "principal", identifier ;
group_decl    = "group", identifier, "{", { identifier }, "}" ;
role_decl     = "role", identifier, "{", { grant_decl }, "}" ;
grant_decl    = "grant", qualified_name ;
resource_decl = "resource", identifier, "classification", identifier ;
policy_block  = "policy", identifier, "{", { rule }, "}" ;
rule          = allow_rule | deny_rule | require_rule | audit_rule | redact_rule | resolve_rule | delegate_rule | revoke_rule ;
allow_rule    = "allow", subject, ["when", expression] ;
deny_rule     = "deny", subject, ["when", expression], ["by", "default"] ;
require_rule  = "require", qualified_name, "for", qualified_name ;
audit_rule    = "audit", expression ;
redact_rule   = "redact", qualified_name ;
resolve_rule  = "resolve", "conflicts", identifier ;
delegate_rule = "delegate", qualified_name, "to", identifier, ["until", time] ;
revoke_rule   = "revoke", qualified_name, "from", identifier ;
assertion     = "assert", expression ;
emit_decl     = "emit", "mcrt", string ;
```

This grammar is a provisional publication profile inferred from the corpus, not an official production grammar.
