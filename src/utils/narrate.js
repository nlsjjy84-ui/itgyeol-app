// 소리 내어 읽어 주기 — 아직 글을 못 읽는 아이를 위해 자막을 브라우저 음성(Web Speech)으로 읽어 준다.
// 근거: 앱 속 읽어 주기(inbuilt narration)는 글 못 읽는 아이의 이야기 이해와 새 낱말 배우기를 돕는다
// (Booton 외, 2021, Computer Assisted Language Learning — 체계적 문헌 고찰).
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getLang } from '../i18n';
import { VOICE } from '../data/voiceMap';

let createAudioPlayer = null;
try {
  // eslint-disable-next-line global-require
  createAudioPlayer = require('expo-audio').createAudioPlayer;
} catch (e) {
  createAudioPlayer = null;
}

const KEY = 'itgyeol_narrate';
const LANG = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' };
const ok = () => Platform.OS === 'web' && typeof window !== 'undefined' && !!window.speechSynthesis && !(typeof navigator !== 'undefined' && navigator.webdriver);
// 2026-11-23: 풍이·결이 목소리를 미리 만들어 넣어서 처음부터 켜 둔다(끄면 그 선택을 기억한다)
let on = true;
try {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  on = saved === null ? true : saved === '1';
} catch (e) {
  on = true;
}
const subs = new Set();

export const canNarrate = () => !!createAudioPlayer || (Platform.OS === 'web' && typeof window !== 'undefined' && !!window.speechSynthesis);
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
// 미리 만든 목소리 파일 열쇠 — tools/voice/gen.py 와 같은 계산(djb2 변형)이어야 한다
export function voiceKey(lang, who, text) {
  let x = 5381;
  for (const ch of `${lang}|${who}|${text}`) x = ((x * 33) ^ ch.codePointAt(0)) >>> 0;
  return x.toString(16);
}
// 풍이·결이 목소리: 무료 음성 합성(Supertonic, 풍이 F4·결이 F5)으로 미리 만들어 둔 파일을 먼저 쓰고,
// 파일이 없는 말(그때그때 바뀌는 말, 중국어)만 브라우저 음성으로 읽는다.
let vPlayer = null;
let vPlaying = false;
function stopVoice() {
  vPlaying = false;
  if (vPlayer) {
    try {
      vPlayer.pause();
    } catch (e) {}
  }
}
export function say(text, who) {
  if (!on || !text) return;
  const c = clean(text);
  const src = VOICE[voiceKey(getLang(), who, c)];
  const isWeb = typeof window !== 'undefined' && typeof window.Audio === 'function';
  if (src && (isWeb || createAudioPlayer) && !(typeof navigator !== 'undefined' && navigator.webdriver)) {
    try {
      if (ok()) window.speechSynthesis.cancel();
      stopVoice();
      vPlaying = true;
      if (isWeb) {
        // 웹: 브라우저 오디오를 직접 — 멈춰도 오류가 남지 않게 play()의 약속을 받아 둔다
        const url = typeof src === 'string' ? src : src && (src.uri || src.default);
        if (!vPlayer || !vPlayer.isWebAudio) {
          vPlayer = new window.Audio();
          vPlayer.isWebAudio = true;
          vPlayer.addEventListener('ended', () => { vPlaying = false; });
          vPlayer.addEventListener('error', () => { vPlaying = false; });
        }
        vPlayer.src = url;
        const r = vPlayer.play();
        if (r && typeof r.catch === 'function') r.catch(() => { vPlaying = false; });
      } else {
        if (!vPlayer) {
          vPlayer = createAudioPlayer(src);
          vPlayer.addListener('playbackStatusUpdate', (st) => {
            if (st && st.didJustFinish) vPlaying = false;
          });
        } else vPlayer.replace(src);
        const r = vPlayer.play();
        if (r && typeof r.catch === 'function') r.catch(() => { vPlaying = false; });
      }
      // 끝 알림이 오지 않는 환경에서도 이야기가 멈추지 않게 — 넉넉히 기다린 뒤 풀어 준다
      const guard = 1500 + c.length * 180;
      setTimeout(() => { vPlaying = false; }, guard);
      return;
    } catch (e) {
      vPlaying = false;
    }
  }
  if (!ok()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new window.SpeechSynthesisUtterance(c);
  u.lang = LANG[getLang()] || 'ko-KR';
  // 풍이는 조금 높고 빠르게, 결이는 차분하게 (who 값은 'pung' · 'gyeol')
  const pung = who === 'pung' || who === '풍이';
  const gyeol = who === 'gyeol' || who === '결이';
  u.pitch = pung ? 1.25 : gyeol ? 0.95 : 1.05;
  u.rate = pung ? 1.05 : 0.98;
  const v = synth.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith(u.lang.slice(0, 2)));
  if (v) u.voice = v;
  synth.speak(u);
}
export const speaking = () => on && (vPlaying || (ok() && window.speechSynthesis.speaking));
export function hush() {
  stopVoice();
  if (canNarrate()) window.speechSynthesis.cancel();
}
