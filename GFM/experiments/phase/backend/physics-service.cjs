'use strict';
const path=require('node:path');
const {Worker}=require('node:worker_threads');
const DEFAULTS=Object.freeze({observerRadius:20,inclinationDeg:60,rayCount:16,tolerance:1e-7});
const LIMITS={observerRadius:[12,100],inclinationDeg:[15,165],rayCount:[8,32],tolerance:[1e-10,1e-4]};
function validateConfig(patch,current=DEFAULTS){
  if(!patch||typeof patch!=='object'||Array.isArray(patch))throw new Error('Physics settings must be an object.');
  for(const key of Object.keys(patch)){
    if(!Object.hasOwn(LIMITS,key))throw new Error('Unknown physics setting: '+key);
    const n=patch[key],range=LIMITS[key];
    if(typeof n!=='number'||!Number.isFinite(n)||n<range[0]||n>range[1]||(key==='rayCount'&&!Number.isInteger(n)))throw new Error(key+' must be finite in '+range.join('..')+'.');
  }
  return {...current,...patch};
}
function createPhysicsService({onUpdate=()=>{},debounceMs=250,enabled=true}={}){
  let config={...DEFAULTS},spin=.99,wanted=null,active=null,timer=null,worker=null,closed=false,generation=0;
  const cache=new Map();
  let full=null,executionHashes={solverSourceSha256:null,workerSourceSha256:null},state={status:enabled?'calculating':'disabled',scope:'Neutral Kerr test-light paths. No formation, plasma, matter cover or traversability dynamics.'};
  const clone=v=>structuredClone(v);
  function inputs(){return {spin,observerRadius:config.observerRadius,inclination:config.inclinationDeg*Math.PI/180,rayCount:config.rayCount,tolerance:config.tolerance};}
  function reference(){return {M:1,a:spin,Q:0,rPlus:1+Math.sqrt(Math.max(0,1-spin*spin)),rErgoEquator:2,units:'G=c=M=1; coordinate lengths in M',settings:{...config},inputs:inputs(),generation,...executionHashes};}
  function notify(){if(!closed)onUpdate(snapshot());}
  function simplified(result){return {trajectories:result.trajectories.map(ray=>{
    const points=ray.points||[],stride=Math.max(1,Math.ceil(points.length/128)),selected=points.filter((_,i)=>i%stride===0||i===points.length-1);
    return {outcome:ray.outcome,points:selected.map(p=>Array.isArray(p)?p:[p.x,p.y,p.z]),constants:ray.constants,diagnostics:ray.diagnostics};
  })};}
  function accept(key,data){
    cache.set(key,data);while(cache.size>8)cache.delete(cache.keys().next().value);
    if(key!==wanted?.key)return;
    executionHashes={solverSourceSha256:data.solverSourceSha256,workerSourceSha256:data.workerSourceSha256};
    full=data.result;state={status:'ready',model:full.model||'Neutral Kerr null geodesics',rays:simplified(full),diagnostics:full.diagnostics,benchmarks:full.benchmarks,solverMilliseconds:data.milliseconds,scope:full.scope||state.scope};generation++;notify();
  }
  function startWorker(){
    if(worker||closed||!enabled)return;
    const instance=new Worker(path.join(__dirname,'physics-worker.cjs'));worker=instance;worker.unref();
    instance.on('message',message=>{if(worker!==instance||closed)return;active=null;if(message.error){if(message.key===wanted?.key){state={status:'error',error:message.error,scope:state.scope};notify();}}else accept(message.key,message);pump();});
    instance.on('error',error=>{if(worker!==instance||closed)return;active=null;worker=null;state={status:'error',error:error.message,scope:state.scope};notify();});
    instance.on('exit',()=>{if(worker===instance){active=null;worker=null;}});
  }
  function pump(){
    if(closed||!enabled||active||!wanted)return;
    if(cache.has(wanted.key)){if(state.status!=='ready')accept(wanted.key,cache.get(wanted.key));return;}
    if(state.status==='error')return;
    startWorker();active=wanted;worker.postMessage(active);
  }
  function request(nextSpin=spin){
    if(typeof nextSpin!=='number'||!Number.isFinite(nextSpin)||nextSpin<0||nextSpin>1)throw new Error('Spin must lie in0..1.');
    spin=nextSpin;const next=inputs(),key=JSON.stringify(next);if(wanted?.key===key)return;
    wanted={key,inputs:next};full=null;executionHashes={solverSourceSha256:null,workerSourceSha256:null};state={status:enabled?'calculating':'disabled',scope:state.scope};generation++;notify();
    clearTimeout(timer);if(cache.has(key))accept(key,cache.get(key));else if(enabled){timer=setTimeout(pump,debounceMs);timer.unref();}
  }
  function snapshot(){return clone({...reference(),...state});}
  function configure(patch){config=validateConfig(patch,config);wanted=null;request(spin);return snapshot();}
  function exportData(){return {schema:'GFM-Kerr-physics-recording/1',...snapshot(),fullSolverResult:clone(full),reproducibility:{implementation:'backend/relativity.cjs',sourceSha256:executionHashes.solverSourceSha256,integrationInputs:inputs(),randomness:'None; deterministic impact-coordinate bundle',sameInputsBothBranches:true}};}
  async function close(){closed=true;clearTimeout(timer);if(worker)await worker.terminate();worker=null;}
  request(spin);
  return {snapshot,request,configure,exportData,close};
}
module.exports={createPhysicsService,validateConfig,DEFAULTS};
