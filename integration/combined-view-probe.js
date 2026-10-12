(async function verifyCombinedConsole(){
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 async function wait(check,description,limit=45000){const start=performance.now();while(performance.now()-start<limit){const value=await check();if(value)return value;await delay(50);}throw new Error('Timed out: '+description);}
 function check(value,message){if(!value)throw new Error(message);}
 const summary={consoleVersion:'2.0.0',location:location.href,models:{}};
 async function instrument(key){document.querySelector('[data-instrument="'+key+'"]').click();await wait(()=>!GFM_CONSOLE.initializing,'instrument '+key);return GFM_CONSOLE.getActiveWindow();}
 async function measure(win,metric,ms=5000){const values=[];const start=performance.now();while(performance.now()-start<ms){await delay(250);values.push(structuredClone(win[metric]));}return values;}
 try{
  check(Boolean(window.GFM_CONSOLE),'Combined instrument bar not loaded');
  let win=await instrument('pulse'),doc=win.document,backend=win.GFM_LOCAL_BACKEND;await backend.ready;
  const first=await backend.request('/api/state');window.__gfmConsoleInitialFrame=first;
  await wait(()=>!doc.getElementById('step').disabled,'pulse Step enabled');doc.getElementById('step').click();
  const stepped=await wait(async()=>{const value=await backend.request('/api/state');return value.timeSeconds>first.timeSeconds&&value;},'pulse Step advances fields');
  const canvas=doc.getElementById('scene'),gl=canvas.getContext('webgl');
  check(gl&&gl.getError()===0,'Pulse WebGL error');check(['show-phase-layer','show-plasma-layer','show-cover-layer'].every(id=>doc.getElementById(id).checked),'Combined physical layers not visible');
  check(stepped.diagnostics.plasmaCollisionHeatJ>0&&stepped.diagnostics.coverOhmicHeatJ>0,'Calculated energy deposits missing');
  await wait(()=>!doc.getElementById('run').disabled,'pulse Run enabled');doc.getElementById('run').click();await wait(async()=>(await backend.request('/api/state')).running,'pulse playing');
  const pulseRates=await measure(win,'GFM_PERFORMANCE');doc.getElementById('run').click();
  const paused=await wait(async()=>{const value=await backend.request('/api/state');return !value.running&&value;},'pulse paused');await delay(300);const stopped=await backend.request('/api/state');check(stopped.timeSeconds===paused.timeSeconds,'Pulse clock advanced while paused');
  const exported=await backend.request('/api/export');check(exported.schema==='GFM-cylindrical-export/2','Pulse export schema');
  const anchorClick=win.HTMLAnchorElement.prototype.click;win.HTMLAnchorElement.prototype.click=function(){if(this.download==='GFM-phase-pulse-experiment.json')win.__gfmExportLinkClicked=true;return anchorClick.apply(this,arguments);};
  doc.getElementById('export').click();await wait(()=>win.__gfmExportLinkClicked,'pulse Export download link');await delay(500);win.HTMLAnchorElement.prototype.click=anchorClick;
  summary.models.pulse={stepControlAdvanced:true,initialTimeSeconds:first.timeSeconds,steppedTimeSeconds:stepped.timeSeconds,runAdvanced:paused.timeSeconds>stepped.timeSeconds,pauseFreezes:true,webgl:true,webglError:gl.getError(),layers:3,sourceSHA256:first.server.engineSHA256,transport:first.server.transport,exportSchema:exported.schema,rates:pulseRates,maximumDrawFPS:Math.max(...pulseRates.map(v=>v.render.framesPerSecond)),maximumOutstandingFrames:Math.max(...pulseRates.map(v=>v.physics.outstandingStreamFrames)),maximumTransportQueue:Math.max(...pulseRates.map(v=>v.transport.maximumQueuedFrames))};
  win=await instrument('phase');doc=win.document;backend=win.GFM_PHASE_LOCAL;await backend.ready;
  const initialPhase=await backend.request('/api/phase');window.__gfmConsolePhaseInitialFrame=initialPhase;
  await wait(()=>!doc.getElementById('phase-step').disabled,'phase Step enabled');doc.getElementById('phase-step').click();
  const nextPhase=await wait(async()=>{const value=await backend.request('/api/phase');return value.time>initialPhase.time&&value;},'phase Step advances');
  check(Object.values(nextPhase.fields).filter(Array.isArray).every(a=>a.every(Number.isFinite)),'Phase fields contain nonfinite values');
  doc.getElementById('phase-play').click();await wait(async()=>(await backend.request('/api/phase')).running,'phase playing');
  const phaseRates=await measure(win,'GFM_PHASE_PERFORMANCE');doc.getElementById('phase-play').click();
  const pausedPhase=await wait(async()=>{const value=await backend.request('/api/phase');return !value.running&&value;},'phase paused');await delay(300);check((await backend.request('/api/phase')).time===pausedPhase.time,'Phase clock advanced while paused');
  win.PhaseTextureView.validateSnapshot(pausedPhase);
  doc.getElementById('phase-mode').value='material';doc.getElementById('phase-mode').dispatchEvent(new win.Event('change',{bubbles:true}));await delay(200);
  const phaseExport=await backend.request('/api/phase/export.json');check(phaseExport.frame.fields.psiRe.length===initialPhase.grid.nx*initialPhase.grid.ny,'Full calculated phase export');
  const phaseAnchorClick=win.HTMLAnchorElement.prototype.click;win.HTMLAnchorElement.prototype.click=function(){if(this.download==='GFM-phase-fields.json')win.__gfmPhaseExportLinkClicked=true;return phaseAnchorClick.apply(this,arguments);};
  doc.getElementById('phase-export').click();await wait(()=>{if(doc.getElementById('phase-live-status').dataset.state==='error')throw new Error(doc.getElementById('phase-live-status').textContent);return win.__gfmPhaseExportLinkClicked;},'phase Export download link',10000);await delay(500);win.HTMLAnchorElement.prototype.click=phaseAnchorClick;
  summary.models.phase={stepControlAdvanced:true,initialTime:initialPhase.time,steppedTime:nextPhase.time,runTime:pausedPhase.time,runAdvanced:pausedPhase.time>nextPhase.time,pauseFreezes:true,schema:nextPhase.schema,grid:nextPhase.grid,exportSchema:phaseExport.schema,materialView:doc.getElementById('phase-mode').value,rates:phaseRates,maximumDrawFPS:Math.max(...phaseRates.map(v=>v.renderFPS)),maximumFieldHz:Math.max(...phaseRates.map(v=>v.frameHz)),maximumPendingTimers:Math.max(...phaseRates.map(v=>v.pendingTimers))};
  await instrument('aperture');check(doc.getElementById('view-hypothesis').getAttribute('aria-pressed')==='true','Hypothesis view not selected');
  const cover=doc.getElementById('cover');cover.value='0';cover.dispatchEvent(new win.Event('input',{bubbles:true}));
  const uncovered=await wait(()=>{const value=backend.snapshot();return value.parameters.coverLoad===0&&value;},'uncovered branch control');
  check(uncovered.branches.aggie.passage===1&&uncovered.branches.gaseous.passage===1,'Uncovered rule not applied');
  cover.value='2';cover.dispatchEvent(new win.Event('input',{bubbles:true}));
  const covered=await wait(()=>{const value=backend.snapshot();return value.parameters.coverLoad===2&&value;},'sealed branch control');check(covered.branches.aggie.passage===0&&covered.branches.gaseous.passage===1&&covered.observation.identical,'Covered postulate or matched exterior not retained');
  doc.getElementById('demo').click();const demoStarted=performance.now();await wait(()=>backend.snapshot().running&&backend.snapshot().experiment,'scripted two-branch demo');
  const completed=await wait(()=>{const value=backend.snapshot();return !value.running&&value.experiment?.elapsed>=12&&value;},'12-second demo',18000);
  const demoWallSeconds=(performance.now()-demoStarted)/1000;check(demoWallSeconds>=11.5&&demoWallSeconds<18,'Illustrative clock speed changed by higher refresh');
  summary.models.aperture={uncoveredPassage:uncovered.branches.aggie.passage,coveredPassage:covered.branches.aggie.passage,matchedExterior:covered.observation.identical,viewSelected:true,demoElapsed:completed.experiment.elapsed,demoWallSeconds,recordedFrames:completed.recording.retainedFrames};
  await instrument('kerr');check(doc.getElementById('view-physics').getAttribute('aria-pressed')==='true','Kerr view not selected');
  const physics=await wait(()=>{const value=backend.snapshot()?.physics;return value?.status==='ready'&&value;},'actual Kerr integration');const full=await backend.request('/api/physics-export.json');
  check(full.fullSolverResult?.trajectories?.length===physics.inputs.rayCount&&physics.solverSourceSha256,'Kerr result must be newly computed with source identity');
  const orbitGL=doc.getElementById('universe').getContext('webgl');check(orbitGL&&orbitGL.getError()===0,'Kerr canvas WebGL error');
  summary.models.kerr={status:physics.status,rayCount:full.fullSolverResult.trajectories.length,solverMilliseconds:physics.solverMilliseconds,sourceSHA256:physics.solverSourceSha256,diagnostics:physics.diagnostics,webgl:true};
  const observations=await backend.request('/api/observations');check(observations.comparisonPassed===false&&observations.data.holdoutRows===146,'Observation failure or held-out sample not retained');
  summary.models.observations={comparisonPassed:observations.comparisonPassed,data:observations.data,models:observations.models.map(item=>({model:item.fit.model,holdoutRMS:item.holdout.normalizedResidualRms})),scope:'Geometric references fail; no empirical validation of local plasma/cover/passage'};
  win=await instrument('terminal');doc=win.document;check(doc.getElementById('engine-status').dataset.state==='ready','Legacy GFM engine not ready');doc.getElementById('run-sequence').click();
  await wait(()=>doc.getElementById('sequence-status').textContent.includes('Completed 4 / 4'),'actual GFM terminal sequence');
  summary.models.terminal={engineReady:true,sequenceStatus:doc.getElementById('sequence-status').textContent};
  win=await instrument('equations');doc=win.document;await wait(()=>doc.getElementById('reference-content').children.length>1,'audited equation registry');summary.models.audit={cards:doc.querySelectorAll('.reference-card').length};
  check(summary.models.audit.cards>=38,'Applied 38-finding audit missing');
  await instrument('pulse');await delay(500);
  summary.ok=true;window.__gfmConsoleTest=summary;
 }catch(error){window.__gfmConsoleTest={...summary,ok:false,error:error.message,stack:error.stack};}
})();
