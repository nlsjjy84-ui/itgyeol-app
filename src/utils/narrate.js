// 소리 내어 읽어 주기 — 아직 글을 못 읽는 아이를 위해 자막을 브라우저 음성(Web Speech)으로 읽어 준다.
// 근거: 앱 속 읽어 주기(inbuilt narration)는 글 못 읽는 아이의 이야기 이해와 새 낱말 배우기를 돕는다
// (Booton 외, 2021, Computer Assisted Language Learning — 체계적 문헌 고찰).
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getLang } from '../i18n';

const KEY = 'itgyeol_narrate';
const LANG = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' };
const ok = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.speechSynthesis && !(typeof navigator !== 'undefined' && navigator.webdriver);
let on = false;
try {
  on = typeof localStorage !== 'undefined' && localStorage.getItem(KEY) === '1';
} catch (e) {
  on = false;
}
const subs = new Set();

export const canNarrate = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.speechSynthesis;
export const narrateOn = () => on;
export function setNarrate(v) {
  on = !!v;
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch (e) {}
  if (!on) hush();
  subs.forEach((fn) => fn(on));
}
export function useNarrate() {
  const [v, setV] = useState(on);
  useEffect(() => {
    subs.add(setV);
    return () => subs.delete(setV);
  }, []);
  return v;
}
// 말풍선 속 이모지·괄호·꺾쇠는 읽지 않는다
const clean = (s) => String(s || '').replace(/[「」『』《》<>\[\]()…]/g, ' ').replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, '').trim();
export function say(text, who) {
  if (!on || !ok() || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new window.SpeechSynthesisUtterance(clean(text));
  u.lang = LANG[getLang()] || 'ko-KR';
  // 풍이는 조금 높고 빠르게, 결이는 차분하게
  u.pitch = who === '풍이' ? 1.25 : who === '결이' ? 0.95 : 1.05;
  u.rate = who === '풍이' ? 1.05 : 0.98;
  const v = synth.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(u.lang.slice(0, 2)));
  if (v) u.voice = v;
  synth.speak(u);
}
export const speaking = () => ok() && on && window.speechSynthesis.speaking;
export function hush() {
  if (canNarrate()) window.speechSynthesis.cancel();
}
