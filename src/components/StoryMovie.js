// 이야기 영상 — 예전 그림책(한 쪽씩 넘기기)을 저절로 재생되는 영상으로 바꾼 것.
// 배경이 천천히 움직이고(카메라), 풍이·결이가 말할 때 튀어나오고, 판과 이어진 실제 유물이 떠다니고, 자막이 흐른다.
// 고르는 장면에서는 영상이 잠깐 멈추고 선택지가 뜬다(가만히 있으면 그것도 대답으로 받아 이어진다) — 선택형 영상.
import { say, hush, speaking, useNarrate, setNarrate, canNarrate } from '../utils/narrate';
import { useBigSubs, setBigSubs } from '../utils/subSize';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Image, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import Text from '../ui/Text';
import { ART } from '../ui/StoryScene';
import { PIECES } from '../data/pieces';
import { play } from '../utils/sound';
import { t } from '../i18n';

export const CHAR = {
  pung: require('../../assets/characters/pung_cut.png'),
  gyeol: require('../../assets/characters/gyeol_cut.png'),
};
export const CHAR_AR = { pung: 313 / 367, gyeol: 339 / 267 }; // 너비/높이 (배경을 지운 그림)
const NAME = { pung: '풍이', gyeol: '결이' };
const COLOR = { pung: '#e0a43a', gyeol: '#6fb0d8' };

// 판마다 떠다닐 실제 유물 — 이름으로 고른다
const PART_PIECES = {
  prologue: /수막새|토우|연적|기린|용|봉황|거북/,
  jinbeop: /칼|검|창|화살|투구|갑|방패|깃발|총통|기마/,
  print: /연적|벼루|먹|붓|인장|인$|필통/,
  play: /팽이|구슬|공기|윷|투호|방울|토우|말/,
  hangul: /인장|연적|필통|인$/,
  talchum: /귀면|도깨비|얼굴|짐승얼굴|탈/,
  dancheong: /막새|치미|기와|용머리|단청/,
};
export function piecesFor(part, n, seed) {
  const re = PART_PIECES[part] || PART_PIECES.prologue;
  let list = PIECES.filter((p) => re.test(p.name));
  if (list.length < n) list = list.concat(PIECES.slice(0, n * 3));
  const out = [];
  let x = seed || 7;
  while (out.length < Math.min(n, list.length)) {
    x = (x * 1103515245 + 12345) % 2147483647;
    const p = list[x % list.length];
    if (!out.includes(p)) out.push(p);
  }
  return out;
}
// 자동 테스트(브라우저 테스트)에서는 영상을 빨리 감아 본다 — 사람이 볼 때는 영향 없음
const FAST = typeof navigator !== 'undefined' && !!navigator.webdriver;
const lineDur = (text) => (FAST ? 2.6 : Math.max(2.6, Math.min(6.8, 1.6 + String(text).length * 0.075)));

export default function StoryMovie({ part, pages, resolve, onPick, onFinish, choiceOf }) {
  const { width, height } = useWindowDimensions();
  const W = Math.min(width - 16, 720);
  const H = Math.min(Math.round(W * 1.05), Math.max(380, height - 170));
  const [pi, setPi] = useState(0);
  const [stage, setStage] = useState({ kind: 'lines', i: 0 }); // lines | wait | react | done
  const [picked, setPicked] = useState(null);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(0); // 이 쪽이 시작된 뒤 흐른 시간(초)
  const [lineStart, setLineStart] = useState(0);
  const base = useRef(Date.now());
  const pauseAt = useRef(null);
  const page = pages[pi];
  const lines = useMemo(() => resolve(page.lines), [page, resolve]);
  const input = page.input;
  const reactLines = useMemo(() => (input && picked ? resolve(input.react[picked] || []) : []), [input, picked, resolve]);
  const floaters = useMemo(() => piecesFor(part, 4, pi * 31 + part.length * 7), [part, pi]);

  // 시계
  useEffect(() => {
    let raf;
    let last = 0;
    const tick = () => {
      // 초당 30번이면 충분히 부드럽고, 느린 기기·자동 테스트에서도 버벅이지 않는다
      const ms = Date.now();
      if (!pauseAt.current && ms - last >= 33) {
        last = ms;
        setNow((ms - base.current) / 1000);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    if (paused) pauseAt.current = Date.now();
    else if (pauseAt.current) {
      base.current += Date.now() - pauseAt.current;
      pauseAt.current = null;
    }
  }, [paused]);
  // 새 쪽
  useEffect(() => {
    base.current = Date.now();
    setNow(0);
    setLineStart(0);
    setStage({ kind: 'lines', i: 0 });
    setPicked(null);
    play(pi === 0 ? 'daegeum' : 'fly');
  }, [pi]);

  const cur = stage.kind === 'lines' ? lines[stage.i] : stage.kind === 'react' ? reactLines[stage.i] : null;
  const curText = cur ? cur.text : '';
  const elapsed = now - lineStart;

  const next = (manual) => {
    // 글자가 아직 다 나오지 않았으면, 누르면 먼저 끝까지 보여 준다
    if (manual === true && cur && Math.floor(elapsed * (FAST ? 400 : 26)) < curText.length) {
      setLineStart(now - curText.length / 26 - 0.01);
      return;
    }
    if (stage.kind === 'lines') {
      if (stage.i + 1 < lines.length) {
        setStage({ kind: 'lines', i: stage.i + 1 });
        setLineStart(now);
        play('tap');
      } else if (input) {
        setStage({ kind: 'wait', i: 0 });
        setLineStart(now);
      } else nextPage();
    } else if (stage.kind === 'react') {
      if (stage.i + 1 < reactLines.length) {
        setStage({ kind: 'react', i: stage.i + 1 });
        setLineStart(now);
        play('tap');
      } else nextPage();
    }
  };
  const nextPage = () => {
    if (pi + 1 < pages.length) setPi(pi + 1);
    else {
      play('shine');
      setStage({ kind: 'done', i: 0 });
      setTimeout(onFinish, 700);
    }
  };
  // 「다음 장면 ›」 — 한 줄이 아니라 이 장면을 건너뛴다(고를 것이 있으면 고르는 자리로)
  const skipScene = () => {
    if (stage.kind === 'lines' && input) {
      setStage({ kind: 'wait', i: 0 });
      setLineStart(now);
    } else if (stage.kind === 'lines' || stage.kind === 'react') nextPage();
  };
  const pick = (id) => {
    if (stage.kind !== 'wait') return;
    play('clank');
    setPicked(id);
    onPick(input.key, id);
    setStage({ kind: 'react', i: 0 });
    setLineStart(now);
  };
  // 소리 내어 읽어 주기 — 줄이 바뀔 때 읽고, 다 읽을 때까지 다음 줄로 넘어가지 않는다
  const narr = useNarrate();
  const bigSubs = useBigSubs();
  useEffect(() => {
    if (narr && cur && !paused) say(curText, cur.who);
  }, [pi, stage.kind, stage.i, narr]);
  useEffect(() => {
    if (paused) hush();
  }, [paused]);
  useEffect(() => () => hush(), []);
  // 저절로 넘어가기
  useEffect(() => {
    if (paused) return;
    if ((stage.kind === 'lines' || stage.kind === 'react') && cur && elapsed > lineDur(curText) && !speaking()) next();
    if (stage.kind === 'wait' && input && elapsed > (FAST ? 1.2 : (input.waitMs || 5000) / 1000 + 0.6)) pick(input.silent);
  }, [now]);

  // ── 그림
  const pageDur = 14;
  const prog = Math.min(1, now / pageDur);
  const artW = H * (836 / 470) * 1.12;
  const panX = -(artW - W) * (pi % 2 ? 1 - prog : prog);
  const zoom = 1.04 + 0.08 * prog;
  const speaker = cur ? cur.who : null;
  const typed = cur ? curText.slice(0, Math.floor(elapsed * (FAST ? 400 : 26))) : '';
  const placeAlpha = now < 0.2 ? now / 0.2 : now < 2.6 ? 1 : Math.max(0, 1 - (now - 2.6) / 0.6);
  const waitLeft = stage.kind === 'wait' && input ? Math.max(0, (input.waitMs || 5000) / 1000 + 0.6 - elapsed) : 0;

  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable onPress={() => (stage.kind === 'wait' ? (input.options.length === 1 ? pick(input.options[0].id) : null) : next(true))} style={[st.stage, { width: W, height: H }]}>
        <Image source={ART[page.art] || ART.gate} style={{ position: 'absolute', left: panX, top: -H * 0.04, width: artW, height: H * 1.08, transform: [{ scale: zoom }] }} resizeMode="cover" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0b1016', opacity: 0.25 }]} />
        {/* 떠다니는 빛 */}
        {Array.from({ length: 14 }, (_, i) => (
          <View key={'p' + i} style={[st.mote, { left: (((i * 97) % 100) / 100) * W, top: ((((i * 53) % 100) / 100) * H + now * (14 + (i % 4) * 6)) % H, opacity: 0.25 + 0.5 * Math.abs(Math.sin(now * 1.3 + i)) }]} />
        ))}
        {/* 판과 이어진 실제 유물이 둥둥 */}
        {floaters.map((p, i) => {
          const enter = Math.min(1, Math.max(0, (now - 0.4 - i * 0.35) / 0.8));
          const sz = W * (0.17 + (i % 2) * 0.04);
          const x = [0.1, 0.72, 0.36, 0.84][i] * W;
          const y = [0.1, 0.16, 0.05, 0.42][i] * H + Math.sin(now * 1.2 + i * 1.7) * 10 + (1 - enter) * -120;
          return (
            <View key={p.k} style={{ position: 'absolute', left: x - sz / 2, top: y, width: sz, height: sz, opacity: enter * 0.95, transform: [{ rotate: `${Math.sin(now * 0.7 + i) * 8}deg` }] }}>
              <View style={[st.halo, { width: sz, height: sz, borderRadius: sz / 2 }]} />
              <Image source={p.img} style={{ width: sz, height: sz }} resizeMode="contain" />
            </View>
          );
        })}
        {/* 장소 자막 */}
        <View style={[st.place, { opacity: placeAlpha }]}>
          <Text style={st.placeTxt} brush>
            {t(page.place)}
          </Text>
        </View>
        {/* 풍이·결이 */}
        {['pung', 'gyeol'].map((who, i) => {
          const on = speaker === who;
          const enter = Math.min(1, now / 0.6);
          const hop = on ? Math.abs(Math.sin(elapsed * 9)) * (typed.length < curText.length ? 8 : 0) : 0;
          const cw = W * (who === 'gyeol' ? 0.34 : 0.28);
          return (
            <Image
              key={who}
              source={CHAR[who]}
              style={{
                position: 'absolute',
                bottom: H * 0.21 + hop,
                left: i === 0 ? W * 0.03 - (1 - enter) * cw : undefined,
                right: i === 1 ? W * 0.03 - (1 - enter) * cw : undefined,
                width: cw,
                height: cw / CHAR_AR[who],
                opacity: on || !speaker ? 1 : 0.62,
                transform: [{ scale: on ? 1.08 : 0.95 }, { translateY: Math.sin(now * 2 + i * 2) * 4 }],
              }}
              resizeMode="contain"
            />
          );
        })}
        {/* 자막 */}
        {cur ? (
          <View style={st.sub}>
            <Text style={[st.who, { color: COLOR[speaker] || '#fff' }]}>{t(NAME[speaker] || '')}</Text>
            <Text style={[st.subTxt, { fontSize: Math.max(14, W * 0.036) * (bigSubs ? 1.45 : 1), lineHeight: Math.max(14, W * 0.036) * (bigSubs ? 1.45 : 1) * 1.45 }]}>{typed}</Text>
          </View>
        ) : null}
        {/* 선택 — 영상이 잠깐 멈춘다 */}
        {stage.kind === 'wait' && input ? (
          <View style={st.choiceBox}>
            <View style={st.choiceRow}>
              {input.options.map((o) => (
                <Pressable key={o.id} onPress={() => pick(o.id)} style={st.choice}>
                  <Text style={st.choiceTxt}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={st.wait}>{t('…가만히 있어도 돼')} {Math.ceil(waitLeft)}</Text>
          </View>
        ) : null}
        {stage.kind === 'done' ? <View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff8e8', opacity: 0.6 }]} /> : null}
        {/* 진행 막대 */}
        <View style={st.barWrap}>
          {pages.map((_, i) => (
            <View key={i} style={st.barCell}>
              <View style={[st.barFill, { width: i < pi ? '100%' : i === pi ? `${Math.round(prog * 100)}%` : '0%' }]} />
            </View>
          ))}
        </View>
      </Pressable>
      <View style={st.ctrl}>
        <Pressable onPress={() => setPaused(!paused)} style={st.btn} accessibilityLabel={paused ? t('재생') : t('일시정지')}>
          <Text style={st.btnTxt}>{paused ? t('▶ 재생') : t('❚❚ 일시정지')}</Text>
        </Pressable>
        <Pressable onPress={() => setBigSubs(!bigSubs)} style={st.btn} accessibilityLabel={t('큰 자막')}>
          <Text style={st.btnTxt}>{bigSubs ? t('큰 자막 켬') : t('큰 자막 끔')}</Text>
        </Pressable>
        {canNarrate() ? (
          <Pressable onPress={() => setNarrate(!narr)} style={st.btn} accessibilityLabel={t('소리 내어 읽어 주기')}>
            <Text style={st.btnTxt}>{narr ? t('읽어 주기 켬') : t('읽어 주기 끔')}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => stage.kind !== 'wait' && skipScene()} style={st.btn}>
          <Text style={st.btnTxt}>{t('다음 장면 ›')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  stage: { overflow: 'hidden', borderRadius: 18, backgroundColor: '#0b1016' },
  mote: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: '#fff3c8' },
  halo: { position: 'absolute', backgroundColor: '#ffe7a8', opacity: 0.22 },
  place: { position: 'absolute', top: 22, left: 16, backgroundColor: '#000000a0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  placeTxt: { color: '#f6e7c4', fontSize: 16 },
  sub: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: '#000000c4', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, minHeight: 74 },
  who: { fontSize: 13, fontWeight: '700', marginBottom: 3 },
  subTxt: { color: '#fff', lineHeight: 23 },
  choiceBox: { position: 'absolute', left: 0, right: 0, top: '34%', alignItems: 'center', gap: 8 },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, paddingHorizontal: 12 },
  choice: { backgroundColor: '#fff8ec', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 11, borderWidth: 2, borderColor: '#e0a43a' },
  choiceTxt: { color: '#1b2227', fontSize: 16, fontWeight: '700' },
  wait: { color: '#fff', fontSize: 12, backgroundColor: '#00000080', paddingHorizontal: 8, borderRadius: 8, overflow: 'hidden' },
  barWrap: { position: 'absolute', top: 8, left: 10, right: 10, flexDirection: 'row', gap: 4 },
  barCell: { flex: 1, height: 3, backgroundColor: '#ffffff40', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, backgroundColor: '#fff' },
  ctrl: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 10 },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#c4cdca', backgroundColor: '#fcfdfc' },
  btnTxt: { fontSize: 13, color: '#1b2227' },
});
