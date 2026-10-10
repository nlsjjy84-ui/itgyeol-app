import { t as tr, getLang } from '../i18n';
// 작품 해설 — 사실은 언제나 "고정 자료"(카탈로그의 물건 설명 + 놀이 기록에서 나온 형태 자국)에서만 가져온다.
// AI는 선택 사항이고, 이미 만들어진 해설 문장을 "다듬기"만 한다. 새 사실·숫자·이름을 보태지 못하게 앞뒤에서 막는다.
//  - 보내는 것: 고정 자료 문장들과 기본 해설 한 단락. 개인 정보·기기 정보·이름은 보내지 않는다.
//  - 주소(EXPO_PUBLIC_POLISH_URL)가 없거나 응답이 이상하면 기본 해설을 그대로 쓴다. (앱은 AI 없이도 완전하게 동작)

const POLISH_URL = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_POLISH_URL) || '';

export function polishEnabled() {
  return !!POLISH_URL;
}

// 고정 자료 문장 목록
export function buildFacts({ item, variant, dna }) {
  const facts = [];
  if (item && item.about) facts.push(item.about);
  if (variant && variant.note) facts.push(variant.note);
  if (dna && dna.k && Array.isArray(dna.traits)) dna.traits.slice(0, 3).forEach((x) => facts.push(tr('이 작품은 {trait}', { trait: x })));
  return facts;
}

// 기본 해설: 규칙으로 이어 붙인 문장(AI 없이도 이 문장이 그대로 보인다)
export function baseCommentary({ item, variant, dna }) {
  const parts = [];
  const name = variant && variant.label && item && variant.label !== item.label ? `${item.label}(${variant.label})` : (item && item.label) || tr('이 물건');
  if (item && item.about) parts.push(`${name} — ${item.about}`);
  if (variant && variant.note) parts.push(variant.note);
  if (dna && dna.k && Array.isArray(dna.traits) && dna.traits.length) {
    parts.push(tr('이 작품의 모양은 놀이 기록에서 나왔어요: {traits}.', { traits: dna.traits.slice(0, 3).join(', ') }));
  }
  return parts.map((t) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`)).join(' ');
}

function digitsOf(s) {
  return (String(s).match(/\d+/g) || []).sort().join(',');
}

// 다듬은 문장이 고정 자료를 벗어나지 않았는지 검사: 길이, 숫자, 라틴 글자·주소 금지
export function acceptPolished(text, facts, base) {
  if (typeof text !== 'string') return false;
  const t = text.trim();
  if (t.length < 20 || t.length > Math.max(260, base.length * 1.6)) return false;
  if (/[A-Za-z]{2,}|https?:|www\./.test(t)) return false;
  const allowed = new Set((digitsOf(facts.join(' ') + ' ' + base).split(',')).filter(Boolean));
  const used = (String(t).match(/\d+/g) || []);
  if (used.some((d) => !allowed.has(d))) return false;
  return true;
}

const cache = new Map();

export async function polishCommentary({ facts, base }) {
  // 문장 다듬기는 한국어 해설에만 쓴다(다른 언어는 번역해 둔 고정 문장을 그대로 보여 준다).
  if (!POLISH_URL || !base || getLang() !== 'ko') return { text: base, polished: false };
  const key = base;
  if (cache.has(key)) return cache.get(key);
  let out = { text: base, polished: false };
  try {
    const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctl && ctl.abort(), 7000);
    const res = await fetch(POLISH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facts, base }),
      signal: ctl ? ctl.signal : undefined,
    });
    clearTimeout(timer);
    if (res.ok) {
      const j = await res.json();
      if (acceptPolished(j && j.text, facts, base)) out = { text: j.text.trim(), polished: true };
    }
  } catch (e) {
    // 네트워크 실패 — 기본 해설 유지
  }
  cache.set(key, out);
  return out;
}
