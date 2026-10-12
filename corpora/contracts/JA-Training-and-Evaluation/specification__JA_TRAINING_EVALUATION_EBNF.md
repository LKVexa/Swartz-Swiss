# Provisional JA Training and Evaluation EBNF

```ebnf
program          = header, module_decl, training_import, policy_decl, experiment_decl, assertion, emission ;
header           = "ja", "source", version ;
module_decl      = "module", qualified_name ;
training_import  = "use", "Training" ;
policy_decl      = "policy", "no_network" ;
experiment_decl  = "experiment", identifier, "{", experiment_item*, "}" ;
experiment_item  = model_ref | dataset_ref | preprocess | augmentation | objective | loss | optimizer
                 | scheduler | batch_rule | precision | seed | checkpoint | evaluation | registry_rule ;
model_ref        = "model", "ref", string ;
dataset_ref      = "dataset", "ref", string, split? ;
split            = "split", ratio_assignment+ ;
preprocess       = "preprocess", identifier ;
augmentation     = "augment", identifier, argument* ;
objective        = "objective", identifier, argument* ;
loss             = "loss", identifier, argument* ;
optimizer        = "optimizer", identifier, argument* ;
scheduler        = "scheduler", identifier, argument* ;
batch_rule       = "batch", "size", integer, ("accumulate", integer)? ;
precision        = "precision", ("full" | "mixed" | identifier) ;
seed             = "seed", integer ;
checkpoint       = "checkpoint", "every", integer, ("steps" | "epochs") ;
evaluation       = "evaluate", "{", evaluation_item*, "}" ;
evaluation_item  = metric | requirement | robustness | safety ;
metric           = "metric", identifier, argument* ;
requirement      = "require", expression ;
robustness       = "robustness", identifier, argument* ;
safety           = "safety", identifier, argument* ;
registry_rule    = "registry", ("promote" | "reject" | "rollback"), condition ;
assertion        = "assert", expression ;
emission         = "emit", "mcrt", string ;
argument         = identifier, value ;
ratio_assignment = identifier, "=", number ;
condition        = expression ;
expression       = ? typed JA expression ? ;
qualified_name   = identifier, (".", identifier)* ;
identifier       = letter, (letter | digit | "_")* ;
version          = digit+, ".", digit+, (".", digit+)? ;
string           = '"', ? characters ?, '"' ;
integer          = digit+ ;
number           = digit+, (".", digit+)? ;
value            = string | number | identifier ;
```

This grammar is a publication aid reconstructed from the corpus. It is not claimed as the output of a native JA parser generator.
