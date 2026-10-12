'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { fixture } = require('./helpers/app-fixture.cjs');
const snapshot = h => h.plain(h.app.snapshot());
const success = value => { assert.ok(value); assert.equal(value.ok, true, value.summary); return value; };
const close = (a, b) => assert.ok(Math.abs(a - b) <= 1e-10 * Math.max(1, Math.abs(b)), `${a} differs from ${b}`);
const c = (re, im = 0) => ({ re, im });
const times = (a, b) => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const mod3 = n => (n % 3 + 3) % 3;
const sub9 = (a, b) => mod3(a % 3 - b % 3) + 3 * mod3(Math.floor(a / 3) - Math.floor(b / 3));
const mul9 = (a, b) => mod3(a % 3 * (b % 3) - Math.floor(a / 3) * Math.floor(b / 3))
  + 3 * mod3(a % 3 * Math.floor(b / 3) + Math.floor(a / 3) * (b % 3));
const add9 = (a, b) => mod3(a % 3 + b % 3) + 3 * mod3(Math.floor(a / 3) + Math.floor(b / 3));
const chi9 = x => c(Math.cos(2 * Math.PI * mod3(2 * (x % 3)) / 3), Math.sin(2 * Math.PI * mod3(2 * (x % 3)) / 3));
function finalDemonstration() {
  const samples = Array.from({ length: 9 }, (_, x) => -9.81 * Math.sin(.2 * (x / 4 - 1)));
  const norm = Math.sqrt(samples.reduce((sum, value) => sum + value ** 2, 0));
  const fourier = Array.from({ length: 9 }, (_, k) => samples.reduce((sum, value, x) => {
    const phase = chi9(mul9(k, x)); return c(sum.re + phase.re * value / (3 * norm), sum.im + phase.im * value / (3 * norm));
  }, c(0)));
  // R(3,4)D(3,4) psi[x] = chi(4*x+5) psi[3-x] in this GF9 basis.
  return fourier.map((_, x) => times(chi9(add9(mul9(4, x), 5)), fourier[sub9(3, x)]));
}
function vectorClose(actual, expected) {
  assert.equal(actual.length, expected.length);
  actual.forEach((value, x) => { close(value.re, expected[x].re); close(value.im, expected[x].im); });
}
function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stable).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stable(value[key])).join(',') + '}';
}
const hash = value => createHash('sha256').update(stable(value)).digest('hex');

test('pendulum command prepares the declared Fourier signal and exposes its codec and original scale', async () => {
  const h = fixture(), result = success(await h.app.run('model.pendulum 8 2 0.2'));
  const snap = snapshot(h), prep = snap.preparation;
  assert.equal(snap.model.field.id, 'gf9'); assert.equal(snap.operations, 1);
  close(result.details.reference.omega, 2); close(result.details.reference.smallAnglePeriod, Math.PI);
  close(prep.originalL2Scale, Math.sqrt(result.details.samples.reduce((sum, value) => sum + (-4 * Math.sin(value.theta)) ** 2, 0)));
  assert.equal(prep.schema, 'RUSSL-state-preparation/1'); assert.equal(prep.family, 'image-pendulum');
  assert.deepEqual(prep.codec.nodes, Array.from({ length: 9 }, (_, x) => .2 * (x / 4 - 1)));
  vectorClose(snap.state, result.details.transform.transformedState);
  vectorClose(result.details.transform.restoredValues, result.details.samples.map(sample => c(-4 * Math.sin(sample.theta))));
  assert.match(h.node('encoding-note').textContent, /original L2 scale/);
  assert.equal(h.node('encoding-note').hidden, false);
});

test('real rotation command rejects the wrong profile and recovers all three 232.75 degree outputs', async () => {
  const h = fixture(), before = snapshot(h);
  const wrong = await h.app.run('model.rotate x 232.75');
  assert.equal(wrong.ok, false); assert.match(wrong.summary, /GF3/); assert.deepEqual(snapshot(h), before);
  const cosine = -.6052939880428941, sine = -.7960020025346223;
  const expected = { x: [c(0), c(cosine), c(sine)], y: [c(0), c(1), c(0)], z: [c(-sine), c(cosine), c(0)] };
  for (const axis of ['x', 'y', 'z']) {
    success(await h.app.run('gf.field gf3')); success(await h.app.run('gf.basis 1'));
    const result = success(await h.app.run(`model.rotate ${axis} 232.75`));
    vectorClose(snapshot(h).state, expected[axis]);
    assert.equal(result.details.reapplication.passed, true);
    assert.equal(result.details.reapplication.unitarity.isUnitary, true);
    assert.match(result.profile, /SO\(3\)/);
    assert.equal(snapshot(h).preparation, undefined);
  }
});

test('zeta command separates continuum verification from its coarse midpoint encoding', async () => {
  const h = fixture(), result = success(await h.app.run('model.zeta 4'));
  close(result.details.reference.zeta, Math.PI ** 4 / 90);
  close(result.details.reference.integral, Math.PI ** 4 / 15);
  assert.ok(result.details.finiteSampling.absoluteDifferenceFromReference > .001);
  assert.match(result.details.finiteSampling.scope, /not the original improper integral/);
  assert.equal(snapshot(h).preparation.family, 'image-zeta-gamma');
  assert.deepEqual(snapshot(h).preparation.codec.window, [0, 12]);
  close(snapshot(h).preparation.originalL2Scale, result.details.transform.scale);
  close(snapshot(h).normSquared, 1);
});

test('exact-field inspectors retain amplitudes and preparation while reporting finite label dynamics', async () => {
  const h = fixture(); success(await h.app.run('model.pendulum 9.81 1 0.2'));
  const before = snapshot(h);
  const oscillator = success(await h.app.run('model.oscillator 1 0 1 1 12'));
  assert.deepEqual(h.plain(oscillator.details.matrix), [[2, 1], [0, 2]]);
  assert.deepEqual(h.plain(oscillator.details.trajectory[1]), { step: 1, q: 2, v: 0 });
  assert.deepEqual(h.plain(oscillator.details.final), { q: 1, v: 0 });
  assert.equal(oscillator.details.orbit.length, 2);
  assert.equal(oscillator.details.orbit.complete, true);
  assert.match(oscillator.details.scope, /not elapsed seconds/);
  const finite = success(await h.app.run('model.fieldrotate x 1 1 2 0'));
  assert.deepEqual(h.plain(finite.details.output), [1, 0, 2]);
  assert.equal(finite.details.determinant, 1);
  const infinity = success(await h.app.run('model.fieldrotate x infinity 1 2 0'));
  assert.deepEqual(h.plain(infinity.details.output), [1, 1, 0]);
  assert.equal(infinity.details.c, 2); assert.equal(infinity.details.s, 0);
  assert.match(infinity.details.scope, /not a real angle/);
  const singular = await h.app.run('model.fieldrotate x 3 1 2 0');
  assert.equal(singular.ok, false); assert.match(singular.summary, /singular/);
  assert.deepEqual(snapshot(h), before);
  success(await h.app.run('gf.field gf4')); const binary = snapshot(h);
  for (const command of ['model.oscillator 1 0 1 1 12', 'model.fieldrotate x 1 1 2 0']) {
    const result = await h.app.run(command); assert.equal(result.ok, false); assert.match(result.summary, /odd characteristic/);
    assert.deepEqual(snapshot(h), binary);
  }
});

test('model.reapply all updates the actual snapshot to the independently derived final GF9 signal', async () => {
  const h = fixture(); success(await h.app.run('gf.field gf4')); success(await h.app.run('ledger.record Existing state'));
  const records = h.plain(h.app.getRecords()), result = success(await h.app.run('model.reapply all'));
  const snap = snapshot(h);
  assert.equal(snap.model.field.id, 'gf9'); assert.equal(snap.operations, 3);
  vectorClose(snap.state, finalDemonstration());
  vectorClose(snap.state, result.details.finalState.vector);
  close(snap.normSquared, 1); assert.equal(snap.preparation.family, 'image-pendulum');
  assert.equal(result.details.entries.length, 20); assert.equal(result.details.coverage.storedFindings, 20);
  assert.equal(result.details.coverage.imageFamilies, 3);
  assert.equal(result.details.coverage.original500EquationSuite, 'not supplied');
  assert.equal(result.details.wigner.passed, true); assert.ok(result.details.wigner.negativeCellCount > 0);
  assert.deepEqual(h.plain(h.app.getRecords()), records, 'An ordinary reapplication must leave the existing ledger intact');
  assert.equal(result.details.sourceAudit.sha256, h.registry.source.sha256);
});

test('every stored finding has command-level applicability on its proper profile', async () => {
  const h = fixture();
  const executed = new Set(['eq-28', 'eq-37', 'eq-67', 'eq-88', 'eq-181', 'eq-318', 'eq-319', 'eq-417']);
  for (const entry of h.registry.entries) {
    const profile = entry.id === 'eq-181' ? 'gf4' : entry.id === 'eq-417' ? 'gf3' : 'gf9';
    success(await h.app.run(`gf.field ${profile}`)); success(await h.app.run('gf.basis 1'));
    const before = snapshot(h), result = success(await h.app.run(`model.reapply ${entry.id}`));
    assert.equal(result.details.id, entry.id); assert.equal(result.details.sourceStatus, entry.status);
    if (executed.has(entry.id)) {
      assert.equal(result.details.applied, true); assert.equal(result.details.statePreserved, false);
      assert.equal(snapshot(h).operations, before.operations + 1); close(snapshot(h).normSquared, 1);
      vectorClose(snapshot(h).state, result.details.preparedState);
    } else {
      assert.equal(result.details.applied, false); assert.equal(result.details.statePreserved, true);
      assert.deepEqual(snapshot(h), before);
      if (['rejected', 'unresolved'].includes(entry.status)) assert.equal(result.details.outcome, 'reference-only');
    }
  }
});

test('model verification and export preserve state and expose a reproducible complete-report hash', async () => {
  const h = fixture(); success(await h.app.run('model.zeta 3')); const before = snapshot(h);
  const verified = success(await h.app.run('model.verify'));
  assert.equal(verified.details.audit.passed, true); assert.equal(verified.details.statePreserved, true);
  assert.deepEqual(snapshot(h), before);
  const packet = await h.exported('model.export');
  assert.equal(packet.data.schema, 'RUSSL-GFM-export/1'); assert.equal(packet.data.version, '0.3.0');
  assert.equal(packet.sha256, hash(packet.data));
  assert.deepEqual(packet.data.snapshot, before);
  assert.equal(packet.data.reapplication.entries.length, 20);
  assert.equal(packet.data.reapplication.sourceAudit.sha256, h.registry.source.sha256);
  assert.equal(packet.data.imageRegistry.entries.length, 3);
  assert.deepEqual(snapshot(h), before);
  packet.data.snapshot.preparation.originalL2Scale += 1;
  assert.notEqual(packet.sha256, hash(packet.data));
});

test('malformed model commands roll back state and preparation, including declared domain errors', async () => {
  const h = fixture(); success(await h.app.run('model.pendulum 9.81 1 0.2')); const before = snapshot(h);
  const commands = ['model.pendulum 9.81 1', 'model.pendulum NaN 1 0.2', 'model.pendulum 9.81 0 0.2',
    'model.pendulum 9.81 1 4', 'model.rotate x 232.75', 'model.zeta 1', 'model.zeta 2.5', 'model.zeta 2 extra',
    'model.oscillator 9 0 1 1', 'model.oscillator 1 0 1 1 0', 'model.fieldrotate x 3 1 2 0',
    'model.fieldrotate x 1.5 1 2 0', 'model.reapply nonexistent', 'model.reapply all extra', 'model.verify extra', 'model.export extra'];
  for (const command of commands) {
    const result = await h.app.run(command); assert.equal(result.ok, false, command);
    assert.equal(result.details.statePreserved, true); assert.deepEqual(snapshot(h), before, command);
  }
});

test('preparation follows unitary operations but explicit basis/state/field preparations clear it', async () => {
  const h = fixture(); success(await h.app.run('model.pendulum 9.81 1 0.2'));
  const initial = snapshot(h).preparation;
  const commands = ['gf.fourier', 'gf.fourier inverse', 'gf.shift 3', 'gf.phase 4', 'gf.frobenius 2', 'gf.displace 3 4', 'gf.reflect 3 4'];
  for (let index = 0; index < commands.length; index++) {
    success(await h.app.run(commands[index])); const prep = snapshot(h).preparation;
    assert.equal(prep.family, initial.family); assert.deepEqual(prep.codec, initial.codec);
    assert.equal(prep.originalL2Scale, initial.originalL2Scale);
    assert.equal(prep.subsequentOperations.length, index + 1);
  }
  success(await h.app.run('gf.basis 1')); assert.equal(snapshot(h).preparation, undefined);
  success(await h.app.run('model.zeta 2'));
  success(await h.app.run('gf.state ' + JSON.stringify(h.plain(h.engine.basisState(9, 2)))));
  assert.equal(snapshot(h).preparation, undefined);
  success(await h.app.run('model.pendulum 9.81 1 0.2'));
  success(await h.app.run('gf.field gf3')); assert.equal(snapshot(h).preparation, undefined);
  success(await h.app.run('model.pendulum 9.81 1 0.2'));
  const rotationPrep = snapshot(h).preparation;
  success(await h.app.run('model.rotate y 232.75'));
  assert.deepEqual(snapshot(h).preparation.codec, rotationPrep.codec);
  assert.equal(snapshot(h).preparation.subsequentOperations.length, 1);
});

test('v0.3 session import and ledger restoration retain the signal codec, scale and inert operations', async () => {
  const h = fixture(); success(await h.app.run('model.pendulum 9.81 1 0.2'));
  success(await h.app.run('gf.displace 3 4')); success(await h.app.run('ledger.record Encoded signal'));
  const expected = snapshot(h), packet = await h.exported();
  assert.equal(packet.data.version, '0.5.0'); assert.equal(packet.sha256, hash(packet.data));
  assert.equal(packet.data.records[0].sha256, hash(packet.data.records[0].data));
  assert.deepEqual(packet.data.records[0].data.payload.snapshot.preparation, expected.preparation);
  const restored = fixture(); success(await restored.app.run('model.zeta 4'));
  await restored.import(packet);
  assert.deepEqual(snapshot(restored), expected);
  assert.deepEqual(restored.plain(restored.app.getRecords()), packet.data.records);
  assert.equal(restored.app.getReturns().length, packet.data.returns.length);
  success(await restored.app.run('gf.basis 0')); assert.equal(snapshot(restored).preparation, undefined);
  success(await restored.app.run('ledger.restore ' + packet.data.records[0].id));
  vectorClose(snapshot(restored).state, expected.state);
  assert.deepEqual(snapshot(restored).preparation, expected.preparation);
  const reexported = await restored.exported();
  assert.equal(reexported.sha256, hash(reexported.data));
  assert.ok(reexported.data.commandProvenance.some(value => value.startsWith('ledger.restore ')));
  assert.deepEqual(reexported.data.records, packet.data.records);
});

test('rehashing a malformed preparation does not make it admissible in a session or record', async () => {
  const h = fixture(); success(await h.app.run('model.pendulum 9.81 1 0.2'));
  success(await h.app.run('ledger.record Valid encoding')); const packet = await h.exported(), before = snapshot(h);
  const changes = [
    prep => { prep.schema = 'unknown'; }, prep => { prep.field = 'gf3'; },
    prep => { prep.originalL2Scale = 0; }, prep => { prep.originalL2Scale = -1; },
    prep => { prep.originalL2Scale = null; }, prep => { prep.originalL2Scale = '1'; },
    prep => { prep.codec.nodes.pop(); }, prep => { prep.codec.nodes[0] = 'NaN'; },
    prep => { prep.subsequentOperations = Array.from({ length: 101 }, () => 'gf.shift 1'); }
  ];
  for (const change of changes) {
    for (const target of ['snapshot', 'record']) {
      const altered = h.plain(packet);
      const snap = target === 'snapshot' ? altered.data.snapshot : altered.data.records[0].data.payload.snapshot;
      change(snap.preparation);
      if (target === 'record') altered.data.records[0].sha256 = hash(altered.data.records[0].data);
      altered.sha256 = hash(altered.data);
      await assert.rejects(h.app.validatePacket(altered));
      assert.deepEqual(snapshot(h), before);
    }
  }
  const bad = h.plain(packet); bad.data.snapshot.preparation.field = 'gf3'; bad.sha256 = hash(bad.data);
  await h.import(bad); assert.deepEqual(snapshot(h), before);
});

test('the GFM load button appends raw mechanics data while preserving existing GF80 evidence and reference state', async () => {
  const h = fixture(); h.ready(); success(await h.app.run('workbench.capture'));
  const existing = h.plain(h.app.getRecords()), old = snapshot(h); assert.equal(existing.length, 1);
  await h.node('load-gfm').emit('click'); await h.settled();
  const records = h.plain(h.app.getRecords()), active = h.plain(h.app.mechanicsSnapshot());
  assert.equal(records.length, 2); assert.deepEqual(records[0], existing[0]);
  assert.equal(records[1].data.kind, 'gfm-dataset'); assert.equal(records[1].sha256, hash(records[1].data));
  assert.equal(active.field, 'gf9'); assert.equal(active.domain, 'complex-signal');
  assert.equal(active.codec.profile, 'gtt'); assert.equal(active.representation, 'trace-coefficients');
  assert.deepEqual(records[1].data.payload.dataset, active); assert.deepEqual(snapshot(h), old);
  const raw = Array.from({ length: 9 }, (_, j) => -1 + 2 / (2 + .75 * j));
  const expected = raw.map((_, k) => raw.reduce((sum, value, x) => {
    const phase = chi9(mul9(k, x)); return c(sum.re + phase.re * value / 3, sum.im + phase.im * value / 3);
  }, c(0)));
  vectorClose(active.values, expected);
  const history = (await h.exported()).data.commandProvenance;
  assert.ok(history.includes('gfm.reapply')); assert.ok(history.some(value => value.startsWith('gfm.record ')));
  assert.equal(history.includes('session.import'), false);
});

