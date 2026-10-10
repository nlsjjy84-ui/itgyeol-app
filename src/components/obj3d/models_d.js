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
  const prof = warpProfile([[0.0, 0], [0.45, 0], [0.48, 0.06], [0.6, 0.2], [0.82, 0.45], [1.02, 0.8], [1.1, 1.2], [1.07, 1.5], [0.92, 1.78], [0.7, 1.98], [0.54, 2.08], [0.52, 2.16], [0.58, 2.24], [0.52, 2.3]]);
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
  return g;
};

export const treasureMaebyeong = ({ tex, m }) => {
  // 청자 매병: 어깨가 넓고 허리가 가는 병
  const prof = warpProfile([[0.0, 0], [0.46, 0], [0.5, 0.06], [0.46, 0.4], [0.4, 0.9], [0.46, 1.4], [0.64, 1.9], [0.74, 2.3], [0.68, 2.7], [0.46, 2.92], [0.3, 3.04], [0.28, 3.14], [0.34, 3.22], [0.27, 3.27]]);
  const g = new THREE.Group();
  const body = lathe(prof, m.celadon, 96);
  body.material = m.celadon.clone();
  body.material.side = THREE.DoubleSide;
  g.add(body);
  g.add(patchOnLathe(prof, 3, 8, -0.9, 1.8, texMat(tex), 1.01));
  g.add(mesh(new THREE.TorusGeometry(prof[12][0] - 0.04, 0.012, 8, 56), m.gold, [0, 3.2, 0], [Math.PI / 2, 0, 0]));
  g.position.y = -1.5;
  return g;
};

export const treasureBandaji = ({ tex, m }) => {
  // 반닫이: 앞판이 위아래로 열리는 전통 궤. 앞판에 조각보를 덧대고 놋쇠 장식
  const g = new THREE.Group();
  g.add(rbox(2.4, 1.6, 1.15, m.wood, 0.06));
  g.add(mesh(new THREE.BoxGeometry(2.46, 0.05, 1.2), m.woodDark, [0, 0.35, 0]));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 1.15), texMat(tex));
  face.position.set(0, -0.12, 0.5885);
  g.add(face);
  g.add(mesh(new THREE.BoxGeometry(1.95, 1.25, 0.01), m.gold, [0, -0.12, 0.577]));
  // 앞 장식: 자물쇠판(윗칸)과 경첩
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 24), m.brass, [0, 0.6, 0.585], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 14), m.ink, [0, 0.6, 0.6], [Math.PI / 2, 0, 0]));
  [-0.9, 0.9].forEach((x) => g.add(mesh(new THREE.BoxGeometry(0.4, 0.18, 0.02), m.brass, [x, 0.68, 0.585])));
  [[-1.22, 0.1], [1.22, 0.1]].forEach(([x, y]) => {
    g.add(mesh(new THREE.TorusGeometry(0.14, 0.025, 10, 24), m.brass, [x, y, 0], [0, Math.PI / 2, 0]));
    g.add(mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 12), m.brass, [x * 0.995, y + 0.14, 0], [0, 0, Math.PI / 2]));
  });
  [[-1.2, -0.8], [1.2, -0.8]].forEach(([x, y]) => g.add(mesh(new THREE.BoxGeometry(0.18, 0.22, 1.22), m.woodDark, [x, y + 0.45, 0])));
  [-0.9, 0.9].forEach((x) => g.add(mesh(new THREE.BoxGeometry(0.28, 0.16, 0.9), m.woodDark, [x, -0.88, 0])));
  g.rotation.y = 0.4;
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
  return g;
};

export const treasureSoban = ({ tex, m }) => {
  // 소반: 작은 밥상. 상판에 조각보를 깔고, 굽은 다리가 받친다
  const g = new THREE.Group();
  const top = plaque(1.45, 0.1, texMat(tex), m.woodDark, m.wood);
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.95;
  g.add(top);
  g.add(mesh(new THREE.TorusGeometry(1.45, 0.07, 12, 96), m.wood, [0, 0.98, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(1.35, 1.3, 0.18, 96, 1, true), m.woodDark, [0, 0.82, 0]));
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(a) * 1.0;
    const z = Math.sin(a) * 1.0;
    g.add(tube([[x, 0.8, z], [x * 1.08, 0.4, z * 1.08], [x * 1.0, -0.1, z * 1.0], [x * 1.12, -0.5, z * 1.12]], 0.075, m.woodDark, 24));
    g.add(mesh(new THREE.SphereGeometry(0.1, 12, 10), m.gold, [x * 1.12, -0.5, z * 1.12]));
  }
  g.add(mesh(new THREE.TorusGeometry(1.12, 0.05, 10, 72), m.wood, [0, -0.45, 0], [Math.PI / 2, 0, 0]));
  g.rotation.x = 0.35;
  g.position.y = -0.1;
  return g;
};
