# Audit of the finished product — 8.1.0

Scope: the 8.0.3 package as shipped, plus the VEC1 substrate integration performed for 8.1.0.
Every finding below was located in the shipped source and is fixed in this release unless the
disposition says otherwise. The native DF_Medium engine is unchanged in 8.1.0.

## Severity summary

| # | Area | Finding | Severity | Disposition |
|---|---|---|---|---|
| 1 | Network | Fetch primitive reached loopback, link-local and private addresses | High | Fixed |
| 2 | Network | `file:` bypassed JA21 policy entirely and could read any path | High | Fixed |
| 3 | Process | DF_Small helper deadlocked on full pipes; its 90 s timeout was unreachable | High | Fixed |
| 4 | Network | TLS set was OR-ed onto framework defaults, leaving legacy protocols enabled | Medium | Fixed |
| 5 | Resources | Unbounded concurrent image fetches, 12 MB each, no page total | Medium | Fixed |
| 6 | Privacy | Every video preloaded and started a decoder without user action | Medium | Fixed |
| 7 | Network | HTTPS to HTTP redirect downgrade followed silently | Medium | Fixed |
| 8 | Network | No total navigation deadline: 8 redirects x 20 s could hang 160 s | Medium | Fixed |
| 9 | Spoofing | Bidi and zero-width characters passed through the address bar | Medium | Fixed |
| 10 | Spoofing | Unicode hosts displayed without their resolved ASCII form | Medium | Fixed |
| 11 | Integrity | Seal paths screened by substring only, not containment | Medium | Fixed |
| 12 | Concurrency | `lock(typeof(DfMediumNative))` — a process-wide public monitor | Low | Fixed |
| 13 | Interop | Native string reads silently truncated at a fixed buffer size | Low | Fixed |
| 14 | Integrity | Boot checked only `profile.electron`, not the other engine flags | Low | Fixed |
| 15 | Resources | No cap on open tabs | Low | Fixed |
| 16 | Maintenance | Version string hardcoded in five places | Low | Fixed |
| 17 | UX | Microcopy in system and alarm voice; errors offered no action | Low | Fixed |
| 18 | Design | Design-system claims were prose only, unverifiable and partly unimplemented | Low | Fixed |
| 19 | Engine | 8.0.3 HTML character-reference fix is staged, not compiled into the DLL | Medium | **Open — unchanged** |
| 20 | Substrate | Strict four-node fabric execution unavailable in this package | — | **Blocked by design** |

## Detail

**1 — Address boundary (SSRF).** `JaMirrorNetworkClient` followed any `http(s)` address the
engine produced. A remote page could therefore point the isolated engine at `127.0.0.1`,
`169.254.169.254` or an RFC1918 host and read the response back through the scene graph.
`JaAddressPolicy` now refuses loopback, link-local, RFC1918, CGNAT, unique-local, multicast and
IPv4-mapped-internal destinations, checks the *resolved* addresses so a public name resolving
inward is caught too, and re-checks after every redirect. `JA21_ALLOW_PRIVATE_HOSTS=1` is a
deliberate opt-out.

**2 — `file:` scheme.** `Navigate` set `bool allowed = isFile`, skipping the policy VM
altogether, and `FetchInternal` read any local path. `JaAddressPolicy.CheckFile` now confines
`file:` to the package root by canonical prefix; `JA21_ALLOW_ANY_FILE=1` opts out.

**3 — Helper deadlock.** `DfSmallHelper.RunNativeAsync` called `StandardOutput.ReadToEnd()`
then `StandardError.ReadToEnd()` with both pipes redirected — the classic deadlock as soon as
stderr fills its buffer — and because `ReadToEnd` blocks, the subsequent `WaitForExit(90000)`
could never fire. Both pipes are now drained asynchronously and the timeout is real.

**4 — TLS.** `SecurityProtocol |= Tls12` widens whatever the framework default is, leaving
SSL 3.0 / TLS 1.0 / 1.1 enabled on older defaults. 8.1.0 assigns an explicit set (TLS 1.2, plus
1.3 where the framework knows it) once, under a lock.

**5 — Subresource budget.** One unbounded `Task` per image scene record, 12 MB each. A page
declaring hundreds of images opened hundreds of connections. `JaResourceBudget` gives each
document 6 concurrent slots, 96 images, 8 MB per image and 48 MB total, all degrading to a
placeholder rather than an error.

**6 — Video preload.** Every video element received `Source` and a `Play()`/`Pause()` pair on
load. 8.1.0 attaches the source only on the reader's first activation, and re-checks the address
policy at that moment.

**7, 8 — Redirect discipline.** A redirect from HTTPS to plain HTTP is now refused, and a
45-second deadline spans the whole navigation including the body transfer.

**9, 10 — Address spoofing.** `JaAddressText.Sanitize` strips C0 controls, DEL, `U+200B–200F`,
`U+202A–202E`, `U+2066–2069` and the BOM before an address is used or normalised, and the
sanitiser also runs on engine-supplied link text. `HostLabel` shows the resolved punycode form
beside a non-ASCII host, and the trust line flags non-ASCII hosts explicitly.

**11 — Seal containment.** `RuntimeSeal.Verify` rejected `..`, `:` and rooted spellings, which
is necessary but not sufficient. `RuntimeSeal.Contained` now resolves the path and proves the
canonical result is inside the canonical root. `RuntimeSeal.RequireSha256` rejects malformed
digests before they are compared or used to build a path.

**12–16** are as described in the table; each has a marker in `tools/verify_package.py` and in
`tests/test_vec1_integration.py`, so a regression fails the package verifier rather than going
unnoticed.

**19 — Open.** `engine/df_medium/patches/8.0.3-html-character-references.patch` fixes attribute
and text character-reference decoding, an out-of-bounds read in the old text decoder, and
`<title>` text leaking onto the page. It is verified on Linux (ASan/UBSan clean) but the shipped
Windows DLL still predates it, because that DLL has to be rebuilt on Windows. The presenter-side
workaround in `JaLinkTarget` remains, and the DLL/source seal stays honest about the gap. This
release does not close it, and does not claim to.

**20 — Blocked by design.** `N_LARGE` and `N_XLARGE` are not vendored here, so VEC1's strict
four-node gate cannot be reached. The substrate reports `BLOCKED`, which is the fail-closed
behaviour, not a defect. `docs/VEC1-ELECTRON-SUBSTRATE.md` gives the drop-in procedure.

## What was verified, and how

| Check | Where |
|---|---|
| Braces, literals, unqualified `Path.`, out/ref on auto-properties | `tools/verify_package.py`, `host/Verify-JA21Browser.ps1` |
| Every 8.1.0 fix still present; every 8.0.x defect absent | `tests/test_vec1_integration.py::Hardening` |
| Design-system tokens and named components present | `tests/test_vec1_integration.py::DesignSystem` |
| Presenter cannot record a fabric verdict | `tests/test_vec1_integration.py::ClaimDiscipline`, `substrate/vec1/presenter.py` |
| Canonical JSON identical in C# and Python | `substrate/evidence/presenter/CANONICAL_VECTORS.json`, checked at presenter startup |
| Sealed state, ledger chains, tamper detection | `substrate/tests/test_presenter_format.py` |
| VEC1 control plane (22 tests) | `substrate/tests/test_vec1_control_plane.py` |
| Node binding is honest about what is absent | `tests/test_vec1_integration.py::NodeBinding` |

## Not verified here

Live Windows qualification — WPF compile, native DF_Medium self-test, real navigation, image and
video presentation, and the presenter's canonical self-test against the golden vectors — runs on
the target host. `docs/WINDOWS-QUALIFICATION.md` is the checklist.
