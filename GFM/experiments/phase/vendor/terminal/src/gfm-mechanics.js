/* Raw mechanics datasets. Field arithmetic and ordinary complex signals are
 * separate domains; neither dataset requires probability interpretation. */
(function (root, factory) {
  'use strict';
  const common = typeof module === 'object' && module.exports;
  const api = factory(common ? require('./engine.js') : root.RusslEngine,
    common ? require('./horizon-gr.js') : root.RusslHorizonGR,
    common ? require('./horizon-scenario.js') : root.RusslHorizonScenario,
    common ? require('./gfm-matrix.js') : root.RusslGFMMatrix,
    common ? require('./gfm-models.js') : root.RusslGFMModels);
  root.RusslGFMMechanics = api;
  if (common) module.exports = api;
})(globalThis, function (E, R, S, G, B) {
  'use strict';
  const tolerance = 1e-10;
  const limits = Object.freeze({ maxNorm: 1e100, maxOperations: 100, maxCodecBytes: 65536, maxJSONDepth: 16 });
  const references = Object.freeze({
    trace: 'https://arxiv.org/abs/quant-ph/0605054',
    polynomial: 'https://ocw.mit.edu/courses/18-310-principles-of-discrete-applied-mathematics-fall-2013/b4a37cf6c0e515fb863e139c2a6a51ac_MIT18_310F13_Ch17.pdf'
  });
  function record(value, name) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(name + ' must be a plain data object.');
    const proto = Object.getPrototypeOf(value), constructor = proto && Object.getOwnPropertyDescriptor(proto, 'constructor');
    if (proto !== null && !(Object.getPrototypeOf(proto) === null && constructor && 'value' in constructor && constructor.value.name === 'Object')) throw new TypeError(name + ' must be a plain data object.');
    if (Reflect.ownKeys(value).some(key => typeof key !== 'string' || !('value' in Object.getOwnPropertyDescriptor(value, key)))) throw new TypeError(name + ' cannot contain accessors or symbol keys.');
    return value;
  }
  function dense(value, name) {
    if (!Array.isArray(value) || Reflect.ownKeys(value).length !== value.length + 1) throw new TypeError(name + ' must be a dense data array.');
    for (let i = 0; i < value.length; i++) if (!Object.getOwnPropertyDescriptor(value, String(i)) || !('value' in Object.getOwnPropertyDescriptor(value, String(i)))) throw new TypeError(name + ' cannot contain holes or accessors.');
    return value;
  }
  function jsonCopy(value, bytes = limits.maxCodecBytes) {
    let count = 0;
    const seen = new Set();
    function copy(v, depth) {
      if (++count > 20000 || depth > limits.maxJSONDepth) throw new RangeError('Metadata is too large or deeply nested.');
      if (v === null || typeof v === 'boolean') return v;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string' && v.length <= bytes) return v;
      if (!v || typeof v !== 'object' || seen.has(v)) throw new TypeError('Metadata must contain finite JSON data without cycles.');
      seen.add(v);
      let result;
      if (Array.isArray(v)) { dense(v, 'Metadata array'); result = v.map(x => copy(x, depth + 1)); }
      else { record(v, 'Metadata'); result = {}; for (const key of Object.keys(v)) Object.defineProperty(result, key, { value: copy(v[key], depth + 1), enumerable: true, writable: true, configurable: true }); }
      seen.delete(v);
      return result;
    }
    const result = copy(value, 0);
    if (new TextEncoder().encode(JSON.stringify(result)).length > bytes) throw new RangeError('Metadata exceeds its byte limit.');
    return result;
  }
  function field(value) {
    if (typeof value === 'string') return E.field(value);
    for (const id of Object.keys(E.fields)) if (value === E.fields[id] || value === E.field(id)) return E.field(id);
    throw new TypeError('Expected a registered field or field id.');
  }
  function finite(value, name, low, high) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < low || value > high) throw new RangeError(name + ' must be a finite number within ' + low + '..' + high + '.');
    return value;
  }
  function complex(value) {
    if (typeof value === 'number') value = { re: value, im: 0 };
    else if (Array.isArray(value)) { dense(value, 'Complex pair'); if (value.length !== 2) throw new TypeError('Complex pairs have two components.'); value = { re: value[0], im: value[1] }; }
    else { record(value, 'Complex value'); if (Object.keys(value).sort().join(',') !== 'im,re') throw new TypeError('Complex objects contain only re and im.'); }
    finite(value.re, 'Real component', -limits.maxNorm * (1 + 1e-12), limits.maxNorm * (1 + 1e-12));
    finite(value.im, 'Imaginary component', -limits.maxNorm * (1 + 1e-12), limits.maxNorm * (1 + 1e-12));
    return { re: value.re, im: value.im };
  }
  function norm(values) { return values.reduce((sum, v) => Math.hypot(sum, v.re, v.im), 0); }
  function valuesFor(f, domain, values) {
    dense(values, 'Dataset values');
    const length = domain === 'complex-signal' ? f.q : f.q - 1;
    if (values.length !== length) throw new RangeError('This domain requires exactly ' + length + ' values.');
    if (domain === 'field-values') return values.map(x => f.add(x, 0));
    const result = values.map(complex);
    if (norm(result) > limits.maxNorm * (1 + 1e-12)) throw new RangeError('Raw signal L2 norm exceeds ' + limits.maxNorm + '.');
    return result;
  }
  function dataset(value, values, codec = {}, domain = 'complex-signal') {
    const f = field(value);
    if (!['complex-signal', 'field-values'].includes(domain)) throw new RangeError('Choose complex-signal or field-values.');
    record(codec, 'Codec');
    return { schema: 'RUSSL-GFM-dataset/1', field: f.id, domain, representation: 'samples', values: valuesFor(f, domain, values), codec: jsonCopy(codec), operations: [] };
  }
  function validate(value) {
    record(value, 'Dataset');
    if (Object.keys(value).sort().join(',') !== 'codec,domain,field,operations,representation,schema,values' || value.schema !== 'RUSSL-GFM-dataset/1') throw new Error('Unsupported mechanics dataset schema.');
    const result = dataset(value.field, value.values, value.codec, value.domain);
    const representations = result.domain === 'complex-signal' ? ['samples', 'trace-coefficients'] : ['samples', 'polynomial-coefficients'];
    if (!representations.includes(value.representation)) throw new Error('Dataset representation does not match its value domain.');
    dense(value.operations, 'Operations');
    if (value.operations.length > limits.maxOperations || value.operations.some(op => typeof op !== 'string' || op.length > 300)) throw new RangeError('Dataset operations must be bounded inert strings.');
    result.representation = value.representation; result.operations = value.operations.slice();
    return result;
  }
  function direction(value, inverse, domain, coefficients) {
    if (typeof inverse !== 'boolean') throw new TypeError('Inverse must be a boolean.');
    const d = validate(value);
    if (d.domain !== domain) throw new Error('This transform requires the ' + domain + ' domain.');
    if (d.representation !== (inverse ? coefficients : 'samples')) throw new Error('Use the matching inverse/forward operation for this dataset representation.');
    if (d.operations.length === limits.maxOperations) throw new RangeError('Dataset operation history is full.');
    return d;
  }
  function traceRaw(f, values, inverse) {
    const n = norm(values);
    // A reversible numerical rescaling accommodates the legacy kernel's 1e6
    // input cap. The returned coefficients always retain the original scale.
    const computationScale = n > 1e5 || n > 0 && n < 1e-100 ? Math.max(...values.flatMap(v => [Math.abs(v.re), Math.abs(v.im)])) : 1;
    const input = computationScale === 1 ? values : values.map(v => ({ re: v.re / computationScale, im: v.im / computationScale }));
    const result = E.fourier(f, input, inverse).map(v => ({ re: v.re * computationScale, im: v.im * computationScale }));
    return { values: result, computationScale };
  }
  function traceTransform(value, inverse = false) {
    const d = direction(value, inverse, 'complex-signal', 'trace-coefficients'), f = field(d.field);
    const transformed = traceRaw(f, d.values, inverse), restored = traceRaw(f, transformed.values, !inverse).values;
    const inputNorm = norm(d.values), outputNorm = norm(transformed.values);
    const absoluteNormError = Math.abs(outputNorm - inputNorm), maximumError = Math.max(...restored.map((v, i) => Math.hypot(v.re - d.values[i].re, v.im - d.values[i].im)));
    const allowance = tolerance * inputNorm + 32 * f.q * Number.MIN_VALUE;
    const ratio = inputNorm === 0 ? 1 : outputNorm / inputNorm;
    const checks = {
      normPreservation: { residual: inputNorm ? absoluteNormError / inputNorm : absoluteNormError, absoluteResidual: absoluteNormError, passed: absoluteNormError <= allowance },
      energyPreservation: { residual: Math.abs(ratio * ratio - 1), inputEnergy: inputNorm * inputNorm, outputEnergy: outputNorm * outputNorm, energyUnderflow: inputNorm > 0 && inputNorm * inputNorm === 0, passed: absoluteNormError <= allowance },
      inverseRecovery: { residual: inputNorm ? maximumError / inputNorm : maximumError, absoluteResidual: maximumError, passed: maximumError <= allowance }
    };
    d.values = valuesFor(f, d.domain, transformed.values); d.representation = inverse ? 'samples' : 'trace-coefficients'; d.operations.push(inverse ? 'trace.inverse' : 'trace.forward');
    return { dataset: d, checks, passed: Object.values(checks).every(x => x.passed), summary: 'Raw ' + (inverse ? 'inverse ' : '') + 'trace-character transform; original scale and zero data retained.', inputNorm, outputNorm, computationScale: transformed.computationScale,
      kernel: { kind: 'complex-trace-character', formula: inverse ? 'exp(-2pi i Tr(kx)/p)/sqrt(q)' : 'exp(+2pi i Tr(kx)/p)/sqrt(q)', normalization: 'kernel 1/sqrt(q); no dataset normalization', p: f.p, q: f.q },
      ordering: { input: 'polynomial integer labels 0..q-1', output: 'polynomial integer labels 0..q-1' }, scope: 'A complex signal basis transform. Squared magnitude is signal energy, without Born probability semantics.' };
  }
  function primitive(f) {
    const N = f.q - 1;
    for (let root = 1; root < f.q; root++) {
      const powers = Array.from({ length: N }, (_, j) => f.pow(root, j));
      if (new Set(powers).size === N && f.pow(root, N) === 1) return { root, powers };
    }
    throw new Error('No primitive element found in the registered field.');
  }
  function polynomialRaw(f, values, root, inverse) {
    const N = f.q - 1, inverseLength = f.inv(N % f.p);
    return Array.from({ length: N }, (_, k) => {
      let sum = 0;
      for (let j = 0; j < N; j++) { const exponent = k * j % N; sum = f.add(sum, f.mul(values[j], f.pow(root, inverse ? (N - exponent) % N : exponent))); }
      return inverse ? f.mul(inverseLength, sum) : sum;
    });
  }
  function polynomialTransform(value, inverse = false) {
    const d = direction(value, inverse, 'field-values', 'polynomial-coefficients'), f = field(d.field), N = f.q - 1, generator = primitive(f);
    const output = polynomialRaw(f, d.values, generator.root, inverse), restored = polynomialRaw(f, output, generator.root, !inverse);
    const checks = { inverseRecovery: { residual: restored.reduce((n, x, i) => n + (x === d.values[i] ? 0 : 1), 0), passed: restored.every((x, i) => x === d.values[i]) }, primitiveOrder: { residual: 0, passed: new Set(generator.powers).size === N } };
    d.values = output; d.representation = inverse ? 'samples' : 'polynomial-coefficients'; d.operations.push(inverse ? 'polynomial.inverse' : 'polynomial.forward');
    return { dataset: d, checks, passed: Object.values(checks).every(x => x.passed), summary: 'Exact finite-field ' + (inverse ? 'inverse ' : '') + 'multiplicative DFT; all arithmetic stays in ' + f.label + '.',
      kernel: { kind: 'finite-field-multiplicative-DFT', formula: inverse ? 'N^-1 sum_k a[k] omega^(-jk)' : 'sum_j a[j] omega^(jk)', primitiveRoot: generator.root, length: N, embeddedLength: N % f.p, inverseLength: f.inv(N % f.p), matrix: Array.from({ length: N }, (_, k) => Array.from({ length: N }, (_, j) => { const exponent = j * k % N, power = f.pow(generator.root, inverse ? (N - exponent) % N : exponent); return inverse ? f.mul(f.inv(N % f.p), power) : power; })) },
      ordering: { positions: Array.from({ length: N }, (_, j) => j), nonzeroFieldNodes: generator.powers, rule: 'Position j corresponds to omega^j, j=0..q-2; field labels encode polynomial coefficients.' }, scope: 'Exact field-valued polynomial evaluation/interpolation. Complex magnitude, signal energy and probabilities do not apply.' };
  }
  function parameters(input, defaults) {
    record(input, 'Profile parameters');
    if (Object.keys(input).some(key => !Object.hasOwn(defaults, key))) throw new Error('Unknown profile parameter.');
    return { ...defaults, ...input };
  }
  function profile(value, kind, input = {}) {
    const f = field(value);
    if (kind === 'pendulum') {
      const p = parameters(input, { g: 9.81, length: 1, maxAngle: .2 });
      finite(p.g, 'g', 1e-9, 1e6); finite(p.length, 'length', 1e-9, 1e6); finite(p.maxAngle, 'maxAngle', 1e-9, Math.PI);
      const kappa = finite(p.g / p.length, 'g/length', 1e-12, 1e6), nodes = Array.from({ length: f.q }, (_, j) => p.maxAngle * (2 * j / (f.q - 1) - 1));
      return dataset(f, nodes.map(theta => -kappa * Math.sin(theta)), { kind: 'ordered-angle-grid', profile: kind, parameters: p, order: 'polynomial integer label order', nodes, units: { theta: 'radians', value: 'radians/second^2' }, reference: { omega: Math.sqrt(kappa), smallAnglePeriod: 2 * Math.PI / Math.sqrt(kappa), equation: 'theta_ddot=-(g/length)sin(theta)' }, scope: 'Ordinary sampled restoring acceleration; no sine over a finite field and no continuous trajectory solved.' });
    }
    if (kind === 'gtt' || kind === 'frameOmega') {
      const p = parameters(input, { M: 1, a: .99, Q: 0, rMin: 2, rMax: 8, theta: Math.PI / 2 });
      finite(p.rMin, 'rMin', 0, 1e9); finite(p.rMax, 'rMax', 0, 1e9); if (p.rMax <= p.rMin) throw new RangeError('Require rMax > rMin.');
      const reference = R.kerrNewman(p.M, p.a, p.Q);
      if (!reference.passed) throw new Error('Ordinary horizon reference checks failed.');
      const nodes = Array.from({ length: f.q }, (_, j) => p.rMin + (p.rMax - p.rMin) * j / (f.q - 1));
      const values = nodes.map(r => { const metric = R.metric(p.M, p.a, p.Q, r, p.theta); if (!metric.passed) throw new Error('Ordinary metric checks failed.'); return kind === 'gtt' ? metric.matrix[0][0] : metric.frameOmega; });
      return dataset(f, values, { kind: 'horizon-radial-grid', profile: kind, component: kind, parameters: p, referenceParameters: { M: p.M, a: p.a, Q: p.Q }, order: 'polynomial integer label order', nodes, range: [p.rMin, p.rMax], theta: p.theta, units: kind === 'gtt' ? 'dimensionless' : 'inverse geometrized length', scope: 'Ordinary exterior metric-component samples; this signal transform is not a spacetime coordinate transformation or metric isometry.' });
    }
    if (['aperture', 'gaseousPassage', 'aggiePassage'].includes(kind)) {
      const p = S.parameters(input), nodes = Array.from({ length: f.q }, (_, j) => j / (f.q - 1)), C = p.aggieLoad >= p.sealThreshold ? 1 : 0;
      const values = nodes.map(alpha => { const radius = S.aperture(alpha, p.alphaCritical, p.r0); return kind === 'aperture' ? radius : radius > 0 ? kind === 'gaseousPassage' ? 1 : 1 - C : 0; });
      return dataset(f, values, { kind: 'hypothetical-spin-grid', profile: kind, parameters: p, nodes, coordinate: 'alpha=a/M', units: kind === 'aperture' ? 'toy length' : 'binary passage bit', sourceStatus: 'toy-assumption', scope: 'Raw samples of declared hypothetical aperture and cover rules; no traversable spacetime or material-dependent horizon is established.' });
    }
    throw new Error('Choose pendulum, gtt, frameOmega, aperture, gaseousPassage or aggiePassage.');
  }
  function imageReapplication() {
    const pendulumSamples = profile('gf9', 'pendulum'), pendulumTrace = traceTransform(pendulumSamples);
    const zeta = B.zeta('gf9', 2), mellinSamples = dataset('gf9', zeta.samples.map(x => x.value), { ...zeta.codec, profile: 'zetaGamma', parameters: { s: 2 }, scope: 'Raw ordinary Mellin samples; the separately computed continuum integral is not replaced by this finite grid.' });
    const mellinTrace = traceTransform(mellinSamples);
    const rotations = {};
    for (const axis of ['x', 'y', 'z']) {
      const input = dataset('gf3', [1, 2, 3], { kind: 'ordered-cartesian-components', axes: ['x', 'y', 'z'], units: 'declared input units', scope: 'Ordinary raw Cartesian components with GF3 indexing; the angle is real degrees.' });
      const original = G.rotation(axis, 232.75), transformedInput = traceTransform(input), transformedOperator = G.changeBasis('gf3', original.matrix), transformedOutput = G.apply(transformedOperator, transformedInput.dataset.values);
      const coefficientDataset = validate(transformedInput.dataset); coefficientDataset.values = transformedOutput; coefficientDataset.operations.push('operator.rotation.' + axis);
      const recovered = traceTransform(coefficientDataset, true), directOutput = G.apply(original.matrix, input.values), scale = norm(directOutput);
      const covariance = Math.max(...recovered.dataset.values.map((v, i) => Math.hypot(v.re - directOutput[i].re, v.im - directOutput[i].im))) / scale;
      const normError = Math.abs(norm(recovered.dataset.values) - norm(input.values)) / norm(input.values);
      const checks = { operatorCovariance: { residual: covariance, passed: covariance <= tolerance }, rawNormPreservation: { residual: normError, passed: normError <= tolerance }, traceInverse: recovered.checks.inverseRecovery };
      rotations[axis] = { axis, angleDegrees: 232.75, input, matrix: original.matrix, transformedInput: transformedInput.dataset, transformedOperator, transformedOutput, output: recovered.dataset, directOutput, checks, passed: original.checks.orthogonality.passed && Object.values(checks).every(x => x.passed), scope: 'F3 R F3† acts on F3 v; inverse recovery equals R v. Input [1,2,3] is retained at its raw scale, without quantum-state preparation.' };
    }
    return { pendulum: { samples: pendulumSamples, dataset: pendulumTrace.dataset, checks: pendulumTrace.checks, passed: pendulumTrace.passed }, zetaGamma: { samples: mellinSamples, dataset: mellinTrace.dataset, reference: zeta.reference, finiteSampling: zeta.finiteSampling, checks: mellinTrace.checks, passed: mellinTrace.passed && zeta.passed }, rotation: { axes: rotations, passed: Object.values(rotations).every(x => x.passed) } };
  }
  function reapply(registry, oldRegistry) {
    const current = jsonCopy(record(registry, 'Horizon registry'), 2 * 1024 * 1024), old = jsonCopy(record(oldRegistry, 'Historical registry'), 2 * 1024 * 1024);
    for (const r of [current, old]) { dense(r.entries, 'Registry entries'); if (r.entries.length > 256 || r.entries.some(e => !e || typeof e.id !== 'string')) throw new Error('Invalid registry entries.'); if (new Set(r.entries.map(e => e.id)).size !== r.entries.length) throw new Error('Duplicate registry entry id.'); }
    const raw = profile('gf9', 'gtt'), transform = traceTransform(raw), inverse = traceTransform(transform.dataset, true);
    const ordinaryReferences = [], commands = new Set();
    current.entries.forEach(e => (e.adapters || []).forEach(a => { if (typeof a.command === 'string' && /^horizon\.(reference|metric|si)\b/.test(a.command)) commands.add(a.command); }));
    for (const command of commands) {
      const tokens = command.split(/\s+/), op = tokens.shift(), count = op === 'horizon.reference' ? 3 : op === 'horizon.metric' ? 5 : 1;
      if (tokens.length !== count || tokens.some(x => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(x))) throw new Error('Invalid ordinary reference adapter.');
      const input = tokens.map(Number), result = op === 'horizon.reference' ? R.kerrNewman(...input) : op === 'horizon.metric' ? R.metric(...input) : R.schwarzschildSI(...input);
      ordinaryReferences.push({ command, result });
    }
    const scenario = S.scenario(), images = imageReapplication();
    const entries = current.entries.map(e => ({ ...e, appliedToDataset: false, outcome: e.status === 'toy-assumption' && e.id !== 'image-tensor-map' ? 'hypothetical-rule-evaluated' : (e.adapters || []).some(a => commands.has(a.command)) ? 'ordinary-reference-calculated' : 'reference-retained', scopeOfReapplication: 'Only the selected raw exterior scalar samples enter the primary transform. Other source equations retain their declared ordinary or hypothetical domain; no PDE or metric equivalence is inferred.' }));
    const imageResidual = Math.max(...Object.values(images.pendulum.checks).map(x => x.residual), ...Object.values(images.zetaGamma.checks).map(x => x.residual), ...Object.values(images.rotation.axes).flatMap(x => Object.values(x.checks).map(c => c.residual)));
    const checks = { ...transform.checks, ordinaryReferences: { residual: 0, passed: ordinaryReferences.every(x => x.result.passed !== false) }, recoveredSamples: inverse.checks.inverseRecovery, imageTransports: { residual: imageResidual, passed: Object.values(images).every(x => x.passed) } };
    const report = { schema: 'RUSSL-GFM-mechanics-reapplication/1', version: '0.5.0', coverage: { newFindings: current.entries.length, pdfNumberedEquations: current.entries.filter(e => /^pdf-\d\d$/.test(e.id)).length, previousFindings: old.entries.length, previousImageFamilies: 3 }, entries, ordinaryReferences, scenario, images,
      primary: { description: 'Raw Kerr exterior gtt samples → trace Fourier coefficients; inverse recovery checked.', samples: raw, restoredSamples: inverse.dataset, transform: { kernel: transform.kernel, ordering: transform.ordering, computationScale: transform.computationScale }, checks },
      historicalReference: { scope: 'Preserved prior equation audit and its three image families. Earlier normalized quantum-state demonstrations are historical references; no quantum gates, probability calculation or Wigner grid is executed by this mechanics reapplication.', registry: old, entries: old.entries.map(e => ({ ...e, outcome: 'historical-reference-retained', appliedToDataset: false, scopeOfReapplication: 'Prior audit disposition retained in its original domain. This primary mechanics pass applies only the explicit raw image and exterior-signal adapters, not the prior quantum operators.' })) },
      scope: 'Galois field mechanics terminal: exact field arithmetic and raw ordinary signals remain separate. Fourier transport alone cannot distinguish identical observations or establish new physical laws.' };
    return { dataset: transform.dataset, report, checks, passed: transform.passed && inverse.passed && Object.values(checks).every(x => x.passed) };
  }
  return Object.freeze({ version: '0.5.0', dataset, validate, traceTransform, polynomialTransform, profile, reapply, limits, tolerance, references });
});
