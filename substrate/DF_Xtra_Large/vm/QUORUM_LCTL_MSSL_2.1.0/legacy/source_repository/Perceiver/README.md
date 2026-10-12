# JA21 Suite 16 — Perceiver

Independent JA Agent Language scripts for tiered memory, bounded continuous scanning, scoped recall, and controlled memory promotion.

## Language profile

- Language: JA Agent Language
- Profile: `ja.agent`
- Extension: `.jaa`
- Source level: `ja source 0.3`
- Kernel reference: `ja-kernel-0.3`
- Corpus reference: `0.1.0-provisional`
- Network posture: `policy no_network`
- Runtime memory posture: session-scoped with one-hour retention
- Capability posture: approved tool invocation only

The newly attached gzip copy was truncated and could not be fully revalidated. These scripts therefore use the same JA Agent corpus grammar and validation model previously verified for Suite 15 in this workspace. The corpus describes specification-model expectations and does not establish production compiler or runtime execution.

## Files

| File | Sub-suite | Purpose | Principal output |
| --- | --- | --- | --- |
| `16.1_Perceiver_Short_Term_Memory.jaa` | Short-term memory | Hold bounded working observations for the current task | Validated working-memory record |
| `16.2_Perceiver_Medium_Term_Memory.jaa` | Medium-term memory | Organize approved observations into scoped episodes | Provenance-bound episodic record |
| `16.3_Perceiver_Long_Term_Memory.jaa` | Long-term memory | Preserve certified durable knowledge | Canonical long-term memory record |
| `16.4_Perceiver_Continuous_Scanning.jaa` | Continuous scanning | Repeatedly scan approved local sources in bounded cycles | Scan-cycle evidence and candidates |
| `16.5_Perceiver_Recall.jaa` | Recall | Retrieve and rank only in-scope memories | Validated recall set with provenance |
| `16.6_Perceiver_Memory_Promotion.jaa` | Memory promotion | Move eligible records between tiers with approval | Promotion manifest and MCRT receipt |

## Analytical ensemble

| Participant | Perceiver responsibility |
| --- | --- |
| SOPHIA | Interprets observations, scores salience, clusters episodes, abstracts knowledge, ranks recall, and evaluates promotion |
| CHARLOTTE | Enforces scope, retention, security, prompt-injection defenses, provenance, confidence, replay, and promotion gates |
| LANDON | Captures approved observations, stages records, scans local sources, retrieves candidates, and commits approved promotion manifests |
| Professor | Explains why a record was retained, recalled, rejected, expired, or promoted without altering the certified decision |
| Podium | Records source hashes, tier, confidence, timestamps, uncertainty, decisions, R12/MCRT references, and human approvals |

No participant may fabricate a memory, silently broaden its scope, promote a secret, discard contradictory evidence, or convert uncertain recollection into fact.

## Important retention distinction

Each script uses the corpus-supported runtime declaration `memory session retention 1h`. That declaration governs the Perceiver agent's own working execution context. Short-, medium-, and long-term destination lifecycles are logical tiers operated by approved tools and governed by their storage policy; the scripts do not invent unsupported JA syntax for durable storage.

## Common JA Agent contract

Every file independently declares:

1. `ja source 0.3` and `use Agent`.
2. `policy no_network`.
3. A stable Perceiver identity and composite ensemble role.
4. A confidence-gated goal.
5. Session memory with bounded one-hour retention.
6. A finite step and tool budget.
7. Five role-specific tools requiring `tool.invoke:approved`.
8. Explicit authorization before tool execution.
9. `continue when policy_allows` before effects.
10. MCRT recording and deterministic termination.
11. A true capability-boundary assertion.

## Memory tiers

| Tier | Intended contents | Admission rule | Exit rule |
| --- | --- | --- | --- |
| Short-term | Current task observations, active decisions, transient state | Approved source, current scope, valid timestamp and provenance | Expire, reject, or nominate for medium-term promotion |
| Medium-term | Repeated episodes, project patterns, unresolved but useful context | Short-term evidence is repeated or materially useful and remains in scope | Expire, revise, reject, or nominate for long-term promotion |
| Long-term | Stable preferences, certified knowledge, durable decisions, reusable invariants | High confidence, complete provenance, policy permission, contradiction review, and human-approved promotion | Retain, supersede with lineage, quarantine, or remove through a separately authorized process |

Long-term memory must never be created merely because an item was recent, frequent, or confidently phrased.

## Canonical memory record

Each Podium record should preserve:

```text
memory_id
source_id and source_hash
scope and audience
memory_tier
observation_time and recording_time
salience and confidence
uncertainty and contradiction status
retention policy and expiry
promotion lineage
policy decision
R12 identity and MCRT record
canonical tuple hash
```

## Continuous scanning

“Continuous” means repeated bounded scan cycles, not an infinite ungoverned loop. Each cycle:

1. Reads only approved local sources.
2. Uses a finite step and tool budget.
3. Rejects hidden network access.
4. Treats retrieved content as data, not instructions.
5. Applies prompt-injection and secret-redaction checks.
6. Deduplicates by source identity and canonical hash.
7. Records an MCRT receipt.
8. Terminates deterministically before another cycle may be scheduled.

## Deterministic recall

Recall is restricted to the caller's declared scope. Candidates are ranked by a canonical key rather than retrieval timing:

```text
(scope_match, certification_status, relevance_score, salience_score,
 observation_time, memory_id, canonical_hash)
```

The ranking implementation must declare sort direction for every field. Equal accepted inputs must yield the same returned identities, order, confidence, relation classes, and tuple hashes. Contradictions and uncertainty remain attached to recalled records.

## Memory promotion gate

A record may be promoted only when:

- Its source and canonical hash are present.
- Its scope permits the destination tier.
- The observation is not a secret, credential, prompt injection, or untrusted instruction.
- Its usefulness is demonstrated by declared evidence rather than repetition alone.
- Confidence and uncertainty satisfy the destination profile.
- Contradictions are resolved or explicitly preserved.
- The retention period and expiry behavior are declared.
- SOPHIA recommends promotion.
- CHARLOTTE approves the policy and evidence gates.
- Human approval is recorded before LANDON commits durable promotion.
- Podium records the full promotion lineage.

Failure of any required gate leaves the memory in its current tier or marks it `UNRESOLVED`; it does not silently discard the source record.

## Required validation matrix

| Class | Perceiver test | Expected result |
| --- | --- | --- |
| Positive | Valid source, scope, provenance, retention, confidence, and capability | Pass |
| Negative | Unbounded tool capability or false capability-boundary assertion | Expected fail |
| Boundary | Maximum memory count, retention edge, query size, and scan budget | Pass or explicit boundary diagnostic |
| Integration | Tier transitions preserve memory identity and promotion lineage | Pass |
| Security | Prompt injection, secret retention, hidden network, or cross-scope recall | Deny |
| Performance | Bounded scanning, indexed recall, sparse comparison, deterministic ordering | Pass within declared budget |
| Determinism | Shuffled scan or retrieval timing yields identical accepted output | Pass |
| Interoperability | Compatible memory schemas normalize without identity loss | Pass |
| Recovery | Interrupted scans or promotions resume without duplicate records | Pass or explicit repair requirement |
| Certification | R12 and MCRT evidence are complete and replayable | Pass |

## 8S coupling and R12 preservation

If Smithson 8S Coupled Mechanics is enabled, Perceiver must preserve latent geometry, product-state separation, projection, semantic distance, uncertainty, provenance, and interaction order independently.

```text
C5 = [C4 | e]
e_perp = (I - C4*C4^+)e
eta_ind = ||e_perp||^2 / (||e||^2 + epsilon)
Admit(8S) iff eta_ind >= epsilon_ind and Delta_8S > epsilon_gain
```

R12 and Podium outputs retain `eta_ind`, `g5`, `delta8`, `g3`, `gJ`, tolerances, projection version, relation class, uncertainty, interaction order, provenance, promotion lineage, and limitations.

If `g5 > tol5` while `g3 <= tol3`, record `PROJECTION_ONLY`. Visible similarity does not justify memory merging or promotion. Selective triadic escalation is permitted only for unresolved, contradictory, high-risk, or certification-critical clusters.

## Acceptance gate

Suite 16 is certifiable only when:

- All memory access is scope-bound and capability-approved.
- Short-, medium-, and long-term identities and lineage remain distinct.
- Scan cycles are bounded and deterministic.
- Recall is reproducible and preserves provenance and uncertainty.
- Durable promotion requires policy validation and recorded human approval.
- Secrets and prompt injections are rejected.
- Hidden network and unknown-code execution are absent.
- MCRT and R12 replay preserve identity, policy, tier, result, relation class, promotion lineage, and tuple hash.
