import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Text from '../ui/Text';
import Frame from '../ui/Frame';
import ScreenHeader from '../ui/ScreenHeader';
import { colors, fonts } from '../theme';
import { t } from '../i18n';
import { SITE_URL } from '../utils/carry';

// 줄이 길 때 키오스크·입구에 띄우는 안내판 — 네 언어를 한 화면에 같이 보여 준다(언어 버튼을 누를 필요 없이).
const LINES = [
  ['줄 서지 말고 내 폰으로', '구경하면서 3~5분, 결과물은 굿즈숍에서 찾거나 택배로 받아요.'],
  ['Skip the line — play on your phone', 'Play 3–5 minutes while you look around. Pick up at the gift shop or get it delivered.'],
  ['不用排队，用手机玩', '边参观边玩3~5分钟，作品可在纪念品店领取或快递到家。'],
  ['並ばずにスマホで', '見学しながら3~5分。作品はショップで受け取るか宅配で。'],
];

export default function KioskScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const qr = Math.min(260, Math.max(180, width - 140));
  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.content}>
        <ScreenHeader title="내 폰으로 하기" sub={t('키오스크·입구에 띄우는 안내판')} onBack={() => navigation.goBack()} />
        <Frame style={{ marginTop: 10, alignItems: 'center' }}>
          <View style={st.qrBox}>
            <QRCode value={SITE_URL} size={qr} color="#1b2227" backgroundColor="#ffffff" />
          </View>
          <Text style={st.url} selectable>{SITE_URL}</Text>
        </Frame>
        <View style={st.lines}>
          {LINES.map(([h, s]) => (
            <View key={h} style={st.line}>
              <Text style={st.lh}>{h}</Text>
              <Text style={st.ls}>{s}</Text>
            </View>
          ))}
        </View>
        <Text style={st.note}>{t('설치할 필요 없이 폰 브라우저에서 바로 열려요. 키오스크는 폰이 없거나 어린이·어르신이 쓰는 자리로 남겨 둬요.')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingBottom: 40 },
  qrBox: { padding: 12, backgroundColor: '#ffffff', borderRadius: 4, alignSelf: 'center' },
  url: { fontSize: 11.5, color: colors.muted, marginTop: 8, textAlign: 'center' },
  lines: { marginTop: 14, gap: 10 },
  line: { borderLeftWidth: 4, borderLeftColor: colors.accent, paddingLeft: 12, paddingVertical: 2 },
  lh: { fontSize: 18, fontFamily: fonts.serifBold, color: colors.ink },
  ls: { fontSize: 12.5, color: colors.muted, marginTop: 2, lineHeight: 18 },
  note: { fontSize: 12, color: colors.muted, marginTop: 16, lineHeight: 18 },
});
