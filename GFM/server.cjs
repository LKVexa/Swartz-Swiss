'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createModel}=require('./backend/cylinder-em.cjs');
const RELEASE=require('./release-info.json');
const GR=require('./backend/gr-reference.cjs');
const {RESEARCH_PRESETS,presetParameters}=require('./backend/research-presets.cjs');
const ROOT=__dirname, PUBLIC=path.join(ROOT,'public');
const MAX_BODY=24*1024;
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const SOURCE_SHA=sha(fs.readFileSync(path.join(ROOT,'backend/cylinder-em.cjs')));
const phaseReference=JSON.parse(fs.readFileSync(path.join(ROOT,'data/phase-reference.json'),'utf8'));
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
 '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.pdf':'application/pdf'};

function createServer(options={}) {
 let model=createModel(options.parameters??presetParameters('plasma-pulse')),running=options.running===true,runId=crypto.randomUUID(),failure=null;
 const advanceSeconds=options.advanceSeconds||4e-11;
 let history=[],lastFrame=null,timer=null,closed=false;
 function record() {
   lastFrame={schema:'GFM-cylindrical-frame/2',...model.snapshot()};
   const item={time:lastFrame.time||lastFrame.timeSeconds||0,...lastFrame.diagnostics};
   history.push(item);if(history.length>240)history.shift();
   return lastFrame;
 }
 record();
 function envelope() {return {...lastFrame,running,runId,server:{...RELEASE,
   engineSHA256:SOURCE_SHA,advanceSeconds,failure},history};}
 function advance(dt=advanceSeconds) {
   try {model.step(dt);failure=null;record();}
   catch(error){setRunning(false);failure=error.message;throw error;}
 }
 function schedule() {
   if(closed||!running||timer!==null)return;
   // Wait after each completed calculation. A slow solver must leave an idle
   // interval for HTTP controls instead of accumulating overdue timer work.
   timer=setTimeout(()=>{
     timer=null;
     if(closed||!running)return;
     try{advance();}catch{}
     schedule();
   },60);
   timer.unref();
 }
 function setRunning(value) {
   running=value&&!closed;
   if(!running&&timer!==null){clearTimeout(timer);timer=null;}
   if(running)schedule();
 }
 function json(res,status,value) {
   const data=JSON.stringify(value);res.writeHead(status,{'Content-Type':MIME['.json'],'Cache-Control':'no-store',
     'X-Content-Type-Options':'nosniff','Content-Length':Buffer.byteLength(data)});res.end(data);
 }
 async function body(req) {
   let bytes=0,chunks=[];
   for await(const chunk of req){bytes+=chunk.length;if(bytes>MAX_BODY){const e=new Error('Request is too large');e.status=413;throw e;}chunks.push(chunk);}
   try{return JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{const e=new Error('Request must contain valid JSON');e.status=400;throw e;}
 }
 function parameterObject(value) {
   if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Parameters must be an object');
   return value;
 }
 function reset(parameters) {
   // Construct first. A rejected change must leave the working simulation intact.
   const next=createModel(parameters||lastFrame.parameters||{});
   model=next;runId=crypto.randomUUID();history=[];failure=null;record();
 }
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://127.0.0.1');
   const requestHost=new URL('http://'+req.headers.host).hostname;
   if(requestHost!=='127.0.0.1'&&requestHost!=='localhost')return json(res,403,{error:'Local host required'});
   const origin=req.headers.origin;
   if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)
     return json(res,403,{error:'This local simulation accepts its own browser origin only.'});
   if(req.method==='GET'&&url.pathname==='/api/health')return json(res,200,{...RELEASE,engineSHA256:SOURCE_SHA,schema:lastFrame.schema,runId});
   if(req.method==='GET'&&url.pathname==='/api/state')return json(res,200,envelope());
   if(req.method==='GET'&&url.pathname==='/api/audit')return json(res,200,GR.getAuditFindings());
   if(req.method==='GET'&&url.pathname==='/api/gr-reference')return json(res,200,GR.referenceExample());
   if(req.method==='GET'&&url.pathname==='/api/presets')return json(res,200,{schema:'GFM-research-presets/2',items:Object.entries(RESEARCH_PRESETS).map(([id,item])=>({id,...item,parameters:presetParameters(id)}))});
   if(req.method==='POST'&&url.pathname==='/api/gr-reference') {
     const data=await body(req);
     if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Reference request must be an object');
     const names=['morrisThorne','misnerSharpDoubleNull','classifyFutureOuter','thinShell','thinShellPotential','kerrReference'];
     if(!names.includes(data.calculator))throw new Error('Unknown reference calculator');
     const result=GR[data.calculator](parameterObject(data.parameters));
     return json(res,200,{schema:'GFM-spacetime-reference-result/2',calculator:data.calculator,result,scope:'Reference calculation; it does not modify the local Maxwell/plasma solution.'});
   }
   if(req.method==='GET'&&url.pathname==='/api/phase-reference')return json(res,200,phaseReference);
   if(req.method==='GET'&&url.pathname==='/api/export') {
     res.setHeader('Content-Disposition','attachment; filename="GFM-cylindrical-computed-frame.json"');
     return json(res,200,{schema:'GFM-cylindrical-export/2',generatedAt:new Date().toISOString(),release:RELEASE,frame:{...envelope(),staggered:model.snapshot({includeStaggered:true}).staggered},sourceSHA256:SOURCE_SHA});
   }
   if(req.method==='POST'&&url.pathname==='/api/control') {
     const data=await body(req);
     // Validate the whole request before changing any working model or controls.
     if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Controls must be an object');
     for(const key of Object.keys(data))if(!['action','running','stepSeconds','parameters','preset'].includes(key))throw new Error('Unknown control: '+key);
     if(data.running!==undefined&&typeof data.running!=='boolean')throw new Error('Running must be true or false');
     if(data.stepSeconds!==undefined&&(typeof data.stepSeconds!=='number'||!Number.isFinite(data.stepSeconds)||data.stepSeconds<=0||data.stepSeconds>2e-10))throw new Error('Step must be positive and no more than 0.2 ns');
     if(data.action!==undefined&&!['play','pause','step','reset'].includes(data.action))throw new Error('Unknown control action');
     if(data.preset!==undefined&&(typeof data.preset!=='string'||!Object.hasOwn(RESEARCH_PRESETS,data.preset)))throw new Error('Unknown research preset');
     if(data.preset!==undefined&&data.parameters!==undefined)throw new Error('Choose a preset or individual parameter changes in one request');
     if(data.preset!==undefined)reset(presetParameters(data.preset));
     if(data.parameters!==undefined)reset({...lastFrame.parameters,...parameterObject(data.parameters)});
     if(data.running!==undefined)setRunning(data.running);
     if(data.stepSeconds!==undefined){
       setRunning(false);advance(data.stepSeconds);
     }
     if(data.action==='play')setRunning(true);
     else if(data.action==='pause')setRunning(false);
     else if(data.action==='step'){setRunning(false);advance();}
     else if(data.action==='reset'&&data.parameters===undefined)reset(lastFrame.parameters);
     return json(res,200,envelope());
   }
   if(req.method==='POST'&&url.pathname==='/api/reset') {
     const data=await body(req);
     if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Reset requires an object');
     for(const key of Object.keys(data))if(key!=='parameters')throw new Error('Unknown reset control: '+key);
     reset(data.parameters!==undefined?{...lastFrame.parameters,...parameterObject(data.parameters)}:lastFrame.parameters);return json(res,200,envelope());
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Unsupported request method'});
   let base=PUBLIC,relative=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname).replace(/^\/+/, '');
   if(relative.startsWith('assets/')){base=path.join(ROOT,'assets');relative=relative.slice(7);}
   if(relative.startsWith('docs/')){base=path.join(ROOT,'docs');relative=relative.slice(5);}
   if(relative.startsWith('project-references/')){base=path.join(ROOT,'project-references');relative=relative.slice(19);}
   if(relative==='validation/pulse-wormhole-release.json'){base=path.join(ROOT,'validation');relative='pulse-wormhole-release.json';}
   const target=path.resolve(base,relative);
   if(target!==base&&!target.startsWith(base+path.sep))return json(res,403,{error:'Invalid file path'});
   const stat=await fs.promises.stat(target).catch(()=>null);
   if(!stat||!stat.isFile())return json(res,404,{error:'Not found'});
   res.writeHead(200,{'Content-Type':MIME[path.extname(target)]||'application/octet-stream','Content-Length':stat.size,
     'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
   if(req.method==='HEAD')return res.end();
   fs.createReadStream(target).pipe(res);
  }catch(error){json(res,error.status||400,{error:error.message});}
 });
 server.on('close',()=>{closed=true;setRunning(false);});
 server.simulation={advance,envelope,reset,pause(){setRunning(false);},play(){setRunning(true);}};
 schedule();
 return server;
}
if(require.main===module){
 const port=Number(process.env.PORT||8794);
 if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid local port');
 const server=createServer({running:true});
 server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already occupied. Set PORT to a different local port.`:error.message);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log(`${RELEASE.product} v${RELEASE.version}\nhttp://127.0.0.1:${port}/\nAudited local pulse/plasma/material experiment; spacetime references are separate.\nLeave this process running to keep the live fields available.`));
 const stop=()=>server.close(()=>process.exit(0));process.on('SIGINT',stop);process.on('SIGTERM',stop);
}
module.exports={createServer};
