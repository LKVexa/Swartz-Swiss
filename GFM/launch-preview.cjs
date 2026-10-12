'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {execFile}=require('node:child_process');
const {verifyInstallation}=require('./verify-install.cjs');
const RELEASE=require('./release-info.json');
function launchPreview(options={}) {
 const receipt=verifyInstallation(__dirname);
 const file=path.join(__dirname,'Open GFM Preview.html');
 if(!fs.existsSync(file))throw new Error('The live preview is missing. Extract the complete package.');
 console.log(`${RELEASE.product} v${RELEASE.version}\n\nLive preview: ${file}\n\nThe calculation runs inside the viewer. A separate server or console is not required.\nInitial example: covered plasma, two nanoseconds of calculated pulse history.\nUse Run, Step and the phase/plasma/aggie layer selector.\nVerified ${receipt.files} files; longest path ${receipt.longestPathCharacters} characters.`);
 if(options.openBrowser!==false&&process.platform==='win32') {
   execFile('cmd.exe',['/d','/s','/c',`start "" "${file}"`],{windowsHide:true},error=>{
     if(error){console.error(`Windows could not open its default browser: ${error.message}\nOpen this HTML file directly: ${file}`);process.exitCode=1;}
   });
 }
 return {file,version:RELEASE.version,receipt,transport:'browser-worker'};
}
if(require.main===module)try{launchPreview({openBrowser:!process.argv.includes('--no-browser')});}catch(error){console.error(error.message);process.exitCode=1;}
module.exports={launchPreview};
