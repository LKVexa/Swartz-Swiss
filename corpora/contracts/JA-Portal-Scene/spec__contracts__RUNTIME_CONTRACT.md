# Runtime Contract

The runtime admits only compiler-certified scene packages. It executes events, systems, animation, physics, UI, audio, terrain, portals, snapshots, and save/load transitions according to one deterministic scheduling profile. Network access and unknown-code execution are forbidden. Resource reads are hash-verified. Every run emits a trace and MCRT receipt containing source identity, package identity, target profile, admitted capabilities, output hashes, replay status, and limitations.
