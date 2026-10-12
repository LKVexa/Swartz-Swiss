'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const E=require('./src/engine.js'),B=require('./src/gfm-models.js');
const stable=v=>v===null||typeof v!=='object'?JSON.stringify(v):Array.isArray(v)?'['+v.map(stable).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
const digest=v=>crypto.createHash('sha256').update(stable(v)).digest('hex');
const timestamp='2026-10-11T18:00:00.000Z';
function build(){
  const registry=JSON.parse(fs.readFileSync(path.join(__dirname,'equation-audit.json'),'utf8'));
  const images=JSON.parse(fs.readFileSync(path.join(__dirname,'image-equations.json'),'utf8'));
  for(const entry of images.entries){const bytes=fs.readFileSync(path.join(__dirname,entry.source.path));if(bytes.length!==entry.source.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==entry.source.sha256)throw Error('Image source changed: '+entry.id);}
  const result=B.all(registry);if(!result.passed)throw Error('GFM checks failed.');
  result.preparedAt=timestamp;result.imageSources=images.entries.map(e=>({id:e.id,source:e.source,references:e.references}));
  result.linkedPost={url:'https://x.com/TheMathFlow/status/2109220659838787921',retrieval:'Unavailable during preparation; no post text inferred. Supplied images are the source.'};
  result.coverage={storedFindings:registry.entries.length,imageFamilies:images.entries.length,parsedImageStatements:images.entries.reduce((n,e)=>n+e.parsedEquations.length,0),outcomes:result.entries.reduce((x,e)=>(x[e.outcome]=(x[e.outcome]||0)+1,x),{}),original500EquationSuite:'not supplied',GF80:'Separate retained exact word-mechanics backend; no 2^80 amplitude vector allocated.'};
  function snap(field,vector,description,operations,preparation){return {model:{schema:'RUSSL-finite-field-model/1',field:E.fields[field],labelEncoding:'integer = sum(c_i * p^i), polynomial coefficients low first',amplitudes:'complex floating point',fourierSign:'+2pi i',normalization:'1/sqrt(q)',character:'exp(2pi i Tr(x)/p)',tolerance:E.tolerance,backend:'local browser JavaScript',physicalScope:'finite-dimensional complex-amplitude simulation'},state:vector,description,operations,normSquared:E.norm(vector)**2,...(preparation?{preparation}:{} )};}
  const final=snap('gf9',result.finalState.vector,result.finalState.description,3,result.finalState.preparation);
  const descriptions=[['gf9',result.images.pendulum,'GFM restoring acceleration signal'],['gf3',result.images.rotation,'Reapplied real Rx(232.75 degrees)'],['gf9',result.images.zetaGamma,'GFM Mellin kernel at s=2']];
  const records=descriptions.map(([field,r,label],i)=>{const data={schema:'RUSSL-research-record/1',kind:'gf-state',label,capturedAt:timestamp,payload:{snapshot:snap(field,r.preparedState,label,1,r.preparation),verification:E.audit(E.field(field),r.preparedState),sourceFamily:r.family}};const sha256=digest(data);return {id:'rec-gfm-'+(i+1)+'-'+sha256.slice(0,8),sha256,data};});
  const data={schema:'RUSSL-virtual-session/1',version:'0.3.0',kind:'session',exportedAt:timestamp,snapshot:final,records,commandProvenance:['model.reapply all'],returns:[{id:'ret-gfm-reapplication',command:'model.reapply all',ok:true,summary:'20 stored findings and 3 image families reviewed; declared adapters reapplied. GF9 signal model prepared.',profile:'GFM / declared adapters',elapsedMs:0,details:result}]};
  return {result,packet:{sha256:digest(data),data}};
}
if(require.main===module){const {result,packet}=build();fs.writeFileSync(path.join(__dirname,'gfm-reapplication.json'),JSON.stringify(result,null,2)+'\n');fs.writeFileSync(path.join(__dirname,'examples/GFM-Reapplied-session.json'),JSON.stringify(packet,null,2)+'\n');console.log('Built verified GFM reapplication manifest and reloadable 0.3 session.');}
module.exports={build,stable,digest};
