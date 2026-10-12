# 4.3.0 Performance Delta

The pre-change 4.2.0 archive was benchmarked on the same host before the 4.3.0 conversion. The final 4.3.0 evidence uses the median of five runs to reduce scheduler/noise sensitivity.

| Metric | 4.2.0 pre-change | 4.3.0 median-5 | Delta |
|---|---:|---:|---:|
| Instruction throughput | 95,174,332.920/s | 135,117,957.713/s | +41.97% |
| Arithmetic throughput | 72,197.990/s | 77,198.938/s | +6.93% |
| Load/store throughput | 749,073.695/s | 819,420.061/s | +9.39% |
| Branch throughput | 62,977,543.832/s | 62,015,624.061/s | -1.53% |

The branch delta is small relative to the observed run-to-run variation and is recorded rather than hidden. One redundant per-instruction capability lookup was removed before the final qualification; no correctness, capability, trap, lifecycle, or size gate was relaxed to obtain these results. Performance remains a host-reference microbenchmark, not a physical SIM/UICC/eSIM hardware claim.
