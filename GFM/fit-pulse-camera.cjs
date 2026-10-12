'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const file=path.join(__dirname,'public/app.js');let source=fs.readFileSync(file,'utf8');
function replace(old,value){if(!source.includes(old))throw Error('Camera migration anchor missing: '+old);source=source.replace(old,value);}
replace('this.distance=5.2;this.objects=[];','this.distance=5.2;this.autoFit=true;this.objects=[];');
replace("canvas.addEventListener('wheel',e=>{e.preventDefault();", "canvas.addEventListener('wheel',e=>{e.preventDefault();this.autoFit=false;");
replace("if(e.key==='+')this.distance=", "if(e.key==='+'||e.key==='-')this.autoFit=false;if(e.key==='+')this.distance=");
replace('Math.exp(e.deltaY*.001),2.8,11)', 'Math.exp(e.deltaY*.001),2.8,16)');
replace('Math.min(11,this.distance+.2)', 'Math.min(16,this.distance+.2)');
replace('gl.useProgram(this.program);const eye=', "gl.useProgram(this.program);if(this.autoFit&&mode==='em'&&frame)this.distance=cameraFitDistance(frame,$('field-layer').value==='combined'?$('presentation-shape').value:'cylinder',w/h);const eye=");
replace("scene.pitch=.31;scene.distance=mode==='phase'?7.8:5.2;", "scene.pitch=.31;scene.autoFit=true;scene.distance=mode==='phase'?7.8:5.2;");
replace("if(scene)scene.distance=mode==='phase'?7.8:5.2;", "if(scene){scene.autoFit=true;scene.distance=mode==='phase'?7.8:5.2;}");
replace("$('phaseRelief').addEventListener", "$('presentation-shape').addEventListener('change',()=>{if(scene){scene.autoFit=true;scene.draw();}});$('phaseRelief').addEventListener");
new vm.Script(source);fs.writeFileSync(file,source);console.log('Adaptive camera fit integrated; manual zoom retained.');
