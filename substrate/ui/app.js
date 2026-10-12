(() => {
  'use strict';
  const d = window.VEC1_STATE || {};
  const doc = d.doctor || {};
  const audit = (d.state_audit || {}).electrons || {};
  const esc = v => String(v === undefined || v === null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $ = id => document.getElementById(id);
  const ready = !!doc.ready_for_strict_execution;
  const auditOk = (d.state_audit || {}).ok !== false;
  const comps = d.components || [];
  $('status').innerHTML = [
    `<span class="pill ${ready ? 'ok' : 'bad'}">${ready ? 'STRICT FABRIC READY' : 'BUILD/PREFLIGHT REQUIRED'}</span>`,
    `<span class="pill ${auditOk ? 'ok' : 'bad'}">state audit: ${auditOk ? 'intact' : 'INTEGRITY FAILURE'}</span>`,
    `<span class="pill">network: deny</span>`,
    `<span class="pill">components: ${comps.length}/110 mapped</span>`,
    `<span class="pill muted">v${esc(d.version || '?')} · generated ${esc(d.generated_utc || 'never')}</span>`
  ].join(' ');
  const nodes = doc.nodes || {};
  $('nodes').innerHTML = ['N_SMALL', 'N_MEDIUM', 'N_LARGE', 'N_XLARGE'].map(n => {
    const x = nodes[n] || {};
    return `<div class="card"><strong>${n}</strong><div class="path">${esc(x.root || 'not attested')}</div>` +
      `<div class="${x.bound ? 'ok' : 'bad'}">${x.bound ? 'BOUND' : 'UNBOUND'}</div>` +
      `<div class="muted">integrity ${x.sums_match === true ? 'matched' : 'unconfirmed'}</div></div>`;
  }).join('');
  const els = d.electrons || [];
  $('electrons').innerHTML = els.length ? els.map(e => {
    const rt = e.runtime || {}, pr = e.properties || {}, a = audit[e.electron_id] || {};
    const h = ((e.hashes || {}).canonical_state_sha256 || '').slice(0, 16);
    const st = String(rt.execution_status || '?');
    const cls = /VERIFIED|READY/.test(st) ? 'ok' : /FAULTED|BLOCKED|RETIRED/.test(st) ? 'bad' : 'warn';
    return `<div class="card"><strong>${esc(e.electron_id)}</strong>` +
      `<div>gen ${esc(e.generation_id)} · <span class="${cls}">${esc(st)}</span></div>` +
      (e.parent_id ? `<div class="muted">parent ${esc(e.parent_id)}</div>` : '') +
      `<div>orbital ${esc(pr.orbital)} · spin ${esc(pr.spin)}</div>` +
      `<div class="muted">tick ${esc(rt.tick)} · state ${esc(h)}…</div>` +
      `<div class="${a.ok === false ? 'bad' : 'ok'}">${a.ok === false ? 'AUDIT FAILED' : 'ledger ' + esc((a.ledger || {}).events) + ' events · sealed'}</div></div>`;
  }).join('') : '<div class="card muted">No VEC instances yet. Run <code>vecctl.py create</code> or <code>DEMO_VEC1</code>.</div>';
  const rows = c => `<tr><td>${esc(c.component)}</td><td>${esc(c.title)}</td><td>${esc(c.layer)}</td><td>${esc(c.runtime_owner)}</td><td>${esc(c.integration_mechanism)}</td><td class="bad">${esc(c.vec1_terminal_state)}</td></tr>`;
  const render = q => {
    q = (q || '').toLowerCase();
    const list = q ? comps.filter(c => JSON.stringify(c).toLowerCase().includes(q)) : comps;
    $('components').innerHTML = list.map(rows).join('');
    $('count').textContent = `${list.length} of ${comps.length}`;
  };
  $('filter').addEventListener('input', ev => render(ev.target.value));
  render('');
})();
