# Offline Tools

```text
python tools/inspect_corpus.py corpus/technical/deepml_logic_functional_technical_corpus_10000.jsonl.gz --topic theorem --limit 5
python tools/validate_suite.py
```

Both tools use only the Python standard library and make no network calls. The validator confirms packaging, hashes, policies, braces, counts, and coverage. It is not a DeepML compiler.
