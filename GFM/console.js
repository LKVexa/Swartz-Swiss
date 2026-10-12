'use strict';
(() => {
 const byId=id=>document.getElementById(id), surface=byId('instrument');
 const phaseURL='experiments/phase/public/index.html';
 const instruments={
  pulse:{family:'pulse',url:'Open GFM Preview.html',scope:'Axisymmetric Maxwell–Drude pulse laboratory · calculated phase, plasma current and stationary cover heating · synthetic local coefficients.'},
  phase:{family:'phase',url:phaseURL,scope:'Periodic 2D nonrelativistic MHD + neutral complex order parameter · separate iron enthalpy laboratory · GF(9) representation.'},
  aperture:{family:'phase',url:phaseURL,scope:'Two-branch aperture/aggie hypothesis · spin and cover rules are postulates · identical exterior data cannot identify hidden branches.'},
  kerr:{family:'phase',url:phaseURL,scope:'Computed neutral Kerr light paths · separate published EHT amplitude comparison · these references do not validate the local plasma or passage rules.'},
  equations:{family:'pulse',url:'Open GFM Preview.html',scope:'Audited equations, corrected GR calculators and explicit source dispositions · reference calculations remain separate from pulse dynamics.'},
  terminal:{family:'terminal',url:'experiments/phase/vendor/terminal/index.html',scope:'Original live Galois Field Mechanics terminal · reversible finite-field transforms, stored equations and source dispositions.'}
 };
 let active='pulse', family=null, generation=0, loadPending=false;
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function view(){try{return surface.contentWindow;}catch{return null;}}
 function ready(win,which){if(which==='pulse')return Boolean(win?.GFM_LOCAL_BACKEND&&win.document.getElementById('scene'));if(which==='terminal')return Boolean(win?.RusslEngine&&win.document.getElementById('engine-status')?.dataset.state==='ready');return Boolean(win?.GFM_PHASE_LOCAL&&win.document.getElementById('phase-field'));}
 async function arrange(key,stamp){
  const which=instruments[key].family;
  for(let n=0;n<600;n++){
   if(stamp!==generation)return;
   const win=view();
   if(ready(win,which)){
    if(which==='pulse')await win.GFM_LOCAL_BACKEND.ready;
    if(which==='phase')await win.GFM_PHASE_LOCAL.ready;
    if(stamp!==generation)return;
    const doc=win.document;
    if(key==='equations')doc.getElementById('mode-audit')?.click();
    else if(key==='pulse'){doc.getElementById('mode-em')?.click();doc.getElementById('scene')?.scrollIntoView({block:'center',behavior:'instant'});}
    else if(key==='phase')doc.getElementById('phase-lab')?.scrollIntoView({block:'start',behavior:'instant'});
    else if(key==='terminal'){const style=doc.createElement('style');style.textContent='.gfm-bottom{grid-template-columns:minmax(0,1.2fr) minmax(0,1fr)}.gfm-applicability-row{grid-template-columns:minmax(65px,.35fr) minmax(150px,1fr) minmax(180px,1.5fr);align-items:start;gap:16px}.gfm-applicability-row>*{min-width:0;overflow-wrap:anywhere;white-space:normal}@media(max-width:1000px){.gfm-bottom{grid-template-columns:1fr}}@media(max-width:600px){.gfm-applicability-row{grid-template-columns:70px minmax(0,1fr)}.gfm-applicability-row>:last-child{grid-column:1/-1}}';doc.head.append(style);}
    else {doc.getElementById(key==='aperture'?'view-hypothesis':'view-physics')?.click();doc.getElementById('stage')?.scrollIntoView({block:'center',behavior:'instant'});}
    loadPending=false;byId('instrument-status').textContent='LOCAL COMPUTE / READY';
    return;
   }
   await delay(100);
  }
  if(stamp===generation){loadPending=false;byId('instrument-status').textContent='INITIALIZATION FAILED';byId('load-error').hidden=false;byId('load-error').textContent='The selected instrument did not initialize. Reopen it using the instrument bar. The original packages and calculation evidence are preserved.';}
 }
 function navigate(key){
  if(!instruments[key])throw new Error('Unknown instrument');
  active=key;const item=instruments[key];generation++;const stamp=generation;loadPending=true;
  byId('load-error').hidden=true;byId('instrument-scope').textContent=item.scope;byId('instrument-status').textContent='LOCAL COMPUTE / STARTING';
  for(const button of document.querySelectorAll('[data-instrument]'))button.setAttribute('aria-pressed',String(button.dataset.instrument===key));
  location.hash=key;
  if(family!==item.family){family=item.family;surface.src=item.url;}
  arrange(key,stamp).catch(error=>{if(stamp!==generation)return;loadPending=false;byId('instrument-status').textContent='CALCULATION ERROR';byId('load-error').hidden=false;byId('load-error').textContent=error.message;});
 }
 for(const button of document.querySelectorAll('[data-instrument]'))button.addEventListener('click',()=>navigate(button.dataset.instrument));
 const api={navigate,getActiveWindow:view,get activeInstrument(){return active;},get activeFamily(){return family;},get initializing(){return loadPending;},instruments};
 window.GFM_CONSOLE=Object.freeze(api);
 setInterval(()=>{
  const win=view(),perf=win?.GFM_PERFORMANCE||win?.GFM_PHASE_PERFORMANCE;
  const playing=family==='pulse'?Boolean(win?.GFM_LOCAL_BACKEND?.lastFrame?.running):family==='phase'?Boolean(win?.GFM_PHASE_LOCAL?.phaseSnapshot()?.running||win?.GFM_PHASE_LOCAL?.snapshot()?.running):false;
  if(!loadPending)byId('instrument-status').textContent=playing?'LOCAL COMPUTE / RUNNING':'LOCAL COMPUTE / PAUSED · READY';
  const fps=Number(perf?.renderFPS??perf?.render?.framesPerSecond),hz=Number(perf?.frameHz??perf?.solverHz??(perf?.physics?.meanAdvanceWallMs>0?1000/perf.physics.meanAdvanceWallMs:NaN));
  const parts=[];
  if(Number.isFinite(fps)&&fps>0)parts.push(fps.toFixed(1)+' draw/s');
  if(Number.isFinite(hz)&&hz>0)parts.push(hz.toFixed(1)+(perf?.physics?' advances/s compute':' field frames/s'));
  byId('performance-status').textContent=parts.length?(playing?'':'Last active: ')+parts.join(' · '):'Worker calculation · display paced';
 },1000);
 navigate(instruments[location.hash.slice(1)]?location.hash.slice(1):'pulse');
})();
