# 4.4.0 Performance Accounting

The 4.3.0 evidence retains the raw ISA throughput measurements from before secure-boot enforcement. That benchmark loads instructions directly through the public development loader. In 4.4.0, **production direct instruction injection is intentionally forbidden**, so presenting the same harness as a production 4.4 throughput number would defeat the security boundary being qualified.

The 4.4 qualifier therefore records the elapsed host-reference time for the complete 23-test secure-boot regression suite and retains the 4.3 raw-ISA figures as historical baseline evidence. These are explicitly marked **not like-for-like**. The material new cost is Ed25519/policy/manifest verification on load/start; it is paid at authority transitions, not per ordinary VM instruction. No performance value is used to waive correctness, sanitizer, determinism, or size gates.
