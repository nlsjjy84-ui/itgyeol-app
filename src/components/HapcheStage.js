// 합체 무대 — 대본(hapche.js)을 시간에 따라 그린다. 조각이 날아와 철컥 끼워지고, 머리가 마지막에 나오고,
// 번쩍 빛난 뒤 작품 이름이 뜬다. 아래에는 풍이·결이 자막, 조각마다 이름표가 붙는다.
import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import Text from '../ui/Text';
import { say, hush, useNarrate } from '../utils/narrate';
import { poseAt, subAt, tagsAt, idleBob, threadAt, camAt, villainAt } from '../utils/hapche';
import { PIECE_BY_K } from '../data/pieces';
import { play, stop } from '../utils/sound';
import { t } from '../i18n';

// 재료마다 끼워질 때 나는 소리
export const CLANK_OF = { 쇠: 'clankMetal', 금: 'clankMetal', 흙: 'clankClay', 돌: 'clankStone', 옥: 'clankStone', 뼈: 'clankStone', 나무: 'clankWood', 종이: 'clankWood', 천: 'clankWood' };
const WHO_COLOR = { 풍이: '#e0a43a', 결이: '#6fb0d8', 함께: '#f0e6d0' };

export default function HapcheStage({ tl, size = 340, autoPlay = true, onEnd, loop = false, sound = true, showSubs = true, onTime, overlay, playKey }) {
  const [time, setTime] = useState(autoPlay ? 0 : tl.dur);
  const [playing, setPlaying] = useState(autoPlay);
  const [spin, setSpin] = useState(null); // 돌려 보기 시작 시각(ms) — 완성된 작품을 입체처럼 빙글 돌린다
  const [, force] = useState(0);
  const start = useRef(0);
  const fired = useRef(new Set());
  useEffect(() => {
    fired.current = new Set();
    setTime(autoPlay ? 0 : tl.dur);
    setPlaying(autoPlay);
  }, [tl, playKey]);
  useEffect(() => {
    if (onTime) onTime(time);
  }, [time]);
  useEffect(() => {
    if (!playing) return undefined;
    let raf;
    let lastMs = 0;
    start.current = Date.now() - time * 1000;
    const tick = () => {
      const ms = Date.now();
      if (ms - lastMs < 33) {
        raf = requestAnimationFrame(tick);
        return;
      }
      lastMs = ms;
      const now = (ms - start.current) / 1000;
      if (now >= tl.dur + (loop ? 1.2 : 0)) {
        if (loop) {
          fired.current = new Set();
          start.current = Date.now();
          setTime(0);
          raf = requestAnimationFrame(tick);
          return;
        }
        setTime(tl.dur);
        setPlaying(false);
        if (onEnd) onEnd();
        return;
      }
      setTime(now);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, tl]);
  // 소리 — 날아올 때 휙, 끼워질 때 철컥, 잠길 때 쿵, 완성 팡파르
  useEffect(() => {
    if (!sound || !playing) return;
    const once = (id, name) => {
      if (fired.current.has(id)) return;
      fired.current.add(id);
      play(name);
    };
    if (time > 0.05) once('bgm', 'bgm');
    if (time > 15.9) once('bgm2', 'bgm');
    if (time > 0.15) once('open', tl.isTransform ? 'transform' : 'daegeum');
    tl.events.forEach((e, i) => {
      if (time >= e.start && i % 2 === 0) once('f' + e.start, 'fly');
      if (time >= e.end) once('c' + e.end, CLANK_OF[(PIECE_BY_K[e.k] || {}).power] || 'clank');
    });
    if (time >= tl.lockT) once('lock', 'lock');
    if (time >= tl.titleT) once('shine', 'shine');
  }, [time]);

  useEffect(() => () => stop('bgm'), []);
  useEffect(() => {
    if (!spin) return undefined;
    let raf;
    let last = 0;
    const tick = () => {
      const ms = Date.now();
      if (ms - last >= 33) {
        last = ms;
        force((x) => x + 1);
      }
      if (ms - spin > 7000) {
        setSpin(null);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spin]);
  useEffect(() => {
    if (!playing) stop('bgm');
  }, [playing]);
  const k = size / 1000;
  const bob = idleBob(tl, time);
  const flash = time >= tl.lockT && time < tl.lockT + 0.6 ? 1 - (time - tl.lockT) / 0.6 : 0;
  const shake = time >= tl.lockT && time < tl.lockT + 0.35 ? Math.sin(time * 90) * 6 : 0;
  const sub = showSubs ? subAt(tl, time) : null;
  const narr = useNarrate();
  const subKey = sub ? sub.t0 : -1;
  useEffect(() => {
    if (narr && sound && playing && sub) say(sub.text, sub.who);
  }, [subKey, narr]);
  useEffect(() => () => hush(), []);
  const tags = showSubs ? tagsAt(tl, time).slice(-2) : [];
  const done = time >= tl.titleT;
  const sorted = [...tl.events].sort((a, b) => a.z - b.z);
  // 돌려 보기 — 조각마다 앞뒤 깊이(z)를 주고, 세로축으로 돌리면 가까운 조각이 더 크게 움직여 입체처럼 보인다
  const theta = spin ? ((Date.now() - spin) / 1000) * 0.9 : 0;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const proj = (x, z) => (spin ? 500 + (x - 500) * cosT + (z - 2) * 70 * sinT : x);

  return (
    <View style={[st.stage, { width: size, height: size, backgroundColor: tl.frame.bg || '#1b2530' }]}>
      {/* 배경: 결(물결) 줄과 빛 */}
      {Array.from({ length: 9 }, (_, i) => (
        <View key={'l' + i} style={[st.wave, { top: (i + 0.5) * (size / 9), opacity: 0.06 + (done ? 0.05 : 0), transform: [{ translateX: Math.sin(time * 0.8 + i) * 18 }] }]} />
      ))}
      {/* 밤의 박물관 — 바닥, 양쪽 진열장, 위에서 떨어지는 조명 */}
      <View style={[st.floor, { top: size * 0.83, height: size * 0.17 }]} />
      {[0.04, 0.8].map((x, i) => (
        <View key={'case' + i} style={[st.case, { left: size * x, top: size * 0.5, width: size * 0.16, height: size * 0.33 }]}>
          <View style={st.caseTop} />
        </View>
      ))}
      {[-14, 14].map((deg, i) => (
        <View
          key={'beam' + i}
          style={[st.beam, { left: size * (0.38 + i * 0.08), top: -size * 0.1, width: size * 0.16, height: size * 1.1, opacity: (done ? 0.16 : 0.06) + 0.03 * Math.sin(time * 2 + i), transform: [{ rotate: `${deg}deg` }] }]}
        />
      ))}
      {time >= tl.lockT ? <View style={[st.shadow, { left: size * 0.22, top: size * 0.86, width: size * 0.56, height: size * 0.06, borderRadius: size * 0.3 }]} /> : null}
      {tl.frame.stars &&
        Array.from({ length: 30 }, (_, i) => (
          <View key={'s' + i} style={[st.star, { left: ((i * 137) % 100) + '%', top: ((i * 71) % 100) + '%', opacity: 0.3 + 0.5 * Math.abs(Math.sin(time * 2 + i)) }]} />
        ))}
      <View style={[st.glow, { width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4, left: size * 0.1, top: size * 0.1, opacity: done ? 0.22 + 0.06 * Math.sin(time * 3) : 0.08 }]} />
      {tl.frame.person && (
        <View style={[st.person, { left: 430 * k, top: 120 * k, width: 140 * k, height: 780 * k, borderRadius: 70 * k }]} />
      )}
      {/* 속도선 — 조각이 날아오는 동안 */}
      {tl.events
        .filter((e) => time >= e.start && time < e.end)
        .map((e) => {
          const p = poseAt(e, time);
          return <View key={'v' + e.key} style={[st.speed, { left: Math.min(p.x, e.to.x) * k, top: p.y * k, width: Math.abs(e.to.x - p.x) * k + 30, opacity: 0.5 * (1 - p.p) }]} />;
        })}
      {/* 보존의 적 — 먹빛 구름이 다가오다가 합체 순간 흩어진다 */}
      {(() => {
        const v = villainAt(tl, time);
        if (!v) return null;
        const scatter = time >= tl.lockT ? (time - tl.lockT) * 900 : 0;
        return Array.from({ length: 9 }, (_, i) => {
          const a = (i / 9) * Math.PI * 2;
          const cx = 800 - Math.min(1, (time - 1.5) / 2.2) * 120 + Math.cos(a) * (70 + scatter) + Math.sin(time * 2 + i) * 10;
          const cy = 170 + Math.sin(a) * (45 + scatter * 0.7);
          const r = (60 + (i % 3) * 18) * k;
          return <View key={'vl' + i} style={{ position: 'absolute', left: cx * k - r, top: cy * k - r, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: tl.villain.color, opacity: 0.55 * v }} />;
        });
      })()}
      {(() => {
        const v = villainAt(tl, time);
        if (!v || time >= tl.lockT) return null;
        return (
          <View style={[st.vName, { right: 12, top: 118 * k }]} pointerEvents="none">
            <Text style={st.vNameTxt}>{t(tl.villain.name)}</Text>
          </View>
        );
      })()}
      <View style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, transform: (() => {
        const c = camAt(tl, time);
        return [{ translateX: (500 - c.cx) * c.z * k + shake }, { translateY: (500 - c.cy) * c.z * k + bob * k }, { scale: c.z }];
      })() }}>
        {(tl.threads || []).map((th, i) => {
          const f = threadAt(th, time);
          if (!f || spin) return null;
          const dx = (th.b.x - th.a.x) * f;
          const dy = (th.b.y - th.a.y) * f;
          const len = Math.hypot(dx, dy) * k;
          const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
          const glow = time >= tl.lockT ? 0.55 + 0.35 * Math.abs(Math.sin(time * 4 + i)) : 0.85;
          return (
            <View
              key={'th' + i}
              style={{ position: 'absolute', left: th.a.x * k, top: th.a.y * k - 2, width: len, height: 4, borderRadius: 2, backgroundColor: '#f2c75c', opacity: glow, transform: [{ translateX: -len / 2 }, { rotate: `${ang}deg` }, { translateX: len / 2 }] }}
            />
          );
        })}
        {sorted.map((e) => {
          const p0 = poseAt(e, time);
          if (!p0) return null;
          const p = spin ? { ...p0, x: proj(p0.x, e.z) } : p0;
          const piece = PIECE_BY_K[e.k];
          const w = e.w * k * p.s * (spin ? Math.max(0.12, Math.abs(cosT)) : 1);
          const h = e.h * k * p.s;
          const spinning = e.spin && done ? (time - tl.titleT) * 360 : 0;
          return (
            <View key={e.key} style={{ position: 'absolute', left: p.x * k - w / 2, top: p.y * k - h / 2, width: w, height: h, transform: [{ rotate: `${p.rot + spinning}deg` }, { scaleX: (e.flip ? -1 : 1) * (spin && cosT < 0 ? -1 : 1) }, { scaleY: e.flipY ? -1 : 1 }], opacity: e.ghost ? 0.55 : spin && cosT < 0 ? 0.8 : 1 }}>
              {e.fire && p.landed && (
                <View style={[st.fire, { width: w * 0.7, height: h * 0.9, left: w * 0.15, top: h * 0.55, opacity: 0.6 + 0.4 * Math.abs(Math.sin(time * 18)) }]} />
              )}
              <Image source={piece.img} style={{ width: '100%', height: '100%' }} resizeMode="stretch" />
              {p.landed && time - e.end < 0.25 && <View style={[st.spark, { borderRadius: w }]} />}
            </View>
          );
        })}
      </View>
      {flash > 0 && <View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff8e8', opacity: flash * 0.85 }]} />}
      {done && (
        <View style={st.titleBox} pointerEvents="none">
          <Text style={[st.title, { fontSize: Math.max(15, size * 0.052) }]} brush>
            {tl.title.full}
          </Text>
        </View>
      )}
      {tags.map((g, i) => (
        <View key={g.key} style={[st.tag, { top: 10 + i * 30 }]} pointerEvents="none">
          <Text style={st.tagSlot}>{g.slot}</Text>
          <Text style={st.tagText} numberOfLines={1}>
            {g.text}
          </Text>
        </View>
      ))}
      {sub && (
        <View style={st.subBox} pointerEvents="none">
          <Text style={[st.who, { color: WHO_COLOR[sub.who] || '#fff' }]}>{t(sub.who)}</Text>
          <Text style={[st.sub, { fontSize: Math.max(13, size * 0.04) }]}>{sub.text}</Text>
        </View>
      )}
      {overlay || null}
      {!playing && !spin && time >= tl.titleT ? (
        <Pressable style={st.spinBtn} onPress={() => setSpin(Date.now())} accessibilityLabel={t('돌려 보기')}>
          <Text style={st.replayTxt}>{t('↻ 돌려 보기')}</Text>
        </Pressable>
      ) : null}
      {!playing && (
        <Pressable
          style={st.replay}
          onPress={() => {
            fired.current = new Set();
            setTime(0);
            setPlaying(true);
          }}
        >
          <Text style={st.replayTxt}>{t('▶ 다시 보기')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  stage: { overflow: 'hidden', borderRadius: 18, alignSelf: 'center' },
  wave: { position: 'absolute', left: -20, right: -20, height: 2, backgroundColor: '#ffffff' },
  star: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: '#fff' },
  floor: { position: 'absolute', left: 0, right: 0, backgroundColor: '#00000040', borderTopWidth: 1, borderTopColor: '#ffffff22' },
  case: { position: 'absolute', borderWidth: 1.5, borderColor: '#ffffff1f', backgroundColor: '#ffffff08', borderRadius: 4 },
  caseTop: { position: 'absolute', left: -4, right: -4, top: -8, height: 8, backgroundColor: '#ffffff18', borderRadius: 2 },
  beam: { position: 'absolute', backgroundColor: '#fff2cc' },
  shadow: { position: 'absolute', backgroundColor: '#00000066' },
  glow: { position: 'absolute', backgroundColor: '#ffd98a' },
  person: { position: 'absolute', backgroundColor: '#00000055' },
  speed: { position: 'absolute', height: 3, backgroundColor: '#fff3c2', borderRadius: 2 },
  vName: { position: 'absolute', backgroundColor: '#000000aa', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  vNameTxt: { color: '#ffd2c8', fontSize: 12, fontWeight: '700' },
  fire: { position: 'absolute', backgroundColor: '#ff8a2a', borderRadius: 999 },
  spark: { ...StyleSheet.absoluteFillObject, borderWidth: 3, borderColor: '#fff6c8' },
  titleBox: { position: 'absolute', top: '6%', left: 10, right: 10, alignItems: 'center' },
  title: { color: '#fff4d6', textAlign: 'center', textShadowColor: '#000', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 } },
  tag: { position: 'absolute', left: 10, maxWidth: '78%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#000000a8', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 4 },
  tagSlot: { color: '#1b2227', backgroundColor: '#f0c45a', fontSize: 11, fontWeight: '700', paddingHorizontal: 6, borderRadius: 8, marginRight: 6, overflow: 'hidden' },
  tagText: { color: '#fff', fontSize: 12, flexShrink: 1 },
  subBox: { position: 'absolute', left: 10, right: 10, bottom: 12, backgroundColor: '#000000b8', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  who: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  sub: { color: '#fff', lineHeight: 20 },
  replay: { position: 'absolute', right: 10, top: 10, backgroundColor: '#ffffffd9', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  spinBtn: { position: 'absolute', right: 10, top: 46, backgroundColor: '#ffffffd9', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  replayTxt: { color: '#1b2227', fontSize: 12, fontWeight: '700' },
});
