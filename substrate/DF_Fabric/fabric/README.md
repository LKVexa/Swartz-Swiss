# fabric/

* `FABRIC.pal` -- the federation declared as a PA-LCTL bundle: `DECLARE_FEDERATION DF0`, two `DECLARE_DOMAIN`s, four `DECLARE_NODE`s, six `DECLARE_LINK` classical channels, `DECLARE_TOPOLOGY`, and the three fabric programs stated as SPAWN / BARRIER / AWAIT / REGION / collective rows (declarative; see the roadmap). Verifies under `pacore.lang`; seal in `FABRIC_SEAL.json`; `./RUN` witnesses it on all four nodes.
* `FEDERATION.json` -- `pacore.fabric.Federation.as_dict()` of the federation the runtime builds (2 domains, 4 groups, 4 workers with measured `ResourceLimits`).
* `TOPOLOGY.json` -- nodes and links (`qcapacity 0`).
* `NODES.json` -- the four node containers, pinned by digest.
