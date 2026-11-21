import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import Text from '../ui/Text';
import StoryMovie from '../components/StoryMovie';
import { useJourney } from '../context/JourneyContext';
import { getBook, resolveLines } from '../data/book';
import { t } from '../i18n';
import { colors } from '../theme';

// 그림책 — 미리 짜 둔 장면을 한 쪽씩 넘긴다. 입력은 네 가지뿐:
//   본다(쪽을 읽는다) · 말한다(추임새 칩 고르기) · 움직인다(톡) · 멈춘다(가만히 — 몇 초 뒤 그것도 반응으로 받아 준다)
// params: { part: 'prologue'|'jinbeop'|'print'|'play'|'hangul'|'talchum'|'dancheong', then: 이어서 갈 화면 이름 }
// 이야기 영상 — 예전에는 한 쪽씩 넘기는 그림책이었지만, 이제는 저절로 재생되는 영상이다(StoryMovie).
// 고르는 장면(추임새·문 열기)에서만 영상이 멈추고, 가만히 있어도 그것을 대답으로 받아 이어진다.
// params: { part: 'prologue'|'jinbeop'|'print'|'play'|'hangul'|'talchum'|'dancheong', then: 이어서 갈 화면 이름 }
export default function BookScreen({ navigation, route }) {
  const { part = 'prologue', then = 'Home' } = route.params || {};
  const { book, markBook } = useJourney();
  const BOOK = getBook();
  const pages = BOOK[part] || BOOK.prologue;
  const choiceRef = useRef((book && book.choice) || {});
  const finish = useCallback(() => {
    markBook(part === 'prologue' ? { prologue: true } : { gate: part });
    navigation.replace(then);
  }, [markBook, navigation, part, then]);
  const resolve = useCallback((lines) => resolveLines(lines, { choice: choiceRef.current }), []);
  const onPick = useCallback(
    (key, id) => {
      choiceRef.current = { ...choiceRef.current, [key]: id };
      markBook({ choice: { [key]: id } });
    },
    [markBook]
  );
  return (
    <SafeAreaView style={st.safe}>
      <View style={st.top}>
        <Text style={st.title}>{part === 'prologue' ? t('잇결 이야기 영상') : t('판 입구 이야기 영상')}</Text>
        <Pressable onPress={finish} hitSlop={10}>
          <Text style={st.skip}>{t('건너뛰기')}</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        <StoryMovie part={part} pages={pages} resolve={resolve} onPick={onPick} onFinish={finish} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 10, paddingBottom: 4 },
  dots: { flexDirection: 'row', gap: 5, flex: 1, flexWrap: 'wrap' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderSoft },
  dotOn: { backgroundColor: colors.accent, width: 18 },
  dotDone: { backgroundColor: colors.muted },
  skip: { fontSize: 13, color: colors.muted },
  title: { fontSize: 14, color: colors.ink, fontWeight: '700' },
  body: { padding: 8, paddingBottom: 40, maxWidth: 740, width: '100%', alignSelf: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, justifyContent: 'center' },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: colors.accent, backgroundColor: colors.paper },
  chipOn: { backgroundColor: colors.accent },
  chipOff: { opacity: 0.35 },
  chipTxt: { fontSize: 14, fontWeight: '700', color: colors.accent },
  waitHint: { fontSize: 11.5, color: colors.muted, alignSelf: 'center', width: '100%', textAlign: 'center' },
  hint: { marginTop: 16, textAlign: 'center', fontSize: 12.5, color: colors.muted, letterSpacing: 1 },
});
