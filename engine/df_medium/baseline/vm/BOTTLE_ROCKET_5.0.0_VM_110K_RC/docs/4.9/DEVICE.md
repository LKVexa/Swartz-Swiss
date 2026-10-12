# Device Specification
Device ABI 1.0 defines console, persistent block, monotonic state, entropy, clock, mailbox, diagnostics, and optional network classes. Calls are capability gated, buffer bounded, quota governed, and deterministic-replay aware. Network is optional, absent/offline by default, and never appears implicitly.
