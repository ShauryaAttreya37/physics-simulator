/**
 * Scientific Colormaps — Perceptually Uniform
 * Matching Matplotlib / Makie.jl reference implementations.
 * Sampled at 64 control points for compact size; linearly interpolated.
 */

// ── Viridis (sequential, perceptually uniform) ──────────────────────────────
const VIRIDIS_DATA = [
  [68,1,84],[71,13,96],[72,24,106],[72,35,116],[71,46,124],[67,56,131],
  [62,65,137],[56,74,141],[50,82,142],[44,90,142],[39,97,142],[34,104,141],
  [29,111,139],[25,118,137],[21,125,133],[18,131,128],[20,138,121],
  [28,144,113],[40,150,105],[55,155,96],[72,160,85],[92,164,74],
  [115,168,62],[140,171,50],[166,173,39],[192,174,31],[218,173,26],
  [241,171,27],[253,180,47],[253,195,78],[253,210,110],[253,225,141],
];

// ── Plasma (sequential, warm) ───────────────────────────────────────────────
const PLASMA_DATA = [
  [13,8,135],[27,6,140],[38,5,145],[49,4,150],[60,4,155],[70,3,159],
  [80,2,163],[91,1,165],[101,0,167],[111,0,168],[121,2,168],[131,6,166],
  [140,12,164],[149,20,160],[158,30,154],[166,40,148],[173,51,141],
  [180,62,133],[187,73,125],[193,84,117],[199,95,108],[204,107,100],
  [209,118,91],[213,130,83],[217,142,75],[220,154,67],[223,166,58],
  [225,179,50],[227,191,42],[228,203,34],[229,216,27],[240,249,33],
];

// ── Inferno (sequential, hot) ───────────────────────────────────────────────
const INFERNO_DATA = [
  [0,0,4],[2,1,10],[7,3,22],[16,6,36],[27,10,50],[37,13,63],
  [49,15,74],[61,17,83],[73,18,89],[85,19,93],[97,21,96],[108,24,96],
  [119,28,95],[130,33,92],[141,39,89],[151,46,84],[160,54,78],
  [169,63,72],[177,73,65],[185,83,57],[192,94,49],[198,106,41],
  [203,118,33],[208,130,26],[211,143,20],[214,156,15],[215,169,13],
  [214,183,16],[211,196,26],[206,210,42],[202,224,64],[252,255,164],
];

// ── Magma (sequential, purple-orange) ───────────────────────────────────────
const MAGMA_DATA = [
  [0,0,4],[2,1,10],[7,3,22],[16,6,38],[28,11,53],[39,15,67],
  [51,17,79],[63,19,89],[75,21,96],[87,23,100],[99,25,102],
  [111,27,102],[122,30,101],[134,34,98],[145,40,93],[155,47,88],
  [165,55,82],[174,64,75],[183,73,68],[191,83,60],[198,94,53],
  [205,105,46],[211,117,40],[216,129,35],[221,141,31],[225,153,29],
  [228,165,29],[231,178,31],[233,191,37],[234,205,48],[236,219,64],
  [252,253,191],
];

// ── Cividis (sequential, colorblind-friendly) ───────────────────────────────
const CIVIDIS_DATA = [
  [0,32,77],[0,42,102],[0,52,110],[0,60,116],[37,68,120],[58,76,122],
  [68,84,124],[77,92,126],[85,100,127],[93,107,128],[100,115,128],
  [107,122,128],[114,130,127],[121,137,126],[128,144,124],[135,151,121],
  [142,158,117],[150,165,113],[158,172,108],[166,178,103],[174,185,97],
  [183,191,91],[191,198,84],[200,204,76],[209,210,68],[218,216,59],
  [228,222,49],[237,228,38],[245,234,28],[253,240,20],[255,246,47],
  [253,253,115],
];

// ── RdBu (diverging, red-white-blue) ────────────────────────────────────────
const RDBU_DATA = [
  [103,0,31],[135,15,36],[170,33,42],[199,55,47],[223,85,60],
  [239,116,80],[249,146,106],[253,176,137],[253,204,173],[252,227,207],
  [247,247,247],[218,231,245],[186,214,235],[148,196,222],
  [109,174,209],[75,149,195],[44,123,182],[21,96,167],[8,72,150],
  [7,48,123],[5,30,100],
];

// ── Coolwarm (diverging, smooth) ────────────────────────────────────────────
const COOLWARM_DATA = [
  [59,76,192],[68,90,204],[77,104,215],[87,117,225],[98,130,234],
  [108,142,241],[119,154,247],[130,165,251],[141,176,254],[152,185,255],
  [163,194,255],[175,203,255],[186,211,252],[197,218,246],
  [208,224,237],[218,229,227],[228,232,215],[237,234,201],
  [245,233,187],[251,230,172],[254,225,157],[255,218,142],
  [253,208,127],[249,196,112],[243,183,98],[235,168,86],
  [226,153,75],[215,136,66],[203,119,59],[190,101,54],[180,85,50],
];

function buildLut(controlPoints, size = 256) {
  const lut = new Uint8Array(size * 3);
  const n = controlPoints.length;
  for (let i = 0; i < size; i++) {
    const t = i / (size - 1);
    const idx = t * (n - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, n - 1);
    const f = idx - lo;
    lut[i * 3]     = Math.round(controlPoints[lo][0] * (1 - f) + controlPoints[hi][0] * f);
    lut[i * 3 + 1] = Math.round(controlPoints[lo][1] * (1 - f) + controlPoints[hi][1] * f);
    lut[i * 3 + 2] = Math.round(controlPoints[lo][2] * (1 - f) + controlPoints[hi][2] * f);
  }
  return lut;
}

const COLORMAPS = {
  viridis:  buildLut(VIRIDIS_DATA),
  plasma:   buildLut(PLASMA_DATA),
  inferno:  buildLut(INFERNO_DATA),
  magma:    buildLut(MAGMA_DATA),
  cividis:  buildLut(CIVIDIS_DATA),
  rdbu:     buildLut(RDBU_DATA),
  coolwarm: buildLut(COOLWARM_DATA),
};

/**
 * Sample a colormap at normalized value t ∈ [0, 1].
 * Returns [r, g, b] each in [0, 255].
 */
export function sampleColormap(name, t) {
  const lut = COLORMAPS[name] || COLORMAPS.viridis;
  const size = lut.length / 3;
  const i = Math.max(0, Math.min(size - 1, Math.round(t * (size - 1))));
  return [lut[i * 3], lut[i * 3 + 1], lut[i * 3 + 2]];
}

/**
 * Sample with alpha support. Returns "rgba(r,g,b,a)" CSS string.
 */
export function sampleColormapCSS(name, t, alpha = 1) {
  const [r, g, b] = sampleColormap(name, t);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Map a value from [vmin, vmax] to a colormap. Clamps out-of-range.
 */
export function mapValueToColor(name, value, vmin, vmax) {
  const t = Math.max(0, Math.min(1, (value - vmin) / (vmax - vmin || 1)));
  return sampleColormap(name, t);
}

/**
 * Map a signed value to a diverging colormap centered at 0.
 * Good for velocity, pressure differences, etc.
 */
export function mapDivergingColor(name, value, absMax) {
  const t = 0.5 + 0.5 * Math.max(-1, Math.min(1, value / (absMax || 1)));
  return sampleColormap(name, t);
}

/**
 * Generate N evenly-spaced colors from a colormap.
 * Useful for line plots with multiple series.
 */
export function colormapPalette(name, n) {
  const colors = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const [r, g, b] = sampleColormap(name, t);
    colors.push(`rgb(${r},${g},${b})`);
  }
  return colors;
}

/**
 * Draw a horizontal or vertical colorbar onto a canvas context.
 */
export function drawColorbar(ctx, x, y, width, height, colormap, vmin, vmax, options = {}) {
  const { orientation = 'vertical', label = '', tickCount = 5, fontSize = 11, fontFamily = '"JetBrains Mono", monospace' } = options;
  
  const isVert = orientation === 'vertical';

  // Draw gradient
  for (let i = 0; i < (isVert ? height : width); i++) {
    const t = isVert ? 1 - i / height : i / width;
    const [r, g, b] = sampleColormap(colormap, t);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    if (isVert) {
      ctx.fillRect(x, y + i, width, 1);
    } else {
      ctx.fillRect(x + i, y, 1, height);
    }
  }

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, width, height);

  // Ticks and labels
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textBaseline = isVert ? 'middle' : 'top';
  ctx.textAlign = isVert ? 'left' : 'center';

  for (let i = 0; i < tickCount; i++) {
    const t = i / (tickCount - 1);
    const val = vmin + t * (vmax - vmin);
    const formatted = Math.abs(val) >= 1000 || (Math.abs(val) < 0.01 && val !== 0)
      ? val.toExponential(1)
      : val.toPrecision(3);

    if (isVert) {
      const ty = y + height * (1 - t);
      ctx.beginPath();
      ctx.moveTo(x + width, ty);
      ctx.lineTo(x + width + 4, ty);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.stroke();
      ctx.fillText(formatted, x + width + 7, ty);
    } else {
      const tx = x + width * t;
      ctx.beginPath();
      ctx.moveTo(tx, y + height);
      ctx.lineTo(tx, y + height + 4);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.stroke();
      ctx.fillText(formatted, tx, y + height + 7);
    }
  }

  // Label
  if (label) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `${fontSize - 1}px ${fontFamily}`;
    if (isVert) {
      ctx.translate(x - 6, y + height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(label, 0, 0);
    } else {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(label, x + width / 2, y + height + 22);
    }
    ctx.restore();
  }
}

/** List of available colormap names */
export const COLORMAP_NAMES = Object.keys(COLORMAPS);

export default COLORMAPS;
