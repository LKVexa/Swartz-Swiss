'use strict';
// Compare wall-clock pacing for the same audited equations and requested
// physical interval. This is a Node timer/solver benchmark, not a GPU FPS claim.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {performance}=require('node:perf_hooks');
const {build}=require('../build-browser-backend.cjs');
const {createModel}=require('../backend/cylinder-em.cjs');
const {presetParameters}=require('../backend/research-presets.cjs');
const ROOT=path.resolve(__dirname,'..'),plain=x=>JSON.parse(JSON.stringify(x));
const targetSeconds=1e-9,advanceSeconds=4e-11;

async function benchmark(workerSource,acknowledged,label){
 return new Promise((resolve,reject)=>{
  let context,id=0,callbacks=0,callbackWallMs=0,requestedIdleMs=0,streamFrames=0,closed=false,started=0;
  const timers=new Set();
  const timeout=setTimeout(()=>finish(new Error('Benchmark did not finish')),30000);
  function finish(error,frame){if(closed)return;closed=true;clearTimeout(timeout);for(const timer of timers)clearTimeout(timer);timers.clear();if(error){reject(error);return;}const wallMs=performance.now()-started;resolve({label,frame,wallMs,controllerCallbackWallMs:callbackWallMs,requestedIdleMs,callbacks,streamFrames,physicalSeconds:frame.timeSeconds,observedPhysicsNanosecondsPerWallSecond:frame.timeSeconds*1e12/wallMs});}
  const scope={URL,TextEncoder,crypto:crypto.webcrypto,performance,
   setTimeout(fn,delay){requestedIdleMs+=delay;const timer=setTimeout(()=>{timers.delete(timer);const t=performance.now();try{callbacks++;fn();}catch(error){finish(error);}finally{callbackWallMs+=performance.now()-t;}},delay);timers.add(timer);return timer;},clearTimeout(timer){clearTimeout(timer);timers.delete(timer);},
   postMessage(message){if(message.event!=='frame')return;streamFrames++;if(acknowledged)context.onmessage({data:{kind:'frame-ack',sequence:message.sequence}});if(message.data.timeSeconds>=targetSeconds-1e-22){context.onmessage({data:{kind:'close',id:++id}});queueMicrotask(()=>finish(null,plain(message.data)));}}
  };
  context=vm.createContext(scope);vm.runInContext(workerSource,context);started=performance.now();
  context.onmessage({data:{kind:'initialize',id:++id,options:{initialPreset:'covered-plasma',running:true,stream:true,advanceSeconds}}});
 });
}

async function main(){
 const bundle=build();
 const controller=fs.readFileSync(path.join(ROOT,'browser/worker-controller.cjs'),'utf8');
 const baselinePath='D:/Codex/GFM-Cylindrical-Pulse-Simulator/browser/worker-controller.cjs';
 const baselineController=fs.readFileSync(baselinePath,'utf8');
 assert.match(baselineController,/}, 60\);/,'Preserved baseline uses fixed post-solve60ms wait');
 const prefix=bundle.workerSource.slice(0,-controller.length);
 const baseline=await benchmark(prefix+baselineController,false,'preserved fixed60ms controller');
 const adaptive=await benchmark(bundle.workerSource,true,'bounded maximum-throughput controller');
 const model=createModel(presetParameters('covered-plasma'));
 for(let i=0;i<25;i++)model.step(advanceSeconds);
 const expected=model.snapshot();
 for(const key of Object.keys(expected)){assert.deepEqual(plain(baseline.frame[key]),plain(expected[key]),'Baseline '+key);assert.deepEqual(plain(adaptive.frame[key]),plain(expected[key]),'Adaptive '+key);}
 const summarize=value=>{const {frame,...rest}=value;return {...rest,stepCount:frame.stepCount,relativeEnergyBalanceResidual:frame.diagnostics.relativeEnergyBalanceResidual};};
 const report={schema:'GFM-performance-benchmark/1',generatedAt:new Date().toISOString(),targetSeconds,advanceSeconds,physicsParity:'exact JSON representation of all audited snapshot quantities',sourceEngineSHA256:bundle.metadata.engineSHA256,
  baseline:summarize(baseline),adaptive:summarize(adaptive),wallClockSpeedup:baseline.wallMs/adaptive.wallMs,
  nativeRenderedFPS:null,interpretation:'Measured solver/controller wall time on this host for the same1ns physical experiment. No general speed guarantee or browser/GPU FPS result. Camera redraw and latest-frame bounds are tested independently. Real-display FPS is measured onscreen through GFM_PERFORMANCE.render.framesPerSecond.'};
 fs.writeFileSync(path.join(ROOT,'validation/performance-benchmark.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));return report;
}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1;});
module.exports={main};
