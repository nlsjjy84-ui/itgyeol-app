import { t } from '../i18n';
import { shapeFacts } from '../components/obj3d/models_mine';
import { GAME_NAMES } from '../data/taste';
import { motifName } from '../data/motifs';

const M = (id) => t(motifName(id));

// 놀이가 모양을 빚는 물건(나만의 패·항아리·배지·수막새·도장·문진·코스터·책갈피)에서 "무엇이 어디가 됐는지"를 한 줄씩 — 3D와 같은 계산(shapeFacts)을 쓴다.
const STAGE_NO = { st1: 1, st2: 2, st3: 3, st4: 4 };
// 몸짓·표정·감탄사가 바꾼 곳(동의하고 기록이 있을 때만)
const WAVE = ['mypae', 'mybadge', 'mycoaster', 'mybookmark', 'mystamp'];
const BEADS = ['mysumak', 'mycoaster'];
export function describeShape(itemId, attempts, log) {
  const out = baseShape(itemId, attempts, log);
  const fx = shapeFacts(attempts, log).sense;
  const s = fx && fx.s;
  if (!s) return out;
  if (s.camera && WAVE.includes(itemId) && fx.wave > 1.01) {
    out.push(t('몸짓 {n}번 · 흥 {p}% → 테두리 물결이 더 깊게', { n: s.big, p: Math.round(s.level * 100) }));
  }
  if (BEADS.includes(itemId) && fx.extra > 0) out.push(t('웃음 {a}번 · 감탄 {b}번 → 둘레 구슬 {n}개 더', { a: s.smile, b: s.wow, n: fx.extra }));
  return out;
}

function baseShape(itemId, attempts, log) {
  const f = shapeFacts(attempts, log);
  if (itemId === 'mysumak') {
    const out = [];
    if (f.formation) out.push(t('{name} → 연꽃잎 {n}장', { name: t(f.formation), n: f.lotus }));
    if (f.word) out.push(t('맞춘 글자 「{w}」 → 연밥 자리에 도드라진 낙관', { w: f.word }));
    else out.push(t('놀이 횟수 → 연밥 씨앗 {n}개', { n: f.seeds }));
    out.push(t('놀이 {g}가지 · 블록 {k}칸 → 둘레 구슬 {b}개', { g: f.games.length, k: f.blocks, b: f.beads - f.sense.extra }));
    return out;
  }
  if (itemId === 'mystamp') {
    const out = [];
    if (f.word) out.push(t('맞춘 글자 「{w}」 → 도장면에 거꾸로 새긴 글자(찍으면 바로 읽혀요)', { w: f.word }));
    else if (f.glyph) out.push(t('한글 테트리스 → 도장면에 새긴 자모 「{g}」', { g: f.glyph }));
    else if (f.games.length) out.push(t('{name} {n}번 → 도장면 {m}', { name: t(GAME_NAMES[f.games[0][0]] || f.games[0][0]), n: f.games[0][1], m: M(f.games[0][0]) }));
    if (f.stage) out.push(t('한글 테트리스 {s}단계 → 손잡이 블록 {k}칸', { s: STAGE_NO[f.stage] || 1, k: f.blocks }));
    else if (f.formation) out.push(t('{name} → 꽃잎 {n}장 진 둥근 손잡이', { name: t(f.formation), n: f.petals }));
    return out;
  }
  if (itemId === 'mystele') {
    const out = [t('마친 판 {n}개 → 받침돌 {n}층', { n: Math.max(1, Math.min(4, (attempts || []).length)) })];
    if (f.word) out.push(t('맞춘 글자 「{w}」 → 앞면에 도드라진 낙관', { w: f.word }));
    f.games.slice(0, 3).forEach(([id, n]) => out.push(t('{name} {n}번 → 앞면 아래 {m} 부조', { name: t(GAME_NAMES[id] || id), n, m: M(id) })));
    if (f.stage) out.push(t('한글 테트리스 {s}단계 → 머릿돌 위 블록 {k}칸', { s: STAGE_NO[f.stage] || 1, k: f.blocks }));
    return out;
  }
  if (itemId === 'mycoaster') {
    const out = [];
    if (f.formation) out.push(t('{name} → 꽃잎 테두리 {n}장', { name: t(f.formation), n: Math.min(12, Math.max(6, f.petals)) }));
    out.push(t('놀이 {g}가지 · 블록 {k}칸 → 테 위 구슬 {b}개', { g: f.games.length, k: f.blocks, b: 12 + f.games.length * 2 + f.blocks * 2 }));
    if (f.word) out.push(t('맞춘 글자 「{w}」 → 테에 도드라진 낙관', { w: f.word }));
    return out;
  }
  if (itemId === 'mybookmark') {
    const out = [];
    if (f.formation) out.push(t('{name} → 물결 머리와 진 모양 구멍', { name: t(f.formation) }));
    if (f.games.length) out.push(t('놀이 {g}가지 → 아래쪽 가로 마디 {g}줄', { g: Math.min(6, f.games.length) }));
    return out;
  }
  if (itemId === 'mybadge') {
    const out = [];
    if (f.formation) out.push(t('{name} → 꽃잎 테두리 {n}장 · 둘레 볼록 점 {h}개', { name: t(f.formation), n: f.petals, h: f.holes }));
    if (f.word) out.push(t('맞춘 글자 「{w}」 → 앞면에 도드라진 낙관', { w: f.word }));
    else if (f.games.length) out.push(t('{name} {n}번 → 가운데 {m} 부조', { name: t(GAME_NAMES[f.games[0][0]] || f.games[0][0]), n: f.games[0][1], m: M(f.games[0][0]) }));
    if (f.glyph) out.push(t('한글 테트리스 → 아래쪽에 도드라진 자모 「{g}」', { g: f.glyph }));
    return out;
  }
  const jar = itemId === 'myjar';
  const out = [];
  if (f.formation) {
    out.push(jar
      ? t('{name} → 참외처럼 골이 {n}줄', { name: t(f.formation), n: f.petals })
      : t('{name} → 꽃잎 테두리 {n}장 · 뚫린 구멍 {h}개', { name: t(f.formation), n: f.petals, h: f.holes }));
  }
  if (f.word) out.push(jar ? t('맞춘 글자 「{w}」 → 어깨에 도드라진 낙관', { w: f.word }) : t('맞춘 글자 「{w}」 → 앞면에 도드라진 낙관', { w: f.word }));
  f.games.forEach(([id, n]) => {
    out.push(jar ? t('{name} {n}번 → 어깨 둘레 {m} 부조', { name: t(GAME_NAMES[id] || id), n, m: M(id) }) : t('{name} {n}번 → 뒷면 {m} 부조', { name: t(GAME_NAMES[id] || id), n, m: M(id) }));
  });
  if (f.stage) out.push(jar
    ? t('한글 테트리스 {s}단계 → 뚜껑 손잡이 블록 {k}칸', { s: STAGE_NO[f.stage] || 1, k: f.blocks })
    : t('한글 테트리스 {s}단계 → 꼭지 블록 {k}칸', { s: STAGE_NO[f.stage] || 1, k: f.blocks }));
  return out;
}
