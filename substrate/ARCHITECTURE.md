# VEC1 Electron Substitute architecture — v0.1.1 candidate

## 1. Design rule

VEC1 state is canonical and VM-independent. Execution is expressed as sealed PA-LCTL rows. **Rows move; native VM images do not.** The DF adapters own target lowering and native execution. DF0 owns scheduling, placement, replica/pipeline/BSP orchestration, result comparison and deterministic event-log evidence.

## 2. Node composition

| Node | VEC role | Native path |
|---|---|---|
| `DF_Small / N_SMALL` | minimal/reference manifestation and bounded baseline | PA-LCTL → MSSL/ASM-1 → BRIM/1-v3 → C11 VM |
| `DF_Medium / N_MEDIUM` | semantic/compiler validation and independent image verification | PA-LCTL → LCTLC/1.1 → BRIR/1.1 → BRIM/BRPV → native VM |
| `DF_Large / N_LARGE` | virtual devices, host I/O/service boundary | PA-LCTL → LCTLC/1.2 → BRIM/1 → C11/HAL + Device ABI |
| `DF_Xtra_Large / N_XLARGE` | large-state, long-running and QAM-oriented hosted manifestation | PA-LCTL → LCTLC/1.0 → QVM-BRIR/1 → QBRIM 2 → Python QVM |
| `DF_Fabric / DF0` | scheduler, placement, replica/pipeline/BSP, differential comparison, event-log replay | sealed rows moved across nodes; VM images are not treated as portable |

## 3. Control-plane mapping

- Components **001–020**: canonical genome/identity and logical virtual-property state in `vec1/core.py` + `config/vec1.json`.
- **021–030**: common execution control and resource counters; target-native instruction decoders/register banks remain inside each VM.
- **031–040**: mailbox/queue/policy represented in VEC state; actual cross-node transport/routing is DF0, with DF_Large as the device/service edge.
- **041–050**: freeze, snapshot, hash, fork, lineage, logical COW base reference, restore/diff primitives in `vec1/core.py`.
- **051–060**: state/config/capability hashing, execution receipts, hash-chained ledger, replay checks and fail-closed promotion.
- **061–068**: existing DF adapters/lowerers; no generic interpreter is substituted for a missing native target.
- **069–082**: DF0 result normalization, differential comparison, registry/scheduler/placement/replica/quorum/transport/recovery evidence surfaces.
- **083–092**: deny-by-default security envelope in `config/security_policy.json` plus package-runtime filesystem confinement and explicit suspension/retirement controls.
- **093–100**: QAM-oriented orbital/affinity/membership interfaces are represented as reference state/contracts; Proton/Neutron/Bond integration remains interface-level until concrete external components are supplied.
- **101–110**: offline `ui/` laboratory view plus the retained Technical Institute.

## 4. Acceptance spine

1. Validate package/component map and security policy.
2. Bind all four VM adapters; missing native build products are `BLOCKED`, not silently emulated.
3. Parse and verify the canonical PA-LCTL program.
4. Run DF0 in strict mode across all four nodes.
5. Require `CROSS_NODE_DIFFERENTIAL_AGREEMENT`.
6. Require the DF event-log replay self-check to pass.
7. Emit a VEC execution receipt and append a hash-chained VEC ledger event.
8. Only then mark the VEC instance `VERIFIED`.

Failure at any step after the tick advances marks the instance `FAULTED` with a ledger event; recovery is `restore` from a sealed snapshot of the same lineage. `vecctl audit` re-derives every state hash, ledger chain, base snapshot and receipt reference.

## 5. Claim discipline

This candidate demonstrates a software substitute for a VEC “electron” execution entity across the supplied classical VM/fabric stack. It does not claim physical electron behavior, quantum hardware, cross-machine federation, or completion of all 286,440 VEC1 checklist items.
