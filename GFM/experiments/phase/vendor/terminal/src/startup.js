/* Visible readiness and error status; saved example data remains readable. */
(function(root){'use strict';
  let ready=false;
  function failed(message){const n=document.getElementById('engine-status'),controls=document.getElementById('gfm-live-controls');if(n){n.textContent=(ready?'Live calculation error: ':'Calculation engine could not start: ')+String(message||'Unknown error')+'. Saved example data remains available below.';n.dataset.state='error';}if(controls)controls.disabled=true;const exportButton=document.getElementById('export-session');if(exportButton)exportButton.disabled=true;}
  root.addEventListener('error',event=>failed(event.message));
  root.addEventListener('unhandledrejection',event=>failed(event.reason?.message||event.reason));
  root.RusslStartup=Object.freeze({ready(){const n=document.getElementById('engine-status'),controls=document.getElementById('gfm-live-controls');if(!n||!controls)throw Error('Missing engine readiness controls.');ready=true;controls.disabled=false;document.getElementById('export-session').disabled=false;n.textContent='Live GFM calculation engine is ready. Controls below produce new data; the saved pendulum example shows a completed calculation.';n.dataset.state='ready';}});
})(globalThis);
