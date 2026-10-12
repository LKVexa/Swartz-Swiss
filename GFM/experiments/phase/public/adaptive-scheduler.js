(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GFMAdaptiveScheduler=api;})(globalThis,function(){
 'use strict';
 function create({work,active,onFrame=()=>{},onError=()=>{},clock=()=>performance.now(),setTimer=setTimeout,clearTimer=clearTimeout,targetHz=0}={}){
  let timer=null,closed=false,executing=false,ewma=0,steps=0,lastMilliseconds=0,delayMilliseconds=targetHz>0?1000/targetHz:0;
  const started=clock();
  function metrics(){return {policy:targetHz>0?'explicit clock target; one future step':'maximum serial throughput; completion/consumer credit permits one future step',targetHz,simulatedStep:.05,steps,lastMilliseconds,meanWorkMilliseconds:ewma,nextDelayMilliseconds:delayMilliseconds,computeHz:steps*1000/Math.max(1,clock()-started),pendingTimers:timer===null?0:1,executing};}
  function schedule(){if(closed||timer!==null||executing||!active())return;timer=setTimer(tick,delayMilliseconds);if(timer&&typeof timer.unref==='function')timer.unref();}
  function tick(){timer=null;if(closed||!active())return;executing=true;const start=clock();let frame;
   try{frame=work(.05);lastMilliseconds=Math.max(0,clock()-start);ewma=steps?ewma*.8+lastMilliseconds*.2:lastMilliseconds;steps++;delayMilliseconds=targetHz>0?Math.max(0,1000/targetHz-ewma):0;}
   catch(error){onError(error);}
   finally{executing=false;}
   if(frame!==undefined)onFrame(frame,metrics());schedule();
  }
  function sync(){if(!active()&&timer!==null){clearTimer(timer);timer=null;}schedule();}
  function close(){closed=true;if(timer!==null)clearTimer(timer);timer=null;}
  return Object.freeze({sync,close,metrics});
 }
 return Object.freeze({create});
});
