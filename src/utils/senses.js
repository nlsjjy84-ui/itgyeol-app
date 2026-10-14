// 몸짓·표정·감탄사 알아채기 — 놀이하는 동안 카메라와 마이크로 "흥"을 재서 작품 모양에 담는다.
// 모두 이 기기 안에서만 계산한다: 영상·소리·얼굴을 저장하지도, 어디로 보내지도 않는다(남는 것은 횟수와 세기뿐).
// 켜기 전에 반드시 동의를 받는다(SenseConsent). 카메라와 마이크는 따로 허용할 수 있고, 언제든 끌 수 있다.
//   몸짓: 작게 줄인 화면(64×48)의 앞뒤 장면 밝기 차이 → 흥의 세기(0~1)와 크게 움직인 횟수
//   표정: MediaPipe 얼굴 표정 값(blendshape) → 웃은 순간, 놀란 순간(입이 벌어지고 눈썹이 올라감)
//         모델 파일만 내려받고 계산은 기기에서 한다. 못 받으면 몸짓만 잰다.
//   감탄사: 마이크 소리 크기 → 짧게 터진 소리("와!", "오~", 웃음소리)의 횟수. 말뜻은 알아듣지 않는다.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fresh } from './senseMath';

const KEY = 'itgyeol_senses_v1';
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let consent = { camera: null, mic: null }; // null = 아직 묻지 않음
// 깜짝 선물 사진: 반응이 큰 순간을 찍어 메모리에만 둔다(저장소·서버에 쓰지 않음). 결과 화면을 나가거나 새로고침하면 사라진다.
const MAX_MOMENTS = 6;
let moments = [];
export const getMoments = () => moments.slice();
export function clearMoments() {
  moments = [];
  emit();
}
let run = null;
let acc = fresh();
const subs = new Set();

const web = () => Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
export const sensesSupported = () => !!web();
export const getConsent = () => consent;
export const decided = () => consent.camera !== null || consent.mic !== null;
export const status = () => ({ camera: !!(run && run.video), mic: !!(run && run.audio), face: !!(run && run.face), moments: moments.length });

export function onSensesChange(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}
const emit = () => subs.forEach((fn) => fn(status(), consent));

export async function loadConsent() {
  try {
    const v = JSON.parse((await AsyncStorage.getItem(KEY)) || 'null');
    if (v && typeof v === 'object') consent = { camera: v.camera ?? null, mic: v.mic ?? null };
  } catch (e) {
    // 기억이 없으면 다시 묻는다
  }
  emit();
}

export function setConsent(next) {
  consent = { camera: !!next.camera, mic: !!next.mic };
  AsyncStorage.setItem(KEY, JSON.stringify(consent)).catch(() => {});
  if (run) {
    // 끈 것은 바로 멈춘다
    if (!consent.camera) stopVideo();
    if (!consent.mic) stopAudio();
  }
  emit();
}

// ── 몸짓 + 표정(카메라) ──
// 지금 장면을 한 장 찍는다(같은 반응이 몰리면 1.5초에 한 장). 반응이 큰 순서로 6장만 남긴다.
let lastShot = 0;
function snap(kind, score) {
  if (!run || !run.video) return;
  const now = Date.now();
  if (now - lastShot < 1500) return;
  const v = run.video.video;
  if (!v || v.readyState < 2 || !v.videoWidth) return;
  lastShot = now;
  const w = 480;
  const h = Math.round((w * v.videoHeight) / v.videoWidth);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  // 거울처럼 보이게 좌우를 뒤집어 찍는다(셀카와 같은 방향)
  x.translate(w, 0);
  x.scale(-1, 1);
  x.drawImage(v, 0, 0, w, h);
  const shot = { id: `${now}`, kind, score, at: now, uri: c.toDataURL('image/jpeg', 0.85), scene: run.scene || null };
  moments = [...moments, shot].sort((a, b) => b.score - a.score).slice(0, MAX_MOMENTS);
  emit();
}

async function startVideo() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false });
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.srcObject = stream;
  await video.play().catch(() => {});
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 48;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  let prev = null;
  let ema = 0;
  let lastBig = 0;
  const timer = setInterval(() => {
    if (video.readyState < 2) return;
    cx.drawImage(video, 0, 0, 64, 48);
    const d = cx.getImageData(0, 0, 64, 48).data;
    const lum = new Float32Array(64 * 48);
    for (let i = 0; i < lum.length; i += 1) lum[i] = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11) / 255;
    if (prev) {
      let s = 0;
      for (let i = 0; i < lum.length; i += 1) s += Math.abs(lum[i] - prev[i]);
      const m = s / lum.length; // 0~1, 가만히 있으면 0.005 안팎
      ema = ema * 0.85 + m * 0.15;
      acc.levelSum += Math.min(1, m / 0.12);
      acc.levelN += 1;
      const now = Date.now();
      if (m > 0.09 && m > ema * 2.2 && now - lastBig > 700) {
        acc.big += 1;
        lastBig = now;
        // 움직임이 시작된 순간보다 조금 뒤가 표정·몸짓이 잘 보인다
        const sc = Math.min(1, m / 0.2);
        setTimeout(() => snap('move', sc), 350);
      }
    }
    prev = lum;
  }, 120);
  run.video = { stream, video, timer };
  emit();
  startFace(video);
}

async function startFace(video) {
  try {
    const load = new Function('u', 'return import(u)'); // 번들러를 거치지 않고 브라우저가 바로 불러온다
    const vision = await load(`${MP}/vision_bundle.mjs`);
    const files = await vision.FilesetResolver.forVisionTasks(`${MP}/wasm`);
    const lm = await vision.FaceLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' },
      outputFaceBlendshapes: true,
      runningMode: 'VIDEO',
      numFaces: 1,
    });
    if (!run || !run.video) return lm.close();
    let smiling = false;
    let surprised = false;
    const timer = setInterval(() => {
      if (video.readyState < 2) return;
      let res;
      try {
        res = lm.detectForVideo(video, performance.now());
      } catch (e) {
        return;
      }
      const cats = res && res.faceBlendshapes && res.faceBlendshapes[0] && res.faceBlendshapes[0].categories;
      if (!cats) return;
      const v = (n) => (cats.find((c) => c.categoryName === n) || { score: 0 }).score;
      const smile = (v('mouthSmileLeft') + v('mouthSmileRight')) / 2;
      const wow = v('jawOpen') > 0.4 && v('browInnerUp') > 0.35;
      // 표정이 새로 생긴 순간만 센다(웃고 있는 동안 계속 세지 않는다)
      if (smile > 0.55 && !smiling) {
        acc.smile += 1;
        snap('smile', 0.6 + smile * 0.4);
      }
      if (wow && !surprised) {
        acc.surprise += 1;
        snap('surprise', 0.6 + v('jawOpen') * 0.4);
      }
      smiling = smile > 0.4;
      surprised = wow;
    }, 250);
    run.face = { lm, timer };
    emit();
  } catch (e) {
    // 표정 모델을 못 받으면 몸짓만 잰다
  }
}

function stopVideo() {
  if (!run) return;
  if (run.face) {
    clearInterval(run.face.timer);
    try {
      run.face.lm.close();
    } catch (e) {
      // 이미 닫힘
    }
    run.face = null;
  }
  if (run.video) {
    clearInterval(run.video.timer);
    run.video.stream.getTracks().forEach((t) => t.stop());
    run.video.video.srcObject = null;
    run.video = null;
  }
  emit();
}

// ── 감탄사(마이크) ──
async function startAudio() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser();
  an.fftSize = 1024;
  src.connect(an);
  const buf = new Float32Array(an.fftSize);
  let base = 0.01;
  let startAt = 0;
  let peak = 0;
  const timer = setInterval(() => {
    an.getFloatTimeDomainData(buf);
    let s = 0;
    for (let i = 0; i < buf.length; i += 1) s += buf[i] * buf[i];
    const rms = Math.sqrt(s / buf.length);
    const loud = rms > Math.max(0.05, base * 4);
    const now = Date.now();
    if (loud && !startAt) startAt = now;
    if (loud) peak = Math.max(peak, rms);
    if (!loud && startAt) {
      const len = now - startAt;
      // 0.12~1.6초 사이로 짧게 터졌다 끝난 소리 = 감탄사·웃음 한 번(긴 말소리·음악은 세지 않는다)
      if (len >= 120 && len <= 1600) {
        acc.burst += 1;
        snap('wow', 0.5 + Math.min(0.4, peak * 2));
      }
      peak = 0;
      startAt = 0;
    }
    if (!loud) base = base * 0.97 + rms * 0.03;
  }, 50);
  run.audio = { stream, ctx, timer };
  emit();
}

function stopAudio() {
  if (!run || !run.audio) return;
  clearInterval(run.audio.timer);
  run.audio.stream.getTracks().forEach((t) => t.stop());
  run.audio.ctx.close().catch(() => {});
  run.audio = null;
  emit();
}

// 놀이 화면에 들어오면 켜고, 나가면 끈다. 동의한 것만 켠다.
export async function startSensing(scene) {
  if (!web() || run) return;
  if (!consent.camera && !consent.mic) return;
  run = { video: null, audio: null, face: null, scene: scene || null };
  acc = fresh();
  if (consent.camera) await startVideo().catch(() => {});
  if (consent.mic && run) await startAudio().catch(() => {});
  if (run && !run.video && !run.audio) run = null;
  emit();
}

// 멈추고 이번 판에서 잰 값을 돌려준다(아무것도 안 켰으면 null)
export function stopSensing() {
  if (!run) return null;
  stopVideo();
  stopAudio();
  run = null;
  const out = acc;
  acc = fresh();
  emit();
  if (!out.levelN && !out.burst && !out.smile && !out.surprise) return null;
  return out;
}

export { mergeSenses, senseSummary } from './senseMath';

// 동의 창 열기(설정 칩·놀이 시작 때)
const askers = new Set();
export function onAskConsent(fn) {
  askers.add(fn);
  return () => askers.delete(fn);
}
export function askConsent(then) {
  askers.forEach((fn) => fn(then));
}
