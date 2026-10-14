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
  return {
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
  return new THREE.MeshStandardMaterial({ map: t, roughness: rough, metalness: 0, side: side || THREE.FrontSide });
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
