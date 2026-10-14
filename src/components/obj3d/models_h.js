import { THREE, mesh, group, rbox, tube, slab, texMat } from './kit';

// 평면 인쇄 굿즈: 천(손수건·스카프·파우치)과 종이(엽서·액자).
// 모두 무늬 그림을 그대로 인쇄하는 물건이다 — 천은 디지털 날염, 종이는 인쇄. 3D는 실물이 놓인 모습을 보여 줄 뿐이다.

const cloth = (color, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, side: THREE.DoubleSide });

// 살짝 물결진 천 한 장: w×h, 가로 물결 amp. 앞면은 무늬, 뒷면은 비쳐 보이는 옅은 무늬.
function wavyCloth(w, h, tex, { amp = 0.06, waves = 2.2, rep } = {}) {
  const geo = new THREE.PlaneGeometry(w, h, 48, 48);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = Math.sin((x / w) * Math.PI * waves) * amp + Math.sin((y / h) * Math.PI * 1.3 + 0.6) * amp * 0.6;
    pos.setZ(i, z);
  }
  geo.computeVertexNormals();
  const front = texMat(tex, { rough: 0.8, side: THREE.DoubleSide, repeat: rep });
  return new THREE.Mesh(geo, front);
}

// 손수건: 45cm 정사각 면 손수건에 무늬를 날염하고 가장자리를 말아 박았다(말아박기 단)
export const fabricHanky = ({ tex }) => {
  const g = new THREE.Group();
  const c = wavyCloth(2.4, 2.4, tex, { amp: 0.05, waves: 2 });
  g.add(c);
  const hem = cloth(0x1f3354, 0.8);
  [[0, 1.2, 0, 2.4], [0, -1.2, 0, 2.4]].forEach(([x, y]) => g.add(tube([[x - 1.2, y, 0], [x, y, 0.02], [x + 1.2, y, 0]], 0.018, hem, 24)));
  [[1.2, 0], [-1.2, 0]].forEach(([x, y]) => g.add(tube([[x, y - 1.2, 0], [x, y, 0.02], [x, y + 1.2, 0]], 0.018, hem, 24)));
  g.rotation.x = -0.35;
  return g;
};

// 스카프: 가로 길쭉한 실크 스카프를 반 접어 늘어뜨린 모습 — 무늬가 두 번 이어진다
export const fabricScarf = ({ tex }) => {
  const g = new THREE.Group();
  const s = wavyCloth(1.1, 3.2, tex, { amp: 0.08, waves: 3, rep: [1, 2] });
  g.add(s);
  // 봉에 걸친 윗부분
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 16), new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.6 }), [0, 1.62, 0], [0, 0, Math.PI / 2]));
  g.rotation.y = 0.25;
  return g;
};

// 파우치: 무늬를 날염한 천 파우치(지퍼). 앞뒤 무늬, 옆은 짙은 단
export const fabricPouch = ({ tex, m }) => {
  const g = new THREE.Group();
  const face = texMat(tex, { rough: 0.85 });
  const side = cloth(0x1f3354, 0.8);
  const body = slab(2.3, 1.6, 0.42, face, face, side, 0.18);
  g.add(body);
  g.add(tube([[-1.1, 0.8, 0], [0, 0.82, 0], [1.1, 0.8, 0]], 0.03, m.silver, 24));
  g.add(rbox(0.12, 0.26, 0.05, m.silver, 0.02).translateX(0.95).translateY(0.66).translateZ(0.22));
  return g;
};

// 엽서 두 장: 148×100mm 엽서 왼쪽에 무늬, 오른쪽에 놀이 기록 칸(줄)
function postcard(tex) {
  const g = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: 0xf7f2e6, roughness: 0.9 });
  const card = new THREE.Mesh(new THREE.BoxGeometry(2.96, 2.0, 0.02), paper);
  g.add(card);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), texMat(tex, { rough: 0.85 }));
  art.position.set(-0.48, 0, 0.012);
  g.add(art);
  const ink = new THREE.MeshStandardMaterial({ color: 0x9a8f80, roughness: 0.9 });
  [0.4, 0.15, -0.1, -0.35, -0.6].forEach((y) => g.add(mesh(new THREE.BoxGeometry(0.85, 0.012, 0.004), ink, [0.95, y, 0.012])));
  g.add(mesh(new THREE.BoxGeometry(0.32, 0.38, 0.004), ink, [1.2, 0.7, 0.012]));
  return g;
}
export const paperPostcard = ({ tex }) => {
  const g = new THREE.Group();
  const a = postcard(tex);
  a.rotation.z = 0.06;
  a.position.set(0.15, 0.25, 0);
  const b = postcard(tex);
  b.rotation.z = -0.1;
  b.position.set(-0.15, -0.3, -0.05);
  g.add(b, a);
  g.rotation.x = -0.25;
  return g;
};

// 작은 액자: 나무 틀 + 흰 여백(매트) + 무늬 그림, 뒤에 받침
export const paperFrame = ({ tex, m }) => {
  const g = new THREE.Group();
  const wood = m.wood;
  const W = 2.2;
  const bar = 0.16;
  [[0, W / 2 - bar / 2, W, bar], [0, -W / 2 + bar / 2, W, bar], [W / 2 - bar / 2, 0, bar, W], [-W / 2 + bar / 2, 0, bar, W]].forEach(([x, y, w, h]) =>
    g.add(mesh(new THREE.BoxGeometry(w, h, 0.16), wood, [x, y, 0]))
  );
  g.add(mesh(new THREE.BoxGeometry(W - bar * 2, W - bar * 2, 0.04), new THREE.MeshStandardMaterial({ color: 0xf8f5ec, roughness: 0.9 }), [0, 0, -0.02]));
  const art = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), texMat(tex, { rough: 0.8 }));
  art.position.set(0, 0, 0.005);
  g.add(art);
  g.add(mesh(new THREE.BoxGeometry(0.12, 1.2, 0.05), wood, [0, -0.35, -0.42], [-0.5, 0, 0]));
  g.rotation.y = -0.2;
  return group(g);
};

// 수건: 34×80cm 면 수건에 무늬를 날염해 봉에 걸어 둔 모습 — 무늬가 두 번 이어진다
export const fabricTowel = ({ tex }) => {
  const g = new THREE.Group();
  const s = wavyCloth(1.2, 2.8, tex, { amp: 0.05, waves: 2.5, rep: [1, 2] });
  g.add(s);
  const hem = cloth(0xf3ead6, 0.95);
  [1.4, -1.4].forEach((y) => g.add(mesh(new THREE.BoxGeometry(1.2, 0.08, 0.03), hem, [0, y, 0])));
  g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 16), new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.6 }), [0, 1.46, 0], [0, 0, Math.PI / 2]));
  g.rotation.y = 0.22;
  return g;
};
