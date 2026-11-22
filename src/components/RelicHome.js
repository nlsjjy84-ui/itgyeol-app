import React from 'react';
// 홈 — 내 유물(도감)·오늘의 보따리·이어 오기. 2026-11-22 새 설계: 합체는 빼고, 놀이로 얻은 유물을 모으는 칸만 남김.
import { View, StyleSheet } from 'react-native';
import Text from '../ui/Text';
import Frame from '../ui/Frame';
import SealButton from '../ui/SealButton';
import { colors } from '../theme';
import { t } from '../i18n';
import { usePieces, dailyState } from '../utils/pieceStore';
import { PIECES } from '../data/pieces';


// 이번 주 이어 오기 줄 — 지난 7일 중 보따리를 받은 날은 채운 동그라미, 쉼표 부적 수
function StreakRow() {
  const ds = dailyState();
  const cells = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    cells.push({ key, on: ds.days.includes(key), today: i === 0 });
  }
  const left = 7 - (ds.nextStreak % 7 || 7);
  return (
    <View style={st.streak} testID="streak-row">
      <View style={st.dots}>
        {cells.map((c) => (
          <View key={c.key} style={[st.dot, c.on && st.dotOn, c.today && st.dotToday]} />
        ))}
      </View>
      <Text style={st.streakTxt}>
        {t('{n}일째 이어 오는 중', { n: ds.ready ? ds.streak : ds.streak })} · {t('쉼표 부적 {m}개', { m: ds.charms })}
        {ds.ready && ds.useCharms ? ' · ' + t('빠진 날을 부적이 지켜 줄 거예요') : ''}
        {ds.ready && ds.lost ? ' · ' + t('이어 오던 {n}일이 끊겼어요. 오늘부터 다시!', { n: ds.lost }) : ''}
      </Text>
      <Text style={st.streakSub}>{left ? t('{n}일 더 오면 「아주 귀함」 유물과 쉼표 부적', { n: left }) : t('오늘 오면 「아주 귀함」 유물과 쉼표 부적')}</Text>
    </View>
  );
}

export default function RelicHome({ navigation }) {
  const store = usePieces();
  const owned = Object.keys(store.owned || {}).length;
  return (
    <Frame accent="#e0a43a" style={{ marginTop: 18 }}>
      <Text style={st.eyebrow}>{t('내 유물')}</Text>
      <Text style={st.title}>{t('놀이로 모은 진짜 유물 {m}점', { m: owned })}</Text>
      <Text style={st.desc}>{t('판을 깨면 국립중앙박물관 등 박물관의 진짜 유물을 받아요. 나의 박물관에 전시하고, 유물의 쓰임과 뜻에서 오늘 쓰는 물건을 만들어요.')}</Text>
      <View style={st.btns}>
        {owned && (dailyState().streak > 0 || dailyState().days.length > 0) ? <StreakRow /> : null}
        {owned && dailyState().ready ? (
          <SealButton label={t('오늘의 보따리 받기 — {n}일째', { n: dailyState().nextStreak })} onPress={() => navigation.navigate('Pack', { daily: true })} />
        ) : owned ? (
          <Text style={st.count}>{t('오늘의 보따리는 받았어요 · {n}일째 이어서', { n: dailyState().streak })}</Text>
        ) : null}
        {owned ? <SealButton label={t('나의 박물관 — 전시하고 물건 만들기')} onPress={() => navigation.navigate('Museum')} /> : null}
        <View style={st.row}>
          <SealButton style={{ flex: 1 }} label={t('유물 도감')} variant="ink" onPress={() => navigation.navigate('Dex')} />
          {owned ? <SealButton style={{ flex: 1 }} label={t('유물 수수께끼')} variant="paper" onPress={() => navigation.navigate('Riddle')} /> : null}
        </View>
      </View>
    </Frame>
  );
}

const st = StyleSheet.create({
  streak: { alignItems: 'center', gap: 4, marginBottom: 4 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#e0a43a' },
  dotOn: { backgroundColor: '#e0a43a' },
  dotToday: { transform: [{ scale: 1.25 }] },
  streakTxt: { fontSize: 13, color: colors.ink, textAlign: 'center' },
  streakSub: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  eyebrow: { fontSize: 12, fontWeight: '700', color: '#b9781a' },
  title: { fontSize: 19, fontWeight: '700', color: colors.ink, marginTop: 2 },
  desc: { fontSize: 14, color: colors.ink, marginTop: 6, lineHeight: 21 },
  count: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 8 },
  btns: { gap: 8, marginTop: 10 },
  row: { flexDirection: 'row', gap: 8 },
});
