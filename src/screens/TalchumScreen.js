import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import Text from '../ui/Text';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';
import MissionGate from '../ui/Mission';
import GamePicker from '../ui/GamePicker';
import OhangPicker from '../components/OhangPicker';
import OtherScenes from '../components/OtherScenes';
import TraceReward from '../components/TraceReward';
import TalchumDance from '../components/TalchumDance';
import MascotGuide from '../components/MascotGuide';
import { TALCHUM_STAGES, talchumMission } from '../data/talchum';
import { ohangByKey } from '../data/formations';
import { play } from '../utils/sound';
import { useJourney } from '../context/JourneyContext';
import { buildAttemptResult } from '../utils/resultSeed';
import { t as i18nT } from '../i18n';

function speedComment(score) {
  if (score && score.variety >= 4) return i18nT('춤사위 네 가지를 고루 섞어 신명 나게 놀았어요.');
  if (score && score.good >= score.ok) return i18nT('박을 딱딱 맞춰 힘 있게 췄어요.');
  return i18nT('장단을 타며 끝까지 신명 나게 췄어요.');
}

export default function TalchumScreen({ navigation }) {
  const [idx, setIdx] = useState(0);
  const [key, setKey] = useState(0);
  const [visible, setVisible] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [comment, setComment] = useState('');
  const [picking, setPicking] = useState(true); // 놀이를 시작하면 고르기 판을 한 줄로 접는다
  const [noteOpen, setNoteOpen] = useState(false);
  const { addResult, recordSkill, ohangKey } = useJourney();
  const ohang = ohangByKey(ohangKey);
  const stage = TALCHUM_STAGES[idx];
  const doneRef = useRef(false);

  const choose = (i) => {
    play('tap');
    setIdx(i);
    setKey((k) => k + 1);
    setVisible(false);
    setNoteOpen(false);
    doneRef.current = false;
  };

  const onDone = ({ score, elapsedMs }) => {
    if (doneRef.current) return;
    doneRef.current = true;
    recordSkill(`talchum:${stage.id}`, true);
    play('gayageum');
    setTimeout(() => play('haegeum'), 700);
    setComment(speedComment(score));
    setCompleted(true);
    addResult(
      buildAttemptResult({
        sceneId: 'talchum',
        formationId: stage.id,
        mapping: { 0: score.moves.left, 1: score.moves.right, 2: score.moves.kkaekki, 3: score.moves.turn },
        slotCount: 4,
        ohangKey: ohang.key,
        elapsedMs,
      })
    );
    setVisible(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader scene="Talchum" title={i18nT('탈춤')} sub={i18nT('장단에 맞춰 한삼을 뿌려요')} onBack={() => navigation.navigate('Home')} />
      <View style={styles.header}>
        <OhangPicker />
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <GamePicker
          items={TALCHUM_STAGES.map((st) => ({ key: st.id, tag: st.tag, name: st.name }))}
          active={idx}
          onPick={(i) => { setPicking(true); choose(i); }}
          collapsed={!picking}
          onExpand={() => setPicking(true)}
          cols={2}
        />
        <View style={styles.noteBox}>
          <Pressable onPress={() => setNoteOpen((v) => !v)}>
            <Text style={styles.noteToggle}>{i18nT(noteOpen ? '▾' : '▸')} {i18nT('지도사 노트')}</Text>
          </Pressable>
          {noteOpen ? <Text style={styles.noteText}>{i18nT(stage.tip)}</Text> : null}
        </View>
        <MissionGate resetKey={stage.id} info={{ scene: 'talchum', ...talchumMission(stage) }} onModeSelect={() => setPicking(false)}>
          <MascotGuide which="pung" message={i18nT('북이 덩! 하고 크게 울리는 게 장단의 첫 박이야. 그 소리에 맞춰 한삼을 휙 뿌려 봐!')} style={{ marginBottom: 8 }} />
          <TalchumDance key={key} resetKey={key} stage={stage} onDone={onDone} />
        </MissionGate>
      </ScrollView>
      {visible ? (
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{i18nT('탈춤 ·')} {i18nT(stage.name)}</Text>
            <Text style={styles.comment}>{i18nT('오늘의 기운:')} {i18nT(ohang.label)} ({i18nT(ohang.hint)} {i18nT('느낌) —')} {i18nT(comment)}</Text>
            <TraceReward sceneId="talchum" success={completed} />
            <View style={styles.actions}>
              <Pressable style={styles.closeBtn} onPress={() => setVisible(false)}><Text style={styles.closeTxt}>{i18nT('닫기')}</Text></Pressable>
              {idx < TALCHUM_STAGES.length - 1 ? (
                <Pressable style={styles.primary} onPress={() => choose(idx + 1)}><Text style={styles.primaryTxt}>{i18nT('다음 단계 도전!')}</Text></Pressable>
              ) : null}
              <Pressable style={styles.secondary} onPress={() => { setVisible(false); navigation.navigate('Result'); }}><Text style={styles.secondaryTxt}>{i18nT('결과물 보기')}</Text></Pressable>
            </View>
            <OtherScenes current="Talchum" navigation={navigation} onGo={() => setVisible(false)} />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 6 },
  sidebar: { height: 66, borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: 2 },
  sidebarList: { paddingHorizontal: 12, paddingBottom: 6, gap: 8, alignItems: 'center' },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.paper, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabTag: { fontSize: 9, color: colors.muted, fontWeight: '600', marginBottom: 3 },
  tabTagActive: { color: 'rgba(255,255,255,0.85)' },
  tabText: { fontSize: 12.5, color: colors.muted, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: { padding: 16, gap: 10, alignItems: 'center' },
  noteBox: { width: '100%', borderWidth: 1, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.paper, padding: 10 },
  noteToggle: { fontSize: 12, fontWeight: '700', color: colors.ink },
  noteText: { marginTop: 6, fontSize: 12, lineHeight: 18, color: colors.ink },
  backdrop: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 420, maxHeight: '92%', borderRadius: 18, backgroundColor: colors.paper, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  comment: { fontSize: 12, color: colors.accentDeep, fontWeight: '600', lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'center' },
  closeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.ink },
  closeTxt: { color: colors.onNight, fontWeight: '600', fontSize: 12 },
  primary: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.accent },
  primaryTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  secondary: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.accentSoft },
  secondaryTxt: { color: colors.accent, fontWeight: '700', fontSize: 12 },
});
