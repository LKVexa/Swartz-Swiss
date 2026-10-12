# BRCR/1 / BRGD/1 Persistence Contract

**Version:** BOTTLE ROCKET 4.5.0  
**Core ABI:** `0x00040500`

## Objects

The reference storage namespace contains independent objects for `STATE0`, `STATE1`, `ISSUER`, `IMAGE0`, `IMAGE1`, `STAGE`, `GUEST0`, and `GUEST1`. Control state, executable images, staging, and guest data are never aliases.

## Durability rule

A write is not considered durable merely because `storage_write` returned success. Update/recovery code explicitly invokes flush and sync where durability is required. Metadata promotion uses the HAL atomic-replace primitive followed by synchronization. A target adapter that cannot supply the requested semantics must fail rather than silently downgrade them.

## BRCR/1 states

| State | Meaning | Recovery action |
| --- | --- | --- |
| COMMITTED | active image is last confirmed-good | load active after trust/rollback checks |
| PENDING | durable candidate exists but has not started its production boot test | persist TESTING before candidate execution |
| TESTING | candidate boot began but was not confirmed | roll back to previous-good |
| ROLLED_BACK | rollback was recorded | recover previous-good and retain evidence state |

## Power-loss invariants

At every modeled interruption point, recovery must select either the previously committed secure image or a fully written/verified candidate that is explicitly eligible for first-boot testing. Torn control records, torn candidate writes, missing flush/sync, stale monotonic state, invalid authentication, and image/control digest mismatches cannot become active authority.

## Guest persistence

BRGD/1 uses two authenticated copies, namespace IDs, a generation counter, explicit length/version, and a 2,048-byte reference payload quota. Guest persistence is never used for secure-image/control authority.
