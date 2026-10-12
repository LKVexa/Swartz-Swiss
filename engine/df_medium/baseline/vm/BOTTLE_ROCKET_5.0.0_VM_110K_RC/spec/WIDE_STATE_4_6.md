# BR Wide-State 4.6 Contract

**Logical width:** 1,048,576 bits / 16,384 64-bit limbs / 131,072 bytes.

## Representations

`ZERO` has no payload. `SMALL` stores limb 0 inline. `SPARSE` stores one nonzero limb index/value inline. `DENSE` points to a reference-counted, capacity-bounded limb blob. `CONST` is an immutable canonical descriptor. Dense mutation uses copy-on-write. Normalization strips unused high limbs and collapses eligible values to ZERO/SMALL/SPARSE/CONST.

## Ownership

Registers and stack entries own descriptors. MOV/PUSH may share DENSE blobs by incrementing their reference count. Mutation must detach a shared blob. POP transfers descriptor ownership. Reset/destroy release every descriptor and scratch buffer deterministically.

## Allocation and quotas

Dense capacity grows in power-of-two limb units and never exceeds `BR_LIMBS`. Wide dynamic allocation is accounted per VM. The reference configuration defines ceilings for total wide bytes, stack bytes, scratch bytes and device buffers. Allocation failure maps to `BR_TRAP_OOM`; quota exhaustion maps to `BR_TRAP_RESOURCE`.

## Arithmetic

Arithmetic consumes only significant limbs where possible. Zero/one/single-nonzero-limb paths are specialized. Multiplication chooses a single-value path before the general limb product. Division uses a single-limb divisor strategy when possible and a bounded significant-bit strategy otherwise. Shift of a single-bit sparse value retains sparse representation when valid. All results are normalized.

## Determinism

Descriptor form and allocation history are not part of guest-visible semantics. Equivalent logical values must produce the same arithmetic result, flags/traps, control flow and instruction count. The allocation strategy may change memory consumption only.
