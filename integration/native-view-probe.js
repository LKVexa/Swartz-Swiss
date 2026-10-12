(async function () {
  try {
    const backend = window.GFM_LOCAL_BACKEND;
    await backend.ready;
    const first = await backend.request('/api/state');
    window.__gfmConsoleInitialFrame = first;
    for (let i = 0; i < 100 && document.getElementById('step').disabled; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    const step = document.getElementById('step');
    if (step.disabled) throw new Error('The actual Step control did not become available.');
    step.click();
    let next = first;
    for (let i = 0; i < 100 && next.timeSeconds <= first.timeSeconds; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      next = await backend.request('/api/state');
    }
    const exported = await backend.request('/api/export');
    const canvas = document.getElementById('scene');
    const gl = canvas.getContext('webgl');
    const layers = ['show-phase-layer', 'show-plasma-layer', 'show-cover-layer'].map(id => ({ id, checked: document.getElementById(id).checked }));
    const validFields = ['EphiVPerM', 'HrAPerM', 'HzAPerM', 'temperatureK', 'plasmaTemperatureK'].every(name => Array.isArray(next.fields[name]) && next.fields[name].every(Number.isFinite)) && next.fields.carrierPhaseValidMask.every((valid, i) => !valid || Number.isFinite(next.fields.relativeCarrierPhaseRad[i]));
    const result = {
      initialTimeSeconds: first.timeSeconds,
      steppedTimeSeconds: next.timeSeconds,
      stepControlAdvancedModel: next.timeSeconds > first.timeSeconds,
      sourceSHA256: next.server.engineSHA256,
      transport: next.server.transport,
      schema: next.schema,
      exportSchema: exported.schema,
      grid: { nr: next.grid.nr, nz: next.grid.nz },
      validFields,
      plasmaCollisionHeatJ: next.diagnostics.plasmaCollisionHeatJ,
      coverOhmicHeatJ: next.diagnostics.coverOhmicHeatJ,
      ledgerResidualJ: next.diagnostics.energyBalanceResidualJ,
      selectedField: document.getElementById('field-layer').value,
      selectedShape: document.getElementById('presentation-shape').value,
      layers,
      webgl: Boolean(gl),
      webglError: gl ? gl.getError() : null,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      location: location.href,
      documentTitle: document.title
    };
    result.ok = result.stepControlAdvancedModel && result.validFields && result.webgl && result.webglError === 0 && result.canvasWidth > 0 && result.canvasHeight > 0 && layers.every(layer => layer.checked) && result.selectedField === 'combined' && result.plasmaCollisionHeatJ > 0 && result.coverOhmicHeatJ > 0;
    document.getElementById('export').click();
    result.exportButtonClicked = true;
    document.getElementById('scene').scrollIntoView({ block: 'center', behavior: 'instant' });
    await new Promise(resolve => setTimeout(resolve, 400));
    window.__gfmConsoleTest = result;
  } catch (error) {
    window.__gfmConsoleTest = { ok: false, error: error.message, stack: error.stack };
  }
})();
