'use strict';
// Build from the installed viewer and the exact-source browser backend.
// No solver equations or calculated field values are rewritten here.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = __dirname;
const RELEASE = require('./release-info.json');
const read = name => fs.readFileSync(path.join(ROOT, name), 'utf8');
const escapeScript = value => value.replace(/<\/script/gi, '<\\/script');
function buildPreview() {
 const document = read('public/index.html');
 const body = document.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1];
 if (!body) throw new Error('The installed viewer has no body.');
 const app = read('public/app.js');
 const backend = read('public/browser-backend.js');
 const diagnostics = read('public/pulse-diagnostics.js');
 const css = read('public/style.css');
 const bootstrap = `window.GFM_LOCAL_BACKEND = new GFMPreviewBackend({running:false,initialPreset:'covered-plasma',initialSeconds:2e-9});
window.GFM_LOCAL_BACKEND.subscribe(event=>{if(event.event!=='initialization-progress')return;const data=event.data||{},host=document.getElementById('gfm-preview-v201')||document,find=id=>host===document?host.getElementById(id):host.querySelector('[id="'+id+'"]'),status=find('connection-status'),notice=find('scene-notice');if(status)status.textContent='Calculating initial fields · '+Math.round(data.percent||0)+'%';if(notice){notice.hidden=false;notice.textContent='Computing pulse history · '+((data.timeSeconds||0)*1e9).toFixed(2)+' / '+((data.targetSeconds||0)*1e9).toFixed(2)+' ns';}});`;
 const content = body.replace(/<script src="\/app.js"><\/script>/, '').replace(/<script src="\/pulse-diagnostics.js"><\/script>/,'')
   .replace(/href="\/"/g, 'href="#gfm-preview-v201"');
 // CSS is scoped to this instance; it cannot restyle the conversation shell.
 function scopeRules(source) {
   let position=0, result='';
   while(position<source.length) {
     const open=source.indexOf('{',position);
     if(open<0){result+=source.slice(position);break;}
     let end=open+1,depth=1;
     while(end<source.length&&depth){if(source[end]==='{')depth++;else if(source[end]==='}')depth--;end++;}
     if(depth)throw new Error('Unclosed viewer CSS rule.');
     const header=source.slice(position,open).trim(),body=source.slice(open+1,end-1);
     if(header.startsWith('@'))result+=header+'{'+scopeRules(body)+'}';
     else result+=header.split(',').map(selector=>{
       const s=selector.trim().replace(/:root/g,'#gfm-preview-v201');
       if(s.startsWith('#gfm-preview-v201'))return s;
       if(s==='body')return '#gfm-preview-v201';
       return '#gfm-preview-v201 '+s;
     }).join(',')+'{'+body+'}';
     position=end;
   }
   return result;
 }
 const scopedCss=scopeRules(css.replace(/\/\*[\s\S]*?\*\//g,''));
 const compact = `
#gfm-preview-v201{width:100%;min-width:0;position:relative;overflow-wrap:anywhere}
#gfm-preview-v201 main{padding:16px 12px;max-width:100%;margin:0}
#gfm-preview-v201 .masthead{padding:16px 12px;flex-wrap:wrap;padding-right:100px}
#gfm-preview-v201 .intro,#gfm-preview-v201 #methods,#gfm-preview-v201 footer{display:none}
#gfm-preview-v201 .project-home{display:none}
#gfm-preview-v201 #save-image,#gfm-preview-v201 #export,#gfm-preview-v201 .reference-panel>a{display:none}
#gfm-preview-v201 .workspace{grid-template-columns:minmax(0,1fr) 280px;gap:12px}
#gfm-preview-v201 .canvas-wrap{height:480px}
#gfm-preview-v201 .instrument-bar{padding:16px 14px}
#gfm-preview-v201 .mode-tabs button{padding:10px 12px}
#gfm-preview-v201 .layer-bar{padding:12px 14px}
#gfm-preview-v201 .plot-strip{gap:14px;padding:14px}
#gfm-preview-v201 .brand small{max-width:260px;white-space:normal}
@media(max-width:760px){#gfm-preview-v201 .workspace{grid-template-columns:1fr}#gfm-preview-v201 .control-panel{display:block}#gfm-preview-v201 .canvas-wrap{height:440px}}
@media(max-width:440px){#gfm-preview-v201 .plot-strip{grid-template-columns:1fr}#gfm-preview-v201 .masthead{padding-right:12px}#gfm-preview-v201 .canvas-wrap{height:400px}#gfm-preview-v201 .top-right{max-width:42%}#gfm-preview-v201 .mode-tabs button{flex:1 1 45%;font-size:11px}}
`;
 const memory = `
(function(){
 const host=document.getElementById('gfm-preview-v201'),find=id=>host.querySelector('#'+id);
 const field=find('field-layer'),vectors=find('vectors'),cutaway=find('cutaway'),shape=find('presentation-shape'),flow=find('show-energy-flow'),plasma=find('absorption-layer'),cover=find('cover-response-layer');
 const layerControls=['show-phase-layer','show-plasma-layer','show-cover-layer'].map(find);
 let restoring=false;
 function restore(state){
  const saved=state?.privateContent;if(!saved)return;restoring=true;
  try{
   if(saved.viewSchemaVersion!==3)return;
   if(Array.from(field.options).some(option=>option.value===saved.layer))field.value=saved.layer;
   if(typeof saved.vectors==='boolean')vectors.checked=saved.vectors;
   if(typeof saved.cutaway==='boolean')cutaway.checked=saved.cutaway;
   for(const control of layerControls)if(typeof saved.visibility?.[control.id]==='boolean')control.checked=saved.visibility[control.id];
   for(const [control,value] of [[shape,saved.shape],[plasma,saved.plasma],[cover,saved.cover]])if(Array.from(control.options).some(option=>option.value===value))control.value=value;
   if(typeof saved.flow==='boolean')flow.checked=saved.flow;
   field.dispatchEvent(new Event('change'));
  }finally{restoring=false;}
 }
 restore(window.openai?.widgetState);
 window.addEventListener('openai:set_globals',event=>restore(event.detail?.globals?.widgetState));
 for(const control of [field,vectors,cutaway,shape,flow,plasma,cover,...layerControls])control.addEventListener('change',()=>{
  if(restoring||typeof window.openai?.setWidgetState!=='function')return;
  const visibility=Object.fromEntries(layerControls.map(control=>[control.id,control.checked]));
  window.openai.setWidgetState({modelContent:{displayedLayer:field.value,visibleLayers:visibility,displayShape:shape.value,energyFlow:flow.checked,plasmaResponse:plasma.value,coverResponse:cover.value},privateContent:{viewSchemaVersion:3,layer:field.value,vectors:vectors.checked,cutaway:cutaway.checked,visibility,shape:shape.value,flow:flow.checked,plasma:plasma.value,cover:cover.value}}).catch(()=>{});
 });
})();
`;
 const fragment = `<div id="gfm-preview-v201">\n<style>\n${scopedCss}\n${compact}</style>\n${content}\n</div>\n<script>\n${escapeScript(backend)}\n${bootstrap}\n${escapeScript(diagnostics)}\n${escapeScript(app)}\n${memory}</script>\n`;
 if (Buffer.byteLength(fragment) >= 1000000) throw new Error('Live preview exceeds the 1 MB limit.');
 // Standalone preview uses the same worker and installed viewer, at full width.
 const standalone = document.replace(/<link rel="stylesheet" href="\/style.css">/, `<style>\n${css}\n</style>`)
   .replace(/href="\/"/g,'href="#workspace"')
   .replace(/href="\/docs\//g,'href="docs/')
   .replace(/href="\/project.html"/g,'href="GFM Project.html"')
   .replace(/<script src="\/pulse-diagnostics.js"><\/script>/,'')
   .replace(/<script src="\/app.js"><\/script>/, `<script>\n${escapeScript(backend)}\n${bootstrap}\n${escapeScript(diagnostics)}\n${escapeScript(app)}\n</script>`);
 fs.mkdirSync(path.join(ROOT, 'preview'), {recursive:true});
 fs.writeFileSync(path.join(ROOT, 'preview/gfm-live-layers.html'), fragment);
 fs.writeFileSync(path.join(ROOT, 'Open GFM Preview.html'), standalone);
 const sha = data => crypto.createHash('sha256').update(data).digest('hex');
 const report = {schema:'GFM-live-preview-build/1',version:RELEASE.version,
   backendTransport:'browser-worker with serial local fallback',networkRequired:false,
   fragment:'preview/gfm-live-layers.html',fragmentBytes:Buffer.byteLength(fragment),fragmentSHA256:sha(fragment),
   standalone:'Open GFM Preview.html',standaloneSHA256:sha(standalone),
   engineSHA256:sha(fs.readFileSync(path.join(ROOT,'backend/cylinder-em.cjs'))),
   initialExample:{preset:'covered-plasma',timeSeconds:2e-9,running:false,display:'combined',presentationShape:'wormhole',visibleLayers:['phase-envelope','plasma-collision-power','cover-ohmic-power','net-energy-flow']},
   note:'Initial example is recalculated in the exact-source worker; no stored animation replaces live evolution.'};
 fs.writeFileSync(path.join(ROOT, 'validation/preview-build.json'), JSON.stringify(report,null,2)+'\n');
 return report;
}
if(require.main===module)console.log(JSON.stringify(buildPreview(),null,2));
module.exports={buildPreview};
