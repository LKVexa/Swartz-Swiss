'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { fixture, project } = require('./helpers/app-fixture.cjs');
const close = (actual, expected, epsilon = 1e-11) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} differs from ${expected}`);
const snapshot = h => h.plain(h.app.snapshot());
const assertSuccess = result => assert.equal(result.ok, true, result.summary);

test('odd-field displacement and reflection commands apply their declared operators', async () => {
  const h = fixture();
  const before = snapshot(h);
  const displaced = await h.app.run('gf.displace 3 4'); assertSuccess(displaced);
  assert.equal(displaced.details.equationAudit.entries[0].id, 'eq-67');
  assert.match(displaced.details.operator, /chi\(-xi\*zeta\/2\)/);
  // In GF(9), x^2=-1. D(x,x+1)|1> = exp(2pi i/3)|x+1>.
  h.app.snapshot().state.forEach((value, i) => {
    close(value.re, i === 4 ? -.5 : 0);
    close(value.im, i === 4 ? Math.sqrt(3) / 2 : 0);
  });
  await h.app.run('gf.displace 6 8'); // (-x, -(x+1)) is the inverse displacement.
  assert.ok(h.engine.compare(before.state, h.app.snapshot().state) < 1e-11);
  const priorReflection = snapshot(h);
  const reflected = await h.app.run('gf.reflect 3 4'); assertSuccess(reflected);
  assert.equal(reflected.details.equationAudit.entries[0].id, 'eq-88');
  assertSuccess(await h.app.run('gf.reflect 3 4'));
  assert.ok(h.engine.compare(priorReflection.state, h.app.snapshot().state) < 1e-11);
  assert.equal(h.app.snapshot().operations, before.operations + 4);
});

test('binary-field odd-characteristic operations reject without changing state', async () => {
  for (const field of ['gf4', 'gf8', 'gf16']) {
    const h = fixture();
    assertSuccess(await h.app.run(`gf.field ${field}`));
    assertSuccess(await h.app.run('gf.basis 2'));
    const before = snapshot(h);
    for (const command of ['gf.displace 1 1', 'gf.reflect 1 1', 'gf.quadratic 1', 'gf.wigner']) {
      const result = await h.app.run(command);
      assert.equal(result.ok, false, command); assert.match(result.summary, /odd characteristic/);
      assert.equal(result.details.statePreserved, true);
      assert.deepEqual(snapshot(h), before, `${field}: ${command}`);
    }
    assert.equal(h.app.getRecords().length, 0);
  }
});

test('quadratic and symplectic inspectors retain finite-field labels and preserve amplitudes', async () => {
  const h = fixture(), before = snapshot(h);
  const character = await h.app.run('gf.quadratic 4'); assertSuccess(character);
  assert.equal(character.details.value, -1);
  assert.equal(character.details.equationAudit.entries[0].id, 'eq-37');
  assert.equal(character.details.model.field.id, 'gf9');
  assertSuccess(await h.app.run('gf.quadratic 0'));
  const map = await h.app.run('gf.symplectic 1 1 0 1 3 4'); assertSuccess(map);
  assert.equal(map.details.det, 1);
  assert.deepEqual(h.plain(map.details.output), { x: 7, y: 4 }); // x + (x+1) = 2x+1.
  assert.match(map.details.scope, /no amplitude operator/);
  const rejected = await h.app.run('gf.symplectic 2 0 0 1 3 4');
  assert.equal(rejected.ok, false); assert.equal(rejected.details.det, 2);
  assert.equal(rejected.details.statePreserved, true);
  assert.deepEqual(snapshot(h), before);
  await h.app.run('gf.field gf8');
  const binaryBefore = snapshot(h);
  assertSuccess(await h.app.run('gf.symplectic 1 1 0 1 3 4'));
  assert.deepEqual(snapshot(h), binaryBefore, 'symplectic label maps also work in characteristic two');
});

test('Wigner negativity preset is inert until run and yields its declared mana', async () => {
  const h = fixture(), before = snapshot(h);
  const preset = h.node('presets').children.find(node => node.textContent === 'Wigner negativity');
  assert.ok(preset);
  await preset.emit('click');
  assert.deepEqual(snapshot(h), before);
  assert.equal(h.app.getReturns().length, 0);
  assert.match(h.node('sequence').value, /gf\.wigner/);
  await h.node('run-sequence').emit('click');
  const result = h.app.getReturns().at(-1); assertSuccess(result);
  const w = result.details.wigner;
  assert.equal(w.negativeCellCount, 6); close(w.minValue, -1 / 18);
  close(w.normalization, 1); close(w.purity, 1); close(w.l1Norm, 5 / 3);
  close(w.mana, Math.log2(5 / 3)); assert.equal(w.manaLogBase, 2);
  assert.equal(w.axisOrder, 'grid[q0][p0], polynomial-encoded position and momentum labels');
  assert.equal(h.node('wigner-grid').children.length, 100);
  assert.match(h.node('wigner-note').textContent, /negative-sign Fourier/);
  assert.equal(h.app.snapshot().operations, 1);
});

test('Wigner momentum marginal explicitly uses negative Fourier for asymmetric complex states', async () => {
  const h = fixture();
  const state = Array.from({ length: 9 }, (_, i) => ({ re: i === 0 ? 1 / Math.sqrt(2) : 0, im: i === 1 ? 1 / Math.sqrt(2) : 0 }));
  assertSuccess(await h.app.run('gf.state ' + JSON.stringify(state)));
  const before = snapshot(h), result = await h.app.run('gf.wigner'); assertSuccess(result);
  const w = result.details.wigner;
  for (let k = 0; k < 9; k++) {
    const trace = (2 * (k % 3)) % 3;
    const expected = (1 + Math.sin(2 * Math.PI * trace / 3)) / 9;
    close(w.marginals.momentum[k], expected);
    close(w.marginals.expectedMomentum[k], expected);
    close(w.marginals.position[k], k < 2 ? .5 : 0);
  }
  const positive = h.engine.probabilities(h.engine.fourier(h.engine.field('gf9'), h.app.snapshot().state));
  assert.ok(Math.abs(positive[1] - w.marginals.momentum[1]) > .1, 'sign convention is distinguishable for this complex state');
  assert.match(w.momentumConvention, /negative-sign/);
  assert.deepEqual(snapshot(h), before);
});

test('scalar commands expose distinct SU2, arithmetic-ring and complex domains without mutating state', async () => {
  const h = fixture();
  await h.app.run('gf.field gf8'); await h.app.run('gf.basis 3');
  const before = snapshot(h);
  const cg = await h.app.run('math.cg 0.5 0.5 0.5 -0.5 0 0'); assertSuccess(cg);
  assert.equal(cg.profile, 'SU(2) / ordinary scalar coefficients');
  close(cg.details.coefficient, 1 / Math.sqrt(2)); assert.match(cg.details.domain, /SU\(2\)/);
  assert.equal(cg.details.equationAudit.entries[0].id, 'eq-181');
  const delta = await h.app.run('math.delta 3 2'); assertSuccess(delta);
  assert.match(delta.profile, /Arithmetic residues/); assert.equal(delta.details.delta, 1);
  assert.equal(delta.details.fermatQuotient, 1); assert.equal(delta.details.residueModP2, 2);
  assert.equal(delta.details.equationAudit.entries[0].id, 'eq-318');
  const product = await h.app.run('math.delta.check 3 1 1'); assertSuccess(product);
  assert.equal(product.details.productRule.passed, true);
  assert.equal(product.details.addition.defect, 1); assert.equal(product.details.addition.additiveAtTheseInputs, false);
  assert.deepEqual(h.plain(product.details.equationAudit.entries.map(entry => entry.id)), ['eq-318', 'eq-319']);
  const nonunit = await h.app.run('math.delta 5 10'); assertSuccess(nonunit);
  assert.equal(nonunit.details.unit, false); assert.equal(nonunit.details.fermatQuotient, null);
  const cayley = await h.app.run('math.cayley {"H":[[0,1],[1,0]],"state":[1,0],"dt":0.1,"hbar":1}'); assertSuccess(cayley);
  assert.equal(cayley.profile, 'Complex Hermitian Hamiltonian / Cayley');
  assert.equal(cayley.details.dimension, 2); assert.equal(cayley.details.renormalized, false);
  assert.equal(cayley.details.statePreserved, true); assert.match(cayley.details.domain, /complex-amplitude/);
  assert.ok(cayley.details.state[1].im < 0, 'forward Hamiltonian evolution has the declared negative first-order phase');
  assert.equal(cayley.details.equationAudit.entries[0].id, 'eq-417');
  for (const result of [cg, delta, product, nonunit, cayley]) assert.equal(result.details.statePreserved, true);
  assert.deepEqual(snapshot(h), before);
  assert.equal(h.app.getRecords().length, 0);
});

test('malformed scalar and registry commands reject while preserving the current model', async () => {
  const h = fixture(), before = snapshot(h);
  for (const command of ['math.cg 1.1 0 1 0 1 0', 'math.delta 4 2', 'math.delta 3 1e30', 'math.cayley {"H":[[0,1],[2,0]],"state":[1,0],"dt":0.1}', 'eq.list runnable', 'eq.show 500', 'eq.run 437']) {
    const result = await h.app.run(command);
    assert.equal(result.ok, false, command); assert.equal(result.details.statePreserved, true);
    assert.deepEqual(snapshot(h), before, command);
  }
  const forbidden = await h.app.run('math.cg 0.5 0.5 0.5 0.5 0 0'); assertSuccess(forbidden);
  assert.equal(forbidden.details.allowed, false); assert.equal(forbidden.details.coefficient, 0);
  assert.deepEqual(snapshot(h), before);
});

test('registry lists and displays evidence while rejected and unresolved entries remain inert', async () => {
  const h = fixture(), before = snapshot(h);
  const all = await h.app.run('eq.list'); assertSuccess(all);
  assert.equal(all.details.entries.length, 20);
  assert.deepEqual(h.plain(all.details.counts), { verified: 5, refined: 10, rejected: 2, unresolved: 3 });
  assert.match(all.details.scope, /original 500-equation suite unavailable/);
  for (const status of ['verified', 'refined', 'rejected', 'unresolved']) {
    const listed = await h.app.run('eq.list ' + status); assertSuccess(listed);
    assert.ok(listed.details.entries.every(entry => entry.status === status));
    assert.equal(listed.details.entries.length, all.details.counts[status]);
  }
  for (const id of ['437', '438', '370', 'characteristic-two', 'report-scope']) {
    const shown = await h.app.run('eq.show ' + id); assertSuccess(shown);
    assert.equal(shown.details.entry.command, null);
    assert.equal(shown.details.entry.execution, 'reference only');
    const card = h.node('equation-list').children.find(node => node.children[0].children[0].textContent === shown.details.entry.id);
    assert.ok(card);
    assert.equal(h.descendants(card).filter(node => node.className.split(/\s+/).includes('equation-insert')).length, 0);
  }
  const reportHash = createHash('sha256').update(fs.readFileSync(path.join(project, h.registry.source.path))).digest('hex');
  assert.equal(h.registry.source.sha256, reportHash);
  const beforeExportReturns = h.app.getReturns().length;
  const exported = await h.exported('eq.export');
  assert.deepEqual(exported, h.registry);
  assert.equal(h.downloads.at(-1).name, 'RUSSL-equation-audit.json');
  assert.equal(h.app.getReturns().length, beforeExportReturns + 1, 'registry export executes only its explicit export command');
  assert.deepEqual(snapshot(h), before);
});

test('equation example insertion requires explicit sequence execution', async () => {
  const h = fixture(), before = snapshot(h);
  const card = h.node('equation-list').children.find(node => node.children[0].children[0].textContent === 'eq-67');
  const insert = h.descendants(card).find(node => node.className.split(/\s+/).includes('equation-insert'));
  assert.ok(insert);
  await insert.emit('click');
  assert.equal(h.node('sequence').value, 'gf.displace 3 4');
  assert.equal(h.app.getReturns().length, 0);
  assert.deepEqual(snapshot(h), before);
  await h.node('run-sequence').emit('click');
  assert.equal(h.app.getReturns().length, 1);
  assertSuccess(h.app.getReturns()[0]);
  assert.equal(h.app.snapshot().operations, 1);
  assert.ok(h.engine.compare(before.state, h.app.snapshot().state) > .5);
});

test('registry filters and integrated verification controls work without changing current state', async () => {
  const h = fixture();
  await h.app.run('gf.field gf8'); await h.app.run('gf.basis 3');
  const before = snapshot(h);
  h.node('equation-filter').value = 'rejected';
  await h.node('equation-filter').emit('change');
  assert.equal(h.node('equation-list').children.length, 2);
  assert.match(h.node('equation-visible-count').textContent, /2 \/ 20/);
  await h.node('verify-equations').emit('click'); await h.settled();
  const result = h.app.getReturns().at(-1); assertSuccess(result);
  assert.equal(result.command, 'eq.verify');
  const audit = result.details.audit;
  assert.equal(audit.passed, true);
  assert.ok(Object.values(audit.checks).every(check => check.passed));
  assert.ok(Object.keys(audit.checks).length >= 10);
  close(audit.rejectedFormulaDiagnostic.T, -3);
  assert.match(audit.rejectedFormulaDiagnostic.disposition, /negative probability/);
  assert.ok(audit.unresolved.includes('eq-438'));
  assert.deepEqual(snapshot(h), before);
});

test('current session exports preserve scalar domains, equation evidence and record hashes', async () => {
  const h = fixture();
  await h.app.run('math.cg 0.5 0.5 0.5 -0.5 0 0');
  await h.app.run('eq.verify');
  await h.app.run('ledger.record Equation audit state');
  const before = snapshot(h), packet = await h.exported();
  assert.equal(packet.data.version, '0.5.0');
  assert.equal(packet.sha256, await h.app.digest(packet.data));
  assert.equal(packet.data.records[0].sha256, await h.app.digest(packet.data.records[0].data));
  assert.equal(packet.data.returns[0].profile, 'SU(2) / ordinary scalar coefficients');
  assert.equal(packet.data.returns[0].details.equationAudit.sourceSha256, h.registry.source.sha256);
  assert.deepEqual(h.plain((await h.app.validatePacket(packet)).snapshot), before);
  const restored = fixture();
  await restored.import(packet);
  assert.deepEqual(snapshot(restored), before);
  assert.deepEqual(restored.plain(restored.app.getRecords()), packet.data.records);
  assert.equal(restored.app.getReturns().length, packet.data.returns.length, 'imported commands and equation history stay inert');
});

test('real v0.1 example imports without rewriting its metadata or historical digests', async () => {
  const h = fixture(), packet = JSON.parse(fs.readFileSync(path.join(project, 'examples/Fourier-Weyl-session.json'), 'utf8'));
  const original = JSON.stringify(packet);
  assert.equal(packet.data.version, '0.1.0');
  assert.equal(packet.sha256, 'b9b17e89dacc3e9cda789351047d180e78edc09695c8fcf1c7bcbea82e2b6d95');
  assert.equal(packet.sha256, await h.app.digest(packet.data));
  await h.app.validatePacket(packet);
  await h.import(packet);
  assert.deepEqual(snapshot(h), packet.data.snapshot);
  assert.deepEqual(h.plain(h.app.getRecords()), packet.data.records);
  assert.deepEqual(h.plain(h.app.getReturns()), packet.data.returns);
  assert.equal(JSON.stringify(packet), original);
  const reexported = await h.exported();
  assert.equal(reexported.data.version, '0.5.0');
  assert.deepEqual(reexported.data.snapshot.model, packet.data.snapshot.model);
  assert.deepEqual(reexported.data.records, packet.data.records);
  assert.deepEqual(reexported.data.commandProvenance, packet.data.commandProvenance);
  assert.equal(reexported.sha256, await h.app.digest(reexported.data));
  for (const record of reexported.data.records) assert.equal(record.sha256, await h.app.digest(record.data));
});

test('actual audited-equations example imports inertly and restores its record with a fresh audit', async () => {
  const h = fixture(), packet = JSON.parse(fs.readFileSync(path.join(project, 'examples/Audited-Equations-session.json'), 'utf8'));
  const original = JSON.stringify(packet), initial = snapshot(h);
  assert.equal(packet.data.version, '0.2.0');
  assert.equal(packet.sha256, await h.app.digest(packet.data));
  const validated = await h.app.validatePacket(packet);
  assert.deepEqual(h.plain(validated), packet.data);
  assert.deepEqual(snapshot(h), initial, 'validation alone must not load or execute the example');
  for (const record of packet.data.records) assert.equal(record.sha256, await h.app.digest(record.data));
  await h.app.run('gf.field gf8');
  await h.import(packet);
  assert.deepEqual(snapshot(h), packet.data.snapshot);
  assert.deepEqual(h.plain(h.app.getReturns()), packet.data.returns);
  assert.deepEqual(h.plain(h.app.getRecords()), packet.data.records);
  assert.equal(h.app.getReturns().length, packet.data.returns.length, 'only the supplied inert returns are present after import');
  assert.equal(h.app.snapshot().operations, 3);
  assert.ok(packet.data.returns.some(result => result.profile === 'SU(2) / ordinary scalar coefficients'));
  assert.ok(packet.data.returns.some(result => result.profile === 'Complex Hermitian Hamiltonian / Cayley'));
  assert.equal(JSON.stringify(packet), original, 'validation/import preserve the actual example envelope');
  const record = packet.data.records.find(item => item.data.kind === 'gf-state');
  assert.ok(record);
  await h.app.run('gf.field gf4');
  const restored = await h.app.run('ledger.restore ' + record.id); assertSuccess(restored);
  assert.equal(restored.details.recordHashVerified, true);
  assert.equal(restored.details.audit.passed, true);
  assert.equal(h.node('audit-value').textContent, 'Passed');
  assert.deepEqual(h.plain(h.app.snapshot().state), record.data.payload.snapshot.state);
  assert.deepEqual(h.plain(h.app.snapshot().model), record.data.payload.snapshot.model);
  assert.equal(h.app.snapshot().operations, record.data.payload.snapshot.operations);
  assert.equal(h.app.getReturns().length, packet.data.returns.length + 2, 'only the explicit field change and restore add new returns');
  assert.deepEqual(h.plain(h.app.getRecords()), packet.data.records, 'fresh restoration does not rewrite historical records or digests');
});
