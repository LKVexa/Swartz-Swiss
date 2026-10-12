# Suite 66 — Terminal

## Purpose

Suite 66 is LANDON's governed terminal surface. It accepts reviewable terminal
requests, binds them to an exact repository context, obtains Professor proposals
and Podium authorization, executes only through an isolated HERMIT cell, and
returns structured terminal evidence for LANDON review.

The suite is an interface and session-control layer. It does not create a second
shell, worker, sandbox, or execution engine.

## JA21 language assignment

- **Primary:** JA Interface Language
- **Supporting:** JA Operations Language, JA Agent Language, JA Data Language,
  JA Security Policy Language, JA Service and Protocol Language, JA Training and
  Evaluation Language, JA Certifier Grammar (EBNF), and JA Core Application
  Language

Each independent script uses the package-compatible `.jasp` extension and
declares its binding JA21 profile internally.

## Separation of duties

> Professor proposes. Podium authorizes and schedules. HERMIT executes. LANDON
> displays and governs. SOPHIA evaluates. CHARLOTTE constructs and inspects.

- **Professor** explains commands and produces action cards; it cannot execute.
- **Podium** checks authority, routes, schedules, and recovers; it cannot invent
  a capability.
- **HERMIT** executes the exact authorized command in isolation; it cannot
  authorize itself or publish.
- **LANDON** owns session controls, review, and integration; it cannot suppress
  evidence or silently widen scope.
- **SOPHIA** evaluates outcomes and promotes only accepted, verified learning.
- **CHARLOTTE** constructs the terminal presentation and independently inspects
  safety, clarity, accessibility, and reviewability.

## Boundary crosswalk

| Existing suite | Existing owner | Suite 66 responsibility |
|---|---|---|
| 39 Core Studio | Integrated Terminal host | Supplies the host window and repository session |
| 49 Action Cards | Reviewable action contract | Renders terminal-specific command proposals |
| 53 Operations Plane | Operational control plane | Receives structured terminal requests |
| 55 Capability Manifests and Permissions | Capability rights | Enforces the minimal command capability set |
| 56 Job Queue Workers and Sandboxes | Queues and isolation resources | Supplies queued execution resources |
| 59 Shell | Approved commands, command policy, output streaming | Executes shell semantics behind a typed adapter |
| 60 Worker | Approved repository job execution | Returns stdout, stderr, exit codes, and artifacts |
| 61 Popup Runner | Focused job launch surface | Receives explicitly handed-off terminal jobs |
| 62 LANDON Integration and Run All | Run and Run All governance | Governs single and multi-command terminal plans |
| 63 Sandbox and Offline Runtime | Offline tool runtime | Supplies confined runtime mounts and tools |
| 65 Sandbox Engine | Lifecycle and execution kernel | Authorizes and runs the terminal contract |

## Sub-suite catalog

| ID | Sub-suite | Assigned JA21 language | Primary responsibility |
|---|---|---|---|
| T-01 | Terminal Contract Intake | JA Data Language | Normalize, validate, hash, and freeze a terminal request |
| T-02 | Session Identity and Provenance | JA Data Language | Bind session, principal, repository, and provenance identities |
| T-03 | Repository Context Binding | JA Data Language | Pin repository root, worktree state, branch, and selection context |
| T-04 | Working Directory and Path Confinement | JA Security Policy Language | Prevent traversal, host escape, and undeclared writes |
| T-05 | Terminal Profile and Environment | JA Operations Language | Build a minimal deterministic environment from an approved profile |
| T-06 | Capability Manifest and Command Policy | JA Security Policy Language | Compile the minimum command allow-list and argument templates |
| T-07 | Professor Proposal and Action Card | JA Agent Language | Explain intent and produce a non-executing action card |
| T-08 | Podium Authorization and Dispatch | JA Agent Language | Authorize exact scope and dispatch through the approved route |
| T-09 | HERMIT Terminal Execution Cell | JA Operations Language | Create, attest, use, and destroy an isolated terminal cell |
| T-10 | Shell Adapter and Command Invocation | JA Service and Protocol Language | Convert authorized records into Suite 59 shell invocations |
| T-11 | Input Editor and Parser | JA Certifier Grammar (EBNF) | Parse input without executing substitutions during review |
| T-12 | Completion and Command Discovery | JA Interface Language | Offer policy-filtered, non-executing completion candidates |
| T-13 | PTY, Process, and Job Control | JA Operations Language | Govern foreground jobs, signals, and bounded background work |
| T-14 | Standard Streams Multiplexer | JA Service and Protocol Language | Preserve ordered stdout, stderr, and control events |
| T-15 | Structured Diagnostics and Illuminator View | JA Interface Language | Render readable errors, warnings, evidence, and next steps |
| T-16 | Exit Status and Result Capture | JA Data Language | Seal exit codes, timing, resource use, and artifact inventories |
| T-17 | History, Recall, and Reproducible Replay | JA Data Language | Store redacted history and replay only through new authorization |
| T-18 | Tabs, Panes, and Session Layout | JA Interface Language | Manage bounded layouts without sharing ambient authority |
| T-19 | Search, Filter, Copy, and Export | JA Interface Language | Navigate large terminal output without mutating evidence |
| T-20 | Artifact Links, Diffs, and Preview Handoff | JA Core Application Language | Link outputs to review, preview, and approved patch flows |
| T-21 | Secrets, Redaction, and Injection Defense | JA Security Policy Language | Block injection and redact sensitive output before presentation |
| T-22 | Network and Air-Gap Indicator | JA Security Policy Language | Enforce and visibly display the active network policy |
| T-23 | Resource Budget, Timeout, and Cancellation | JA Operations Language | Enforce quotas and preserve evidence on bounded termination |
| T-24 | Checkpoint, Reconnect, and Recovery | JA Operations Language | Restore presentation from sealed evidence, never a mutable cell |
| T-25 | Localization, Accessibility, and Large-Output Windows | JA Interface Language | Localize and provide accessible bounded output windows |
| T-26 | LANDON Run, Run All, and Review Control | JA Agent Language | Govern launch, pause, cancel, review, and integration |
| T-27 | SOPHIA Evaluation and Accepted Learning | JA Training and Evaluation Language | Evaluate terminal outcomes and gate learning promotion |
| T-28 | CHARLOTTE Construction and Terminal Inspection | JA Interface Language | Construct and inspect terminal presentation and action quality |
| T-29 | Evidence Archive and Filing | JA Data Language | File canonical contracts, decisions, streams, hashes, and rollback |
| T-30 | Final Validation and Compatibility Report | JA Data Language | Emit the schema-valid terminal compatibility report |

## Canonical terminal contract

Every run begins with an immutable `TerminalRunContract` containing:

- `terminal_run_id`, `idempotency_key`, `requested_by`, and `created_at`;
- `intent`, `repository_root`, `working_directory`, and `context_snapshot_ref`;
- `command_argv`, `command_display`, and `command_policy_ref`;
- `environment_profile`, `capability_refs`, and `network_policy`;
- `input_refs`, `output_contract`, and `resource_budget`;
- `interactive_mode`, `approval_policy`, `retry_policy`, and `release_policy`;
- `locale` and `accessibility_profile`.

Command execution uses an argument vector. Display text is never reparsed as
authority. Shell metacharacters, substitutions, redirections, pipelines, and
command chaining require explicit parsed nodes and capability coverage.

## Canonical lifecycle

```text
DRAFT -> PROPOSED -> AUTHORIZED -> READY -> RUNNING -> VALIDATING
      -> REVIEW_REQUIRED -> APPROVED -> FILED
```

Any active state may become `PAUSED`, `CANCELLED`, `FAILED`, `RECOVERING`,
`ROLLED_BACK`, or `QUARANTINED`.

## Required evidence

Every terminal run emits:

1. normalized terminal contract and contract hash;
2. session, principal, repository, and context identities;
3. Professor action card;
4. Podium authorization decision;
5. command AST, display form, argument vector, and command-policy result;
6. capability manifest, environment manifest, and network policy;
7. HERMIT cell attestation plus worker and toolchain identities;
8. ordered stdout, stderr, control events, exit code, and timestamps;
9. resource use, checkpoints, retries, and cancellation records;
10. artifact inventory, hashes, diffs, and preview handoffs;
11. redaction and content-defense findings;
12. SOPHIA evaluation;
13. CHARLOTTE review with `Approve`, `Reject`, `Risk`, and `Unified diff`;
14. LANDON review decision;
15. rollback, integration, or evidence-only filing record;


