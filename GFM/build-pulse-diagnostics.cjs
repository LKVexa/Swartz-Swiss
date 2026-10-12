'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=__dirname;
function build(){
 const source=fs.readFileSync(path.join(ROOT,'backend/pulse-diagnostics.cjs'),'utf8');
 const output='/* Generated pure snapshot diagnostics; no field evolution. */\n(function(root){\nconst module={exports:{}},exports=module.exports;\n'+source+'\nroot.GFMPulseDiagnostics=module.exports;\n})(typeof window===\'undefined\'?globalThis:window);\n';
 fs.writeFileSync(path.join(ROOT,'public/pulse-diagnostics.js'),output);
 const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
 const receipt={version:require('./release-info.json').version,source:'backend/pulse-diagnostics.cjs',sourceSHA256:sha(source),output:'public/pulse-diagnostics.js',outputSHA256:sha(output),bytes:Buffer.byteLength(output),solverEquationsChanged:false};
 fs.writeFileSync(path.join(ROOT,'validation/pulse-diagnostics-build.json'),JSON.stringify(receipt,null,2)+'\n');
 return receipt;
}
if(require.main===module)console.log(JSON.stringify(build(),null,2));
module.exports={build};
