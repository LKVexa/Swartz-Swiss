'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { fixture } = require('./helpers/app-fixture.cjs');

const snapshot = h => h.plain(h.app.snapshot());
async function run(h, command) {
  const result = await h.app.run(command);
  assert.ok(result && result.ok, result && result.summary);
  return h.plain(result);
}
async function prepared(command, field = 'gf9') {
  const h = fixture();
  await run(h, 'gf.field ' + field);
  await run(h, command);
  const packet = await h.exported();
  await h.app.validatePacket(packet);
  return { h, packet };
}
async function rejectsWithoutImporting(h, original, mutations) {
  const before = snapshot(h), records = h.plain(h.app.getRecords());
  const controls = ['h-spin', 'h-critical', 'h-load', 'h-probe'].map(id => h.node(id).value);
  for (const [name, change] of Object.entries(mutations)) {
    const packet = structuredClone(original);
    change(packet.data.snapshot.preparation);
    packet.sha256 = await h.app.digest(packet.data);
    await assert.rejects(() => h.app.validatePacket(packet), undefined, name);
    await h.import(packet);
    assert.deepEqual(snapshot(h), before, name + ' must preserve the active state');
    assert.deepEqual(h.plain(h.app.getRecords()), records, name + ' must preserve the ledger');
    assert.deepEqual(['h-spin', 'h-critical', 'h-load', 'h-probe'].map(id => h.node(id).value), controls, name + ' must preserve the scenario');
  }
}

test('rehashed radial preparation metadata cannot falsify its grid, units, family or scale', async () => {
  const { h, packet } = await prepared('horizon.sample gtt 1 0.6 0.3 3 8 1');
  await run(h, 'ledger.record Retained radial signal');
  await rejectsWithoutImporting(h, packet, {
    wrongUnits: p => { p.codec.units = 'kilograms'; },
    wrongOrder: p => { p.codec.order = 'reverse integer label order'; },
    reversedRange: p => { p.codec.range = [8, 3]; },
    duplicatedNodes: p => { p.codec.nodes.fill(3); },
    reversedNodes: p => { p.codec.nodes.reverse(); },
    nonuniformNodes: p => { p.codec.nodes[2] += .1; },
    inconsistentRange: p => { p.codec.range[1] = 9; },
    wrongFamily: p => { p.family = 'horizon-frameOmega'; },
    falseEncoding: p => { p.encoding = 'A coordinate transformation'; },
    falseScope: p => { p.scope = 'A Lorentzian spacetime isometry'; },
    extraCodecClaim: p => { p.codec.traversable = true; },
    factorSevenScale: p => { p.originalL2Scale *= 7; },
    zeroScale: p => { p.originalL2Scale = 0; }
  });
});

test('a zero frame-dragging profile cannot import as a positive-scale normalized preparation', async () => {
  const { h, packet } = await prepared('horizon.sample gtt 1 0.6 0.3 3 8 1');
  await rejectsWithoutImporting(h, packet, {
    nonrotatingFrameSignal: p => {
      p.family = 'horizon-frameOmega';
      p.codec.component = 'frameOmega';
      p.codec.referenceParameters.a = 0;
      p.codec.units = 'inverse geometrized length';
    }
  });
});

test('rehashed hypothetical preparations cannot invent spin nodes, units, domain claims or a sealed passage state', async () => {
  const { h, packet } = await prepared('horizon.signal aperture');
  await run(h, 'ledger.record Retained hypothetical signal');
  await rejectsWithoutImporting(h, packet, {
    outsideSpinNodes: p => { p.codec.nodes.fill(9); },
    duplicatedSpinNodes: p => { p.codec.nodes.fill(.5); },
    reversedSpinNodes: p => { p.codec.nodes.reverse(); },
    nonuniformSpinNodes: p => { p.codec.nodes[2] += .01; },
    wrongSpinUnits: p => { p.codec.units = 'seconds'; },
    wrongCoordinate: p => { p.codec.coordinate = 'ordinary time'; },
    falseSourceStatus: p => { p.codec.sourceStatus = 'verified-general-relativity'; },
    falseSpinEncoding: p => { p.encoding = 'Finite-field square roots'; },
    falseSpinScope: p => { p.scope = 'A proven traversable wormhole'; },
    factorSevenSpinScale: p => { p.originalL2Scale *= 7; },
    sealedPassagePreparation: p => {
      p.family = 'hypothetical-aggiePassage';
      p.codec.units = 'binary passage bit';
    }
  });
});

test('valid exterior and hypothetical preparations round-trip on every registered field, including large allowed radius scales', async () => {
  const fields = Object.keys(fixture().engine.fields);
  for (const field of fields) {
    for (const command of [
      'horizon.sample gtt 1 0.6 0.3 3 8 1',
      'horizon.sample frameOmega 1 0.6 0.3 3 8 1',
      'horizon.signal aperture {"r0":1000000}',
      'horizon.signal gaseousPassage',
      'horizon.signal aggiePassage {"aggieLoad":0}'
    ]) {
      const { h, packet } = await prepared(command, field);
      const before = snapshot(h), restored = fixture();
      await restored.app.validatePacket(packet);
      await restored.import(packet);
      assert.deepEqual(snapshot(restored), before, field + ': ' + command);
      const scale = before.preparation.originalL2Scale;
      assert.ok(scale > 0 && scale <= 1e6);
      if (command.includes('1000000')) {
        assert.ok(scale > 5e5, 'The large radius retains its large original L2 scale');
        assert.equal(before.preparation.codec.parameters.r0, 1e6);
      }
      assert.ok(Math.abs(restored.engine.norm(before.state) ** 2 - 1) <= 1e-10);
    }
  }
});

test('relative scale validation remains meaningful for extremely small nonzero frame samples', async () => {
  const { h, packet } = await prepared('horizon.sample frameOmega 1000000 0.000001 0 3000000 8000000 1');
  const scale = packet.data.snapshot.preparation.originalL2Scale;
  assert.ok(scale > 0 && scale < 1e-15);
  await rejectsWithoutImporting(h, packet, { factorSevenTinyScale: p => { p.originalL2Scale *= 7; } });
  const rounded = structuredClone(packet);
  rounded.data.snapshot.preparation.originalL2Scale *= 1 + h.engine.tolerance / 2;
  rounded.sha256 = await h.app.digest(rounded.data);
  await h.app.validatePacket(rounded);
});

test('preparation followed by unitary gates exports and imports the operated state without replaying provenance', async () => {
  for (const field of Object.keys(fixture().engine.fields)) {
    const h = fixture();
    await run(h, 'gf.field ' + field);
    await run(h, 'horizon.sample gtt 1 0.6 0.3 3 8 1');
    const initial = snapshot(h), f = h.engine.field(field);
    const expected = h.engine.phase(f, h.engine.shift(f, initial.state, 1), 1);
    await run(h, 'gf.shift 1'); await run(h, 'gf.phase 1');
    const final = snapshot(h);
    assert.equal(final.operations, initial.operations + 2);
    assert.deepEqual(final.preparation.codec, initial.preparation.codec);
    assert.equal(final.preparation.originalL2Scale, initial.preparation.originalL2Scale);
    assert.deepEqual(final.preparation.subsequentOperations, ['Shift by 1', 'Phase by 1']);
    assert.ok(h.engine.compare(final.state, expected) <= h.engine.tolerance);
    await run(h, 'ledger.record Operated horizon signal');
    const packet = await h.exported();
    packet.data.commandProvenance = ['gf.field gf4', 'gf.basis 0', 'horizon.scenario {"Q":2}'];
    packet.sha256 = await h.app.digest(packet.data);
    const restored = fixture();
    await restored.app.validatePacket(packet); await restored.import(packet);
    assert.deepEqual(snapshot(restored), final);
    assert.deepEqual(restored.plain(restored.app.getRecords()), packet.data.records);
    assert.deepEqual((await restored.exported()).data.commandProvenance.slice(0, 3), packet.data.commandProvenance);
    assert.equal(restored.node('h-probe').value, 'exterior');
  }
});
