import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// 3D 모델을 만들 때 쓰는 공통 재료·도구.
// 모든 모델은 "조각보 그림 texture 한 장"을 받아서, 그 물건의 가장 어울리는 면(부채살 사이 종이, 거울 뒷면,
// 북 가죽, 주머니 앞면…)에 입히고 나머지는 전통 재질(놋쇠·옥·옻칠·나무·비단·백자)로 만든다.

export { THREE, RoundedBoxGeometry };

// ───── 형태 유전자(dna) ─────
// Obj3DViewer가 모델을 만들기 직전에 현재 작품의 유전자를 넣어 두면, 모델 도우미(술·항아리 윤곽 등)가
// getDna()로 읽어 모양을 바꾼다. 값이 없으면 원래 모양(NEUTRAL) 그대로.
import { NEUTRAL_DNA } from '../../utils/shapeDna';
export const dnaRef = { v: NEUTRAL_DNA };
export function getDna() {
  return dnaRef.v || NEUTRAL_DNA;
}

// 회전체 윤곽(항아리·병) 흔들기: 배 부풀기·물결·목 굵기를 유전자로 바꾼다
export function warpProfile(prof, k = 1) {
  const d = getDna();
  if (!d.k) return prof;
  const ys = prof.map((p) => p[1]);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return prof.map(([r, y]) => {
    if (r === 0) return [0, y];
    const sN = (y - y0) / (y1 - y0 || 1);
    const w = Math.sin(Math.PI * sN);
    let f = 1 + k * (d.pot * 0.2 * w + d.wob * 0.09 * Math.sin(2 * Math.PI * sN + d.ph) * w);
    const n = Math.max(0, (sN - 0.78) / 0.22);
    f *= 1 - k * d.neck * 0.22 * n;
    return [r * f, y];
  });
}

// 꽃잎처럼 가장자리가 굴곡진 둥근 도형 (능화형 거울 같은 모양)
export function lobedShape(R, lobes, amp, seg = 160) {
  const sh = new THREE.Shape();
  for (let i = 0; i <= seg; i += 1) {
    const a = (i / seg) * Math.PI * 2;
    const rr = R * (1 + amp * Math.cos(lobes * a));
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) sh.moveTo(x, y);
    else sh.lineTo(x, y);
  }
  return sh;
}

// 완성된 물건을 유전자대로 "빚는다": 가로·세로·깊이 비율, 위아래 폭 차이, 배 부풀기, 기울기.
// 모든 정점을 같은 함수로 옮기므로 조각보 판·장식도 몸과 같이 움직인다.
export function deformObject(obj, d) {
  if (!d || !d.k) return obj;
  obj.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(obj.matrixWorld).invert();
  const box = new THREE.Box3().setFromObject(obj);
  const cx = (box.min.x + box.max.x) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  const y0 = box.min.y;
  const h = box.max.y - box.min.y || 1;
  const meshes = [];
  obj.traverse((o) => { if (o.isMesh) meshes.push(o); });
  const out = new THREE.Group();
  const v = new THREE.Vector3();
  meshes.forEach((mm) => {
    const geo = mm.geometry.clone();
    geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, mm.matrixWorld));
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      v.fromBufferAttribute(pos, i);
      const t = (v.y - y0) / h;
      const sc = 1 + d.belly * Math.sin(Math.PI * t) + d.taper * (t - 0.5);
      const X = (v.x - cx) * sc * d.wide + d.lean * h * (t - 0.5);
      const Z = (v.z - cz) * sc * d.deep;
      const Y = y0 + (v.y - y0) * d.tall;
      pos.setXYZ(i, X + cx, Y, Z + cz);
    }
    pos.needsUpdate = true;
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    mm.geometry = geo;
    mm.position.set(0, 0, 0);
    mm.rotation.set(0, 0, 0);
    mm.scale.set(1, 1, 1);
    mm.updateMatrix();
    out.add(mm);
  });
  return out;
}

// 환경 반사가 없는 기기에서는 금속성을 낮춰 검게 보이지 않게 한다 (ctx.metal = 1 또는 0.35)
export function makeMats(metalK = 1) {
  const std = (color, rough = 0.5, metal = 0, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: Math.min(1, metal * metalK), ...extra });
  const phys = (color, rough = 0.3, metal = 0, extra = {}) =>
    new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: metal * metalK, ...extra });
  const mats = {
    brass: std(0xb98a3e, 0.35, 0.75),
    gold: std(0xd9ac3f, 0.28, 0.85),
    silver: std(0xcfd4d8, 0.28, 0.85),
    bronze: std(0x7a5a33, 0.45, 0.7),
    iron: std(0x3b3d40, 0.5, 0.8),
    jade: phys(0x86b9a0, 0.22, 0, { clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    jadeDark: phys(0x4f8a73, 0.25, 0, { clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    wood: std(0x7a4b28, 0.62),
    woodDark: std(0x3b2314, 0.6),
    woodLight: std(0xc79a62, 0.65),
    bamboo: std(0xd8b46a, 0.55),
    lacquerRed: phys(0x8c1d18, 0.25, 0, { clearcoat: 0.8, clearcoatRoughness: 0.15 }),
    lacquerBlack: phys(0x14100e, 0.22, 0, { clearcoat: 0.9, clearcoatRoughness: 0.12 }),
    porcelain: phys(0xf1efe6, 0.22, 0, { clearcoat: 0.7, clearcoatRoughness: 0.18 }),
    celadon: phys(0x9fc4b4, 0.25, 0, { clearcoat: 0.8, clearcoatRoughness: 0.15 }),
    skin: std(0xe9dcc0, 0.8),
    silkRed: std(0xb32b2b, 0.55),
    silkBlue: std(0x2a5d8f, 0.55),
    silkYellow: std(0xd9a63a, 0.55),
    silkGreen: std(0x3e7a56, 0.55),
    silkWhite: std(0xf2ead8, 0.7),
    ink: phys(0x101417, 0.28, 0.2, { clearcoat: 0.5, clearcoatRoughness: 0.3 }),
    paper: std(0xf3ead6, 0.85),
    rubber: std(0x1d1f22, 0.9),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.28, clearcoat: 1 }),
    mirror: std(0xe7ecef, 0.08, 1),
    cord: std(0xc23a2e, 0.6),
  };
  // 실제 재료 이름표 — 사용자가 재료를 고르면, 몸체가 아닌 부품(장석·고리·술·옥 장식…)은 이 이름표대로 실물 재질을 입는다
  const ID = { brass: 'yugi', gold: 'gold', silver: 'silver', bronze: 'bronze', iron: 'iron', jade: 'jade', jadeDark: 'jade', wood: 'wood', woodDark: 'wood', woodLight: 'wood', bamboo: 'bamboo',
    lacquerRed: 'otchil', lacquerBlack: 'otchil', porcelain: 'porcelain', celadon: 'celadon', silkRed: 'silk', silkBlue: 'silk', silkYellow: 'silk', silkGreen: 'silk', silkWhite: 'silk',
    ink: 'ink', paper: 'hanji', glass: 'glass', mirror: 'silver', cord: 'knot' };
  Object.entries(ID).forEach(([k, id]) => { mats[k].userData.matId = id; });
  return mats;
}

// 조각보 texture를 입힌 재료. repeat/offset으로 일부만 쓰는 것도 가능
export function texMat(tex, { rough = 0.72, repeat, offset, side } = {}) {
  let t = tex;
  if (repeat || offset) {
    t = tex.clone();
    t.needsUpdate = true;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
    if (offset) t.offset.set(offset[0], offset[1]);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
  }
  const mt = new THREE.MeshStandardMaterial({ map: t, roughness: rough, metalness: 0, side: side || THREE.FrontSide });
  mt.userData.pattern = true; // 놀이 기록으로 생긴 무늬 — 재료를 고르면 이 자리에 기법(상감·나전·자수…)이 들어간다
  return mt;
}

export function mesh(geo, mat, pos, rot, scale) {
  const m = new THREE.Mesh(geo, mat);
  if (pos) m.position.set(pos[0], pos[1], pos[2] || 0);
  if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
  if (scale) m.scale.set(scale[0], scale[1], scale[2]);
  return m;
}

export function group(...children) {
  const g = new THREE.Group();
  children.flat().forEach((c) => c && g.add(c));
  return g;
}

// 회전체(lathe): pts는 [반지름, 높이] 목록(아래→위). 항아리·북·붓대·주머니에 쓴다.
// 윤곽선 점들을 부드러운 곡선으로 다시 촘촘히 찍는다 (유전자로 빚은 항아리가 각져 보이지 않게)
export function smoothProfile(pts, per = 5) {
  if (pts.length < 4) return pts;
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'centripetal');
  const n = (pts.length - 1) * per;
  const out = [];
  for (let i = 0; i <= n; i += 1) {
    const p = curve.getPoint(i / n);
    out.push([Math.max(0, p.x), p.y]);
  }
  return out;
}

export function lathe(pts, mat, seg = 56) {
  if (getDna().k) pts = smoothProfile(pts);
  const v = pts.map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.Mesh(new THREE.LatheGeometry(v, seg), mat);
}

export function cyl(r1, r2, h, mat, seg = 40) {
  return new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, h, seg), mat);
}

export function torus(R, r, mat, arc = Math.PI * 2, seg = 48) {
  return new THREE.Mesh(new THREE.TorusGeometry(R, r, 16, seg, arc), mat);
}

export function sphere(r, mat, seg = 32) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(12, seg / 2)), mat);
}

export function rbox(w, h, d, mat, rad = 0.05) {
  return new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(rad, w / 2.2, h / 2.2, d / 2.2)), mat);
}

// 곡선 경로를 따라 휘어진 관(끈·고리·다리)
export function tube(points, r, mat, seg = 40, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2] || 0)), closed);
  return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 10, closed), mat);
}

// 술(tassel): 위에서 아래로 늘어진 실 다발 + 위쪽 묶음
export function tassel(len, w, mat, capMat, n = 28) {
  const dn = getDna();
  // 술은 프린팅하지 않고 진짜 실로 단다 → printSafe가 건드리지 않게 표시

  if (dn.k) {
    len *= dn.tassel;
    w *= 0.85 + (dn.tassel - 0.65) * 0.3;
    n += dn.tasselN;
  }
  const g = new THREE.Group();
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    const rr = (w / 2) * (0.35 + 0.65 * ((i * 7) % 5) / 4);
    const l = len * (0.86 + 0.14 * (((i * 5) % 7) / 6));
    const pts = [
      [Math.cos(a) * rr * 0.4, 0, Math.sin(a) * rr * 0.4],
      [Math.cos(a) * rr * 0.9, -l * 0.5, Math.sin(a) * rr * 0.9],
      [Math.cos(a) * rr * 1.2, -l, Math.sin(a) * rr * 1.2],
    ];
    g.add(tube(pts, 0.012, mat, 8));
  }
  // 술 윗부분: 금속 통(감싼 마디 두 줄) — 실물 노리개의 금속 덮개를 본뜬 모양
  g.add(mesh(new THREE.CylinderGeometry(w * 0.3, w * 0.4, len * 0.2, 20), capMat, [0, -len * 0.06, 0]));
  [-0.0, -0.1, -0.16].forEach((f) => g.add(mesh(new THREE.TorusGeometry(w * (0.34 + (f < -0.05 ? 0.045 : 0)), w * 0.035, 8, 20), capMat, [0, len * f * 0.9, 0], [Math.PI / 2, 0, 0])));
  g.add(mesh(new THREE.SphereGeometry(w * 0.34, 16, 12), capMat, [0, len * 0.06, 0]));
  g.userData.real = 'thread';
  return g;
}

// 매듭(동심결 느낌의 둥근 매듭) — 붉은 끈을 감은 공 + 고리
export function knot(r, mat, capMat) {
  const g = new THREE.Group();
  g.add(sphere(r, mat, 20));
  g.add(torus(r * 0.98, r * 0.18, mat, Math.PI * 2, 24));
  g.add(mesh(new THREE.TorusGeometry(r * 0.98, r * 0.18, 8, 24), mat, null, [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.TorusGeometry(r * 0.98, r * 0.18, 8, 24), mat, null, [0, Math.PI / 2, 0]));
  if (capMat) g.add(mesh(new THREE.CylinderGeometry(r * 0.4, r * 0.4, r * 0.35, 12), capMat, [0, r * 1.05, 0]));
  g.userData.real = 'thread'; // 매듭도 진짜 끈으로 맺는다
  return g;
}

// 평면 투영 UV: 도형의 x,y 범위를 0~1로 펴서 조각보 한 장이 면 전체에 꼭 맞게 한다
export function planarUV(geometry, box) {
  const pos = geometry.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  const b = box || (geometry.computeBoundingBox(), geometry.boundingBox);
  const w = b.max.x - b.min.x || 1;
  const h = b.max.y - b.min.y || 1;
  for (let i = 0; i < pos.count; i += 1) {
    uv[i * 2] = (pos.getX(i) - b.min.x) / w;
    uv[i * 2 + 1] = (pos.getY(i) - b.min.y) / h;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}

// 얇게 밀어낸(extrude) 도형: 앞뒤 면은 capMat, 옆면은 sideMat. 도형 모양이 곧 물건 모양.
export function extrudeShape(shape, depth, capMat, sideMat, bevel = 0.03) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 40,
  });
  geo.translate(0, 0, -depth / 2);
  geo.computeBoundingBox();
  const pos = geo.attributes.position;
  const b = geo.boundingBox;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i += 1) {
    uv.setXY(i, (pos.getX(i) - b.min.x) / (b.max.x - b.min.x || 1), (pos.getY(i) - b.min.y) / (b.max.y - b.min.y || 1));
  }
  return new THREE.Mesh(geo, [capMat, sideMat]);
}

export function circleShape(r, seg = 64) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  return s;
}

// 키링 고리(스플릿 링 + 쇠사슬 한 마디 + 걸이)를 물건 위쪽에 단다
export function addKeyringHook(root, mats) {
  const box = new THREE.Box3().setFromObject(root);
  const top = box.max.y;
  const cx = (box.min.x + box.max.x) / 2;
  const g = new THREE.Group();
  g.add(mesh(new THREE.TorusGeometry(0.16, 0.025, 12, 32), mats.silver, [0, 0.16, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.12, 0.022, 12, 28), mats.silver, [0, 0.4, 0], [0, Math.PI / 2, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.12, 0.022, 12, 28), mats.silver, [0, 0.58, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.34, 0.03, 12, 40), mats.silver, [0, 0.9, 0], [0, Math.PI / 2, 0]));
  g.position.set(cx, top - 0.04, 0);
  g.userData.real = 'metal'; // 키링 고리는 쇠 부품
  root.add(g);
  return root;
}

// 둥근 패(plaque): 앞면은 frontMat, 뒷면은 backMat(없으면 앞면과 같게), 옆은 테두리. 축은 Z — 앞면이 정면을 본다.
export function plaque(r, h, frontMat, backMat, sideMat) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CircleGeometry(r, 64), frontMat, [0, 0, h / 2]));
  g.add(mesh(new THREE.CircleGeometry(r, 64), backMat || frontMat, [0, 0, -h / 2], [0, Math.PI, 0]));
  const side = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64, 1, true), sideMat);
  side.rotation.x = Math.PI / 2;
  g.add(side);
  g.userData.plate = h; // printSafe가 너무 얇으면 판 전체를 두껍게 한다
  return g;
}

// 네모 패(slab): 앞·뒤 면 재료를 따로 줄 수 있는 둥근 모서리 판
export function slab(w, hgt, d, frontMat, backMat, sideMat, rad = 0.05) {
  const geo = new RoundedBoxGeometry(w, hgt, d, 4, Math.min(rad, d / 2.1));
  // RoundedBoxGeometry는 재료 그룹이 하나뿐이라, 앞뒤 면만 얇은 평면으로 덮는다
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, sideMat));
  const inset = rad * 0.9;
  g.add(mesh(new THREE.PlaneGeometry(w - inset * 2, hgt - inset * 2), frontMat, [0, 0, d / 2 + 0.002]));
  g.add(mesh(new THREE.PlaneGeometry(w - inset * 2, hgt - inset * 2), backMat || frontMat, [0, 0, -d / 2 - 0.002], [0, Math.PI, 0]));
  g.userData.plate = d;
  return g;
}

// ───── 출력 가능한 두께로 다듬기 ─────
// 풀컬러 3D 프린팅은 5cm 크기에서 벽·기둥이 1.5mm보다 얇으면 부러지거나 출력되지 않는다
// (JLC3DP 풀컬러 WJP 설계 기준: 50×50mm 범위 최소 벽 두께 1.5mm). 여유를 두고 1.6mm로 맞춘다.
// 형태 유전자(dna)가 나중에 몸을 늘이고 줄인 뒤 전체를 longMm로 맞추므로, 그만큼까지 계산해서 미리 두껍게 한다.
// 관·고리·원기둥·원뿔·구·작은 상자처럼 "떨어져 있거나 가는" 부품만 키운다.
// 판(두 변이 두께의 4배 넘게 넓은 것)은 위에 그림이 붙어 있어 여기서 키우지 않고, 모델에서 두께를 직접 정한다(plateMin).
// 술·매듭(진짜 실)과 키링 고리(쇠 부품)는 프린팅하지 않으므로 그대로 둔다.
// 판·원판·회전면 같은 면(그림을 입히는 겉면)은 아래 물체에 입히는 색이라 두께를 따지지 않는다.
export function printScale(obj, { longMm = 50, dna } = {}) {
  obj.updateMatrixWorld(true);
  // 크기는 프린팅하는 부분만으로 잰다(술·매듭·쇠 고리는 빼고)
  const box = new THREE.Box3();
  obj.traverse((o) => {
    if (!o.isMesh) return;
    for (let p = o; p; p = p.parent) if (p.userData && p.userData.real) return;
    box.expandByObject(o);
  });
  if (box.isEmpty()) box.setFromObject(obj);
  const y0 = box.min.y;
  const h = box.max.y - box.min.y || 1;
  const cx = (box.min.x + box.max.x) / 2;
  const cz = (box.min.z + box.max.z) / 2;
  const d = dna && dna.k ? dna : null;
  const scAt = (t) => (d ? 1 + d.belly * Math.sin(Math.PI * t) + d.taper * (t - 0.5) : 1);
  // 늘인 뒤의 크기(가로·세로·깊이)를 상자 모서리로 어림한다
  let mx = 0;
  let mz = 0;
  for (let i = 0; i <= 8; i += 1) {
    const t = i / 8;
    const sc = scAt(t);
    const lean = d ? Math.abs(d.lean * h * (t - 0.5)) : 0;
    mx = Math.max(mx, (box.max.x - cx) * sc * (d ? d.wide : 1) + lean);
    mz = Math.max(mz, (box.max.z - cz) * sc * (d ? d.deep : 1));
  }
  const after = Math.max(mx * 2, mz * 2, h * (d ? d.tall : 1));
  const mmPerUnit = longMm / Math.max(after, 1e-6);
  // 한 부품이 놓인 높이에서 형태 유전자가 얼마나 줄이는지
  const factorAt = (y) => {
    if (!d) return 1;
    const sc = scAt(Math.min(1, Math.max(0, (y - y0) / h)));
    return Math.max(0.3, Math.min(sc * d.wide, sc * d.deep, d.tall));
  };
  return { mmPerUnit, factorAt };
}

export function printSafe(obj, { longMm = 50, minMm = 1.6, dna } = {}) {
  const { mmPerUnit, factorAt } = printScale(obj, { longMm, dna });
  const isReal = (o) => {
    for (let p = o; p; p = p.parent) if (p.userData && p.userData.real) return true;
    return false;
  };
  const scaleOf = (o) => {
    const v = new THREE.Vector3();
    o.getWorldScale(v);
    return Math.max(1e-6, Math.min(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)));
  };
  const c = new THREE.Vector3();
  // 1) 패·판(plaque·slab): 그림이 붙은 판은 판 전체를 두께 방향(z)으로 늘린다 — 그림도 같이 밖으로 밀려 나온다
  const plates = [];
  obj.traverse((o) => { if (o.userData && o.userData.plate && !isReal(o)) plates.push(o); });
  plates.forEach((o) => {
    new THREE.Box3().setFromObject(o).getCenter(c);
    const need = minMm / (mmPerUnit * factorAt(c.y)) / scaleOf(o);
    if (o.userData.plate < need) o.scale.z *= need / o.userData.plate;
  });
  obj.updateMatrixWorld(true);
  const inPlate = (o) => {
    for (let p = o; p; p = p.parent) if (p.userData && p.userData.plate) return true;
    return false;
  };
  // 2) 몸에 붙은 무늬(테두리 금선·띠·끈 장식처럼 큰 몸통 겉에 겹쳐 있는 가는 부품)는 프린팅하면 겉면 색이 된다.
  //    따로 떨어져 서 있는 가는 부품(고리·다리·기둥·손잡이·자물쇠 걸쇠)만 두껍게 한다.
  const SURF = ['PlaneGeometry', 'CircleGeometry', 'ShapeGeometry', 'RingGeometry'];
  const thinOf = (o) => {
    const b = new THREE.Box3().setFromObject(o);
    const d = b.getSize(new THREE.Vector3());
    return Math.min(d.x, d.y, d.z);
  };
  const bodies = [];
  obj.traverse((o) => {
    if (!o.isMesh || isReal(o) || SURF.includes(o.geometry.type)) return;
    const b = new THREE.Box3().setFromObject(o);
    b.getCenter(c);
    const needW = minMm / (mmPerUnit * factorAt(c.y));
    if (thinOf(o) >= needW * 1.5 || inPlate(o)) bodies.push(b);
  });
  const vol = (b) => {
    const d = b.getSize(new THREE.Vector3());
    return Math.max(d.x, 1e-4) * Math.max(d.y, 1e-4) * Math.max(d.z, 1e-4);
  };
  const onBody = (o, needW) => {
    const b = new THREE.Box3().setFromObject(o);
    const v = vol(b);
    return bodies.some((B) => {
      if (B.equals(b)) return false;
      const e = B.clone().expandByScalar(needW * 0.6);
      const it = b.clone().intersect(e);
      return !it.isEmpty() && vol(it) / v >= 0.7;
    });
  };
  obj.traverse((o) => {
    if (!o.isMesh || isReal(o) || inPlate(o)) return;
    {
      const b = new THREE.Box3().setFromObject(o);
      b.getCenter(c);
      if (onBody(o, minMm / (mmPerUnit * factorAt(c.y)))) {
        o.userData.__decor = true; // 겉면 무늬(색으로 인쇄)
        return;
      }
    }
    const g = o.geometry;
    const pr = g.parameters || {};
    new THREE.Box3().setFromObject(o).getCenter(c);
    const need = minMm / (mmPerUnit * factorAt(c.y)) / scaleOf(o); // 이 부품 좌표계에서 필요한 최소 두께
    const plate = (dims) => {
      const s = [...dims].sort((a, b) => a - b);
      return s[1] >= s[0] * 4 && s[0] < need;
    };
    let ng = null;
    if (g.type === 'TubeGeometry' && pr.radius * 2 < need) {
      ng = new THREE.TubeGeometry(pr.path, pr.tubularSegments, need / 2, pr.radialSegments, pr.closed);
    } else if (g.type === 'TorusGeometry' && pr.tube * 2 < need) {
      ng = new THREE.TorusGeometry(pr.radius, need / 2, pr.radialSegments, pr.tubularSegments, pr.arc);
    } else if (g.type === 'CylinderGeometry' || g.type === 'ConeGeometry') {
      const rt = g.type === 'ConeGeometry' ? 0 : pr.radiusTop;
      const rb = g.type === 'ConeGeometry' ? pr.radius : pr.radiusBottom;
      const big = Math.max(rt, rb);
      if (!plate([big * 2, big * 2, pr.height]) && (big * 2 < need || pr.height < need)) {
        const f = big * 2 < need ? need / 2 / Math.max(big, 1e-6) : 1;
        const hh = Math.max(pr.height, need);
        if (g.type === 'ConeGeometry') ng = new THREE.ConeGeometry(Math.max(rb * f, need / 2), hh, pr.radialSegments, 1, pr.openEnded);
        else ng = new THREE.CylinderGeometry(rt ? Math.max(rt * f, need / 2) : 0, Math.max(rb * f, need / 2), hh, pr.radialSegments, 1, pr.openEnded, pr.thetaStart, pr.thetaLength);
      }
    } else if (g.type === 'BoxGeometry') {
      const dims = [pr.width, pr.height, pr.depth];
      if (!plate(dims) && Math.min(...dims) < need) ng = new THREE.BoxGeometry(...dims.map((x) => Math.max(x, need)));
    } else if (g.type === 'SphereGeometry' && pr.radius * 2 < need) {
      ng = new THREE.SphereGeometry(need / 2, pr.widthSegments, pr.heightSegments, pr.phiStart, pr.phiLength, pr.thetaStart, pr.thetaLength);
    }
    if (!ng && g.type === 'ExtrudeGeometry') {
      // 밀어낸 판(박쥐 패·날개 등): 그림이 판 자체에 입혀져 있으니 얇은 축만 늘린다
      g.computeBoundingBox();
      const b = g.boundingBox;
      const dims = [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z];
      const k = dims.indexOf(Math.min(...dims));
      if (dims[k] > 1e-6 && dims[k] < need) o.scale.setComponent(k, o.scale.getComponent(k) * (need / dims[k]));
    }
    if (ng) {
      g.dispose();
      o.geometry = ng;
    }
  });
  return obj;
}

// ───── 풀컬러 3D 프린팅 재질로 보이기 ─────
// 업체에서 실제로 나오는 것은 한 가지 수지(레진)에 색을 입힌 출력물이다. 금·은처럼 반짝이는 금속,
// 유리처럼 비치는 면, 옻칠의 깊은 광택은 출력되지 않는다. 그래서 화면도 같은 수지 재질로 보여 준다
// (색과 무늬는 그대로, 금속은 금빛 "색"이 된다). 술·매듭(진짜 실)과 키링 고리(쇠 부품)만 원래 재질이다.
// 출력면의 잔결: 작은 얼룩무늬 거칠기 지도(한 번만 만든다). 웹이 아니면 없이 간다.
let grain = null;
function grainTexture() {
  if (grain !== null) return grain || null;
  try {
    if (typeof document === 'undefined') throw new Error('no dom');
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 128;
    const x = c.getContext('2d');
    const img = x.createImageData(128, 128);
    for (let i = 0; i < 128 * 128; i += 1) {
      const v = 200 + Math.floor(Math.random() * 55);
      img.data[i * 4] = v;
      img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    grain = new THREE.CanvasTexture(c);
    grain.wrapS = THREE.RepeatWrapping;
    grain.wrapT = THREE.RepeatWrapping;
    grain.repeat.set(6, 6);
  } catch (e) {
    grain = false;
  }
  return grain || null;
}

export function printLook(obj) {
  const cache = new Map();
  const toResin = (mt) => {
    if (!mt) return mt;
    if (cache.has(mt)) return cache.get(mt);
    // 풀컬러 레진 출력물 + 얇은 투명 코팅(실제 출력 후가공) — 잔결(거칠기 얼룩)을 넣어 매끈한 장난감처럼 보이지 않게
    const nm = new THREE.MeshPhysicalMaterial({
      color: mt.color ? mt.color.clone() : new THREE.Color(0xffffff),
      map: mt.map || null,
      roughness: 0.62,
      roughnessMap: grainTexture(),
      metalness: 0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.35,
      side: mt.side,
    });
    if (mt.metalness > 0.3 && mt.color) nm.color.multiplyScalar(0.92); // 금속 색은 살짝 차분하게(인쇄된 금색)
    cache.set(mt, nm);
    return nm;
  };
  obj.traverse((o) => {
    if (!o.isMesh) return;
    for (let p = o; p; p = p.parent) if (p.userData && p.userData.real) return;
    o.material = Array.isArray(o.material) ? o.material.map(toResin) : toResin(o.material);
  });
  return obj;
}

// ───── 실제 전통 재료로 입히기 ─────
// 사용자가 놀이 전에 고른 재료(바탕·무늬)로 결과물을 실물 기법대로 다시 만든다. 그림을 덧칠하는 게 아니라
// 놀이로 생긴 무늬를 그 재료를 다루는 실제 기법으로 옮긴다:
//   흙(청자·백자·분청·옹기) → 상감: 밝은 무늬는 흰 흙, 어두운 무늬는 검은 흙을 박는다
//   옻칠 → 나전·화각·금박: 무늬 자리에 무늬 재료(자개 등) 조각을 붙인다(없으면 주칠로 그린다)
//   쇠붙이 → 두드림·입사: 무늬는 도드라진 결로, 무늬 재료가 있으면 은·금실로 박는다
//   실·천 → 자수: 무늬 색을 실 색으로 살리고 실 결과 광택을 준다
//   나무·돌·옥 → 새김: 무늬를 파서 결을 내고 어두운 무늬는 조금 짙게
//   한지·짚·가죽 → 찍기: 바탕 재료 빛에 무늬를 찍는다
// base.id: 재료 아이디(MATERIAL_BY_ID) — 기법 안에서 재료마다 색을 달리할 때 쓴다
const TECH = { celadon: 'sanggam', porcelain: 'sanggam', buncheong: 'sanggam', onggi: 'sanggam', earthen: 'sanggam',
  otchil: 'inlay', najeon: 'inlay', hwagak: 'print', gilt: 'emboss',
  gold: 'emboss', silver: 'emboss', yugi: 'emboss', bronze: 'emboss', iron: 'emboss', ipsa: 'inlay',
  silk: 'embroider', ramie: 'embroider', hemp: 'embroider', cotton: 'embroider', knot: 'embroider', horsehair: 'embroider',
  wood: 'carve', paulownia: 'carve', bamboo: 'carve', jade: 'carve', granite: 'carve', inkstone: 'carve', bone: 'carve', gem: 'carve', glass: 'carve',
  hanji: 'print', straw: 'print', leather: 'print', dancheong: 'print', ink: 'inlay' };
// 화면 색(sRGB) 그대로 — THREE.Color는 선형 색으로 바꾸므로 캔버스에 쓸 때는 직접 읽는다
const hex = (c) => { const n = parseInt(String(c).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
// 재료 결(나뭇결·올 짜임·망치 자국·유약 잔금·가죽 오톨도톨함·돌 반점·종이 섬유)을 그림 없이 계산으로 만든다 — 자산 파일이 필요 없다.
// 돌려주는 값: bump(0~1, 0.5가 평평), tone(색에 곱하는 값)
const DETAIL_OF = { wood: 'wood', paulownia: 'wood', bamboo: 'bamboo', silk: 'weave', ramie: 'weave', hemp: 'weave', cotton: 'weave', knot: 'weave', horsehair: 'weave',
  gold: 'hammer', silver: 'hammer', yugi: 'hammer', bronze: 'cast', iron: 'cast', ipsa: 'cast', celadon: 'crackle', porcelain: 'glaze', buncheong: 'crackle', onggi: 'glaze', earthen: 'stone',
  leather: 'leather', granite: 'stone', inkstone: 'stone', jade: 'glaze', hanji: 'paper', straw: 'weave', otchil: 'glaze', najeon: 'glaze', hwagak: 'glaze', gilt: 'hammer', bone: 'glaze', gem: 'glaze', glass: 'glaze', dancheong: 'paper', ink: 'glaze' };
const detailCache = new Map();
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function voronoi(x, y, cell) {
  const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
  let d1 = 1e9, d2 = 1e9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const gx = cx + i, gy = cy + j;
    const px = (gx + hash2(gx, gy)) * cell, py = (gy + hash2(gy, gx + 7)) * cell;
    const d = Math.hypot(x - px, y - py);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
  }
  return [d1 / cell, (d2 - d1) / cell];
}
function detailField(kind, w, h) {
  const key = kind + w + 'x' + h;
  if (detailCache.has(key)) return detailCache.get(key);
  const bump = new Float32Array(w * h), tone = new Float32Array(w * h), patina = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const q = y * w + x;
    let b = 0.5, t = 1;
    if (kind === 'wood' || kind === 'bamboo') {
      const n = vnoise(x * 0.02, y * 0.15) * 6 + vnoise(x * 0.004, y * 0.03) * 10;
      const ring = 0.5 + 0.5 * Math.sin(y * (kind === 'bamboo' ? 0.9 : 0.32) + n);
      const fine = vnoise(x * 0.6, y * 3.0);
      b = 0.5 + (ring - 0.5) * 0.25 + (fine - 0.5) * 0.15; t = 0.82 + 0.26 * ring - 0.06 * fine;
      if (kind === 'bamboo' && (x % 128) < 3) { b = 0.3; t = 0.8; } // 대나무 마디
    } else if (kind === 'weave') {
      const tx = Math.sin(x * 1.2), ty = Math.sin(y * 1.2), over = ((Math.floor(x / 2.6) + Math.floor(y / 2.6)) & 1) ? tx : ty;
      b = 0.5 + 0.22 * over + (vnoise(x * 0.3, y * 0.3) - 0.5) * 0.1; t = 0.93 + 0.08 * over;
    } else if (kind === 'hammer' || kind === 'cast') {
      const [d1] = voronoi(x, y, kind === 'hammer' ? 13 : 60);
      const n = vnoise(x * 0.08, y * 0.08);
      // 망치 자국은 잔잔하게(실제 방짜·은 공예처럼), 주물은 거의 평평하게
      b = kind === 'hammer' ? 0.42 + 0.16 * Math.min(1, d1) : 0.45 + 0.1 * n; t = kind === 'hammer' ? 0.97 + 0.05 * Math.min(1, d1) : 0.9 + 0.15 * n;
      if (kind === 'cast') { const pn = vnoise(x * 0.02, y * 0.02) * 0.7 + vnoise(x * 0.11, y * 0.11) * 0.3; patina[q] = Math.max(0, Math.min(1, (pn - 0.42) * 2.4)); }
    } else if (kind === 'crackle') {
      // 유약 잔금(빙렬): 실물처럼 가늘고 옅게, 군데군데만
      const [, edge] = voronoi(x, y, 70);
      const line = edge < 0.018 && vnoise(x * 0.02, y * 0.02) > 0.35 ? 1 : 0;
      b = 0.5 - 0.03 * line; t = 1 - 0.07 * line + (vnoise(x * 0.01, y * 0.01) - 0.5) * 0.06;
    } else if (kind === 'glaze') {
      const n = vnoise(x * 0.01, y * 0.01); b = 0.5 + (n - 0.5) * 0.05; t = 0.97 + 0.06 * n;
    } else if (kind === 'leather') {
      const [d1] = voronoi(x, y, 7); b = 0.35 + 0.35 * Math.min(1, d1); t = 0.93 + 0.08 * Math.min(1, d1);
    } else if (kind === 'stone') {
      const n = vnoise(x * 0.05, y * 0.05) * 0.6 + vnoise(x * 0.4, y * 0.4) * 0.4, sp = hash2(x, y) > 0.985 ? 1 : 0;
      b = 0.4 + 0.2 * n; t = 0.82 + 0.3 * n - 0.25 * sp;
    } else if (kind === 'paper') {
      const fib = vnoise(x * 0.9, y * 0.05) * 0.6 + vnoise(x * 0.05, y * 0.9) * 0.4; b = 0.47 + 0.08 * fib; t = 0.95 + 0.07 * fib;
    }
    bump[q] = b; tone[q] = t;
  }
  const f = { bump, tone, patina };
  detailCache.set(key, f);
  return f;
}

function techMaps(img, tech, base, accent) {
  const S = 512;
  const w = Math.min(S, img.width || S), h = Math.min(S, img.height || S);
  const mk = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const src = mk(); const sx = src.getContext('2d'); sx.drawImage(img, 0, 0, w, h);
  const d = sx.getImageData(0, 0, w, h).data;
  const col = mk(), rgh = mk(), met = mk(), bmp = mk(), iri = mk(), spc = mk();
  const C = col.getContext('2d').createImageData(w, h), R = rgh.getContext('2d').createImageData(w, h), M = met.getContext('2d').createImageData(w, h), B = bmp.getContext('2d').createImageData(w, h), I = iri.getContext('2d').createImageData(w, h), SP = spc.getContext('2d').createImageData(w, h);
  const b = hex(base.color), a = hex((accent || base).color);
  const DF = detailField(DETAIL_OF[base.id] || 'glaze', w, h);
  const white = [238, 234, 222], black = [40, 34, 30], cinnabar = [155, 42, 31];
  // 색 갈래(12칸)를 세고, 작은 갈래부터 모아 화면의 30~40%만 무늬 재료로 — 조각보 전체가 자개로 덮이지 않고 조각처럼 박히게
  const NB = 13, cnt = new Array(NB).fill(0), bucket = new Uint8Array(d.length / 4);
  for (let k = 0, q = 0; k < d.length; k += 4, q++) {
    const r = d[k], g = d[k + 1], bl = d[k + 2];
    const mx = Math.max(r, g, bl), mn = Math.min(r, g, bl), sat = (mx - mn) / 255;
    let hb = 12;
    if (sat > 0.15) { let hh = mx === r ? (g - bl) / (mx - mn) : mx === g ? 2 + (bl - r) / (mx - mn) : 4 + (r - g) / (mx - mn); hh = ((hh * 60) + 360) % 360; hb = Math.floor(hh / 30); }
    bucket[q] = hb; cnt[hb]++;
  }
  // 무늬의 테두리(색이 바뀌는 곳) — 상감·청화는 면을 채우지 않고 선으로 그린다(실제 상감 청자·청화 백자처럼)
  const edge = new Uint8Array(w * h);
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w - 1; x++) {
    const k = (y * w + x) * 4, kr = k + 4, kd = k + w * 4;
    const dr = Math.abs(d[k] - d[kr]) + Math.abs(d[k + 1] - d[kr + 1]) + Math.abs(d[k + 2] - d[kr + 2]);
    const dd = Math.abs(d[k] - d[kd]) + Math.abs(d[k + 1] - d[kd + 1]) + Math.abs(d[k + 2] - d[kd + 2]);
    if (dr > 90 || dd > 90) {
      // 붓·조각칼로 그은 선처럼: 굵기가 들쭉날쭉하고 가끔 끊긴다
      const nz = vnoise(x * 0.045, y * 0.045);
      if (nz < 0.1) continue;
      const th = 1 + (nz > 0.5 ? 1 : 0) + (nz > 0.78 ? 1 : 0);
      for (let j = 0; j < th; j++) for (let i = 0; i < th; i++) { const xx = x + i, yy = y + j; if (xx < w && yy < h) edge[yy * w + xx] = 1; }
    }
  }
  const total = d.length / 4, chosen = new Set();
  // 어두운 선 기준: 그림 전체가 어두운 경우(예: 쇠 거울 면)에는 그 그림 안에서 '더 어두운 곳'만 선으로 본다 — 판 전체가 무늬 재료로 덮이지 않게
  let meanL = 0; for (let k = 0; k < d.length; k += 4) meanL += (0.299 * d[k] + 0.587 * d[k + 1] + 0.114 * d[k + 2]) / 255; meanL /= total;
  const darkInlay = Math.min(0.16, meanL * 0.5), darkEmboss = Math.min(0.2, meanL * 0.55);
  let acc = 0;
  cnt.map((c, i) => [c, i]).filter(([c, i]) => c > total * 0.01 && i !== 12).sort((x, y) => x[0] - y[0]).forEach(([c, i]) => { if (acc < total * 0.34 && acc + c <= total * 0.45) { chosen.add(i); acc += c; } }); // 큰 갈래 하나가 판 전체를 덮지 않게 45%에서 멈춘다
  let n = 0;
  for (let k = 0; k < d.length; k += 4) {
    const r = d[k], g = d[k + 1], bl = d[k + 2], al = d[k + 3] / 255;
    const L = (0.299 * r + 0.587 * g + 0.114 * bl) / 255;
    const sat = (Math.max(r, g, bl) - Math.min(r, g, bl)) / 255;
    // 무늬 자리: 기법마다 다르게 — 박는 기법(상감·나전·입사)은 고른 색 갈래만, 나머지는 채도·밝기로
    const picked = chosen.has(bucket[k / 4]);
    const q0 = k / 4;
    const ink = al > 0.2 && (tech === 'sanggam' ? edge[q0] || L < 0.12 : tech === 'inlay' ? (picked || L < darkInlay) : tech === 'emboss' && accent ? (picked || L < darkEmboss || (accent.metal > 0.5 && edge[q0])) : (sat > 0.18 || L > 0.8 || L < 0.28)) ? 1 : 0;
    // ↑ 쇠에 다른 쇠(은·금)를 입힐 때는 무늬 테두리를 따라 실처럼 박는다(입사). 두드림에 다른 쇠를 입힐 때(청동에 은 등)는 고른 무늬 자리만 — 흰 바탕까지 덮으면 판 전체가 은처럼 보인다
    // 청화는 선 말고도 고른 색 자리를 옅은 코발트로 물들인다(붓 번짐)
    const wash = tech === 'sanggam' && base.id === 'porcelain' && !ink && picked ? 1 : 0;
    let out = b, rough = base.rough, metal = base.metal || 0, bump = 0.5, ir = 0;
    if (tech === 'sanggam') {
      // 백자는 청화(코발트), 분청은 흰 흙을 바르고 긁어내 회색 바탕이 드러나게, 청자·옹기·토기는 흰·검은 흙 상감
      // 옹기는 흰 흙이 아니라 잿물을 긁어 바탕 흙빛이 드러나는 손자국 무늬
      if (ink) out = base.id === 'porcelain' ? [38, 62, 128] : base.id === 'buncheong' ? [118, 112, 100] : base.id === 'onggi' ? b.map((v) => Math.min(255, v * 1.7 + 20)) : L < 0.12 ? black : white;
      else if (wash) out = [b[0] * 0.78 + 46 * 0.22, b[1] * 0.78 + 78 * 0.22, b[2] * 0.78 + 150 * 0.22];
      else if (base.id === 'buncheong') out = [222, 214, 196];
      bump = ink ? 0.42 : 0.5;
    } else if (tech === 'inlay') {
      if (ink && accent && accent.irid) { const pal = [[236, 222, 238], [214, 236, 226], [216, 226, 242], [240, 234, 214]]; const pc = pal[(bucket[k / 4] + ((k >> 9) & 1)) % 4]; const nz = 0.9 + 0.1 * Math.sin(k * 0.0137); out = [pc[0] * nz, pc[1] * nz, pc[2] * nz]; rough = 0.12; metal = 0.25; ir = 1; bump = 0.62; }
      else if (ink && !accent && base.id === 'ink') { out = b.map((v) => Math.min(255, v * 2.4 + 18)); bump = 0.7; } // 먹: 무늬는 도드라진 새김으로
      else if (ink) { out = accent ? a : cinnabar; rough = accent ? accent.rough : 0.3; metal = accent ? accent.metal || 0 : 0; ir = accent && accent.irid ? 1 : 0; bump = 0.6; }
    } else if (tech === 'emboss') {
      if (ink && accent) { out = a; metal = accent.metal || 0; rough = accent.rough; }
      else out = b.map((v) => v * (0.88 + 0.24 * L));
      bump = 0.3 + 0.5 * L;
    } else if (tech === 'embroider') {
      out = ink ? [r * 0.85 + b[0] * 0.15, g * 0.85 + b[1] * 0.15, bl * 0.85 + b[2] * 0.15] : b; bump = ink ? 0.7 : 0.5; rough = ink ? 0.5 : base.rough;
    } else if (tech === 'carve') {
      out = ink ? b.map((v) => v * (L < 0.5 ? 0.62 : 0.9)) : b; bump = ink ? 0.25 : 0.55;
    } else {
      out = [b[0] * (0.35 + 0.65 * r / 255), b[1] * (0.35 + 0.65 * g / 255), b[2] * (0.35 + 0.65 * bl / 255)];
    }
    n += ink;
    // 재료 결: 바탕 재료 결을 입히고(무늬 재료 조각도 같은 결 위에 앉는다), 박는 기법은 무늬 자리를 조금 도드라지게
    { const q = k / 4; out = [out[0] * DF.tone[q], out[1] * DF.tone[q], out[2] * DF.tone[q]]; bump = Math.max(0, Math.min(1, bump + (DF.bump[q] - 0.5) * 0.9));
      // 청동·쇠: 오래된 유물처럼 푸른 녹(청동)·붉은 녹(쇠)이 군데군데 — 녹 자리는 덜 반짝인다
      const pa = DF.patina[q] * (base.id === 'bronze' ? 0.45 : base.id === 'iron' ? 0.3 : 0) * (ink && accent ? 0.15 : 1); // 입힌 은·금에는 녹이 거의 앉지 않는다
      if (pa > 0) { const pc = base.id === 'bronze' ? [92, 128, 104] : [120, 70, 44]; out = [out[0] * (1 - pa) + pc[0] * pa, out[1] * (1 - pa) + pc[1] * pa, out[2] * (1 - pa) + pc[2] * pa]; metal *= 1 - pa * 0.85; rough = rough + (0.9 - rough) * pa; } }
    C.data[k] = out[0]; C.data[k + 1] = out[1]; C.data[k + 2] = out[2]; C.data[k + 3] = 255;
    // three.js: roughness는 G, metalness는 B 채널을 읽는다
    R.data[k] = R.data[k + 1] = R.data[k + 2] = rough * 255; R.data[k + 3] = 255;
    M.data[k] = M.data[k + 1] = M.data[k + 2] = metal * 255; M.data[k + 3] = 255;
    B.data[k] = B.data[k + 1] = B.data[k + 2] = bump * 255; B.data[k + 3] = 255;
    I.data[k] = I.data[k + 1] = I.data[k + 2] = ir * 255; I.data[k + 3] = 255;
    // 옻칠: 반짝임은 겉칠(클리어코트) 한 겹에서만 — 속 바탕이 한 번 더 비추면 검은 칠이 뿌옇게 회색으로 뜬다(three.js는 알파 채널을 읽는다)
    SP.data[k] = SP.data[k + 1] = SP.data[k + 2] = 255; SP.data[k + 3] = base.id === 'otchil' && metal < 0.5 && !ir ? 30 : 255;
  }
  [[col, C], [rgh, R], [met, M], [bmp, B], [iri, I], [spc, SP]].forEach(([c, im]) => c.getContext('2d').putImageData(im, 0, 0));
  const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  return { map: tex(col, true), roughnessMap: tex(rgh), metalnessMap: tex(met), bumpMap: tex(bmp), iridescenceMap: tex(iri), specularIntensityMap: tex(spc), share: n / (d.length / 4) };
}

// surfaceOnly: 인쇄·전사 굿즈(액자·잔·부채·엽서…)는 무늬가 놓이는 바탕(천·종이·자기)만 고른 재료가 되고, 틀·살 같은 구조는 원래 재료 그대로
export function realLook(obj, base, accent, lookOf, { surfaceOnly = false } = {}) {
  if (!base) return obj;
  const bl = base.look, al = accent ? accent.look : null;
  const tech = TECH[base.id] || 'print';
  const plainTex = new Map();
  const plain = (look, side, id) => {
    // 무늬 없는 면(옆면·몸체)에도 같은 재료 결을 입힌다
    const kind = DETAIL_OF[id] || 'glaze';
    let pt = plainTex.get(kind + look.color + id);
    if (!pt && typeof document !== 'undefined') {
      try {
        const W = 256, F = detailField(kind, W, W), c = hex(look.color);
        const mc = document.createElement('canvas'), bc = document.createElement('canvas'); mc.width = bc.width = mc.height = bc.height = W;
        const M = mc.getContext('2d').createImageData(W, W), B = bc.getContext('2d').createImageData(W, W);
        const pcol = id === 'bronze' ? [92, 128, 104, 0.45] : id === 'iron' ? [120, 70, 44, 0.3] : null;
        for (let q = 0; q < W * W; q++) { const k = q * 4; let r = c[0] * F.tone[q], g = c[1] * F.tone[q], bb = c[2] * F.tone[q];
          if (pcol) { const pa = F.patina[q] * pcol[3]; r = r * (1 - pa) + pcol[0] * pa; g = g * (1 - pa) + pcol[1] * pa; bb = bb * (1 - pa) + pcol[2] * pa; }
          M.data[k] = r; M.data[k + 1] = g; M.data[k + 2] = bb; M.data[k + 3] = 255; B.data[k] = B.data[k + 1] = B.data[k + 2] = F.bump[q] * 255; B.data[k + 3] = 255; }
        mc.getContext('2d').putImageData(M, 0, 0); bc.getContext('2d').putImageData(B, 0, 0);
        const mt = new THREE.CanvasTexture(mc); mt.colorSpace = THREE.SRGBColorSpace; mt.wrapS = mt.wrapT = THREE.RepeatWrapping;
        const bt = new THREE.CanvasTexture(bc); bt.wrapS = bt.wrapT = THREE.RepeatWrapping;
        pt = { map: mt, bump: bt }; plainTex.set(kind + look.color + id, pt);
      } catch (e) { pt = null; }
    }
    const m = new THREE.MeshPhysicalMaterial({
      color: pt ? new THREE.Color(0xffffff) : new THREE.Color(look.color), map: pt ? pt.map : null, bumpMap: pt ? pt.bump : null, bumpScale: 1.4,
      roughness: look.rough, metalness: look.metal || 0,
      clearcoat: look.clear || 0, clearcoatRoughness: id === 'otchil' ? 0.14 : 0.06, // 옻칠은 손으로 갈아 낸 광 — 거울처럼 날카롭지 않다 sheen: look.sheen || 0, sheenRoughness: 0.5,
      sheenColor: new THREE.Color(look.color).lerp(new THREE.Color(0xffffff), 0.5),
      iridescence: look.irid ? 1 : 0, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 650], side,
      specularIntensity: id === 'otchil' ? 0.12 : 1, // 옻칠은 겉칠 한 겹만 비춘다
    });
    if (!pt && (look.grain || look.rough > 0.6)) m.roughnessMap = grainTexture();
    return m;
  };
  // 몸체 찾기: 무늬도 고정 부품(기와·돌)도 아닌 재질 가운데 가장 넓게 쓰인 것이 몸체 → 사용자가 고른 바탕 재료.
  // 나머지 이름표 있는 부품은 그 이름표의 실물 재질 그대로(예: 반닫이 장석은 놋쇠, 노리개 고리는 은).
  const weight = new Map();
  obj.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    for (let p = o; p; p = p.parent) if (p.userData && p.userData.real) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((mt) => {
      if (!mt || (mt.userData && (mt.userData.pattern || mt.userData.fixed))) return;
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      const r = o.geometry.boundingSphere ? o.geometry.boundingSphere.radius * Math.max(o.scale.x, o.scale.y, o.scale.z) : 0;
      const key = (mt.userData && mt.userData.matId) || mt.uuid;
      weight.set(key, (weight.get(key) || 0) + r * r);
    });
  });
  let bodyKey = null, best = -1;
  weight.forEach((w, k) => { if (w > best) { best = w; bodyKey = k; } });
  if (surfaceOnly) bodyKey = '__none__';
  const cache = new Map();
  const swap = (mt) => {
    if (!mt) return mt;
    if (cache.has(mt)) return cache.get(mt);
    let nm;
    const ud = mt.userData || {};
    const key = ud.matId || mt.uuid;
    if (!ud.pattern && key !== bodyKey && (ud.fixed || ud.matId)) {
      // 부품: 이름표의 실물 재질(비단·나무는 원래 색을 살린다)
      const L = ud.matId && lookOf ? lookOf(ud.matId) : null;
      if (L) {
        const keepColor = /^(silk|wood|otchil|knot|jade)$/.test(ud.matId) && mt.color;
        const look = keepColor ? { ...L, color: '#' + mt.color.getHexString() } : L;
        nm = plain(look, mt.side, ud.matId);
      } else nm = mt; // 기와·돌처럼 따로 정한 재질은 그대로
      cache.set(mt, nm);
      return nm;
    }
    const img = ud.pattern && mt.map && mt.map.image;
    if (img && typeof document !== 'undefined' && (img.width || img.naturalWidth)) {
      try {
        const T = techMaps(img, tech, { ...bl, id: base.id }, al);
        nm = new THREE.MeshPhysicalMaterial({
          color: 0xffffff, map: T.map, roughness: 1, roughnessMap: T.roughnessMap, metalness: 1, metalnessMap: T.metalnessMap,
          bumpMap: T.bumpMap, bumpScale: tech === 'carve' ? 2.4 : tech === 'emboss' ? 1.4 : tech === 'embroider' ? 2.0 : 1.2,
          clearcoat: bl.clear || (tech === 'inlay' ? 1 : 0), clearcoatRoughness: base.id === 'otchil' ? 0.14 : 0.06,
          sheen: tech === 'embroider' ? 1 : bl.sheen || 0, sheenRoughness: 0.45, sheenColor: new THREE.Color(0xffffff),
          iridescence: al && al.irid ? 1 : bl.irid ? 1 : 0, iridescenceMap: al && al.irid ? T.iridescenceMap : null, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 650],
          specularIntensityMap: base.id === 'otchil' ? T.specularIntensityMap : null,
          side: mt.side,
        });
      } catch (e) {
        if (typeof console !== 'undefined') console.warn('[realLook] 무늬 재질을 만들지 못해 단색으로 대신함', e && e.message);
        nm = null;
      }
    }
    if (!nm && ud.pattern && typeof console !== 'undefined') console.warn('[realLook] 무늬 그림이 아직 없음', !!img);
    if (!nm) nm = plain(ud.pattern && al ? al : bl, mt.side, ud.pattern && accent ? accent.id : base.id);
    cache.set(mt, nm);
    return nm;
  };
  obj.traverse((o) => {
    if (!o.isMesh) return;
    for (let p = o; p; p = p.parent) if (p.userData && p.userData.real) return;
    o.material = Array.isArray(o.material) ? o.material.map(swap) : swap(o.material);
  });
  return obj;
}

// ───── 출력용 파일 ─────
// 화면에 보이는 그 물체를 그대로 .glb(색·무늬 포함)로 만든다. 1 단위 = 1mm, 가장 긴 변 = longMm.
// 술·매듭·쇠 고리는 프린팅하지 않는 실물 부품이라 파일에서 빼고, 이름으로 따로 적어 둔다.
export async function exportPrintFile(pivot, { longMm = 50 } = {}) {
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
  const root = pivot.clone(true);
  const drop = [];
  root.traverse((o) => { if (o.userData && o.userData.real) drop.push(o); });
  drop.forEach((o) => o.parent && o.parent.remove(o));
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const k = longMm / Math.max(size.x, size.y, size.z, 1e-6);
  const out = new THREE.Group();
  out.name = 'itgyeol-print';
  root.position.sub(box.getCenter(new THREE.Vector3()));
  out.add(root);
  out.scale.setScalar(k);
  out.updateMatrixWorld(true);
  const parts = drop.map((o) => o.userData.real);
  const data = await new Promise((resolve, reject) => {
    new GLTFExporter().parse(out, resolve, reject, { binary: true, onlyVisible: true });
  });
  return { data, mm: { x: size.x * k, y: size.y * k, z: size.z * k }, realParts: { thread: parts.filter((x) => x === 'thread').length, metal: parts.filter((x) => x === 'metal').length } };
}
