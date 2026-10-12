'use strict';
// The same session and numerical core execute in a browser Worker or Node worker.
const isNode=typeof process==='object'&&process.versions?.node;
let send,listen,Session,software;
if(isNode){
  const {parentPort}=require('node:worker_threads'),fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
  Session=require('../backend/phase-session.js');
  software=Object.fromEntries(['backend/phase-mhd.js','backend/phase-session.js','public/phase-worker.js','public/adaptive-scheduler.js','backend/gfm/engine.js'].map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',file))).digest('hex')]));
  send=value=>parentPort.postMessage(value);listen=handler=>parentPort.on('message',handler);
}else{
  importScripts('./phase-mhd.js','./gfm/engine.js','./phase-session.js','./adaptive-scheduler.js');
  Session=globalThis.PhaseSession;send=value=>postMessage(value);listen=handler=>addEventListener('message',event=>handler(event.data));
  software={execution:'Browser Worker; source hashes are computed by the application at export'};
}
const session=Session.createSession();
const Scheduler=isNode?require('./adaptive-scheduler.js'):globalThis.GFMAdaptiveScheduler;
let scheduler,outstandingStream=null,nextStreamId=0,latestCompleted=null,suppressedFrames=0;
const describe=snapshot=>({...snapshot,engine:isNode?'server-worker':'browser-worker',software,scheduler:{...scheduler?.metrics(),outstandingFrames:outstandingStream===null?0:1,pendingLatestFrames:latestCompleted===null?0:1,suppressedFrames,streamBackpressure:'maximum serial calculation; one outstanding frame and one replaceable latest completed snapshot'}});
const frame=()=>describe(session.snapshot());
function publishLatest(){
  if(outstandingStream!==null||latestCompleted===null)return;
  const snapshot=latestCompleted;latestCompleted=null;outstandingStream=++nextStreamId;
  send({type:'frame',streamId:outstandingStream,frame:describe(snapshot)});
}
listen(message=>{
  const {id,type}=message||{};
  if(type==='ack'){
    if(outstandingStream!==null&&message.streamId===outstandingStream){outstandingStream=null;publishLatest();scheduler.sync();}
    return;
  }
  try{
    if(type==='parameters'){session.configure(message.parameters);latestCompleted=null;}
    else if(type==='control'){session.control(message.action);latestCompleted=null;}
    else if(!['snapshot','init','export'].includes(type))throw new Error('Unknown phase-worker command.');
    scheduler.sync();send({type:'response',id,frame:frame()});
  }catch(e){send({type:'response',id,error:e.message,frame:frame()});}
});
scheduler=Scheduler.create({work:dt=>session.advance(dt),active:()=>session.running,onFrame:snapshot=>{if(latestCompleted!==null)suppressedFrames++;latestCompleted=snapshot;publishLatest();},onError:error=>{latestCompleted=null;send({type:'failure',error:error.message,frame:frame()});}});
send({type:'ready',frame:frame()});
