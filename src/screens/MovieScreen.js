// 합체 영상 — 조각이 날아와 합체하는 짧은 영상과 자동 자막(풍이·결이의 이야기).
// 영상 아래에는 이야기 전체, 들어간 진짜 유물(박물관 원본 링크), 영상·자막 파일 저장, 이 작품으로 만들 수 있는 물건.
import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView, useWindowDimensions, Image, Pressable, Linking, Platform } from 'react-native';
import Text from '../ui/Text';
import ScreenHeader from '../ui/ScreenHeader';
import SealButton from '../ui/SealButton';
import HapcheStage from '../components/HapcheStage';
import { colors } from '../theme';
import { t } from '../i18n';
import { pieceName } from '../utils/pieceName';
import { buildTimeline, beatsOf, judge } from '../utils/hapche';
import { play } from '../utils/sound';
import { saveWork, usePieces } from '../utils/pieceStore';
import { PIECE_BY_K } from '../data/pieces';
import { SLOT_INFO } from '../data/frames';
import { canExport, exportMovie, downloadBlob, srtOf, paperKit } from '../utils/movieExport';
import { movieUrl } from '../utils/movieLink';
import QRCode from 'react-native-qrcode-svg';

// 이 작품으로 만들 수 있는 물건 — 앱은 "제시"까지, 실제 제작은 박물관·업체가 맡는다
const GOODS = [
  { id: 'paperkit', name: '종이 변형 키트', note: '조각마다 오려 접어 끼우는 종이 모형 — 영상 속 순서대로 합체해 본다' },
  { id: 'badge', name: '합체 배지 세트', note: '조각 하나하나가 배지 — 가방에 순서대로 달면 작품이 된다' },
  { id: 'sticker', name: '조각 스티커(띠부씰)', note: '도감 번호가 붙은 떼었다 붙였다 스티커, 무엇이 나올지 모르는 봉투' },
  { id: 'keyring', name: '작품 키링', note: '완성된 작품 모양 그대로 투명 아크릴·풀컬러 3D 출력' },
  { id: 'card', name: '영상 카드', note: '작품 사진 + QR — 찍으면 이 합체 영상이 다시 재생된다' },
];

export default function MovieScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const store = usePieces();
  const { frameId, assign = {}, seed = 1, scene = '', saved, shared, layout } = route.params || {};
  const tl = useMemo(() => buildTimeline(frameId, assign, { seed, scene, layout }), [frameId, assign, seed, scene, layout]);
  const [savedId, setSavedId] = useState(saved || null);
  // 장단 합체 — 조각이 끼워지는 박에 맞춰 톡!
  const [rhythm, setRhythm] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const [pop, setPop] = useState(null); // {txt, at}
  const [result, setResult] = useState(null);
  const timeRef = useRef(0);
  const taps = useRef([]);
  const armed = useRef(false); // 다시 처음부터 재생되기 시작한 뒤에만 판정한다
  const beats = useMemo(() => beatsOf(tl), [tl]);
  const startRhythm = () => {
    taps.current = [];
    armed.current = false;
    setResult(null);
    setPop(null);
    setRhythm(true);
    setPlayKey((x) => x + 1);
  };
  const onTap = () => {
    if (!armed.current) return;
    const now = timeRef.current;
    taps.current.push(now);
    const near = beats.reduce((b, x) => (Math.abs(x - now) < Math.abs(b - now) ? x : b), beats[0] || 0);
    const d = Math.abs(near - now);
    const txt = d <= 0.12 ? t('얼쑤!') : d <= 0.25 ? t('좋다!') : t('조금 빨라요/느려요');
    if (d <= 0.25) play('clank');
    const id = Date.now();
    setPop({ txt, at: now, great: d <= 0.12, id });
    setTimeout(() => setPop((pp) => (pp && pp.id === id ? null : pp)), 650);
  };
  const onTime = (x) => {
    timeRef.current = x;
    if (rhythm && !armed.current && x < 1) armed.current = true;
    if (rhythm && armed.current && !result && x >= tl.lockT + 0.3) {
      const j = judge(beats, taps.current);
      setResult(j);
      setRhythm(false);
    }
  };
  const [rec, setRec] = useState(null); // null | number(진행률) | {url, ext} | 'fail'
  const size = Math.min(width - 24, 620);
  const parts = [...new Set(tl.events.map((e) => e.k))].map((k) => ({ k, p: PIECE_BY_K[k], slots: [...new Set(tl.events.filter((e) => e.k === k).map((e) => e.slot).filter(Boolean))] }));

  const onSave = () => {
    const w = saveWork({ id: savedId || undefined, frameId, assign: frameId === 'free' ? Object.fromEntries((layout || []).map((it, i) => ['p' + i, it.k])) : assign, layout, seed, scene, title: tl.title.full });
    setSavedId(w.id);
  };
  const link = movieUrl({ frameId, assign, seed, layout });
  const [copied, setCopied] = useState(false);
  const back = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Home'));
  const onExport = async (vertical) => {
    setRec(0);
    const r = await exportMovie(tl, { size: 720, vertical: !!vertical, onProgress: (x) => setRec(x) });
    if (!r.ok) {
      setRec('fail');
      return;
    }
    setRec(r);
    downloadBlob(r.url, `잇결_${tl.title.short}${vertical ? '_세로' : ''}.${r.ext}`);
  };
  const onSrt = () => {
    if (Platform.OS !== 'web') return;
    const blob = new Blob([srtOf(tl)], { type: 'text/plain;charset=utf-8' });
    downloadBlob(URL.createObjectURL(blob), `잇결_${tl.title.short}.srt`);
  };

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.wrap}>
        <ScreenHeader title={tl.isTransform ? t('변형 영상') : t('합체 영상')} sub={tl.title.full} onBack={back} />
        {shared ? (
          <View style={st.sharedBox}>
            <Text style={st.sharedTxt}>{t('누군가 보낸 합체 영상이에요. 진짜 박물관 유물 조각으로 만들었어요.')}</Text>
            <SealButton label={t('나도 만들어 보기 — 첫 보따리 받기')} onPress={() => navigation.navigate('Pack')} />
          </View>
        ) : null}
        <HapcheStage
          tl={tl}
          size={size}
          playKey={playKey}
          onTime={onTime}
          overlay={
            rhythm ? (
              <Pressable onPressIn={onTap} style={StyleSheet.absoluteFill} accessibilityLabel={t('장단 맞춰 톡')}>
                <View style={st.beatHint} pointerEvents="none">
                  <Text style={st.beatHintTxt}>{t('조각이 철컥 끼워질 때 톡!')}</Text>
                </View>
                {pop ? (
                  <View style={st.popBox} pointerEvents="none">
                    <Text style={[st.popTxt, pop.great && { color: '#ffd45a' }]}>{pop.txt}</Text>
                  </View>
                ) : null}
              </Pressable>
            ) : null
          }
        />
        <View style={st.btns}>
          <SealButton label={rhythm ? t('장단 합체 중… 박에 맞춰 톡!') : t('장단 맞춰 합체하기 — 끼워질 때 톡!')} variant="ink" disabled={rhythm} onPress={startRhythm} sound="drum" />
          {result ? (
            <View style={st.result}>
              <Text style={st.resultRank} brush>
                {t('장단 등급')}: {t(result.rank)}
              </Text>
              <Text style={st.resultTxt}>
                {t('얼쑤 {a} · 좋다 {b} · 놓침 {c}', { a: result.great, b: result.good, c: result.miss })}
              </Text>
              <Text style={st.resultTxt}>{t('조각 {n}번이 장구 박에 맞춰 끼워졌어요.', { n: beats.length })}</Text>
            </View>
          ) : null}
        </View>
        <View style={st.btns}>
          <SealButton label={savedId ? t('내 작품에 저장했어요 ✓') : t('내 작품에 저장')} onPress={onSave} disabled={!!savedId && !saved} sound="stamp" />
          {canExport() ? (
            <SealButton
              label={typeof rec === 'number' ? t('영상 만드는 중… {n}%', { n: Math.round(rec * 100) }) : rec && rec.url ? t('영상 파일 다시 받기') : t('영상 파일로 저장 (자막 포함)')}
              variant="ink"
              disabled={typeof rec === 'number'}
              onPress={() => (rec && rec.url ? downloadBlob(rec.url, `잇결_${tl.title.short}.${rec.ext}`) : onExport(false))}
            />
          ) : (
            <Text style={st.note}>{t('영상 파일 저장은 웹(박물관 키오스크·브라우저)에서 할 수 있어요.')}</Text>
          )}
          {rec === 'fail' && <Text style={st.note}>{t('이 브라우저에서는 영상 저장이 안 돼요. 크롬이나 엣지에서 다시 해 보세요.')}</Text>}
          {canExport() && typeof rec !== 'number' ? <SealButton label={t('세로 영상으로 저장 (쇼츠·릴스용)')} variant="ink" onPress={() => onExport(true)} /> : null}
          {Platform.OS === 'web' && <SealButton label={t('자막 파일(.srt) 받기')} variant="paper" onPress={onSrt} />}
          {Platform.OS === 'web' && (
            <SealButton
              label={t('종이 변형 키트 도안 받기 (A4)')}
              variant="paper"
              onPress={async () => {
                const url = await paperKit(tl);
                if (url) downloadBlob(url, `잇결_종이키트_${tl.title.short}.png`);
              }}
            />
          )}
        </View>

        <Text style={st.h}>{t('영상 나누기')}</Text>
        <View style={st.share}>
          <View style={st.qr}>
            <QRCode value={link} size={120} color="#1b2227" backgroundColor="#ffffff" />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={st.shareTxt}>{t('QR을 찍거나 링크를 열면 누구나 이 합체 영상을 그대로 볼 수 있어요. 영상 카드에 이 QR이 들어가요.')}</Text>
            {Platform.OS === 'web' ? (
              <SealButton
                small
                label={copied ? t('링크를 복사했어요 ✓') : t('링크 복사')}
                variant="paper"
                onPress={() => {
                  try {
                    navigator.clipboard.writeText(link).then(() => setCopied(true));
                  } catch (e) {
                    setCopied(false);
                  }
                }}
              />
            ) : null}
          </View>
        </View>

        <Text style={st.h}>{t('이야기')}</Text>
        <View style={st.story}>
          {tl.subs.map((s, i) => (
            <Text key={i} style={st.line}>
              <Text style={[st.who, { color: s.who === '풍이' ? '#b9781a' : s.who === '결이' ? '#2b6f9e' : colors.accent }]}>{t(s.who)} </Text>
              {s.text}
            </Text>
          ))}
        </View>

        <Text style={st.h}>{t('이 작품에 들어간 진짜 유물 {n}점', { n: parts.length })}</Text>
        {parts.map(({ k, p, slots }) => (
          <Pressable key={k} style={st.part} onPress={() => Linking.openURL(p.page)}>
            <Image source={p.img} style={st.partImg} resizeMode="contain" />
            <View style={{ flex: 1 }}>
              <Text style={st.partName}>{pieceName(p)}</Text>
              <Text style={st.partMeta}>{[t(p.era), t(p.by), p.use].filter(Boolean).join(' · ')}</Text>
              {!!slots.length && (
                <Text style={st.partSlot}>
                  {slots.map((s) => `${(SLOT_INFO[s] || {}).icon || ''} ${t(s)} — ${t((SLOT_INFO[s] || {}).say || '')}`).join('   ')}
                </Text>
              )}
            </View>
            <Text style={st.link}>{t('원본 ↗')}</Text>
          </Pressable>
        ))}
        <Text style={st.lic}>{t('유물 사진: {a} (공공누리 제1유형, 출처 표시) — 배경만 지우고 모양은 그대로 썼어요.', { a: tl.museums.join('·') })}</Text>

        <Text style={st.h}>{t('이 작품으로 만들 수 있는 것')}</Text>
        {GOODS.map((g) => (
          <View key={g.id} style={st.good}>
            <Text style={st.goodName}>{t(g.name)}</Text>
            <Text style={st.goodNote}>{t(g.note)}</Text>
          </View>
        ))}
        <Text style={st.lic}>{t('실제 제작·판매는 박물관 상품관과 제작 업체가 맡아요. 잇결은 작품과 설계까지 만들어요.')}</Text>

        <View style={[st.btns, { marginTop: 18 }]}>
          <SealButton label={t('다른 틀로 다시 합체')} onPress={() => navigation.navigate('Workshop', { mode: frameId === 'free' ? 'free' : tl.isTransform ? 'transform' : 'hapche' })} />
          <SealButton label={t('조각 도감')} variant="ink" onPress={() => navigation.navigate('Dex')} />
          <SealButton label={t('홈으로')} variant="paper" onPress={() => navigation.navigate('Home')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  wrap: { padding: 12, paddingBottom: 60, maxWidth: 760, width: '100%', alignSelf: 'center' },
  btns: { gap: 10, marginTop: 14 },
  beatHint: { position: 'absolute', top: 10, right: 10, backgroundColor: '#b3322bdd', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  beatHintTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  popBox: { position: 'absolute', top: '38%', left: 0, right: 0, alignItems: 'center' },
  popTxt: { fontSize: 34, fontWeight: '800', color: '#ffffff', textShadowColor: '#000', textShadowRadius: 8 },
  result: { backgroundColor: '#20303c', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4 },
  resultRank: { color: '#ffd45a', fontSize: 24 },
  resultTxt: { color: '#e8eef2', fontSize: 14 },
  sharedBox: { backgroundColor: '#20303c', borderRadius: 14, padding: 12, gap: 8, marginBottom: 10 },
  sharedTxt: { color: '#f6e7c4', fontSize: 14, lineHeight: 20 },
  share: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.paper, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.borderSoft },
  qr: { padding: 6, backgroundColor: '#fff', borderRadius: 8 },
  shareTxt: { fontSize: 13, color: colors.ink, lineHeight: 19 },
  note: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  h: { fontSize: 17, fontWeight: '700', color: colors.ink, marginTop: 22, marginBottom: 8 },
  story: { backgroundColor: colors.paper, borderRadius: 14, padding: 14, gap: 8, borderWidth: 1, borderColor: colors.borderSoft },
  line: { fontSize: 15, color: colors.ink, lineHeight: 23 },
  who: { fontWeight: '700' },
  part: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.paper, borderRadius: 12, padding: 8, marginBottom: 6, borderWidth: 1, borderColor: colors.borderSoft },
  partImg: { width: 58, height: 58 },
  partName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  partMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  partSlot: { fontSize: 12, color: colors.ink, marginTop: 3 },
  link: { fontSize: 12, color: colors.cheong },
  lic: { fontSize: 11, color: colors.muted, marginTop: 6, lineHeight: 16 },
  good: { backgroundColor: colors.paper, borderRadius: 12, padding: 10, marginBottom: 6, borderLeftWidth: 4, borderLeftColor: colors.hwang },
  goodName: { fontSize: 14, fontWeight: '700', color: colors.ink },
  goodNote: { fontSize: 13, color: colors.muted, marginTop: 2, lineHeight: 18 },
});
