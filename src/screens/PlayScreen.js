import React, { useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import Text from '../ui/Text';
import { PLAY_GAMES, DIFFICULTY_TIERS, scaleGameForTier, applySkillAdjustment, skillLabel } from '../data/playGames';
import MascotGuide from '../components/MascotGuide';
import { ohangByKey } from '../data/formations';
import OhangPicker from '../components/OhangPicker';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';
import MissionGate from '../ui/Mission';
import GamePicker from '../ui/GamePicker';
import OtherScenes from '../components/OtherScenes';
import TraceReward from '../components/TraceReward';
import { getGameLines } from '../data/book';
import { playMission } from '../data/missions';
import { play } from '../utils/sound';
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
import { SangmoGame, MarbleGame, TopGame } from '../components/minigames/FolkGamesA';
import { TuhoGame, GomuGame, KiteSteerGame } from '../components/minigames/FolkGamesB';
import { StoneFlickGame, HoopSpeedGame } from '../components/minigames/FolkGamesC';
import { TopChaseGame, DdakjiFanGame, TuhoDialGame, JachigiSwipeGame } from '../components/minigames/FolkGamesD';
import { t as i18nT } from '../i18n';

function speedComment(ms) {
  const sec = ms / 1000;
  if (sec < 5) return i18nT('순식간에 해냈어요.');
  if (sec < 10) return i18nT('리듬을 잘 타며 해냈어요.');
  return i18nT('끈기 있게 해냈어요.');
}

// 놀이 방식(mechanic)마다 조작 방법을 정확히 알려주는 안내 문구.
// 터치뿐 아니라 키보드(스페이스바·화살표 키)로도 똑같이 조작할 수 있다.
const CONTROL_HINTS = {
  race: '육상 달리기 게임처럼 왼쪽/오른쪽을 "번갈아" 눌러야 전진해요. 화살표 키(←→)나 A/D 키를 번갈아 누르거나, 왼발·오른발 버튼을 번갈아 클릭해도 되고 섞어서 눌러도 돼요. 가끔 뜨는 "영차!" 구간에서는 특히 집중해요 🔥',
  rhythm: '도는 점이 위쪽 "여기!" 구간을 지나가는 순간 버튼(또는 스페이스바·Z/X 키)을 탭하거나, "여기!" 구간을 직접 클릭해도 돼요. 맞힐수록 점점 빨라져요.',
  throw: '화살표(←→)나 A/D 키로 조준, 버튼(스페이스바)을 누르고 있다가 힘이 초록 구간일 때 떼면 던져져요. 내 물체가 상대 물체를 직접 맞혀 튕겨내야 명중이에요.',
  whip: '버튼(또는 스페이스바·Z/X 키)을 빠르게 연타하거나 빙글빙글 도는 그림을 직접 클릭해서 계속 쳐 줘요. 치지 않으면 속도가 줄어들어요.',
  stoneTopple: '화살표(←→)나 A/D 키로 세워진 비석을 조준하고, 버튼을 누르고 있다가 힘이 초록 구간일 때 떼면 던져져요. 조준과 세기가 둘 다 맞아야 비석이 쓰러져요.',
  pitchPot: '화살표(←→)나 A/D 키로 항아리를 조준하고, 버튼을 누르고 있다가 힘이 초록 구간일 때 떼면 던져져요. 화살이 포물선을 그리며 날아가요.',
  jachigi: '먼저 버튼(스페이스바·Z/X 키)을 게이지가 "팝!" 구간에 있을 때 탭해 막대를 띄우고, 공중에 뜨면 곧바로 다시 탭해서 "스윙!" 구간에 맞춰 쳐야 멀리 날아가요.',
  ddakjiSlam: '조준은 필요 없어요. 버튼을 누르고 있다가 힘이 초록 구간일 때 손을 떼서 세게 내리쳐요. 충격파가 세야 상대 딱지가 뒤집혀요.',
  rhythmJump: '줄(또는 고무줄)이 발밑을 지나가는 정확한 순간에 버튼(스페이스바·Z/X 키)을 탭하면 폴짝 뛰어넘어요. 아무 때나 눌러도 소용없고, 타이밍을 놓치면 걸려 넘어져요.',
  sangmoCircle: '화면의 동그라미 위에서 손가락(마우스)을 눌러 빙글빙글 돌려요. 빛나는 점을 가까이 따라가면 상모가 돌고, 놓치면 멈춰요. (키보드는 ← →)',
  marbleSling: '아래쪽 내 구슬을 눌러 뒤로 끌었다가 놓으면 반대쪽으로 튕겨요. 많이 끌수록 세게 가요. 동그라미 밖으로 내보내면 따먹어요.',
  topChase: '팽이가 여기저기 돌아다녀요. 팽이를 콕 눌러 채로 치면 힘이 붙어요. 힘이 떨어지거나 선 밖으로 나가면 쓰러져요.',
  ddakjiFan: '손가락으로 끌어 겨누고, 단추를 꾹 눌러 딱지를 들어 올렸다가 떼면 내리쳐요. 상대 딱지의 가장자리를 쳐야 넘어가요. (키보드: 화살표로 겨누고 스페이스바 꾹)',
  tuhoDial: '아래 두 줄(각도·힘)을 눌러 끌어 값을 정하고 "던지기"를 눌러요. 지난 화살이 떨어진 빨간 점을 보고 고쳐 봐요. (스페이스바로도 던져요)',
  jachigiSwipe: '위로 휙 쓸어 알을 튀겨 올리고, 떠 있을 때 옆으로 휙 쓸어 쳐요. 날아간 거리를 자로 재요.',
  topWhip: '팽이가 기우는 쪽 화면을 눌러 채로 쳐서 바로 세워요. 반대쪽을 치면 더 기울어요.',
  stoneFlick: '아래의 내 돌을 눌러 위쪽으로 쓸어 올리며 놓으면 던져져요. 점선 끝(동그라미)이 돌이 떨어질 자리예요. 세워 둔 비석에 맞히면 쓰러져요.',
  tuhoSwing: '팔이 좌우로 천천히 흔들려요. 화살이 항아리를 향한 순간(초록 불) "던지기"를 눌러요. (스페이스바도 돼요)',
  gomuPattern: '불이 켜지는 발 모양 순서를 기억했다가 같은 순서로 눌러요. 줄이 점점 길어져요. (키보드 ← ↓ →)',
  kiteSteer: '손가락(마우스)을 좌우로 움직여 연을 이끌어요. 푸른 바람 길 안에 있으면 연이 올라가요.',
  hoopSpeed: '화면을 꾹 누르면 빨라지고 떼면 느려져요. 오르내리는 초록 칸 안에 속도를 맞추면 굴렁쇠가 쓰러지지 않아요. (스페이스바 꾹)',
  kiteFly: '바람 게이지가 계속 움직여요. "쎈 바람" 구간일 때만 버튼(스페이스바·Z/X 키)을 탭해서 얼레를 감아요. 타이밍이 안 맞으면 연이 오히려 내려와요.',
};

// 전래놀이를 화면 터치/키보드로 즐기는 미니게임 모음 장면.
// 놀이마다 생김새와 진행 방식이 다르지만, 실제로는 5가지 조작 엔진(mash/race/rhythm/throw/whip)을 재사용한다.
export default function PlayScreen({ navigation }) {
  const [gameIdx, setGameIdx] = useState(0);
  const [resultVisible, setResultVisible] = useState(false);
  const [resultComment, setResultComment] = useState('');
  const [completed, setCompleted] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const [timeMode, setTimeMode] = useState('timed');
  // [기능화 2] 성인 아마추어반 / 초중고 레슨반 — 실제 수업에서 쓰던 두 반 구분을
  // 그대로 난이도 선택으로 가져왔다. 성인반이 설계된 기본값(표준), 아동반이 완화판.
  const [tier, setTier] = useState('성인반');
  // [기능화 2] 지도사 노트 — 교재를 직접 쓰고 강사들을 가르쳤던 경험에서 나온
  // 실제 지도 팁을 놀이마다 붙여둔다. 기본은 접힌 상태.
  const [noteOpen, setNoteOpen] = useState(false);
  const [picking, setPicking] = useState(true); // 놀이를 시작하면 고르기 판을 한 줄로 접는다

  // [오늘의 기운 선택 기능] 화면마다 따로 뽑지 않고 앱 전체가 공유하는 값을 쓴다.
  const { addResult, skills, recordSkill, ohangKey } = useJourney();
  const ohang = ohangByKey(ohangKey);

  const rawGame = PLAY_GAMES[gameIdx];
  const rating = skills[rawGame.id] || 0;
  const baseGame = applySkillAdjustment(scaleGameForTier(rawGame, tier), rating);
  // 시간은 기본 3배로 넉넉히, '시간 제한 없이'를 고르면 사실상 끝나지 않게 한다.
  const timeMul = timeMode === 'free' ? null : 3;
  const game = { ...baseGame };
  if (game.durationMs) game.durationMs = timeMul ? game.durationMs * timeMul : 3600000;
  if (game.limitSec) game.limitSec = timeMul ? game.limitSec * timeMul : 3600;

  const chooseGame = (idx) => {
    setGameIdx(idx);
    setGameKey((k) => k + 1);
    setResultVisible(false);
    setNoteOpen(false);
    setPicking(true);
  };

  const handleComplete = ({ success, score, elapsedMs }) => {
    // [지능형 난이도] 성공/실패를 이 놀이(rawGame.id)의 숙련도 점수에 바로 반영 —
    // 다음에 이 놀이를 열 때 시작 난이도가 달라진다.
    recordSkill(rawGame.id, success);
    play(success ? 'gayageum' : 'geomungo');
    if (success) {
      setTimeout(() => play('haegeum'), 700);
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
      setResultComment(i18nT('아깝다! 창을 닫으면 바로 한 번 더 할 수 있어 😉'));
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
      case 'sangmoCircle':
        return <SangmoGame {...common} limitSec={game.limitSec} speedDeg={game.speedDeg} tolerance={game.tolerance} />;
      case 'marbleSling':
        return <MarbleGame {...common} targets={game.targets} shots={game.shots} />;
      case 'topWhip':
        return <TopGame {...common} targetHits={game.targetHits} lives={game.lives} drift={game.drift} />;
      case 'stoneFlick':
        return <StoneFlickGame {...common} stones={game.stones} throws={game.throws} />;
      case 'tuhoSwing':
        return <TuhoGame {...common} arrows={game.arrows} need={game.need} periodSec={game.periodSec} zoneDeg={game.zoneDeg} />;
      case 'gomuPattern':
        return <GomuGame {...common} rounds={game.rounds} startLen={game.startLen} maxMistakes={game.maxMistakes} />;
      case 'kiteSteer':
        return <KiteSteerGame {...common} limitSec={game.limitSec} />;
      case 'topChase':
        return <TopChaseGame {...common} targetHits={game.targetHits} lives={game.lives} drift={game.drift} />;
      case 'ddakjiFan':
        return <DdakjiFanGame {...common} rounds={game.rounds} timeSec={game.timeSec} doubleSided={game.doubleSided} />;
      case 'tuhoDial':
        return <TuhoDialGame {...common} arrows={game.arrows} need={game.need} zoneDeg={game.zoneDeg} />;
      case 'jachigiSwipe':
        return <JachigiSwipeGame {...common} targetHits={game.targetHits} maxMiss={game.maxMiss} windowMs={game.windowMs} />;
      case 'hoopSpeed':
        return <HoopSpeedGame {...common} targetSec={game.targetSec} lives={game.lives} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader scene="Play" title={i18nT('전래놀이')} sub={i18nT('손끝으로 즐기는 열두 가지 놀이')} onBack={() => navigation.navigate('Home')} />
      <View style={styles.header}>
        <View style={styles.headerRight}>
          <View style={styles.tierRow}>
            {DIFFICULTY_TIERS.map((t) => (
              <Pressable
                key={t}
                style={[styles.tierBtn, tier === t && { backgroundColor: ohang.color, borderColor: ohang.color }]}
                onPress={() => {
                  play('tap');
                  setTier(t);
                  setGameKey((k) => k + 1);
                  setResultVisible(false);
                }}
              >
                <Text style={[styles.tierBtnText, tier === t && { color: '#fff' }]}>{i18nT(t)}</Text>
              </Pressable>
            ))}
          </View>
          <OhangPicker />
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.main}>
          {/* [스크롤 안 되던 문제 수정] 전에는 main이 ScrollView 없이 flex:1 View라서,
              안내 문구가 길거나 지도사 노트를 펼치면 아래쪽(놀이 버튼 등)이 화면 밖으로
              잘린 채 스크롤할 방법이 없었다 — 전체를 ScrollView로 감싼다. */}
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* [기능화 2] 지도사 노트 — 교재를 쓰고 강사를 교육했던 실제 현장 경험에서
                나온 지도 팁. 평소엔 접어두고, 필요할 때만 펼쳐 본다. */}
            <GamePicker
              items={PLAY_GAMES.map((g) => ({ key: g.id, tag: g.tag, name: g.name }))}
              active={gameIdx}
              onPick={chooseGame}
              collapsed={!picking}
              onExpand={() => setPicking(true)}
            />
            {game.tip && (
              <View style={styles.noteBox}>
                <Pressable style={styles.noteToggle} onPress={() => setNoteOpen((v) => !v)}>
                  <Text style={styles.noteToggleText}>
                    {i18nT(noteOpen ? '▾' : '▸')} {i18nT('지도사 노트')}
                  </Text>
                </Pressable>
                {noteOpen && <Text style={styles.noteText}>{i18nT(game.tip)}</Text>}
              </View>
            )}
            <MissionGate
              resetKey={`${game.id}-${tier}`}
              info={{ scene: 'play', lines: getGameLines()[game.id] ? [getGameLines()[game.id].start] : undefined, ...playMission(game) }}
              onModeSelect={(m) => { setTimeMode(m); setPicking(false); }}
            >
              <MascotGuide which="pung" message={CONTROL_HINTS[game.mechanic]} style={styles.controlBox} />
              <View style={styles.gameArea}>{renderGame()}</View>
            </MissionGate>
          </ScrollView>
        </View>
      </View>

      {resultVisible && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{i18nT(game.name)}</Text>
            <Text style={styles.modalComment}>
              {i18nT('오늘의 기운:')} {i18nT(ohang.label)} ({i18nT(ohang.hint)} {i18nT('느낌) —')} {i18nT(resultComment)}
            </Text>
            <TraceReward sceneId="tbd" success={completed} gameId={rawGame.id} gameName={rawGame.name} />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalClose} onPress={() => setResultVisible(false)}>
                <Text style={styles.modalCloseText}>{i18nT('닫기')}</Text>
              </Pressable>
              {completed && (
                <Pressable
                  style={styles.modalPrimary}
                  onPress={() => {
                    setResultVisible(false);
                    navigation.navigate('Result');
                  }}
                >
                  <Text style={styles.modalPrimaryText}>{i18nT('결과물 보기')}</Text>
                </Pressable>
              )}
            </View>
            {completed && <OtherScenes current="Play" navigation={navigation} onGo={() => setResultVisible(false)} />}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
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
  body: { flex: 1, flexDirection: 'column' },
  sidebar: { height: 66, borderBottomWidth: 1, borderBottomColor: colors.border, paddingTop: 2 },
  sidebarLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  sidebarScroll: { flexGrow: 0 },
  sidebarList: { paddingHorizontal: 12, paddingBottom: 6, gap: 8, alignItems: 'center' },
  tab: {
    alignItems: 'center',
    minWidth: 96,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.ink,
    marginBottom: 0,
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
  gameArea: { flex: 1, width: '100%', minHeight: 260, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
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
  modalCloseText: { color: colors.onNight, fontWeight: '600', fontSize: 12 },
  modalPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
  },
  modalPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
