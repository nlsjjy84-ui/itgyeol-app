// 조각 보따리 — 놀이를 마치면 받는 보따리. 풀면 실제 유물 조각이 한 장씩 뒤집힌다(무엇이 나올지 모름).
// 처음 오면 「첫 보따리」(자리마다 하나씩 10개)를 먼저 준다 — 작업대를 바로 써 볼 수 있게.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Image, SafeAreaView, useWindowDimensions, Animated, Easing, TextInput } from 'react-native';
import Text from '../ui/Text';
import ScreenHeader from '../ui/ScreenHeader';
import SealButton from '../ui/SealButton';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { pieceName } from '../utils/pieceName';
import { usePieces, drawPack, addPieces, takeStarter, getPieces, loadPieces, isClaimed, markClaimed, enterCode, findByNo, giveAway, dailyState, takeDaily, currentSeries } from '../utils/pieceStore';
import { PIECE_BY_K, RARITY } from '../data/pieces';
import { giftUrl } from '../utils/movieLink';
import QRCode from 'react-native-qrcode-svg';

const RARE_COLOR = ['#c8c0ae', '#e0a43a', '#c0392b'];

// 이어 오기 고비(7·14·21…일) 축하 — 듀오링고는 고비 날 축하 화면 하나로 7일 뒤 남는 새 사용자가 1.7% 늘었다.
// 잇결은 오방색 고리가 돌며 퍼지고, 가운데 날 수가 튀어 오른다.
const OBANG = ['#2b5f8e', '#b3322b', '#c8982b', '#fcfdfc', '#1b2227'];
function Milestone({ n }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    play('shine');
    Animated.timing(a, { toValue: 1, duration: 1400, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }).start();
  }, []);
  const spin = a.interpolate({ inputRange: [0, 1], outputRange: ['-120deg', '0deg'] });
  return (
    <View style={st.mile} testID="milestone">
      {Array.from({ length: 10 }, (_, i) => {
        const ang = (i / 10) * Math.PI * 2;
        const dx = a.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(ang) * 92] });
        const dy = a.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(ang) * 92] });
        return <Animated.View key={i} style={[st.mileDot, { backgroundColor: OBANG[i % 5], transform: [{ translateX: dx }, { translateY: dy }] }]} />;
      })}
      <Animated.View style={[st.mileRing, { opacity: a, transform: [{ scale: a }, { rotate: spin }] }]}>
        <Text style={st.mileN}>{n}</Text>
        <Text style={st.mileT}>{t('일 연속!')}</Text>
      </Animated.View>
    </View>
  );
}

function Card({ k, delay, fresh, size, secret }) {
  const flip = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const id = setTimeout(() => play('unwrap'), delay);
    Animated.timing(flip, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }).start();
    return () => clearTimeout(id);
  }, []);
  const p = PIECE_BY_K[k];
  const scale = flip.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1.12, 1] });
  const rot = flip.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '0deg'] });
  return (
    <Animated.View style={[st.card, { width: size, borderColor: RARE_COLOR[p.rare], opacity: flip, transform: [{ scale }, { rotateY: rot }] }]}>
      <View style={[st.rareBand, { backgroundColor: RARE_COLOR[p.rare] }]}>
        <Text style={st.rareTxt}>{t(RARITY[p.rare])}</Text>
        {fresh && <Text style={st.newTxt}>{t('새 조각!')}</Text>}
        {secret && <Text style={st.newTxt}>{t('시크릿!')}</Text>}
      </View>
      <Image source={p.img} style={{ width: size - 16, height: size - 16, alignSelf: 'center' }} resizeMode="contain" />
      <Text style={st.cardName} numberOfLines={2}>
        {pieceName(p)}
      </Text>
      <Text style={st.cardMeta} numberOfLines={1}>
        {[t(p.era), t(p.by)].filter(Boolean).join(' · ')}
      </Text>
      <View style={st.slotRow}>
        {p.slots.slice(0, 3).map((s) => (
          <Text key={s} style={st.slotChip}>
            {t(s)}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
}

export default function PackScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const store = usePieces();
  const scene = (route.params && route.params.scene) || '';
  const count = (route.params && route.params.n) || 3;
  const claim = (route.params && route.params.claim) || '';
  const gift = (route.params && route.params.gift) || '';
  const daily = !!(route.params && route.params.daily);
  const from = (route.params && route.params.from) || '';
  const swap = !!(route.params && route.params.swap);
  const [opened, setOpened] = useState(null); // {keys, fresh, starter}
  const [code, setCode] = useState('');
  const [codeMsg, setCodeMsg] = useState('');
  const [no, setNo] = useState('');
  const [noMsg, setNoMsg] = useState('');
  const scan = async () => {
    await loadPieces();
    const ks = findByNo(no);
    if (!ks.length) {
      setNoMsg(t('그 번호의 조각은 아직 잇결에 없어요. 번호를 다시 확인해 주세요.'));
      return;
    }
    const key = 'scan:' + ks.join(',');
    if (isClaimed(key)) {
      setNoMsg(t('이미 찾은 유물이에요.'));
      return;
    }
    const fresh = addPieces(ks);
    markClaimed(key);
    setNoMsg('');
    setOpened({ keys: ks, fresh, starter: false, scan: true });
  };
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 140, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 140, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 140, useNativeDriver: true }),
        Animated.delay(900),
      ])
    ).start();
  }, []);
  const open = async () => {
    await loadPieces();
    const s = getPieces();
    if (daily && s.starter) {
      const d = takeDaily();
      if (!d) {
        setOpened({ keys: [], fresh: [], starter: false, already: true, daily: true });
        return;
      }
      setOpened({ keys: d.keys, fresh: d.fresh, starter: false, daily: true, streak: d.streak, usedCharms: d.usedCharms, gotCharm: d.gotCharm });
      return;
    }
    if (gift) {
      if (isClaimed('gift:' + gift)) {
        setOpened({ keys: [], fresh: [], starter: false, already: true });
        return;
      }
      const fresh = addPieces([gift]);
      markClaimed('gift:' + gift);
      setOpened({ keys: [gift], fresh, starter: false, gift: true });
      return;
    }
    if (!s.starter) {
      const keys = takeStarter();
      setOpened({ keys, fresh: keys, starter: true });
      return;
    }
    if (claim && isClaimed(claim)) {
      setOpened({ keys: [], fresh: [], starter: false, already: true });
      return;
    }
    const keys = drawPack(count, Date.now() % 1000003, s.owned, s.codes, scene);
    const fresh = addPieces(keys);
    markClaimed(claim);
    setOpened({ keys, fresh, starter: false });
  };
  const perRow = opened && opened.keys.length > 3 ? 3 : Math.max(2, (opened && opened.keys.length) || 3);
  const cardW = Math.min(170, Math.floor((Math.min(width, 760) - 32 - 10 * (perRow - 1)) / perRow) - 2);
  const ownedN = Object.keys(store.owned || {}).length;
  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.wrap}>
        <ScreenHeader title={t('조각 보따리')} sub={t('놀이를 마치면 실제 유물 조각을 받아요')} onBack={() => navigation.goBack()} />
        {!opened ? (
          <View style={st.center}>
            <Text style={st.lead}>
              {gift
                ? from
                  ? t('{a} 님이 유물 조각을 선물했어요! 보따리를 풀어 보세요.', { a: from })
                  : t('친구가 유물 조각을 선물했어요! 보따리를 풀어 보세요.')
                : scene
                ? t('{a} 놀이를 마쳤어요! 보따리 안에 무엇이 들었을까요?', { a: t(scene) })
                : t('보따리 안에 무엇이 들었을까요?')}
            </Text>
            <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={t('보따리 풀기')}>
              <Animated.View style={[st.bundle, { transform: [{ rotate: shake.interpolate({ inputRange: [-1, 1], outputRange: ['-6deg', '6deg'] }) }] }]}>
                <View style={st.knot} />
                <View style={st.knotL} />
                <View style={st.knotR} />
                <Text style={st.bundleTxt} brush>
                  {t('결')}
                </Text>
              </Animated.View>
            </Pressable>
            <Text style={st.hint}>{t('보따리를 눌러 풀어 보세요')}</Text>
            <Text style={st.small}>{t('보통 · 귀함 · 아주 귀함 — 아직 없는 조각이 더 잘 나와요')}</Text>
            {(() => {
              const se = currentSeries();
              const got = se.pool.filter((p) => (store.owned || {})[p.k]).length;
              return (
                <View style={st.series}>
                  <Text style={st.seriesH}>{t('이달의 시리즈')} · {t(se.name)}</Text>
                  <Text style={[st.small, st.onDark]}>{t('이 시리즈 조각이 더 잘 나와요. 모은 조각 {a} / {b}', { a: got, b: se.pool.length })}</Text>
                  <Text style={[st.small, st.onDark]}>{t('시크릿 조각이 72번에 한 번꼴로 숨어 있어요')}{se.secret && (store.owned || {})[se.secret.k] ? ' — ' + t('찾았어요!') : ''}</Text>
                </View>
              );
            })()}
            <View style={st.codeBox}>
              <Text style={st.codeH}>{t('진짜 유물 찾기')}</Text>
              <Text style={st.small}>{t('박물관에서 진열장 설명판의 소장품번호(예: 덕수1496)를 넣으면 바로 그 유물 조각을 얻어요.')}</Text>
              <View style={st.codeRow}>
                <TextInput testID="scan-no" value={no} onChangeText={setNo} placeholder={t('소장품번호')} style={st.codeInput} />
                <SealButton small label={t('찾기')} onPress={scan} />
              </View>
              {!!noMsg && <Text style={st.codeMsg}>{noMsg}</Text>}
            </View>
            <View style={st.codeBox}>
              <Text style={st.codeH}>{t('박물관에서 받은 암호')}</Text>
              <Text style={st.small}>{t('박물관 현장에서 받은 암호를 넣으면 그곳에서만 나오는 「한정 조각」이 보따리에 섞여요.')}</Text>
              <View style={st.codeRow}>
                <TextInput value={code} onChangeText={setCode} placeholder={t('암호')} style={st.codeInput} autoCapitalize="characters" />
                <SealButton
                  small
                  label={t('넣기')}
                  onPress={() => {
                    const c = enterCode(code);
                    setCodeMsg(c ? t('「{a} 한정」 조각이 열렸어요!', { a: t(c) }) : t('맞지 않는 암호예요.'));
                  }}
                />
              </View>
              {!!codeMsg && <Text style={st.codeMsg}>{codeMsg}</Text>}
              {(store.codes || []).length ? <Text style={st.small}>{t('열린 한정: {a}', { a: store.codes.map((c) => t(c)).join(', ') })}</Text> : null}
            </View>
          </View>
        ) : (
          <View>
            {opened.daily && !opened.already && opened.streak % 7 === 0 ? <Milestone n={opened.streak} /> : null}
            <Text style={st.lead}>
              {opened.daily && !opened.already
                ? t('오늘의 보따리! {n}일째 이어서 왔어요. 조각 {m}개.', { n: opened.streak, m: opened.keys.length }) + (opened.streak % 7 === 0 ? ' ' + t('7일째 선물 — 「아주 귀함」 조각이 들어 있어요!') : '') + (opened.usedCharms ? ' ' + t('빠진 {n}일은 쉼표 부적이 지켜 줬어요.', { n: opened.usedCharms }) : '') + (opened.gotCharm ? ' ' + t('쉼표 부적 하나를 받았어요!') : '')
                : opened.already && opened.daily
                ? t('오늘의 보따리는 이미 받았어요. 내일 또 와요!')
                : opened.already
                ? gift
                  ? t('이 선물은 이미 받았어요.')
                  : t('이 놀이의 보따리는 이미 받았어요. 다른 놀이를 마치면 또 받을 수 있어요.')
                : opened.scan
                ? t('진짜 유물을 찾았어요! 눈앞의 그 유물이 조각이 되어 도감에 들어갔어요.')
                : opened.gift
                ? t('선물 받은 조각이에요! 도감에 들어갔어요.')
                : opened.starter
                ? t('첫 보따리! 자리마다 하나씩, 조각 {n}개를 받았어요.', { n: opened.keys.length })
                : t('조각 {n}개를 받았어요. 새 조각 {m}개!', { n: opened.keys.length, m: opened.fresh.length })}
            </Text>
            <View style={st.grid}>
              {opened.keys.map((k, i) => (
                <Card key={k + i} k={k} delay={250 + i * 380} fresh={opened.fresh.includes(k)} size={cardW} secret={!!currentSeries().secret && currentSeries().secret.k === k} />
              ))}
            </View>
            {opened.gift && swap && !opened.already ? <SwapBack got={opened.keys[0]} owned={store.owned || {}} from={from} /> : null}
            <Text style={st.small}>{t('지금 모은 조각 {n}개', { n: ownedN })}</Text>
            <View style={st.btns}>
              <SealButton label={t('작업대에서 합체하기')} onPress={() => navigation.navigate('Workshop')} />
              <SealButton label={t('조각 도감 보기')} variant="ink" onPress={() => navigation.navigate('Dex')} />
              {opened.starter && claim ? <SealButton label={t('놀이 보따리도 풀기')} variant="paper" onPress={() => setOpened(null)} /> : null}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// 바꾸기 답례 — 「바꾸자」 링크로 조각을 받은 친구가 자기 겹친 조각 하나를 골라 되돌려 보낸다
function SwapBack({ got, owned, from }) {
  const [back, setBack] = useState(null);
  const dups = Object.keys(owned).filter((k) => owned[k] > 1 && k !== got && PIECE_BY_K[k]).slice(0, 12);
  if (back) {
    return (
      <View style={st.swap}>
        <Text style={st.swapH}>{t('답례 조각을 보낼 준비가 됐어요')}</Text>
        <View style={{ padding: 6, backgroundColor: '#fff', borderRadius: 8, alignSelf: 'center' }}>
          <QRCode value={back.url} size={120} />
        </View>
        <Text style={st.small}>{from ? t('이 QR이나 링크를 {a} 님에게 보내면 「{b}」 조각이 건너가요.', { a: from, b: pieceName(PIECE_BY_K[back.k]) }) : t('이 QR이나 링크를 친구에게 보내면 「{b}」 조각이 건너가요.', { b: pieceName(PIECE_BY_K[back.k]) })}</Text>
        {typeof navigator !== 'undefined' && navigator.clipboard ? <SealButton small variant="paper" label={t('링크 복사')} onPress={() => navigator.clipboard.writeText(back.url)} /> : null}
      </View>
    );
  }
  return (
    <View style={st.swap}>
      <Text style={st.swapH}>{from ? t('{a} 님이 조각을 바꾸자고 했어요', { a: from }) : t('친구가 조각을 바꾸자고 했어요')}</Text>
      {dups.length ? (
        <>
          <Text style={st.small}>{t('내 겹친 조각 가운데 하나를 골라 답례로 보내요.')}</Text>
          <View style={st.grid}>
            {dups.map((k) => (
              <Pressable
                key={k}
                testID={'swap-' + k}
                accessibilityLabel={t('답례로 보내기') + ' ' + pieceName(PIECE_BY_K[k])}
                onPress={() => {
                  if (giveAway(k)) setBack({ k, url: giftUrl(k) });
                }}
                style={st.swapCell}
              >
                <Image source={PIECE_BY_K[k].img} style={{ width: 64, height: 64 }} resizeMode="contain" />
                <Text style={st.swapName} numberOfLines={2}>{pieceName(PIECE_BY_K[k])}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <Text style={st.small}>{t('아직 겹친 조각이 없어요. 보따리를 더 풀어 겹친 조각이 생기면 도감에서 답례를 보낼 수 있어요.')}</Text>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  mile: { height: 220, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  mileDot: { position: 'absolute', width: 16, height: 16, borderRadius: 8, borderWidth: 1, borderColor: '#1b2227' },
  mileRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 8, borderColor: '#c8982b', backgroundColor: '#b3322b', alignItems: 'center', justifyContent: 'center' },
  mileN: { fontSize: 46, fontWeight: '800', color: '#fcfdfc', lineHeight: 52 },
  mileT: { fontSize: 15, color: '#fcfdfc', fontWeight: '700' },
  swap: { marginTop: 14, backgroundColor: '#f6f2ea', borderRadius: 14, padding: 12, gap: 6 },
  swapH: { fontSize: 16, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  swapCell: { width: 84, alignItems: 'center', gap: 2, padding: 4, borderRadius: 10, backgroundColor: colors.paper },
  swapName: { fontSize: 11, color: colors.ink, textAlign: 'center' },
  safe: { flex: 1, backgroundColor: 'transparent' },
  wrap: { padding: 16, paddingBottom: 60, maxWidth: 760, width: '100%', alignSelf: 'center' },
  center: { alignItems: 'center', paddingVertical: 20 },
  lead: { fontSize: 17, color: colors.ink, textAlign: 'center', marginVertical: 14, lineHeight: 25 },
  bundle: { width: 190, height: 170, borderRadius: 60, backgroundColor: '#3f6f8f', alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: '#2b4f66', marginVertical: 18 },
  knot: { position: 'absolute', top: -14, width: 46, height: 34, borderRadius: 16, backgroundColor: '#2b4f66' },
  knotL: { position: 'absolute', top: -26, left: 52, width: 40, height: 26, borderRadius: 14, backgroundColor: '#3f6f8f', transform: [{ rotate: '-30deg' }] },
  knotR: { position: 'absolute', top: -26, right: 52, width: 40, height: 26, borderRadius: 14, backgroundColor: '#3f6f8f', transform: [{ rotate: '30deg' }] },
  bundleTxt: { fontSize: 54, color: '#f6efe0' },
  hint: { fontSize: 15, color: colors.ink, marginTop: 4 },
  small: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  card: { backgroundColor: colors.paper, borderRadius: 14, borderWidth: 3, padding: 8, paddingTop: 0, overflow: 'hidden' },
  rareBand: { marginHorizontal: -8, marginBottom: 6, paddingVertical: 3, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  rareTxt: { fontSize: 11, color: '#1b2227', fontWeight: '700' },
  newTxt: { fontSize: 11, color: '#fff', fontWeight: '700', backgroundColor: '#b3322b', paddingHorizontal: 5, borderRadius: 6, overflow: 'hidden' },
  cardName: { fontSize: 13, color: colors.ink, fontWeight: '700', marginTop: 6, lineHeight: 17 },
  cardMeta: { fontSize: 11, color: colors.muted, marginTop: 2 },
  slotRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  slotChip: { fontSize: 10, color: colors.ink, backgroundColor: colors.accentSoft, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  btns: { gap: 10, marginTop: 18 },
  series: { marginTop: 16, width: '100%', maxWidth: 420, backgroundColor: '#20303c', borderRadius: 14, padding: 12, gap: 2 },
  onDark: { color: '#c8d3d8', textAlign: 'left' },
  seriesH: { color: '#f6e7c4', fontSize: 15, fontWeight: '700' },
  codeBox: { marginTop: 26, width: '100%', maxWidth: 420, backgroundColor: colors.paper, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.borderSoft },
  codeH: { fontSize: 14, fontWeight: '700', color: colors.ink },
  codeRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  codeInput: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: colors.ink, fontSize: 15 },
  codeMsg: { fontSize: 13, color: colors.accent, marginTop: 6, textAlign: 'center' },
});
