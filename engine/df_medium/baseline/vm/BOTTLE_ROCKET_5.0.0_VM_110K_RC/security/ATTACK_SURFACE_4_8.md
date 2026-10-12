# BOTTLE ROCKET 4.8.0 Attack-Surface Inventory

| Surface | Trust boundary | Primary controls | 4.8 verification |
|---|---|---|---|
| LCTLC/1.1 source parser | Untrusted source → compiler | grammar/type/bounds/CFG/capability checks | deterministic mutations + production parser |
| BRIR/1.1 parser | Untrusted IR → lowering/verifier | exact fields/ranges/semantic checks | independent direct-parser fuzzing |
| BRIM/1 + BRPV/1 | Untrusted image → VM loader | header geometry, hashes, ISA/ABI, CFG/stack, caps, provenance | independent Python verifier, C verifier, 9 image attacks |
| BRTM/1 | Untrusted bundle → production secure loader | domain-separated Ed25519 Root→Issuer→Release→Image chain, expiry/revocation/rollback | independent Python cryptographic verifier + signature mutations |
| APDU | Untrusted bytes → command dispatcher | exact command lengths, production raw-code denial, signed recovery | C fuzz campaign + inherited device suite |
| Service/Device ABI | Guest → host adapter | explicit service/device IDs, capabilities, buffer copying, quotas, offline-by-default network | C fuzz + capability attacks + inherited 66/66 suite |
| Control flow | Guest instruction stream → VM state | verified targets, protected return stack, typed traps, budgets | 6 control-flow attacks + opcode edge suite |
| Wide state | Guest arithmetic → dynamic allocator | bounded descriptor storage, COW ownership, quotas | property/differential tests + sanitizers |
| BRCR/1 control persistence | Untrusted/stale storage → boot authority | authentication, generation/epoch/transaction monotonicity, dual records | rollback/persistence attack matrix |
| BRGD/1 guest persistence | Guest data → storage | authenticated versioned dual slots, namespace/quota bounds | persistence attacks + accelerated soak |
| Host filesystem adapter | Runtime → OS filesystem | canonicalized root, no-follow/open checks, mode restrictions, fsync/rename/lock | static analysis + inherited persistence audit |
| Build/reproducibility | Source → executable/artifacts | deterministic BRIR/BRIM; GCC/Clang/O0/O2/O3 comparison | cross-platform/repro script |

No socket/DNS/network-discovery implementation is added by the 4.8 qualification layer.
