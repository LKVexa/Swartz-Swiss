'use strict';
// This executes production browser-Worker code in an isolated JS realm. It is
// numerical/path evidence, not a live-browser, GPU, scheduling or UI claim.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {Worker}=require('node:worker_threads');
const {createHash}=require('node:crypto');
const NodeSession=require('../backend/phase-session.js');
const NodeCore=require('../backend/phase-mhd.js');
const NodeGFM=require('../backend/gfm/engine.js');
const ROOT=path.resolve(__dirname,'..');
const FILES={'./phase-mhd.js':'public/phase-mhd.js','./gfm/engine.js':'public/gfm/engine.js','./phase-session.js':'public/phase-session.js','./adaptive-scheduler.js':'public/adaptive-scheduler.js'};
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const copy=value=>structuredClone(value);

function browserWorker() {
  const outbox=[],handlers=[],timers=new Map(),imports=[],context=vm.createContext({});let nextTimer=0,clockMs=0;
  context.performance={now:()=>clockMs};
  context.importScripts=(...urls)=>{for(const url of urls){assert.ok(Object.hasOwn(FILES,url),'Unexpected Worker dependency');const file=FILES[url],source=fs.readFileSync(path.join(ROOT,file),'utf8');imports.push({url,file,sha256:sha(source)});vm.runInContext(source,context,{filename:file});}};
  context.postMessage=value=>outbox.push(copy(value));
  context.addEventListener=(name,callback)=>{assert.equal(name,'message');handlers.push(callback);};
  context.setTimeout=(callback,delay)=>{const id=++nextTimer;timers.set(id,{callback,delay});return id;};context.clearTimeout=id=>timers.delete(id);
  context.__deliver=message=>handlers.forEach(callback=>callback({data:message}));
  vm.runInContext('globalThis.__queuedMessages=[];',context);
  vm.runInContext(fs.readFileSync(path.join(ROOT,'public/phase-worker.js'),'utf8'),context,{filename:'public/phase-worker.js'});
  assert.equal(vm.runInContext('typeof process',context),'undefined');
  assert.equal(vm.runInContext('typeof require',context),'undefined');
  assert.equal(vm.runInContext('typeof module',context),'undefined');
  assert.equal(timers.size,0,'paused worker does not maintain a polling timer');
  const ready=outbox.shift();assert.equal(ready.type,'ready');assert.equal(ready.frame.engine,'browser-worker');
  function queue(message) {vm.runInContext('globalThis.__queuedMessages.push('+JSON.stringify(message)+');',context);}
  function queueSource(source) {vm.runInContext('globalThis.__queuedMessages.push('+source+');',context);}
  function flush() {
    vm.runInContext('for(const message of globalThis.__queuedMessages.splice(0)){globalThis.__lastMessage=message;globalThis.__deliver(message);}',context);
    return outbox.splice(0);
  }
  return {context,imports,ready:ready.frame,queue,queueSource,flush,send(message){queue(message);const messages=flush();assert.equal(messages.length,1);return messages[0];},tick(){const entry=timers.entries().next().value;if(entry){timers.delete(entry[0]);clockMs+=entry[1].delay;entry[1].callback();}return outbox.splice(0);}};
}
function science(frame) {const result=copy(frame);delete result.runId;delete result.engine;delete result.software;delete result.scheduler;return result;}
function sameScience(actual,expected,label) {assert.deepEqual(science(actual),science(expected),label);}
function apply(session,message) {
  if(message.type==='parameters')session.configure(message.parameters);
  else if(message.type==='control')session.control(message.action);
  else if(!['init','snapshot','export'].includes(message.type))throw new Error('Unknown phase-worker command.');
  return session.snapshot();
}
function rawGF9Oracle(frame) {
  assert.equal(frame.gfm.field,'GF(9)');assert.ok(!Object.hasOwn(frame.gfm,'normalized'));
  assert.match(frame.gfm.normalization,/none; raw/);
  assert.deepEqual(frame.gfm.cells,[34,40,45,130,136,141,210,216,221]);
  const input=frame.gfm.cells.map(i=>({re:frame.fields.psiRe[i],im:frame.fields.psiIm[i]}));
  assert.deepEqual(frame.gfm.input,input);
  const expected=[];
  // GF(9)=F3[i]/(i^2+1), labels a+3b. Tr(k*x)=2(ac-bd) mod3.
  for(let k=0;k<9;k++){let re=0,im=0;const a=k%3,b=Math.floor(k/3);for(let x=0;x<9;x++){const c=x%3,d=Math.floor(x/3),trace=((2*(a*c-b*d))%3+3)%3,angle=2*Math.PI*trace/3,C=Math.cos(angle),S=Math.sin(angle);re+=(input[x].re*C-input[x].im*S)/3;im+=(input[x].re*S+input[x].im*C)/3;}expected.push({re,im});}
  for(let k=0;k<9;k++){assert.ok(Math.hypot(frame.gfm.transformed[k].re-expected[k].re,frame.gfm.transformed[k].im-expected[k].im)<2e-12);assert.ok(Math.hypot(frame.gfm.reconstructed[k].re-input[k].re,frame.gfm.reconstructed[k].im-input[k].im)<2e-12);}
  const energy=input.reduce((sum,z)=>sum+z.re*z.re+z.im*z.im,0);assert.equal(frame.gfm.inputSampleEnergy,energy);
  assert.ok(Math.abs(frame.gfm.transformSampleEnergy-energy)<2e-12*Math.max(1,energy));assert.ok(frame.gfm.inverseResidual<2e-12);
  return energy;
}
const PARAMETERS={resolution:16,length:5,density:1.2,pressure:1.5,densityContrast:.2,temperatureContrast:.15,flowSpeed:.25,magneticStrength:.35,guideFieldX:.1,guideFieldY:-.2,phaseSeedAmplitude:1.3,phaseDiffusivity:.02,phaseGrowth:.8,phaseFrequency:-.15,ironTemperatureK:2200,ironContrast:.4,ironHeatingWkg:1300,ironBathCouplingWkgK:.01,ironConductivityWMK:0,timeScaleSeconds:.5};

test('browser and Node dependencies are byte identical, with real browser importScripts and no Node globals',()=>{
  const browser=browserWorker();
  assert.deepEqual(browser.imports.map(x=>x.url),Object.keys(FILES));
  for(const item of browser.imports.filter(item=>!item.file.endsWith('adaptive-scheduler.js')))assert.equal(item.sha256,sha(fs.readFileSync(path.join(ROOT,item.file.replace(/^public\//,'backend/')))),item.file+' matches its production Node dependency');
  assert.match(browser.ready.software.execution,/Browser Worker/);
  assert.equal(browser.ready.sequence,0);assert.equal(browser.ready.running,false);
});
test('queued browser-Worker init, pause, parameters, steps and export match every production Node-session number',()=>{
  const browser=browserWorker(),node=NodeSession.createSession();
  const messages=[{id:1,type:'init'},{id:2,type:'control',action:'pause'},{id:3,type:'parameters',parameters:PARAMETERS},{id:4,type:'control',action:'step'},{id:5,type:'control',action:'step'},{id:6,type:'snapshot'},{id:7,type:'export'}];
  messages.forEach(message=>browser.queue(message));const responses=browser.flush();assert.equal(responses.length,messages.length);
  for(let i=0;i<messages.length;i++){const response=responses[i];assert.equal(response.id,messages[i].id);assert.equal(response.type,'response');assert.ok(!response.error);sameScience(response.frame,apply(node,messages[i]),'queued response '+messages[i].id);}
  assert.equal(responses[2].frame.sequence,0);assert.equal(responses[3].frame.sequence,1);assert.equal(responses[4].frame.sequence,2);assert.ok(Math.abs(responses[4].frame.time-.1)<1e-12);
  assert.notEqual(responses[1].frame.runId,responses[2].frame.runId,'configuration identifies a new experiment');
  const energy=rawGF9Oracle(responses[4].frame);assert.ok(Math.abs(energy-1)>.1,'a non-unit sample norm is actually transported');
  assert.equal(vm.runInContext('Object.getPrototypeOf(globalThis.__lastMessage)===Object.prototype',browser.context),true,'commands originate inside the Worker realm');
});
test('actual Node Worker responds with the same computed frame and loaded-source hashes as the browser path',async()=>{
  const worker=new Worker(path.join(ROOT,'public/phase-worker.js')),waiting=new Map();let readyResolve;
  const ready=new Promise(resolve=>readyResolve=resolve);const errors=[];
  worker.on('error',error=>{errors.push(error);for(const entry of waiting.values()){clearTimeout(entry.timer);entry.reject(error);}waiting.clear();});
  worker.on('message',message=>{if(message.type==='ready')readyResolve(message.frame);if(message.type==='response'){const entry=waiting.get(message.id);if(entry){clearTimeout(entry.timer);waiting.delete(message.id);message.error?entry.reject(new Error(message.error)):entry.resolve(message.frame);}}});
  const send=message=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{waiting.delete(message.id);reject(new Error('Production Node Worker response timed out.'));},5000);waiting.set(message.id,{resolve,reject,timer});worker.postMessage(message);});
  try {
    const browser=browserWorker(),initial=await Promise.race([ready,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('Production Node Worker did not become ready.')),5000);timer.unref();})]);
    sameScience(browser.ready,initial,'initial production Worker frame');
    for(const file of ['backend/phase-mhd.js','backend/phase-session.js','public/phase-worker.js','backend/gfm/engine.js'])assert.equal(initial.software[file],sha(fs.readFileSync(path.join(ROOT,file))),file+' loaded bytes');
    const commands=[{id:1,type:'parameters',parameters:PARAMETERS},{id:2,type:'control',action:'pause'},{id:3,type:'control',action:'step'},{id:4,type:'control',action:'step'},{id:5,type:'export'}];
    for(const command of commands){const expected=browser.send(command);sameScience(await send(command),expected.frame,'production Node Worker '+command.id);}
    assert.deepEqual(errors,[]);
  } finally {for(const entry of waiting.values())clearTimeout(entry.timer);await worker.terminate();}
});
test('pause gates the actual Worker interval, play evolves one registered tick, and reset changes run identity',()=>{
  const browser=browserWorker(),node=NodeSession.createSession();
  let response=browser.send({id:1,type:'parameters',parameters:PARAMETERS});sameScience(response.frame,node.configure(PARAMETERS));
  assert.deepEqual(browser.tick(),[],'paused production timer does no numerical work');
  response=browser.send({id:2,type:'control',action:'play'});sameScience(response.frame,node.control('play'));
  const tick=browser.tick();assert.equal(tick.length,1);assert.equal(tick[0].type,'frame');sameScience(tick[0].frame,node.advance(.05));
  response=browser.send({id:3,type:'control',action:'pause'});sameScience(response.frame,node.control('pause'));assert.deepEqual(browser.tick(),[]);
  const prior=response.frame.runId;response=browser.send({id:4,type:'control',action:'reset'});sameScience(response.frame,node.control('reset'));assert.notEqual(response.frame.runId,prior);assert.equal(response.frame.sequence,0);assert.equal(response.frame.time,0);assert.equal(response.frame.running,false);
});
test('one in-flight frame and latest cache bound slow consumers while exact serial science continues',()=>{
  const browser=browserWorker(),node=NodeSession.createSession();
  browser.send({id:1,type:'parameters',parameters:PARAMETERS});node.configure(PARAMETERS);
  browser.send({id:2,type:'control',action:'play'});node.control('play');
  const first=browser.tick()[0];assert.equal(first.type,'frame');assert.equal(first.frame.scheduler.outstandingFrames,1);sameScience(first.frame,node.advance(.05));
  for(let i=0;i<8;i++){assert.deepEqual(browser.tick(),[],'slow consumer cannot create a posted-frame backlog');node.advance(.05);}
  const pending=browser.send({id:10,type:'snapshot'}).frame;sameScience(pending,node.snapshot());assert.equal(pending.scheduler.outstandingFrames,1);assert.equal(pending.scheduler.pendingLatestFrames,1);assert.equal(pending.scheduler.suppressedFrames,7);
  browser.queue({type:'ack',streamId:first.streamId+100});assert.deepEqual(browser.flush(),[],'wrong credit cannot publish cached science');
  browser.queue({type:'ack',streamId:first.streamId});const second=browser.flush()[0];sameScience(second.frame,node.snapshot());assert.ok(second.streamId>first.streamId);assert.equal(second.frame.sequence,9,'latest complete state is published without invented interpolation');
  browser.queue({type:'ack',streamId:first.streamId});assert.deepEqual(browser.flush(),[],'old credit cannot release the new frame');
  assert.deepEqual(browser.tick(),[]);node.advance(.05);
  const paused=browser.send({id:3,type:'control',action:'pause'}).frame;node.control('pause');sameScience(paused,node.snapshot());
  browser.queue({type:'ack',streamId:second.streamId});assert.deepEqual(browser.flush(),[],'pause drops pending running=true publication');assert.deepEqual(browser.tick(),[],'matching credit after pause cannot resume calculation');
  const frozen=browser.send({id:4,type:'snapshot'}).frame;assert.equal(frozen.scheduler.pendingTimers,0);assert.equal(frozen.scheduler.outstandingFrames,0);sameScience(frozen,node.snapshot());
});

test('invalid parameters and commands report errors while preserving numerical state, run and sequence',()=>{
  const browser=browserWorker(),node=NodeSession.createSession();browser.send({id:1,type:'parameters',parameters:PARAMETERS});node.configure(PARAMETERS);browser.send({id:2,type:'control',action:'step'});node.control('step');
  const before=browser.send({id:3,type:'snapshot'}).frame;
  const bad=[{id:4,type:'parameters',parameters:{resolution:17}},{id:5,type:'parameters',parameters:{inventedParameter:1}},{id:6,type:'control',action:'invented-action'},{id:7,type:'invented-command'}];
  for(const command of bad){const response=browser.send(command);assert.equal(response.type,'response');assert.ok(response.error);assert.throws(()=>apply(node,command));sameScience(response.frame,node.snapshot());assert.deepEqual(science(response.frame),science(before));assert.equal(response.frame.runId,before.runId);}
  browser.queueSource('{id:8,type:"parameters",parameters:{phaseSeedAmplitude:NaN}}');const nonfinite=browser.flush()[0];assert.match(nonfinite.error,/outside/);sameScience(nonfinite.frame,node.snapshot());assert.equal(nonfinite.frame.runId,before.runId);
  browser.queueSource('{id:9,type:"parameters",parameters:{get density(){return 1;}}}');const accessor=browser.flush()[0];assert.match(accessor.error,/data properties/);sameScience(accessor.frame,node.snapshot());
});
test('zero magnetic data are preserved through browser-Worker parameters and a real numerical step',()=>{
  const browser=browserWorker(),node=NodeSession.createSession(),parameters={...PARAMETERS,magneticStrength:0,guideFieldX:0,guideFieldY:0};
  browser.send({id:1,type:'parameters',parameters});node.configure(parameters);const response=browser.send({id:2,type:'control',action:'step'});sameScience(response.frame,node.control('step'));
  for(const name of ['bx','by','magneticStrength','currentZ','electricZ','magneticPhaseDefined'])assert.ok(response.frame.fields[name].every(value=>value===0),name+' retains exact zero');
  assert.deepEqual(response.frame.magneticDefects,[]);assert.equal(response.frame.diagnostics.magneticNullCount,256);assert.equal(response.frame.diagnostics.maxDivB,0);rawGF9Oracle(response.frame);
});
test('trusted zero complex initial condition and raw GF9 transform preserve zero in both numerical runtimes',()=>{
  // Zero psi is supplied through the documented trusted local testing callback,
  // not through HTTP/Worker parameters (whose public seed range is positive).
  const browser=browserWorker();
  const actual=copy(vm.runInContext('(function(){const model=PhaseMHD.createModel({resolution:16},()=>({psiRe:0,psiIm:0}));const frame=model.step(.05);const input=[34,40,45,130,136,141,210,216,221].map(i=>({re:frame.fields.psiRe[i],im:frame.fields.psiIm[i]}));const transformed=RusslEngine.fourier("gf9",input);const reconstructed=RusslEngine.fourier("gf9",transformed,true);return {frame,input,transformed,reconstructed};})()',browser.context));
  const model=NodeCore.createModel({resolution:16},()=>({psiRe:0,psiIm:0})),expected=model.step(.05),input=Array.from({length:9},()=>({re:0,im:0}));
  assert.deepEqual(actual.frame,expected);assert.ok(actual.frame.fields.amplitude.every(value=>value===0));assert.ok(actual.frame.fields.phaseDefined.every(value=>value===0));assert.deepEqual(actual.frame.defects,[]);
  assert.deepEqual(actual.input,input);assert.deepEqual(actual.transformed,NodeGFM.fourier('gf9',input));assert.deepEqual(actual.reconstructed,input);assert.equal(NodeGFM.norm(actual.transformed),0);
});
