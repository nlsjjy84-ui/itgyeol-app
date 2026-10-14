import React, { useEffect, useState } from 'react';
import { View, Pressable, Modal, StyleSheet, ScrollView } from 'react-native';
import Text from '../ui/Text';
import { t } from '../i18n';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { speak } from '../utils/voice';
import { sensesSupported, getConsent, setConsent, onAskConsent, onSensesChange, status } from '../utils/senses';

// 카메라·마이크 동의 창 + 켜져 있는 동안 늘 보이는 표시(누르면 바로 끈다).
// 동의하기 전에는 아무것도 켜지 않는다. 고르지 않고 닫아도 놀이는 그대로 할 수 있다.
export default function SenseLayer() {
  const [open, setOpen] = useState(false);
  const [then, setThen] = useState(null);
  const [cam, setCam] = useState(true);
  const [mic, setMic] = useState(true);
  const [st, setSt] = useState(status());

  useEffect(
    () =>
      onAskConsent((next) => {
        const c = getConsent();
        setCam(c.camera !== false);
        setMic(c.mic !== false);
        setThen(() => next || null);
        setOpen(true);
        speak(t('몸짓과 표정, 감탄사를 작품에 담을까요? 카메라와 마이크를 쓰기 전에 먼저 여쭤봐요.'));
      }),
    []
  );
  useEffect(() => onSensesChange((s) => setSt(s)), []);
  if (!sensesSupported()) return null;

  const close = (choice) => {
    play('tap');
    setConsent(choice);
    setOpen(false);
    if (then) then();
    setThen(null);
  };

  const on = st.camera || st.mic;
  return (
    <>
      {on ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('카메라·마이크 끄기')}
          onPress={() => setConsent({ camera: false, mic: false })}
          style={s.badge}
        >
          <View style={s.dot} />
          <Text style={s.badgeTxt}>
            {st.camera && st.mic ? t('카메라·마이크 켜짐') : st.camera ? t('카메라 켜짐') : t('마이크 켜짐')}
            {'  '}
            {t('끄기')}
          </Text>
        </Pressable>
      ) : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => close({ camera: false, mic: false })}>
        <View style={s.dim}>
          <View style={s.card}>
            <ScrollView>
              <Text style={s.title}>{t('몸짓과 표정, 감탄사를 작품에 담을까요?')}</Text>
              <Text style={s.body}>
                {t('놀이하는 동안 카메라로 몸짓과 표정(웃음·놀람)을, 마이크로 "와!" 같은 감탄사를 알아채 작품 모양에 담아요. 흥이 클수록 테두리 물결이 깊어지고, 웃음과 감탄만큼 둘레 구슬이 늘어나요.')}
              </Text>
              <Choice on={cam} onPress={() => setCam((v) => !v)} title={t('카메라 — 몸짓과 표정')} desc={t('움직임의 크기와 웃는·놀라는 순간을 세고, 반응이 가장 큰 순간을 몇 장 찍어 두었다가 마지막에 깜짝 선물로 보여 드려요. 누구인지 알아보지 않아요.')} />
              <Choice on={mic} onPress={() => setMic((v) => !v)} title={t('마이크 — 감탄사')} desc={t('짧게 터지는 소리의 횟수만 세요. 무슨 말인지 알아듣지 않고 녹음하지 않아요.')} />
              <Text style={s.note}>
                {t('모든 계산은 이 기기 안에서만 해요. 영상과 소리는 녹화하지 않고 어디로도 보내지 않아요. 찍어 둔 사진은 이 기기 메모리에만 있다가, 결과 화면에서 저장하지 않으면 사라져요. QR로 받기를 누를 때만 임시 저장소에 24시간 맡아 둬요. 놀이 화면에서만 켜지고, 위의 표시를 누르면 언제든 꺼져요.')}
              </Text>
            </ScrollView>
            <View style={s.row}>
              <Pressable accessibilityRole="button" style={[s.btn, s.ghost]} onPress={() => close({ camera: false, mic: false })}>
                <Text style={s.ghostTxt}>{t('쓰지 않고 놀기')}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" style={[s.btn, s.primary, !cam && !mic && s.off]} onPress={() => close({ camera: cam, mic })}>
                <Text style={s.primaryTxt}>{cam || mic ? t('허용하고 놀기') : t('둘 다 끄고 놀기')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Choice({ on, onPress, title, desc }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress} style={[s.choice, on && s.choiceOn]}>
      <View style={[s.box, on && s.boxOn]}>{on ? <Text style={s.tick}>✓</Text> : null}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.cTitle}>{title}</Text>
        <Text style={s.cDesc}>{desc}</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  badge: { position: 'absolute', top: 8, right: 8, zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.ink },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  badgeTxt: { color: colors.paper, fontSize: 11.5, fontWeight: '700' },
  dim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 460, maxHeight: '90%', backgroundColor: colors.paper, borderRadius: 6, padding: 18, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 8 },
  body: { fontSize: 13.5, lineHeight: 21, color: colors.ink, marginBottom: 12 },
  choice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 4, borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  choiceOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  box: { width: 22, height: 22, borderRadius: 3, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  tick: { color: '#fff', fontSize: 14, fontWeight: '800' },
  cTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  cDesc: { fontSize: 12.5, lineHeight: 19, color: colors.muted, marginTop: 2 },
  note: { fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 6 },
  row: { flexDirection: 'row', gap: 8, marginTop: 14 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 4, alignItems: 'center' },
  ghost: { borderWidth: 1, borderColor: colors.border },
  ghostTxt: { color: colors.ink, fontWeight: '700', fontSize: 14 },
  primary: { backgroundColor: colors.accent },
  off: { backgroundColor: colors.muted },
  primaryTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
});
