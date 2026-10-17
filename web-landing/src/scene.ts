/**
 * 잇결 소개 화면 3D 장면 — "장단이 결이 된다".
 * 백자빛 바탕 위에서 오방색 점이 장단에 맞춰 움직이고(행동), 서로 대형을 이루며 엮이고(관계),
 * 지나간 자리가 쌓여 한 장의 문양이 된다(흔적). 사람은 그리지 않고 점과 결(띠)만 쓴다. 네모 없음.
 *
 *  0.00 먹점 하나가 장단에 맞춰 원을 돈다(진양조처럼 느리게)
 *  0.15 점이 다섯으로 나뉘어 오방색이 되고, 박마다 앞으로 튀며 결을 남긴다(행동)
 *  0.33 다섯 점이 원진 → 멍석말이(나선) → 두 줄 대형으로 바뀌며 결이 서로 엮인다(관계)
 *  0.55 판이 바뀔 때마다 대형도 바뀐다(진법 · 인쇄 · 전래놀이 · 한글 · 탈춤 · 단청)
 *  0.75 결이 길어지며 꽃잎처럼 겹쳐 한 장의 문양이 된다(흔적)
 *  0.90 문양이 천천히 돌며 서고, 카메라가 물러난다
 */
import * as THREE from 'three';

const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const smooth = (n: number) => {
  n = clamp(n);
  return n * n * (3 - 2 * n);
};
const span = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// 오방색(청 · 적 · 황 · 백 · 흑) — 바탕이 백자빛이라 '백' 자리는 단청의 녹(청록)으로, '흑'은 먹으로
export const OBANG = ['#2b5f8e', '#b3322b', '#c8982b', '#2c7a64', '#1b2227'];
const BG = '#f1f4f3';

export function jangdanName(p: number): string {
  if (p < 0.12) return '진양조';
  if (p < 0.4) return '중모리';
  if (p < 0.58) return '중중모리';
  if (p < 0.8) return '자진모리';
  return '휘모리';
}

type Disposable = { dispose?: () => void };

// 대형(진법)의 모양: k번째 점의 자리(평면 x, z)
type Formation = (k: number, n: number, t: number) => [number, number];
const FORMATIONS: Formation[] = [
  // 원진(강강술래 원)
  (k, n, t) => {
    const a = (k / n) * Math.PI * 2 + t;
    return [Math.cos(a) * 2.6, Math.sin(a) * 2.6];
  },
  // 멍석말이(나선)
  (k, n, t) => {
    const s = k / n;
    const a = s * Math.PI * 3.2 + t * 1.3;
    const r = 0.6 + s * 2.6;
    return [Math.cos(a) * r, Math.sin(a) * r];
  },
  // 두 줄로 마주 서서 엇갈리기
  (k, n, t) => {
    const side = k % 2 ? 1 : -1;
    const x = ((k - (n - 1) / 2) / n) * 5.2 + Math.sin(t * 2 + k) * 0.6;
    return [x, side * (1.2 + Math.sin(t * 2 + k) * 0.6)];
  },
  // 별(오방을 잇는 대각)
  (k, n, t) => {
    const a = (k / n) * Math.PI * 2 + t * 0.7;
    const r = 1.6 + 1.2 * Math.sin(t * 3 + k * 2.4);
    return [Math.cos(a) * r, Math.sin(a) * r];
  },
];

export class ItgyeolScene {
  progress = 0;
  paused = false;
  shift = -0.18;
  private curShift = -0.18;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  private own: Disposable[] = [];
  private raf = 0;
  private t = 0;
  private beat = 0;
  private last = performance.now();
  private narrow = false;
  private w = 1;
  private h = 1;
  private ro: ResizeObserver | null = null;
  private pointer = { x: 0, y: 0 };
  private reduced: boolean;
  private tick: (now: number) => void;
  private onMove = (e: PointerEvent) => {
    this.pointer.x = e.clientX / window.innerWidth - 0.5;
    this.pointer.y = e.clientY / window.innerHeight - 0.5;
  };

  constructor(private el: HTMLElement, gallery: string[] = []) {
    this.reduced = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const keep = <T extends Disposable>(r: T): T => {
      this.own.push(r);
      return r;
    };
    const c = (hex: string) => new THREE.Color(hex);
    const renderer = (this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' }));
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = this.scene;
    scene.add(new THREE.HemisphereLight('#ffffff', '#c9d2cf', 1.6));
    const key = new THREE.DirectionalLight('#ffffff', 1.4);
    key.position.set(4, 9, 6);
    scene.add(key);

    // 판(놀이 마당): 기울어진 원판 위에서 점들이 움직인다
    const stage = new THREE.Group();
    stage.rotation.x = -0.95;
    scene.add(stage);

    // 바닥 동심원(한지 위 먹선처럼 옅게) — 박마다 바깥으로 번진다
    const ringGeo = keep(new THREE.RingGeometry(0.995, 1, 160));
    const rings = Array.from({ length: 6 }, (_, i) => {
      const m = new THREE.Mesh(ringGeo, keep(new THREE.MeshBasicMaterial({ color: c('#1b2227'), transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })));
      m.scale.setScalar(1.2 + i * 0.75);
      stage.add(m);
      return m;
    });
    const pulseGeo = keep(new THREE.RingGeometry(0.97, 1, 160));
    const pulses = Array.from({ length: 16 }, () => {
      const m = new THREE.Mesh(pulseGeo, keep(new THREE.MeshBasicMaterial({ color: c(OBANG[1]), transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })));
      m.visible = false;
      stage.add(m);
      return { m, age: 99, life: 1.6, size: 3, x: 0, z: 0 };
    });
    let pulseNext = 0;
    const pulseAt = (x: number, z: number, color: string, size: number) => {
      const r = pulses[pulseNext++ % pulses.length];
      r.m.position.set(x, z, 0.002);
      (r.m.material as THREE.MeshBasicMaterial).color.set(color);
      r.age = 0;
      r.size = size;
      r.m.visible = true;
    };

    // ---------- 점 다섯(오방색 구슬) + 결(지나간 자리 띠)
    const N = 5;
    const HIST = 420; // 결의 최대 길이(프레임 수)
    const bead = keep(new THREE.SphereGeometry(0.17, 40, 28));
    const bgColor = c(BG);
    const dots = OBANG.map((hex, k) => {
      const mat = keep(new THREE.MeshPhysicalMaterial({ color: c(hex), roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 }));
      const m = new THREE.Mesh(bead, mat);
      stage.add(m);
      // 결: 리본(띠) — 점이 지나간 자리를 좌우로 벌린 두 줄의 꼭짓점으로 만든다
      const pos = new Float32Array(HIST * 2 * 3);
      const col = new Float32Array(HIST * 2 * 3);
      const idx: number[] = [];
      for (let i = 0; i < HIST - 1; i++) {
        const a = i * 2, b = a + 1, c2 = a + 2, d = a + 3;
        idx.push(a, b, c2, b, d, c2);
      }
      const geo = keep(new THREE.BufferGeometry());
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.setIndex(idx);
      const ribbon = new THREE.Mesh(geo, keep(new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.92, depthWrite: false })));
      stage.add(ribbon);
      const trail: THREE.Vector3[] = [];
      return { k, hex, color: c(hex), mat, m, geo, pos, col, ribbon, trail, env: 0, lastHit: -1, phase: k * 0.37 };
    });

    // 떠다니는 먹 티끌(한지 섬유 느낌)
    const DUST = 120;
    const dustPos = new Float32Array(DUST * 3);
    const dustGeo = keep(new THREE.BufferGeometry());
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const seeds = Array.from({ length: DUST }, (_, i) => [Math.sin(i * 12.9898) * 43758.5453 % 1, Math.sin(i * 78.233) * 12345.678 % 1, Math.sin(i * 3.7) * 999.1 % 1]);
    scene.add(new THREE.Points(dustGeo, keep(new THREE.PointsMaterial({ color: c('#7c8a86'), size: 0.03, transparent: true, opacity: 0.5, depthWrite: false }))));

    // ---------- 결과물: 놀이로 빚은 작품들이 둥글게 돌며 떠 있다(배경 없는 그림이라 틀이 없다)
    const loader = new THREE.TextureLoader();
    const gallerySprites = gallery.map((url, i) => {
      const tex = keep(loader.load(url));
      tex.colorSpace = THREE.SRGBColorSpace;
      const sp = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })));
      sp.scale.setScalar(1.35);
      sp.visible = false;
      scene.add(sp);
      return { sp, a: (i / Math.max(1, gallery.length)) * Math.PI * 2, bob: i * 0.7 };
    });

    const resize = () => {
      const w = el.clientWidth || 1, h = el.clientHeight || 1;
      this.narrow = w / h < 0.9;
      renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.fov = this.narrow ? 54 : 38;
      this.w = w;
      this.h = h;
      this.applyShift();
    };
    resize();
    this.ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    this.ro?.observe(el);
    window.addEventListener('pointermove', this.onMove, { passive: true });

    const v = new THREE.Vector3();
    const tan = new THREE.Vector3();
    const side = new THREE.Vector3();
    const up = new THREE.Vector3(0, 0, 1);
    const HIT_AT = [0, 0.3, 0.52, 0.68, 0.82];

    this.tick = (now: number) => {
      this.raf = requestAnimationFrame(this.tick);
      const dt = clamp((now - this.last) / 1000, 0, 0.05);
      this.last = now;
      const moving = !this.paused && !this.reduced && !document.hidden;
      if (moving) this.t += dt;
      const t = this.t;
      const p = this.progress;

      const ang0 = -0.25 + p * 0.6 + this.pointer.x * 0.2;
      const split = span(p, 0.1, 0.2); // 점 하나 → 다섯
      const relate = span(p, 0.22, 0.32);
      const trace = span(p, 0.58, 0.72); // 흔적: 결이 길어지며 꽃잎 문양으로
      const finale = span(p, 0.9, 1);
      // 대형: 관계 구간 안에서 원진 → 나선 → 두 줄 → 별, 판 구간에서도 계속 바뀐다
      const fPos = clamp((p - 0.24) / 0.32) * (FORMATIONS.length - 1);
      const fA = Math.floor(fPos), fB = Math.min(FORMATIONS.length - 1, fA + 1), fK = smooth(fPos - fA);

      // 장단 빠르기(한 장단 = 1) — 진양조 → 휘모리
      const tempo = lerp(0.22, 1.05, span(p, 0.05, 0.8)) * lerp(1, 0.45, finale);
      if (moving) this.beat += dt * tempo;
      const cycle = Math.floor(this.beat), inCycle = this.beat - cycle;

      dots.forEach((d) => {
        // 박: 제 자리가 오면 앞으로 튀어 나간다
        const at = HIT_AT[d.k];
        const hitIndex = cycle * 5 + d.k + (inCycle >= at ? 1 : 0);
        if (moving && inCycle >= at && hitIndex !== d.lastHit && d.lastHit !== -1 && split > 0.2 + d.k * 0.12) {
          d.env = 1;
          pulseAt(d.m.position.x, d.m.position.y, d.hex, 1.2 + 1.6 * relate + 2 * trace);
        }
        d.lastHit = hitIndex;
        d.env *= Math.exp(-dt * 5);
        if (moving) d.phase += dt * (0.25 + 0.9 * tempo) * (1 + 1.6 * d.env);

        // 자리 정하기
        let x: number, z: number;
        // 하나일 때: 가운데 원을 돈다(다섯이 한 점에 겹쳐 있다)
        const solo: [number, number] = [Math.cos(dots[0].phase) * 2.2, Math.sin(dots[0].phase) * 2.2];
        // 행동: 각자 원을 돌며 박마다 바깥으로 튄다
        const act: [number, number] = [Math.cos(d.phase + d.k * 1.256) * (2.2 + 0.5 * d.env), Math.sin(d.phase + d.k * 1.256) * (2.2 + 0.5 * d.env)];
        const fa = FORMATIONS[fA](d.k, N, d.phase * 0.6), fb = FORMATIONS[fB](d.k, N, d.phase * 0.6);
        const form: [number, number] = [lerp(fa[0], fb[0], fK), lerp(fa[1], fb[1], fK)];
        // 흔적: 장미곡선(r = cos(5θ/2))을 따라 다섯 점이 꽃잎을 나눠 그려, 겹치면 단청 머리초 같은 꽃 문양이 된다
        const th = d.phase * 0.55 + (d.k * Math.PI * 4) / 5;
        const rr = 2.9 * Math.cos(2.5 * th);
        const rose: [number, number] = [Math.cos(th) * rr, Math.sin(th) * rr];
        x = lerp(lerp(solo[0], act[0], split), form[0], relate);
        z = lerp(lerp(solo[1], act[1], split), form[1], relate);
        x = lerp(x, rose[0], trace);
        z = lerp(z, rose[1], trace);
        const y = 0.17 + 0.35 * d.env;
        d.m.position.set(x, z, y);
        d.m.scale.setScalar(lerp(d.k === 0 ? 1.25 : 0.001, 1, split) * (1 + 0.35 * d.env));
        d.m.visible = d.k === 0 || split > 0.02;

        // 결(띠) 갱신: 앞에 새 자리를 넣고, 길이는 진행에 따라 늘어난다
        const maxLen = Math.round(lerp(60, HIST, Math.max(trace, 0.25 * relate)));
        if (moving || d.trail.length === 0) {
          d.trail.unshift(new THREE.Vector3(x, z, 0.02 + 0.02 * d.k));
          if (d.trail.length > HIST) d.trail.length = HIST;
        }
        const L = Math.min(d.trail.length, maxLen);
        const width = lerp(0.045, 0.08, relate) * (1 - 0.25 * trace);
        for (let i = 0; i < HIST; i++) {
          const q = d.trail[Math.min(i, L - 1)] ?? v.set(x, z, 0);
          const nxt = d.trail[Math.min(i + 1, L - 1)] ?? q;
          tan.subVectors(q, nxt);
          if (tan.lengthSq() < 1e-8) tan.set(1, 0, 0);
          side.crossVectors(tan, up).normalize();
          const fade = i < L ? 1 - i / L : 0;
          const wdt = width * Math.pow(fade, 0.6);
          d.pos[i * 6] = q.x + side.x * wdt;
          d.pos[i * 6 + 1] = q.y + side.y * wdt;
          d.pos[i * 6 + 2] = q.z;
          d.pos[i * 6 + 3] = q.x - side.x * wdt;
          d.pos[i * 6 + 4] = q.y - side.y * wdt;
          d.pos[i * 6 + 5] = q.z;
          // 꼬리로 갈수록 바탕색에 스며든다(먹이 번지듯)
          const mix = 1 - Math.pow(fade, 0.8) * (0.85 + 0.15 * trace);
          const r = d.color.r + (bgColor.r - d.color.r) * mix;
          const g = d.color.g + (bgColor.g - d.color.g) * mix;
          const b = d.color.b + (bgColor.b - d.color.b) * mix;
          d.col[i * 6] = d.col[i * 6 + 3] = r;
          d.col[i * 6 + 1] = d.col[i * 6 + 4] = g;
          d.col[i * 6 + 2] = d.col[i * 6 + 5] = b;
        }
        (d.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
        (d.geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
        d.ribbon.visible = d.k === 0 || split > 0.05;
      });

      pulses.forEach((r) => {
        if (!r.m.visible) return;
        if (moving) r.age += dt;
        const k = r.age / r.life;
        if (k >= 1) {
          r.m.visible = false;
          return;
        }
        r.m.scale.setScalar(0.2 + r.size * smooth(k));
        (r.m.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - k);
      });
      rings.forEach((m, i) => {
        (m.material as THREE.MeshBasicMaterial).opacity = 0.05 + 0.04 * Math.sin(t * 0.8 - i * 0.6);
      });

      // 결과물 원: 흔적 구간에서 나타나 돈다
      {
        const show = span(p, 0.58, 0.64) * (1 - span(p, 0.8, 0.86));
        const R = this.narrow ? 3.2 : 4.3;
        gallerySprites.forEach((g) => {
          const a = g.a + t * 0.18;
          g.sp.position.set(Math.sin(a) * R, 1.3 + Math.sin(t * 0.9 + g.bob) * 0.18 + 0.4 * Math.cos(a), Math.cos(a) * R);
          const front = 0.55 + 0.45 * Math.cos(a - ang0);
          (g.sp.material as THREE.SpriteMaterial).opacity = show * front;
          g.sp.scale.setScalar((1.05 + 0.45 * front) * (0.6 + 0.4 * show));
          g.sp.visible = show > 0.01;
        });
      }
      // 판: 천천히 돌고, 흔적 구간에서 문양이 서서히 일어선다
      stage.rotation.z = t * 0.05 * (1 + trace);
      stage.rotation.x = lerp(-0.95, -0.35, finale) + Math.sin(t * 0.3) * 0.03;
      stage.position.y = lerp(0, 0.6, finale);

      {
        const pos = dustGeo.attributes.position as THREE.BufferAttribute;
        seeds.forEach((s, k) => {
          pos.setXYZ(k, (s[0] - 0.5) * 18 + Math.sin(t * 0.2 + k) * 0.3, ((Math.abs(s[1]) * 8 + t * 0.08 * (1 + Math.abs(s[2]))) % 8) - 2, (s[2] - 0.5) * 10 - 2);
        });
        pos.needsUpdate = true;
      }

      if (Math.abs(this.shift - this.curShift) > 0.0005) {
        this.curShift += (this.shift - this.curShift) * (1 - Math.exp(-dt * 3));
        this.applyShift();
      }
      // 카메라: 천천히 돌며, 관계에서 다가가고 마지막에 물러난다
      const ang = ang0;
      const dist = (this.narrow ? 14.5 : 10.5) - 1.2 * relate + 1.5 * trace + 2.2 * finale;
      v.set(Math.sin(ang) * dist, 3.2 + 1.5 * relate - 0.5 * finale - this.pointer.y * 0.6, Math.cos(ang) * dist);
      this.camera.position.copy(v);
      this.camera.lookAt(0, (this.narrow ? 1.6 : 0.2) + 2.2 * finale, 0);
      renderer.render(scene, this.camera);
    };
  }

  private applyShift() {
    if (this.narrow) this.camera.clearViewOffset();
    else this.camera.setViewOffset(this.w, this.h, this.w * this.curShift, 0, this.w, this.h);
    this.camera.updateProjectionMatrix();
  }

  start() {
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pointermove', this.onMove);
    this.ro?.disconnect();
    this.own.forEach((r) => r.dispose?.());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
