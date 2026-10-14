// 소리 안내(음성 지원) — 키오스크·앱에서 글을 읽기 어려운 분(어르신, 눈이 불편한 분, 아이, 외국인 관광객)을 위해
// 누르는 곳의 글을 지금 언어로 읽어 준다. 브라우저의 음성 합성(Web Speech API)만 쓰고, 소리는 어디로도 보내지 않는다.
// 켜고 끄기는 이 기기에만 기억한다.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLang } from '../i18n';

const KEY = 'itgyeol_voice_v1';
const LOCALE = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' };
let on = false;
const subs = new Set();

const synth = () => (Platform.OS === 'web' && typeof window !== 'undefined' && window.speechSynthesis) || null;
export const voiceSupported = () => !!synth();
export const isVoiceOn = () => on;

export function onVoiceChange(fn) {
  subs.add(fn);
  return () => subs.delete(fn);
}

// 읽을 글 다듬기: 줄바꿈·연속 공백을 한 칸으로, 화살표는 쉼으로, 너무 길면 앞부분만
export function speakable(text) {
  return String(text || '')
    .replace(/[→·|]/g, ', ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 220);
}

export function speak(text, { force = false } = {}) {
  const s = synth();
  const say = speakable(text);
  if (!s || !say || (!on && !force)) return;
  try {
    s.cancel();
    const u = new window.SpeechSynthesisUtterance(say);
    const loc = LOCALE[getLang()] || 'ko-KR';
    u.lang = loc;
    const v = (s.getVoices() || []).find((x) => x.lang && x.lang.replace('_', '-').toLowerCase().startsWith(loc.slice(0, 2)));
    if (v) u.voice = v;
    u.rate = 0.95;
    s.speak(u);
  } catch (e) {
    // 음성이 없는 기기는 조용히 넘어간다
  }
}

// 누른 곳의 글 읽기: 버튼·글자를 누르면 가장 가까운 덩어리의 글을 읽는다(배리어프리 키오스크의 "누르면 읽어 주기")
function onPointer(e) {
  if (!on) return;
  let el = e.target;
  for (let i = 0; el && i < 6; i += 1) {
    if (el.getAttribute && (el.getAttribute('role') === 'button' || el.getAttribute('aria-label'))) break;
    if (el.innerText && el.innerText.trim().length > 1) break;
    el = el.parentElement;
  }
  if (!el) return;
  const text = (el.getAttribute && el.getAttribute('aria-label')) || el.innerText;
  if (text) speak(text);
}

let listening = false;
function listen(flag) {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (flag && !listening) document.addEventListener('pointerdown', onPointer, true);
  if (!flag && listening) document.removeEventListener('pointerdown', onPointer, true);
  listening = flag;
}

export function setVoice(flag) {
  on = !!flag;
  listen(on);
  if (!on && synth()) synth().cancel();
  AsyncStorage.setItem(KEY, on ? '1' : '0').catch(() => {});
  subs.forEach((fn) => fn(on));
}

export async function loadVoice() {
  if (!voiceSupported()) return;
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === '1') setVoice(true);
  } catch (e) {
    // 기억이 없으면 꺼진 채로 시작
  }
}
