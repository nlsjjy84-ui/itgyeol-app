import { lobedShape, getDna, THREE, mesh, group, lathe, cyl, torus, sphere, rbox, tube, tassel, knot, plaque, slab, texMat, extrudeShape, planarUV,
} from './kit';

// ───────── 노리개 ─────────
export function norigaeTop(m, y) {
  // 위쪽: 걸이 고리 + 끈 + 매듭
  const g = new THREE.Group();
  g.add(mesh(new THREE.TorusGeometry(0.2, 0.035, 12, 32), m.gold, [0, y + 0.55, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 12), m.silkRed, [0, y + 0.28, 0]));
  const k = knot(0.13, m.silkRed, m.gold);
  k.position.set(0, y + 0.02, 0);
  g.add(k);
  return g;
}

export function norigaeBottom(m, y, tasselLen = 1.1) {
  const g = new THREE.Group();
  const k = knot(0.12, m.silkRed, m.gold);
  k.position.set(0, y - 0.1, 0);
  g.add(k);
  const t = tassel(tasselLen, 0.36, m.silkBlue, m.gold, 32);
  t.position.set(0, y - 0.3, 0);
  g.add(t);
  return g;
}

export const norigaeRound = ({ tex, m }) => {
  const face = texMat(tex);
  const g = new THREE.Group();
  const p = plaque(0.78, 0.14, face, face, m.brass);
  g.add(p);
  g.add(mesh(new THREE.TorusGeometry(0.78, 0.055, 14, 56), m.gold, [0, 0, 0.07]));
  g.add(mesh(new THREE.TorusGeometry(0.78, 0.055, 14, 56), m.gold, [0, 0, -0.07]));
  g.add(mesh(new THREE.TorusGeometry(0.62, 0.014, 8, 56), m.gold, [0, 0, 0.082]));
  g.add(norigaeTop(m, 0.78));
  g.add(norigaeBottom(m, -0.78));
  return g;
};

export const norigaeSquare = ({ tex, m }) => {
  const face = texMat(tex);
  const g = new THREE.Group();
  g.add(slab(1.35, 1.35, 0.14, face, face, m.brass, 0.08));
  // 네 모서리 장식(귀장식)
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => {
    [0.085, -0.085].forEach((z) => g.add(mesh(new THREE.SphereGeometry(0.075, 14, 10), m.gold, [sx * 0.68, sy * 0.68, z])));
  });
  g.add(norigaeTop(m, 0.68));
  g.add(norigaeBottom(m, -0.68));
  return g;
};

export const norigaeSamjak = ({ tex, m }) => {
  const face = texMat(tex);
  const g = new THREE.Group();
  // 삼작: 큰 패 하나 + 작은 패 둘이 서로 다른 길이로 달린다
  const big = plaque(0.62, 0.12, face, face, m.brass);
  g.add(big);
  g.add(mesh(new THREE.TorusGeometry(0.62, 0.05, 12, 48), m.gold, [0, 0, 0.06]));
  g.add(mesh(new THREE.TorusGeometry(0.62, 0.05, 12, 48), m.gold, [0, 0, -0.06]));
  g.add(norigaeTop(m, 0.62));
  [[-0.95, -0.55, m.jade], [0.95, -0.75, m.jadeDark]].forEach(([x, y, jm]) => {
    const kn = knot(0.1, m.silkRed, m.gold);
    kn.position.set(x * 0.55, y + 0.55, 0);
    g.add(kn);
    g.add(tube([[0, -0.62, 0], [x * 0.3, -0.7, 0], [x * 0.55, y + 0.62, 0]], 0.02, m.silkRed, 20));
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.28, 28, 20), jm);
    s.scale.set(1, 1, 0.55);
    s.position.set(x * 0.55, y + 0.2, 0);
    g.add(s);
    g.add(mesh(new THREE.TorusGeometry(0.3, 0.03, 10, 36), m.gold, [x * 0.55, y + 0.2, 0]));
    const t = tassel(0.85, 0.28, m.silkYellow, m.gold, 24);
    t.position.set(x * 0.55, y - 0.16, 0);
    g.add(t);
  });
  g.add(tube([[0, -0.62, 0], [0, -0.78, 0]], 0.02, m.silkRed, 8));
  const ts = tassel(1.3, 0.36, m.silkRed, m.gold, 32);
  ts.position.set(0, -0.98, 0);
  g.add(ts);
  return g;
};

// ───────── 비녀 ─────────
function pinRod(m, len, r, mat) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r, r * 0.55, len, 20), mat, [0, -len / 2, 0]));
  g.add(mesh(new THREE.ConeGeometry(r * 0.55, r * 3, 16), mat, [0, -len - r * 1.2, 0], [Math.PI, 0, 0]));
  return g;
}

export const binyeoRound = ({ tex, m }) => {
  // 원두잠: 둥근 머리판에 조각보
  const face = texMat(tex);
  const g = new THREE.Group();
  g.add(pinRod(m, 2.3, 0.05, m.silver));
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.045, 0.5, 16), m.gold, [0, -0.1, 0]));
  for (let i = 0; i < 3; i += 1) g.add(mesh(new THREE.TorusGeometry(0.052, 0.012, 8, 20), m.gold, [0, -0.28 - i * 0.12, 0], [Math.PI / 2, 0, 0]));
  const head = plaque(0.7, 0.1, face, face, m.gold);
  head.position.set(0, 0.7, 0);
  g.add(head);
  g.add(mesh(new THREE.TorusGeometry(0.7, 0.055, 12, 48), m.gold, [0, 0.7, 0.05]));
  g.add(mesh(new THREE.TorusGeometry(0.7, 0.055, 12, 48), m.gold, [0, 0.7, -0.05]));
  g.add(mesh(new THREE.SphereGeometry(0.12, 16, 12), m.jade, [0, 1.46, 0]));
  return g;
};

export const binyeoLotus = ({ tex, m }) => {
  // 연봉잠: 연꽃봉오리 머리 — 둥근 구슬에 조각보를 감싸고 꽃잎이 받친다
  const face = texMat(tex);
  const g = new THREE.Group();
  g.add(pinRod(m, 2.3, 0.048, m.brass));
  const budGeo = new THREE.SphereGeometry(0.55, 48, 32);
  planarUV(budGeo);
  const bud = new THREE.Mesh(budGeo, face);
  bud.scale.set(1, 1.15, 1);
  bud.position.set(0, 0.85, 0);
  g.add(bud);
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), m.gold);
    petal.scale.set(0.5, 1.4, 0.22);
    petal.position.set(Math.cos(a) * 0.4, 0.3, Math.sin(a) * 0.4);
    petal.rotation.y = -a;
    petal.rotation.z = -0.5;
    g.add(petal);
  }
  g.add(mesh(new THREE.CylinderGeometry(0.14, 0.05, 0.3, 16), m.gold, [0, 0.1, 0]));
  return g;
};

export const binyeoBamboo = ({ tex, m }) => {
  // 죽절잠: 대나무 마디를 본뜬 옥 몸통에 네모 조각보 머리
  const face = texMat(tex);
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.05, 2.3, 20), m.jade, [0, -1.1, 0]));
  for (let i = 0; i < 5; i += 1) g.add(mesh(new THREE.TorusGeometry(0.075 - i * 0.004, 0.018, 8, 24), m.jadeDark, [0, 0.0 - i * 0.5, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.ConeGeometry(0.05, 0.22, 16), m.jade, [0, -2.3, 0], [Math.PI, 0, 0]));
  const head = slab(1.0, 1.0, 0.1, face, face, m.gold, 0.06);
  head.position.set(0, 0.75, 0);
  head.rotation.z = Math.PI / 4;
  g.add(head);
  g.add(mesh(new THREE.SphereGeometry(0.1, 14, 10), m.silkRed, [0, 1.6, 0]));
  return g;
};

// ───────── 가락지 ─────────
function ringBand(R, r, mat) {
  return new THREE.Mesh(new THREE.TorusGeometry(R, r, 18, 56), mat);
}

export const ringSingle = ({ tex, m }) => {
  const face = texMat(tex);
  const g = new THREE.Group();
  const band = ringBand(0.78, 0.11, m.gold);
  g.add(band);
  const bez = plaque(0.4, 0.09, face, face, m.gold);
  bez.position.set(0, 0.8, 0);
  bez.rotation.x = -0.35;
  g.add(bez);
  const bezRim = torus(0.4, 0.04, m.gold);
  bezRim.position.set(0, 0.8, 0.045);
  bezRim.rotation.x = -0.35;
  g.add(bezRim);
  g.rotation.x = 0.3;
  return g;
};

export const ringPair = ({ tex, m }) => {
  // 쌍가락지: 같은 두 짝이 나란히 — 한 짝은 조각보 띠, 한 짝은 옥
  const face = texMat(tex, { repeat: [3, 1], rough: 0.7 });
  const g = new THREE.Group();
  [[-0.5, true], [0.5, false]].forEach(([z, wrapped]) => {
    const b = new THREE.Group();
    if (wrapped) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.15, 24, 72), face);
      b.add(band);
    } else {
      b.add(new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.14, 24, 72), m.jade));
    }
    b.position.z = z;
    g.add(b);
  });
  g.rotation.set(0.15, 0.35, 0);
  return g;
};

export const ringWide = ({ tex, m }) => {
  // 넓은 띠 가락지: 조각보를 바깥에 둘러 감싼 띠, 위아래 금테
  const wrap = texMat(tex, { repeat: [1, 1], side: THREE.DoubleSide });
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.7, 72, 1, true), wrap);
  g.add(body);
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.7, 72, 1, true), m.gold);
  inner.material = m.gold.clone();
  inner.material.side = THREE.BackSide;
  g.add(inner);
  [0.35, -0.35].forEach((y) => g.add(mesh(new THREE.TorusGeometry(0.83, 0.05, 12, 72), m.gold, [0, y, 0], [Math.PI / 2, 0, 0])));
  g.rotation.set(0.5, 0.4, 0);
  return g;
};

// ───────── 거울 ─────────
export const mirrorHand = ({ tex, m }) => {
  // 손거울: 앞은 맑은 거울, 뒤는 조각보. 정면에 보이는 쪽을 뒷면(조각보)으로 둔다.
  const face = texMat(tex);
  const g = new THREE.Group();
  const disc = plaque(0.88, 0.1, face, m.mirror, m.brass);
  disc.position.set(0, 0.5, 0);
  g.add(disc);
  g.add(mesh(new THREE.TorusGeometry(0.88, 0.07, 14, 64), m.brass, [0, 0.5, 0.05]));
  g.add(mesh(new THREE.TorusGeometry(0.88, 0.07, 14, 64), m.brass, [0, 0.5, -0.05]));
  const handle = lathe(
    [[0.0, 0], [0.09, 0], [0.1, 0.1], [0.07, 0.25], [0.08, 0.8], [0.1, 0.95], [0.13, 1.0], [0.0, 1.0]].map(([x, y]) => [x, y]),
    m.woodDark
  );
  handle.position.set(0, -1.55, 0);
  g.add(handle);
  g.add(mesh(new THREE.TorusGeometry(0.1, 0.03, 10, 24), m.gold, [0, -1.55, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.11, 0.03, 10, 24), m.gold, [0, -0.62, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.14, 0.03, 10, 24), m.silkRed, [0, -1.55, 0.02], [0, 0, 0]));
  return g;
};

export const mirrorBronze = ({ tex, m }) => {
  // 동경(청동거울): 두꺼운 청동 원판, 가장자리가 솟고 가운데에 끈 꿰는 꼭지(뉴), 안쪽에 조각보
  const face = texMat(tex);
  const g = new THREE.Group();
  const dn = getDna();
  if (dn.lobes >= 5) {
    // 꽃잎 모양 테두리(능화형) — 유전자가 꽃잎 수와 깊이를 정한다
    g.add(extrudeShape(lobedShape(0.95, dn.lobes, dn.lobeAmp), 0.14, m.bronze, m.bronze, 0.02));
    g.add(mesh(new THREE.CircleGeometry(0.8, 64), m.mirror, [0, 0, -0.092], [0, Math.PI, 0]));
  } else {
    g.add(plaque(0.95, 0.14, m.bronze, m.mirror, m.bronze));
  }
  g.add(mesh(new THREE.TorusGeometry(dn.lobes >= 5 ? 0.88 : 0.92, 0.07, 14, 64), m.bronze, [0, 0, 0.07]));
  const inset = new THREE.Mesh(new THREE.CircleGeometry(0.8, 64), face);
  inset.position.set(0, 0, dn.lobes >= 5 ? 0.096 : 0.083);
  g.add(inset);
  g.add(mesh(new THREE.TorusGeometry(0.8, 0.02, 8, 64), m.gold, [0, 0, dn.lobes >= 5 ? 0.098 : 0.085]));
  const nub = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), m.bronze);
  nub.scale.set(1, 1, 0.7);
  nub.position.set(0, 0, 0.12);
  g.add(nub);
  g.add(mesh(new THREE.TorusGeometry(0.06, 0.018, 8, 20), m.gold, [0, 0, 0.19]));
  g.add(tube([[0, 0, 0.19], [0.2, -0.25, 0.2], [0.5, -0.55, 0.2]], 0.02, m.silkRed, 16));
  const t = tassel(0.5, 0.2, m.silkRed, m.gold, 16);
  t.position.set(0.52, -0.62, 0.2);
  g.add(t);
  return g;
};

export const mirrorFrame = ({ tex, m }) => {
  // 사각 거울: 나무틀 안에 거울, 뒤판에 조각보, 아래에 받침 다리
  const face = texMat(tex);
  const g = new THREE.Group();
  g.add(slab(1.5, 1.8, 0.14, face, m.mirror, m.wood, 0.07));
  const frame = new THREE.Group();
  [[0, 0.9, 1.5, 0.1], [0, -0.9, 1.5, 0.1], [-0.75, 0, 0.1, 1.8], [0.75, 0, 0.1, 1.8]].forEach(([x, y, w, h]) => {
    frame.add(mesh(new THREE.BoxGeometry(w, h, 0.2), m.woodDark, [x, y, 0]));
  });
  g.add(frame);
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12), m.woodDark, [-0.55, -1.15, -0.1], [0.4, 0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12), m.woodDark, [0.55, -1.15, -0.1], [0.4, 0, 0]));
  [[-0.78, 0.9], [0.78, 0.9], [-0.78, -0.9], [0.78, -0.9]].forEach(([x, y]) => g.add(mesh(new THREE.SphereGeometry(0.075, 12, 10), m.gold, [x, y, 0.1])));
  return g;
};
