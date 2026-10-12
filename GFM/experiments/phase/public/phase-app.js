/* Controller for the same verified phase core on the server or in a local Worker. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id),status=$('phase-live-status');
  const local=window.GFM_PHASE_LOCAL;
  let snapshot=null,queue=Promise.resolve(),stopped=false,pendingRender=null,renderRequest=null,unsubscribe=null;
  const calculationControls=[...document.querySelectorAll('[data-phase-parameter]'),$('phase-play'),$('phase-step'),$('phase-reset')];
  for(const control of calculationControls)control.disabled=true;
  $('phase-export').setAttribute('aria-disabled','true');
  function showError(error){status.textContent='Field calculation stopped: '+error.message;status.dataset.state='error';}
  let view;
  try{view=new PhaseTextureView($('phase-field'));}catch(error){showError(error);return;}
  function receive(frame){
    if(stopped)return;
    pendingRender=frame;
    if(renderRequest!==null)return;
    renderRequest=requestAnimationFrame(()=>{const latest=pendingRender;pendingRender=null;renderRequest=null;const started=performance.now();if(applyFrame(latest))local.recordRender(performance.now()-started);});
  }
  function applyFrame(frame){
    if(frame.schema!=='GFM-Phase-MHD-frame/1')return false;
    try{
      if(view.update(frame).accepted===false)return false;
      snapshot=frame;for(const control of calculationControls)control.disabled=false;
      $('phase-export').setAttribute('aria-disabled','false');
      const performanceData=local.getPerformance();
      status.textContent='Local compute engine · '+(frame.running?'evolving':'paused')+' · '+performanceData.renderFPS.toFixed(1)+' view fps · '+performanceData.solverHz.toFixed(1)+' steps/s · '+(frame.scheduler?.meanWorkMilliseconds||0).toFixed(1)+' ms/step';
      status.dataset.state=frame.error?'error':'ready';if(frame.error)status.textContent+=' · '+frame.error;
      $('phase-play').textContent=frame.running?'Pause fields':'Play fields';
      for(const input of document.querySelectorAll('[data-phase-parameter]')){
        const value=frame.parameters?.[input.dataset.phaseParameter];
        if(Number.isFinite(value)&&document.activeElement!==input){input.value=value;input.nextElementSibling.textContent=String(value);}
      }
      const transformed=frame.gfm;
      $('phase-transform').textContent=transformed?'GF(9) · inverse residual '+Number(transformed.inverseResidual??0).toExponential(2)+' · nine actual complex field samples':'Waiting for GFM samples';
      return true;
    }catch(error){showError(error);return false;}
  }
  async function command(type,payload={}){
    const url=type==='parameters'?'/api/phase/parameters':'/api/phase/control';
    const frame=await local.request(url,{method:'POST',body:type==='parameters'?payload.parameters:{action:payload.action}});receive(frame);return frame;
  }
  function action(type,payload){
    queue=queue.then(()=>command(type,payload)).catch(showError);return queue;
  }
  async function start(){
    try{
      await local.ready;unsubscribe=local.subscribePhase(receive);receive(await local.request('/api/phase'));
    }catch(error){showError(error);}
  }
  $('phase-play').addEventListener('click',()=>action('control',{action:snapshot?.running?'pause':'play'}));
  $('phase-step').addEventListener('click',()=>action('control',{action:'step'}));
  $('phase-reset').addEventListener('click',()=>action('control',{action:'reset'}));
  for(const input of document.querySelectorAll('[data-phase-parameter]')){
    input.addEventListener('input',()=>{input.nextElementSibling.textContent=input.value;});
    input.addEventListener('change',()=>action('parameters',{parameters:{[input.dataset.phaseParameter]:Number(input.value)}}));
  }
  $('phase-export').addEventListener('click',async event=>{
    event.preventDefault();
    if(!snapshot)return;
    try{
      const frame=await local.request('/api/phase');
      PhaseTextureView.validateSnapshot(frame);
      const sourceFilesFetchedSha256={};
      for(const name of ['./phase-mhd.js','./phase-session.js','./phase-worker.js','./adaptive-scheduler.js','./gfm/engine.js']){
        const res=await fetch(name,{cache:'no-store'});if(!res.ok)throw new Error('Could not identify exported sources.');
        const digest=await crypto.subtle.digest('SHA-256',await res.arrayBuffer());sourceFilesFetchedSha256[name]=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      }
      const blob=new Blob([JSON.stringify({schema:'GFM-phase-export/1',createdUtc:new Date().toISOString(),execution:'browser-worker',frame,performance:local.getPerformance(),sourceFilesFetchedSha256,identityScope:'Fetched source hashes identify bundled served bytes. Root manifest and build receipts identify included worker source; this hash retrieval alone does not measure browser-loaded bytes.'},null,2)],{type:'application/json'});
      const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='GFM-phase-fields.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
    }catch(error){showError(error);}
  });
  async function observations(){
    try{
      const report=await local.request('/api/observations');
      $('observation-result').textContent=report.comparisonPassed?'Reference comparison passed':'Held-out comparison failed';
      $('observation-counts').textContent=report.data.trainingRows+' training measurements (2011–12) · '+report.data.holdoutRows+' untouched measurements (2013) · '+report.data.excludedRows+' short-baseline rows retained in the data archive';
      const table=$('observation-rows');
      for(const model of report.models){
        const row=document.createElement('tr');
        for(const value of [model.fit.model,model.fit.scaleMicroas.toFixed(1)+' μas',model.fit.fluxJy.toFixed(4)+' Jy',model.training.normalizedResidualRms.toFixed(2)+' σ',model.holdout.normalizedResidualRms.toFixed(2)+' σ',(100*model.holdout.fractionWithin3Sigma).toFixed(1)+'%']){const cell=document.createElement('td');cell.textContent=value;row.appendChild(cell);}
        table.appendChild(row);
      }
      const canvas=$('observation-chart'),ctx=canvas.getContext('2d'),w=canvas.width=900,h=canvas.height=310;
      ctx.fillStyle='#09131d';ctx.fillRect(0,0,w,h);const rows=report.models[0].holdout.predictions;
      const maxX=Math.max(...rows.map(r=>r.baselineWavelengths/1e9))*1.1,maxY=Math.max(...rows.map(r=>r.amplitudeJy+r.sigmaJy))*1.15;
      const X=x=>65+x/maxX*(w-90),Y=y=>h-45-y/maxY*(h-75);
      ctx.strokeStyle='#274251';ctx.beginPath();ctx.moveTo(65,25);ctx.lineTo(65,h-45);ctx.lineTo(w-25,h-45);ctx.stroke();
      ctx.font='12px sans-serif';ctx.fillStyle='#91acbc';ctx.fillText('2013 held-out amplitudes · Jy',65,17);ctx.fillText('Projected baseline · Gλ',w-240,h-12);
      for(let i=0;i<=4;i++){ctx.fillText((maxY*i/4).toFixed(2),10,Y(maxY*i/4)+4);ctx.fillText((maxX*i/4).toFixed(1),X(maxX*i/4)-8,h-26);}
      for(const r of rows){const x=X(r.baselineWavelengths/1e9);ctx.strokeStyle='#6ecac1';ctx.beginPath();ctx.moveTo(x,Y(r.amplitudeJy-r.sigmaJy));ctx.lineTo(x,Y(r.amplitudeJy+r.sigmaJy));ctx.stroke();ctx.fillStyle='#7fe4d6';ctx.beginPath();ctx.arc(x,Y(r.amplitudeJy),2.5,0,2*Math.PI);ctx.fill();ctx.fillStyle='#f2af64';ctx.fillRect(x-2,Y(r.predictedJy)-2,4,4);}
      $('observation-scope').textContent='Cyan: published amplitudes and RMS bars. Amber: frozen thin-ring predictions. These stationary geometric models miss the held-out data. Calibration covariance, source variability, full radiative transfer and GRMHD are absent. This test does not validate the phase, material or aperture/aggie hypotheses.';
    }catch(error){$('observation-result').textContent=error.message;}
  }
  window.GFMPhaseView={getSnapshot:()=>snapshot?structuredClone(snapshot):null,getStatus:()=>view.getStatus(),getPerformance:local.getPerformance};
  addEventListener('pagehide',()=>{stopped=true;unsubscribe?.();if(renderRequest!==null)cancelAnimationFrame(renderRequest);view.destroy();});
  start();observations();
})();
