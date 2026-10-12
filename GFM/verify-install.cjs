'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
function verifyInstallation(root){
 const manifestPath=path.join(root,'release-manifest.json');
 if(!fs.existsSync(manifestPath))throw new Error('The release manifest is missing. Extract the complete package.');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 let longest=0,count=0;
 for(const item of manifest.files){
  if(typeof item.path!=='string'||item.path.includes('\\')||item.path.split('/').some(x=>x==='..'||x===''))throw new Error('Invalid packaged relative path.');
  const file=path.resolve(root,item.path);
  if(!file.startsWith(path.resolve(root)+path.sep))throw new Error('Packaged path is outside its project.');
  longest=Math.max(longest,file.length);
  if(file.length>240)throw new Error('This extraction path is too long for a Windows-safe launch. Move the complete folder to D:\\Codex\\GFM-Cylindrical-Pulse-Simulator or another short local folder.');
  if(!fs.existsSync(file))throw new Error(`Packaged file is missing: ${item.path}`);
  const bytes=fs.readFileSync(file),hash=crypto.createHash('sha256').update(bytes).digest('hex');
  if(hash!==item.sha256||bytes.length!==item.bytes)throw new Error(`Packaged file changed or is incomplete: ${item.path}. Restore that file from the ZIP, or regenerate the manifest after intentional source edits.`);
  count++;
 }
 return {files:count,longestPathCharacters:longest,version:manifest.version};
}
if(require.main===module){try{console.log(JSON.stringify(verifyInstallation(__dirname),null,2));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={verifyInstallation};
