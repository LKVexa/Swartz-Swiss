# VB JA21 DF_Medium Browser 8.1.1 — audit, parse, repair and hardening report

## Scope

This patch audits the uploaded package whose folder name was `8.0.3` but whose authoritative
presenter/profile/documentation baseline was already `8.1.0`. The repair therefore advances
the coherent product release to **8.1.1** rather than reverting hardened 8.1.0 code.

## Root cause parsed

The failing source was in `ContextDrawerWindow`, a sibling of `BrowserWindow`, not a subclass.
The color helper is declared as `BrowserWindow.Brush(string)`. Five calls in the drawer used
`Brush(...)` without qualification. Because `System.Windows.Media` is imported, C# bound the
identifier `Brush` to the framework type `System.Windows.Media.Brush`; a type cannot be invoked
as a function, so PowerShell `Add-Type` aborted before `[VBJA21.Program]::Run($Root)`.

Affected calls were the drawer shell border/background, separator rule, and disclosure-card
border/background. All are now `BrowserWindow.Brush(...)`. Calls inside `BrowserWindow` remain
unqualified because they are valid members of that class; other non-`BrowserWindow` classes
already used the qualified form.

## Additional audit findings

1. **Release skew:** archive/folder naming said 8.0.3, while `BrowserVersion`, README, profile,
   VEC1 integration and hardening documentation said 8.1.0. The 8.1.0 code is treated as the
   real parent release; 8.1.1 is the repaired package.
2. **Stale regression assertions:** several tests still required 8.0.3 profile strings,
   `CubicEase`, and the pre-growing-buffer string ABI implementation. These contradicted the
   hardened 8.1.0 code and are updated to current invariants rather than deleted.
3. **Missing compile-specific guard:** existing tests covered `Action` name shadowing and
   joined-compilation-unit ordering but did not guard the `Brush` type/helper ambiguity. A
   dedicated source-range regression check is now present in Python tests and both package
   verifiers.
4. **Runtime seal version not enforced by presenter:** the runtime seal carried a version but
   startup did not compare it to `BrowserVersion.Full`. The presenter now fails closed when the
   two differ.
5. **Package integrity drift:** the uploaded package manifest did not match three JA21 IR files.
   The final 8.1.1 package is resealed after all repairs so current bytes, sizes and hashes are
   authoritative.

## Hardening decisions

- Preserve the 8.1.0 network/address/resource/VEC1 hardening; do not downgrade code to satisfy
  old tests.
- Make helper ownership explicit across class boundaries.
- Fail closed on release-seal mismatch before runtime file trust is established.
- Keep Windows WPF `Add-Type` as the definitive live compile qualification; Linux validation
  performs static source gates and the cross-platform Python/control-plane suites because WPF
  assemblies are not available in this audit environment.
- Preserve the existing documented limitation that the shipped DF_Medium Windows DLL predates
  the staged 8.0.3 HTML character-reference native patch. This patch does not claim to rebuild
  that DLL.

## Expected Windows result

`Start JA21 Virtual Browser.cmd` should no longer stop on `shell.BorderBrush = Brush(...)`.
Run `Verify JA21 Virtual Browser.cmd` first; its `Add-Type` step is the target-host compile
qualification and now also checks the 8.1.1 regression markers.
