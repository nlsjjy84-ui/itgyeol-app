import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { PLAY_GAMES, DIFFICULTY_TIERS, scaleGameForTier, applySkillAdjustment, skillLabel } from '../data/playGames';
import MascotGuide from '../components/MascotGuide';
import { ohangByKey } from '../data/formations';
import OhangPicker from '../components/OhangPicker';
import { colors } from '../theme';
import { useJourney } from '../context/JourneyContext';
import { buildAttemptResult } from '../utils/resultSeed';
import RaceMashGame from '../components/minigames/RaceMashGame';
import RhythmClickGame from '../components/minigames/RhythmClickGame';
import ThrowGame from '../components/minigames/ThrowGame';
import WhipSpinGame from '../components/minigames/WhipSpinGame';
import StoneToppleGame from '../components/minigames/StoneToppleGame';
import PitchPotGame from '../components/minigames/PitchPotGame';
import JachigiGame from '../components/minigames/JachigiGame';
import DdakjiSlamGame from '../components/minigames/DdakjiSlamGame';
import RhythmJumpGame from '../components/minigames/RhythmJumpGame';
import KiteFlyGame from '../components/minigames/KiteFlyGame';

function speedComment(ms) {
  const sec = ms / 1000;
  if (sec < 5) return '순식간에 해냈어요.';
  if (sec < 10) return '리듬을 잘 타며 해냈어요.';
  return '끈기 있게 해냈어요.';
}

// 놀이 방식(mechanic)마다 조작 방법을 정확히 알려주는 안내 문구.
// 터치뿐 아니라 키보드(스페이스바·화살표 키)로도 똑같이 조작할 수 있다.
const CONTROL_HINTS = {
  race: '육상 달리기 게임처럼 왼쪽/오른쪽을 "번갈아" 눌러야 전진해요. 화살표 키(←→)나 A/D 키를 번갈아 누르거나, 왼발·오른발 버튼을 번갈아 클릭해도 되고 섞어서 눌러도 돼요. 가끔 뜨는 "영차!" 구간에서는 특히 집중하세요.',
  rhythm: '도는 점이 위쪽 "여기!" 구간을 지나가는 순간 버튼(또는 스페이스바·Z/X 키)을 탭하거나, "여기!" 구간을 직접 클릭하세요. 맞힐수록 점점 빨라져요.',
  throw: '화살표(←→)나 A/D 키로 조준, 버튼(스페이스바)을 누르고 있다가 힘이 초록 구간일 때 떼서 던지세요. 내 물체가 상대 물체를 직접 맞혀 튕겨내야 명중이에요.',
  whip: '버튼(또는 스페이스바·Z/X 키)을 빠르게 연타하거나 빙글빙글 도는 그림을 직접 클릭해서 계속 쳐 주세요. 치지 않으면 속도가 줄어들어요.',
  stoneTopple: '화살표(←→)나 A/D 키로 세워진 비석을 조준하고, 버튼을 누르고 있다가 힘이 초록 구간일 때 떼서 맞히세요. 조준과 세기가 둘 다 맞아야 비석이 쓰러져요.',
  pitchPot: '화살표(←→)나 A/D 키로 항아리를 조준하고, 버튼을 누르고 있다가 힘이 초록 구간일 때 떼서 던지세요. 화살이 포물선을 그리며 날아가요.',
  jachigi: '먼저 버튼(스페이스바·Z/X 키)을 게이지가 "팝!" 구간에 있을 때 탭해 막대를 띄우고, 공중에 뜨면 곧바로 다시 탭해서 "스윙!" 구간에 맞춰 쳐야 멀리 날아가요.',
  ddakjiSlam: '조준은 필요 없어요. 버튼을 누르고 있다가 힘이 초록 구간일 때 손을 떼서 세게 내리치세요. 충격파가 세야 상대 딱지가 뒤집혀요.',
  rhythmJump: '줄(또는 고무줄)이 발밑을 지나가는 정확한 순간에 버튼(스페이스바·Z/X 키)을 탭해서 뛰어넘으세요. 아무 때나 눌러도 소용없고, 타이밍을 놓치면 걸려 넘어져요.',
  kiteFly: '바람 게이지가 계속 움직여요. "쎈 바람" 구간일 때만 버튼(스페이스바·Z/X 키)을 탭해서 얼레를 감으세요. 타이밍이 안 맞으면 연이 오히려 내려와요.',
};

// 전래놀이를 화면 터치/키보드로 즐기는 미니게임 모음 장면.
// 놀이마다 생김새와 진행 방식이 다르지만, 실제로는 5가지 조작 엔진(mash/race/rhythm/throw/whip)을 재사용한다.
export default function PlayScreen({ navigation }) {
  const [gameIdx, setGameIdx] = useState(0);
  const [resultVisible, setResultVisible] = useState(false);
  const [resultComment, setResultComment] = useState('');
  const [completed, setCompleted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  // [기능화 2] 성인 아마추어반 / 초중고 레슨반 — 실제 수업에서 쓰던 두 반 구분을
  // 그대로 난이도 선택으로 가져왔다. 성인반이 설계된 기본값(표준), 아동반이 완화판.
  const [tier, setTier] = useState('성인반');
  // [기능화 2] 지도사 노트 — 교재를 직접 쓰고 강사들을 가르쳤던 경험에서 나온
  // 실제 지도 팁을 놀이마다 붙여둔다. 기본은 접힌 상태.
  const [noteOpen, setNoteOpen] = useState(false);

  // [오늘의 기운 선택 기능] 화면마다 따로 뽑지 않고 앱 전체가 공유하는 값을 쓴다.
  const { addResult, skills, recordSkill, ohangKey } = useJourney();
  const ohang = ohangByKey(ohangKey);

  const rawGame = PLAY_GAMES[gameIdx];
  const rating = skills[rawGame.id] || 0;
  const game = applySkillAdjustment(scaleGameForTier(rawGame, tier), rating);

  const chooseGame = (idx) => {
    setGameIdx(idx);
    setGameKey((k) => k + 1);
    setResultVisible(false);
    setNoteOpen(false);
  };

  const handleComplete = ({ success, score, elapsedMs }) => {
    // [지능형 난이도] 성공/실패를 이 놀이(rawGame.id)의 숙련도 점수에 바로 반영 —
    // 다음에 이 놀이를 열 때 시작 난이도가 달라진다.
    recordSkill(rawGame.id, success);
    if (success) {
      setResultComment(speedComment(elapsedMs));
      setCompleted(true);
      const mapping = { 0: score };
      const attemptResult = buildAttemptResult({
        sceneId: 'tbd',
        formationId: game.id,
        mapping,
        slotCount: 1,
        ohangKey: ohang.key,
        elapsedMs,
      });
      addResult(attemptResult);
    } else {
      setCompleted(false);
      setResultComment('아깝게 성공하지 못했어요. 창을 닫고 바로 한 번 더 도전해보세요.');
    }
    setResultVisible(true);
  };

  const renderGame = () => {
    const common = { key: gameKey, color: ohang.color, onComplete: handleComplete };
    switch (game.mechanic) {
      case 'race':
        return (
          <RaceMashGame
            {...common}
            durationMs={game.durationMs}
            opponentRate={game.opponentRate}
            meIcon={game.meIcon}
            oppIcon={game.oppIcon}
            burstEnabled={game.burstEnabled}
          />
        );
      case 'rhythm':
        return (
          <RhythmClickGame
            {...common}
            speedDegPerSec={game.speedDegPerSec}
            sweetSpotDeg={game.sweetSpotDeg}
            targetHits={game.targetHits}
            maxAttempts={game.maxAttempts}
            icon={game.icon}
          />
        );
      case 'throw':
        return (
          <ThrowGame
            {...common}
            icon={game.icon}
            targetIcon={game.targetIcon}
            oscSpeedMs={game.oscSpeedMs}
            targetMin={game.targetMin}
            targetMax={game.targetMax}
            rounds={game.rounds}
          />
        );
      case 'whip':
        return (
          <WhipSpinGame
            {...common}
            icon={game.icon}
            holdSec={game.holdSec}
            limitSec={game.limitSec}
            threshold={game.threshold}
          />
        );
      case 'stoneTopple':
        return (
          <StoneToppleGame
            {...common}
            stoneIcon={game.stoneIcon}
            oscSpeedMs={game.oscSpeedMs}
            targetMin={game.targetMin}
            targetMax={game.targetMax}
            rounds={game.rounds}
          />
        );
      case 'pitchPot':
        return (
          <PitchPotGame
            {...common}
            arrowIcon={game.arrowIcon}
            jarIcon={game.jarIcon}
            oscSpeedMs={game.oscSpeedMs}
            targetMin={game.targetMin}
            targetMax={game.targetMax}
            rounds={game.rounds}
          />
        );
      case 'jachigi':
        return (
          <JachigiGame
            {...common}
            rounds={game.rounds}
            distanceStart={game.distanceStart}
            distanceStep={game.distanceStep}
            popPeriodMs={game.popPeriodMs}
            swingZoneWidth={game.swingZoneWidth}
          />
        );
      case 'ddakjiSlam':
        return (
          <DdakjiSlamGame
            {...common}
            myIcon={game.myIcon}
            oppIcon={game.oppIcon}
            oscSpeedMs={game.oscSpeedMs}
            targetMin={game.targetMin}
            targetMax={game.targetMax}
            rounds={game.rounds}
          />
        );
      case 'rhythmJump':
        return (
          <RhythmJumpGame
            {...common}
            variant={game.variant}
            targetSkips={game.targetSkips}
            cycleMsStart={game.cycleMsStart}
            maxMisses={game.maxMisses}
          />
        );
      case 'kiteFly':
        return (
          <KiteFlyGame
            {...common}
            targetHeight={game.targetHeight}
            durationMs={game.durationMs}
            gustMin={game.gustMin}
            gustMax={game.gustMax}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Pressable
            style={styles.homeBtn}
            onPress={() => navigation.navigate('Home')}
            hitSlop={8}
          >
            <Text style={styles.homeBtnText}>‹ 홈</Text>
          </Pressable>
          <Text style={styles.brand}>잇결 · 전래놀이</Text>
        </View>
        <View style={styles.headerRight}>
          {/* [기능화 2] 난이도(반) 선택 — 실제 수업에서 쓰던 성인반/아동반 구분 */}
          <View style={styles.tierRow}>
            {DIFFICULTY_TIERS.map((t) => (
              <Pressable
                key={t}
                style={[styles.tierBtn, tier === t && { backgroundColor: ohang.color, borderColor: ohang.color }]}
                onPress={() => {
                  setTier(t);
                  setGameKey((k) => k + 1);
                  setResultVisible(false);
                }}
              >
                <Text style={[styles.tierBtnText, tier === t && { color: '#fff' }]}>{t}</Text>
              </Pressable>
            ))}
          </View>
          <OhangPicker />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.sidebar}>
          <Text style={styles.sidebarLabel}>놀이를{'\n'}선택하세요</Text>
          <ScrollView
            style={styles.sidebarScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sidebarList}
          >
            {PLAY_GAMES.map((g, idx) => (
              <Pressable
                key={g.id}
                style={[styles.tab, idx === gameIdx && styles.tabActive]}
                onPress={() => chooseGame(idx)}
              >
                <Text style={[styles.tabTag, idx === gameIdx && styles.tabTagActive]}>
                  {g.tag}
                </Text>
                <Text
                  style={[styles.tabText, idx === gameIdx && styles.tabTextActive]}
                  numberOfLines={2}
                >
                  {g.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.main}>
          {/* [스크롤 안 되던 문제 수정] 전에는 main이 ScrollView 없이 flex:1 View라서,
              안내 문구가 길거나 지도사 노트를 펼치면 아래쪽(놀이 버튼 등)이 화면 밖으로
              잘린 채 스크롤할 방법이 없었다 — 전체를 ScrollView로 감싼다. */}
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.gameTitle}>{game.name}</Text>
            <Text style={styles.gameDesc}>{game.description}</Text>
            {/* [지능형 난이도] 기기에 쌓인 숙련도를 그대로 보여준다 — 뒤에서 몰래
                난이도를 조정하면 "되는지 안 되는지" 확인할 길이 없으니, 지금 이
                놀이가 나에게 맞춰졌는지 숫자가 아니라 말로 알려준다. */}
            <View style={styles.skillRow}>
              <Text style={styles.skillText}>{skillLabel(rating)}</Text>
            </View>
            <MascotGuide
              which="pung"
              message={CONTROL_HINTS[game.mechanic]}
              style={styles.controlBox}
            />
            {/* [기능화 2] 지도사 노트 — 교재를 쓰고 강사를 교육했던 실제 현장 경험에서
                나온 지도 팁. 평소엔 접어두고, 필요할 때만 펼쳐 본다. */}
            {game.tip && (
              <View style={styles.noteBox}>
                <Pressable style={styles.noteToggle} onPress={() => setNoteOpen((v) => !v)}>
                  <Text style={styles.noteToggleText}>
                    {noteOpen ? '▾' : '▸'} 지도사 노트
                  </Text>
                </Pressable>
                {noteOpen && <Text style={styles.noteText}>{game.tip}</Text>}
              </View>
            )}
            <View style={styles.gameArea}>{renderGame()}</View>
          </ScrollView>
        </View>
      </View>

      {resultVisible && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{game.name}</Text>
            <Text style={styles.modalComment}>
              오늘의 기운: {ohang.label} ({ohang.hint} 느낌) — {resultComment}
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.modalClose} onPress={() => setResultVisible(false)}>
                <Text style={styles.modalCloseText}>닫기</Text>
              </Pressable>
              {completed && (
                <Pressable
                  style={styles.modalPrimary}
                  onPress={() => {
                    setResultVisible(false);
                    navigation.navigate('Result');
                  }}
                >
                  <Text style={styles.modalPrimaryText}>결과물 보기</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
  brand: { fontSize: 16, fontWeight: '700', color: colors.ink },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  homeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  homeBtnText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tierRow: { flexDirection: 'row', gap: 6 },
  tierBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.2,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  tierBtnText: { fontSize: 11, fontWeight: '700', color: colors.ink },
  ohangBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.2,
    backgroundColor: colors.paper,
  },
  ohangText: { fontSize: 11, fontWeight: '600' },
  skillRow: { marginBottom: 6 },
  skillText: { fontSize: 11.5, fontWeight: '700', color: colors.accent },
  body: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 108,
    borderRightWidth: 1,
    borderRightColor: colors.borderSoft,
    paddingTop: 4,
  },
  sidebarLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  sidebarScroll: { flex: 1, width: '100%' },
  sidebarList: { paddingHorizontal: 8, paddingBottom: 12, gap: 8 },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabTag: { fontSize: 9, color: colors.muted, fontWeight: '600', marginBottom: 3 },
  tabTagActive: { color: 'rgba(255,255,255,0.85)' },
  tabText: { fontSize: 12.5, color: colors.muted, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: '#fff' },
  main: { flex: 1, width: '100%' },
  mainScroll: { flex: 1, width: '100%' },
  mainScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  gameTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  gameDesc: {
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 10,
    maxWidth: 480,
  },
  controlBox: {
    width: '100%',
    maxWidth: 480,
    marginBottom: 14,
  },
  noteBox: {
    width: '100%',
    maxWidth: 480,
    marginBottom: 14,
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  noteToggle: { flexDirection: 'row', alignItems: 'center' },
  noteToggleText: { fontSize: 12, fontWeight: '800', color: colors.accentDeep },
  noteText: { fontSize: 12, color: colors.ink, lineHeight: 17, marginTop: 6 },
  gameArea: { flex: 1, width: '100%', minHeight: 260, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(32,36,43,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 50,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.paper,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  modalComment: { fontSize: 12, color: colors.accentDeep, fontWeight: '600', lineHeight: 18 },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalClose: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.night,
    borderRadius: 12,
  },
  modalCloseText: { color: colors.bg, fontWeight: '600', fontSize: 12 },
  modalPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
  },
  modalPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
