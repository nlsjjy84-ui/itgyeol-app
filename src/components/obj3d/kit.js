import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// 3D 모델을 만들 때 쓰는 공통 재료·도구.
// 모든 모델은 "조각보 그림 texture 한 장"을 받아서, 그 물건의 가장 어울리는 면(부채살 사이 종이, 거울 뒷면,
// 북 가죽, 주머니 앞면…)에 입히고 나머지는 전통 재질(놋쇠·옥·옻칠·나무·비단·백자)로 만든다.

export { THREE, RoundedBoxGeometry };

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
export function lathe(pts, mat, seg = 56) {
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
  g.add(mesh(new THREE.CylinderGeometry(w * 0.32, w * 0.4, len * 0.14, 16), capMat, [0, -len * 0.04, 0]));
  g.add(mesh(new THREE.SphereGeometry(w * 0.34, 16, 12), capMat, [0, len * 0.05, 0]));
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
  return g;
}
