import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Text from '../ui/Text';
import Frame from '../ui/Frame';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t as i18nT } from '../i18n';

// 인쇄 판의 "자모 맞추기"가 아닌 놀이들 — 글자를 끌어다 놓는 것 말고도 인쇄·훈민정음을 만나는 길이 여럿 있다.
//  · mirror   : 활자는 거울에 비친 글자로 새긴다 → 찍으면 어떻게 나올까?
//  · sentence : 훈민정음 서문을 낱말 활자로 한 줄씩 짜 올리기(조판)
//  · shape    : 자음이 발음기관의 모양을 본떴다는 상형 원리 짝 맞추기

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── 거울 활자 ──
const MIRROR_GLYPHS = ['한', '글', '판', '활', '찍'];
const VARIANTS = [
  { id: 'normal', tf: [] },
  { id: 'flipx', tf: [{ scaleX: -1 }] },
  { id: 'flipy', tf: [{ scaleY: -1 }] },
  { id: 'rot', tf: [{ rotate: '180deg' }] },
];

function MirrorPlay({ onDone, color, accent }) {
  const rounds = useMemo(() => shuffle(MIRROR_GLYPHS).slice(0, 3), []);
  const [r, setR] = useState(0);
  const [msg, setMsg] = useState('');
  const mistakes = useRef(0);
  const order = useMemo(() => shuffle(VARIANTS), [r]);
  const glyph = rounds[r];

  const pick = (v) => {
    if (v.id === 'normal') {
      play('stamp');
      if (r + 1 >= rounds.length) onDone({ mistakes: mistakes.current });
      else {
        setMsg('');
        setR(r + 1);
      }
    } else {
      mistakes.current += 1;
      play('geomungo');
      setMsg(
        v.id === 'flipx'
          ? i18nT('그건 활자와 똑같은 모양이에요. 찍으면 좌우가 한 번 뒤집혀요.')
          : i18nT('찍으면 좌우만 뒤집혀요. 위아래나 거꾸로 돌아가지는 않아요.')
      );
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.q}>{i18nT('활자는 글자를 거울에 비친 모양으로 새겨요. 이 활자에 먹을 묻혀 종이에 찍으면 어떤 모양이 나올까요? (')}{r + 1}/{i18nT(rounds.length)})</Text>
      <View style={[styles.typeBlock, { borderColor: color }]}>
        <Text style={styles.typeCap}>{i18nT('활자(새긴 면)')}</Text>
        <Text style={[styles.bigGlyph, { transform: [{ scaleX: -1 }], color: '#7a5a1c' }]}>{i18nT(glyph)}</Text>
      </View>
      <Text style={styles.arrow}>{i18nT('▼ 종이에 꾹 찍으면')}</Text>
      <View style={styles.optRow}>
        {order.map((v) => (
          <Pressable key={v.id} style={[styles.opt, { borderColor: colors.border }]} onPress={() => pick(v)}>
            <Text style={[styles.optGlyph, { transform: v.tf }]}>{i18nT(glyph)}</Text>
          </Pressable>
        ))}
      </View>
      {msg ? <Text style={[styles.msg, { color: accent }]}>{i18nT(msg)}</Text> : null}
    </View>
  );
}

// ── 서문 조판 ──
const SENTENCES = [
  { chunks: ['나랏말싸미', '듕귁에', '달아'], gloss: '우리나라 말이 중국과 달라' },
  { chunks: ['문자와로', '서르', '사맛디', '아니할쎄'], gloss: '한자와는 서로 통하지 아니하므로' },
  { chunks: ['이런', '젼차로', '어린', '百姓이'], gloss: '이런 까닭으로 어리석은 백성이' },
];

function SentencePlay({ onDone, color, accent }) {
  const [s, setS] = useState(0);
  const [got, setGot] = useState(0);
  const [msg, setMsg] = useState('');
  const mistakes = useRef(0);
  const sent = SENTENCES[s];
  const pool = useMemo(() => shuffle(sent.chunks.map((c, i) => ({ c, i }))), [s]);

  const tap = (item) => {
    if (item.i < got) return;
    if (item.i === got) {
      play('tap');
      setMsg('');
      if (got + 1 >= sent.chunks.length) {
        play('stamp');
        if (s + 1 >= SENTENCES.length) {
          onDone({ mistakes: mistakes.current });
          return;
        }
        setTimeout(() => {
          setS(s + 1);
          setGot(0);
        }, 500);
      }
      setGot(got + 1);
    } else {
      mistakes.current += 1;
      play('geomungo');
      setMsg(i18nT('글은 왼쪽에서 오른쪽으로 읽어요. 이 활자는 아직 차례가 아니에요.'));
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.q}>{i18nT('훈민정음 서문을 활자로 짜 올려요. 낱말 활자를 읽는 순서대로 눌러 한 줄을 짜 보자. (')}{s + 1}/{i18nT(SENTENCES.length)}{i18nT('줄)')}</Text>
      <View style={[styles.composing, { borderColor: color }]}>
        {sent.chunks.map((c, i) => (
          <View key={c} style={[styles.slot, i < got && { backgroundColor: color, borderStyle: 'solid' }]}>
            <Text style={[styles.slotText, i < got && { color: '#fff' }]}>{i18nT(i < got ? c : i + 1)}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.gloss}>{i18nT('뜻:')} {i18nT(sent.gloss)}</Text>
      <View style={styles.optRow}>
        {pool.map((item) => (
          <Pressable
            key={item.c}
            disabled={item.i < got}
            style={[styles.chip, item.i < got && { opacity: 0.25 }]}
            onPress={() => tap(item)}
          >
            <Text style={styles.chipText}>{i18nT(item.c)}</Text>
          </Pressable>
        ))}
      </View>
      {msg ? <Text style={[styles.msg, { color: accent }]}>{i18nT(msg)}</Text> : null}
    </View>
  );
}

// ── 상형 원리 ──
const SHAPES = [
  { k: 'ㄱ', name: '어금닛소리', d: '혀뿌리가 목구멍을 막는 모양' },
  { k: 'ㄴ', name: '혓소리', d: '혀가 윗잇몸에 닿는 모양' },
  { k: 'ㅁ', name: '입술소리', d: '입의 모양' },
  { k: 'ㅅ', name: '잇소리', d: '이(치아)의 모양' },
  { k: 'ㅇ', name: '목구멍소리', d: '목구멍의 모양' },
];

function ShapePlay({ onDone, color, accent }) {
  const right = useMemo(() => shuffle(SHAPES), []);
  const [sel, setSel] = useState(null);
  const [done, setDone] = useState([]);
  const [msg, setMsg] = useState('');
  const mistakes = useRef(0);

  const tapRight = (item) => {
    if (sel == null || done.includes(item.k)) return;
    if (sel === item.k) {
      play('tap');
      const nd = [...done, item.k];
      setDone(nd);
      setSel(null);
      setMsg('');
      if (nd.length >= SHAPES.length) {
        play('stamp');
        onDone({ mistakes: mistakes.current });
      }
    } else {
      mistakes.current += 1;
      play('geomungo');
      setMsg(i18nT('아니에요. 소리를 낼 때 그 자리가 어떤 모양인지 입을 움직여 보며 다시 골라 봐요.'));
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.q}>{i18nT('세종대왕은 소리 낼 때 입과 혀의 모양을 본떠 자음을 만들었어요. 왼쪽 글자를 누르고, 본뜬 모양을 오른쪽에서 짝지어 봐요.')}</Text>
      <View style={styles.twoCol}>
        <View style={styles.col}>
          {SHAPES.map((it) => {
            const ok = done.includes(it.k);
            return (
              <Pressable
                key={it.k}
                disabled={ok}
                style={[styles.shapeL, sel === it.k && { borderColor: color, backgroundColor: colors.accentSoft }, ok && { opacity: 0.35 }]}
                onPress={() => { play('tap'); setSel(it.k); }}
              >
                <Text style={styles.shapeK}>{i18nT(it.k)}</Text>
                <Text style={styles.shapeName}>{i18nT(ok ? it.name : '')}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.col}>
          {right.map((it) => {
            const ok = done.includes(it.k);
            return (
              <Pressable key={it.k} disabled={ok} style={[styles.shapeR, ok && { opacity: 0.35 }]} onPress={() => tapRight(it)}>
                <Text style={styles.shapeD}>{i18nT(it.d)}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {msg ? <Text style={[styles.msg, { color: accent }]}>{i18nT(msg)}</Text> : null}
    </View>
  );
}

export default function PrintPlay({ mode, color, onDone, resetKey }) {
  const accent = colors.accent;
  const props = { color, accent, onDone };
  return (
    <Frame style={styles.frame}>
      {mode === 'mirror' ? <MirrorPlay key={resetKey} {...props} /> : null}
      {mode === 'sentence' ? <SentencePlay key={resetKey} {...props} /> : null}
      {mode === 'shape' ? <ShapePlay key={resetKey} {...props} /> : null}
    </Frame>
  );
}

const styles = StyleSheet.create({
  frame: { padding: 14, marginTop: 6 },
  wrap: { gap: 12, alignItems: 'stretch' },
  q: { fontSize: 13, lineHeight: 20, color: colors.ink },
  typeBlock: { alignSelf: 'center', alignItems: 'center', borderWidth: 2, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 10, backgroundColor: '#e9d8a6' },
  typeCap: { fontSize: 10.5, color: '#6b4f12', fontWeight: '700' },
  bigGlyph: { fontSize: 64, lineHeight: 78, fontWeight: '700' },
  arrow: { textAlign: 'center', fontSize: 12, color: colors.muted },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  opt: { width: 74, height: 84, borderWidth: 1.5, borderRadius: 12, backgroundColor: '#fffbf3', alignItems: 'center', justifyContent: 'center' },
  optGlyph: { fontSize: 44, color: '#1b2227', fontWeight: '700' },
  msg: { fontSize: 12.5, lineHeight: 18, textAlign: 'center', fontWeight: '700' },
  composing: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', padding: 10, borderWidth: 1.5, borderRadius: 12, backgroundColor: colors.paper },
  slot: { minWidth: 56, paddingHorizontal: 10, height: 44, borderRadius: 8, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  slotText: { fontSize: 15, fontWeight: '700', color: colors.muted },
  gloss: { fontSize: 12, textAlign: 'center', color: colors.muted },
  chip: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#b08a4a', backgroundColor: '#fffbf3' },
  chipText: { fontSize: 16, fontWeight: '700', color: '#1b2227' },
  twoCol: { flexDirection: 'row', gap: 10 },
  col: { flex: 1, gap: 8 },
  shapeL: { height: 52, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  shapeK: { fontSize: 26, fontWeight: '700', color: colors.ink },
  shapeName: { fontSize: 11, color: colors.muted },
  shapeR: { minHeight: 52, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.paper, justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 6 },
  shapeD: { fontSize: 12.5, lineHeight: 17, color: colors.ink },
});
