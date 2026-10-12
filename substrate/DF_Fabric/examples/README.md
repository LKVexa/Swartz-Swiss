# examples/ (DF_Fabric)

* `01_bell_pair.pal` .. `06_noise_density.pal` -- the corpora's six programs; `./RUN examples/NN_*.pal` runs each one's witness on every bound node (replica), as a chain of segments (pipeline) and as a BSP program with collectives.
* `df_long_chain_240.pal` -- a 240-row bundle (8-qubit preparation, H/CX rounds, measurement) that verifies under pacore and exercises the pipeline program: three 84-row segments placed on three distinct nodes (gate `F6`).
* `../fabric/FABRIC.pal` -- the fabric's own declaration; `./RUN` with no argument witnesses it on all four nodes.
