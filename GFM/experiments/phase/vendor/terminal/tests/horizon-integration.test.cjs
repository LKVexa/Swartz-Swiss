'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { fixture, project } = require('./helpers/app-fixture.cjs');

const snapshot = h => h.plain(h.app.snapshot());
function close(actual, expected, epsilon = 1e-10) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= epsilon * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}
async function run(h, command) { const r = await h.app.run(command); assert.ok(r && r.ok, r && r.summary); return h.plain(r); }
async function control(h, values = {}) {
  for (const [id, value] of Object.entries(values)) h.node(id).value = String(value);
  await h.node('h-run-comparison').emit('click');
  await h.settled();
  await new Promise(resolve => setImmediate(resolve));
}

test('horizon panel boots from the actual 49-entry data and keeps its preset inert', async () => {
  const h = fixture(), before = snapshot(h);
  assert.equal(h.horizonRegistry.entries.length, 49);
  assert.equal(h.node('h-equation-list').children.length, 49);
  assert.equal(h.node('h-branches').children.length, 2);
  assert.equal(h.node('h-user-writeup').textContent, h.horizonData.simulationSpecification.userWriteup);
  assert.match(h.node('h-observation-result').textContent, /Unidentifiable/);
  const preset = h.query('.preset').find(node => node.textContent === 'Horizon reapplication');
  assert.ok(preset);
  await preset.emit('click');
  assert.equal(h.node('sequence').value, 'horizon.reapply\ngf.verify\ngf.wigner\nledger.record Horizon GFM signal');
  assert.deepEqual(snapshot(h), before);
  assert.equal(h.app.getReturns().length, 0);
  const tab = h.query('.workspace-tab').find(node => node.dataset.view === 'horizon');
  await tab.emit('click');
  assert.equal(tab.getAttribute('aria-pressed'), 'true');
});

test('ordinary horizon, metric, SI and source inspectors preserve the active finite state', async () => {
  const h = fixture(); await run(h, 'gf.field gf8'); await run(h, 'gf.fourier');
  const before = snapshot(h);
  const listed = await run(h, 'horizon.list');
  assert.equal(listed.details.entries.length, 49);
  const referenceOnly = h.horizonRegistry.entries.find(entry => entry.status === 'reference-only');
  const shown = await run(h, 'horizon.show ' + referenceOnly.id);
  assert.equal(shown.details.entry.status, 'reference-only');
  assert.equal(shown.details.statePreserved, true);
  const filtered = await run(h, 'horizon.list toy-assumption');
  assert.ok(filtered.details.entries.length > 0);
  assert.ok(filtered.details.entries.every(entry => entry.status === 'toy-assumption'));
  const reference = await run(h, 'horizon.reference 1 0.6 0.3');
  assert.equal(reference.details.smarr.passed, true);
  close(reference.details.rPlus, 1 + Math.sqrt(.55));
  const metric = await run(h, 'horizon.metric 1 0.6 0.3 3 1.0471975511965976');
  assert.equal(metric.details.signature, '-+++');
  assert.equal(metric.details.matrix.length, 4);
  const si = await run(h, 'horizon.si 1.98847e30');
  assert.ok(si.details.temperature > 0);
  assert.ok(si.details.radius > 2000 && si.details.radius < 4000);
  for (const result of [listed, shown, filtered, reference, metric, si]) assert.equal(result.details.statePreserved, true);
  assert.deepEqual(snapshot(h), before);
});

test('logical GF4 map inspector keeps the active GF8 state and retains nonunitary output norm', async () => {
  const h = fixture(); await run(h, 'gf.field gf8'); await run(h, 'gf.basis 3');
  const before = snapshot(h), identity = await run(h, 'horizon.map');
  assert.equal(identity.details.reapplication.field, 'gf4');
  assert.equal(identity.details.reapplication.unitarity.isUnitary, true);
  assert.equal(identity.details.statePreserved, true);
  const K = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => i === 0 && j === 0 ? 1 : 0));
  const mapped = await run(h, 'horizon.map ' + JSON.stringify({ epsilonMap: 1, K, state: [1, 0, 0, 0] }));
  assert.equal(mapped.details.reapplication.unitarity.isUnitary, false);
  assert.equal(mapped.details.reapplication.outputNormalized, false);
  close(mapped.details.reapplication.norms.output, 2);
  assert.match(mapped.details.scope, /not a rank-\(1,1\) spacetime tensor/);
  assert.deepEqual(snapshot(h), before);
});

test('metric sample preparation keeps grid, units and scale; zero profiles preserve that state', async () => {
  const h = fixture(), result = await run(h, 'horizon.sample gtt 1 0.99 0 2 8 1.5707963267948966');
  assert.equal(result.details.encoding, 'normalized-signal');
  const prepared = snapshot(h);
  assert.equal(prepared.preparation.family, 'horizon-gtt');
  assert.equal(prepared.preparation.codec.kind, 'horizon-radial-grid');
  assert.equal(prepared.preparation.codec.nodes.length, 9);
  assert.equal(prepared.preparation.codec.units, 'dimensionless');
  assert.ok(prepared.preparation.originalL2Scale > 0);
  close(prepared.normSquared, 1);
  for (const command of ['horizon.sample frameOmega 1 0 0 3 8 1.5707963267948966', 'horizon.signal aggiePassage']) {
    const zero = await run(h, command);
    assert.equal(zero.details.encoding, 'zero-signal-no-state');
    assert.equal(zero.details.preparedState, null);
    assert.equal(zero.details.statePreserved, true);
    assert.deepEqual(snapshot(h), prepared);
  }
  await run(h, 'horizon.scenario {"aggieLoad":0}');
  const passage = await run(h, 'horizon.signal aggiePassage');
  assert.equal(passage.details.encoding, 'normalized-signal');
  assert.equal(snapshot(h).preparation.codec.kind, 'hypothetical-spin-grid');
  assert.equal(snapshot(h).preparation.codec.parameters.aggieLoad, 0);
  close(snapshot(h).normSquared, 1);
});

test('scenario controls separate shared exterior observations from the optional toy passage probe', async () => {
  const h = fixture(), before = snapshot(h);
  await control(h, { 'h-spin': .99, 'h-load': 2, 'h-probe': 'passage' });
  assert.match(h.node('h-observation-result').textContent, /distinguish the branches/);
  assert.match(h.node('h-protocol-note').textContent, /relax the all-tests-indistinguishable premise/);
  assert.deepEqual(snapshot(h), before);
  await control(h, { 'h-probe': 'exterior' });
  assert.match(h.node('h-observation-result').textContent, /Unidentifiable/);
  await control(h, { 'h-spin': .3, 'h-critical': .3, 'h-probe': 'passage' });
  assert.equal(h.node('h-spin').value, '0.3');
  assert.match(h.node('h-observation-result').textContent, /Unidentifiable/);
  assert.match(h.node('h-branches').children[0].children.find(node => node.tagName === 'p').textContent, /radius 0/);
  const saved = await h.exported();
  assert.equal(saved.data.horizonSimulation.probe, 'passage');
  assert.equal(saved.data.horizonSimulation.parameters.alphaCritical, .3);
  assert.equal(saved.data.horizonSimulation.parameters.epsilonSpin, .7);
});

test('failed commands and invalid control changes roll back preparation, state and scenario context', async () => {
  const h = fixture(); await run(h, 'horizon.signal aperture');
  await control(h, { 'h-load': 0, 'h-probe': 'passage' });
  const before = snapshot(h), context = (await h.exported()).data.horizonSimulation;
  for (const command of ['horizon.scenario {"Q":2}', 'horizon.sample gtt 1 0.99 0 1 8 1.5707963267948966',
    'horizon.signal aggiePassage {"sealThreshold":0}', 'horizon.map {"epsilonSpin":0.1}',
    'horizon.map {"epsilonMap":1,"K":[[1]],"state":[1,0,0,0]}', 'horizon.reference 1 1 0.1']) {
    const result = await h.app.run(command);
    assert.equal(result.ok, false, command);
    assert.equal(result.details.statePreserved, true);
    assert.deepEqual(snapshot(h), before);
  }
  await control(h, { 'h-spin': 2, 'h-probe': 'exterior' });
  assert.equal(h.node('h-probe').value, 'passage');
  assert.equal(h.node('h-spin').value, String(1 - context.parameters.epsilonSpin));
  assert.deepEqual((await h.exported()).data.horizonSimulation, context);
});

test('session round trip restores the hypothesis/probe and sample metadata while command history remains inert', async () => {
  const h = fixture(); await run(h, 'horizon.signal aperture');
  await control(h, { 'h-spin': .9, 'h-critical': .7, 'h-load': 0, 'h-radius': 2, 'h-probe': 'passage' });
  await run(h, 'gf.displace 3 4'); await run(h, 'ledger.record Scenario signal');
  const before = snapshot(h), packet = await h.exported();
  assert.equal(packet.data.version, '0.5.0');
  assert.equal(packet.sha256, await h.app.digest(packet.data));
  assert.equal(packet.data.horizonSimulation.probe, 'passage');
  assert.equal(packet.data.horizonSimulation.parameters.r0, 2);
  assert.equal(packet.data.snapshot.preparation.subsequentOperations.at(-1), 'Displacement (3, 4)');
  // A valid but different command in the saved history is evidence, not an instruction.
  packet.data.commandProvenance.push('gf.field gf4');
  packet.sha256 = await h.app.digest(packet.data);
  const restored = fixture(); await restored.import(packet);
  assert.deepEqual(snapshot(restored), before);
  assert.deepEqual(restored.plain(restored.app.getRecords()), packet.data.records);
  assert.deepEqual(restored.plain(restored.app.getReturns()), packet.data.returns);
  assert.equal(restored.node('h-probe').value, 'passage');
  assert.equal(restored.node('h-load').value, '0');
  assert.equal(restored.node('h-radius').value, '2');
  assert.deepEqual((await restored.exported()).data.horizonSimulation, packet.data.horizonSimulation);
});

test('rehashed invalid contexts and radial codecs reject before import changes state or records', async () => {
  const h = fixture(); await run(h, 'horizon.sample gtt 1 0.99 0 2 8 1.5707963267948966');
  await run(h, 'ledger.record Retain on invalid import');
  const valid = await h.exported(), before = snapshot(h), records = h.plain(h.app.getRecords());
  const mutate = [
    data => { data.horizonSimulation.probe = 'unrestricted'; },
    data => { data.horizonSimulation.parameters.Q = 2; },
    data => { data.horizonSimulation.parameters = null; },
    data => { data.horizonSimulation.hiddenFormation = 'gaseous'; },
    data => { data.snapshot.preparation.codec.nodes.pop(); },
    data => { data.snapshot.preparation.codec.component = 'traversability'; },
    data => { data.snapshot.preparation.codec.referenceParameters.Q = 2; },
    data => { data.snapshot.preparation.codec.nodes[0] = 1; },
    data => { data.snapshot.preparation.originalL2Scale = 0; }
  ];
  for (const change of mutate) {
    const packet = structuredClone(valid); change(packet.data); packet.sha256 = await h.app.digest(packet.data);
    await assert.rejects(() => h.app.validatePacket(packet));
    await h.import(packet);
    assert.deepEqual(snapshot(h), before);
    assert.deepEqual(h.plain(h.app.getRecords()), records);
    assert.equal(h.node('h-probe').value, 'exterior');
  }
});

test('horizon verification and export retain the current model and declared evidence domains', async () => {
  const h = fixture(); await run(h, 'gf.field gf8'); await run(h, 'gf.basis 3');
  const before = snapshot(h), verification = await run(h, 'horizon.verify');
  assert.equal(verification.details.audit.passed, true);
  assert.equal(verification.details.coverage.newFindings, 49);
  assert.equal(verification.details.coverage.pdfNumberedEquations, 23);
  assert.equal(verification.details.coverage.previousFindings, 20);
  const packet = await h.exported('horizon.export');
  assert.equal(packet.data.schema, 'RUSSL-horizon-export/1');
  assert.equal(packet.data.version, '0.4.0');
  assert.equal(packet.sha256, await h.app.digest(packet.data));
  assert.deepEqual(packet.data.snapshot, before);
  assert.equal(packet.data.reapplication.equationRegistry.entries.length, 49);
  assert.equal(packet.data.reapplication.observerResult.comparison.identical, true);
  assert.equal(packet.data.reapplication.observerResult.transformedDifference, 0);
  const spec = await h.exported('horizon.spec');
  assert.equal(spec.userWriteup, h.horizonData.simulationSpecification.userWriteup);
  assert.equal(spec.observationProtocol, 'exterior');
  assert.deepEqual(snapshot(h), before);
});

test('UI model load preserves all prior ledger records and reference state while recording raw GF9 mechanics', async () => {
  const h = fixture(); h.ready();
  await run(h, 'workbench.capture'); await run(h, 'ledger.record Before horizon load');
  const records = h.plain(h.app.getRecords());
  await run(h, 'gf.field gf8');
  const reference = snapshot(h);
  await h.node('h-loadmodel').emit('click'); await h.settled();
  const after = h.plain(h.app.getRecords()), active = h.plain(h.app.mechanicsSnapshot());
  assert.equal(active.field, 'gf9'); assert.equal(active.domain, 'complex-signal');
  assert.equal(active.codec.kind, 'horizon-radial-grid'); assert.equal(active.codec.profile, 'gtt');
  assert.equal(active.representation, 'trace-coefficients'); assert.deepEqual(active.operations, ['trace.forward']);
  assert.deepEqual(snapshot(h), reference);
  assert.deepEqual(after.slice(0, records.length), records);
  assert.equal(after.length, records.length + 1);
  assert.equal(after.at(-1).sha256, await h.app.digest(after.at(-1).data));
  assert.equal(after.at(-1).data.kind, 'gfm-dataset'); assert.deepEqual(after.at(-1).data.payload.dataset, active);
  assert.equal(h.app.getReturns().at(-2).command, 'gfm.reapply');
  assert.equal(h.app.getReturns().at(-2).details.audit.passed, true);
  assert.equal(h.app.getReturns().at(-1).command, 'gfm.record Reapplied GFM mechanics data');
});

test('historical v0.3 and new horizon examples validate and reload without executing their provenance', async () => {
  for (const [name, version] of [['GFM-Reapplied-session.json', '0.3.0'], ['Horizon-Simulation-session.json', '0.4.0']]) {
    const h = fixture(), packet = JSON.parse(fs.readFileSync(path.join(project, 'examples', name), 'utf8'));
    const retained = JSON.stringify(packet);
    assert.equal(packet.data.version, version);
    assert.equal(packet.sha256, await h.app.digest(packet.data));
    await h.app.validatePacket(packet); await h.import(packet);
    assert.deepEqual(snapshot(h), packet.data.snapshot);
    assert.deepEqual(h.plain(h.app.getRecords()), packet.data.records);
    assert.deepEqual(h.plain(h.app.getReturns()), packet.data.returns);
    assert.equal(JSON.stringify(packet), retained);
    for (const record of packet.data.records) assert.equal(record.sha256, await h.app.digest(record.data));
    if (version === '0.3.0') assert.equal(h.node('h-probe').value, 'exterior');
    else assert.equal(h.node('h-probe').value, packet.data.horizonSimulation.probe);
  }
});
