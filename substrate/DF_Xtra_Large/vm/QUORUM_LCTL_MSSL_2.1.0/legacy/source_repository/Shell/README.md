# JA21 Suite 59 — Shell

Three independent JA Operations Language scripts define approved command
registration, command-policy enforcement, and bounded output streaming.

The shell is a governed execution boundary—not an unrestricted command prompt.
Command identity, structured arguments, working directory, environment,
capabilities, effects, resources, approval, output, and final status remain
explicit and independently reviewable.

## Language profile

- Language: JA Operations Language
- Profile: `ja.operations`
- Extension: `.jaops`
- Header: `ja source 0.3`
- Kernel: `ja-kernel-0.3`
- Corpus version: `0.1.0-provisional`
- Default environment: locked, offline, network disabled, resource bounded, and
  reproducible
- Packaging: one unique MSSLB artifact per sub-suite

The attached corpus was integrity-checked before generation. Its manifest
identifies 10,000 JA Operations Language examples covering locked builds,
target platforms, compiler profiles, dependencies, workers, services, resources,
health checks, storage, logging, metrics, traces, offline/air-gapped
deployment, scaling, upgrade, rollback, artifact repositories, and MSSLB
packaging.

The corpus status is
`provisional-generated-not-production-compiler-validated`. These files are
specification-level JA21 source. Production operation requires the intended JA
Operations compiler/runtime plus trusted command-policy, process-sandbox,
filesystem, terminal, stream, redaction, clock, and audit adapters.

## Files

| File | Sub-suite | Responsibility |
| --- | --- | --- |
| `59.1_Approved_Commands.jaops` | Approved commands | Registers immutable command descriptors and their permitted structured invocation forms |
| `59.2_Command_Policy.jaops` | Command policy | Evaluates principal, capability, command, arguments, scope, resources, approval, and expected effects immediately before execution |
| `59.3_Output_Streaming.jaops` | Output streaming | Publishes ordered, bounded, redacted stdout/stderr/status events with backpressure and terminal receipts |

Each file is independently loadable and emits one named MSSLB package.

## Analytical ensemble

Every workspace represents the requested five-part analytical ensemble:

| Participant | Suite 59 responsibility |
| --- | --- |
| SOPHIA | Interprets operator intent, command meaning, repository context, expected effects, output significance, and uncertainty |
| CHARLOTTE | Validates command identity, arguments, path scope, capabilities, policy, approval, resources, stream limits, and redaction |
| LANDON | Registers the descriptor, enforces the admitted execution contract, and streams bounded output |
| Professor | Explains admission, denial, observed effects, exit status, truncation, uncertainty, and remediation |
| Podium | Records command, policy, approval, execution, output, artifact, result, and provenance receipts |

Each workspace also declares one narrowly scoped mechanical worker. The worker
cannot choose a command, reinterpret a shell string, expand scope, enable
networking, suppress output limits, or report completion without Podium.

## Common workspace contract

All three scripts:

1. target `windows-x64` with the release compiler profile;
2. require locked dependencies;
3. run offline with networking disabled;
4. declare finite CPU and memory;
5. reference opaque secret identifiers instead of embedding values;
6. define health checks for every service and worker;
7. use rolling upgrades with rollback on health failure;
8. assert reproducible deployment; and
9. emit one unique MSSLB package.

`policy explicit_network` does not grant networking. The workspaces explicitly
disable it. Any connected command requires a separately approved profile naming
destinations, protocols, data classes, credentials, rate limits, deadlines,
expected downloads/uploads, and audit evidence.

## Command identity

An approved command descriptor should bind:

- stable descriptor ID and schema version;
- executable or built-in operation identity and content hash;
- publisher/source and provenance;
- supported operating system and architecture;
- exact subcommand and option grammar;
- argument types, cardinality, validation, and normalization;
- working-directory and repository/worktree rules;
- permitted environment-variable names and opaque secret references;
- standard-input contract;
- allowed filesystem, process, network, tool, model, and device effects;
- resource, time, concurrency, and output budgets;
- cancellation, idempotency, retry, and rollback class;
- expected exit/result schema; and
- policy, approval, and revocation identities.

Display names, `PATH` lookup, filename similarity, installed status, successful
prior execution, repository content, or a model-generated suggestion do not
prove command identity.

## Structured invocation

Commands are represented as a structured executable plus argument vector. A
concatenated shell string is not the authorization unit.

```text
Invocation {
    descriptor_id,
    executable_hash,
    argv[],
    working_directory,
    environment_names[],
    stdin_source,
    expected_state,
    resource_budget,
    output_policy,
    request_id
}
```

Metacharacters, quotes, pipes, redirects, substitutions, globbing, variables,
subshells, command separators, and response files are inert argument data
unless the exact approved descriptor explicitly defines and validates them.

Composite workflows are graphs of individually admitted operations. Approval
of one executable does not authorize an arbitrary interpreter, script,
subcommand, child process, or chained command.

## 59.1 Approved commands

The registry:

- validates descriptor schema and immutable identity;
- verifies executable/package hash and provenance;
- canonicalizes supported arguments without widening their meaning;
- classifies effects and risk;
- binds required capabilities, scopes, sandboxes, approvals, and limits;
- records issue, activation, expiry, suspension, and revocation;
- rejects conflicting reuse of a descriptor ID; and
- emits a Podium registry receipt.

Registration is not execution permission. It establishes that a command form is
known and eligible for later policy evaluation.

Suggested command classes include:

- read-only repository inspection;
- deterministic parsing, validation, building, and testing;
- reversible workspace mutation;
- privileged or external mutation;
- process/service control;
- package installation or update;
- network transfer;
- signing/release;
- messaging or user-directed action; and
- destructive cleanup.

Each class has distinct capabilities and approval requirements. An allowlist
entry for read-only inspection cannot authorize mutation.

## 59.2 Command policy

Immediately before execution, policy evaluates the exact:

- principal, role, tenant, and session;
- command descriptor and executable hash;
- structured argument vector;
- working directory, repository/worktree, target paths, and expected state;
- environment names, secret references, and stdin source;
- requested effects and capabilities;
- sandbox and resource profile;
- approval receipt and validity interval;
- timeout, output limits, cancellation, and rollback;
- policy, revocation, and request hashes; and
- prior attempt/effect evidence.

Admission requires a positive decision for every mandatory predicate and no
explicit deny. Approval satisfies only its declared requirement; it cannot
erase a deny, widen scope, change arguments, or authorize an unlisted effect.

The enforcement point revalidates policy to prevent time-of-check/time-of-use
drift. A changed executable, path, worktree state, approval, policy,
revocation, sandbox, or target state denies execution.

## Repository confinement

Path-bearing arguments are normalized against the declared repository or
workspace root before policy evaluation. The policy accounts for:

- absolute and relative paths;
- `.` and `..` traversal;
- case and separator differences;
- symbolic links, junctions, mounts, and aliases;
- globs and recursive selectors;
- generated and ignored files;
- device and special files; and
- output destinations and temporary paths.

An unresolved path or link is denied. A command approved for the input
repository does not automatically gain access to the application's own
repository, another worktree, the user profile, system directories, or external
storage.

## Process and effect controls

The sandbox declares whether the command may:

- create child processes or process groups;
- load dynamic libraries, plugins, or interpreters;
- invoke tools, models, devices, or local services;
- read, create, modify, move, or delete files;
- modify repositories, configuration, services, or environment;
- access local IPC or network endpoints;
- persist artifacts, caches, logs, or learning records; and
- survive cancellation or terminal closure.

Ambient authority is denied. Child processes inherit only attenuated declared
capabilities. Unknown code and repository instructions remain untrusted data.

## 59.3 Output streaming

Output is an ordered stream of typed events:

```text
started
stdout_chunk
stderr_chunk
diagnostic
progress
artifact
warning
truncated
cancel_requested
cancelled
exited
validated
completed
```

Every event identifies execution, command, attempt, stream, sequence, timestamp,
classification, encoding, payload hash, redaction result, and causal parent.
Terminal completion also includes exit status, observed effects, output
validation, artifact identities, truncation/drop counts, and Podium receipt.

Stdout and stderr preserve independent order and sequence. A merged presentation
may be provided, but it does not replace the original channel records.

## Backpressure and limits

Streaming declares:

- maximum chunk and total bytes;
- maximum lines and event count;
- buffer and spill policy;
- producer throttling behavior;
- consumer disconnect behavior;
- encoding and invalid-byte handling;
- line and partial-line rules;
- idle and total deadlines; and
- retention, archive, query, and deletion policy.

Privileged audit and failure evidence is not silently dropped. If output exceeds
policy, the stream records truncation or cancellation explicitly. Backpressure
cannot deadlock cancellation or hide the final exit state.

## Redaction and untrusted output

Output is untrusted data. Before publication, CHARLOTTE applies classification
and redaction for:

- secrets, tokens, passwords, keys, and connection strings;
- unrestricted environment values;
- private prompt or model content;
- personal or confidential repository data;
- path information beyond the viewer's scope;
- control sequences, terminal escapes, hyperlinks, and binary payloads; and
- instruction-like content attempting to change policy or tool behavior.

The viewer renders output safely and does not execute escape sequences, links,
markup, scripts, or embedded instructions. Redaction happens before durable
logs, dashboards, exports, or learning-event candidacy.

## Execution flow

```text
request
-> resolve approved descriptor
-> canonicalize executable, argv, paths, environment, and stdin
-> classify effects and risk
-> evaluate capability, scope, policy, approval, revocation, and resources
-> acquire sandbox/resource lease
-> start exact executable
-> stream ordered redacted output with backpressure
-> observe exit and effects
-> validate outputs and artifacts
-> reconcile cancellation or unknown completion
-> Professor explanation
-> Podium terminal receipt
```

CHARLOTTE may deny at any gate. LANDON performs only the admitted operation.
Successful process exit is not accepted completion until required output and
effect validation pass.

## Cancellation, failure, and retry

Cancellation is a recorded transition:

1. stop accepting new input;
2. signal the declared process boundary;
3. allow a bounded grace period;
4. terminate only within admitted authority;
5. collect remaining output;
6. reconcile child processes and effects;
7. validate cleanup; and
8. publish the final state.

Failures distinguish policy denial, invalid invocation, startup, resource,
deadline, cancellation, process exit, signal, output, validation, sandbox,
storage, streaming, and unknown-effect classes.

Retries require explicit eligibility and budget. Mutation, destructive actions,
external effects, and unknown completion are not blindly retried. A retry
creates a new attempt identity and preserves previous output and failure
evidence.

## Evaluation matrix

| Class | Representative test | Expected result |
| --- | --- | --- |
| Positive | Approved descriptor, exact hash/argv, confined path, current approval, bounded sandbox, and valid output | Pass |
| Negative | Unknown executable, argument injection, path escape, changed hash, hidden child process, or stale approval | Expected deny |
| Boundary | Exact timeout, output cap, final chunk, buffer limit, cancellation grace, or repository-root edge | Pass or explicit boundary result |
| Integration | Descriptor, policy, execution, stream, artifact, observed effects, and Podium identities agree | Pass |
| Security | Shell injection, command substitution, symlink escape, hidden network, secret output, terminal escape, or audit bypass | Deny |
| Performance | Admission and output streaming remain within CPU, memory, buffer, event, and latency budgets | Pass within budget |
| Determinism | Same descriptor/request/state yields the same admission and canonical event/result identities | Pass |
| Recovery | Disconnect, crash, cancellation, or unknown completion reconciles without blind duplicate effect | Pass or explicit operator action |
| Interoperability | Process, filesystem, terminal, stream, sandbox, and ledger adapters preserve JA semantics | Pass |
| Certification | R12/MCRT evidence and Podium receipts replay exact command, policy, stream, effects, and result | Pass |

## Optimization restrictions

Permitted optimization includes immutable descriptor caching, canonical argument
validation, policy indexing, deterministic event batching, bounded buffering,
safe line framing, and artifact hash reuse.

Optimization must not:

- authorize a changed executable, argument, path, environment, or stdin;
- interpret structured arguments through an unapproved shell;
- widen scope or child-process authority;
- reuse stale policy, approval, target-state, or revocation evidence;
- reorder stdout/stderr events within a channel;
- hide dropped, truncated, cancelled, failed, or unknown output;
- weaken redaction, sandboxing, effect validation, or audit;
- merge principals, repositories, worktrees, commands, or attempts; or
- change stable R12/MCRT and Podium identities.

## Smithson 8S and R12 preservation

If a command processes Smithson 8S Coupled Mechanics records, command requests,
output streams, diagnostics, artifacts, results, and Podium receipts preserve
the declared fifth-coordinate meaning, independence evidence, latent and
projected geometry, product-state separation, semantic distance, uncertainty,
projection version, tolerance profile, and interaction order.

R12 replay retains `eta_ind`, `Delta_8S`, `g5`, `delta8`, `g3`, `gJ`,
phase/support state, relation class, limitations, and whether pairwise or
selective triadic mechanics changed the result. If `g5 > tol5` while
`g3 <= tol3`, the record remains `PROJECTION_ONLY`; shell execution or output
formatting cannot promote visible overlap into latent coupling.

Smithson 8S remains a proposed analytical framework, not an established
physical law, proof of physical quantum entanglement, or proof that the total
space is the standard sphere `S^8`.

## Acceptance gate

Suite 59 is certifiable only when all three packages are reproducible; command
descriptors, executable hashes, structured arguments, repository scope,
capabilities, policies, approvals, sandbox resources, output events, observed
effects, failures, and provenance are explicit; networking is disabled by
default; output is bounded and redacted; every service has a health check; and
R12/MCRT replay reproduces the same admission, event order, result, and Podium
receipt targets.
