# core/

The PA-LCTL reference core carried from the corpora, unchanged (DF-PA21.2-1.0.0).

* `reference/pacore/` -- PA-LCTL 1.6.x reference implementation (lang, fabric, adapters, ledgers, ...); the authority every spec document defers to. Pinned by `PACORE_DIGEST.json`.
* `spec/` -- the 30 PA-LCTL specification documents.
* `examples/` -- the corpora's six `.pal` programs.

Run it yourself: `python3 -B -m reference.pacore.cli selfcheck` from this directory.
