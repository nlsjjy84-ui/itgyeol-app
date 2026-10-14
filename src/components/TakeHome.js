import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput } from 'react-native';
import Text from '../ui/Text';
import Frame from '../ui/Frame';
import { colors, fonts } from '../theme';
import { t, getLang } from '../i18n';
import { play } from '../utils/sound';

// 결과 화면 "가져가는 방법" — 싼 것부터 차례로(무료 저장 → 사진 → 키링 → 3D 모형).
// 받는 방법(굿즈숍에서 찾기 / 택배), 전시 동의를 여기서 고른다.
// 가격은 사업성 검토의 가정값이고, 실제 결제·제작은 박물관 굿즈숍과 연결 업체가 맡는다(앱은 주문표까지).
import { PRICES, orderTotal, orderItems, orderNumber, comma, ORDER_KEYS } from '../utils/order';

const won = (n) => t('{n}원', { n: comma(n) });

function Rung({ on, onPress, title, price, desc, free }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={free}
      style={[styles.rung, on && styles.rungOn, free && styles.rungFree]}
      accessibilityRole={free ? undefined : 'checkbox'}
      accessibilityState={free ? undefined : { checked: on }}
    >
      <View style={[styles.box, on && styles.boxOn, free && styles.boxFree]}>
        <Text style={styles.boxMark}>{free || on ? '✓' : ''}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.rungTitle}>{title}</Text>
        <Text style={styles.rungDesc}>{desc}</Text>
      </View>
      <Text style={[styles.price, free && { color: colors.green }]}>{price}</Text>
    </Pressable>
  );
}

export const COUNTRIES = ['한국', '미국', '중국', '일본', '그 밖의 나라'];
const DEFAULT_COUNTRY = { ko: '한국', zh: '중국', ja: '일본' };

// entry: 이 작품의 전시 신청(없으면 null). onExhibit(patch) — patch가 null이면 신청 취소.
export default function TakeHome({ code, shapeLabel, product, printable = true, entry, onExhibit, onHall }) {
  const exhibitOn = !!entry;
  const [pick, setPick] = useState({});
  const [how, setHow] = useState('shop');
  const [sheet, setSheet] = useState(false);
  const toggle = (k) => {
    play('tap');
    setSheet(false);
    setPick((p) => ({ ...p, [k]: !p[k] }));
  };
  const total = orderTotal(pick);
  const chosen = orderItems(pick);
  const orderNo = orderNumber(code);
  const NAMES = {
    photo: t('깜짝 사진 엽서 2장'), badge: t('나만의 배지'), keyring: t('맞춤 키링'), stamp: t('나만의 낙관 도장'), sumak: t('나만의 수막새'),
    paperweight: t('나만의 문진'), coaster: t('나만의 코스터'), bookmark: t('나만의 책갈피'), model: t('3D 모형'),
    fan: t('접부채'), towel: t('수건'), cup: t('백자 잔'), spoonrest: t('수저받침'),
  };
  const DESC = {
    badge: t('위에서 고른 {s}를 지름 약 3cm로 출력하고 뒤에 쇠 핀을 달아요.', { s: shapeLabel }),
    keyring: t('위에서 고른 {s}를 약 4.5cm 입체로 출력해요. 술과 매듭은 진짜 실이에요.', { s: shapeLabel }),
    sumak: t('위에서 고른 {s}를 지름 약 4.5cm로 출력하고 뒤에 자석을 붙여요.', { s: shapeLabel }),
    model: t('위에서 돌려 본 {s} 그대로, 높이 약 5cm 실물이에요.', { s: shapeLabel }),
    fan: t('한지에 내 무늬를 인쇄해 대나무 살에 붙여요.'),
    towel: t('면 수건에 내 무늬를 날염해요.'),
    stamp: t('위에서 고른 {s}를 약 2×2×4cm로 출력해요. 도장면 글자는 찍으면 바로 읽혀요.', { s: shapeLabel }),
    paperweight: t('위에서 고른 {s}를 높이 약 7cm로 출력해요.', { s: shapeLabel }),
    coaster: t('위에서 고른 {s}를 지름 약 9cm로 출력해요.', { s: shapeLabel }),
    bookmark: t('위에서 고른 {s}를 얇은 황동 판으로 잘라 만들고 진짜 술을 달아요.', { s: shapeLabel }),
    cup: t('백자 잔에 내 무늬 띠와 낙관을 전사지로 구워 입혀요.'),
    spoonrest: t('백자 수저받침에 내 무늬와 낙관을 전사지로 구워 입혀요.'),
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{t('가져가는 방법')}</Text>
      <Text style={styles.sub}>{t('싼 것부터 골라요. 여러 개 골라도 돼요.')}</Text>

      <View style={styles.list}>
        <Rung free title={t('이미지·QR 저장')} price={t('무료')} desc={t('위에서 바로 저장해요. 누구나.')} />
        <Rung on={pick.photo} onPress={() => toggle('photo')} title={t('깜짝 사진 엽서 2장')} price={won(PRICES.photo)} desc={t('놀이 중 찍어 둔 깜짝 선물 사진(없으면 굿즈숍 사진 기계에서 찍은 사진)을 엽서 크기로 뽑아요.')} />
        {product ? (
          <Rung on={!!pick[product]} onPress={() => toggle(product)} title={NAMES[product]} price={won(PRICES[product])} desc={DESC[product]} />
        ) : null}
        {ORDER_KEYS.filter((k) => k !== 'photo' && k !== product && pick[k]).map((k) => (
          <Rung key={k} on onPress={() => toggle(k)} title={NAMES[k]} price={won(PRICES[k])} desc={t('앞에서 담아 둔 물건이에요. 누르면 빠져요.')} />
        ))}
      </View>
      <Text style={styles.sub}>
        {printable
          ? t('배지·키링·도장·수막새·문진·코스터·3D 모형은 풀컬러 3D 프린팅이에요. 화면의 모양은 1.5mm보다 얇은 곳을 두껍게 다듬은 출력용 모양이라, 받는 물건과 같아요.')
          : product === 'bookmark'
            ? t('책갈피는 황동 판을 화면의 윤곽 그대로 잘라 만들어요. 3D 출력으로는 너무 얇아서예요.')
            : product === 'cup' || product === 'spoonrest'
              ? t('잔·수저받침은 입과 음식이 닿아 3D 출력 대신 백자에 무늬를 전사지로 구워 입혀요.')
              : t('부채·수건은 화면의 무늬 그림을 그대로 인쇄해요.')}
      </Text>

      <Text style={styles.label}>{t('받는 방법')}</Text>
      <View style={styles.howRow}>
        {[
          ['shop', t('굿즈숍에서 찾기'), t('구경하고 계산대에서 받아요')],
          ['post', t('택배로 받기'), t('집으로 보내요 · 택배비 따로')],
        ].map(([id, name, hint]) => (
          <Pressable key={id} onPress={() => { play('tap'); setSheet(false); setHow(id); }} style={[styles.how, how === id && styles.howOn]}>
            <Text style={[styles.howName, how === id && styles.howNameOn]}>{name}</Text>
            <Text style={styles.howHint}>{hint}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable onPress={() => { play(exhibitOn ? 'tap' : 'stamp'); onExhibit(exhibitOn ? null : { nick: '', country: DEFAULT_COUNTRY[getLang()] || '그 밖의 나라' }); }} style={[styles.exhibit, exhibitOn && styles.exhibitOn]}>
        <View style={[styles.box, exhibitOn && styles.boxOn]}>
          <Text style={styles.boxMark}>{exhibitOn ? '✓' : ''}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.rungTitle}>{t('이 작품을 전시해도 돼요')}</Text>
          <Text style={styles.rungDesc}>
            {exhibitOn
              ? t('전시 대기 중이에요. 걸리면 알려 드릴게요. 이름 대신 별명과 나라만 보여요.')
              : t('마음에 들면 박물관 전시 화면에 걸릴 수 있어요. 어린이는 보호자와 함께 골라 주세요.')}
          </Text>
        </View>
      </Pressable>
      {exhibitOn ? (
        <View style={styles.exhibitForm}>
          <Text style={styles.formLabel}>{t('전시에 보일 별명 (안 쓰면 "손님")')}</Text>
          <TextInput
            style={styles.input}
            value={entry.nick || ''}
            maxLength={10}
            onChangeText={(v) => onExhibit({ nick: v })}
            placeholder={t('예: 풍물소녀')}
            placeholderTextColor={colors.muted}
          />
          <Text style={styles.formLabel}>{t('나라')}</Text>
          <View style={styles.countryRow}>
            {COUNTRIES.map((c) => (
              <Pressable key={c} onPress={() => onExhibit({ country: c })} style={[styles.country, entry.country === c && styles.countryOn]}>
                <Text style={[styles.countryTxt, entry.country === c && { color: '#fff' }]}>{t(c)}</Text>
              </Pressable>
            ))}
          </View>
          {onHall ? (
            <Pressable onPress={() => { play('tap'); onHall(); }} hitSlop={8}>
              <Text style={styles.hallLink}>{t('전시관에서 보기 ›')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>{t('합계')}</Text>
        <Text style={styles.total}>{won(total)}</Text>
      </View>
      {how === 'post' && total > 0 ? <Text style={styles.small}>{t('택배비는 결제할 때 따로 붙어요.')}</Text> : null}

      <Pressable
        disabled={total === 0}
        onPress={() => { play('stamp'); setSheet(true); }}
        style={[styles.btn, total === 0 && { opacity: 0.45 }]}
      >
        <Text style={styles.btnText}>{total === 0 ? t('가져갈 것을 골라 주세요') : t('주문표 만들기')}</Text>
      </Pressable>

      {sheet && total > 0 ? (
        <Frame style={{ marginTop: 12, alignSelf: 'stretch' }}>
          <Text style={styles.sheetNo}>{t('주문 번호')} {orderNo}</Text>
          {chosen.map((k) => (
            <View key={k} style={styles.sheetRow}>
              <Text style={styles.sheetItem}>{NAMES[k]}</Text>
              <Text style={styles.sheetItem}>{won(PRICES[k])}</Text>
            </View>
          ))}
          <View style={[styles.sheetRow, { borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: 6, marginTop: 4 }]}>
            <Text style={styles.sheetSum}>{t('합계')}</Text>
            <Text style={styles.sheetSum}>{won(total)}</Text>
          </View>
          <Text style={styles.sheetHow}>
            {how === 'shop'
              ? t('굿즈숍 계산대에서 이 번호를 보여 주세요.')
              : t('결제 화면에서 받을 주소를 적어요. 택배비는 그때 붙어요.')}
          </Text>
          {exhibitOn ? <Text style={styles.sheetHow}>{t('전시 신청도 같이 들어갔어요.')}</Text> : null}
          <Text style={styles.demo}>{t('시연 화면이에요. 실제 결제와 제작은 박물관 굿즈숍과 연결 업체가 맡아요.')}</Text>
        </Frame>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'stretch' },
  title: { fontSize: 16, fontFamily: fonts.serifBold, color: colors.ink, textAlign: 'center' },
  sub: { fontSize: 11.5, color: colors.muted, textAlign: 'center', marginTop: 4 },
  list: { marginTop: 12, gap: 8 },
  rung: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1.5, borderColor: colors.border, borderRadius: 4, backgroundColor: colors.paper },
  rungOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  rungFree: { borderStyle: 'dashed' },
  box: { width: 22, height: 22, borderRadius: 3, borderWidth: 1.5, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  boxFree: { backgroundColor: colors.green, borderColor: colors.green },
  boxMark: { color: '#fff', fontSize: 13, fontWeight: '800', lineHeight: 16 },
  rungTitle: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  rungDesc: { fontSize: 11.5, color: colors.muted, marginTop: 2, lineHeight: 16 },
  price: { fontSize: 14, fontFamily: fonts.serifBold, color: colors.accent },
  label: { fontSize: 12.5, fontWeight: '800', color: colors.ink, marginTop: 16, marginBottom: 6 },
  howRow: { flexDirection: 'row', gap: 8 },
  how: { flex: 1, padding: 10, borderWidth: 1.5, borderColor: colors.border, borderRadius: 4, backgroundColor: colors.paper },
  howOn: { borderColor: colors.ink, borderBottomWidth: 3 },
  howName: { fontSize: 13, fontWeight: '800', color: colors.muted },
  howNameOn: { color: colors.ink },
  howHint: { fontSize: 11, color: colors.muted, marginTop: 2 },
  exhibit: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginTop: 12, borderWidth: 1.5, borderColor: colors.hwang, borderRadius: 4, backgroundColor: colors.paper },
  exhibitOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  exhibitForm: { padding: 12, borderWidth: 1.5, borderTopWidth: 0, borderColor: colors.accent, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, marginTop: -3, backgroundColor: colors.paper },
  formLabel: { fontSize: 11.5, fontWeight: '800', color: colors.ink, marginBottom: 5, marginTop: 4 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: colors.ink, backgroundColor: colors.paper, marginBottom: 6 },
  countryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  country: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  countryOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  countryTxt: { fontSize: 12, fontWeight: '700', color: colors.ink },
  hallLink: { fontSize: 12.5, fontWeight: '800', color: colors.accent, marginTop: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16 },
  totalLabel: { fontSize: 13, fontWeight: '800', color: colors.ink },
  total: { fontSize: 22, fontFamily: fonts.serifBold, color: colors.ink },
  small: { fontSize: 11, color: colors.muted, textAlign: 'right', marginTop: 2 },
  btn: { marginTop: 10, backgroundColor: colors.accent, borderRadius: 4, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  sheetNo: { fontSize: 15, fontFamily: fonts.serifBold, color: colors.accent, marginBottom: 6 },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  sheetItem: { fontSize: 12.5, color: colors.ink },
  sheetSum: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  sheetHow: { fontSize: 12, color: colors.ink, marginTop: 8, lineHeight: 17 },
  demo: { fontSize: 11, color: colors.muted, marginTop: 8, lineHeight: 16 },
});
