// 유물 수수께끼 — 풍이가 "옛날에 이렇게 쓰던 물건"을 말하면, 세 조각 가운데 맞는 것을 고른다.
// 맞히면 그 조각을 도감에 넣는다(하루 5문제). 도감 설명(풍이의 설명)과 같은 쓰임 자료를 쓴다.
import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Image, SafeAreaView, ScrollView, useWindowDimensions } from 'react-native';
import Text from '../ui/Text';
import ScreenHeader from '../ui/ScreenHeader';
import SealButton from '../ui/SealButton';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t, getLang } from '../i18n';
import { pieceName } from '../utils/pieceName';
import { useOf } from '../utils/pieceStory';
import { usePieces, riddleState, answerRiddle } from '../utils/pieceStore';
import { PIECES } from '../data/pieces';

// 쓰임이 정해진 조각만, 쓰임 낱말별로 묶는다
const BY_USE = (() => {
  const m = {};
  PIECES.forEach((p) => {
    const u = useOf(p);
    if (u && !p.abroad) (m[u.key] = m[u.key] || []).push(p);
  });
  return m;
})();
const KEYS = Object.keys(BY_USE).filter((k) => BY_USE[k].length >= 2);

function makeRiddle(seed) {
  let s = seed;
  const r = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const key = KEYS[Math.floor(r() * KEYS.length)];
  const answer = BY_USE[key][Math.floor(r() * BY_USE[key].length)];
  const others = [];
  while (others.length < 2) {
    const k2 = KEYS[Math.floor(r() * KEYS.length)];
    if (k2 === key || others.some((o) => useOf(o).key === k2)) continue;
    others.push(BY_USE[k2][Math.floor(r() * BY_USE[k2].length)]);
  }
  const opts = [answer, ...others].sort(() => r() - 0.5);
  return { key, what: useOf(answer).what, answer, opts };
}

export default function RiddleScreen({ navigation }) {
  usePieces();
  const { width } = useWindowDimensions();
  const [seed, setSeed] = useState(() => (Date.now() % 100000) + 7);
  const [picked, setPicked] = useState(null);
  const [fresh, setFresh] = useState(false);
  const q = useMemo(() => makeRiddle(seed), [seed]);
  const rs = riddleState();
  const cell = Math.min(150, (Math.min(width, 560) - 64) / 3);
  const ko = getLang() === 'ko';
  const ok = picked && picked === q.answer.k;

  const choose = (k) => {
    if (picked || !rs.left) return;
    setPicked(k);
    const right = k === q.answer.k;
    play(right ? 'shine' : 'tap');
    const res = answerRiddle(q.answer.k, right);
    setFresh(res.fresh.length > 0);
  };

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.wrap}>
        <ScreenHeader title={t('유물 수수께끼')} sub={t('옛날에 어디에 쓰던 물건일까? 맞히면 그 조각을 가져요.')} onBack={() => navigation.goBack()} />
        <Text style={st.count}>{t('오늘 남은 문제 {n}개 · 지금까지 맞힌 문제 {m}개', { n: rs.left, m: rs.right || 0 })}</Text>
        {rs.left || picked ? (
          <>
            <View style={st.bubble}>
              <Text style={st.who}>{t('풍이')}</Text>
              <Text style={st.q} testID="riddle-q">
                {ko ? (() => {
                  const w = q.what.split(' — ')[0];
                  const c = w.charCodeAt(w.length - 1);
                  const jo = c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 ? '은' : '는';
                  return `옛날에 쓰던 「${w}」${jo} 어느 것일까?`;
                })() : t('이 가운데 「{a}」은(는) 어느 것일까?', { a: (q.answer.en || pieceName(q.answer)).split(' ').slice(-2).join(' ') })}
              </Text>
            </View>
            <View style={st.row}>
              {q.opts.map((p, i) => {
                const isAns = p.k === q.answer.k;
                const state = !picked ? null : isAns ? 'right' : picked === p.k ? 'wrong' : 'dim';
                return (
                  <Pressable
                    key={p.k}
                    testID={'riddle-opt-' + i}
                    accessibilityLabel={t('{n}번', { n: i + 1 })}
                    onPress={() => choose(p.k)}
                    style={[st.opt, { width: cell }, state === 'right' && st.right, state === 'wrong' && st.wrong, state === 'dim' && { opacity: 0.45 }]}
                  >
                    <Image source={p.img} style={{ width: cell - 16, height: cell - 16 }} resizeMode="contain" />
                    <Text style={st.num}>{i + 1}</Text>
                    {picked ? (
                      <Text style={st.optName} numberOfLines={2}>
                        {pieceName(p)}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            {picked ? (
              <View style={st.result}>
                <Text style={[st.resTxt, { color: ok ? '#2c7a64' : colors.accent }]}>
                  {ok ? t('맞았어요! 얼쑤!') : t('아쉬워요. 정답은 {n}번이에요.', { n: q.opts.findIndex((p) => p.k === q.answer.k) + 1 })}
                </Text>
                <Text style={st.small}>
                  {ok ? (fresh ? t('새 조각 「{a}」이(가) 도감에 들어갔어요.', { a: pieceName(q.answer) }) : t('이미 가진 조각이라 한 개 더 겹쳤어요. 겹친 조각은 친구와 바꿀 수 있어요.')) : t('「{a}」였어요. 도감에서 풍이의 설명을 더 들어 봐요.', { a: pieceName(q.answer) })}
                </Text>
                {rs.left ? (
                  <SealButton
                    label={t('다음 수수께끼')}
                    onPress={() => {
                      setPicked(null);
                      setFresh(false);
                      setSeed((x) => x + 101);
                    }}
                  />
                ) : (
                  <Text style={st.small}>{t('오늘 수수께끼는 다 풀었어요. 내일 또 만나요!')}</Text>
                )}
              </View>
            ) : null}
          </>
        ) : (
          <Text style={st.small}>{t('오늘 수수께끼는 다 풀었어요. 내일 또 만나요!')}</Text>
        )}
        <View style={{ gap: 8, marginTop: 18 }}>
          <SealButton label={t('조각 도감')} variant="ink" onPress={() => navigation.navigate('Dex')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  wrap: { padding: 16, paddingBottom: 60, maxWidth: 620, width: '100%', alignSelf: 'center' },
  count: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8 },
  bubble: { marginTop: 14, backgroundColor: '#fbf3e2', borderRadius: 16, padding: 14, borderLeftWidth: 5, borderLeftColor: '#b9781a' },
  who: { fontSize: 12, fontWeight: '700', color: '#b9781a' },
  q: { fontSize: 18, color: '#1b2227', lineHeight: 27, marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 16 },
  opt: { alignItems: 'center', backgroundColor: colors.paper, borderRadius: 14, borderWidth: 3, borderColor: colors.borderSoft, padding: 6, paddingBottom: 8 },
  right: { borderColor: '#2c7a64', backgroundColor: '#e6f3ee' },
  wrong: { borderColor: colors.accent, backgroundColor: '#f8e4e1' },
  num: { position: 'absolute', top: 4, left: 8, fontSize: 15, fontWeight: '800', color: '#b9781a' },
  optName: { fontSize: 11, color: colors.ink, textAlign: 'center', marginTop: 4 },
  result: { marginTop: 14, alignItems: 'center', gap: 8 },
  resTxt: { fontSize: 20, fontWeight: '800' },
  small: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19 },
});
