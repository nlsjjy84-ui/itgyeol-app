import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Text from './Text';
import { LANGS } from '../i18n';
import { useLangSwitch } from '../i18n/LangContext';
import { colors } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { voiceSupported, isVoiceOn, setVoice, onVoiceChange, speak } from '../utils/voice';
import { sensesSupported, askConsent } from '../utils/senses';

// 몸짓·표정 담기 — 카메라·마이크 동의를 다시 고르는 칩(놀이 시작 때 묻고, 여기서 언제든 바꾼다)
function SenseChip() {
  if (!sensesSupported()) return null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        play('tap');
        askConsent();
      }}
      style={st.chip}
    >
      <Text style={st.txt}>{t('몸짓·표정 담기')}</Text>
    </Pressable>
  );
}

// 소리 안내 켜기·끄기 — 켜면 누르는 곳의 글을 지금 언어로 읽어 준다(음성 합성이 되는 기기에서만 보인다)
function VoiceChip() {
  const [on, setOn] = React.useState(isVoiceOn());
  React.useEffect(() => onVoiceChange(setOn), []);
  if (!voiceSupported()) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? t('소리 안내 끄기') : t('소리 안내 켜기')}
      onPress={() => {
        play('tap');
        const next = !on;
        setVoice(next);
        if (next) speak(t('소리 안내를 켰어요. 누르는 곳의 글을 읽어 드려요.'), { force: true });
      }}
      style={[st.chip, on && st.on]}
    >
      <Text style={[st.txt, on && st.txtOn]}>{on ? t('소리 안내 켜짐') : t('소리 안내')}</Text>
    </Pressable>
  );
}

// 언어 고르기 — 준비된 언어만 보인다(중국어·일본어는 언어팩이 채워지면 자동으로 나타난다).
export default function LangToggle({ style }) {
  const { lang, change } = useLangSwitch();
  return (
    <View style={[st.col, style]}>
      <View style={st.row}>
      {LANGS.filter((l) => l.ready).map((l) => (
        <Pressable
          key={l.id}
          accessibilityRole="button"
          accessibilityLabel={l.label}
          onPress={() => {
            if (l.id === lang) return;
            play('tap');
            change(l.id);
          }}
          style={[st.chip, l.id === lang && st.on]}
        >
          <Text style={[st.txt, l.id === lang && st.txtOn]}>{l.label}</Text>
        </Pressable>
      ))}
      </View>
      <View style={st.row}>
        <VoiceChip />
        <SenseChip />
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  col: { alignItems: 'flex-end', gap: 4 },
  row: { flexDirection: 'row', gap: 4, justifyContent: 'flex-end' },
  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  on: { backgroundColor: colors.ink, borderColor: colors.ink },
  txt: { fontSize: 11, color: colors.ink, fontWeight: '600' },
  txtOn: { color: colors.paper },
});
