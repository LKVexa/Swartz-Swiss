# BOTTLE ROCKET 4.5.0 Transactional Persistence Architecture

## Storage domains

| IDs | Domain | Authority |
|---|---|---|
| 0–1 | BRC2 secure control A/B | BRMF signature + BRIM digest + CRC for accidental corruption |
| 2–3 | BRIM image A/B | signed BRIM + BRMF digest binding |
| 4–7 | BRO1 guest persistent objects | namespace + quota + SHA-256 integrity |
| 8–9 | VM checkpoint state A/B | legacy VM-state persistence, isolated from secure control |

The HAL retains the 16-call production interface. `sr_` is block read, `sw_` writes and flushes a candidate object, `sc_` atomically replaces the committed object and performs durable parent synchronization where supported, `se_` erases, and return status is the storage-status contract.

## Secure update state machine

`VALIDATED -> CANDIDATE_WRITTEN -> CANDIDATE_SYNCED -> PENDING_CONTROL -> COMMITTED_CONTROL -> AUTHORIZED`.

Only a `BRC2` record with state `COMMITTED` participates in recovery. The record identifies active and previous slots and embeds the complete signed BRMF authority record. The manifest supplies generation, transaction sequence, issuer epoch, capabilities, version, image digest, and Ed25519 authorization. The final CRC protects the control block against accidental corruption but is never treated as an authentication primitive.

## Recovery

Recovery holds the storage lock, independently validates both control/image pairs, discards malformed/pending/truncated/digest-mismatched pairs, and selects the highest authenticated committed generation. The selected image is then passed through the normal 4.4 secure-manifest authorization path before the VM is marked securely authorized.

## Persistent guest objects

`BRO1/1` is a fixed 512-byte envelope: header/namespace/length, up to 464 bytes of payload, and SHA-256 over the first 480 bytes. Object ids and namespaces are checked on read. Namespace zero is the only migration authority for legacy raw objects; migration rewrites the object into BRO1 before returning it.
