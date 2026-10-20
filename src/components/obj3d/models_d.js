import {
  THREE, getDna, warpProfile, smoothProfile, mesh, group, lathe, cyl, torus, sphere, rbox, tube, tassel, knot, plaque, slab, texMat, extrudeShape, planarUV,
} from './kit';

// 우리나라 보물(문화유산) 형태 위에 조각보를 입힌다 — 항아리·병·상자·보따리·갓·소반.
// 조각보는 "여러 조각을 이어 하나로 만든 보자기"라서, 그릇을 감싸거나 상판·앞판이 되기에 어울린다.

// 회전체 위에 조각보를 '덧대'는 헬퍼: 프로필 일부 구간(j0~j1)·각도 일부를 다시 그려 천을 붙인 듯 보이게 한다
function patchOnLathe(prof, j0, j1, phiStart, phiLength, mat, grow = 1.006) {
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

export const treasureMoonJar = ({ tex, m }) => {
  // 백자 달항아리 (보물 제1438호 같은 둥근 항아리)
  const prof = warpProfile([[0.0, 0], [0.45, 0], [0.48, 0.06], [0.6, 0.2], [0.82, 0.45], [1.02, 0.8], [1.1, 1.2], [1.07, 1.5], [0.92, 1.78], [0.7, 1.98], [0.54, 2.08], [0.52, 2.16], [0.58, 2.24], [0.52, 2.3]], 0.5); // 달항아리는 실물처럼 둥근 꼴을 크게 벗어나지 않게(놀이에 따른 변형은 절반만)
  const g = new THREE.Group();
  const body = lathe(prof, m.porcelain, 96);
  body.material = m.porcelain.clone();
  body.material.side = THREE.DoubleSide;
  g.add(body);
  // 조각보를 앞쪽 배에 붙인다
  g.add(patchOnLathe(prof, 4, 8, -0.95, 1.9, texMat(tex), 1.008));
  // 달항아리는 위아래 두 쪽을 붙여 빚는다 — 허리의 이음 자국
  g.add(mesh(new THREE.TorusGeometry(prof[6][0] + 0.002, 0.007, 8, 96), m.porcelain, [0, prof[6][1], 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(prof[12][0] - 0.04, 0.012, 8, 64), m.gold, [0, prof[12][1], 0], [Math.PI / 2, 0, 0]));
  g.position.y = -1.1;
  g.userData.deform = 0.35; // 실물 꼴 유지
  return g;
};

export const treasureMaebyeong = ({ tex, m }) => {
  // 청자 매병: 어깨가 넓고 허리가 가는 병
  // 실물(고려 청자 매병) 비율: 높이 대비 가장 넓은 어깨 지름 약 0.58, 어깨는 위에서 1/4 지점, 굽은 어깨의 절반 남짓, 입은 작고 두툼하게 말린다
  const prof = warpProfile([[0.0, 0], [0.5, 0], [0.53, 0.05], [0.5, 0.25], [0.5, 0.6], [0.56, 1.1], [0.7, 1.6], [0.86, 2.05], [0.93, 2.35], [0.88, 2.62], [0.66, 2.86], [0.36, 3.0], [0.22, 3.06], [0.25, 3.13], [0.24, 3.2], [0.18, 3.22]], 0.5);
  const g = new THREE.Group();
  const body = lathe(prof, m.celadon, 96);
  body.material = m.celadon.clone();
  body.material.side = THREE.DoubleSide;
  g.add(body);
  g.add(patchOnLathe(prof, 4, 9, -0.9, 1.8, texMat(tex), 1.01));
  g.position.y = -1.5;
  g.userData.deform = 0.35; // 실물 꼴 유지
  return g;
};

export const treasureBandaji = ({ tex, m }) => {
  // 반닫이: 앞판 위쪽 절반이 문이 되어 아래로 젖혀 여는 궤(강화·박천 반닫이 꼴).
  // 반듯한 상자 몸 · 살짝 내민 천판 · 아래 받침과 짧은 발 · 앞면 기둥과 쇠목(가로대).
  // 문판에 조각보를 대고, 장석(경첩·앞바탕과 자물쇠·귀장식·감잡이·광두정·들쇠)을 단다 — 장석은 고른 쇠붙이로.
  const g = new THREE.Group();
  const W = 2.4, H = 1.7, D = 1.12, F = D / 2;
  const fit = m.brass.clone(); fit.userData = { ...m.brass.userData, accentFit: true };
  const wood = m.wood;
  g.add(mesh(new THREE.BoxGeometry(W, H, D), wood, [0, 0, 0]));
  g.add(mesh(new THREE.BoxGeometry(W + 0.08, 0.07, D + 0.06), wood, [0, H / 2 + 0.035, 0])); // 천판
  g.add(mesh(new THREE.BoxGeometry(W + 0.04, 0.14, D + 0.04), wood, [0, -H / 2 - 0.07, 0])); // 받침
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => g.add(mesh(new THREE.BoxGeometry(0.16, 0.12, 0.16), wood, [sx * (W / 2 - 0.06), -H / 2 - 0.2, sz * (F - 0.06)])));
  // 앞면 틀: 양쪽 기둥, 위·가운데·아래 쇠목
  const yMid = 0.02, yTop = H / 2 - 0.09, yBot = -H / 2 + 0.08;
  [-1, 1].forEach((sx) => g.add(mesh(new THREE.BoxGeometry(0.2, H, 0.04), wood, [sx * (W / 2 - 0.1), 0, F + 0.02])));
  [[yTop, 0.18], [yMid, 0.12], [yBot, 0.16]].forEach(([y, h]) => g.add(mesh(new THREE.BoxGeometry(W - 0.4, h, 0.04), wood, [0, y, F + 0.02])));
  // 문판(위 칸)에 조각보, 아래 칸은 나무 그대로
  const doorH = yTop - 0.09 - (yMid + 0.06), doorY = (yTop - 0.09 + yMid + 0.06) / 2;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.4, doorH), texMat(tex));
  face.position.set(0, doorY, F + 0.005);
  g.add(face);
  // 경첩: 문 아래쪽, 가운데 쇠목에 걸친 나비 모양 두 쌍
  [-0.62, 0.62].forEach((x) => {
    [[0.11, 1], [-0.07, -1]].forEach(([dy, s]) => {
      const leaf = mesh(new THREE.BoxGeometry(0.18, 0.18, 0.012), fit, [x, yMid + dy, F + 0.046]);
      leaf.rotation.z = Math.PI / 4; leaf.scale.set(1, 0.75, 1); g.add(leaf);
    });
    g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.22, 10), fit, [x, yMid + 0.02, F + 0.05], [0, 0, Math.PI / 2]));
  });
  // 앞바탕(둥근 자물쇠 바탕)·배목·자물쇠: 문 위 가운데, 위 쇠목에 걸쳐
  g.add(mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.012, 40), fit, [0, yTop - 0.12, F + 0.046], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 40), fit, [0, yTop - 0.12, F + 0.053]));
  g.add(mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 16), fit, [0, yTop - 0.06, F + 0.07], [0, Math.PI / 2, 0]));
  g.add(mesh(new THREE.BoxGeometry(0.2, 0.07, 0.05), fit, [0, yTop - 0.19, F + 0.08]));
  g.add(mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 16, Math.PI), fit, [0, yTop - 0.155, F + 0.08]));
  // 귀장식: 앞면 네 귀의 ㄱ자 쇠
  [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sy]) => {
    const x = sx * (W / 2 - 0.12), y = sy * (H / 2 - 0.12);
    g.add(mesh(new THREE.BoxGeometry(0.26, 0.06, 0.012), fit, [x - sx * 0.06, y + sy * 0.09, F + 0.046]));
    g.add(mesh(new THREE.BoxGeometry(0.06, 0.26, 0.012), fit, [x + sx * 0.09, y - sy * 0.06, F + 0.046]));
  });
  // 감잡이: 기둥과 가운데 쇠목이 만나는 곳, 광두정(둥근 못)
  [-1, 1].forEach((sx) => {
    g.add(mesh(new THREE.BoxGeometry(0.22, 0.08, 0.012), fit, [sx * (W / 2 - 0.2), yMid, F + 0.046]));
    for (let k = 0; k < 6; k += 1) g.add(mesh(new THREE.SphereGeometry(0.022, 8, 6), fit, [sx * (W / 2 - 0.1), -H / 2 + 0.2 + k * 0.26, F + 0.045], null, [1, 1, 0.5]));
  });
  // 들쇠: 양 옆면 위쪽 손잡이
  [-1, 1].forEach((sx) => {
    g.add(mesh(new THREE.BoxGeometry(0.012, 0.1, 0.22), fit, [sx * (W / 2 + 0.006), 0.42, 0]));
    g.add(mesh(new THREE.TorusGeometry(0.12, 0.016, 8, 24, Math.PI), fit, [sx * (W / 2 + 0.03), 0.38, 0], [0, Math.PI / 2, Math.PI]));
  });
  g.rotation.y = 0.4;
  g.position.y = 0.1;
  g.userData.deform = 0.35; // 실물 꼴 유지
  return g;
};

export const treasureBottari = ({ tex, m }) => {
  // 보따리(보퉁이): 조각보 자체를 보자기로 써서 물건을 싼 모양 — 위에서 네 귀를 묶는다
  const cloth = texMat(tex, { rough: 0.85 });
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(1, 72, 52);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i += 1) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const ang = Math.atan2(z, x);
    const fold = 1 + 0.05 * Math.sin(ang * 5 + y * 3) * Math.max(0, y);
    p.setX(i, x * fold * 1.12);
    p.setZ(i, z * fold * 0.92);
    p.setY(i, y * (y > 0 ? 0.78 : 0.62));
  }
  geo.computeVertexNormals();
  planarUV(geo);
  g.add(new THREE.Mesh(geo, cloth));
  // 위쪽 매듭: 네 귀가 모여 묶인다
  const knotMat = texMat(tex, { rough: 0.85, repeat: [0.4, 0.4], offset: [0.3, 0.3] });
  g.add(mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.35, 24), knotMat, [0, 0.72, 0]));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.12, 14, 28), knotMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.9, 0);
  g.add(ring);
  [-0.7, -0.2, 0.3, 0.8].forEach((a, i) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.6, 14), knotMat);
    ear.position.set(Math.sin(a * 2.2) * 0.33, 1.22, Math.cos(a * 2.2) * 0.2);
    ear.rotation.set(0.2 * Math.cos(a), 0, -Math.sin(a * 2.2) * 0.7);
    g.add(ear);
  });
  g.position.y = -0.45;
  return g;
};

export const treasureGat = ({ tex, m }) => {
  // 갓: 말총으로 엮은 검은 갓. 모자(대우)에 조각보 띠를 두르고 옥구슬 갓끈
  const g = new THREE.Group();
  const crown = lathe([[0, 1.18], [0.28, 1.17], [0.38, 1.1], [0.42, 0.9], [0.43, 0.4], [0.5, 0.05], [0.58, 0.0]], m.lacquerBlack, 56);
  crown.material = m.lacquerBlack.clone();
  crown.material.side = THREE.DoubleSide;
  g.add(crown);
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.045, 96), m.lacquerBlack);
  brim.position.y = 0.0;
  g.add(brim);
  g.add(mesh(new THREE.TorusGeometry(1.5, 0.03, 10, 96), m.lacquerBlack, [0, 0.0, 0], [Math.PI / 2, 0, 0]));
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.435, 0.5, 0.42, 72, 1, true), texMat(tex, { repeat: [2.4, 1], side: THREE.DoubleSide }));
  band.position.y = 0.25;
  g.add(band);
  // 갓끈 — 옥구슬 줄이 양쪽에서 턱 밑으로
  [-1, 1].forEach((s) => {
    const pts = [];
    for (let i = 0; i <= 14; i += 1) {
      const t = i / 14;
      pts.push([s * (0.5 + 0.0 * t) * (1 - t * 0.0), -0.1 - t * 0.9, 0.5 * Math.sin(t * Math.PI) * 0.4 + 0.45]);
    }
    g.add(tube(pts, 0.012, m.silkRed, 24));
    pts.forEach((p, i) => { if (i % 2 === 0 && i > 0) g.add(mesh(new THREE.SphereGeometry(0.05, 12, 10), m.jade, p)); });
  });
  g.position.y = -0.4;
  g.rotation.x = 0.15;
  g.userData.deform = 0.35; // 실물 꼴 유지
  return g;
};

export const treasureSoban = ({ tex, m }) => {
  // 소반(호족반): 둥근 상판 가장자리에 턱(전)을 두르고, 그 아래 운각(장식 판)을 두른 뒤,
  // 범 다리처럼 위는 밖으로 불룩하고 아래로 모였다 발끝이 살짝 벌어지는 네 다리가 바닥의 족대(가락지)에 선다.
  const g = new THREE.Group();
  const R = 1.3;
  const top = plaque(R, 0.07, texMat(tex), m.wood, m.wood);
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.95;
  g.add(top);
  g.add(mesh(new THREE.TorusGeometry(R, 0.045, 10, 96), m.wood, [0, 0.99, 0], [Math.PI / 2, 0, 0], [1, 1, 1.3])); // 전
  // 운각: 상판 밑을 두른 판, 아래 가장자리가 물결(구름) 모양
  const apron = new THREE.CylinderGeometry(R * 0.86, R * 0.86, 0.2, 96, 1, true);
  const pa = apron.attributes.position;
  for (let i = 0; i < pa.count; i += 1) if (pa.getY(i) < 0) { const a = Math.atan2(pa.getZ(i), pa.getX(i)); pa.setY(i, -0.1 + 0.05 * Math.max(0, Math.cos(a * 8))); }
  apron.computeVertexNormals();
  const apronMat = m.wood.clone(); apronMat.side = THREE.DoubleSide;
  g.add(mesh(apron, apronMat, [0, 0.82, 0]));
  // 호족 다리 넷
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a);
    const P = (r, y) => [c * r, y, s * r];
    g.add(tube([P(0.98, 0.84), P(1.1, 0.62), P(1.06, 0.3), P(0.9, 0.0), P(0.86, -0.26), P(0.94, -0.42)], 0.07, m.wood, 32));
    g.add(mesh(new THREE.SphereGeometry(0.075, 12, 10), m.wood, P(0.95, -0.44), null, [1.2, 0.6, 1.2]));
  }
  // 족대(가락지): 바닥에 놓인 둥근 테
  g.add(mesh(new THREE.TorusGeometry(0.95, 0.055, 10, 96), m.wood, [0, -0.5, 0], [Math.PI / 2, 0, 0], [1, 1, 0.7]));
  g.rotation.x = 0.35;
  g.position.y = -0.1;
  g.userData.deform = 0.35; // 실물 꼴 유지
  return g;
};
