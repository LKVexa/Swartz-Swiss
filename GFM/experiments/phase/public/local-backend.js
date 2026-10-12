(function(root){'use strict';
 const listeners=new Set(),phaseListeners=new Set(),clients=[],cache=new Map();
 let state=null,phase=null,closed=false,physicsConfig={observerRadius:20,inclinationDeg:60,rayCount:16,tolerance:1e-7},physics={status:'calculating',scope:'Neutral fixed Kerr exterior test-light paths; no formation, plasma, material cover or traversability dynamics.'},fullPhysics=null,wanted=null,active=null,physicsGeneration=0;
 const frameTimes=[],renderTimes=[],solverTimes=[];let lastRenderMilliseconds=0,phaseStamp=null;
 const copy=value=>structuredClone(value),timestamp=()=>performance.now();
 function rate(times){const now=timestamp();while(times.length&&times[0]<now-2000)times.shift();return times.length<2?0:(times.length-1)*1000/Math.max(1,times.at(-1)-times[0]);}
 function metrics(){const frameHz=rate(frameTimes),now=timestamp();while(solverTimes.length&&solverTimes[0].time<now-2000)solverTimes.shift();const first=solverTimes[0],last=solverTimes.at(-1),solverHz=phase?.running&&solverTimes.length>1?(last.sequence-first.sequence)*1000/Math.max(1,last.time-first.time):0;return Object.freeze({renderFPS:rate(renderTimes),frameHz,solverHz,targetHz:phase?.scheduler?.targetHz??0,solverMilliseconds:phase?.scheduler?.meanWorkMilliseconds||0,lastRenderMilliseconds,pendingTimers:phase?.scheduler?.pendingTimers||0,outstandingFrames:phase?.scheduler?.outstandingFrames||0,pendingLatestFrames:phase?.scheduler?.pendingLatestFrames||0,suppressedFrames:phase?.scheduler?.suppressedFrames||0,transport:'local browser workers',simulatedStep:.05});}
 Object.defineProperty(root,'GFM_PHASE_PERFORMANCE',{get:metrics,configurable:true});
 function client(file,onMessage){
  const worker=new Worker(new URL(file,document.currentScript?.src||location.href)),pending=new Map();let id=0,resolveReady,rejectReady;
  const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});ready.catch(()=>{});
  function failure(error){rejectReady(error);for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(error);}pending.clear();}
  worker.addEventListener('message',event=>{const message=event.data;if(message.type==='ready')resolveReady(message);onMessage?.(message);if(message.id!==undefined){const entry=pending.get(message.id);if(!entry)return;pending.delete(message.id);clearTimeout(entry.timer);message.error||message.ok===false?entry.reject(new Error(message.error)):entry.resolve(message);}});
  worker.addEventListener('error',event=>failure(new Error(event.message||'Local calculation worker failed.')));
  const api={ready,notify(payload){if(!closed)worker.postMessage(payload);},send(payload){if(closed)return Promise.reject(new Error('Console worker closed.'));if(pending.size>=8)return Promise.reject(new Error('Local command queue is full.'));return new Promise((resolve,reject)=>{const next=++id,timer=setTimeout(()=>{pending.delete(next);reject(new Error('Local calculation timed out.'));},120000);pending.set(next,{resolve,reject,timer});worker.postMessage({...payload,id:next});});},close(){failure(new Error('Console worker closed.'));worker.terminate();}};
  clients.push(api);return api;
 }
 function attached(){return state?{...copy(state),physics:copy(physics),research:{version:'3.0.0',execution:'browser workers inside JA21',physicalExteriorShared:true,credibility:'Numerical verification and recomputed failed held-out geometric EHT comparison; phase and aperture hypotheses are not observationally validated'}}:null;}
 function publish(){const frame=attached();if(frame)for(const listener of listeners)listener(frame);}
 function setState(next){state=next;requestPhysics(next.parameters.spin);publish();}
 const research=client('./console-worker.js',message=>{if(message.state)setState(message.state);});
 const fields=client('./phase-worker.js',message=>{if(message.frame){if(phase&&phase.runId!==message.frame.runId)solverTimes.length=0;phase=message.frame;const stamp=phase.runId+':'+phase.sequence;if(stamp!==phaseStamp){phaseStamp=stamp;const now=timestamp();frameTimes.push(now);solverTimes.push({time:now,sequence:phase.sequence});}for(const listener of phaseListeners)listener(copy(phase));
  // Consumers have accepted the data and scheduled a latest-only paint before
  // credit is returned. The worker can overlap its next solve with that paint.
  if(message.type==='frame')fields.notify({type:'ack',streamId:message.streamId});
 }});
 const rays=client('./relativity-worker.js');
 function reference(inputs){return {M:1,a:inputs.spin,Q:0,rPlus:1+Math.sqrt(Math.max(0,1-inputs.spin**2)),rErgoEquator:2,units:'G=c=M=1; coordinate lengths in M',settings:{...physicsConfig},inputs,generation:physicsGeneration};}
 function accept(job,message){if(closed||job.key!==wanted?.key)return;fullPhysics=message.result;physics={...reference(job.inputs),status:'ready',model:'Neutral Kerr null geodesics',rays:{trajectories:message.result.trajectories.map(ray=>{const stride=Math.max(1,Math.ceil(ray.points.length/128));return {...ray,points:ray.points.filter((_,i)=>i%stride===0||i===ray.points.length-1).map(point=>Array.isArray(point)?point:[point.x,point.y,point.z])};})},diagnostics:message.result.diagnostics,benchmarks:message.result.benchmarks,solverMilliseconds:message.milliseconds,sourceHashes:message.sourceHashes,solverSourceSha256:message.solverSourceSha256,workerSourceSha256:message.workerSourceSha256,scope:message.result.trajectories[0]?.scope||physics.scope};publish();}
 function pump(){if(closed||active||!wanted)return;if(cache.has(wanted.key)){accept(wanted,cache.get(wanted.key));return;}const job=wanted;active=job;rays.send({inputs:job.inputs}).then(message=>{cache.set(job.key,message);while(cache.size>4)cache.delete(cache.keys().next().value);accept(job,message);}).catch(error=>{if(job.key===wanted?.key){physics={...reference(job.inputs),status:'error',error:error.message,scope:physics.scope};publish();}}).finally(()=>{active=null;if(wanted?.key!==job.key)pump();});}
 function requestPhysics(spin=state?.parameters.spin??.99){const inputs={spin,observerRadius:physicsConfig.observerRadius,inclination:physicsConfig.inclinationDeg*Math.PI/180,rayCount:physicsConfig.rayCount,tolerance:physicsConfig.tolerance},key=JSON.stringify(inputs);if(wanted?.key===key)return;wanted={key,inputs};physicsGeneration++;fullPhysics=null;physics={...reference(inputs),status:'calculating',scope:physics.scope};pump();}
 function configurePhysics(patch){const limits={observerRadius:[12,100],inclinationDeg:[15,165],rayCount:[8,32],tolerance:[1e-10,1e-4]};if(!patch||typeof patch!=='object'||Array.isArray(patch))throw new Error('Physics settings must be an object.');for(const [key,value]of Object.entries(patch)){if(!limits[key]||!Number.isFinite(value)||value<limits[key][0]||value>limits[key][1]||(key==='rayCount'&&!Number.isInteger(value)))throw new Error('Invalid physics setting: '+key);}physicsConfig={...physicsConfig,...patch};requestPhysics();return {physics:copy(physics)};}
 async function request(path,options={}){
  if(closed)throw new Error('Console worker closed.');let body=options.body;if(typeof body==='string')body=JSON.parse(body);const method=options.method||'GET';
  if(path==='/api/phase'||path==='/api/phase/export.json'){const reply=await fields.send({type:'snapshot'});return path.endsWith('export.json')?{schema:'GFM-phase-export/1',frame:reply.frame,execution:'browser-worker',performance:metrics()}:reply.frame;}
  if(path==='/api/phase/parameters'||path==='/api/phase/control'){const reply=await fields.send(path.endsWith('parameters')?{type:'parameters',parameters:body}:{type:'control',action:body.action});return reply.frame;}
  if(path==='/api/physics')return method==='POST'?configurePhysics(body):copy(physics);
  if(path==='/api/physics-export.json')return {schema:'GFM-Kerr-physics-recording/1',...copy(physics),fullSolverResult:copy(fullPhysics),reproducibility:{implementation:'backend/relativity.cjs',sameInputsBothBranches:true,randomness:'None; deterministic impact-coordinate bundle'}};
  const reply=await research.send({path,body});if(reply.result?.schema==='GFM-Aperture-Aggie-frame/1'){setState(reply.result);return attached();}if(path==='/api/export.json')return {...reply.result,physics:await request('/api/physics-export.json')};return reply.result;
 }
 function subscribe(set,listener,current){set.add(listener);if(current)listener(copy(current));return()=>set.delete(listener);}
 function close(){if(closed)return;closed=true;for(const item of clients)item.close();listeners.clear();phaseListeners.clear();}
 root.GFM_PHASE_LOCAL=Object.freeze({ready:Promise.all([research.ready,fields.ready]),request,subscribe:listener=>subscribe(listeners,listener,attached()),subscribePhase:listener=>subscribe(phaseListeners,listener,phase),snapshot:()=>attached(),phaseSnapshot:()=>copy(phase),getPerformance:metrics,recordRender(milliseconds){renderTimes.push(timestamp());lastRenderMilliseconds=milliseconds;},close});
 root.GFM_PHASE_LOCAL.ready.catch(error=>{for(const listener of listeners)listener({error:error.message});});
 addEventListener('pagehide',close,{once:true});
})(globalThis);
