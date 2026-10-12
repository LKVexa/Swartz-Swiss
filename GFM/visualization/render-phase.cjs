'use strict';
// Export exactly the shared complex-valued 96×80 presentation mesh.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),snapshotPath=path.join(ROOT,'data','phase-reference.json'),viewPath=path.join(ROOT,'public','app.js');
const sourceBytes=fs.readFileSync(snapshotPath),viewBytes=fs.readFileSync(viewPath),frame=JSON.parse(sourceBytes.toString('utf8').replace(/^\uFEFF/,''));
const {phaseVertex}=require(viewPath),sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const nTheta=96,nY=80,relief=.2,L=frame.grid.length,vertices=[],triangles=[];
for(let j=0;j<=nY;j++)for(let i=0;i<=nTheta;i++){
  const x=L*i/nTheta,y=L*j/nY,v=phaseVertex(frame,x,y,relief);
  vertices.push({sourceX:x,sourceY:y,re:v.re,im:v.im,amplitude:v.amplitude,phase:v.phase,phaseDefined:v.phaseDefined,position:v.position,color:v.color});
}
for(let j=0;j<nY;j++)for(let i=0;i<nTheta;i++){
  const a=j*(nTheta+1)+i,b=a+1,c=a+nTheta+1,d=c+1;
  triangles.push([a,b,c],[b,d,c]);
}
let seamPositionError=0,seamColorError=0,radiusError=0;
for(let j=0;j<=nY;j++){
  const a=vertices[j*(nTheta+1)],b=vertices[j*(nTheta+1)+nTheta];
  seamPositionError=Math.max(seamPositionError,Math.hypot(...a.position.map((x,k)=>x-b.position[k])));
  seamColorError=Math.max(seamColorError,...a.color.map((x,k)=>Math.abs(x-b.color[k])));
}
for(const v of vertices)radiusError=Math.max(radiusError,Math.abs(Math.hypot(v.position[0],v.position[2])-(1+relief*v.amplitude)));
const dataset={schema:'GFM-phase-cylinder-mesh/1',mode:'02 — phase-field cylindrical display mapping',source:{file:'data/phase-reference.json',sha256:sha(sourceBytes),schema:frame.schema,time:frame.time,grid:frame.grid,diagnostics:frame.diagnostics},presentation:{file:'public/app.js',sha256:sha(viewBytes),function:'phaseVertex',thetaSegments:nTheta,heightSegments:nY,relief,referenceRadius:1,referenceHeight:4.8,units:'dimensionless display coordinates; independent of SI electromagnetic model',positionOrdering:'[display X, axial display height, display Z]',mapping:'theta=2*pi*x/L; h=4.8*(y/L-1/2); R=1+0.2*abs(psi_interp)',interpolation:'periodic bilinear interpolation of Re psi and Im psi at every mesh vertex; geometry and RGB use the same complex value there',surfaceBetweenVertices:'piecewise-linear triangle positions and perspective-correct barycentric RGB interpolation; no claim of exact nonlinear field evaluation per fragment',lighting:'unlit; stored RGB is the actual fixed-amplitude phase encoding',color:'HSV hue=(arg(psi)+pi)/(2*pi), saturation=.76, value=clamp(abs(psi),0,1); dark undefined phase if amplitude <=1e-10',physicalScope:'Stored 2D neutral complex Ginzburg–Landau field displayed on a cylinder; no 3D cylindrical physical evolution'},validation:{seamPositionError,seamColorError,radiusError,vertexCount:vertices.length,triangleCount:triangles.length},vertices,triangles};
const target=path.join(ROOT,'examples','phase-cylinder-vertices.json');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(dataset));
console.log(JSON.stringify({target,bytes:fs.statSync(target).size,sha256:sha(fs.readFileSync(target)),...dataset.validation}));
