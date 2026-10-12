# Size Boundary

The release gate is unchanged from 4.2.0: sum every regular file under `src/`, `adapters/`, and `spec/`, plus `Makefile`; require the result to be strictly less than 61,000 bytes. Tools, tests, documentation, generated deploy images and generated evidence are not production-source bytes. They are retained and separately measured, not used to hide production implementation.
