'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createServer } = require('../server.cjs');
const ROOT = path.resolve(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT,'public/index.html'),'utf8');

class Element {
  constructor(id,tag,attributes={}) {this.id=id;this.tagName=tag.toUpperCase();this.attributes=attributes;this.value=attributes.value||'';this.textContent='';this.hidden=Object.hasOwn(attributes,'hidden');this.disabled=Object.hasOwn(attributes,'disabled');this.dataset={};this.style={};this.listeners={};this.children=[];this.clientWidth=800;this.clientHeight=130;for(const [k,v]of Object.entries(attributes))if(k.startsWith('data-'))this.dataset[k.slice(5)]=v;}
  addEventListener(name,callback){(this.listeners[name] ||= []).push(callback);}
  emit(name,event={}){for(const callback of this.listeners[name]||[])callback({target:this,preventDefault(){},...event});}
  setAttribute(k,v){this.attributes[k]=v;}
  appendChild(node){this.children.push(node);}
  replaceChildren(...nodes){this.children=nodes;}
  focus(){this.focused=true;}
  getContext(){return new Proxy({},{get:()=>()=>{}});}
}
function elementsFromHTML(){const elements=new Map();for(const m of HTML.matchAll(/<([a-z][\w-]*)\b([^>]*\bid="([^"]+)"[^>]*)>/gi)){const attributes={};for(const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g))attributes[a[1]]=a[2]||'';assert.ok(!elements.has(m[3]),'duplicate id');elements.set(m[3],new Element(m[3],m[1],attributes));}return elements;}
async function waitFor(check,label){const deadline=Date.now()+3000;while(Date.now()<deadline){if(check())return;await new Promise(r=>setTimeout(r,15));}throw new Error('Timed out: '+label);}
async function fixture(options={}){
  const server=createServer({autoTick:false,...options});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
  const elements=elementsFromHTML(),sources=[],errors=[];
  class EventSource {
    constructor(url){this.listeners={};this.abort=new AbortController();sources.push(this);this.consume(url).catch(error=>{if(error.name!=='AbortError'){errors.push(error);this.emit('error',{});}});}
    addEventListener(name,callback){(this.listeners[name] ||= []).push(callback);}
    emit(name,event){for(const f of this.listeners[name]||[])f(event);}
    async consume(url){const response=await fetch(origin+url,{signal:this.abort.signal});assert.equal(response.status,200);const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';while(true){const result=await reader.read();if(result.done)break;buffer+=decoder.decode(result.value,{stream:true});let end;while((end=buffer.indexOf('\n\n'))>=0){const block=buffer.slice(0,end);buffer=buffer.slice(end+2);const event=/^event: (.+)$/m.exec(block)?.[1]||'message',data=/^data: (.+)$/m.exec(block)?.[1];if(data)this.emit(event,{data});}}}
    close(){this.abort.abort();}
  }
  const context={document:{getElementById:id=>elements.get(id)||null,createElement:tag=>new Element('',tag),querySelectorAll:selector=>selector==='[role=tab]'?[...elements.values()].filter(x=>x.attributes.role==='tab'):[]},EventSource,fetch:(url,options)=>fetch(origin+url,options),ApertureRenderer:class{constructor(){this.throat={mesh:{count:9408}};}update(value){this.state=value;}reset(){this.resetCalled=true;}},ResizeObserver:class{constructor(callback){this.callback=callback;}observe(){this.callback();}},devicePixelRatio:1,structuredClone,setTimeout,clearTimeout,console,addEventListener(){}};
  context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(ROOT,'public/app.js'),'utf8'),context,{filename:'public/app.js'});
  await waitFor(()=>context.GFMObservatory,'initial API and event data');
  return {server,origin,elements,context,errors,async close(){sources.forEach(s=>s.close());await server.closeSimulation();}};
}

test('isolated DOM client receives real HTTP/SSE calculations, controls spin/cover, and displays raw GFM rows',async()=>{
  const h=await fixture();try{
    assert.equal(h.elements.get('connection').textContent,'Connected');assert.equal(h.elements.get('controls').disabled,false);
    assert.equal(h.elements.get('gas-radius').textContent,'0.589072');assert.equal(h.elements.get('gas-passage').textContent,1);assert.equal(h.elements.get('aggie-passage').textContent,0);
    assert.equal(h.elements.get('gfm-rows').children.length,9);assert.equal(h.elements.get('checks').textContent,'PASS');
    h.elements.get('cover').value='0';h.elements.get('cover').emit('input');await waitFor(()=>h.server.simulation.snapshot().parameters.coverLoad===0,'cover input reaches backend');await waitFor(()=>h.elements.get('aggie-status').textContent==='OPEN','stream updates uncovered branch');
    h.elements.get('spin').value='0.8';h.elements.get('spin').emit('input');await waitFor(()=>h.elements.get('gas-status').textContent==='SPIN CLOSED','critical equality closes both');assert.equal(h.elements.get('aggie-status').textContent,'SPIN CLOSED');assert.equal(h.elements.get('gas-passage').textContent,0);
    h.elements.get('critical').value='.99';h.elements.get('critical').emit('input');await waitFor(()=>h.server.simulation.snapshot().parameters.alphaCritical===.99,'critical control');
    // An external client update arrives via SSE, not through a frontend calculation.
    h.server.simulation.setParameters({alphaCritical:0,spin:.99,coverLoad:1});await waitFor(()=>h.elements.get('aggie-status').textContent==='SEALED','equal load seals through SSE');assert.equal(h.elements.get('gas-status').textContent,'OPEN');
    assert.equal(h.context.GFMObservatory.getSnapshot().gfm.passed,true);assert.deepEqual(h.errors,[]);
  }finally{await h.close();}
});
test('isolated DOM playback, step, reset, demo and accessible data tabs route to the backend',async()=>{
  const h=await fixture();try{
    h.elements.get('step').emit('click');await waitFor(()=>h.elements.get('clock').textContent==='0.1 s','single step');
    h.elements.get('play').emit('click');await waitFor(()=>h.server.simulation.snapshot().running && h.elements.get('play').textContent==='Pause' && h.elements.get('step').disabled,'play reaches client');assert.equal(h.elements.get('step').disabled,true);
    h.elements.get('play').emit('click');await waitFor(()=>!h.server.simulation.snapshot().running && h.elements.get('play').textContent==='Play','pause reaches client');
    h.elements.get('demo').emit('click');await waitFor(()=>h.server.simulation.snapshot().experiment?.name,'scripted demo');
    h.elements.get('reset').emit('click');await waitFor(()=>!h.server.simulation.snapshot().running && h.server.simulation.snapshot().elapsed===0,'reset');
    const tab=h.elements.get('tab-gfm');tab.emit('click');assert.equal(h.elements.get('panel-gfm').hidden,false);assert.equal(h.elements.get('panel-timeline').hidden,true);assert.equal(tab.attributes['aria-selected'],'true');
    tab.emit('keydown',{key:'ArrowRight'});assert.equal(h.elements.get('panel-equations').hidden,false);assert.equal(h.elements.get('tab-equations').focused,true);
    const r=await fetch(h.origin+'/api/export.json');assert.equal(r.status,200);const record=await r.json();assert.equal(record.state.schema,'GFM-Aperture-Aggie-frame/1');assert.ok(record.frames.length>=1);
  }finally{await h.close();}
});
test('schematic WebGL geometry stays finite at zero, threshold, open and covered cases (GPU rendering unverified)',()=>{
  const {createSimulation}=require('../backend/simulation.cjs');let draws=0,uploads=0;
  const gl=new Proxy({ARRAY_BUFFER:1,DYNAMIC_DRAW:2,FLOAT:3,LINES:4,TRIANGLES:5,POINTS:6,VERTEX_SHADER:7,FRAGMENT_SHADER:8,COMPILE_STATUS:9,LINK_STATUS:10,BLEND:11,DEPTH_TEST:12,SRC_ALPHA:13,ONE_MINUS_SRC_ALPHA:14,COLOR_BUFFER_BIT:1,DEPTH_BUFFER_BIT:2,
    getShaderParameter(){return true;},getProgramParameter(){return true;},getAttribLocation(){return 0;},getUniformLocation(){return {};},bufferData(target,data){uploads++;assert.ok(data.length>0);assert.ok([...data].every(Number.isFinite));},uniformMatrix4fv(location,transpose,data){assert.ok([...data].every(Number.isFinite));},drawArrays(mode,start,count){draws++;assert.ok(count>0);}}, {get:(target,key)=>key in target?target[key]:()=>({})});
  const canvas=new Element('universe','canvas');canvas.clientHeight=460;canvas.getContext=()=>gl;
  const context={Float32Array,Math,Number,devicePixelRatio:1,requestAnimationFrame:()=>1};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(ROOT,'public/renderer.js'),'utf8'),context);
  const renderer=new context.ApertureRenderer(canvas),simulation=createSimulation();
  for(const params of [{spin:.99,coverLoad:2},{spin:.8,coverLoad:0},{spin:0,alphaCritical:0},{spin:1,alphaCritical:.99,coverLoad:0},{spin:.99,coverLoad:1}]){renderer.update(simulation.setParameters(params));renderer.render();assert.ok(renderer.throat.mesh.count>9000);}
  assert.ok(draws>40);assert.ok(uploads>0);assert.equal(canvas.width,800);renderer.reset();assert.equal(renderer.distance,10.8);
  const cachedUploads=uploads;renderer.render();assert.equal(uploads,cachedUploads,'a repeated frame reuses finite cached geometry');
});
test('research UI receives computed ray diagnostics and routes view/accuracy/inclination controls correctly',async()=>{
  const h=await fixture({physicsEnabled:true});try{
    await waitFor(()=>h.elements.get('physics-status').textContent==='Computed Kerr light paths','computed physics displayed');
    const p=h.context.GFMObservatory.getSnapshot().physics;
    assert.equal(h.elements.get('physics-count').textContent,'16');
    assert.equal(h.elements.get('physics-null').textContent,p.diagnostics.maxNormalizedNullResidual.toExponential(2));
    assert.match(h.elements.get('physics-outcomes').textContent,/captured.*escaped.*unresolved/);
    assert.equal(h.context.GFMObservatory.getView(),'physics');
    h.elements.get('view-hypothesis').emit('click');assert.equal(h.context.GFMObservatory.getView(),'hypothesis');assert.equal(h.elements.get('stage').className,'stage hypothesis-mode');
    h.elements.get('view-physics').emit('click');assert.equal(h.elements.get('view-physics').attributes['aria-pressed'],'true');
    h.elements.get('inclination').value='45';h.elements.get('accuracy').value='1e-9';h.elements.get('inclination').emit('input');
    await waitFor(()=>h.server.physics.snapshot().settings.inclinationDeg===45,'inclination POST');
    await waitFor(()=>h.server.physics.snapshot().status==='ready','refined ray result');
    assert.equal(h.server.physics.snapshot().settings.tolerance,1e-9);assert.deepEqual(h.errors,[]);
  }finally{await h.close();}
});
