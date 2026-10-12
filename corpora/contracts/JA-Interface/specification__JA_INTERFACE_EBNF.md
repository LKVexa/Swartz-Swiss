# Provisional JA Interface Language EBNF

> Status: suite-level provisional grammar reconstructed from the corpus. It is a
> conformance target, not evidence of acceptance by a native parser.

```ebnf
compilation_unit  = source_header, module_decl, { use_decl | policy_decl }, interface_decl,
                    { assertion }, emit_decl ;

source_header     = "ja", "source", version ;
module_decl       = "module", qualified_name ;
use_decl          = "use", identifier ;
policy_decl       = "policy", identifier, [ policy_value ] ;

interface_decl    = "interface", identifier, "{", { interface_member }, "}" ;
interface_member  = state_decl | shared_state_decl | property_decl | slot_decl
                  | derived_decl | reactive_decl | component_decl | navigation_decl
                  | resource_decl | target_decl | theme_decl | localization_decl ;

state_decl        = "state", identifier, ":", type_ref, [ "=", expression ] ;
shared_state_decl = "shared", "state", identifier, ":", type_ref, [ "=", expression ] ;
property_decl     = "property", identifier, ":", type_ref, [ "=", expression ] ;
slot_decl         = "slot", identifier, ":", type_ref ;
derived_decl      = "derived", identifier, "=", expression ;
reactive_decl     = "reactive", identifier, "=", expression ;

component_decl    = "component", identifier, "{", { component_member }, "}" ;
component_member  = property_assignment | binding_decl | action_decl | accessibility_decl
                  | layout_decl | motion_decl | embed_decl | component_decl ;

property_assignment = identifier, expression ;
binding_decl      = identifier, "bind", expression ;
action_decl       = "action", identifier, [ "requires", capability_ref ] ;
accessibility_decl= "accessibility", "role", identifier, "name", string ;
layout_decl       = "layout", identifier, { expression } ;
motion_decl       = ("animation" | "motion" | "vfx"), "bind", qualified_name ;
embed_decl        = "embed", qualified_name, string ;

navigation_decl   = "navigation", identifier, "{", { route_decl }, "}" ;
route_decl        = "route", string, "=>", identifier ;
resource_decl     = "resource", identifier, "from", string ;
target_decl       = "target", ("desktop" | "mobile" | "web" | "headless"), "{",
                    { property_assignment }, "}" ;
theme_decl        = "theme", identifier, "{", { property_assignment }, "}" ;
localization_decl = "localization", identifier, "from", string ;

assertion         = "assert", expression, "==", literal ;
emit_decl         = "emit", "interface", identifier ;

capability_ref    = qualified_name, ":", identifier ;
type_ref          = qualified_name, [ "?" ] ;
expression        = literal | qualified_name | unary_expr | binary_expr | call_expr ;
unary_expr        = ("not" | "-"), expression ;
binary_expr       = expression, operator, expression ;
call_expr         = qualified_name, "(", [ expression, { ",", expression } ], ")" ;
operator          = "and" | "or" | "==" | "!=" | "<" | ">" | "<=" | ">=" | "+" | "-" ;
literal           = string | number | "true" | "false" | "null" ;
qualified_name    = identifier, { ".", identifier } ;
identifier        = letter, { letter | digit | "_" } ;
version           = digit, { digit | "." } ;
string            = '"', { character }, '"' ;
number            = [ "-" ], digit, { digit }, [ ".", digit, { digit } ] ;
```

## Required validation layers

1. Lexical and syntactic validity.
2. Module/import and symbol resolution.
3. Type checking for properties, slots, state, expressions, and bindings.
4. Effect and capability checking for commands, services, files, network, and host bridges.
5. Binding-cycle and dependency-graph validation.
6. Layout solvability and target-profile compatibility.
7. Accessibility requirements for interactive components.
8. Resource, localization, and target-resolution checks.
9. R12 identity construction and MCRT provenance preparation.
