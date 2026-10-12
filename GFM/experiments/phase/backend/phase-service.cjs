'use strict';
const {Worker}=require('node:worker_threads');
const path=require('node:path');
function createPhaseService({enabled=true,onUpdate=()=>{}}={}){
  if(!enabled)return {snapshot:()=>({status:'disabled'}),command:async()=>{throw new Error('Phase engine disabled.');},close:async()=>{}};
  let state={status:'starting'},closed=false,nextId=0;
  const pending=new Map(),worker=new Worker(path.join(__dirname,'../public/phase-worker.js'));
  function failure(error){state={...state,running:false,status:'failed',error:error.message};for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(error);}pending.clear();onUpdate(state);}
  worker.on('message',message=>{
    if(message.frame){state=message.frame;onUpdate(state);}
    if(message.type==='frame')worker.postMessage({type:'ack',streamId:message.streamId});
    if(message.type==='response'){
      const entry=pending.get(message.id);if(!entry)return;
      clearTimeout(entry.timer);pending.delete(message.id);
      if(message.error)entry.reject(new Error(message.error));else entry.resolve(state);
    }
  });
  worker.on('error',failure);worker.on('exit',code=>{if(!closed)failure(new Error('Phase worker exited ('+code+').'));});
  function command(type,payload={}){
    if(closed)return Promise.reject(new Error('Phase engine closed.'));
    if(pending.size>=16)return Promise.reject(new Error('Phase command queue is full.'));
    return new Promise((resolve,reject)=>{
      const id=++nextId,timer=setTimeout(()=>{pending.delete(id);reject(new Error('Phase command timed out.'));},10000);
      pending.set(id,{resolve,reject,timer});worker.postMessage({type,id,...payload});
    });
  }
  return {snapshot:()=>structuredClone(state),command,close:async()=>{closed=true;for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(new Error('Phase engine closed.'));}pending.clear();await worker.terminate();}};
}
module.exports={createPhaseService};
