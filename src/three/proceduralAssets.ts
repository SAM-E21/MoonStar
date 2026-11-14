import * as THREE from 'three';

// Deterministic terrain height at (x, z): flat central landing pad (<18m)
// transitioning into polar crater ridges and rolling lunar regolith.
export function groundHeightAt(x: number, z: number): number {
  const r = Math.hypot(x, z);
  if (r < 17) {
    return 0;
  }
  const blend = THREE.MathUtils.smoothstep(r, 17, 28);
  const ridge =
    Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.4 +
    Math.sin(x * 0.19 + 1.1) * Math.sin(z * 0.16 - 0.5) * 0.55;

  // Add a dramatic crater depression around (28, -24) and rim around perimeter
  const craterDist = Math.hypot(x - 28, z + 24);
  const crater =
    craterDist < 12
      ? -1.8 * (1 - craterDist / 12) + Math.exp(-Math.pow((craterDist - 11.5) / 2.2, 2)) * 1.3
      : 0;

  const crater2Dist = Math.hypot(x + 30, z - 22);
  const crater2 =
    crater2Dist < 10
      ? -1.5 * (1 - crater2Dist / 10) + Math.exp(-Math.pow((crater2Dist - 9.5) / 2.0, 2)) * 1.1
      : 0;

  const rim = r > 42 ? Math.pow((r - 42) * 0.12, 1.35) : 0;

  return blend * (ridge + crater + crater2 + rim);
}

function createSeededRandom(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createLunarRegolithTextures(maxAnisotropy: number) {
  const size = 512;
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const aCtx = albedoCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const rand = createSeededRandom(2026);

  aCtx.fillStyle = '#5c626e';
  aCtx.fillRect(0, 0, size, size);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  // Fine mineral grain
  for (let i = 0; i < 6500; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 0.6 + rand() * 1.8;
    const v = Math.floor(72 + rand() * 58);
    aCtx.fillStyle = `rgb(${v}, ${v + 3}, ${v + 8})`;
    aCtx.fillRect(x, y, r, r);

    const bv = Math.floor(100 + rand() * 56);
    bCtx.fillStyle = `rgb(${bv}, ${bv}, ${bv})`;
    bCtx.fillRect(x, y, r, r);
  }

  // Micro-craters
  for (let i = 0; i < 42; i++) {
    const cx = rand() * size;
    const cy = rand() * size;
    const cr = 5 + rand() * 18;

    const grad = bCtx.createRadialGradient(cx, cy, cr * 0.1, cx, cy, cr);
    grad.addColorStop(0, 'rgba(60, 60, 60, 0.7)');
    grad.addColorStop(0.75, 'rgba(185, 185, 185, 0.45)');
    grad.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bCtx.fillStyle = grad;
    bCtx.beginPath();
    bCtx.arc(cx, cy, cr, 0, Math.PI * 2);
    bCtx.fill();

    const aGrad = aCtx.createRadialGradient(cx, cy, cr * 0.15, cx, cy, cr);
    aGrad.addColorStop(0, 'rgba(58, 62, 70, 0.45)');
    aGrad.addColorStop(0.8, 'rgba(125, 132, 144, 0.35)');
    aGrad.addColorStop(1, 'rgba(92, 98, 110, 0)');
    aCtx.fillStyle = aGrad;
    aCtx.beginPath();
    aCtx.arc(cx, cy, cr, 0, Math.PI * 2);
    aCtx.fill();
  }

  const albedoMap = new THREE.CanvasTexture(albedoCanvas);
  albedoMap.colorSpace = THREE.SRGBColorSpace;
  albedoMap.wrapS = THREE.RepeatWrapping;
  albedoMap.wrapT = THREE.RepeatWrapping;
  albedoMap.repeat.set(14, 14);
  albedoMap.anisotropy = maxAnisotropy;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(14, 14);
  bumpMap.anisotropy = maxAnisotropy;

  return { albedoMap, bumpMap };
}

export function createSolarCellTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#091b3a';
  ctx.fillRect(0, 0, size, size);

  const cols = 8;
  const rows = 8;
  const cw = size / cols;
  const ch = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#0d2b5e' : '#0b2450';
      ctx.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 4);
      ctx.fillStyle = 'rgba(125, 211, 252, 0.16)';
      ctx.fillRect(c * cw + 3, r * ch + 3, cw - 6, 2);
    }
  }

  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  for (let i = 0; i <= cols; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cw, 0);
    ctx.lineTo(i * cw, size);
    ctx.stroke();
  }
  for (let j = 0; j <= rows; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * ch);
    ctx.lineTo(size, j * ch);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createHullPanelTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d8dee9';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      ctx.strokeRect(i * 64 + 2, j * 64 + 2, 60, 60);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(i * 64 + 6, j * 64 + 6, 3, 3);
      ctx.fillRect(i * 64 + 55, j * 64 + 55, 3, 3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createEarthTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, h);
  oceanGrad.addColorStop(0, '#cfe8ff');
  oceanGrad.addColorStop(0.12, '#1d4ed8');
  oceanGrad.addColorStop(0.5, '#1e40af');
  oceanGrad.addColorStop(0.88, '#1d4ed8');
  oceanGrad.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, w, h);

  // Stylized continents
  const rand = createSeededRandom(42);
  ctx.fillStyle = '#3b8d5f';
  for (let i = 0; i < 22; i++) {
    const cx = 40 + rand() * (w - 80);
    const cy = 48 + rand() * (h - 96);
    const rx = 18 + rand() * 44;
    const ry = 12 + rand() * 28;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cloud swirls
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  for (let i = 0; i < 28; i++) {
    const cx = rand() * w;
    const cy = 20 + rand() * (h - 40);
    const rx = 25 + rand() * 70;
    const ry = 4 + rand() * 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, (rand() - 0.5) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createRadialShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
