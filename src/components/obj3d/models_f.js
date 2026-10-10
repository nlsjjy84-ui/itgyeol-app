import { THREE, getDna, warpProfile, smoothProfile, mesh, lathe, rbox, tube, sphere, plaque, texMat } from './kit';

// 우리나라 보물 2 — 범종 · 금관 · 석탑 · 한옥 · 장독 · 방패연.

const stoneMat = () => new THREE.MeshStandardMaterial({ color: 0xbdb8a8, roughness: 0.92 });
const tileMat = () => new THREE.MeshStandardMaterial({ color: 0x3c4146, roughness: 0.55, metalness: 0.1 });

function dbl(mat) {
  const c = mat.clone();
  c.side = THREE.DoubleSide;
  return c;
}

// 회전체 일부(앞쪽 천 조각)
function patchOnLathe(prof, j0, j1, phiStart, phiLength, mat, grow = 1.008) {
  let base = prof;
  if (getDna().k) {
    const ylo = prof[j0][1];
    const yhi = prof[j1][1];
    base = smoothProfile(prof).filter(([, y]) => y >= ylo - 1e-6 && y <= yhi + 1e-6);
  } else base = prof.slice(j0, j1 + 1);
  const pts = base.map(([x, y]) => new THREE.Vector2(x * grow, y));
  const geo = new THREE.LatheGeometry(pts, 48, phiStart, phiLength);
  const mt = mat.clone();
  mt.side = THREE.DoubleSide;
  return new THREE.Mesh(geo, mt);
}

export const treasureBell = ({ tex, m }) => {
  // 범종: 용뉴(용 모양 고리) + 음통(소리 관) + 종 몸통, 앞쪽에 조각보 장식 띠를 덧댄다
  const g = new THREE.Group();
  const prof = [[1.0, 0], [1.04, 0.06], [0.99, 0.3], [0.92, 0.85], [0.84, 1.4], [0.72, 1.78], [0.5, 1.96], [0.2, 2.02], [0.0, 2.02]];
  g.add(lathe(prof, dbl(m.bronze), 96));
  g.add(mesh(new THREE.TorusGeometry(1.0, 0.045, 10, 96), m.bronze, [0, 0.03, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.95, 0.03, 8, 96), m.bronze, [0, 0.75, 0], [Math.PI / 2, 0, 0]));
  g.add(patchOnLathe(prof, 2, 5, -0.8, 1.6, texMat(tex), 1.012));
  // 음통과 용뉴
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 14), m.bronze, [0, 2.2, 0]));
  g.add(tube([[-0.3, 2.02, 0], [-0.32, 2.28, 0], [-0.1, 2.52, 0], [0.1, 2.52, 0], [0.32, 2.28, 0], [0.3, 2.02, 0]], 0.075, m.bronze, 40));
  g.add(mesh(new THREE.SphereGeometry(0.12, 14, 10), m.bronze, [-0.31, 2.1, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.12, 14, 10), m.bronze, [0.31, 2.1, 0]));
  // 어깨를 두른 연꽃 띠와 연뢰(젖꼭지 모양 돌기)
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    if (Math.abs(Math.atan2(Math.sin(a), Math.cos(a)) - Math.PI / 2) < 1.0) continue; // 앞 조각보 자리는 비운다
    const x = Math.cos(a) * 0.75;
    const z = Math.sin(a) * 0.75;
    g.add(mesh(new THREE.SphereGeometry(0.07, 10, 8), m.bronze, [x, 1.62, z]));
  }
  g.position.y = -1.2;
  return g;
};

export const treasureCrown = ({ tex, m }) => {
  // 신라 금관: 둥근 관테 + 出자 모양 세움장식 + 사슴뿔 모양 장식, 곡옥과 달개(작은 금 원판)가 달린다
  const g = new THREE.Group();
  const R = 0.95;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.5, 72, 1, true), dbl(m.gold));
  band.position.y = 0.25;
  g.add(band);
  g.add(mesh(new THREE.TorusGeometry(R, 0.03, 8, 72), m.gold, [0, 0.0, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(R, 0.03, 8, 72), m.gold, [0, 0.5, 0], [Math.PI / 2, 0, 0]));
  // 앞 중앙: 조각보 둥근 판
  const med = plaque(0.4, 0.04, texMat(tex), m.gold, m.gold);
  med.position.set(0, 0.25, R + 0.015);
  g.add(med);
  g.add(mesh(new THREE.TorusGeometry(0.4, 0.035, 10, 48), m.gold, [0, 0.25, R + 0.03]));
  const place = (ang, r = R) => [Math.sin(ang) * r, Math.cos(ang) * r];
  function tree(ang, tall) {
    const [x, z] = place(ang);
    const t = new THREE.Group();
    t.position.set(x, 0.5, z);
    t.rotation.y = ang;
    const stem = tall * 1.0;
    t.add(mesh(new THREE.BoxGeometry(0.1, stem, 0.03), m.gold, [0, stem / 2, 0]));
    [0.35, 0.7].forEach((f, k) => {
      const yy = stem * f;
      [-1, 1].forEach((s) => {
        const w = 0.42 - k * 0.1;
        t.add(mesh(new THREE.BoxGeometry(w, 0.08, 0.03), m.gold, [s * (w / 2 + 0.03), yy, 0]));
        t.add(mesh(new THREE.BoxGeometry(0.08, 0.34, 0.03), m.gold, [s * (w + 0.03), yy + 0.17, 0]));
        t.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.015, 12), m.gold, [s * (w + 0.03), yy + 0.4, 0], [Math.PI / 2, 0, 0]));
      });
    });
    t.add(mesh(new THREE.BoxGeometry(0.1, 0.1, 0.03), m.gold, [0, stem + 0.04, 0]));
    // 달개
    for (let i = 0; i < 5; i += 1) {
      t.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.008, 10), m.gold, [0.0, stem * (0.15 + i * 0.17), 0.025], [Math.PI / 2, 0, 0]));
    }
    return t;
  }
  g.add(tree(0, 1.0));
  g.add(tree(0.95, 0.85));
  g.add(tree(-0.95, 0.85));
  // 사슴뿔 모양(뒤 양쪽): 위로 갈라지는 가지
  [-1, 1].forEach((s) => {
    const [x, z] = place(s * 2.35);
    const pts = [[x, 0.5, z], [x * 1.0, 0.95, z * 1.0], [x * 1.1, 1.3, z * 1.1], [x * 1.0, 1.65, z * 1.0]];
    g.add(tube(pts, 0.035, m.gold, 20));
    g.add(tube([[x, 0.95, z], [x * 0.8, 1.2, z * 0.8], [x * 0.72, 1.45, z * 0.72]], 0.03, m.gold, 16));
    g.add(tube([[x * 1.1, 1.3, z * 1.1], [x * 1.3, 1.5, z * 1.3]], 0.03, m.gold, 12));
  });
  // 관테 아래로 드리운 곡옥과 금 달개 사슬
  for (let i = 0; i < 14; i += 1) {
    const ang = (i / 14) * Math.PI * 2;
    if (Math.abs(ang) < 0.5 || Math.abs(ang - Math.PI * 2) < 0.5) continue;
    const [x, z] = place(ang, R + 0.01);
    g.add(tube([[x, 0.0, z], [x, -0.12, z]], 0.012, m.gold, 6));
    const j = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 10), m.jade);
    j.scale.set(0.8, 1.25, 0.8);
    j.position.set(x, -0.24, z);
    g.add(j);
  }
  g.position.y = -0.7;
  return g;
};

export const treasurePagoda = ({ tex, m }) => {
  // 삼층석탑: 이중 기단 위에 몸돌과 지붕돌이 세 번 쌓이고 꼭대기에 상륜부. 1층 몸돌 앞에 조각보 현판
  const g = new THREE.Group();
  const stone = stoneMat();
  const roof = (r, y) => {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.52, r, 0.32, 4), stone);
    cone.rotation.y = Math.PI / 4;
    cone.position.y = y;
    return cone;
  };
  g.add(mesh(new THREE.BoxGeometry(2.4, 0.28, 2.4), stone, [0, 0.14, 0]));
  g.add(mesh(new THREE.BoxGeometry(1.9, 0.26, 1.9), stone, [0, 0.41, 0]));
  // 층 수와 층마다 줄어드는 비율은 유전자가 정한다 (2~5층)
  const dn = getDna();
  const tiers = dn.k ? dn.tiers : 3;
  const shrink = dn.k ? 0.72 + (dn.petalDepth - 0.08) * 0.8 : 0.76;
  let y = 0.54;
  let w = 1.15;
  let h = 0.95;
  for (let i = 0; i < tiers; i += 1) {
    g.add(mesh(new THREE.BoxGeometry(w, h, w), stone, [0, y + h / 2, 0]));
    if (i === 0) {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.68, w * 0.68), texMat(tex));
      face.position.set(0, y + h / 2, w / 2 + 0.002);
      g.add(face);
      g.add(mesh(new THREE.BoxGeometry(w * 0.75, w * 0.75, 0.02), m.gold, [0, y + h / 2, w / 2 - 0.008]));
    }
    g.add(roof(w, y + h + 0.16));
    y += h + 0.32;
    w *= shrink;
    h = Math.max(0.3, h * 0.68);
  }
  // 상륜부: 노반 · 복발 · 보륜 · 보주
  const top = y - 0.12;
  g.add(mesh(new THREE.BoxGeometry(0.24, 0.1, 0.24), stone, [0, top, 0]));
  g.add(mesh(new THREE.SphereGeometry(0.16, 16, 12), stone, [0, top + 0.16, 0]));
  [0.0, 0.1, 0.2].forEach((dy, i) => g.add(mesh(new THREE.TorusGeometry(0.1 - i * 0.02, 0.02, 8, 24), stone, [0, top + 0.34 + dy, 0], [Math.PI / 2, 0, 0])));
  g.add(mesh(new THREE.SphereGeometry(0.05, 12, 10), m.gold, [0, top + 0.71, 0]));
  g.position.y = -(top + 0.75) / 2;
  return g;
};

export const treasureHanok = ({ tex, m }) => {
  // 한옥 기와집: 돌 기단 + 붉은 기둥 + 큰 문(조각보) + 기와 지붕. 처마 끝이 살짝 들린다
  const g = new THREE.Group();
  const stone = stoneMat();
  g.add(mesh(new THREE.BoxGeometry(3.0, 0.22, 2.0), stone, [0, 0.11, 0]));
  g.add(mesh(new THREE.BoxGeometry(2.4, 1.2, 1.5), m.silkWhite, [0, 0.82, -0.12]));
  [-1.05, -0.35, 0.35, 1.05].forEach((x) => g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.25, 14), m.lacquerRed, [x, 0.84, 0.66])));
  g.add(mesh(new THREE.BoxGeometry(2.3, 0.1, 0.1), m.lacquerRed, [0, 1.42, 0.66]));
  g.add(mesh(new THREE.BoxGeometry(2.3, 0.08, 0.08), m.lacquerRed, [0, 0.26, 0.66]));
  // 문: 가운데 큰 문에 조각보
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.1), texMat(tex));
  door.position.set(0, 0.84, 0.642);
  g.add(door);
  g.add(mesh(new THREE.BoxGeometry(1.38, 1.18, 0.02), m.woodDark, [0, 0.84, 0.63]));
  [-0.35 * 0, 0].forEach(() => {});
  g.add(mesh(new THREE.BoxGeometry(0.03, 1.1, 0.03), m.woodDark, [0, 0.84, 0.66]));
  [-0.9, 0.9].forEach((x) => {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.1), new THREE.MeshStandardMaterial({ color: 0xf2e6c8, roughness: 0.9 }));
    w.position.set(x, 0.84, 0.642);
    g.add(w);
    [-0.12, 0.12].forEach((dx) => g.add(mesh(new THREE.BoxGeometry(0.02, 1.1, 0.02), m.woodDark, [x + dx, 0.84, 0.655])));
    g.add(mesh(new THREE.BoxGeometry(0.5, 0.02, 0.02), m.woodDark, [x, 0.84, 0.655]));
  });
  // 지붕: 맞배/팔작 느낌의 사각뿔대 + 용마루
  const rf = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 2.35, 0.95, 4), tileMat());
  rf.rotation.y = Math.PI / 4;
  rf.scale.set(1.0, 1.0, 0.72);
  rf.position.y = 1.95;
  g.add(rf);
  g.add(mesh(new THREE.BoxGeometry(1.6, 0.09, 0.12), tileMat(), [0, 2.45, 0]));
  g.rotation.x = 0.08;
  g.position.y = -1.1;
  return g;
};

export const treasureOnggi = ({ tex, m }) => {
  // 장독: 짙은 갈색 옹기 항아리 — 배에 조각보를 두르고 뚜껑을 덮는다
  const g = new THREE.Group();
  const clay = new THREE.MeshPhysicalMaterial({ color: 0x6b3d22, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.35 });
  const prof = warpProfile([[0.0, 0], [0.55, 0], [0.62, 0.06], [0.82, 0.3], [0.98, 0.7], [1.02, 1.0], [0.95, 1.35], [0.74, 1.62], [0.62, 1.72], [0.62, 1.84], [0.7, 1.9], [0.66, 1.95]], 0.8);
  g.add(lathe(prof, dbl(clay), 96));
  g.add(patchOnLathe(prof, 3, 7, -0.95, 1.9, texMat(tex), 1.008));
  const rimR = prof[9][0];
  g.add(mesh(new THREE.CylinderGeometry(rimR - 0.04, rimR + 0.02, 0.12, 48), clay, [0, 1.99, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.2, 0.05, 10, 32, Math.PI), clay, [0, 2.05, 0]));
  g.add(mesh(new THREE.TorusGeometry(rimR + 0.02, 0.025, 8, 64), m.woodLight, [0, 1.9, 0], [Math.PI / 2, 0, 0]));
  g.position.y = -1.1;
  return g;
};

export const treasureKite = ({ tex, m }) => {
  // 방패연: 한지에 조각보가 덧붙고 가운데 둥근 방구멍이 뚫린 연. 대나무 살과 꼬리줄
  const g = new THREE.Group();
  const w = 2.0;
  const h = 2.4;
  const paperF = new THREE.Mesh(new THREE.PlaneGeometry(w, h), texMat(tex, { side: THREE.DoubleSide }));
  g.add(paperF);
  g.add(mesh(new THREE.CircleGeometry(0.4, 40), new THREE.MeshBasicMaterial({ color: 0x15110e, side: THREE.DoubleSide }), [0, 0, 0.004]));
  g.add(mesh(new THREE.CircleGeometry(0.4, 40), new THREE.MeshBasicMaterial({ color: 0x15110e, side: THREE.DoubleSide }), [0, 0, -0.004]));
  g.add(mesh(new THREE.TorusGeometry(0.4, 0.015, 8, 40), m.lacquerRed, [0, 0, 0.006]));
  // 연 가장자리 대나무 테두리 + 살(앞뒤 양쪽에서 비치도록 앞면에도 얇게)
  const bam = m.bamboo;
  [[0, h / 2, w, 0.035], [0, -h / 2, w, 0.035]].forEach(([x, y, ww]) => g.add(mesh(new THREE.BoxGeometry(ww, 0.035, 0.03), bam, [x, y, 0])));
  [-w / 2, w / 2].forEach((x) => g.add(mesh(new THREE.BoxGeometry(0.035, h, 0.03), bam, [x, 0, 0])));
  g.add(mesh(new THREE.BoxGeometry(0.035, h, 0.03), bam, [0, 0, -0.02]));
  g.add(mesh(new THREE.BoxGeometry(w, 0.035, 0.03), bam, [0, 0, -0.02]));
  const diag = Math.hypot(w, h);
  [Math.atan2(w, h), -Math.atan2(w, h)].forEach((a) => g.add(mesh(new THREE.BoxGeometry(0.03, diag, 0.025), bam, [0, 0, -0.035], [0, 0, a])));
  // 꼬리 — 길게 늘어진 종이띠 세 줄
  [-0.55, 0, 0.55].forEach((x) => {
    const len = x === 0 ? 1.2 : 0.8;
    g.add(mesh(new THREE.PlaneGeometry(0.06, len), new THREE.MeshStandardMaterial({ color: x === 0 ? 0xb32b2b : 0x2a5d8f, side: THREE.DoubleSide, roughness: 0.8 }), [x, -h / 2 - len / 2, 0.0]));
  });
  // 연줄
  g.add(tube([[0, h / 2 - 0.2, 0.0], [0, h / 2 + 0.25, 0.25], [0.05, h / 2 + 0.4, 0.35]], 0.012, m.silkWhite, 12));
  g.position.y = 0.25;
  return g;
};
