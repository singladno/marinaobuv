import sharp from 'sharp';

export interface ExtractedColor {
  hex: string;
  weight: number;
}

export interface ProductColorResult {
  dominant: ExtractedColor | null;
  secondary: ExtractedColor | null;
  palette: ExtractedColor[];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g)
    .toString(16)
    .padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const rl = srgbToLinear(r) * 100;
  const gl = srgbToLinear(g) * 100;
  const bl = srgbToLinear(b) * 100;

  // sRGB D65 -> XYZ
  const x = rl * 0.4124 + gl * 0.3576 + bl * 0.1805;
  const y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722;
  const z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505;

  const xr = x / 95.047;
  const yr = y / 100.0;
  const zr = z / 108.883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(xr);
  const fy = f(yr);
  const fz = f(zr);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b2 = 200 * (fy - fz);
  return [L, a, b2];
}

function deltaE(
  a: [number, number, number],
  b: [number, number, number]
): number {
  // CIE76 is fine for nearest-neighbor
  const dl = a[0] - b[0];
  const da = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dl * dl + da * da + db * db);
}

function kmeans(
  points: number[][],
  k: number,
  iters: number = 12
): { centers: number[][]; assignments: number[] } {
  if (points.length === 0) return { centers: [], assignments: [] };
  const centers: number[][] = [];
  const used = new Set<number>();
  while (centers.length < Math.min(k, points.length)) {
    const i = Math.floor(Math.random() * points.length);
    if (!used.has(i)) {
      used.add(i);
      centers.push(points[i].slice());
    }
  }
  const assignments = new Array(points.length).fill(0);
  const dist = (p: number[], c: number[]) => {
    // Euclidean in Lab
    let s = 0;
    for (let i = 0; i < p.length; i++) s += (p[i] - c[i]) * (p[i] - c[i]);
    return s;
  };
  for (let t = 0; t < iters; t++) {
    // assign
    for (let i = 0; i < points.length; i++) {
      let bi = 0;
      let bd = Infinity;
      for (let j = 0; j < centers.length; j++) {
        const d = dist(points[i], centers[j]);
        if (d < bd) {
          bd = d;
          bi = j;
        }
      }
      assignments[i] = bi;
    }
    // update
    const sums = centers.map(c => new Array(c.length).fill(0));
    const counts = centers.map(() => 0);
    for (let i = 0; i < points.length; i++) {
      const a = assignments[i];
      counts[a] += 1;
      const p = points[i];
      for (let d = 0; d < p.length; d++) sums[a][d] += p[d];
    }
    for (let j = 0; j < centers.length; j++) {
      if (counts[j] === 0) continue;
      for (let d = 0; d < centers[j].length; d++)
        centers[j][d] = sums[j][d] / counts[j];
    }
  }
  return { centers, assignments };
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

const namedPalette: Array<{ nameRu: string; hex: string }> = [
  { nameRu: 'черный', hex: '#000000' },
  { nameRu: 'белый', hex: '#FFFFFF' },
  { nameRu: 'бежевый', hex: '#D2B48C' },
  { nameRu: 'синий', hex: '#0000FF' },
  { nameRu: 'красный', hex: '#FF0000' },
  { nameRu: 'коричневый', hex: '#8B4513' },
  { nameRu: 'серый', hex: '#808080' },
  { nameRu: 'зелёный', hex: '#008000' },
  { nameRu: 'розовый', hex: '#FFC0CB' },
  { nameRu: 'фиолетовый', hex: '#800080' },
  { nameRu: 'бордовый', hex: '#800000' },
];

export function hexToNearestRuName(hex: string): string {
  const lab = rgbToLab(...hexToRgb(hex));
  let best = namedPalette[0];
  let bestD = Infinity;
  for (const c of namedPalette) {
    const d = deltaE(lab, rgbToLab(...hexToRgb(c.hex)));
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best.nameRu;
}

export async function extractProductColorsFromBuffer(
  buffer: Buffer
): Promise<ProductColorResult> {
  // Downscale for speed
  const size = 320;
  const img = sharp(buffer)
    .resize({ width: size, height: size, fit: 'inside' })
    .removeAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Precompute border background color (average 3% border)
  const border = Math.max(1, Math.floor(Math.min(w, h) * 0.03));
  let br = 0,
    bg = 0,
    bb = 0,
    bc = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x < border || x >= w - border || y < border || y >= h - border) {
        const i = (y * w + x) * 3;
        br += data[i + 0];
        bg += data[i + 1];
        bb += data[i + 2];
        bc += 1;
      }
    }
  }
  const bgr = br / bc;
  const bgg = bg / bc;
  const bgb = bb / bc;

  // Collect weighted pixels with product-aware weights (Lab + RGB)
  const points: number[][] = [];
  const pointsRgb: number[][] = [];
  const weights: number[] = [];
  const cx = w / 2;
  const cy = h / 2;
  const maxd2 = cx * cx + cy * cy;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const r = data[i + 0];
      const g = data[i + 1];
      const b = data[i + 2];

      // Drop near-white/black and low-saturation pixels
      const maxc = Math.max(r, g, b);
      const minc = Math.min(r, g, b);
      const sat = maxc === 0 ? 0 : (maxc - minc) / maxc; // 0..1
      if (maxc < 30) continue; // too dark (likely sole/shadow)
      if (maxc > 245 && minc > 220) continue; // too bright (highlight/white bg)
      if (sat < 0.08) continue; // very low saturation

      // Border background rejection via color distance in Lab
      const labPix = rgbToLab(r, g, b);
      const labBg = rgbToLab(bgr, bgg, bgb);
      if (deltaE(labPix, labBg) < 8) continue; // close to background -> skip

      // Center bias (Gaussian-ish)
      const dx = x - cx;
      const dy = y - cy;
      const d2 = dx * dx + dy * dy;
      const centerWeight = Math.exp(-d2 / (0.18 * maxd2)); // tighter center

      // Edge weight via simple gradient magnitude
      const gx = x + 1 < w ? data[i + 3] - r : 0;
      const gy = y + 1 < h ? data[i + w * 3] - r : 0;
      const edge = Math.min(1, Math.sqrt(gx * gx + gy * gy) / 64);

      const weight = 0.6 * centerWeight + 0.4 * edge;
      if (weight < 0.05) continue;

      const lab = labPix;
      points.push(lab);
      pointsRgb.push([r, g, b]);
      weights.push(weight);
    }
  }

  if (points.length < 50) {
    // Fallback: too few points
    return { dominant: null, secondary: null, palette: [] };
  }

  // Sample points to ~6000 for speed
  const target = 6000;
  const sampled: number[][] = [];
  const sampledRgb: number[][] = [];
  const sWeights: number[] = [];
  const step = Math.max(1, Math.floor(points.length / target));
  for (let i = 0; i < points.length; i += step) {
    sampled.push(points[i]);
    sampledRgb.push(pointsRgb[i]);
    sWeights.push(weights[i]);
  }

  // K-means in Lab
  const { centers, assignments } = kmeans(sampled, 4);
  const clusterWeights = new Array(centers.length).fill(0);
  const clusterRgbSums: Array<[number, number, number]> = new Array(
    centers.length
  )
    .fill(0)
    .map(() => [0, 0, 0]);
  for (let i = 0; i < sampled.length; i++) {
    const a = assignments[i];
    const wgt = sWeights[i];
    clusterWeights[a] += wgt;
    const [rr, gg, bb] = sampledRgb[i];
    clusterRgbSums[a][0] += rr * wgt;
    clusterRgbSums[a][1] += gg * wgt;
    clusterRgbSums[a][2] += bb * wgt;
  }

  // Rank clusters by weight
  const order = centers
    .map((c, idx) => ({ idx, w: clusterWeights[idx] }))
    .sort((a, b) => b.w - a.w)
    .map(x => x.idx);

  const palette: ExtractedColor[] = [];
  const totalW = clusterWeights.reduce((a, b) => a + b, 0) || 1;
  for (let oi = 0; oi < order.length; oi++) {
    const ci = order[oi];
    const w = clusterWeights[ci];
    if (w <= 0) continue;
    const avgR = clusterRgbSums[ci][0] / w;
    const avgG = clusterRgbSums[ci][1] / w;
    const avgB = clusterRgbSums[ci][2] / w;
    palette.push({ hex: toHex(avgR, avgG, avgB), weight: w / totalW });
  }

  const dominant = palette[0] || null;
  const secondary = palette[1] || null;

  return { dominant, secondary, palette };
}

export async function extractDominantProductHex(
  buffer: Buffer
): Promise<string | null> {
  const { dominant } = await extractProductColorsFromBuffer(buffer);
  return dominant ? dominant.hex : null;
}
