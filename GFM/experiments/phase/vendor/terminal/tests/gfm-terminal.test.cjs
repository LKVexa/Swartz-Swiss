'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { fixture, project } = require('./helpers/app-fixture.cjs');
const mechanics = h => h.plain(h.app.mechanicsSnapshot());
const legacy = h => h.plain(h.app.snapshot());
const c = (re, im = 0) => ({ re, im });
const norm = values => values.reduce((sum, value) => Math.hypot(sum, value.re, value.im), 0);
function close(actual, expected, scale = 1) {
  assert.ok(Number.isFinite(actual) && Math.abs(actual - expected) <= 1e-10 * Math.max(scale, Math.abs(expected)), `${actual} differs from ${expected}`);
}
function vectorClose(actual, expected) {
  assert.equal(actual.length, expected.length);
  const scale = Math.max(norm(expected), Number.MIN_VALUE);
  actual.forEach((value, i) => { close(value.re, expected[i].re, scale); close(value.im, expected[i].im, scale); });
}
async function run(h, command) { const result = await h.app.run(command); assert.ok(result && result.ok, result && result.summary); return h.plain(result); }
const mod3 = value => (value % 3 + 3) % 3;
const add9 = (a, b) => mod3(a % 3 + b % 3) + 3 * mod3(Math.floor(a / 3) + Math.floor(b / 3));
const mul9 = (a, b) => mod3(a % 3 * (b % 3) - Math.floor(a / 3) * Math.floor(b / 3))
  + 3 * mod3(a % 3 * Math.floor(b / 3) + Math.floor(a / 3) * (b % 3));
function pow9(value, exponent) { let result = 1; for (let i = 0; i < exponent; i++) result = mul9(result, value); return result; }
function trace9(values, inverse = false) {
  // In GF9 = GF3[alpha]/(alpha^2+1), Tr(a+b alpha)=2a.
  return values.map((_, k) => values.reduce((sum, value, x) => {
    const angle = (inverse ? -1 : 1) * 2 * Math.PI * mod3(2 * (mul9(k, x) % 3)) / 3;
    return c(sum.re + (value.re * Math.cos(angle) - value.im * Math.sin(angle)) / 3,
      sum.im + (value.re * Math.sin(angle) + value.im * Math.cos(angle)) / 3);
  }, c(0)));
}
function polynomial9(values) {
  const root = Array.from({ length: 8 }, (_, i) => i + 1).find(x => new Set(Array.from({ length: 8 }, (_, j) => pow9(x, j))).size === 8);
  return { root, values: values.map((_, k) => values.reduce((sum, value, j) => add9(sum, mul9(value, pow9(root, j * k % 8))), 0)) };
}

test('primary terminal boots from raw pendulum data, with reference math hidden', async () => {
  const h = fixture(), d = mechanics(h), before = legacy(h);
  assert.equal(d.schema, 'RUSSL-GFM-dataset/1'); assert.equal(d.field, 'gf9');
  assert.equal(d.domain, 'complex-signal'); assert.equal(d.representation, 'samples');
  assert.equal(d.codec.profile, 'pendulum'); assert.equal(d.codec.units.value, 'radians/second^2');
  vectorClose(d.values, Array.from({ length: 9 }, (_, j) => c(-9.81 * Math.sin(.2 * (j / 4 - 1)))));
  assert.ok(norm(d.values) > 1); assert.equal(d.values[4].re, 0);
  assert.deepEqual(d.operations, []);
  assert.equal(h.node('legacy-state-panel').hidden, true); assert.equal(h.node('legacy-kernel-panel').hidden, true);
  assert.equal(h.node('m-reference-toggle').textContent, 'Show reference math');
  assert.equal(h.node('m-energy-label').textContent, 'L2 ENERGY');
  close(Number(h.node('m-energy').textContent), norm(d.values) ** 2, 1e5);
  const catalogue = h.node('command-list').children.map(node => node.children[0] && node.children[0].textContent).filter(Boolean);
  assert.ok(catalogue.some(command => command.startsWith('gfm.')));
  assert.equal(catalogue.some(command => /^(?:gf\.|math\.|model\.)/.test(command)), false);
  await h.node('m-reference-toggle').emit('click');
  assert.equal(h.node('legacy-state-panel').hidden, false); assert.equal(h.node('legacy-kernel-panel').hidden, false);
  assert.deepEqual(mechanics(h), d); assert.deepEqual(legacy(h), before);
  await h.node('m-reference-toggle').emit('click'); assert.equal(h.node('legacy-state-panel').hidden, true);
});

test('hidden reference Wigner view remains hidden through return-tab rerenders and mechanics commands', async () => {
  const h = fixture(), raw = mechanics(h), savedLegacy = legacy(h);
  await run(h, 'gf.wigner');
  assert.equal(h.node('legacy-state-panel').hidden, false); assert.equal(h.node('wigner-panel').hidden, false);
  assert.ok(h.node('wigner-grid').children.length > 0);
  await h.node('m-reference-toggle').emit('click');
  assert.equal(h.node('legacy-state-panel').hidden, true); assert.equal(h.node('wigner-panel').hidden, true);
  for (const tab of h.query('.return-tabs button')) {
    await tab.emit('click'); assert.equal(h.node('wigner-panel').hidden, true, tab.dataset.result + ' must respect hidden reference math');
  }
  // Explicitly showing the reference math still reveals its retained result.
  await h.node('m-reference-toggle').emit('click'); assert.equal(h.node('wigner-panel').hidden, false);
  await run(h, 'gfm.status'); assert.equal(h.node('wigner-panel').hidden, true);
  for (const tab of h.query('.return-tabs button')) { await tab.emit('click'); assert.equal(h.node('wigner-panel').hidden, true); }
  assert.deepEqual(mechanics(h), raw); assert.deepEqual(legacy(h), savedLegacy);
});

test('raw complex trace transform matches an independent GF9 character calculation and retains magnitude', async () => {
  const h = fixture(), savedLegacy = legacy(h), values = [c(3, 4), c(-2, 1), c(0), c(8), c(.25, -2), c(-4), c(0, 3), c(1), c(0)];
  const input = { field: 'gf9', values, codec: { kind: 'instrument-readings', units: 'm/s', nodes: [0, 1, 2, 3, 4, 5, 6, 7, 8] } };
  await run(h, 'gfm.signal ' + JSON.stringify(input)); const original = mechanics(h);
  assert.deepEqual(original.values, values); assert.ok(norm(original.values) > 1);
  const transformed = await run(h, 'gfm.transform');
  vectorClose(mechanics(h).values, trace9(values));
  close(transformed.details.inputNorm, norm(values)); close(transformed.details.outputNorm, norm(values));
  assert.equal(transformed.details.kernel.normalization, 'kernel 1/sqrt(q); no dataset normalization');
  assert.equal(transformed.details.kernel.kind, 'complex-trace-character');
  assert.equal(mechanics(h).representation, 'trace-coefficients');
  assert.deepEqual(mechanics(h).codec, original.codec); assert.deepEqual(mechanics(h).operations, ['trace.forward']);
  assert.equal(h.node('m-forward').disabled, true); assert.equal(h.node('m-inverse').disabled, false);
  await run(h, 'gfm.transform inverse'); vectorClose(mechanics(h).values, values);
  assert.equal(mechanics(h).representation, 'samples'); assert.deepEqual(mechanics(h).operations, ['trace.forward', 'trace.inverse']);
  assert.deepEqual(legacy(h), savedLegacy);
});

test('large raw signal scale remains in the returned values rather than a normalized state', async () => {
  const h = fixture(), values = Array.from({ length: 9 }, (_, j) => c(j === 0 ? 3e90 : 0, j === 1 ? 4e90 : 0));
  await run(h, 'gfm.signal ' + JSON.stringify(values));
  const transformed = await run(h, 'gfm.transform');
  assert.ok(transformed.details.computationScale > 1e80);
  vectorClose(mechanics(h).values, trace9(values)); close(norm(mechanics(h).values), 5e90);
  await run(h, 'gfm.transform inverse'); vectorClose(mechanics(h).values, values);
});

test('exact coefficient transform uses finite-field polynomial evaluation on nonzero GF9 nodes', async () => {
  const h = fixture(), savedLegacy = legacy(h), values = [0, 1, 2, 3, 4, 5, 6, 7], expected = polynomial9(values);
  await run(h, 'gfm.coefficients ' + JSON.stringify({ field: 'gf9', values, codec: { units: 'field elements', experiment: 'Polynomial' } }));
  const original = mechanics(h), result = await run(h, 'gfm.transform');
  assert.equal(original.domain, 'field-values'); assert.equal(original.values.length, 8);
  assert.deepEqual(mechanics(h).values, expected.values); assert.equal(result.details.kernel.primitiveRoot, expected.root);
  assert.equal(result.details.kernel.kind, 'finite-field-multiplicative-DFT');
  assert.deepEqual(result.details.ordering.nonzeroFieldNodes, Array.from({ length: 8 }, (_, j) => pow9(expected.root, j)));
  assert.equal(result.details.kernel.length, 8); assert.equal(result.details.kernel.embeddedLength, 2);
  assert.equal(result.details.kernel.inverseLength, 2); assert.equal(mechanics(h).representation, 'polynomial-coefficients');
  assert.equal(h.node('m-bars').hidden, true); assert.equal(h.node('m-energy-label').textContent, 'EXACT COEFFICIENTS');
  assert.equal(result.details.inputNorm, undefined); assert.equal(result.details.checks.energyPreservation, undefined);
  assert.match(result.details.scope, /probabilities do not apply/);
  await run(h, 'gfm.transform inverse'); assert.deepEqual(mechanics(h).values, values);
  assert.deepEqual(mechanics(h).codec, original.codec); assert.deepEqual(legacy(h), savedLegacy);
  await run(h, 'gfm.coefficients {"field":"gf3","values":[1,2]}');
  await run(h, 'gfm.transform'); assert.deepEqual(mechanics(h).values, [0, 2]);
  await run(h, 'gfm.transform inverse'); assert.deepEqual(mechanics(h).values, [1, 2]);
});

test('zero raw data are valid on every field and survive transformation, verification and the sealed passage profile', async () => {
  const h = fixture(), savedLegacy = legacy(h);
  for (const field of ['gf3', 'gf4', 'gf8', 'gf9', 'gf16']) {
    await run(h, 'gfm.field ' + field); const zero = mechanics(h);
    assert.ok(zero.values.every(value => value.re === 0 && value.im === 0));
    await run(h, 'gfm.transform'); assert.ok(mechanics(h).values.every(value => value.re === 0 && value.im === 0));
    const before = mechanics(h), verify = await run(h, 'gfm.verify');
    assert.equal(verify.details.audit.passed, true); assert.equal(verify.details.inputNorm, 0); assert.equal(verify.details.outputNorm, 0);
    assert.deepEqual(mechanics(h), before);
    await run(h, 'gfm.transform inverse'); assert.deepEqual(mechanics(h).values, zero.values);
  }
  await run(h, 'gfm.field gf9'); await run(h, 'gfm.aperture aggiePassage');
  assert.equal(mechanics(h).codec.sourceStatus, 'toy-assumption');
  assert.ok(mechanics(h).values.every(value => value.re === 0 && value.im === 0));
  await run(h, 'gfm.transform'); assert.equal(h.node('m-energy').textContent, '0');
  assert.ok(h.node('m-bars').children.every(node => node.children[0].style.height === '0%'));
  assert.deepEqual(legacy(h), savedLegacy);
});

test('ordinary and hypothetical profiles retain physical coordinate grids and declared units', async () => {
  const h = fixture(), savedLegacy = legacy(h);
  await run(h, 'gfm.pendulum 8 2 0.2'); let d = mechanics(h);
  vectorClose(d.values, d.codec.nodes.map(theta => c(-4 * Math.sin(theta))));
  close(d.codec.reference.omega, 2); close(d.codec.reference.smallAnglePeriod, Math.PI);
  assert.equal(d.codec.units.theta, 'radians'); assert.equal(d.codec.units.value, 'radians/second^2');
  await run(h, 'gfm.horizon gtt 1 0 0 3 7 1.5707963267948966'); d = mechanics(h);
  vectorClose(d.values, d.codec.nodes.map(r => c(-1 + 2 / r)));
  assert.equal(d.codec.units, 'dimensionless'); assert.deepEqual(d.codec.range, [3, 7]);
  assert.match(d.codec.scope, /not a spacetime coordinate transformation/);
  await run(h, 'gfm.horizon frameOmega 1 0 0 3 7 1.5707963267948966');
  assert.ok(mechanics(h).values.every(value => value.re === 0 && value.im === 0));
  assert.equal(mechanics(h).codec.units, 'inverse geometrized length');
  await run(h, 'gfm.aperture aperture {"alphaCritical":0.8,"r0":2}'); d = mechanics(h);
  assert.equal(d.codec.units, 'toy length'); assert.equal(d.codec.coordinate, 'alpha=a/M');
  assert.equal(d.values[0].re, 0); close(d.values.at(-1).re, 1.2);
  assert.deepEqual(legacy(h), savedLegacy);
});

test('exact mechanics inspectors use the mechanics field, preserve datasets and reject binary characteristic', async () => {
  const h = fixture(); await run(h, 'gf.field gf8'); await run(h, 'gfm.field gf9');
  const before = mechanics(h), savedLegacy = legacy(h), oscillator = await run(h, 'gfm.oscillator 1 0 1 1 12');
  const status = await run(h, 'status'); assert.match(status.summary, /GFM · gf9/);
  assert.deepEqual(status.details.mechanics, before); assert.deepEqual(status.details.referenceMathSnapshot, savedLegacy);
  assert.deepEqual(oscillator.details.matrix, [[2, 1], [0, 2]]); assert.deepEqual(oscillator.details.final, { q: 1, v: 0 });
  assert.equal(oscillator.details.orbit.length, 2); assert.equal(oscillator.details.audit.passed, true);
  const rotation = await run(h, 'gfm.rotate x 1 1 2 0');
  assert.deepEqual(rotation.details.output, [1, 0, 2]); assert.equal(rotation.details.determinant, 1);
  assert.deepEqual(mechanics(h), before); assert.deepEqual(legacy(h), savedLegacy);
  await run(h, 'gfm.field gf4'); const binary = mechanics(h);
  for (const command of ['gfm.oscillator 1 0 1 1 12', 'gfm.rotate x 1 1 2 0']) {
    const result = await h.app.run(command); assert.equal(result.ok, false); assert.match(result.summary, /odd characteristic/);
    assert.deepEqual(mechanics(h), binary); assert.deepEqual(legacy(h), savedLegacy);
  }
});

test('primary equation reapplication transports raw exterior samples and preserves prior GF80 evidence', async () => {
  const h = fixture(); h.ready(); await run(h, 'workbench.capture'); await run(h, 'gf.field gf4');
  const records = h.plain(h.app.getRecords()), savedLegacy = legacy(h), result = await run(h, 'gfm.reapply');
  const d = mechanics(h), raw = result.details.report.primary.samples;
  assert.equal(d.domain, 'complex-signal'); assert.equal(d.field, 'gf9'); assert.equal(d.representation, 'trace-coefficients');
  assert.equal(d.codec.profile, 'gtt'); assert.equal(d.codec.units, 'dimensionless');
  vectorClose(d.values, trace9(raw.values)); close(norm(d.values), norm(raw.values)); assert.ok(norm(d.values) > 1);
  assert.equal(result.details.report.coverage.newFindings, 49); assert.equal(result.details.report.coverage.previousFindings, 20);
  assert.equal(result.details.report.coverage.pdfNumberedEquations, 23); assert.equal(result.details.audit.passed, true);
  assert.equal(result.details.report.wigner, undefined); assert.equal(result.details.report.finalState, undefined);
  assert.match(result.details.report.historicalReference.scope, /no quantum gates/);
  assert.deepEqual(h.plain(h.app.getRecords()), records); assert.deepEqual(legacy(h), savedLegacy);
});

test('bad primary commands roll back raw data, codec and compatibility state', async () => {
  const h = fixture(); await run(h, 'gfm.signal {"field":"gf3","values":[2,0,3],"codec":{"units":"N"}}');
  const before = mechanics(h), savedLegacy = legacy(h);
  for (const command of ['gfm.field unknown', 'gfm.signal [1,2]', 'gfm.signal {"values":[1,2,3],"execute":"gf.field gf4"}',
    'gfm.signal {"field":null,"values":[1,2,3]}', 'gfm.signal {"field":0,"values":[1,2,3]}',
    'gfm.signal {"codec":null,"values":[1,2,3]}',
    'gfm.signal [1,null,3]', 'gfm.coefficients [1,3]', 'gfm.transform inverse', 'gfm.transform reverse',
    'gfm.pendulum 9.81 0 0.2', 'gfm.horizon gtt 1 0 0 1 7 1.5707963267948966',
    'gfm.aperture traversability', 'gfm.aperture aperture {"alphaCritical":1}', 'gfm.rotate x 1 0 1',
    'gfm.oscillator 1 0 1 1 0', 'gfm.verify extra', 'gfm.export extra', 'gfm.reapply extra']) {
    const result = await h.app.run(command); assert.equal(result.ok, false, command);
    assert.deepEqual(mechanics(h), before, command); assert.deepEqual(legacy(h), savedLegacy, command);
  }
});

test('raw dataset verification and export are inspectors with reproducible envelope hashes', async () => {
  const h = fixture(); await run(h, 'gfm.signal {"field":"gf3","values":[2,0,3],"codec":{"units":"N","note":"gf.field gf4"}}');
  const before = mechanics(h), savedLegacy = legacy(h), verification = await run(h, 'gfm.verify');
  assert.equal(verification.details.mechanicsPreserved, true); assert.equal(verification.details.audit.passed, true);
  assert.deepEqual(mechanics(h), before);
  const packet = await h.exported('gfm.export');
  assert.equal(packet.data.schema, 'RUSSL-GFM-mechanics-export/1'); assert.equal(packet.data.version, '0.5.0');
  assert.equal(packet.sha256, await h.app.digest(packet.data)); assert.deepEqual(packet.data.dataset, before);
  assert.equal(packet.data.reapplication.passed, true);
  assert.equal(packet.data.reapplication.report.schema, 'RUSSL-GFM-mechanics-reapplication/1');
  assert.equal(packet.data.reapplication.report.coverage.newFindings, 49);
  assert.equal(packet.data.reapplication.report.coverage.previousFindings, 20);
  assert.equal(packet.data.simulationSpecification.userWriteup, h.horizonData.simulationSpecification.userWriteup);
  assert.match(packet.data.coefficientScope, /report uses its explicit default exterior parameters/);
  assert.deepEqual(mechanics(h), before); assert.deepEqual(legacy(h), savedLegacy);
});

test('mechanics records restore exact raw data while command provenance stays inert', async () => {
  const h = fixture(); h.ready(); await run(h, 'workbench.capture');
  await run(h, 'gfm.coefficients {"field":"gf9","values":[0,1,2,3,4,5,6,7],"codec":{"units":"field elements","note":"gfm.field gf4"}}');
  await run(h, 'gfm.transform'); const before = mechanics(h), savedLegacy = legacy(h);
  const recorded = await run(h, 'gfm.record Raw polynomial'); const records = h.plain(h.app.getRecords()), record = records.at(-1);
  assert.equal(record.data.kind, 'gfm-dataset'); assert.equal(recorded.details.kind, 'gfm-dataset');
  assert.equal(record.sha256, await h.app.digest(record.data)); assert.deepEqual(record.data.payload.dataset, before);
  await run(h, 'gfm.field gf3'); await run(h, 'ledger.restore ' + record.id);
  assert.deepEqual(mechanics(h), before); assert.deepEqual(h.plain(h.app.getRecords()), records); assert.deepEqual(legacy(h), savedLegacy);
});

test('v0.5 session round trip preserves raw mechanics and old normalized snapshot without executing history', async () => {
  const h = fixture(); await run(h, 'gf.field gf8'); await run(h, 'gf.fourier');
  await run(h, 'gfm.signal {"field":"gf3","values":[0,0,0],"codec":{"units":"binary passage bit","note":"gfm.field gf4"}}');
  await run(h, 'gfm.transform'); await run(h, 'gfm.record Zero data');
  const expected = mechanics(h), old = legacy(h), packet = await h.exported();
  assert.equal(packet.data.version, '0.5.0'); assert.equal(packet.sha256, await h.app.digest(packet.data));
  assert.deepEqual(packet.data.mechanics, expected); assert.deepEqual(packet.data.snapshot, old); close(old.normSquared, 1);
  packet.data.commandProvenance.push('gfm.field gf4'); packet.data.mechanics.operations.push('gfm.field gf16');
  packet.sha256 = await h.app.digest(packet.data);
  const restored = fixture(); await restored.app.validatePacket(packet); await restored.import(packet);
  assert.deepEqual(mechanics(restored), packet.data.mechanics); assert.deepEqual(legacy(restored), old);
  assert.deepEqual(restored.plain(restored.app.getRecords()), packet.data.records);
  assert.deepEqual(restored.plain(restored.app.getReturns()), packet.data.returns);
  assert.equal(restored.node('legacy-state-panel').hidden, true);
  assert.deepEqual((await restored.exported()).data.mechanics, packet.data.mechanics);
});

test('rehashed invalid mechanics datasets or record payloads cannot change session state', async () => {
  const h = fixture(); await run(h, 'gfm.record Initial raw data'); const valid = await h.exported();
  const before = mechanics(h), savedLegacy = legacy(h), records = h.plain(h.app.getRecords());
  const changes = [d => { d.schema = 'unknown'; }, d => { d.domain = 'probability'; }, d => { d.field = 'gf80'; },
    d => { d.representation = 'polynomial-coefficients'; }, d => { d.values.pop(); },
    d => { d.values[0].re = '1'; }, d => { d.values[0].extra = 1; }, d => { d.codec = null; },
    d => { d.operations = Array.from({ length: 101 }, () => 'trace.forward'); }, d => { d.run = 'gfm.field gf4'; }];
  for (const change of changes) for (const target of ['mechanics', 'record']) {
    const packet = h.plain(valid), d = target === 'mechanics' ? packet.data.mechanics : packet.data.records[0].data.payload.dataset;
    change(d);
    if (target === 'record') packet.data.records[0].sha256 = await h.app.digest(packet.data.records[0].data);
    packet.sha256 = await h.app.digest(packet.data);
    await assert.rejects(() => h.app.validatePacket(packet)); await h.import(packet);
    assert.deepEqual(mechanics(h), before); assert.deepEqual(legacy(h), savedLegacy); assert.deepEqual(h.plain(h.app.getRecords()), records);
  }
});

test('historical sessions load their unchanged reference state alongside a default raw mechanics dataset', async () => {
  for (const name of ['Audited-Equations-session.json', 'GFM-Reapplied-session.json', 'Horizon-Simulation-session.json']) {
    const h = fixture(), rawDefault = mechanics(h), packet = JSON.parse(fs.readFileSync(path.join(project, 'examples', name), 'utf8'));
    const saved = JSON.stringify(packet); await h.app.validatePacket(packet); await h.import(packet);
    assert.deepEqual(legacy(h), packet.data.snapshot); assert.deepEqual(mechanics(h), rawDefault);
    assert.deepEqual(h.plain(h.app.getRecords()), packet.data.records); assert.deepEqual(h.plain(h.app.getReturns()), packet.data.returns);
    assert.equal(JSON.stringify(packet), saved); assert.equal(h.node('legacy-state-panel').hidden, true);
  }
});

test('primary controls prepare raw or exact data explicitly, then transform and recover without changing reference state', async () => {
  const h = fixture(), before = mechanics(h), savedLegacy = legacy(h);
  h.node('m-field').value = 'gf3'; h.node('m-domain').value = 'complex-signal';
  h.node('m-values').value = '[2,0,3]'; h.node('m-units').value = 'N';
  assert.deepEqual(mechanics(h), before, 'Editing controls alone is inert');
  await h.node('m-prepare').emit('click'); await h.settled();
  assert.equal(mechanics(h).field, 'gf3'); assert.deepEqual(mechanics(h).values, [c(2), c(0), c(3)]);
  assert.equal(mechanics(h).codec.units, 'N');
  await h.node('m-forward').emit('click'); await h.settled();
  assert.equal(mechanics(h).representation, 'trace-coefficients');
  await h.node('m-inverse').emit('click'); await h.settled(); vectorClose(mechanics(h).values, [c(2), c(0), c(3)]);
  h.node('m-domain').value = 'field-values'; h.node('m-values').value = '[1,2]'; h.node('m-units').value = 'field elements';
  await h.node('m-prepare').emit('click'); await h.settled();
  assert.equal(mechanics(h).domain, 'field-values'); assert.deepEqual(mechanics(h).values, [1, 2]);
  await h.node('m-forward').emit('click'); await h.settled(); assert.deepEqual(mechanics(h).values, [0, 2]);
  const prepared = mechanics(h); h.node('m-values').value = '[1,3]';
  await h.node('m-prepare').emit('click'); await h.settled();
  assert.deepEqual(mechanics(h), prepared); assert.deepEqual(legacy(h), savedLegacy);
});

test('primary mechanics presets insert inert commands and execute only when run is selected', async () => {
  const h = fixture(), before = mechanics(h), savedLegacy = legacy(h);
  const preset = h.node('m-presets').children.find(node => node.textContent === 'Exact field transform');
  assert.ok(preset, 'Exact field transform must be a primary preset');
  await preset.emit('click');
  assert.match(h.node('sequence').value, /^gfm\.coefficients /);
  assert.match(h.node('sequence').value, /gfm\.transform inverse/);
  assert.deepEqual(mechanics(h), before); assert.deepEqual(legacy(h), savedLegacy);
  assert.equal(h.app.getReturns().length, 0); assert.equal(h.app.getRecords().length, 0);
  await h.node('run-sequence').emit('click'); await h.settled();
  assert.equal(mechanics(h).field, 'gf9'); assert.equal(mechanics(h).domain, 'field-values');
  assert.equal(mechanics(h).representation, 'samples'); assert.deepEqual(mechanics(h).values, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(h.app.getRecords().length, 1); assert.equal(h.app.getRecords()[0].data.kind, 'gfm-dataset');
  assert.equal(h.app.getReturns().length, 5); assert.deepEqual(legacy(h), savedLegacy);
});

test('actual v0.5 mechanics example validates, reloads inertly and restores its mechanics record', async () => {
  const h = fixture(), packet = JSON.parse(fs.readFileSync(path.join(project, 'examples/GFM-Mechanics-session.json'), 'utf8'));
  const originalBytes = JSON.stringify(packet);
  assert.equal(packet.data.version, '0.5.0'); assert.equal(packet.sha256, await h.app.digest(packet.data));
  assert.equal(packet.data.mechanics.schema, 'RUSSL-GFM-dataset/1');
  assert.equal(packet.data.mechanics.domain, 'complex-signal'); assert.ok(norm(packet.data.mechanics.values) > 1);
  for (const record of packet.data.records) assert.equal(record.sha256, await h.app.digest(record.data));
  await h.app.validatePacket(packet); await h.import(packet);
  assert.deepEqual(mechanics(h), packet.data.mechanics); assert.deepEqual(legacy(h), packet.data.snapshot);
  assert.deepEqual(h.plain(h.app.getReturns()), packet.data.returns);
  assert.deepEqual(h.plain(h.app.getRecords()), packet.data.records); assert.equal(JSON.stringify(packet), originalBytes);
  const record = packet.data.records.find(item => item.data.kind === 'gfm-dataset'); assert.ok(record);
  await run(h, 'gfm.field gf3'); const savedLegacy = legacy(h);
  await run(h, 'ledger.restore ' + record.id); assert.deepEqual(mechanics(h), record.data.payload.dataset);
  assert.deepEqual(legacy(h), savedLegacy); assert.equal(h.node('legacy-state-panel').hidden, true);
  assert.equal((await h.exported()).sha256.length, 64);
});
