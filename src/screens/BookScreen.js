import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import Text from '../ui/Text';
import StoryScene, { Dialogue } from '../ui/StoryScene';
import { useJourney } from '../context/JourneyContext';
import { BOOK, resolveLines } from '../data/book';
import { colors } from '../theme';
import { play } from '../utils/sound';

// 그림책 — 미리 짜 둔 장면을 한 쪽씩 넘긴다. 입력은 네 가지뿐:
//   본다(쪽을 읽는다) · 말한다(추임새 칩 고르기) · 움직인다(톡) · 멈춘다(가만히 — 몇 초 뒤 그것도 반응으로 받아 준다)
// params: { part: 'prologue'|'jinbeop'|'print'|'play'|'hangul', then: 이어서 갈 화면 이름 }
export default function BookScreen({ navigation, route }) {
  const { part = 'prologue', then = 'Home' } = route.params || {};
  const { book, markBook } = useJourney();
  const pages = BOOK[part] || BOOK.prologue;
  const choice = (book && book.choice) || {};

  const [pi, setPi] = useState(0);
  const [shown, setShown] = useState(1);        // 이 쪽에서 보인 줄 수
  const [picked, setPicked] = useState(null);   // 고른 옵션 id
  const [reactShown, setReactShown] = useState(1);
  const timer = useRef(null);
  const scroller = useRef(null);

  const page = pages[pi];
  const lines = useMemo(() => resolveLines(page.lines, { choice }), [page, choice]);
  const input = page.input;
  const reactLines = input && picked ? resolveLines(input.react[picked] || [], { choice }) : [];
  const allShown = shown >= lines.length;
  const waitingInput = !!input && allShown && !picked;
  const reactDone = !input || (picked && reactShown >= reactLines.length);
  const last = pi === pages.length - 1;

  const finish = useCallback(() => {
    markBook(part === 'prologue' ? { prologue: true } : { gate: part });
    navigation.replace(then);
  }, [markBook, navigation, part, then]);

  const pick = useCallback((id) => {
    if (timer.current) clearTimeout(timer.current);
    play('tap');
    setPicked(id);
    setReactShown(1);
    markBook({ choice: { [input.key]: id } });
  }, [input, markBook]);

  // 입력을 기다리는 동안 가만히 있으면 그것도 반응이다.
  useEffect(() => {
    if (!waitingInput) return undefined;
    timer.current = setTimeout(() => pick(input.silent), input.waitMs || 5000);
    return () => timer.current && clearTimeout(timer.current);
  }, [waitingInput, input, pick]);

  useEffect(() => {
    if (scroller.current) setTimeout(() => scroller.current && scroller.current.scrollToEnd({ animated: true }), 60);
  }, [shown, picked, reactShown, pi]);

  const advance = () => {
    if (!allShown) {
      play('tap');
      setShown((n) => n + 1);
      return;
    }
    if (waitingInput) {
      // 버튼이 하나뿐인 '톡' 장면(문 열기)은 화면 어디를 톡 해도 그 행동으로 받는다.
      if (input.options.length === 1) pick(input.options[0].id);
      return; // 추임새 칩은 고르거나, 가만히 기다리면 된다
    }
    if (input && picked && reactShown < reactLines.length) {
      play('tap');
      setReactShown((n) => n + 1);
      return;
    }
    if (last) {
      finish();
      return;
    }
    play('tap');
    setPi((i) => i + 1);
    setShown(1);
    setPicked(null);
    setReactShown(1);
  };

  const hint = waitingInput ? '' : last && reactDone && allShown ? '마당으로 ›' : '톡 ›';

  return (
    <SafeAreaView style={st.safe}>
      <View style={st.top}>
        <View style={st.dots}>
          {pages.map((_, i) => (
            <View key={i} style={[st.dot, i === pi && st.dotOn, i < pi && st.dotDone]} />
          ))}
        </View>
        <Pressable onPress={finish} hitSlop={10}>
          <Text style={st.skip}>건너뛰기</Text>
        </Pressable>
      </View>
      <Pressable style={{ flex: 1 }} onPress={advance}>
        <ScrollView ref={scroller} contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
          <StoryScene art={page.art} place={page.place} hideLines lines={[]} />
          <Dialogue lines={lines.slice(0, shown)} />
          {input && allShown ? (
            <View style={st.chips}>
              {input.options.map((o) => (
                <Pressable
                  key={o.id}
                  disabled={!!picked}
                  style={[st.chip, picked === o.id && st.chipOn, picked && picked !== o.id && st.chipOff]}
                  onPress={() => pick(o.id)}
                >
                  <Text style={[st.chipTxt, picked === o.id && { color: '#fff' }]}>{o.label}</Text>
                </Pressable>
              ))}
              {!picked && !input.options.some((o) => o.id === input.silent) ? (
                <Text style={st.waitHint}>…가만히 있어도 돼</Text>
              ) : null}
            </View>
          ) : null}
          {picked ? <Dialogue lines={reactLines.slice(0, reactShown)} /> : null}
          {hint ? <Text style={st.hint}>{hint}</Text> : null}
        </ScrollView>
      </Pressable>
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
  skip: { fontSize: 12, color: colors.muted },
  body: { padding: 18, paddingBottom: 60, maxWidth: 640, width: '100%', alignSelf: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14, justifyContent: 'center' },
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: colors.accent, backgroundColor: colors.paper },
  chipOn: { backgroundColor: colors.accent },
  chipOff: { opacity: 0.35 },
  chipTxt: { fontSize: 14, fontWeight: '700', color: colors.accent },
  waitHint: { fontSize: 11.5, color: colors.muted, alignSelf: 'center', width: '100%', textAlign: 'center' },
  hint: { marginTop: 16, textAlign: 'center', fontSize: 12.5, color: colors.muted, letterSpacing: 1 },
});
