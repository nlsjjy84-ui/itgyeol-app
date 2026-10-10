import { getDna, THREE, mesh, group, lathe, cyl, torus, sphere, rbox, tube, tassel, knot, plaque, slab, texMat, extrudeShape, planarUV,
} from './kit';

// 만들어 가져가는 물건(굿즈) 형태: 브로치 · 마그넷 · 스티커. 같은 조각보 그림이 형태만 바뀌어 입혀진다.

function flowerShape(R, petals = 8, depth = 0.16) {
  const s = new THREE.Shape();
  const n = 160;
  for (let i = 0; i <= n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const r = R * (1 + depth * Math.cos(a * petals));
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  return s;
}

function octagonShape(R) {
  const s = new THREE.Shape();
  for (let i = 0; i < 8; i += 1) {
    const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
    if (i === 0) s.moveTo(Math.cos(a) * R, Math.sin(a) * R);
    else s.lineTo(Math.cos(a) * R, Math.sin(a) * R);
  }
  s.closePath();
  return s;
}

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function gourdShape(scale = 1) {
  // 호리병 윤곽: 아래 큰 공 + 위 작은 공이 잘록하게 이어진다
  const pts = [];
  const w = (y) => {
    const a = Math.sqrt(Math.max(0, 0.72 * 0.72 - (y + 0.45) * (y + 0.45)));
    const b = Math.sqrt(Math.max(0, 0.46 * 0.46 - (y - 0.62) * (y - 0.62)));
    const k = 14;
    return Math.log(Math.exp(k * a) + Math.exp(k * b)) / k;
  };
  const yMin = -1.17;
  const yMax = 1.08;
  for (let i = 0; i <= 80; i += 1) {
    const y = yMax - (i / 80) * (yMax - yMin);
    pts.push([w(y), y]);
  }
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x * scale, y * scale) : s.lineTo(x * scale, y * scale)));
  [...pts].reverse().forEach(([x, y]) => s.lineTo(-x * scale, y * scale));
  s.closePath();
  return s;
}

// ───────── 브로치 ─────────
function pinBack(m, w) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(w, 0.06, 0.02), m.silver, [0, 0, -0.01]));
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, w * 0.9, 12), m.silver, [0, 0.02, -0.06], [0, 0, Math.PI / 2]));
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, w * 0.82, 8), m.silver, [0, -0.04, -0.1], [0, 0, Math.PI / 2]));
  g.add(mesh(new THREE.SphereGeometry(0.05, 10, 8), m.silver, [w * 0.42, -0.04, -0.1]));
  g.add(mesh(new THREE.BoxGeometry(0.12, 0.1, 0.08), m.silver, [-w * 0.46, 0, -0.05]));
  return g;
}

export const broochRound = ({ tex, m }) => {
  const g = new THREE.Group();
  g.add(plaque(0.9, 0.1, texMat(tex), m.brass, m.gold));
  g.add(mesh(new THREE.TorusGeometry(0.9, 0.065, 14, 64), m.gold, [0, 0, 0.05]));
  g.add(mesh(new THREE.TorusGeometry(0.9, 0.065, 14, 64), m.gold, [0, 0, -0.05]));
  const pin = pinBack(m, 1.1);
  pin.position.set(0, 0, -0.05);
  g.add(pin);
  return g;
};

export const broochSquare = ({ tex, m }) => {
  const g = new THREE.Group();
  g.add(slab(1.6, 1.6, 0.1, texMat(tex), m.brass, m.gold, 0.1));
  [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]].forEach(([x, y]) => [0.06, -0.06].forEach((z) => g.add(mesh(new THREE.SphereGeometry(0.07, 12, 10), m.gold, [x, y, z]))));
  const pin = pinBack(m, 1.2);
  pin.position.set(0, 0, -0.05);
  g.add(pin);
  return g;
};

export const broochFlower = ({ tex, m }) => {
  const g = new THREE.Group();
  g.add(extrudeShape(flowerShape(1.0, getDna().k ? getDna().petals : 8, getDna().k ? getDna().petalDepth : 0.14), 0.1, texMat(tex), m.gold, 0.035));
  const pin = pinBack(m, 1.2);
  pin.position.set(0, 0, -0.1);
  g.add(pin);
  return g;
};

// ───────── 마그넷 ─────────
function lens(r, mat, flat = 0.35) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  s.rotation.x = Math.PI / 2;
  s.scale.set(1, flat, 1);
  return s;
}

export const magnetRound = ({ tex, m }) => {
  const g = new THREE.Group();
  g.add(plaque(0.95, 0.12, texMat(tex), m.rubber, m.rubber));
  const dome = lens(0.95, m.glass, 0.2);
  dome.position.z = 0.06;
  g.add(dome);
  g.add(mesh(new THREE.TorusGeometry(0.95, 0.03, 10, 64), m.silver, [0, 0, 0.0]));
  g.add(mesh(new THREE.CircleGeometry(0.75, 48), m.rubber, [0, 0, -0.065], [0, Math.PI, 0]));
  return g;
};

export const magnetSquare = ({ tex, m }) => {
  const g = new THREE.Group();
  g.add(slab(1.7, 1.7, 0.14, texMat(tex), m.rubber, m.rubber, 0.12));
  g.add(mesh(new THREE.BoxGeometry(1.68, 1.68, 0.05), m.glass, [0, 0, 0.1]));
  return g;
};

export const magnetOctagon = ({ tex, m }) => {
  const g = new THREE.Group();
  g.add(extrudeShape(octagonShape(1.0), 0.14, texMat(tex), m.rubber, 0.03));
  const top = new THREE.Mesh(new THREE.ExtrudeGeometry(octagonShape(0.99), { depth: 0.05, bevelEnabled: false }), m.glass);
  top.position.z = 0.075;
  g.add(top);
  return g;
};

// ───────── 스티커 ─────────
export const stickerRound = ({ tex, m }) => {
  const g = new THREE.Group();
  g.add(plaque(1.0, 0.03, m.paper, m.paper, m.paper));
  const f = new THREE.Mesh(new THREE.CircleGeometry(0.88, 64), texMat(tex));
  f.position.z = 0.018;
  g.add(f);
  g.add(mesh(new THREE.CircleGeometry(0.88, 64), m.paper, [0, 0, -0.018], [0, Math.PI, 0]));
  return g;
};

export const stickerSquare = ({ tex, m }) => {
  const g = new THREE.Group();
  g.add(extrudeShape(roundedRectShape(1.9, 1.9, 0.18), 0.03, m.paper, m.paper, 0.0));
  const f = new THREE.Mesh(new THREE.ShapeGeometry(roundedRectShape(1.66, 1.66, 0.12), 24), texMat(tex));
  planarUV(f.geometry);
  f.position.z = 0.0185;
  g.add(f);
  return g;
};

export const stickerGourd = ({ tex, m }) => {
  const g = new THREE.Group();
  g.add(extrudeShape(gourdShape(1.0), 0.03, m.paper, m.paper, 0.0));
  const f = new THREE.Mesh(new THREE.ShapeGeometry(gourdShape(0.9), 24), texMat(tex));
  planarUV(f.geometry);
  f.position.z = 0.0185;
  g.add(f);
  return g;
};
