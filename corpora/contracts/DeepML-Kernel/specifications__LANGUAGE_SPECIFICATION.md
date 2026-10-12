# DeepML Kernel Language Specification 1.0.0

## Status

This is a **provisional suite specification** reconstructed from the supplied 10,000-record corpus. It defines a stable educational and tooling target. A future native parser may refine syntax only through the governance change gates.

## Design objective

DeepML Kernel Language expresses constrained tensor kernels with explicit target, precision, determinism, memory, verification, race-safety, policy, and emission declarations. The language favors reviewable intent over implicit device behavior.

## Compilation unit

A compilation unit contains a source-version declaration, module identity, one or more imports, policy declarations, a kernel declaration, verification assertions, and an emitted artifact name. The corpus uses `ja source 0.3`, `use DeepMLKernel`, and `policy no_network` as its baseline envelope.

## Kernel contract

A kernel has typed inputs and outputs. Tensor shapes may be static or symbolic. The body may include parallel iteration, tiling, vectorization, memory access, reductions, synchronization, and custom operations as extended profiles permit.

## Declared execution dimensions

- **Target:** CPU, GPU, NPU, or a registered backend.
- **Precision:** strict, balanced, fast, or a versioned numerical profile.
- **Determinism:** reproducible or a declared weaker class.
- **Memory:** global, shared, local, or a backend-defined address space.

## Static obligations

A conforming compiler checks syntax, type consistency, shape constraints, bounds, memory-space legality, race freedom, barrier placement, atomic use, capability availability, policy admission, and artifact identity. Rejected records retain their diagnostic code and must not emit an executable artifact.

## Feature vocabulary

The corpus covers 31 features: `atomic_operation`, `autodiff_primitive`, `backend_lowering`, `barrier`, `bounds_proof`, `custom_operator`, `determinism_mode`, `device_target`, `device_transfer`, `global_memory`, `kernel_fusion`, `launch_dimensions`, `layout`, `local_memory`, `memory_space`, `parallel_loop`, `precision_mode`, `quantized_type`, `race_analysis`, `reduction`, `scalar_type`, `shared_memory`, `simd`, `sparse_type`, `static_shape`, `stride`, `symbolic_shape`, `tensor_type`, `tiling`, `tolerance_equivalence`, `vectorization`.

## Validation classes

Positive, negative, boundary, integration, security, performance, determinism, interoperability, recovery, and certification records are equally part of the language definition. An implementation that only accepts positive programs is not a conformance implementation.
