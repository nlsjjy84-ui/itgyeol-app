import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import Text from '../ui/Text';
import Frame from '../ui/Frame';
import ScreenHeader from '../ui/ScreenHeader';
import { colors, fonts } from '../theme';
import { t } from '../i18n';
import { play } from '../utils/sound';
import { comma } from '../utils/order';
import { STAGES, STAGE_NAME, METHODS, advance, readyText } from '../utils/orders';
import { onOrders, saveOrder } from '../utils/orderStore';

// 업체 화면(시연) — 결제가 끝난 주문이 제작 사양서와 함께 여기로 들어온다.
// 업체가 "만들기 시작 → 다 만들었어요"를 누르면 손님의 결과 화면 진행 표시도 같이 바뀐다.
// 지금은 같은 기기 안에서 도는 모의 연결이다(실제로는 업체 주문 접수 시스템과 잇는 자리).
const NAMES = {
  photo: '깜짝 사진 엽서 2장', badge: '나만의 배지', keyring: '맞춤 키링', stamp: '나만의 낙관 도장', sumak: '나만의 수막새',
  paperweight: '나만의 문진', coaster: '나만의 코스터', bookmark: '나만의 책갈피', model: '3D 모형',
  fan: '접부채', towel: '수건', cup: '백자 잔', spoonrest: '수저받침',
  hanky: '손수건', scarf: '스카프', pouch: '파우치', postcard: '엽서', frame: '작은 액자',
};
const NEXT_LABEL = { sent: '만들기 시작', making: '다 만들었어요' };
const when = (ms) => {
  const d = new Date(ms);
  return `${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export default function MakerScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [open, setOpen] = useState(null);
  useEffect(() => onOrders(setOrders), []);
  const list = [...orders].sort((a, b) => b.log[0].at - a.log[0].at);
  const waiting = list.filter((o) => o.stage === 'sent' || o.stage === 'making').length;

  return (
    <SafeAreaView style={st.safe}>
      <ScrollView contentContainerStyle={st.content}>
        <ScreenHeader title="업체 화면 (시연)" sub={t('결제가 끝난 주문이 제작 사양서와 함께 들어와요')} onBack={() => navigation.goBack()} />
        <Text style={st.h}>{t('만들 주문 {n}건 · 모두 {m}건', { n: waiting, m: list.length })}</Text>
        {list.length === 0 ? (
          <Frame style={{ marginTop: 8 }}>
            <Text style={st.body}>{t('아직 들어온 주문이 없어요. 결과 화면에서 주문표를 만들고 결제(모의)하면 여기로 들어와요.')}</Text>
          </Frame>
        ) : null}
        <View style={st.list}>
          {list.map((o) => (
            <Frame key={o.no}>
              <View style={st.top}>
                <Text style={st.no}>{o.no}</Text>
                <Text style={[st.badge, o.stage === 'canceled' ? st.badgeOff : o.stage === 'ready' ? st.badgeDone : null]}>
                  {t(o.stage === 'ready' ? readyText(o) : STAGE_NAME[o.stage])}
                </Text>
              </View>
              <Text style={st.meta}>{t('결제 번호')} {o.payRef} · {t(METHODS[o.method])} · {when(o.log[0].at)}</Text>
              <Text style={st.meta}>{o.how === 'post' ? t('택배로 보내기') : t('굿즈숍에서 찾아감')}</Text>
              {o.items.map((it) => (
                <View key={it.key} style={st.row}>
                  <Text style={st.item}>{t(NAMES[it.key] || it.key)}</Text>
                  <Text style={st.item}>{t('{n}원', { n: comma(it.price) })}</Text>
                </View>
              ))}
              <View style={[st.row, st.sum]}>
                <Text style={st.sumTxt}>{t('합계(택배비 포함)')}</Text>
                <Text style={st.sumTxt}>{t('{n}원', { n: comma(o.total) })}</Text>
              </View>
              {o.spec ? (
                <Pressable onPress={() => { play('tap'); setOpen(open === o.no ? null : o.no); }} hitSlop={8}>
                  <Text style={st.link}>{open === o.no ? t('제작 사양서 접기') : t('제작 사양서 보기 ›')}</Text>
                </Pressable>
              ) : null}
              {open === o.no && o.spec ? <Text style={st.spec} selectable>{o.spec}</Text> : null}
              {NEXT_LABEL[o.stage] ? (
                <Pressable
                  style={st.btn}
                  onPress={() => {
                    play('stamp');
                    saveOrder(advance(o));
                  }}
                >
                  <Text style={st.btnTxt}>{t(NEXT_LABEL[o.stage])}</Text>
                </Pressable>
              ) : null}
              <View style={st.log}>
                {o.log.map((l, i) => (
                  <Text key={`${l.stage}${i}`} style={st.logTxt}>
                    {when(l.at)} · {t(l.stage === 'ready' ? readyText(o) : STAGE_NAME[l.stage])}
                  </Text>
                ))}
              </View>
            </Frame>
          ))}
        </View>
        <Text style={st.note}>
          {t('시연용 화면이에요. 실제로는 결제사 승인 뒤 업체 주문 접수 시스템으로 넘어가고, 여러 사람의 책갈피처럼 한 판에 모아 만드는 물건은 업체가 모아서 제작해요.')}
        </Text>
        <Text style={st.note}>{t('진행 순서')}: {STAGES.map((s) => t(STAGE_NAME[s])).join(' → ')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, paddingBottom: 40 },
  h: { fontSize: 14, fontWeight: '800', color: colors.ink, marginTop: 14 },
  body: { fontSize: 12.5, color: colors.ink, lineHeight: 19 },
  list: { gap: 10, marginTop: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  no: { fontSize: 16, fontFamily: fonts.serifBold, color: colors.ink },
  badge: { fontSize: 11, fontWeight: '800', color: colors.baek, backgroundColor: colors.hwang, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, overflow: 'hidden' },
  badgeDone: { backgroundColor: colors.green },
  badgeOff: { backgroundColor: colors.muted },
  meta: { fontSize: 11.5, color: colors.muted, marginTop: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  item: { fontSize: 13, color: colors.ink },
  sum: { borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: 6 },
  sumTxt: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  link: { fontSize: 12.5, fontWeight: '800', color: colors.accent, marginTop: 10 },
  spec: { fontSize: 11.5, lineHeight: 17, color: colors.ink, marginTop: 6, padding: 10, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 4, backgroundColor: colors.paper },
  btn: { marginTop: 12, backgroundColor: colors.accent, borderRadius: 4, paddingVertical: 11, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  log: { marginTop: 10, gap: 2 },
  logTxt: { fontSize: 11, color: colors.muted },
  note: { fontSize: 11.5, color: colors.muted, marginTop: 14, lineHeight: 17 },
});
