import { THREE, getDna, mesh, tube, tassel, knot, texMat, extrudeShape, planarUV, lobedShape } from './kit';
import { norigaeTop } from './models_a';

// 참고 유물 사진에서 구조만 읽어 새로 빚은 형태들 — 박쥐 패 노리개, 용잠 비녀, 떨잠.
// (사진을 베끼지 않고, 패·매듭·술이 어떻게 이어지는지 같은 짜임만 따랐다.)

// 박쥐 모양 패 윤곽: 오른쪽 절반 점들을 거울처럼 이어 부드러운 곡선으로 만든다
function batShape(s = 1) {
  const right = [[0, 0.36], [0.1, 0.56], [0.2, 0.38], [0.62, 0.5], [1.05, 0.5], [0.98, 0.1], [0.84, -0.06], [0.74, 0.04], [0.62, -0.22], [0.46, -0.12], [0.3, -0.4], [0.1, -0.5], [0, -0.58]];
  const left = right.slice(1, -1).reverse().map(([x, y]) => [-x, y]);
  const pts = [...right, ...left].map(([x, y]) => new THREE.Vector3(x * s, y * s, 0));
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  return new THREE.Shape(curve.getPoints(220).map((p) => new THREE.Vector2(p.x, p.y)));
}

function batPlaque(s, depth, capMat, sideMat) {
  return extrudeShape(batShape(s), depth, capMat, sideMat, 0.025);
}

// 금속 덮개 달린 술(반대쪽 색을 줄 수 있게 따로 만든다)
function cappedTassel(len, w, mat, m, n = 22) {
  return tassel(len, w, mat, m.gold, n);
}

export const norigaeBat = ({ tex, m }) => {
  // 박쥐 패 삼작: 위의 큰 패 하나에서 매듭이 갈라져, 작은 박쥐 패 둘이 서로 다른 높이로 늘어진다
  const g = new THREE.Group();
  const big = batPlaque(0.86, 0.12, texMat(tex), m.gold);
  g.add(big);
  g.add(norigaeTop(m, 0.5));
  const k0 = knot(0.12, m.silkRed, m.gold);
  k0.position.set(0, -0.78, 0);
  g.add(k0);
  const small = [[-0.62, -1.55, m.jade, m.silkYellow], [0.66, -1.85, m.porcelain, m.silkRed]];
  small.forEach(([x, y, pm, tm]) => {
    g.add(tube([[0, -0.84, 0], [x * 0.45, -1.02, 0], [x, y + 0.4, 0]], 0.022, m.silkRed, 24));
    const kn = knot(0.075, m.silkRed, m.gold);
    kn.position.set(x, y + 0.36, 0);
    g.add(kn);
    g.add(batPlaque(0.3, 0.07, pm, m.gold).translateX(x).translateY(y));
    const t = cappedTassel(0.95, 0.24, tm, m, 22);
    t.position.set(x, y - 0.5, 0);
    g.add(t);
  });
  g.position.y = 0.45;
  return g;
};

// 용 머리(옆모습): 금빛 머리, 뿔, 눈, 입에 문 구슬(여의주)
function dragonHead(m, pearlMat) {
  const g = new THREE.Group();
  const gold = m.gold;
  const sc = (geo, mat, pos, scl, rot) => {
    const o = new THREE.Mesh(geo, mat);
    o.position.set(...pos);
    o.scale.set(...scl);
    if (rot) o.rotation.set(...rot);
    return o;
  };
  g.add(sc(new THREE.SphereGeometry(0.2, 28, 20), gold, [0, 0.16, 0], [1.15, 1, 0.9]));          // 머리통
  g.add(sc(new THREE.SphereGeometry(0.15, 24, 16), gold, [0.3, 0.12, 0], [1.6, 0.8, 0.8]));       // 코·윗입
  g.add(sc(new THREE.SphereGeometry(0.13, 24, 16), gold, [0.26, -0.04, 0], [1.5, 0.5, 0.75]));     // 아래턱
  [0.07, -0.07].forEach((z) => {
    g.add(sc(new THREE.SphereGeometry(0.035, 12, 10), m.ink, [0.12, 0.26, z * 1.35], [1, 1, 1]));    // 눈
    g.add(sc(new THREE.SphereGeometry(0.03, 10, 8), gold, [0.5, 0.18, z * 0.8], [1, 1, 1]));         // 콧구멍
    g.add(sc(new THREE.ConeGeometry(0.05, 0.42, 12), gold, [-0.1, 0.46, z * 1.1], [1, 1, 1], [0, 0, 0.9])); // 뿔
  });
  [0.05, -0.05].forEach((z) => {
    g.add(sc(new THREE.SphereGeometry(0.05, 12, 8), gold, [0.1, 0.32, z * 1.5], [1.4, 0.6, 0.8]));              // 눈두덩
    for (let i = 0; i < 3; i += 1) g.add(sc(new THREE.ConeGeometry(0.014, 0.05, 6), m.silkWhite, [0.3 + i * 0.07, 0.01, z * 1.2], [1, 1, 1], [Math.PI, 0, 0])); // 이빨
  });
  g.add(sc(new THREE.SphereGeometry(0.075, 14, 10), gold, [0.5, 0.26, 0], [1, 0.8, 1]));                       // 들린 코끝
  // 갈기·수염: 목덜미에서 뒤로 흐르는 가시와 턱 아래로 늘어진 수염
  for (let i = 0; i < 5; i += 1) g.add(sc(new THREE.ConeGeometry(0.045, 0.16, 8), gold, [-0.2 - i * 0.02, 0.1 - i * 0.14, 0], [1, 1, 1], [0, 0, 1.8]));
  g.add(tube([[0.38, -0.08, 0.06], [0.52, -0.3, 0.1], [0.42, -0.5, 0.04], [0.55, -0.62, 0.0]], 0.014, gold, 20));
  g.add(tube([[0.38, -0.08, -0.06], [0.5, -0.28, -0.12], [0.4, -0.46, -0.04]], 0.014, gold, 20));
  // 여의주(조각보 구슬)
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 40, 28), pearlMat);
  planarUV(ball.geometry);
  ball.position.set(0.62, 0.0, 0);
  g.add(ball);
  return g;
}

export const binyeoDragon = ({ tex, m }) => {
  // 용잠: 검은 몸통에 금 마디, 위쪽은 목을 구부려 고개를 든 용 — 여의주에 조각보를 입힌다
  const g = new THREE.Group();
  const len = 2.5;
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.034, len, 20), m.ink, [0, -len / 2, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.26, 20), m.gold, [0, -0.1, 0]));
  g.add(mesh(new THREE.TorusGeometry(0.068, 0.014, 8, 20), m.gold, [0, -0.26, 0], [Math.PI / 2, 0, 0]));
  g.add(mesh(new THREE.CylinderGeometry(0.036, 0.034, 0.42, 20), m.gold, [0, -len + 0.3, 0]));
  g.add(mesh(new THREE.ConeGeometry(0.034, 0.16, 16), m.gold, [0, -len - 0.02, 0], [Math.PI, 0, 0]));
  // 목: 몸통 위에서 한 번 휘어 올라간다
  g.add(tube([[0, 0.0, 0], [0.0, 0.2, 0], [-0.1, 0.42, 0], [-0.06, 0.62, 0]], 0.062, m.gold, 30));
  for (let i = 0; i < 4; i += 1) g.add(mesh(new THREE.ConeGeometry(0.035, 0.12, 8), m.gold, [-0.1 - i * 0.012, 0.1 + i * 0.13, 0], [0, 0, 1.5]));
  const head = dragonHead(m, texMat(tex));
  head.scale.setScalar(1.3);
  head.rotation.z = 0.28;
  head.position.set(-0.08, 0.62, 0);
  g.add(head);
  g.position.y = 0.55;
  return g;
};

export const broochTtuljam = ({ tex, m }) => {
  // 떨잠: 금판 꽃 위에 보석을 박고, 위에서 가는 금실 끝에 진주가 떠는 머리 장식
  const g = new THREE.Group();
  const dn = getDna();
  const petals = dn.k ? Math.max(6, dn.petals) : 8;
  g.add(extrudeShape(lobedShape(1.0, petals, dn.k ? dn.petalDepth : 0.12), 0.1, m.gold, m.gold, 0.035));
  // 가운데: 조각보를 씌운 둥근 보석
  const cabGeo = new THREE.SphereGeometry(0.58, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2);
  cabGeo.rotateX(Math.PI / 2); // 볼록한 쪽이 앞(+z)을 보게
  cabGeo.scale(1, 1, 0.5);
  planarUV(cabGeo);
  const cab = new THREE.Mesh(cabGeo, texMat(tex));
  cab.position.z = 0.05;
  g.add(cab);
  g.add(mesh(new THREE.TorusGeometry(0.58, 0.04, 10, 48), m.gold, [0, 0, 0.065]));
  // 둘레 보석: 산호·비취·진주를 번갈아
  const gems = [m.lacquerRed, m.jadeDark, m.porcelain];
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    g.add(mesh(new THREE.SphereGeometry(i % 3 === 2 ? 0.075 : 0.065, 16, 12), gems[i % 3], [Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0.09]));
  }
  // 떨: 위로 솟은 금실 세 가닥 끝에 진주
  [[-0.32, 1.55], [0, 1.78], [0.32, 1.55]].forEach(([x, y], i) => {
    g.add(tube([[x * 0.4, 0.95, 0.05], [x * 0.8, 1.2, 0.08 + (i % 2) * 0.03], [x, y - 0.07, 0.06]], 0.012, m.gold, 20));
    g.add(mesh(new THREE.SphereGeometry(0.075, 16, 12), m.porcelain, [x, y, 0.06]));
  });
  g.add(mesh(new THREE.SphereGeometry(0.07, 12, 10), m.gold, [0, 0.98, 0.06]));
  // 뒤: 놋쇠판
  g.add(mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.03, 24), m.brass, [0, 0, -0.1], [Math.PI / 2, 0, 0]));
  g.position.y = -0.3;
  return g;
};
