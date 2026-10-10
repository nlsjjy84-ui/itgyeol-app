import {
  THREE, mesh, group, lathe, cyl, torus, sphere, rbox, tube, tassel, knot, plaque, slab, texMat, extrudeShape, planarUV,
} from './kit';

// ───────── 붓 ─────────
function brushHair(r, len, m, tipMat) {
  // 털(붓촉): 아래로 뾰족해지는 회전체
  const pts = [[0, -len], [r * 0.25, -len * 0.92], [r * 0.7, -len * 0.62], [r * 1.0, -len * 0.25], [r * 0.95, 0], [0.001, 0]];
  const g = new THREE.Group();
  g.add(lathe(pts, m.paper, 32));
  g.add(lathe([[0, -len], [r * 0.25, -len * 0.92], [r * 0.5, -len * 0.78], [0.001, -len * 0.78]], tipMat, 24));
  return g;
}

function brushPen(bandW, bandH, wrapMat, m, hairR, hairLen, handleLen) {
  // 붓 한 자루: 붓대 + 가운데 조각보 띠 + 위 마개 + 털
  const g = new THREE.Group();
  g.add(lathe([[0, 0], [bandW * 0.55, 0], [bandW * 0.5, handleLen * 0.12], [bandW * 0.5, handleLen], [bandW * 0.7, handleLen + 0.06], [0.001, handleLen + 0.12]], m.woodDark, 32));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(bandW * 0.52, bandW * 0.52, bandH, 56, 1, true), wrapMat);
  band.position.set(0, handleLen * 0.58, 0);
  g.add(band);
  [-1, 1].forEach((s) => g.add(mesh(new THREE.TorusGeometry(bandW * 0.53, bandW * 0.06, 10, 40), m.gold, [0, handleLen * 0.58 + s * bandH / 2, 0], [Math.PI / 2, 0, 0])));
  const hair = brushHair(hairR, hairLen, m, m.ink);
  g.add(hair);
  g.add(mesh(new THREE.CylinderGeometry(hairR * 1.03, bandW * 0.55, hairLen * 0.12, 24), m.bone || m.woodLight, [0, 0.02, 0]));
  return g;
}

export const brushLarge = ({ tex, m }) => {
  const wrap = texMat(tex, { side: THREE.DoubleSide });
  const g = brushPen(0.56, 1.35, wrap, m, 0.4, 1.45, 3.0);
  g.position.y = -1.0;
  return g;
};

export const brushStand = ({ tex, m }) => {
  // 필가: 조각보 뒷판에 붓을 걸어 두는 나무 걸이
  const face = texMat(tex);
  const g = new THREE.Group();
  g.add(slab(1.7, 2.0, 0.1, face, m.woodLight, m.wood, 0.06));
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.1, 0.22), m.woodDark, [0, 1.05, 0.06]));
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.1, 0.22), m.woodDark, [0, -1.05, 0.06]));
  [[-0.55, -0.28], [0.55, -0.28]].forEach(([x, y]) => g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 12), m.woodDark, [x, y, 0.2], [Math.PI / 2, 0, 0])));
  const pen = brushPen(0.07, 0.5, texMat(tex, { side: THREE.DoubleSide }), m, 0.075, 0.5, 1.7);
  pen.rotation.set(0, 0, -Math.PI / 2 + 0.0);
  pen.position.set(0.95, -0.28, 0.32);
  g.add(pen);
  return g;
};

export const brushPot = ({ tex, m }) => {
  // 필통: 조각보를 둘러 감은 원통에 붓 세 자루
  const wrap = texMat(tex, { repeat: [3, 1], side: THREE.DoubleSide });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.68, 1.5, 72, 1, true), wrap));
  g.add(mesh(new THREE.CircleGeometry(0.68, 40), m.woodDark, [0, -0.75, 0], [-Math.PI / 2, 0, 0]));
  [0.75, -0.75].forEach((y) => g.add(mesh(new THREE.TorusGeometry(0.71, 0.05, 12, 64), m.gold, [0, y, 0], [Math.PI / 2, 0, 0])));
  [[-0.22, -0.18, 0.12], [0.26, 0.2, -0.1], [0.04, 0.3, 0.0]].forEach(([x, z, tilt], i) => {
    const pen = brushPen(0.05, 0.4, wrap, m, 0.06, 0.4, 1.7);
    pen.rotation.z = tilt;
    pen.position.set(x, -0.25 + i * 0.05, z);
    g.add(pen);
  });
  return g;
};

// ───────── 먹 ─────────
export const inkBar = ({ tex, m }) => {
  const face = texMat(tex);
  const g = new THREE.Group();
  g.add(rbox(1.0, 2.5, 0.28, m.ink, 0.08));
  const inlay = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.76), face);
  inlay.position.set(0, 0.45, 0.1475);
  g.add(inlay);
  const inlayB = inlay.clone();
  inlayB.position.z = -0.1475;
  inlayB.rotation.y = Math.PI;
  g.add(inlayB);
  [0.145, -0.145].forEach((z) => {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.84, 0.006), m.gold);
    e.position.set(0, 0.45, z * 0.97);
    g.add(e);
  });
  // 아래 칸: 금빛 줄무늬 장식
  [-0.35, -0.55, -0.75].forEach((y) => [0.145, -0.145].forEach((z) => g.add(mesh(new THREE.BoxGeometry(0.62, 0.025, 0.01), m.gold, [0, y, z * 0.995]))));
  return g;
};

export const inkRound = ({ tex, m }) => {
  const face = texMat(tex);
  const g = new THREE.Group();
  g.add(plaque(0.95, 0.3, face, face, m.ink));
  g.add(mesh(new THREE.TorusGeometry(0.95, 0.04, 10, 64), m.gold, [0, 0, 0.15]));
  g.add(mesh(new THREE.TorusGeometry(0.95, 0.04, 10, 64), m.gold, [0, 0, -0.15]));
  return g;
};

export const inkHalf = ({ tex, m }) => {
  const s = new THREE.Shape();
  s.absarc(0, 0, 1.1, 0, Math.PI, false);
  s.lineTo(1.1, 0);
  const geo = extrudeShape(s, 0.28, texMat(tex), m.ink, 0.05);
  const g = new THREE.Group();
  g.add(geo);
  g.children[0].position.y = -0.4;
  return g;
};

// ───────── 부채 ─────────
function sectorShape(r1, r2, a0, a1) {
  const s = new THREE.Shape();
  s.moveTo(Math.cos(a0) * r1, Math.sin(a0) * r1);
  s.lineTo(Math.cos(a0) * r2, Math.sin(a0) * r2);
  s.absarc(0, 0, r2, a0, a1, false);
  s.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
  s.absarc(0, 0, r1, a1, a0, true);
  return s;
}

export const fanFolding = ({ tex, m }) => {
  const face = texMat(tex, { side: THREE.DoubleSide });
  const g = new THREE.Group();
  const a0 = Math.PI / 2 - 1.2;
  const a1 = Math.PI / 2 + 1.2;
  const geo = new THREE.ShapeGeometry(sectorShape(0.75, 2.5, a0, a1), 64);
  planarUV(geo);
  g.add(new THREE.Mesh(geo, face));
  const ribs = 15;
  for (let i = 0; i < ribs; i += 1) {
    const a = a0 + ((a1 - a0) * i) / (ribs - 1);
    const outer = i === 0 || i === ribs - 1;
    const len = outer ? 2.62 : 2.5;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(outer ? 0.13 : 0.06, len, outer ? 0.05 : 0.03), outer ? m.woodDark : m.bamboo);
    rib.position.set(Math.cos(a) * len / 2, Math.sin(a) * len / 2, -0.03);
    rib.rotation.z = a - Math.PI / 2;
    g.add(rib);
  }
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.14, 24), m.gold, [0, 0, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 12), m.silver, [0, 0, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 24), m.silkRed, [0, -0.2, 0]));
  g.add(tube([[0, -0.2, 0], [0.1, -0.5, 0.05], [0.0, -0.8, 0.0]], 0.02, m.silkRed, 16));
  g.add(mesh(new THREE.SphereGeometry(0.1, 14, 10), m.jade, [0, -0.85, 0]));
  const t = tassel(0.75, 0.2, m.silkRed, m.gold, 20);
  t.position.set(0, -1.0, 0);
  g.add(t);
  g.position.y = -0.9;
  return g;
};

export const fanRound = ({ tex, m }) => {
  const face = texMat(tex, { side: THREE.DoubleSide });
  const g = new THREE.Group();
  const d = plaque(1.05, 0.05, face, face, m.bamboo);
  d.position.set(0, 0.6, 0);
  g.add(d);
  g.add(mesh(new THREE.TorusGeometry(1.05, 0.055, 12, 64), m.bamboo, [0, 0.6, 0]));
  const hd = lathe([[0, 0], [0.07, 0], [0.065, 0.2], [0.09, 0.3], [0.085, 1.0], [0.06, 1.4], [0.001, 1.4]], m.woodDark, 20);
  hd.position.set(0, -1.15, 0);
  g.add(hd);
  g.add(mesh(new THREE.TorusGeometry(0.09, 0.02, 8, 20), m.gold, [0, -0.55, 0], [Math.PI / 2, 0, 0]));
  const t = tassel(0.8, 0.2, m.silkBlue, m.gold, 20);
  t.position.set(0, -1.3, 0);
  g.add(t);
  return g;
};

export const fanLeaf = ({ tex, m }) => {
  // 파초선: 파초 잎 모양 부채
  const s = new THREE.Shape();
  s.moveTo(0, -0.6);
  s.bezierCurveTo(-0.5, -0.4, -1.1, 0.2, -0.95, 0.9);
  s.bezierCurveTo(-0.8, 1.6, -0.25, 2.0, 0, 2.15);
  s.bezierCurveTo(0.25, 2.0, 0.8, 1.6, 0.95, 0.9);
  s.bezierCurveTo(1.1, 0.2, 0.5, -0.4, 0, -0.6);
  const g = new THREE.Group();
  g.add(extrudeShape(s, 0.05, texMat(tex), m.bamboo, 0.035));
  g.add(lathe([[0, 0], [0.07, 0], [0.065, 0.2], [0.09, 0.3], [0.085, 0.9], [0.06, 1.2], [0.001, 1.2]], m.woodDark, 20));
  g.children[g.children.length - 1].position.set(0, -1.75, 0);
  g.add(mesh(new THREE.TorusGeometry(0.1, 0.022, 8, 20), m.gold, [0, -0.7, 0], [Math.PI / 2, 0, 0]));
  g.add(tube([[0, -0.6, 0.02], [0, 0.6, 0.03], [0, 1.9, 0.02]], 0.018, m.bamboo, 16));
  g.position.y = -0.2;
  return g;
};

// ───────── 자물쇠 ─────────
function shackle(w, h, r, mat) {
  const pts = [];
  pts.push([-w, 0, 0]);
  pts.push([-w, h * 0.55, 0]);
  const n = 10;
  for (let i = 0; i <= n; i += 1) {
    const a = Math.PI - (Math.PI * i) / n;
    pts.push([Math.cos(a) * w, h * 0.55 + Math.sin(a) * (h * 0.45), 0]);
  }
  pts.push([w, h * 0.3, 0]);
  return tube(pts, r, mat, 60);
}

export const lockBox = ({ tex, m }) => {
  const face = texMat(tex);
  const g = new THREE.Group();
  g.add(rbox(1.6, 1.15, 0.5, m.brass, 0.1));
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.8), face);
  plate.position.set(0, 0.04, 0.256);
  g.add(plate);
  const plate2 = plate.clone();
  plate2.position.z = -0.256;
  plate2.rotation.y = Math.PI;
  g.add(plate2);
  [0.256, -0.256].forEach((z) => {
    const fr = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.9, 0.006), m.gold);
    fr.position.set(0, 0.04, z * 0.985);
    g.add(fr);
  });
  const sh = shackle(0.5, 1.0, 0.075, m.silver);
  sh.position.set(0, 0.56, 0);
  g.add(sh);
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 20), m.ink, [0, -0.46, 0.26], [Math.PI / 2, 0, 0]));
  [[-0.7, 0.5], [0.7, 0.5], [-0.7, -0.5], [0.7, -0.5]].forEach(([x, y]) => g.add(mesh(new THREE.SphereGeometry(0.05, 10, 8), m.gold, [x, y, 0.26])));
  return g;
};

export const lockButterfly = ({ tex, m }) => {
  const g = new THREE.Group();
  const wing = (x, y, rx, ry, rot) => {
    const s = new THREE.Shape();
    s.absellipse(0, 0, rx, ry, 0, Math.PI * 2, false, 0);
    const w = extrudeShape(s, 0.12, m.brass, m.brass, 0.03);
    w.position.set(x, y, 0);
    w.rotation.z = rot;
    return w;
  };
  g.add(wing(-0.62, 0.38, 0.55, 0.38, 0.5));
  g.add(wing(0.62, 0.38, 0.55, 0.38, -0.5));
  g.add(wing(-0.45, -0.38, 0.4, 0.28, -0.5));
  g.add(wing(0.45, -0.38, 0.4, 0.28, 0.5));
  // 날개 무늬 점
  [[-0.7, 0.45], [0.7, 0.45], [-0.5, -0.4], [0.5, -0.4]].forEach(([x, y]) =>
    [0.1, -0.1].forEach((z) => g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 20), m.jade, [x, y, z], [Math.PI / 2, 0, 0])))
  );
  const body = plaque(0.32, 0.2, texMat(tex), texMat(tex), m.gold);
  body.position.set(0, 0.02, 0);
  g.add(body);
  g.add(mesh(new THREE.TorusGeometry(0.33, 0.04, 10, 40), m.gold, [0, 0.02, 0.1]));
  g.add(mesh(new THREE.TorusGeometry(0.33, 0.04, 10, 40), m.gold, [0, 0.02, -0.1]));
  g.add(tube([[-0.05, 0.4, 0], [-0.25, 0.85, 0], [-0.45, 1.0, 0]], 0.02, m.gold, 12));
  g.add(tube([[0.05, 0.4, 0], [0.25, 0.85, 0], [0.45, 1.0, 0]], 0.02, m.gold, 12));
  const sh = shackle(0.3, 0.75, 0.06, m.silver);
  sh.position.set(0, -0.78, 0);
  sh.rotation.z = Math.PI;
  sh.position.y = -0.55;
  g.add(sh);
  g.position.y = 0.1;
  return g;
};

export const lockFish = ({ tex, m }) => {
  const s = new THREE.Shape();
  s.moveTo(-1.15, 0);
  s.bezierCurveTo(-0.9, 0.5, -0.2, 0.62, 0.4, 0.3);
  s.lineTo(0.75, 0.2);
  s.lineTo(1.2, 0.6);
  s.lineTo(1.0, 0);
  s.lineTo(1.2, -0.6);
  s.lineTo(0.75, -0.2);
  s.lineTo(0.4, -0.3);
  s.bezierCurveTo(-0.2, -0.62, -0.9, -0.5, -1.15, 0);
  const g = new THREE.Group();
  g.add(extrudeShape(s, 0.22, texMat(tex), m.brass, 0.05));
  [0.16, -0.16].forEach((z) => {
    g.add(mesh(new THREE.SphereGeometry(0.075, 12, 10), m.ink, [-0.82, 0.14, z * 0.98]));
    g.add(mesh(new THREE.TorusGeometry(0.095, 0.015, 8, 20), m.gold, [-0.82, 0.14, z]));
  });
  [-0.05, 0.1, 0.25].forEach((x) => [0.17, -0.17].forEach((z) => g.add(mesh(new THREE.BoxGeometry(0.02, 0.5, 0.01), m.gold, [x + 0.7, 0, z * 0.99]))));
  const sh = shackle(0.3, 0.8, 0.06, m.silver);
  sh.position.set(-0.05, 0.4, 0);
  g.add(sh);
  g.position.y = -0.2;
  return g;
};
