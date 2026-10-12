# COLUMNED LCTL QVM Profile 1

QVM source remains valid LCTL-C 1.0 and is first passed through the bundled `column-verify` canonical verifier. VM instructions are carried by rows whose `LANE` is `vm` and whose LCTL operation is `REG`. The instruction contract is encoded in the `ARG` cell using deterministic key/value fields such as:

`vm.op=ADD;dst=R3;a=R1;b=R2;mode=exact`

This profile deliberately does not patch or weaken the canonical LCTL verifier. The QVM compiler performs a second, VM-specific semantic verification before lowering into `QVM-BRIR/1`, then into QBRIM 2. The source hash is carried into both artifacts.

This is an executable source authority for the QVM compiler, but it is not a claim that QVM ISA semantics have become native semantic primitives inside the upstream LCTL Java runtime.
