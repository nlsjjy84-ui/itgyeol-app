// 합체 영상의 "대본" — 어느 조각이 언제 어디서 날아와 어디에 끼워지는지, 자막이 언제 뜨는지.
// 순수 계산만 한다(화면 없이). 앱 화면(HapcheStage)과 웹의 영상 저장(movieExport)이 같은 대본을 쓴다.
import { FRAME_BY_ID, SLOT_INFO } from '../data/frames';
import { PIECE_BY_K, PIECES } from '../data/pieces';
import { t, getLang } from '../i18n';

// ── 한국어 조사(이/가, 은/는, 을/를, 와/과, 으로/로)
function hasBatchim(word) {
  const w = String(word || '').trim();
  const ch = w.charCodeAt(w.length - 1);
  if (ch >= 0xac00 && ch <= 0xd7a3) return (ch - 0xac00) % 28 !== 0;
  return /[136780lmnr]$/i.test(w);
}
export function josa(word, pair) {
  const [a, b] = pair.split('/');
  if (getLang && getLang() !== 'ko') return word;
  if (pair === '으로/로') {
    const w = String(word || '').trim();
    const ch = w.charCodeAt(w.length - 1);
    const jong = ch >= 0xac00 && ch <= 0xd7a3 ? (ch - 0xac00) % 28 : 0;
    return word + (jong === 0 || jong === 8 ? '로' : '으로');
  }
  return word + (hasBatchim(word) ? a : b);
}

// 이름을 짧게: "백자 청화 구름무늬 항아리" → "항아리", 괄호·한자는 뺀다
export function shortName(name) {
  const clean = String(name || '').replace(/\(.*?\)|\[.*?\]|「|」/g, '').trim();
  const parts = clean.split(/\s+/);
  return parts[parts.length - 1] || clean;
}

const POWER_TAG = { 흙: '흙결', 쇠: '쇠결', 돌: '돌결', 옥: '옥빛', 나무: '나뭇결', 천: '비단결', 종이: '한지결', 금: '금빛', 뼈: '뼈결' };
export function powerTag(power) {
  return POWER_TAG[power] || '결';
}

// 작품 이름 — 몸통 유물의 재료 결 + 틀 이름 + 「몸통 유물 이름 + 호」
export function workTitle(frame, bodyPiece) {
  const tag = powerTag(bodyPiece ? bodyPiece.power : '');
  const short = bodyPiece ? shortName(bodyPiece.name).slice(0, 4) : '잇결';
  return { full: `${t(tag)} ${t(frame.name)} 「${short}${t('호')}」`, tag, short };
}

// 틀마다 작품이 하는 일 — 끝 장면 자막
const MISSION = {
  guardian: '밤새 박물관 문을 지키기로 했어',
  skyship: '구름 위로 날아올라 조각들의 고향을 한 바퀴 돌아보기로 했어',
  turtle: '바퀴를 굴려 전시실 구석구석 길을 닦기로 했어',
  beast: '네 다리로 달려 잠든 유물들을 깨우러 갔어',
  seaship: '돛을 올리고 바다 건너 친구 유물들을 데리러 떠났어',
  rocket: '불꽃을 뿜으며 밤하늘 별자리를 보러 날아갔어',
  bird: '큰 날개를 펴고 박물관 지붕 위를 빙빙 돌았어',
  walker: '뚜벅뚜벅 걸어 전시실을 순찰하기 시작했어',
};
const OPENING = [
  '{scene} 놀이가 끝나자 박물관 불이 하나씩 꺼졌어.',
  '밤 아홉 시, 진열장 안에서 달그락 소리가 났어.',
  '모두 집에 간 박물관, 유물들이 하나둘 눈을 떴어.',
  '{scene} 놀이에서 생긴 결이 진열장까지 번졌어.',
];

function seeded(seed) {
  let x = (seed >>> 0) || 7;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}

const ERA_ORDER = ['선사', '신석기', '청동기', '원삼국', '삼국', '고구려', '백제', '신라', '가야', '통일신라', '남북국', '발해', '고려', '조선', '대한제국', '근대'];

// 조각의 기본 각도·크기: 틀의 자리(axis·w)에 맞춘다
export function fitPiece(piece, spec) {
  const ar = piece ? piece.ar || 1 : 1; // 너비/높이
  let base = 0;
  if (spec.axis === 'v' && ar > 1.15) base = 90;
  if (spec.axis === 'h' && ar < 0.87) base = 90;
  const long = Math.max(ar, 1); // 긴 변을 1로 둘 때
  // 그림의 원래 크기를 (ar, 1) 비율로 보고, 긴 변이 spec.w가 되게 한다
  const h = spec.w / long;
  const w = h * ar;
  return { w, h, rot: base + (spec.rot || 0) };
}

const easeOutBack = (x) => {
  const c1 = 1.5;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const easeOut = (x) => 1 - Math.pow(1 - x, 3);

// frameId: 틀 id, assign: {슬롯key: 조각k} (변형은 {core: 조각k}), opts: {scene, seed}
export function buildTimeline(frameId, assign, opts = {}) {
  const frame = FRAME_BY_ID[frameId];
  const isTransform = !!frame.parts;
  const seed = opts.seed || 1;
  const r = seeded(seed);
  const specs = isTransform ? frame.parts : frame.slots;
  const coreK = isTransform ? assign.core : null;
  const items = specs
    .map((sp) => {
      const k = isTransform ? coreK : assign[sp.key];
      const piece = PIECE_BY_K[k];
      if (!piece) return null;
      const fit = fitPiece(piece, sp);
      // 속이 빈(듬성한) 사진은 조금 크게, 꽉 찬 사진은 그대로 — 눈에 보이는 덩치를 비슷하게 맞춘다
      const grow = Math.max(0.92, Math.min(1.25, 1 + (0.7 - (piece.fill || 0.7)) * 0.55));
      fit.w *= grow;
      fit.h *= grow;
      return { sp, k, piece, fit };
    })
    .filter(Boolean);

  const OPEN = 2.2;
  const STEP = isTransform ? 0.75 : 0.5;
  const FLY = 0.65;
  const orders = [...new Set(items.map((it) => it.sp.order))].sort((a, b) => a - b);
  let cursor = OPEN;
  const events = [];
  orders.forEach((o) => {
    const group = items.filter((it) => it.sp.order === o);
    const isHead = o >= 9;
    if (isHead) cursor += 0.45; // 머리는 한 박자 쉬고 마지막에
    group.forEach((it, gi) => {
      const sp = it.sp;
      const fromLeft = sp.x < 500 || (sp.x === 500 && gi % 2 === 0);
      const from = isTransform
        ? { x: 500, y: 470, rot: 0, s: 0.2 }
        : isHead
        ? { x: 500, y: -260, rot: 0, s: 1.6 }
        : { x: fromLeft ? -320 : 1320, y: sp.y + (r() - 0.5) * 500, rot: (fromLeft ? -1 : 1) * (360 + r() * 360), s: 1.3 };
      events.push({
        key: sp.key,
        k: it.k,
        start: cursor,
        end: cursor + FLY,
        from,
        to: { x: sp.x, y: sp.y, rot: it.fit.rot, s: 1 },
        w: it.fit.w * (sp.squash ? 1 : 1),
        h: it.fit.h * (sp.squash || 1),
        flip: !!sp.flip,
        flipY: !!sp.flipY,
        z: sp.z || (isHead ? 4 : 1),
        fire: !!sp.fire,
        ghost: !!sp.ghost,
        slot: sp.slot || '',
        head: isHead,
      });
    });
    cursor += STEP;
  });
  // 결 실 — 조각과 조각을 잇는 금빛 실(잇결 = 잇는 결). 조각이 자리에 닿으면 가장 가까운 앞선 조각까지 실이 뻗는다.
  const threads = [];
  if (!isTransform || specs.length > 3)
    events.forEach((e) => {
      const prev = events.filter((o) => o !== e && o.start < e.start - 0.01);
      if (!prev.length) return;
      const near = prev.reduce((a, b) => (Math.hypot(b.to.x - e.to.x, b.to.y - e.to.y) < Math.hypot(a.to.x - e.to.x, a.to.y - e.to.y) ? b : a));
      threads.push({ a: { x: near.to.x, y: near.to.y }, b: { x: e.to.x, y: e.to.y }, t: e.end - 0.05 });
    });
  const lockT = cursor + 0.35;
  const titleT = lockT + 0.6;
  const endT = titleT + 5.4;

  // ── 이야기(자막) 만들기
  const sceneName = t(opts.scene || '잇결');
  const bodyEv = events.find((e) => e.key === 'body' || e.key === 'core') || events[0];
  const body = bodyEv ? PIECE_BY_K[bodyEv.k] : null;
  const headEv = [...events].reverse().find((e) => e.head) || events[events.length - 1];
  const head = headEv ? PIECE_BY_K[headEv.k] : null;
  const title = workTitle(frame, body);
  const eras = [...new Set(events.map((e) => (PIECE_BY_K[e.k] || {}).era).filter(Boolean))].sort((a, b) => ERA_ORDER.indexOf(a) - ERA_ORDER.indexOf(b));
  const museums = [...new Set(events.map((e) => (PIECE_BY_K[e.k] || {}).by).filter(Boolean))];
  const bodyName = body ? shortName(body.name) : '';
  const headName = head ? shortName(head.name) : '';
  const subs = [];
  const say = (t0, t1, who, text) => subs.push({ t0, t1, who, text });
  say(0.2, OPEN - 0.1, '풍이', t(OPENING[Math.floor(r() * OPENING.length)], { scene: sceneName }));
  if (isTransform) {
    say(OPEN, lockT, '결이', t('{a} 혼자서도 할 수 있대. 모양을 바꿔 볼까?', { a: josa(bodyName, '이/가') }));
  } else {
    const firstEnd = OPEN + Math.max(1.4, (lockT - OPEN) * 0.45);
    say(OPEN, firstEnd, '결이', t('{a} 먼저 일어나 외쳤어. "혼자서는 못 해, 다 모여!"', { a: josa(bodyName, '이/가') }));
    if (eras.length > 1) say(firstEnd, headEv.start - 0.05, '풍이', t('{a}부터 {b}까지, {n}개의 시대가 한자리에 모여.', { a: eras[0], b: eras[eras.length - 1], n: eras.length }));
    else say(firstEnd, headEv.start - 0.05, '풍이', t('조각 {n}개가 하나씩 제자리를 찾아가.', { n: events.length }));
    if (head) say(headEv.start - 0.05, lockT, '결이', t('마지막은 머리! {a}!', { a: headName }));
  }
  say(lockT, titleT + 1.7, '함께', t('합체! {a}', { a: title.full }));
  say(titleT + 1.7, titleT + 3.6, '풍이', t('{a} {b}', { a: josa(title.full, '은/는'), b: t(MISSION[frame.id] || MISSION.guardian) }));
  if (body) say(titleT + 3.6, endT, '결이', t('진짜 {a} {b}에 있어. 만나러 갈래?', { a: josa(shortName(body.name), '은/는'), b: body.by }));

  // 조각마다 날아올 때 붙는 이름표(유물 이름 · 시대 · 자리)
  const tags = events.map((e) => {
    const p = PIECE_BY_K[e.k];
    return { t0: e.start, t1: e.end + 0.55, key: e.key, text: `${p.name}${p.era ? ' · ' + t(p.era) : ''}`, slot: t(e.slot || '') };
  });

  return { frame, events, threads, subs, tags, lockT, titleT, dur: endT, title, body, museums, eras, isTransform };
}

// 시각 t에서 조각 하나의 자세
export function poseAt(ev, time) {
  if (time < ev.start) return null;
  const p = Math.min(1, (time - ev.start) / (ev.end - ev.start));
  const e = easeOutBack(p);
  const m = easeOut(p);
  return {
    x: ev.from.x + (ev.to.x - ev.from.x) * m,
    y: ev.from.y + (ev.to.y - ev.from.y) * m,
    rot: ev.from.rot + (ev.to.rot - ev.from.rot) * m,
    s: ev.from.s + (ev.to.s - ev.from.s) * e,
    landed: p >= 1,
    p,
  };
}

// 완성 뒤 살짝 숨 쉬듯 위아래로 — 살아 있는 느낌
export function idleBob(tl, time) {
  if (time < tl.titleT) return 0;
  return Math.sin((time - tl.titleT) * 2.2) * 8;
}

// 시각 t에서 결 실 하나가 얼마나 뻗었는지(0~1)
export function threadAt(th, time) {
  if (time < th.t) return 0;
  return Math.min(1, (time - th.t) / 0.28);
}

export function subAt(tl, time) {
  return tl.subs.find((s) => time >= s.t0 && time < s.t1) || null;
}
export function tagsAt(tl, time) {
  return tl.tags.filter((s) => time >= s.t0 && time < s.t1);
}

// 빈 자리를 내가 가진 조각으로 채운다 — 자리 맞음 > 모양 맞음 > 아무거나
export function autoAssign(frameId, ownedKeys, prefer = {}) {
  const frame = FRAME_BY_ID[frameId];
  const pool = ownedKeys.map((k) => PIECE_BY_K[k]).filter(Boolean);
  const out = {};
  if (!pool.length) return out;
  if (frame.parts) {
    const pick = prefer.core || pool.find((p) => p.slots[0] === '몸통') || pool[0];
    return { core: pick.k };
  }
  const used = {};
  frame.slots.forEach((sp) => {
    if (prefer[sp.key]) {
      out[sp.key] = prefer[sp.key];
      return;
    }
    // 같은 이름의 두 번째 자리(왼쪽·오른쪽)는 같은 조각을 쓴다
    const twin = frame.slots.find((o) => o !== sp && o.slot === sp.slot && out[o.key]);
    if (twin) {
      out[sp.key] = out[twin.key];
      return;
    }
    const score = (p) => (p.slots[0] === sp.slot ? 3 : p.slots.includes(sp.slot) ? 2 : 0) - (used[p.k] || 0) * 2.5 + shapeFit(p, sp);
    const best = [...pool].sort((a, b) => score(b) - score(a))[0];
    out[sp.key] = best.k;
    used[best.k] = (used[best.k] || 0) + 1;
  });
  return out;
}
function shapeFit(p, sp) {
  const ar = p.ar || 1;
  if (sp.slot === '바퀴' || sp.slot === '방패' || sp.slot === '눈') return 1 - Math.min(1, Math.abs(ar - 1) * 1.5) + (p.fill > 0.68 ? 0.5 : 0);
  if (sp.axis === 'v') return ar < 0.8 ? 0.8 : 0;
  if (sp.axis === 'h') return ar > 1.25 ? 0.8 : 0;
  return 0;
}

export function slotSay(slot) {
  return SLOT_INFO[slot] ? SLOT_INFO[slot].say : '';
}
export { PIECES };
