'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createSimulation, DEFAULTS } = require('../backend/simulation.cjs');
test('shared exterior and distinct cover branches produce the declared default passage bits', () => {
  const frame = createSimulation().snapshot();
  assert.equal(frame.schema,'GFM-Aperture-Aggie-frame/1');
  assert.equal(frame.exterior.M,1); assert.equal(frame.exterior.a,.99); assert.equal(frame.exterior.Q,0);
  assert.equal(frame.exterior.passed,true); assert.equal(frame.observation.identical,true);
  assert.equal(frame.branches.gaseous.cover,0); assert.equal(frame.branches.aggie.cover,1);
  assert.equal(frame.branches.gaseous.passage,1); assert.equal(frame.branches.aggie.passage,0);
  assert.ok(Math.abs(frame.branches.gaseous.apertureRadius - Math.sqrt(1-(.8/.99)**2)) < 1e-14);
});
test('critical spin equality closes, cover equality seals, and raw zero GFM values remain valid', () => {
  const sim = createSimulation();
  let state = sim.setParameters({spin:.8,coverLoad:1});
  assert.equal(state.branches.gaseous.apertureRadius,0); assert.equal(state.branches.aggie.cover,1);
  assert.equal(state.branches.gaseous.passage,0); assert.equal(state.branches.aggie.passage,0);
  state = sim.setParameters({spin:.99,coverLoad:.999999999});
  assert.equal(state.branches.aggie.cover,0); assert.equal(state.branches.aggie.passage,1);
  // The sweep includes exactly zero radius through its critical threshold.
  assert.deepEqual(state.gfm.nodes,[0,.125,.25,.375,.5,.625,.75,.875,1]);
  assert.deepEqual(state.gfm.raw.slice(0,7),Array.from({length:7},()=>({re:0,im:0})));
  assert.equal(state.gfm.passed,true); assert.ok(state.gfm.maxRecoveryError < 1e-12);
  for (let i=0;i<9;i++) assert.ok(Math.hypot(state.gfm.raw[i].re-state.gfm.recovered[i].re,state.gfm.raw[i].im-state.gfm.recovered[i].im)<1e-12);
  // A selected spin of zero does not misrepresent the parameter sweep as a selected-spin trajectory.
  state = sim.setParameters({spin:0}); assert.equal(state.branches.gaseous.apertureRadius,0); assert.ok(state.gfm.raw[8].re > 0);
});
test('invalid parameters preserve the complete state and do not emit updates', () => {
  const sim = createSimulation(); let notifications = 0;
  sim.subscribe(()=>notifications++); const before = sim.snapshot();
  for (const patch of [{spin:NaN},{spin:Infinity},{spin:-.1},{spin:1.1},{coverLoad:-1},{alphaCritical:1},{r0:0},{sealThreshold:0},{unknown:2},[],null,{spin:'0.9'}]) {
    assert.throws(()=>sim.setParameters(patch)); assert.deepEqual(sim.snapshot(),before);
  }
  assert.throws(()=>sim.setParameters(Object.defineProperty({},'spin',{get(){throw new Error('accessor executed');},enumerable:true})),/data properties/);
  assert.equal(notifications,0);
});
test('play, pause, step and bounded export record real backend values without outside mutation', () => {
  const sim = createSimulation({maxFrames:4}); let calls = 0; const unsubscribe = sim.subscribe(()=>calls++);
  assert.equal(sim.tick().elapsed,0);
  sim.control('play'); assert.equal(sim.tick().elapsed,.1);
  sim.control('pause'); assert.equal(sim.tick().elapsed,.1);
  assert.equal(sim.control('step').elapsed,.2); assert.equal(sim.snapshot().running,false);
  assert.equal(sim.snapshot().recording.retainedFrames,4); assert.equal(sim.snapshot().recording.droppedFrames,1);
  const external=sim.snapshot(); external.parameters.spin=0; external.gfm.raw[8].re=999; assert.equal(sim.snapshot().parameters.spin,.99); assert.notEqual(sim.snapshot().gfm.raw[8].re,999);
  const exported=sim.exportData(); assert.equal(exported.frames.length,4); assert.equal(exported.frames.at(-1).elapsed,.2);
  assert.deepEqual(exported.frames.at(-1).gfm,sim.snapshot().gfm); assert.equal(sim.exportCSV().trim().split(/\r?\n/).length,5);
  unsubscribe(); sim.control('reset'); assert.equal(calls,4); assert.deepEqual(sim.snapshot().parameters,DEFAULTS);
});
test('repeatable demo exposes sealed, open and low-spin-closed states and pauses at completion', () => {
  const sim=createSimulation({maxFrames:200}); const stages=[];
  const first=sim.control('demo'); assert.equal(first.running,true);
  for(let i=0;i<120;i++) stages.push(sim.tick(.1));
  assert.ok(stages.some(f=>f.parameters.spin===.99&&f.branches.aggie.cover===1&&f.branches.gaseous.passage===1));
  assert.ok(stages.some(f=>f.parameters.spin===.99&&f.branches.aggie.passage===1));
  assert.ok(stages.some(f=>f.parameters.spin<.8&&f.branches.aggie.passage===0&&f.branches.gaseous.passage===0));
  assert.equal(stages.at(-1).elapsed,12); assert.equal(stages.at(-1).running,false); assert.deepEqual(stages.at(-1).parameters,DEFAULTS);
  const oldRun=sim.snapshot().runId; const restarted=sim.control('demo'); assert.notEqual(restarted.runId,oldRun); assert.equal(restarted.elapsed,0);
  sim.setParameters({coverLoad:.25}); assert.equal(sim.snapshot().experiment,null);
});
test('play resumes the illustration clock after the scripted experiment has completed', () => {
  const sim=createSimulation({maxFrames:200}); sim.control('demo');
  for(let i=0;i<120;i++) sim.tick(.1);
  assert.equal(sim.snapshot().running,false); assert.equal(sim.snapshot().experiment.stage,'Experiment complete; restored defaults');
  const resumed=sim.control('play'); assert.equal(resumed.running,true); assert.equal(resumed.experiment,null);
  const next=sim.tick(.1); assert.equal(next.running,true); assert.equal(next.elapsed,12.1); assert.deepEqual(next.parameters,DEFAULTS);
});
