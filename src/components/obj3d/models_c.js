import {
  THREE, mesh, group, lathe, cyl, torus, sphere, rbox, tube, tassel, knot, plaque, slab, texMat, extrudeShape, planarUV,
} from './kit';

// ───────── 북·장구·소고 ─────────
function studRing(r, z, n, mat, size = 0.035) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    g.add(mesh(new THREE.SphereGeometry(size, 10, 8), mat, [Math.cos(a) * r, Math.sin(a) * r, z]));
  }
  return g;
}

export const drumSogo = ({ tex, m }) => {
  // 소고: 작은 손북. 앞가죽에 조각보, 뒷가죽은 생가죽, 아래에 손잡이
  const face = texMat(tex);
  const g = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 0.32, 72, 1, true), m.lacquerRed);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.93, 0.93, 0.3, 72, 1, true), m.woodLight);
  inner.rotation.x = Math.PI / 2;
  inner.material = m.woodLight.clone();
  inner.material.side = THREE.BackSide;
  g.add(inner);
  g.add(mesh(new THREE.CircleGeometry(0.93, 64), face, [0, 0, 0.12]));
  g.add(mesh(new THREE.CircleGeometry(0.93, 64), m.skin, [0, 0, -0.12], [0, Math.PI, 0]));
  [0.16, -0.16].forEach((z) => {
    g.add(mesh(new THREE.TorusGeometry(0.95, 0.045, 12, 72), m.gold, [0, 0, z]));
    g.add(studRing(0.985, z * 1.0, 24, m.gold, 0.03));
  });
  const stick = lathe([[0, 0], [0.06, 0], [0.07, 0.15], [0.09, 0.3], [0.08, 0.9], [0.06, 1.15], [0.001, 1.15]], m.woodDark, 20);
  stick.position.set(0, -2.15, 0);
  g.add(stick);
  g.add(mesh(new THREE.TorusGeometry(0.095, 0.022, 8, 20), m.gold, [0, -1.25, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.22, 0.22, 0.2), m.woodDark, [0, -1.0, 0]));
  g.add(tube([[0, -2.15, 0], [0.05, -2.35, 0], [0.0, -2.5, 0]], 0.025, m.silkRed, 10));
  const t = tassel(0.7, 0.2, m.silkRed, m.gold, 16);
  t.position.set(0, -2.45, 0);
  g.add(t);
  g.position.y = 0.6;
  return g;
};

export const drumJanggu = ({ tex, m }) => {
  // 장구: 잘록한 허리, 양쪽 가죽, 조임줄. 가로로 놓고 왼쪽 가죽에 조각보.
  const face = texMat(tex);
  const g = new THREE.Group();
  const prof = [[0.0, -1.55], [0.78, -1.55], [0.8, -1.4], [0.55, -1.1], [0.36, -0.6], [0.26, -0.2], [0.24, 0], [0.26, 0.2], [0.36, 0.6], [0.55, 1.1], [0.8, 1.4], [0.78, 1.55], [0.0, 1.55]];
  const body = lathe(prof.slice(1, -1), m.lacquerRed, 64);
  body.material = m.lacquerRed.clone();
  body.material.side = THREE.DoubleSide;
  g.add(body);
  // 양쪽 가죽 테
  [[-1.6, true], [1.6, false]].forEach(([y, painted]) => {
    const head = mesh(new THREE.CircleGeometry(0.98, 64), painted ? face : m.skin, [0, y * 0.985, 0], [-Math.PI / 2 * Math.sign(y), 0, 0]);
    g.add(head);
    g.add(mesh(new THREE.TorusGeometry(0.98, 0.1, 14, 64), m.woodLight, [0, y * 0.97, 0], [Math.PI / 2, 0, 0]));
    g.add(mesh(new THREE.TorusGeometry(0.98, 0.04, 8, 64), m.gold, [0, y * 0.97 - Math.sign(y) * 0.1, 0], [Math.PI / 2, 0, 0]));
  });
  // 조임줄(조란대) — 양쪽 테를 지그재그로 잇는다
  const n = 12;
  for (let i = 0; i < n; i += 1) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 0.5) / n) * Math.PI * 2;
    const p = (a, y, rr) => [Math.cos(a) * rr, y, Math.sin(a) * rr];
    g.add(tube([p(a0, -1.55, 0.86), p((a0 + a1) / 2, 0, 0.34), p(a1, 1.55, 0.86)], 0.022, m.silkYellow, 24));
    g.add(tube([p(a1, -1.55, 0.86), p((a0 + a1) / 2 + 0.2, 0, 0.34), p(a0 + (Math.PI * 2) / n, 1.55, 0.86)], 0.022, m.silkYellow, 24));
  }
  for (let i = 0; i < 4; i += 1) g.add(mesh(new THREE.TorusGeometry(0.34, 0.03, 8, 40), m.red || m.silkRed, [0, -0.3 + i * 0.2, 0], [Math.PI / 2, 0, 0]));
  g.rotation.z = Math.PI / 2;
  g.rotation.y = 0;
  const outer = new THREE.Group();
  outer.add(g);
  outer.rotation.y = 0.95;
  return outer;
};

export const drumBuk = ({ tex, m }) => {
  // 북: 나무 통에 앞가죽 조각보, 뒷가죽 생가죽. 양쪽 테를 잇는 조임줄(지그재그 줄)이 통을 감싼다
  const face = texMat(tex);
  const g = new THREE.Group();
  const prof = [[0.99, -0.6], [1.08, -0.4], [1.14, -0.2], [1.16, 0], [1.14, 0.2], [1.08, 0.4], [0.99, 0.6]];
  const body = lathe(prof, m.woodLight, 72);
  body.rotation.x = Math.PI / 2;
  body.material = m.woodLight.clone();
  body.material.side = THREE.DoubleSide;
  g.add(body);
  // 가죽 면과 가죽을 두른 테(가장자리 말아 올린 부분)
  g.add(mesh(new THREE.CircleGeometry(1.0, 72), face, [0, 0, 0.62]));
  g.add(mesh(new THREE.CircleGeometry(1.0, 72), m.skin, [0, 0, -0.62], [0, Math.PI, 0]));
  [0.6, -0.6].forEach((z) => {
    g.add(mesh(new THREE.TorusGeometry(1.0, 0.075, 12, 72), m.skin, [0, 0, z * 1.02]));
    g.add(mesh(new THREE.TorusGeometry(1.03, 0.04, 10, 72), m.woodLight, [0, 0, z * 0.9]));
  });
  // 조임줄: 위 테에서 아래 테로 비스듬히 내려갔다 다시 올라오는 V자 줄이 한 바퀴를 돈다
  const n = 14;
  const P = (a, z, r) => [Math.cos(a) * r, Math.sin(a) * r, z];
  for (let i = 0; i < n; i += 1) {
    const a0 = (i / n) * Math.PI * 2;
    const a1 = ((i + 0.5) / n) * Math.PI * 2;
    const a2 = ((i + 1) / n) * Math.PI * 2;
    g.add(tube([P(a0, 0.56, 1.05), P((a0 + a1) / 2, 0, 1.19), P(a1, -0.56, 1.05)], 0.026, m.woodDark, 20));
    g.add(tube([P(a1, -0.56, 1.05), P((a1 + a2) / 2, 0, 1.19), P(a2, 0.56, 1.05)], 0.026, m.woodDark, 20));
  }
  // 줄이 꺾이는 자리에 매듭 알
  for (let i = 0; i < n; i += 1) {
    const a0 = (i / n) * Math.PI * 2;
    g.add(mesh(new THREE.SphereGeometry(0.04, 10, 8), m.woodDark, P(a0, 0.57, 1.06)));
    g.add(mesh(new THREE.SphereGeometry(0.04, 10, 8), m.woodDark, P(a0 + Math.PI / n, -0.57, 1.06)));
  }
  [-1, 1].forEach((s) => {
    g.add(mesh(new THREE.TorusGeometry(0.16, 0.035, 10, 24), m.brass, [s * 1.22, 0, 0], [0, Math.PI / 2, 0]));
    g.add(mesh(new THREE.SphereGeometry(0.07, 12, 10), m.brass, [s * 1.16, 0, 0]));
  });
  g.rotation.x = -0.25;
  return g;
};

// ───────── 복주머니 ─────────
function gatheredNeck(rBottom, rTop, h, mat, folds = 11) {
  const pts = [];
  for (let i = 0; i <= 16; i += 1) {
    const t = i / 16;
    pts.push(new THREE.Vector2(rTop + (rBottom - rTop) * Math.pow(1 - t, 2.4) + 0.09 * Math.pow(t, 3), t * h));
  }
  pts.push(new THREE.Vector2(rTop + 0.05, h + 0.03));
  pts.push(new THREE.Vector2(rTop * 0.8, h + 0.04));
  pts.push(new THREE.Vector2(0.001, h + 0.04));
  const geo = new THREE.LatheGeometry(pts, 80);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i += 1) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const y = p.getY(i);
    const ang = Math.atan2(z, x);
    const k = 1 + 0.055 * Math.sin(ang * folds) * Math.min(1, y / (h * 0.6));
    p.setX(i, x * k);
    p.setZ(i, z * k);
  }
  geo.computeVertexNormals();
  const mt = mat.clone();
  mt.side = THREE.DoubleSide;
  return new THREE.Mesh(geo, mt);
}

function pouchTop(m, y, rNeck) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.TorusGeometry(rNeck, 0.035, 10, 40), m.silkRed, [0, y, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(rNeck * 0.92, 0.03, 10, 40), m.silkYellow, [0, y - 0.08, 0], [Math.PI / 2, 0, 0]));
  [-1, 1].forEach((s) => {
    g.add(tube([[s * rNeck, y, 0], [s * (rNeck + 0.12), y - 0.25, 0.04], [s * (rNeck + 0.14), y - 0.5, 0.02]], 0.022, m.silkRed, 14));
    const t = tassel(0.5, 0.15, m.silkRed, m.gold, 14);
    t.position.set(s * (rNeck + 0.14), y - 0.55, 0.02);
    g.add(t);
  });
  return g;
}

export const pouchRound = ({ tex, m }) => {
  const face = texMat(tex, { rough: 0.8 });
  const g = new THREE.Group();
  const body = new THREE.Mesh(planarUV(new THREE.SphereGeometry(1, 64, 44)), face);
  body.scale.set(1.05, 0.92, 0.82);
  body.position.y = 0;
  g.add(body);
  g.add(mesh(new THREE.TorusGeometry(0.72, 0.012, 6, 64), m.gold, [0, 0, 0.575], null, [1.05, 1, 1]));
  const neck = gatheredNeck(0.5, 0.26, 0.55, m.silkRed);
  neck.position.set(0, 0.7, 0);
  g.add(neck);
  g.add(pouchTop(m, 0.92, 0.3));
  g.position.y = -0.3;
  return g;
};

export const pouchCorner = ({ tex, m }) => {
  // 귀주머니: 아래 양쪽이 뾰족한 모서리(귀)로 솟은 네모 주머니
  const face = texMat(tex, { rough: 0.8 });
  const g = new THREE.Group();
  g.add(slab(1.7, 1.45, 0.62, face, face, m.silkBlue, 0.22));
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 16), m.silkBlue);
    ear.position.set(s * 0.82, -0.8, 0);
    ear.rotation.z = Math.PI + s * 0.2;
    g.add(ear);
    g.add(mesh(new THREE.SphereGeometry(0.06, 10, 8), m.gold, [s * 0.86, -1.0, 0]));
  });
  const neck = gatheredNeck(0.52, 0.28, 0.5, m.silkBlue, 9);
  neck.position.set(0, 0.62, 0);
  g.add(neck);
  g.add(pouchTop(m, 0.84, 0.32));
  return g;
};

export const pouchFlat = ({ tex, m }) => {
  // 둥근 납작 주머니(염낭): 가장자리에 금테
  const face = texMat(tex, { rough: 0.8 });
  const g = new THREE.Group();
  const body = new THREE.Mesh(planarUV(new THREE.SphereGeometry(1, 64, 44)), face);
  body.scale.set(1.0, 1.0, 0.36);
  g.add(body);
  g.add(mesh(new THREE.TorusGeometry(0.99, 0.03, 10, 72), m.gold, [0, 0, 0]));
  const neck = gatheredNeck(0.42, 0.22, 0.4, m.silkGreen, 10);
  neck.position.set(0, 0.92, 0);
  g.add(neck);
  g.add(pouchTop(m, 1.12, 0.26));
  g.position.y = -0.4;
  return g;
};

// ───────── 조각 주사위 ─────────
function cropTex(tex, rx, ry, ox, oy) {
  const t = tex.clone();
  t.needsUpdate = true;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.offset.set(ox, oy);
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7 });
}

export const cubeDice = ({ tex, m }) => {
  // 조각 주사위: 정육면체의 여섯 면에 조각보의 서로 다른 조각이 붙는다 — 조각이 모여 입체가 된다
  const s = 1.5;
  const g = new THREE.Group();
  g.add(rbox(s, s, s, m.gold, 0.1));
  const crops = [
    cropTex(tex, 1, 1, 0, 0), // 앞: 전체
    cropTex(tex, 1, 1, 0, 0), // 뒤: 전체
    cropTex(tex, 0.5, 0.5, 0, 0.5), // 위: 왼쪽 위 조각
    cropTex(tex, 0.5, 0.5, 0.5, 0), // 아래: 오른쪽 아래 조각
    cropTex(tex, 0.5, 0.5, 0.5, 0.5), // 오른쪽: 오른쪽 위 조각
    cropTex(tex, 0.5, 0.5, 0, 0), // 왼쪽: 왼쪽 아래 조각
  ];
  const f = s - 0.2;
  const off = s / 2 + 0.004;
  const planes = [
    [[0, 0, off], [0, 0, 0], crops[0]],
    [[0, 0, -off], [0, Math.PI, 0], crops[1]],
    [[0, off, 0], [-Math.PI / 2, 0, 0], crops[2]],
    [[0, -off, 0], [Math.PI / 2, 0, 0], crops[3]],
    [[off, 0, 0], [0, Math.PI / 2, 0], crops[4]],
    [[-off, 0, 0], [0, -Math.PI / 2, 0], crops[5]],
  ];
  planes.forEach(([p, r, mat]) => g.add(mesh(new THREE.PlaneGeometry(f, f), mat, p, r)));
  [-1, 1].forEach((x) => [-1, 1].forEach((y) => [-1, 1].forEach((z) => g.add(mesh(new THREE.SphereGeometry(0.07, 12, 10), m.silkRed, [x * s / 2, y * s / 2, z * s / 2])))));
  g.rotation.set(0.5, 0.6, 0);
  return g;
};
