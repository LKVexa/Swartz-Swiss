(function(root,factory){
  'use strict';
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('./phase-mhd.js'):root.PhaseMHD,node?require('./gfm/engine.js'):root.RusslEngine);
  if(node)module.exports=api;else root.PhaseSession=api;
})(globalThis,function(Core,GFM){
  'use strict';
  function createSession(parameters={}){
    let model=Core.createModel(parameters),running=false,sequence=0,generation=0,error=null;
    const sessionId=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
    function fresh(){generation++;sequence=0;error=null;}
    function snapshot(){
      const state=model.snapshot(),nx=state.grid.nx,ny=state.grid.ny;
      const cells=Array.from({length:9},(_,k)=>Math.floor((Math.floor(k/3)+.5)*ny/3)*nx+Math.floor((k%3+.5)*nx/3));
      const input=cells.map(i=>({re:state.fields.psiRe[i],im:state.fields.psiIm[i]}));
      const transformed=GFM.fourier('gf9',input),reconstructed=GFM.fourier('gf9',transformed,true);
      const gfm={field:'GF(9)',cells,input,transformed,reconstructed,inputSampleEnergy:input.reduce((s,v)=>s+v.re*v.re+v.im*v.im,0),transformSampleEnergy:transformed.reduce((s,v)=>s+v.re*v.re+v.im*v.im,0),inverseResidual:GFM.compare(input,reconstructed),normalization:'none; raw complex sample amplitudes retained',scope:'Nine spatial samples in a finite-field indexed complex basis. This reversible representation does not alter the MHD evolution or validate a physical hypothesis.'};
      return {...state,sequence,runId:sessionId+':'+generation,running,error,gfm};
    }
    function advance(dt=.05){
      try{model.step(dt);sequence++;error=null;}catch(e){running=false;error=e.message;throw e;}
      return snapshot();
    }
    function configure(patch){model.setParameters(patch);fresh();return snapshot();}
    function control(action){
      if(!['play','pause','step','reset'].includes(action))throw new RangeError('Use play, pause, step, or reset.');
      if(action==='reset'){model.reset();fresh();}
      if(action==='play')running=true;
      if(action==='pause')running=false;
      return action==='step'?advance():snapshot();
    }
    return Object.freeze({snapshot,advance,configure,control,get running(){return running;}});
  }
  return Object.freeze({createSession});
});
