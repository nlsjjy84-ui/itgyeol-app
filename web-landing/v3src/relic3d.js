// 국립중앙박물관 3D 스캔(공공누리 제1유형)을 줄인 모양(.bin)과 질감(.jpg)으로 띄운다.
// .bin 형식: [머리 길이 u32][머리 JSON][위치 u16×3][uv u16×2][삼각형 번호 u16 또는 u32]
import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute, Mesh,
  MeshStandardMaterial, TextureLoader, SRGBColorSpace, AmbientLight, DirectionalLight, HemisphereLight, Group, Box3, Vector3,
} from 'three';

export async function loadGeometry(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const hl = new DataView(buf).getUint32(0, true);
  const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 4, hl)));
  let o = 4 + hl;
  const n = head.n;
  const q = new Uint16Array(buf, o, n * 3); o += n * 6;
  const uvq = new Uint16Array(buf, o, n * 2); o += n * 4;
  const idx = head.i32 ? new Uint32Array(buf, o, head.t * 3) : new Uint16Array(buf.slice(o, o + head.t * 6));
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) for (let a = 0; a < 3; a++) pos[i * 3 + a] = head.mn[a] + (q[i * 3 + a] / 65535) * (head.mx[a] - head.mn[a]);
  const uv = new Float32Array(n * 2);
  for (let i = 0; i < n * 2; i++) uv[i] = uvq[i] / 65535;
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('uv', new BufferAttribute(uv, 2));
  g.setIndex(new BufferAttribute(idx, 1));
  g.computeVertexNormals();
  // 가운데로 옮기고 크기 1로
  g.computeBoundingBox();
  const c = new Vector3(); g.boundingBox.getCenter(c);
  g.translate(-c.x, -c.y, -c.z);
  const s = new Vector3(); g.boundingBox.getSize(s);
  const k = 1 / Math.max(s.x, s.y, s.z);
  g.scale(k, k, k);
  return g;
}

// opts: { bin, tex, rot:[x,y,z] 기본 자세, light:'warm'|'day'|'ink', spin(초당 회전), copies(같은 유물 여러 개) }
export async function mountRelic(canvas, opts) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new Scene();
  const cam = new PerspectiveCamera(28, 1, 0.01, 50);
  cam.position.set(0, 0, opts.dist || 2.6);
  const L = opts.light || 'warm';
  if (L === 'warm') {
    scene.add(new AmbientLight(0xffe9cc, 0.35));
    const key = new DirectionalLight(0xffe2b8, 3.2); key.position.set(1.2, 2.4, 1.6); scene.add(key);
    const rim = new DirectionalLight(0x9fb6ff, 1.1); rim.position.set(-2, 0.6, -1.5); scene.add(rim);
  } else if (L === 'ink') {
    scene.add(new HemisphereLight(0xfff6e8, 0x6a5a48, 1.25));
    const key = new DirectionalLight(0xffffff, 2.1); key.position.set(-1.4, 2, 2); scene.add(key);
  } else {
    scene.add(new HemisphereLight(0xffffff, 0xd8cfc0, 1.5));
    const key = new DirectionalLight(0xffffff, 2.2); key.position.set(1.5, 2, 2.2); scene.add(key);
  }
  const [geo, tex] = await Promise.all([loadGeometry(opts.bin), new TextureLoader().loadAsync(opts.tex)]);
  tex.colorSpace = SRGBColorSpace; tex.flipY = true; tex.anisotropy = 8;
  const mat = new MeshStandardMaterial({ map: tex, roughness: opts.rough ?? 0.55, metalness: opts.metal ?? 0.0 });
  const copies = opts.copies || 1;
  const root = new Group(); scene.add(root);
  const items = [];
  for (let i = 0; i < copies; i++) {
    const holder = new Group();
    const m = new Mesh(geo, mat);
    if (opts.rot) m.rotation.set(...opts.rot);
    holder.add(m); root.add(holder); items.push(holder);
  }
  const state = { t: 0, progress: 0, root, items, cam, onFrame: null };
  function size() {
    const w = canvas.clientWidth || 300; const h = canvas.clientHeight || 300;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  size(); window.addEventListener('resize', size);
  let last = performance.now();
  const spin = opts.spin ?? 0.35;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; state.t += dt;
    if (state.onFrame) state.onFrame(state, dt);
    else { root.rotation.y += spin * dt; root.rotation.x = Math.sin(state.t * 0.6) * 0.12; }
    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  canvas.dataset.ready = '1';
  return state;
}

// 스크롤 진행률(요소가 화면에 들어와서 나갈 때까지 0→1)
export function progressOf(el) {
  const r = el.getBoundingClientRect(); const vh = window.innerHeight;
  return Math.min(1, Math.max(0, (vh - r.top) / (r.height + vh)));
}
// 고정(sticky) 구간 안에서의 진행률 0→1
export function pinProgress(el) {
  const r = el.getBoundingClientRect(); const vh = window.innerHeight;
  return Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
}

export function reveal(root = document) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { threshold: 0.18 });
  root.querySelectorAll('[data-in]').forEach((el) => io.observe(el));
}

export function countUp(el) {
  const to = +el.dataset.n; let started = false;
  const io = new IntersectionObserver((es) => {
    if (!es[0].isIntersecting || started) return; started = true;
    const t0 = performance.now();
    const step = (now) => { const p = Math.min(1, (now - t0) / 1400); const e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e).toLocaleString('ko-KR'); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, { threshold: 0.4 });
  io.observe(el);
}
