'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=__dirname,hash=data=>crypto.createHash('sha256').update(data).digest('hex');
function build(){
 const template=fs.readFileSync(path.join(ROOT,'public/project.html'),'utf8');
 const html=template.replace('href="index.html" data-standalone-target="Open GFM Preview.html"','href="Open GFM Preview.html"');
 const references=[...html.matchAll(/href="([^"]+)"/g)].map(match=>match[1]);
 for(const reference of references){const target=reference.startsWith('file:')?require('node:url').fileURLToPath(reference):path.resolve(ROOT,reference);if(!fs.existsSync(target))throw Error('Missing project reference: '+target);}
 fs.writeFileSync(path.join(ROOT,'GFM Project.html'),html);
 const receipt={schema:'GFM-project-hub/1',date:require('./release-info.json').date,simulatorVersion:require('./release-info.json').version,canonicalRoot:ROOT,entry:'Open GFM.cmd',projectHome:'GFM Project.html',standaloneSimulator:'Open GFM Preview.html',references,projectHomeSHA256:hash(html),originalConsoleAndModelsModified:false};
 fs.writeFileSync(path.join(ROOT,'validation/project-integration.json'),JSON.stringify(receipt,null,2)+'\n');return receipt;
}
if(require.main===module)console.log(JSON.stringify(build(),null,2));
module.exports={build};
