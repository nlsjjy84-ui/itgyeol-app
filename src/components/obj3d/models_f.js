import { THREE, getDna, warpProfile, smoothProfile, mesh, lathe, rbox, tube, sphere, plaque, texMat } from './kit';

// 우리나라 보물 2 — 범종 · 금관 · 석탑 · 한옥 · 장독 · 방패연.

// 기와·기단 돌은 사용자가 고른 재료와 상관없이 실물 그대로 둔다(fixed)
const stoneMat = () => { const m = new THREE.MeshStandardMaterial({ color: 0xbdb8a8, roughness: 0.92 }); m.userData.fixed = true; m.userData.matId = 'granite'; return m; };
const tileMat = () => { const m = new THREE.MeshStandardMaterial({ color: 0x3c4146, roughness: 0.55, metalness: 0.1 }); m.userData.fixed = true; m.userData.matId = 'earthen'; return m; };

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
  // 범종(상원사 동종·성덕대왕신종 꼴): 아래로 갈수록 살짝 불렀다가 입이 안으로 오므라드는 몸통,
  // 위아래 띠(상대·하대), 상대 밑 네 곳의 유곽(젖꼭지 9개씩), 옆구리의 당좌(치는 자리), 꼭대기 용뉴와 음통.
  // 앞쪽 비천상 자리에 조각보를 붙인다.
  const g = new THREE.Group();
  const prof = [[0.8, 0], [0.84, 0.03], [0.87, 0.16], [0.885, 0.45], [0.88, 0.8], [0.865, 1.2], [0.84, 1.6], [0.8, 1.9], [0.75, 2.08], [0.62, 2.18], [0.36, 2.23], [0.0, 2.24]];
  g.add(lathe(prof, dbl(m.bronze), 96));
  const rAt = (y) => { for (let i = 1; i < prof.length; i += 1) { const [r0, y0] = prof[i - 1], [r1, y1] = prof[i]; if (y <= y1) return r0 + (r1 - r0) * ((y - y0) / Math.max(1e-6, y1 - y0)); } return 0; };
  const band = (y0, y1, grow) => { const pts = []; for (let k = 0; k <= 6; k += 1) { const y = y0 + ((y1 - y0) * k) / 6; pts.push(new THREE.Vector2(rAt(y) * grow, y)); } return new THREE.Mesh(new THREE.LatheGeometry(pts, 96), m.bronze); };
  // 하대·상대: 몸통보다 도드라진 무늬 띠, 위아래에 가는 테
  g.add(band(0.05, 0.3, 1.018));
  g.add(band(1.86, 2.06, 1.016));
  [0.05, 0.3, 1.86, 2.06].forEach((y) => g.add(mesh(new THREE.TorusGeometry(rAt(y) * 1.02, 0.012, 6, 96), m.bronze, [0, y, 0], [Math.PI / 2, 0, 0])));
  // 비천상 자리(앞)에 조각보
  g.add(patchOnLathe(prof, 3, 6, -0.5, 1.0, texMat(tex), 1.008));
  // 유곽 네 곳: 네모 테 안에 연꽃 봉오리(유두) 3×3
  const slope = Math.atan((rAt(1.55) - rAt(1.85)) / 0.3);
  [-1.05, 1.05, Math.PI - 1.05, Math.PI + 1.05].forEach((phi) => {
    const yc = 1.62, r = rAt(yc), u = new THREE.Group();
    u.position.set(Math.sin(phi) * r, yc, Math.cos(phi) * r);
    u.rotation.set(0, phi, 0);
    const inner = new THREE.Group(); inner.rotation.x = -slope; u.add(inner);
    const S = 0.4, t = 0.035;
    [[0, S / 2], [0, -S / 2]].forEach(([x, y]) => inner.add(mesh(new THREE.BoxGeometry(S + t, t, 0.03), m.bronze, [x, y, 0.005])));
    [[S / 2, 0], [-S / 2, 0]].forEach(([x, y]) => inner.add(mesh(new THREE.BoxGeometry(t, S + t, 0.03), m.bronze, [x, y, 0.005])));
    for (let i = -1; i <= 1; i += 1) for (let j = -1; j <= 1; j += 1) {
      inner.add(mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.035, 12), m.bronze, [i * 0.12, j * 0.12, 0.018], [Math.PI / 2, 0, 0]));
      inner.add(mesh(new THREE.SphereGeometry(0.03, 10, 8), m.bronze, [i * 0.12, j * 0.12, 0.04]));
    }
    g.add(u);
  });
  // 당좌: 종을 치는 자리 — 연꽃 둥근 판(양 옆)
  [Math.PI / 2, -Math.PI / 2].forEach((phi) => {
    const yc = 0.62, r = rAt(yc), d = new THREE.Group();
    d.position.set(Math.sin(phi) * r, yc, Math.cos(phi) * r);
    d.rotation.set(0, phi, 0);
    d.add(mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.025, 32), m.bronze, [0, 0, 0.01], [Math.PI / 2, 0, 0]));
    d.add(mesh(new THREE.TorusGeometry(0.17, 0.014, 6, 32), m.bronze, [0, 0, 0.024]));
    for (let k = 0; k < 8; k += 1) { const a = (k / 8) * Math.PI * 2; d.add(mesh(new THREE.SphereGeometry(0.035, 10, 8), m.bronze, [Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.024], null, [1, 1, 0.5])); }
    d.add(mesh(new THREE.SphereGeometry(0.045, 12, 10), m.bronze, [0, 0, 0.026], null, [1, 1, 0.6]));
    g.add(d);
  });
  // 용뉴(고리를 문 용) + 음통(소리 대롱, 마디 띠)
  g.add(tube([[-0.3, 2.22, 0], [-0.34, 2.42, 0], [-0.24, 2.62, 0], [-0.04, 2.7, 0], [0.12, 2.64, 0], [0.16, 2.5, 0.0]], 0.09, m.bronze, 48));
  g.add(mesh(new THREE.SphereGeometry(0.12, 16, 12), m.bronze, [0.17, 2.45, 0], null, [1.3, 0.9, 0.9])); // 용머리
  g.add(mesh(new THREE.ConeGeometry(0.035, 0.12, 8), m.bronze, [0.14, 2.6, 0.05], [0.4, 0, -0.5]));
  [[-0.32, 0.12], [-0.32, -0.12], [0.14, 0.1], [0.14, -0.1]].forEach(([x, z]) => g.add(tube([[x, 2.4, 0], [x + 0.02, 2.3, z], [x + 0.04, 2.235, z * 1.3]], 0.028, m.bronze, 10)));
  g.add(mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.52, 18), m.bronze, [-0.1, 2.48, -0.2]));
  [2.32, 2.48, 2.64].forEach((y) => g.add(mesh(new THREE.TorusGeometry(0.085, 0.016, 6, 18), m.bronze, [-0.1, y, -0.2], [Math.PI / 2, 0, 0])));
  g.scale.set(1, 1.16, 1); // 실물(높이가 입 지름의 1.4배쯤)에 맞춰 세로로
  g.position.y = -1.5;
  g.userData.deform = 0.35; // 실물 꼴 유지
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
  g.userData.deform = 0.35; // 실물 꼴 유지
  return g;
};

export const treasurePagoda = ({ tex, m }) => {
  // 삼층석탑(불국사 석가탑 꼴): 2단 기단(면석에 우주·탱주 새김, 위에 갑석) → 몸돌(귀퉁이 우주)과
  // 지붕돌(밑면 4단 층급받침, 얇고 넓게 뻗다 귀퉁이가 살짝 들림)을 번갈아 쌓고 꼭대기에 상륜부.
  // 1층 몸돌 앞면의 문비(문 모양 새김) 자리에 조각보.
  const g = new THREE.Group();
  const stone = stoneMat();
  const pilasters = (w, h, y, n) => {
    // 면마다 귀퉁이 기둥(우주)과 가운데 기둥(탱주) n개를 살짝 도드라지게
    const xs = [-w / 2 + 0.05, w / 2 - 0.05];
    for (let i = 1; i <= n; i += 1) xs.push(-w / 2 + (w * i) / (n + 1));
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((rot) => {
      const f = new THREE.Group(); f.rotation.y = rot;
      xs.forEach((x) => f.add(mesh(new THREE.BoxGeometry(0.08, h, 0.012), stone, [x, y, w / 2 + 0.002])));
      g.add(f);
    });
  };
  const slab = (w, h, y) => g.add(mesh(new THREE.BoxGeometry(w, h, w), stone, [0, y + h / 2, 0]));
  const frustum = (wb, wt, h, y) => { const c = new THREE.Mesh(new THREE.CylinderGeometry((wt / 2) * Math.SQRT2, (wb / 2) * Math.SQRT2, h, 4, 1), stone); c.rotation.y = Math.PI / 4; c.position.y = y + h / 2; g.add(c); };
  // 하층 기단
  slab(2.7, 0.34, 0); pilasters(2.7, 0.3, 0.17, 2);
  frustum(2.82, 2.6, 0.1, 0.34);
  // 상층 기단
  slab(2.1, 0.95, 0.44); pilasters(2.1, 0.93, 0.915, 1);
  slab(2.32, 0.1, 1.39); frustum(2.32, 2.14, 0.06, 1.49);
  slab(1.3, 0.05, 1.55); // 몸돌 굄
  const dn = getDna();
  const tiers = dn.k ? dn.tiers : 3;
  const shrink = dn.k ? 0.84 + (dn.petalDepth - 0.08) * 0.5 : 0.87;
  let y = 1.6, w = 1.1;
  for (let i = 0; i < tiers; i += 1) {
    const h = i === 0 ? w * 0.86 : w * 0.46;
    slab(w, h, y);
    // 몸돌 귀퉁이 우주
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => g.add(mesh(new THREE.BoxGeometry(0.07, h, 0.07), stone, [sx * (w / 2 - 0.025), y + h / 2, sz * (w / 2 - 0.025)])));
    if (i === 0) {
      // 문비: 돌로 두른 문틀 안에 조각보
      g.add(mesh(new THREE.BoxGeometry(w * 0.5, h * 0.62, 0.025), stone, [0, y + h / 2, w / 2 + 0.006]));
      const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.42, h * 0.54), texMat(tex));
      face.position.set(0, y + h / 2, w / 2 + 0.02);
      g.add(face);
    }
    y += h;
    // 층급받침 4단(밑면 계단)
    for (let k = 0; k < 4; k += 1) slab(w * (1.08 + k * 0.1), 0.045, y + k * 0.045);
    y += 0.18;
    // 지붕돌: 얇은 처마판 + 완만한 낙수면, 네 귀가 살짝 들린다
    const R = w * 1.86;
    slab(R, 0.075, y);
    frustum(R, w * 0.62, 0.17, y + 0.075);
    y += 0.245;
    w *= shrink;
    if (i < tiers - 1) { slab(w * 0.82, 0.05, y); y += 0.05; } // 다음 몸돌 굄
  }
  // 상륜부: 노반 · 복발 · 앙화 · 보륜(5) · 보개 · 수연 · 보주, 가운데 쇠 찰주
  const top = y;
  slab(0.42, 0.14, top);
  g.add(mesh(new THREE.SphereGeometry(0.17, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), stone, [0, top + 0.14, 0], null, [1, 0.75, 1]));
  const anghwa = lathe([[0.07, 0], [0.16, 0.05], [0.2, 0.12], [0.07, 0.12]], stone, 24); anghwa.position.set(0, top + 0.27, 0); g.add(anghwa);
  g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.2, 10), m.iron, [0, top + 0.85, 0]));
  for (let k = 0; k < 5; k += 1) g.add(mesh(new THREE.TorusGeometry(0.1 - k * 0.007, 0.022, 8, 24), stone, [0, top + 0.48 + k * 0.11, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.13, 0.05, 16), stone, [0, top + 1.06, 0])); // 보개
  g.add(mesh(new THREE.ConeGeometry(0.06, 0.18, 8), stone, [0, top + 1.18, 0])); // 수연
  g.add(mesh(new THREE.SphereGeometry(0.05, 12, 10), stone, [0, top + 1.32, 0])); // 용차
  g.add(mesh(new THREE.SphereGeometry(0.045, 12, 10), stone, [0, top + 1.43, 0], null, [1, 1.3, 1])); // 보주
  const H = top + 1.5;
  g.scale.setScalar(4.2 / H);
  g.position.y = -2.1;
  g.userData.deform = 0.35; // 실물 꼴 유지
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
  g.userData.deform = 0.35; // 실물 꼴 유지
  return g;
};

export const treasureOnggi = ({ tex, m }) => {
  // 장독(옹기 항아리): 어깨가 위쪽에서 가장 넓고 아래로 좁아지는 몸, 짧은 목에 두툼하게 말린 입,
  // 어깨에 두른 띠, 얕은 둥근 뚜껑과 꼭지. 배 앞쪽에 조각보(옹기는 손으로 긁은 무늬로 옮겨진다).
  const g = new THREE.Group();
  const clay = new THREE.MeshPhysicalMaterial({ color: 0x5a3a26, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  clay.userData.matId = 'onggi';
  const prof = warpProfile([[0.0, 0], [0.6, 0], [0.64, 0.04], [0.72, 0.25], [0.86, 0.62], [0.99, 1.02], [1.05, 1.3], [1.02, 1.52], [0.9, 1.7], [0.74, 1.8], [0.69, 1.84], [0.69, 1.9], [0.75, 1.93], [0.76, 1.97], [0.7, 1.99], [0.62, 1.96]], 0.5);
  g.add(lathe(prof, dbl(clay), 96));
  g.add(patchOnLathe(prof, 3, 6, -0.9, 1.8, texMat(tex), 1.008));
  // 어깨 띠(전): 흙을 덧대 두른 두 줄
  const rAt = (y) => { for (let i = 1; i < prof.length; i += 1) { const [r0, y0] = prof[i - 1], [r1, y1] = prof[i]; if (y <= y1) return r0 + (r1 - r0) * ((y - y0) / Math.max(1e-6, y1 - y0)); } return 0; };
  [1.56, 1.62].forEach((yy) => g.add(mesh(new THREE.TorusGeometry(rAt(yy) + 0.004, 0.014, 6, 96), clay, [0, yy, 0], [Math.PI / 2, 0, 0])));
  // 뚜껑: 입을 덮는 얕은 둥근 뚜껑과 꼭지
  const lid = lathe([[0.0, 0.3], [0.09, 0.3], [0.11, 0.26], [0.08, 0.22], [0.2, 0.2], [0.48, 0.14], [0.72, 0.06], [0.8, 0.02], [0.8, 0.0], [0.7, 0.0]], dbl(clay), 72);
  lid.position.y = 1.99;
  g.add(lid);
  g.position.y = -1.15;
  g.userData.deform = 0.35; // 실물 꼴 유지
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
  g.userData.deform = 0.35; // 실물 꼴 유지
  return g;
};
