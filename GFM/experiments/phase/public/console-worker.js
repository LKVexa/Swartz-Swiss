'use strict';
importScripts('./console-core.js','./adaptive-scheduler.js');
const core=GFMConsoleCore,simulation=core.simulation.createSimulation();
let observations=null,simulationRunning=false;
const sendState=()=>{const state=simulation.snapshot();simulationRunning=state.running;postMessage({type:'state',state});};
const scheduler=GFMAdaptiveScheduler.create({work:()=>simulation.tick(.1),active:()=>simulationRunning,onError:error=>postMessage({type:'failure',error:error.message}),targetHz:10});
simulation.subscribe(sendState);
addEventListener('message',event=>{
 const {id,path,body}=event.data||{};
 try{
  let result;
  if(path==='/api/state')result=simulation.snapshot();
  else if(path==='/api/parameters')result=simulation.setParameters(body);
  else if(path==='/api/control')result=simulation.control(body.action);
  else if(path==='/api/export.json')result=simulation.exportData();
  else if(path==='/api/export.csv')result=simulation.exportCSV();
  else if(path==='/api/observations')result=observations||(observations=core.observations.buildReport());
  else if(path==='/api/provenance')result={execution:'browser-worker',sourceHashes:core.sourceHashes,numericSourceEdits:false};
  else throw new Error('Unknown local research endpoint.');
  scheduler.sync();postMessage({type:'response',id,ok:true,result});
 }catch(error){postMessage({type:'response',id,ok:false,error:error.message});}
});
postMessage({type:'ready',state:simulation.snapshot(),sourceHashes:core.sourceHashes});
