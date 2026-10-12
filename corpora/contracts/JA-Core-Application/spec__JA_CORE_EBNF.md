# JA Core Application Language — Provisional EBNF

> This grammar is a publication aid reconstructed from corpus examples. It is not represented as the canonical production parser.

```ebnf
compilation_unit = source_header, module_decl, { import_decl | policy_decl | declaration | statement } ;
source_header    = "ja", "source", version ;
module_decl      = "module", qualified_name ;
import_decl      = ("use" | "import"), qualified_name ;
policy_decl      = "policy", identifier, [ argument_list ] ;

declaration      = constant_decl | record_decl | enum_decl | variant_decl
                 | function_decl | trait_decl | implementation_decl
                 | macro_decl | package_decl ;

constant_decl    = "const", identifier, ":", type_ref, "=", expression ;
record_decl      = "record", identifier, [ type_parameters ], "{", { field_decl }, "}" ;
enum_decl        = "enum", identifier, "{", enum_case, { ",", enum_case }, "}" ;
variant_decl     = "variant", identifier, "{", variant_case, { ",", variant_case }, "}" ;
function_decl    = ("function" | "func"), identifier, [ type_parameters ],
                   parameter_list, "->", type_ref, [ effects_clause ], block ;
trait_decl       = "trait", identifier, [ type_parameters ], "{", { function_signature }, "}" ;
implementation_decl = "impl", type_ref, [ "for", type_ref ], "{", { declaration }, "}" ;
macro_decl       = "macro", identifier, parameter_list, block ;
package_decl     = "package", qualified_name, block ;

effects_clause   = "effects", "{", [ identifier, { ",", identifier } ], "}" ;
capability_clause= "capabilities", "{", [ identifier, { ",", identifier } ], "}" ;
type_parameters  = "<", type_parameter, { ",", type_parameter }, ">" ;
type_parameter   = identifier, [ ":", constraint_list ] ;
parameter_list   = "(", [ parameter, { ",", parameter } ], ")" ;
parameter        = identifier, ":", type_ref ;
field_decl       = identifier, ":", type_ref, [ "," ] ;

statement        = let_stmt | assignment | return_stmt | assert_stmt | emit_stmt
                 | match_stmt | expression_stmt ;
let_stmt         = ("let" | "var"), identifier, [ ":", type_ref ], "=", expression ;
return_stmt      = "return", expression ;
assert_stmt      = "assert", expression ;
emit_stmt        = "emit", identifier, expression ;
match_stmt       = "match", expression, "{", { match_arm }, "}" ;
match_arm        = pattern, [ "if", expression ], "=>", expression, [ "," ] ;

expression       = literal | identifier | call | construction | member_access
                 | closure | await_expr | collection | expression, operator, expression ;
closure          = "|", [ parameter, { ",", parameter } ], "|", expression ;
await_expr       = "await", expression ;
block            = "{", { declaration | statement }, "}" ;
type_ref         = qualified_name, [ "<", type_ref, { ",", type_ref }, ">" ] ;
qualified_name   = identifier, { ".", identifier } ;
identifier       = letter, { letter | digit | "_" } ;
```
