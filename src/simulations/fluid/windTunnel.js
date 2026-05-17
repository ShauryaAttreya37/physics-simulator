/**
 * Wind Tunnel Simulation
 * High-Performance WebGL2 Navier-Stokes Fluid Dynamics
 */

const SHAPES = [
  { id: 'circle', name: 'Cylinder', cd: 1.2, cl: 0, st: 0.2 },
  { id: 'box', name: 'Flat Plate', cd: 1.98, cl: 0, st: 0.15 },
  { id: 'sphere3d', name: 'Sphere 3D', cd: 0.47, cl: 0, st: 0.19 },
  { id: 'airfoil', name: 'Airfoil', cd: 0.008, cl: 0.3, st: 0.0 },
  { id: 'f1car', name: 'F1 Car', cd: 0.8, cl: -1.5, st: 0.1 },
];

const AIR_DENSITY = 1.225;
const AIR_VISCOSITY = 1.81e-5;
const WIND_SPEED_TO_MPS = 0.1;
const TUNNEL_HEIGHT_M = 1.0;
const DEFAULT_SHAPE_X = 0.32;
const DEFAULT_SHAPE_Y = 0.5;
const DEFAULT_SHAPE_SIZE = 0.08;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cdForRe(shape, Re) {
  const base = shape.cd;
  if (shape.id === 'sphere3d') {
    if (Re < 1e3) return 24 / Re + 6 / (1 + Math.sqrt(Re)) + 0.4;
    if (Re < 2e5) return 0.47;
    if (Re < 4e5) return 0.47 - 0.27 * ((Re - 2e5) / 2e5);
    return 0.2;
  }
  if (shape.id === 'circle') {
    if (Re < 1e3) return 10 / Math.pow(Re, 0.5);
    if (Re < 3e5) return 1.2;
    if (Re < 6e5) return 1.2 - 0.9 * ((Re - 3e5) / 3e5);
    return 0.3;
  }
  if (shape.id === 'airfoil') {
    if (Re < 1e4) return 0.05;
    if (Re < 1e5) return 0.015;
    return 0.008;
  }
  return base;
}

function flowRegime(Re) {
  if (Re < 2300) return 'laminar';
  if (Re < 1e5) return 'transitional';
  return 'turbulent';
}

function characteristicLength(shapeSize = DEFAULT_SHAPE_SIZE) {
  return Math.max(0.04, shapeSize * 2 * TUNNEL_HEIGHT_M);
}

function referenceArea(shape, diameter) {
  if (shape.id === 'airfoil') return diameter * 0.24;
  if (shape.id === 'box') return diameter * 0.55;
  if (shape.id === 'f1car') return diameter * 0.4;
  return diameter;
}

export const defaultParams = {
  windSpeed: 150,
  shapeIdx: 0,
  viewMode: 0,
  showStreamlines: 1,
  shapeX: DEFAULT_SHAPE_X,
  shapeY: DEFAULT_SHAPE_Y,
  shapeSize: DEFAULT_SHAPE_SIZE,
};

export const controls = [
  { key: 'windSpeed', label: 'Wind Speed', min: 10, max: 220, step: 5 },
  {
    key: 'shapeIdx',
    label: 'Object Profile',
    type: 'tiles',
    tiles: SHAPES.map((s, i) => ({ value: i, label: s.name, sub: `Cd ${s.cd}` })),
  },
  {
    key: 'viewMode',
    label: 'Flow View',
    type: 'tiles',
    tiles: [
      { value: 0, label: 'Speed', sub: 'Fast vs slow air' },
      { value: 1, label: 'Wake', sub: 'Energy loss' },
      { value: 2, label: 'Vorticity', sub: 'Rotating flow' },
    ],
  },
  {
    key: 'showStreamlines',
    label: 'Streamlines',
    type: 'tiles',
    tiles: [
      { value: 0, label: 'Off' },
      { value: 1, label: 'On' },
    ],
  },
  { key: 'shapeX', label: 'Object X', min: 0.16, max: 0.72, step: 0.01 },
  { key: 'shapeY', label: 'Object Height', min: 0.2, max: 0.8, step: 0.01 },
  { key: 'shapeSize', label: 'Object Size', min: 0.04, max: 0.14, step: 0.01 },
];

export const equations = [];

export const equationSections = [
  {
    title: 'What You Are Seeing',
    content:
      'This wind tunnel shows a 2D incompressible flow field. Drag the model to see how the wake changes when the object moves closer to a wall. Use Speed view to compare fast and slow air, Wake view to see energy loss behind the model, and Vorticity view to spot rotating shear layers.',
  },
  {
    title: 'Velocity Heatmap Legend',
    content:
      'The Speed view shows local wind velocity using a color scale:\n\n• **Dark Blue:** Near zero speed (stagnation points in front of objects, or slow moving wake behind them).\n• **Light Blue/Cyan:** Baseline incoming wind speed.\n• **Green/Yellow:** Accelerated flow (air speeds up as it squeezes past the object).\n• **Red:** Maximum velocity (found at sharp corners or highly constricted areas).',
  },
  {
    title: 'Shape Aerodynamics & Vortex Shedding',
    content:
      'Different shapes dramatically alter the flow behavior:\n\n• **Bluff Bodies (Cylinder, Flat Plate):** Air struggles to follow the sharp curves or edges, causing it to "separate" from the surface. This creates a large, chaotic low-pressure wake behind the object, resulting in very high aerodynamic drag.\n• **Von Kármán Vortex Street:** When observing bluff bodies, you will notice an oscillating, snake-like pattern of alternating swirling vortices in the wake. This is called a Von Kármán vortex street. It happens because the shear layers on either side of the object become unstable, rolling up into vortices that detach (or "shed") in an alternating pattern. This phenomenon is critical in engineering, as it can cause dangerous structural vibrations (like singing power lines or bridge oscillations).\n• **Streamlined Bodies (Airfoil):** The smooth, tapering tail allows the high-speed air to gracefully decelerate and rejoin smoothly. This prevents flow separation, nearly eliminating the turbulent wake and drastically reducing form drag.\n• **F1 Car:** Engineered with complex geometries to cut through the air efficiently while generating downforce, balancing drag with grip.',
  },
  {
    title: 'Forces And Flow Numbers',
    equations: [
      {
        latex: String.raw`F_D = \frac{1}{2} \rho U^2 C_D A`,
        description:
          'Drag grows with the square of wind speed. Doubling the wind speed makes the drag about four times larger.',
      },
      {
        latex: String.raw`F_L = \frac{1}{2} \rho U^2 C_L A`,
        description:
          'Lift is the sideways force from asymmetric flow. Airfoils create lift by design; wall proximity can also create a lift bias.',
      },
      {
        latex: String.raw`Re = \frac{\rho U D}{\mu}`,
        description:
          'Reynolds number compares inertia with viscosity. Higher Re tends to produce thinner shear layers and more unstable wakes.',
      },
      {
        latex: String.raw`St = \frac{f D}{U}`,
        description:
          'The Strouhal relation estimates how often vortices shed behind bluff bodies like cylinders and flat plates.',
      },
      {
        latex: String.raw`\beta = \frac{D}{H}`,
        description:
          'Blockage ratio compares model size D with tunnel height H. Large blockage makes tunnel measurements less representative of open air.',
      },
    ],
    variables: [
      { symbol: 'rho', description: 'Air density' },
      { symbol: 'U', description: 'Incoming wind speed' },
      { symbol: 'D', description: 'Characteristic model size' },
      { symbol: 'H', description: 'Tunnel height' },
      { symbol: 'mu', description: 'Dynamic viscosity of air' },
    ],
  },
  {
    title: 'Classroom Investigations',
    equations: [
      {
        latex: String.raw`q = \frac{1}{2}\rho U^2`,
        description:
          'Watch dynamic pressure in the readout while changing wind speed. It rises quadratically, not linearly.',
      },
      {
        latex: String.raw`f = \frac{St\,U}{D}`,
        description:
          'Increase model size and notice the predicted shedding frequency drops. Increase wind speed and it rises.',
      },
    ],
    content:
      'Try three quick experiments: compare cylinder vs airfoil drag, move the cylinder toward the upper wall to see wall interference, then switch to Vorticity view and look for the paired shear layers coming off the model.',
  },
  {
    title: 'How to Use',
    content:
      'Drag the model directly inside the tunnel, or use Object X and Object Height for precise placement. Use Object Size to change blockage ratio. Keep the readout open and compare visual changes with Reynolds number, drag, lift, dynamic pressure, and wake shedding frequency.',
  },
];

export const graphParams = [
  { key: 'forceD', label: 'Drag Force', color: '#f97316' },
  { key: 'forceL', label: 'Lift Force', color: '#22d3ee' },
  { key: 'dynamicPressure', label: 'Dynamic Pressure', color: '#a78bfa' },
  { key: 'stepR', label: 'Reynolds Number', color: '#4ade80' },
  { key: 'wakeFrequency', label: 'Vortex Shedding', color: '#f43f5e' },
  { key: 'blockage', label: 'Blockage Ratio', color: '#facc15' },
];

// --- WebGL2 Fluid Solver ---

const vsh = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fshAdvection = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;

vec4 bilerp(sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 f = fract(st);
    vec4 a = texture(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
    vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
    fragColor = dissipation * bilerp(uSource, coord, texelSize);
}`;

const fshDivergence = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform vec2 texelSize;

void main() {
    float L = texture(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
    float B = texture(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
    vec2 C = texture(uVelocity, vUv).xy;
    
    if (vUv.x - texelSize.x < 0.0) L = C.x;
    if (vUv.x + texelSize.x > 1.0) R = C.x;
    if (vUv.y - texelSize.y < 0.0) B = -C.y;
    if (vUv.y + texelSize.y > 1.0) T = -C.y;

    float div = 0.5 * ((R - L) + (T - B));
    fragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const fshJacobi = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 texelSize;

void main() {
    float L = texture(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    float C = texture(uPressure, vUv).x;
    
    if (vUv.x - texelSize.x < 0.0) L = C;
    if (vUv.x + texelSize.x > 1.0) R = C;
    if (vUv.y - texelSize.y < 0.0) B = C;
    if (vUv.y + texelSize.y > 1.0) T = C;

    float div = texture(uDivergence, vUv).x;
    float p = (L + R + B + T - div) * 0.25;
    fragColor = vec4(p, 0.0, 0.0, 1.0);
}`;

const fshGradient = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 texelSize;

void main() {
    float L = texture(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
    float R = texture(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
    float T = texture(uPressure, vUv + vec2(0.0, texelSize.y)).x;
    float B = texture(uPressure, vUv - vec2(0.0, texelSize.y)).x;
    float C = texture(uPressure, vUv).x;
    
    if (vUv.x - texelSize.x < 0.0) L = C;
    if (vUv.x + texelSize.x > 1.0) R = C;
    if (vUv.y - texelSize.y < 0.0) B = C;
    if (vUv.y + texelSize.y > 1.0) T = C;
    
    vec2 vel = texture(uVelocity, vUv).xy;
    vel.xy -= vec2(R - L, T - B) * 0.5;
    fragColor = vec4(vel, 0.0, 1.0);
}`;

const fshBoundary = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTarget;
uniform sampler2D uShapeTex;
uniform int uShape;
uniform float uAspect;
uniform vec2 uShapePos;
uniform float uShapeSize;
uniform int uIsVelocity;

float shapeDistance(vec2 d, int shape, float size) {
    if (shape == 0 || shape == 2) {
        return length(d) - size;
    }
    if (shape == 1) {
        vec2 q = abs(d) - vec2(size * 0.18, size * 0.95);
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    }
    if (shape == 3) {
        float W = size * 1.95;
        float H = size * 0.38;
        float x = clamp((d.x + W * 0.38) / W, 0.0, 1.0);
        float chordMask = step(-W * 0.38, d.x) * step(d.x, W * 0.62);
        float camber = -H * 0.12 * sin(3.14159265 * x);
        float halfThickness = H * 4.0 * x * (1.0 - x) * (1.0 - 0.2 * x);
        float airfoil = abs(d.y - camber) - halfThickness;
        float cap = min(abs(d.x + W * 0.38), abs(d.x - W * 0.62)) + H;
        return chordMask > 0.5 ? airfoil : cap;
    }
    if (shape == 4) {
        vec2 texUv = vec2((d.x + size * 1.5) / (size * 3.0), (d.y + size * 0.5) / (size * 1.0));
        if (texUv.x >= 0.0 && texUv.x <= 1.0 && texUv.y >= 0.0 && texUv.y <= 1.0) {
            float alpha = texture(uShapeTex, vec2(texUv.x, texUv.y)).a;
            if (alpha > 0.9) return -1.0;
        }
        return 1.0;
    }
    return abs(d.x) + abs(d.y) - size * 0.82;
}

void main() {
    vec4 base = texture(uTarget, vUv);
    vec2 d = vUv - uShapePos;
    d.x *= uAspect;
    bool inside = shapeDistance(d, uShape, uShapeSize) < 0.0;
    
    if (inside) {
        if (uIsVelocity == 1) base.xy = vec2(0.0);
        else base.rgb = vec3(0.0);
    }
    
    if (vUv.y < 0.01 || vUv.y > 0.99) {
        if (uIsVelocity == 1) base.xy = vec2(0.0);
    }
    
    fragColor = base;
}`;

const fshInjection = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTarget;
uniform int uIsVelocity;
uniform float uWindSpeed;
uniform int uShowStreamlines;
uniform int uFillDomain;
uniform float uTime;

void main() {
    vec4 base = texture(uTarget, vUv);
    
    if (uFillDomain == 1 || vUv.x < 0.02) {
        if (uIsVelocity == 1) {
            float noise = fract(sin(dot(vUv.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453);
            vec2 seededWind = vec2(uWindSpeed, 0.0);
            vec2 inletWind = vec2(uWindSpeed + (noise - 0.5) * uWindSpeed * 0.05, (noise - 0.5) * uWindSpeed * 0.05);
            base.xy = uFillDomain == 1 ? seededWind : inletWind;
        } else {
            if (uShowStreamlines == 1) {
                float stripes = sin(vUv.y * 100.0);
                float stripe = smoothstep(0.92, 1.0, stripes);
                base.rgb = mix(base.rgb * 0.92, vec3(0.28, 0.55, 0.78), stripe);
            } else {
                base.rgb *= 0.9; // fade out
            }
        }
    }
    
    fragColor = base;
}`;

const fshDisplay = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uVelocity;
uniform sampler2D uDye;
uniform vec2 texelSize;
uniform int uViewMode;
uniform int uShowStreamlines;
uniform int uShape; 
uniform vec2 uShapePos;
uniform float uAspect;
uniform float uShapeSize;
uniform float uWindSpeed;
uniform int uDragging;
uniform sampler2D uShapeTex;

vec3 speedPalette(float v) {
    float t = clamp(v, 0.0, 1.0);
    vec3 deep = vec3(0.025, 0.08, 0.18);
    vec3 blue = vec3(0.06, 0.32, 0.58);
    vec3 cyan = vec3(0.10, 0.72, 0.82);
    vec3 green = vec3(0.35, 0.82, 0.48);
    vec3 amber = vec3(0.98, 0.72, 0.20);
    vec3 red = vec3(0.92, 0.20, 0.18);
    if (t < 0.20) return mix(deep, blue, t / 0.20);
    if (t < 0.45) return mix(blue, cyan, (t - 0.20) / 0.25);
    if (t < 0.68) return mix(cyan, green, (t - 0.45) / 0.23);
    if (t < 0.86) return mix(green, amber, (t - 0.68) / 0.18);
    return mix(amber, red, (t - 0.86) / 0.14);
}

float shapeDistance(vec2 d, int shape, float size) {
    if (shape == 0 || shape == 2) return length(d) - size;
    if (shape == 1) {
        vec2 q = abs(d) - vec2(size * 0.18, size * 0.95);
        return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    }
    if (shape == 3) {
        float W = size * 1.95;
        float H = size * 0.38;
        float x = clamp((d.x + W * 0.38) / W, 0.0, 1.0);
        float chordMask = step(-W * 0.38, d.x) * step(d.x, W * 0.62);
        float camber = -H * 0.12 * sin(3.14159265 * x);
        float halfThickness = H * 4.0 * x * (1.0 - x) * (1.0 - 0.2 * x);
        float airfoil = abs(d.y - camber) - halfThickness;
        float cap = min(abs(d.x + W * 0.38), abs(d.x - W * 0.62)) + H;
        return chordMask > 0.5 ? airfoil : cap;
    }
    if (shape == 4) {
        vec2 texUv = vec2((d.x + size * 1.5) / (size * 3.0), (d.y + size * 0.5) / (size * 1.0));
        if (texUv.x >= 0.0 && texUv.x <= 1.0 && texUv.y >= 0.0 && texUv.y <= 1.0) {
            float alpha = texture(uShapeTex, vec2(texUv.x, texUv.y)).a;
            if (alpha > 0.9) return -1.0;
        }
        return 1.0;
    }
    return abs(d.x) + abs(d.y) - size * 0.82;
}

float lineMask(float value, float width) {
    return 1.0 - smoothstep(0.0, width, abs(value));
}

void main() {
    vec2 vel = texture(uVelocity, vUv).xy;
    vec4 dye = texture(uDye, vUv);
    vec2 left = texture(uVelocity, vUv - vec2(texelSize.x, 0.0)).xy;
    vec2 right = texture(uVelocity, vUv + vec2(texelSize.x, 0.0)).xy;
    vec2 top = texture(uVelocity, vUv + vec2(0.0, texelSize.y)).xy;
    vec2 bottom = texture(uVelocity, vUv - vec2(0.0, texelSize.y)).xy;
    
    vec3 tunnelBase = mix(vec3(0.015, 0.022, 0.040), vec3(0.025, 0.055, 0.080), vUv.x);
    vec3 color = tunnelBase;
    float speed = length(vel);
    float speedRatio = speed / max(uWindSpeed, 1.0);
    float curl = ((right.y - left.y) - (top.x - bottom.x)) * 0.5;
    
    if (uViewMode == 0) {
        color = speedPalette(speedRatio * 0.72);
    } else if (uViewMode == 1) {
        float deficit = clamp(1.0 - speedRatio, 0.0, 1.0);
        float acceleration = clamp(speedRatio - 1.0, 0.0, 1.0);
        color = mix(tunnelBase, vec3(0.06, 0.22, 0.42), 0.85 * deficit);
        color = mix(color, vec3(0.98, 0.66, 0.18), 0.65 * acceleration);
    } else {
        float spin = clamp(abs(curl) * 0.035, 0.0, 1.0);
        vec3 clockwise = vec3(0.04, 0.78, 0.95);
        vec3 counter = vec3(1.0, 0.36, 0.18);
        color = mix(tunnelBase, curl >= 0.0 ? clockwise : counter, spin);
        color += speedPalette(speedRatio * 0.35) * 0.18;
    }
    
    if (uShowStreamlines == 1) {
        float dyeStrength = clamp(max(max(dye.r, dye.g), dye.b), 0.0, 1.0);
        color = mix(color, vec3(0.78, 0.93, 1.0), dyeStrength * 0.36);
    }

    float wall = smoothstep(0.015, 0.0, vUv.y) + smoothstep(0.985, 1.0, vUv.y);
    float centerLine = lineMask(vUv.y - 0.5, 0.0015);
    float grid = max(lineMask(fract(vUv.x * 10.0) - 0.5, 0.008), lineMask(fract(vUv.y * 6.0) - 0.5, 0.006));
    color = mix(color, vec3(0.86, 0.91, 0.96), wall * 0.55);
    color += vec3(0.08, 0.12, 0.16) * grid * 0.18;
    color += vec3(0.8, 0.95, 1.0) * centerLine * 0.08;
    
    vec2 d = vUv - uShapePos;
    d.x *= uAspect;
    float sdf = shapeDistance(d, uShape, uShapeSize);
    bool inside = sdf < 0.0;
    
    if (inside) {
        if (uShape != 4) {
            vec2 n = normalize(d + vec2(0.0001, 0.0002));
            float light = 0.55 + 0.45 * dot(normalize(vec2(-0.7, 0.9)), n);
            vec3 steel = mix(vec3(0.18, 0.24, 0.30), vec3(0.82, 0.90, 0.94), light);
            color = uDragging == 1 ? mix(steel, vec3(1.0, 0.78, 0.28), 0.24) : steel;
        }
    } else {
        if (uShape != 4) {
            float outline = 1.0 - smoothstep(0.0, 0.012, abs(sdf));
            vec3 outlineColor = uDragging == 1 ? vec3(1.0, 0.76, 0.24) : vec3(0.80, 0.93, 1.0);
            color = mix(color, outlineColor, outline * 0.55);
        }
    }
    
    if (uShape == 4) {
        vec2 texUv = vec2((d.x + uShapeSize * 1.5) / (uShapeSize * 3.0), (d.y + uShapeSize * 0.5) / (uShapeSize * 1.0));
        if (texUv.x >= 0.0 && texUv.x <= 1.0 && texUv.y >= 0.0 && texUv.y <= 1.0) {
            vec4 tc = texture(uShapeTex, texUv);
            color = mix(color, tc.rgb, tc.a);
            if (uDragging == 1 && tc.a > 0.5) {
               color = mix(color, vec3(1.0, 0.76, 0.24), 0.2);
            }
        }
    }
    
    fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

export function create(canvas, initParams = {}, options = {}) {
  let p = { ...defaultParams, ...initParams };

  const gl = canvas.getContext('webgl2', { antialias: false, depth: false });
  if (!gl) {
    throw new Error('WebGL2 is required for the wind tunnel simulation.');
  }

  const ext1 = gl.getExtension('EXT_color_buffer_float');
  const ext2 = gl.getExtension('EXT_color_buffer_half_float');
  const ext3 = gl.getExtension('OES_texture_float_linear');
  const ext4 = gl.getExtension('OES_texture_half_float_linear');

  if (!ext1 && !ext2) {
    throw new Error('Wind Tunnel requires WebGL2 floating-point render targets.');
  }

  console.log('Wind Tunnel: WebGL2 context initialized.', {
    float_render: !!ext1,
    half_float_render: !!ext2,
    float_linear: !!ext3,
    half_float_linear: !!ext4,
  });

  gl.disable(gl.BLEND);
  gl.disable(gl.DEPTH_TEST);

  function createShader(type, source, label) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) || 'unknown shader compile error';
      gl.deleteShader(shader);
      throw new Error(`Wind Tunnel ${label} shader failed to compile: ${info}`);
    }
    return shader;
  }

  function createProgram(name, vsSource, fsSource) {
    const program = gl.createProgram();
    const vertexShader = createShader(gl.VERTEX_SHADER, vsSource, `${name} vertex`);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource, `${name} fragment`);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(program) || 'unknown program link error';
      gl.deleteProgram(program);
      throw new Error(`Wind Tunnel ${name} program failed to link: ${info}`);
    }

    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    const uniforms = new Map();
    for (let i = 0; i < uniformCount; i += 1) {
      const active = gl.getActiveUniform(program, i);
      if (!active) continue;
      const uniformName = active.name.replace(/\[0\]$/, '');
      uniforms.set(uniformName, {
        location: gl.getUniformLocation(program, uniformName),
        type: active.type,
      });
    }

    return { name, handle: program, uniforms };
  }

  const programs = {
    advection: createProgram('advection', vsh, fshAdvection),
    divergence: createProgram('divergence', vsh, fshDivergence),
    jacobi: createProgram('jacobi', vsh, fshJacobi),
    gradient: createProgram('gradient', vsh, fshGradient),
    boundary: createProgram('boundary', vsh, fshBoundary),
    injection: createProgram('injection', vsh, fshInjection),
    display: createProgram('display', vsh, fshDisplay),
  };

  const quadVBO = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  function bindQuad() {
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  function blit(target) {
    if (target == null) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      gl.viewport(0, 0, target.width, target.height);
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function framebufferStatusLabel(status) {
    const labels = {
      [gl.FRAMEBUFFER_INCOMPLETE_ATTACHMENT]: 'incomplete attachment',
      [gl.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT]: 'missing attachment',
      [gl.FRAMEBUFFER_INCOMPLETE_DIMENSIONS]: 'incomplete dimensions',
      [gl.FRAMEBUFFER_UNSUPPORTED]: 'unsupported format',
      [gl.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE]: 'incomplete multisample',
    };
    return labels[status] || `status ${status}`;
  }

  function createFBO(w, h, internalFormat, format, type, param) {
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteTexture(texture);
      gl.deleteFramebuffer(fbo);
      throw new Error(`Wind Tunnel framebuffer is incomplete: ${framebufferStatusLabel(status)}.`);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, fbo, width: w, height: h };
  }

  function createDoubleFBO(w, h, internalFormat, format, type, param) {
    const fbo1 = createFBO(w, h, internalFormat, format, type, param);
    const fbo2 = createFBO(w, h, internalFormat, format, type, param);
    return {
      read: fbo1,
      write: fbo2,
      swap() {
        const temp = this.read;
        this.read = this.write;
        this.write = temp;
      },
    };
  }

  const SIM_RES = 256; // Balanced simulation grid for stability
  let simRes = { w: SIM_RES, h: SIM_RES };
  let velocity, dye, pressure, divergence;
  let lastW = 0,
    lastH = 0;
  let destroyed = false;

  function deleteFBO(target) {
    if (!target) return;
    gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.fbo);
  }

  function deleteDoubleFBO(target) {
    if (!target) return;
    deleteFBO(target.read);
    deleteFBO(target.write);
  }

  function releaseFBOs() {
    deleteDoubleFBO(velocity);
    deleteDoubleFBO(dye);
    deleteDoubleFBO(pressure);
    deleteFBO(divergence);
    velocity = null;
    dye = null;
    pressure = null;
    divergence = null;
  }

  function clearFBO(target) {
    if (!target) return;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function clearDoubleFBO(target) {
    if (!target) return;
    clearFBO(target.read);
    clearFBO(target.write);
  }

  function initFBOs() {
    if (canvas.width <= 0 || canvas.height <= 0) {
      console.warn(
        'Wind Tunnel: Invalid canvas dimensions for FBO init.',
        canvas.width,
        canvas.height,
      );
      return;
    }
    const aspect = canvas.width / canvas.height;
    simRes.w = SIM_RES;
    simRes.h = Math.max(2, Math.floor(SIM_RES / aspect));

    console.log(`Wind Tunnel: Initializing FBOs at ${simRes.w}x${simRes.h}`);
    const type = gl.HALF_FLOAT;
    const internalFormat = gl.RGBA16F;
    const filter = ext4 ? gl.LINEAR : gl.NEAREST;

    if (velocity) {
      releaseFBOs();
    }

    velocity = createDoubleFBO(simRes.w, simRes.h, internalFormat, gl.RGBA, type, filter);
    dye = createDoubleFBO(simRes.w, simRes.h, internalFormat, gl.RGBA, type, filter);
    pressure = createDoubleFBO(simRes.w, simRes.h, internalFormat, gl.RGBA, type, gl.NEAREST);
    divergence = createFBO(simRes.w, simRes.h, internalFormat, gl.RGBA, type, gl.NEAREST);
    seedVelocityField();
  }

  function checkResize() {
    if (destroyed) return;
    if (canvas.width === 0 || canvas.height === 0) return;
    if (canvas.width !== lastW || canvas.height !== lastH || !velocity) {
      lastW = canvas.width;
      lastH = canvas.height;
      initFBOs();
    }
  }

  function setUniforms(program, uniforms) {
    gl.useProgram(program.handle);
    for (const [name, rawValue] of Object.entries(uniforms)) {
      const uniform = program.uniforms.get(name);
      if (!uniform || uniform.location === null) continue;

      const value =
        rawValue && typeof rawValue === 'object' && 'value' in rawValue ? rawValue.value : rawValue;

      switch (uniform.type) {
        case gl.SAMPLER_2D:
        case gl.SAMPLER_2D_SHADOW:
        case gl.SAMPLER_CUBE:
        case gl.INT:
        case gl.BOOL:
          gl.uniform1i(uniform.location, Number(value));
          break;
        case gl.FLOAT:
          gl.uniform1f(uniform.location, Number(value));
          break;
        case gl.FLOAT_VEC2:
          gl.uniform2f(uniform.location, value[0], value[1]);
          break;
        case gl.FLOAT_VEC3:
          gl.uniform3f(uniform.location, value[0], value[1], value[2]);
          break;
        default:
          throw new Error(`Wind Tunnel does not support uniform "${name}" on ${program.name}.`);
      }
    }
  }

  function bindTexture(texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    return unit;
  }

  let simTime = 0;
  let isDraggingObstacle = false;
  let currentPointerUv = null;
  let currentPointerClient = null;
  let isPointerInCanvas = false;

  const probeEl = document.createElement('div');
  probeEl.style.position = 'absolute';
  probeEl.style.pointerEvents = 'none';
  probeEl.style.background = 'rgba(15, 23, 42, 0.85)';
  probeEl.style.color = '#fff';
  probeEl.style.padding = '4px 8px';
  probeEl.style.borderRadius = '6px';
  probeEl.style.fontSize = '12px';
  probeEl.style.fontFamily = 'monospace';
  probeEl.style.transform = 'translate(-50%, -100%)';
  probeEl.style.marginTop = '-15px';
  probeEl.style.display = 'none';
  probeEl.style.zIndex = '100';
  probeEl.style.whiteSpace = 'nowrap';
  probeEl.style.border = '1px solid rgba(255, 255, 255, 0.1)';
  probeEl.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';

  // Will append to parent after init

  function getShapePosition() {
    return [
      clamp(Number(p.shapeX ?? DEFAULT_SHAPE_X), 0.12, 0.82),
      clamp(Number(p.shapeY ?? DEFAULT_SHAPE_Y), 0.16, 0.84),
    ];
  }

  function getShapeSize() {
    return clamp(Number(p.shapeSize ?? DEFAULT_SHAPE_SIZE), 0.035, 0.16);
  }

  function canvasEventToUv(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / Math.max(rect.width, 1);
    const y = 1 - (event.clientY - rect.top) / Math.max(rect.height, 1);
    return [clamp(x, 0, 1), clamp(y, 0, 1)];
  }

  function pointInObstacle(uv) {
    const [shapeX, shapeY] = getShapePosition();
    const shapeSize = getShapeSize();
    const aspect = simRes.w / Math.max(simRes.h, 1);
    const dx = (uv[0] - shapeX) * aspect;
    const dy = uv[1] - shapeY;
    const shape = SHAPES[p.shapeIdx] || SHAPES[0];

    if (shape.id === 'circle' || shape.id === 'sphere3d') {
      return Math.hypot(dx, dy) <= shapeSize * 1.2;
    }
    if (shape.id === 'box') {
      return Math.abs(dx) <= shapeSize * 0.28 && Math.abs(dy) <= shapeSize * 1.08;
    }
    if (shape.id === 'airfoil') {
      return dx >= -shapeSize * 0.9 && dx <= shapeSize * 1.25 && Math.abs(dy) <= shapeSize * 0.36;
    }
    if (shape.id === 'f1car') {
      return (
        dx >= -shapeSize * 1.5 &&
        dx <= shapeSize * 1.5 &&
        dy >= -shapeSize * 0.5 &&
        dy <= shapeSize * 0.5
      );
    }
    return Math.abs(dx) + Math.abs(dy) <= shapeSize * 1.05;
  }

  function resetObstacleTransients(clearDye = false) {
    clearDoubleFBO(pressure);
    clearFBO(divergence);
    if (clearDye) clearDoubleFBO(dye);
  }

  function setObstaclePosition(uv, notify = true) {
    const size = getShapeSize();
    const nextX = clamp(uv[0], 0.1 + size, 0.9 - size);
    const nextY = clamp(uv[1], 0.08 + size, 0.92 - size);
    if (Math.abs(nextX - p.shapeX) < 0.0005 && Math.abs(nextY - p.shapeY) < 0.0005) return;

    p = { ...p, shapeX: nextX, shapeY: nextY };
    resetObstacleTransients(false);
    if (notify) options.onParamChange?.({ shapeX: nextX, shapeY: nextY });
  }

  function handlePointerDown(event) {
    if (event.button !== 0 || destroyed) return;
    const uv = canvasEventToUv(event);
    if (!pointInObstacle(uv)) return;
    event.preventDefault();
    isDraggingObstacle = true;
    canvas.setPointerCapture?.(event.pointerId);
    canvas.style.cursor = 'grabbing';
    setObstaclePosition(uv, true);
  }

  function handlePointerMove(event) {
    const uv = canvasEventToUv(event);
    currentPointerUv = uv;
    currentPointerClient = { x: event.clientX, y: event.clientY };

    if (isDraggingObstacle) {
      event.preventDefault();
      setObstaclePosition(uv, true);
      return;
    }
    canvas.style.cursor = pointInObstacle(uv) ? 'grab' : 'crosshair';
  }

  function handlePointerLeave(event) {
    isPointerInCanvas = false;
    probeEl.style.display = 'none';
  }

  function handlePointerEnter(event) {
    isPointerInCanvas = true;
  }

  function handlePointerUp(event) {
    if (!isDraggingObstacle) return;
    isDraggingObstacle = false;
    canvas.releasePointerCapture?.(event.pointerId);
    canvas.style.cursor = pointInObstacle(canvasEventToUv(event)) ? 'grab' : 'crosshair';
  }

  function seedVelocityField() {
    if (!velocity) return;
    bindQuad();
    setUniforms(programs.injection, {
      uTarget: bindTexture(velocity.read.texture, 0),
      uIsVelocity: { type: 'int', value: 1 },
      uWindSpeed: p.windSpeed,
      uShowStreamlines: { type: 'int', value: 0 },
      uFillDomain: { type: 'int', value: 1 },
      uTime: simTime,
    });
    blit(velocity.write);
    velocity.swap();
  }

  function step(dt) {
    checkResize();
    if (!velocity) return;

    bindQuad();

    const texelSize = [1.0 / simRes.w, 1.0 / simRes.h];
    const aspect = simRes.w / simRes.h;

    const shapePos = getShapePosition();
    const shapeSize = getShapeSize();

    // 1. Advect Velocity
    setUniforms(programs.advection, {
      uVelocity: bindTexture(velocity.read.texture, 0),
      uSource: bindTexture(velocity.read.texture, 1),
      texelSize,
      dt,
      dissipation: 1.0,
    });
    blit(velocity.write);
    velocity.swap();

    // 2. Advect Dye
    setUniforms(programs.advection, {
      uVelocity: bindTexture(velocity.read.texture, 0),
      uSource: bindTexture(dye.read.texture, 1),
      texelSize,
      dt,
      dissipation: 0.998,
    });
    blit(dye.write);
    dye.swap();

    // 3. Inject Wind Velocity
    setUniforms(programs.injection, {
      uTarget: bindTexture(velocity.read.texture, 0),
      uIsVelocity: { type: 'int', value: 1 },
      uWindSpeed: p.windSpeed,
      uShowStreamlines: { type: 'int', value: 0 },
      uFillDomain: { type: 'int', value: 0 },
      uTime: simTime,
    });
    blit(velocity.write);
    velocity.swap();

    // 4. Inject Smoke Dye
    setUniforms(programs.injection, {
      uTarget: bindTexture(dye.read.texture, 0),
      uIsVelocity: { type: 'int', value: 0 },
      uWindSpeed: p.windSpeed,
      uShowStreamlines: { type: 'int', value: p.showStreamlines },
      uFillDomain: { type: 'int', value: 0 },
      uTime: simTime,
    });
    blit(dye.write);
    dye.swap();

    // Apply Obstacle to Velocity BEFORE Divergence
    setUniforms(programs.boundary, {
      uTarget: bindTexture(velocity.read.texture, 0),
      uShapeTex: bindTexture(f1Tex, 1),
      uShape: { type: 'int', value: p.shapeIdx },
      uAspect: aspect,
      uShapePos: shapePos,
      uShapeSize: shapeSize,
      uIsVelocity: { type: 'int', value: 1 },
    });
    blit(velocity.write);
    velocity.swap();

    // 5. Divergence
    setUniforms(programs.divergence, {
      uVelocity: bindTexture(velocity.read.texture, 0),
      texelSize,
    });
    blit(divergence);

    // 6. Clear Pressure (Stabilize)
    gl.bindFramebuffer(gl.FRAMEBUFFER, pressure.read.fbo);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // 7. Jacobi Iteration (Pressure solver)
    for (let i = 0; i < 40; i++) {
      setUniforms(programs.jacobi, {
        uPressure: bindTexture(pressure.read.texture, 0),
        uDivergence: bindTexture(divergence.texture, 1),
        texelSize,
      });
      blit(pressure.write);
      pressure.swap();
    }

    // 8. Gradient Subtraction
    setUniforms(programs.gradient, {
      uPressure: bindTexture(pressure.read.texture, 0),
      uVelocity: bindTexture(velocity.read.texture, 1),
      texelSize,
    });
    blit(velocity.write);
    velocity.swap();

    // Enforce No-Slip Obstacle Boundary AFTER projection
    setUniforms(programs.boundary, {
      uTarget: bindTexture(velocity.read.texture, 0),
      uShapeTex: bindTexture(f1Tex, 1),
      uShape: { type: 'int', value: p.shapeIdx },
      uAspect: aspect,
      uShapePos: shapePos,
      uShapeSize: shapeSize,
      uIsVelocity: { type: 'int', value: 1 },
    });
    blit(velocity.write);
    velocity.swap();

    // Enforce Dye Boundary
    setUniforms(programs.boundary, {
      uTarget: bindTexture(dye.read.texture, 0),
      uShapeTex: bindTexture(f1Tex, 1),
      uShape: { type: 'int', value: p.shapeIdx },
      uAspect: aspect,
      uShapePos: shapePos,
      uShapeSize: shapeSize,
      uIsVelocity: { type: 'int', value: 0 },
    });
    blit(dye.write);
    dye.swap();

    // 9. Display (Render to Screen)
    setUniforms(programs.display, {
      uVelocity: bindTexture(velocity.read.texture, 0),
      uDye: bindTexture(dye.read.texture, 1),
      uShapeTex: bindTexture(f1Tex, 2),
      texelSize,
      uViewMode: { type: 'int', value: p.viewMode },
      uShowStreamlines: { type: 'int', value: p.showStreamlines },
      uShape: { type: 'int', value: p.shapeIdx },
      uAspect: aspect,
      uShapePos: shapePos,
      uShapeSize: shapeSize,
      uWindSpeed: p.windSpeed,
      uDragging: { type: 'int', value: isDraggingObstacle ? 1 : 0 },
    });
    blit(null);

    if (isPointerInCanvas && currentPointerUv) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, velocity.read.fbo);
      const px = Math.floor(currentPointerUv[0] * simRes.w);
      const py = Math.floor(currentPointerUv[1] * simRes.h);

      const data = new Float32Array(4);
      gl.readPixels(px, py, 1, 1, gl.RGBA, gl.FLOAT, data);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      const vx = data[0];
      const vy = data[1];
      const speed = Math.hypot(vx, vy);
      const isInside = pointInObstacle(currentPointerUv);

      probeEl.style.display = 'block';
      const rect = canvas.getBoundingClientRect();
      probeEl.style.left = `${currentPointerClient.x - rect.left}px`;
      probeEl.style.top = `${currentPointerClient.y - rect.top}px`;

      if (isInside) {
        probeEl.innerText = 'Boundary / Solid';
        probeEl.style.color = '#94a3b8';
      } else {
        probeEl.innerText = `${(speed * 0.1).toFixed(1)} m/s`;
        probeEl.style.color = '#10b981';
      }
    }
  }

  let rafId,
    running = false;

  function loop() {
    if (!running) return;
    const dt = 0.016;
    simTime += dt;
    step(dt);
    rafId = requestAnimationFrame(loop);
  }

  canvas.style.cursor = 'crosshair';

  if (canvas.parentElement) {
    canvas.parentElement.style.position = 'relative';
    canvas.parentElement.appendChild(probeEl);
  }

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
  canvas.addEventListener('pointerleave', handlePointerLeave);
  canvas.addEventListener('pointerenter', handlePointerEnter);

  let f1Tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, f1Tex);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    1,
    1,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    new Uint8Array([0, 0, 0, 0]),
  );
  const f1Img = new Image();
  f1Img.src = '/f1_car.png';
  f1Img.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, f1Tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, f1Img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  };

  // Pre-initialization check
  checkResize();

  return {
    start() {
      if (destroyed) return;
      if (running) return;
      console.log('Wind Tunnel: Starting...');
      running = true;
      rafId = requestAnimationFrame(loop);
    },
    stop() {
      console.log('Wind Tunnel: Stopping...');
      running = false;
      cancelAnimationFrame(rafId);
    },
    reset() {
      this.stop();
      simTime = 0;
      clearDoubleFBO(velocity);
      clearDoubleFBO(dye);
      clearDoubleFBO(pressure);
      clearFBO(divergence);
      seedVelocityField();
      this.start();
    },
    destroy() {
      if (destroyed) return;
      this.stop();
      destroyed = true;
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('pointerenter', handlePointerEnter);
      if (probeEl && probeEl.parentElement) {
        probeEl.parentElement.removeChild(probeEl);
      }
      canvas.style.cursor = '';
      releaseFBOs();
      gl.deleteBuffer(quadVBO);
      Object.values(programs).forEach((program) => gl.deleteProgram(program.handle));
    },
    setParams(newP) {
      const shapeChanged =
        (Object.prototype.hasOwnProperty.call(newP, 'shapeIdx') && newP.shapeIdx !== p.shapeIdx) ||
        (Object.prototype.hasOwnProperty.call(newP, 'shapeSize') && newP.shapeSize !== p.shapeSize);
      const positionChanged =
        (Object.prototype.hasOwnProperty.call(newP, 'shapeX') && newP.shapeX !== p.shapeX) ||
        (Object.prototype.hasOwnProperty.call(newP, 'shapeY') && newP.shapeY !== p.shapeY);
      p = { ...p, ...newP };
      if (shapeChanged) {
        clearDoubleFBO(velocity);
        clearDoubleFBO(dye);
        clearDoubleFBO(pressure);
        clearFBO(divergence);
        seedVelocityField();
      } else if (positionChanged) {
        resetObstacleTransients(false);
      }
    },
    getData() {
      const sh = SHAPES[p.shapeIdx];
      const [shapeX, shapeY] = getShapePosition();
      const shapeSize = getShapeSize();
      const v = p.windSpeed * WIND_SPEED_TO_MPS;
      const D = characteristicLength(shapeSize);
      const Afront = referenceArea(sh, D);
      const Re = (AIR_DENSITY * v * D) / AIR_VISCOSITY;
      const Cd = cdForRe(sh, Re);
      const blockage = clamp(D / TUNNEL_HEIGHT_M, 0.01, 0.85);
      const wallBias = (shapeY - 0.5) * 2;
      const confinement = 1 + 0.5 * blockage + 0.28 * Math.abs(wallBias);
      const effectiveCd = Cd * confinement;
      const effectiveCl = (sh.cl || 0) - wallBias * blockage * 0.45;
      const q = 0.5 * AIR_DENSITY * v * v;
      const Fd = q * effectiveCd * Afront;
      const Fl = q * effectiveCl * Afront;
      const wakeFrequency = sh.st > 0 ? (sh.st * v) / D : 0;
      return {
        time: simTime,
        stepR: Re,
        forceD: Fd,
        forceL: Fl,
        dynamicPressure: q,
        velocity: v,
        cd: Cd,
        effectiveCd,
        cl: effectiveCl,
        wakeFrequency,
        blockage,
        wallBias,
        strouhal: sh.st,
        objectX: shapeX,
        objectY: shapeY,
        regimeCode: flowRegime(Re),
      };
    },
  };
}
