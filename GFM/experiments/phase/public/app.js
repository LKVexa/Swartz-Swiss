(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const ui = Object.fromEntries(['connection','controls','error-message','spin','cover','critical','spin-value','cover-value','critical-value','play','step','reset','demo','demo-caption','clock','rplus','omega','gas-status','aggie-status','gas-radius','aggie-radius','gas-passage','aggie-passage','aggie-cover','observation','frame-counter','data-badge','signal-energy','recovery-error','checks','gfm-rows','timeline','universe','camera-reset','renderer-error'].map(id => [id,$(id)]));
  let state=null, renderer=null, stream=null, parameterTimer=null, editingUntil=0, posting=Promise.resolve(),viewMode='physics',physicsTimer=null,physicsEditingUntil=0;
  const science=Object.fromEntries(['stage','view-physics','view-hypothesis','physics-status','physics-caption','physics-count','physics-outcomes','physics-null','physics-integrals','physics-runtime','physics-benchmarks','physics-validity','inclination','inclination-value','accuracy','ray-count','geometry-label','gas-title','gas-subtitle','aggie-title','aggie-subtitle'].map(id=>[id,$(id)]));
  const fmt = (n,d=6) => Number(n).toFixed(d);
  const local=window.GFM_PHASE_LOCAL;
  let pendingRender=null,renderRequest=null;
  const numeric = n => n === 0 ? '0' : Math.abs(n)<1e-5 ? n.toExponential(3) : n.toPrecision(7);
  function showError(message) { ui['error-message'].textContent=message;ui['error-message'].hidden=!message; }
  function connection(status,text) {ui.connection.className='connection '+status;ui.connection.textContent=text;ui.controls.disabled=status!=='live';}
  try { renderer=new ApertureRenderer(ui.universe); } catch (error) {ui['renderer-error'].textContent=error.message;ui['renderer-error'].hidden=false;}
  function setView(mode){
    viewMode=mode;renderer?.setMode?.(mode);science.stage.className='stage '+(mode==='physics'?'physics-mode':'hypothesis-mode');
    science['view-physics'].setAttribute('aria-pressed',String(mode==='physics'));science['view-hypothesis'].setAttribute('aria-pressed',String(mode==='hypothesis'));
    science['geometry-label'].textContent=mode==='physics'?'COORDINATE EMBEDDING · ILLUSTRATIVE DISK':'HYPOTHETICAL GEOMETRY';
    science['gas-title'].textContent=mode==='physics'?'Gaseous branch':'Gaseous aperture';science['aggie-title'].textContent=mode==='physics'?'Aggie branch':'Aggie';
    science['gas-subtitle'].textContent=mode==='physics'?'Matched Kerr exterior':'Uncovered branch';science['aggie-subtitle'].textContent=mode==='physics'?'Matched Kerr exterior':'Cover-controlled branch';
    science['physics-caption'].textContent=mode==='physics'?'Both branches share the same Kerr spacetime and calculated light paths. The glow is illustrative. Display coordinates are a scaled embedding, not proper distance.':'Your aperture and cover rules are an experimental layer. Opening and passage indicators have no observational validation here.';
    ui.universe.setAttribute('aria-label',mode==='physics'?'Interactive 3D comparison of matched Kerr exteriors and calculated light paths':'Interactive 3D comparison of the hypothetical gaseous aperture and aggie cover');
  }
  science['view-physics'].addEventListener('click',()=>setView('physics'));science['view-hypothesis'].addEventListener('click',()=>setView('hypothesis'));setView('physics');
  ui['camera-reset'].addEventListener('click',()=>renderer?.reset());
  function receive(next) {
    pendingRender=next;
    if(renderRequest!==null)return;
    renderRequest=requestAnimationFrame(()=>{const latest=pendingRender;pendingRender=null;renderRequest=null;applyFrame(latest);});
  }
  function applyFrame(next) {
    if(next.schema!=='GFM-Aperture-Aggie-frame/1')throw new Error('The backend returned an unsupported frame.');
    if(state && next.runId===state.runId && next.sequence<state.sequence)return;
    state=next;connection('live','Local workers ready');showError('');
    const p=state.parameters,g=state.branches.gaseous,a=state.branches.aggie;
    if(Date.now()>editingUntil){ui.spin.value=p.spin;ui.cover.value=p.coverLoad;ui.critical.value=p.alphaCritical;ui['spin-value'].value=fmt(p.spin,3);ui['cover-value'].value=fmt(p.coverLoad,3);ui['critical-value'].value=fmt(p.alphaCritical,3);}
    ui.play.textContent=state.running?'Pause':'Play';ui.step.disabled=state.running;
    ui.clock.textContent=fmt(state.elapsed,1)+' s';ui.rplus.textContent=fmt(state.exterior.rPlus);ui.omega.textContent=fmt(state.exterior.omegaH);
    ui['gas-radius'].textContent=fmt(g.apertureRadius);ui['aggie-radius'].textContent=fmt(a.apertureRadius);ui['gas-passage'].textContent=g.passage;ui['aggie-passage'].textContent=a.passage;ui['aggie-cover'].textContent=a.cover;
    function chip(id,b,amber){const node=ui[id];node.textContent=!b.geometricOpen?'SPIN CLOSED':b.cover?'SEALED':'OPEN';node.className='state-chip'+(amber?' amber-chip':'')+(!b.geometricOpen?' closed':'');}
    chip('gas-status',g,false);chip('aggie-status',a,true);
    ui.observation.textContent=state.observation.identical?'Same exterior observations. The cover difference is visible here because the experiment exposes the assumed branch state.':'The selected observations differ.';
    ui['frame-counter'].textContent='FRAME '+state.sequence.toString().padStart(4,'0');
    ui['data-badge'].textContent='Local illustration worker · '+state.recording.retainedFrames+' recorded frames';
    ui['demo-caption'].textContent=state.experiment?state.experiment.stage:'Remove the cover, then lower spin to close both apertures.';
    ui['signal-energy'].textContent=numeric(state.gfm.checks.energyPreservation.inputEnergy);
    ui['recovery-error'].textContent=numeric(state.gfm.maxRecoveryError);
    ui.checks.textContent=state.gfm.passed?'PASS':'FAILED';ui.checks.style.color=state.gfm.passed?'var(--teal)':'var(--red)';
    ui['gfm-rows'].replaceChildren(...state.gfm.nodes.map((spin,i)=>{const row=document.createElement('tr');[i,fmt(spin,3),numeric(state.gfm.raw[i].re),numeric(state.gfm.coefficients[i].re),numeric(state.gfm.coefficients[i].im),numeric(state.gfm.recovered[i].re)].forEach(value=>{const cell=document.createElement('td');cell.textContent=value;row.appendChild(cell);});return row;}));
    renderer?.update(state);drawTimeline();
    const pstate=state.physics;
    if(pstate){
      const d=pstate.diagnostics||{},rays=pstate.rays?.trajectories||[],ready=pstate.status==='ready';
      science['physics-status'].textContent=ready?'Computed Kerr light paths':pstate.status==='error'?'Light-path calculation failed':pstate.status==='disabled'?'Light-path worker disabled':'Calculating light paths…';
      science['physics-status'].className=ready?'ready':pstate.status==='error'?'failed':'pending';
      science['physics-count'].textContent=ready?String(rays.length):'—';
      const count=type=>rays.filter(r=>r.outcome===type).length;
      science['physics-outcomes'].textContent=ready?count('captured')+' captured · '+count('escaped')+' escaped · '+(rays.length-count('captured')-count('escaped'))+' unresolved':'Current spin requires a new calculation';
      const show=n=>typeof n==='number'&&Number.isFinite(n)?n.toExponential(2):'—';
      science['physics-null'].textContent=ready?show(d.maxNormalizedNullResidual):'—';
      science['physics-integrals'].textContent=ready?show(d.maxRadialResidual)+' / '+show(d.maxPolarResidual):'—';
      science['physics-runtime'].textContent=ready?(pstate.solverMilliseconds/1000).toFixed(2)+' s':'—';
      science['physics-validity'].textContent=ready?(d.passed?'Numerical constraints within criterion ':'Numerical criterion exceeded: ')+show(d.criterion)+'. '+d.acceptedSteps+' accepted / '+d.rejectedSteps+' rejected steps. Exterior horizon guard: '+d.guard+' M. This checks numerical consistency, not observational validity.':'A changed spin or viewing configuration clears the previous ray calculation.';
      science['physics-validity'].className='numerical-note'+(ready&&!d.passed?' failed':'');
      if(pstate.benchmarks){const b=pstate.benchmarks;science['physics-benchmarks'].textContent='Current outer horizon: '+fmt(b.rPlus,5)+' M. Equatorial photon orbit: '+fmt(b.equatorialPhotonRadii.prograde,5)+' M prograde; '+fmt(b.equatorialPhotonRadii.retrograde,5)+' M retrograde. Schwarzschild critical impact: '+fmt(b.schwarzschild.criticalImpact,5)+' M.';}
      if(Date.now()>physicsEditingUntil&&pstate.settings){science.inclination.value=pstate.settings.inclinationDeg;science['inclination-value'].value=pstate.settings.inclinationDeg+'°';science.accuracy.value=String(pstate.settings.tolerance);science['ray-count'].value=String(pstate.settings.rayCount);}
      if(pstate.status==='error')showError(pstate.error||'The light-path computation failed.');
    }
    // Read-only inspection point for verification and other local clients.
    window.GFMObservatory={getSnapshot:()=>structuredClone(state),getRendererStatus:()=>renderer?.getStatus?.()||({webgl:!!renderer,vertices:renderer?.throat?.mesh.count||0}),getView:()=>viewMode};
  }
  async function post(path,body) {
    const result=await local.request(path,{method:'POST',body});receive(result);return result;
  }
  function enqueue(path,body){posting=posting.catch(()=>{}).then(()=>post(path,body)).catch(error=>{showError(error.message);});return posting;}
  function control(action){clearTimeout(parameterTimer);editingUntil=0;return enqueue('/api/control',{action});}
  ui.play.addEventListener('click',()=>control(state?.running?'pause':'play'));
  ui.step.addEventListener('click',()=>control('step'));ui.reset.addEventListener('click',()=>control('reset'));ui.demo.addEventListener('click',()=>control('demo'));
  function changeParameters(){
    editingUntil=Date.now()+350;
    ui['spin-value'].value=fmt(ui.spin.value,3);ui['cover-value'].value=fmt(ui.cover.value,3);ui['critical-value'].value=fmt(ui.critical.value,3);
    clearTimeout(parameterTimer);parameterTimer=setTimeout(()=>enqueue('/api/parameters',{spin:Number(ui.spin.value),coverLoad:Number(ui.cover.value),alphaCritical:Number(ui.critical.value)}),60);
  }
  [ui.spin,ui.cover,ui.critical].forEach(input=>input.addEventListener('input',changeParameters));
  function changePhysics(){
    physicsEditingUntil=Date.now()+700;science['inclination-value'].value=science.inclination.value+'°';clearTimeout(physicsTimer);
    physicsTimer=setTimeout(()=>{const body={inclinationDeg:Number(science.inclination.value),rayCount:Number(science['ray-count'].value),tolerance:Number(science.accuracy.value)};posting=posting.catch(()=>{}).then(()=>local.request('/api/physics',{method:'POST',body})).catch(error=>showError(error.message));},100);
  }
  science.inclination.addEventListener('input',changePhysics);science.accuracy.addEventListener('change',changePhysics);science['ray-count'].addEventListener('change',changePhysics);
  const tabs=[...document.querySelectorAll('[role=tab]')];
  function selectTab(tab){tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;$('panel-'+t.dataset.panel).hidden=!selected;});drawTimeline();}
  tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{let next;if(e.key==='ArrowRight')next=(index+1)%tabs.length;if(e.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(e.key==='Home')next=0;if(e.key==='End')next=tabs.length-1;if(next!==undefined){e.preventDefault();selectTab(tabs[next]);tabs[next].focus();}});});
  function drawTimeline(){
    const canvas=ui.timeline,w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const c=canvas.getContext('2d');if(!c)return;c.scale(dpr,dpr);c.clearRect(0,0,w,h);c.font='9px Consolas,monospace';
    const pad={l:44,r:35,t:14,b:25},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b,history=state?.history.slice(-240)||[],tEnd=Math.max(12,history.at(-1)?.time||0),tStart=Math.max(0,(history[0]?.time||0)),span=Math.max(1,tEnd-tStart),maxR=Math.max(1,state?.parameters.r0||1),maxL=Math.max(3,...history.map(f=>f.coverLoad));
    c.strokeStyle='#1c3040';c.fillStyle='#5d7e91';c.lineWidth=1;
    for(let i=0;i<4;i++){const y=pad.t+ph*i/3;c.beginPath();c.moveTo(pad.l,y);c.lineTo(w-pad.r,y);c.stroke();c.textAlign='right';c.fillText((maxR*(1-i/3)).toFixed(1),pad.l-10,y+3);c.textAlign='left';c.fillStyle='#8a785b';c.fillText((maxL*(1-i/3)).toFixed(1),w-pad.r+8,y+3);c.fillStyle='#5d7e91';}
    for(let i=0;i<5;i++){const x=pad.l+pw*i/4;c.textAlign='center';c.fillText((tStart+span*i/4).toFixed(1)+'s',x,h-7);}
    function line(key,max,color){if(!history.length)return;c.beginPath();history.forEach((f,i)=>{const x=pad.l+(f.time-tStart)/span*pw,y=pad.t+ph*(1-f[key]/max);i?c.lineTo(x,y):c.moveTo(x,y);});c.strokeStyle=color;c.lineWidth=1.8;c.stroke();const f=history.at(-1),x=pad.l+(f.time-tStart)/span*pw,y=pad.t+ph*(1-f[key]/max);c.beginPath();c.arc(x,y,2.5,0,Math.PI*2);c.fillStyle=color;c.fill();}
    line('apertureRadius',maxR,'#63d8d0');line('coverLoad',maxL,'#efb56d');
  }
  new ResizeObserver(()=>drawTimeline()).observe(ui.timeline);
  function connect(){stream={close:local.subscribe(receive)};}
  local.ready.then(()=>local.request('/api/state')).then(receive).catch(error=>{connection('error','Unavailable');showError(error.message);});
  connect();
  for(const [id,path,type,name]of [['export-json','/api/export.json','application/json','GFM-Aperture-Aggie-recording.json'],['export-csv','/api/export.csv','text/csv','GFM-Aperture-Aggie-history.csv'],[null,'/api/physics-export.json','application/json','GFM-Kerr-geodesics.json']]){
    const link=id?$(id):document.querySelector('.physics-export');link.addEventListener('click',async event=>{event.preventDefault();try{const value=await local.request(path),url=URL.createObjectURL(new Blob([type==='text/csv'?value:JSON.stringify(value,null,2)],{type})),download=document.createElement('a');download.href=url;download.download=name;download.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){showError(error.message);}});
  }
  for(const [selector,path,name]of [['a[href="./api/provenance"]','/api/provenance','GFM-phase-source-provenance.json'],['a[href="./observation-report.json"]','/api/observations','GFM-recomputed-observation-comparison.json']]){
    document.querySelector(selector)?.addEventListener('click',async event=>{event.preventDefault();try{const result=await local.request(path),url=URL.createObjectURL(new Blob([JSON.stringify(result,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(error){showError(error.message);}});
  }
  addEventListener('beforeunload',()=>{stream?.close();if(renderRequest!==null)cancelAnimationFrame(renderRequest);local.close();renderer?.destroy();});
})();
