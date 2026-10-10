import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView } from 'react-native';
import Text from '../ui/Text';
import FormationPreview from '../components/FormationPreview';
import CompletionEffect from '../components/CompletionEffect';
import { FORMATIONS, ohangByKey, JINBEOP_INTRO } from '../data/formations';
import OhangPicker from '../components/OhangPicker';
import EuljaFlowGame from '../components/jinbeop/EuljaFlowGame';
import GosariVaultGame from '../components/jinbeop/GosariVaultGame';
import PieceMoveGame from '../components/jinbeop/PieceMoveGame';
import PuzzleFitGame from '../components/jinbeop/PuzzleFitGame';
import DrawShapeGame from '../components/jinbeop/DrawShapeGame';
import WingMirrorGame from '../components/jinbeop/WingMirrorGame';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';
import MissionGate from '../ui/Mission';
import GamePicker from '../ui/GamePicker';
import OtherScenes from '../components/OtherScenes';
import TraceReward from '../components/TraceReward';
import Board from '../ui/Board';
import { JINBEOP_MISSIONS } from '../data/missions';
import { play } from '../utils/sound';
import { useJourney } from '../context/JourneyContext';
import { buildAttemptResult } from '../utils/resultSeed';
// [전체 판 공통화] 전래놀이에서 먼저 만든 "성인반/아동반" 구분과 숙련도 문구를
// 그대로 가져다 쓴다 — 반(tier) 목록과 라벨 문구는 하나로 통일해서 관리한다.
import { DIFFICULTY_TIERS, skillLabel } from '../data/playGames';
import { t as i18nT } from '../i18n';

function speedComment(ms) {
  const sec = ms / 1000;
  if (sec < 12) return i18nT('빠르고 거침없이 움직였어요.');
  if (sec < 28) return i18nT('하나씩 신중하게 맞춰나갔어요.');
  return i18nT('차분하고 꼼꼼하게 완성했어요.');
}

// 진법 종류(태그)마다 완성 연출에 쓰이는 아이콘을 다르게 줘서,
// 같은 "다 맞추면 터지는 효과"라도 풍물/강강술래/역사 진법이 서로 다르게 느껴지게 한다.
const BURST_ICONS_BY_TAG = {
  풍물: ['🥁', '🔔', '🪘', '🎶', '✨', '🎶'],
  강강술래: ['🌕', '🤝', '⭐', '✨', '🌙', '✨'],
  '역사 진법': ['🚩', '⚔️', '🛡️', '✨', '🏹', '✨'],
};

// [놀이 방식 다양화] 진법마다 조작 방식이 전부 달라졌기 때문에, 미리보기 안내 문구도
// 진법마다 실제로 뭘 해야 하는지 정확히 알려주도록 mechanic별로 따로 둔다.
const MECHANIC_HINT = {
  flowSnake: '구불구불 길을 따라 끝까지 쭉 걸어가 보자 🐍',
  sequentialVault: '순서를 지켜 한 명씩 넘어가면 이 모양으로 말려들어요.',
  pieceMove: '한 사람을 짚고, 바꿀 자리를 짚어서 자리를 바꿔 보자 ♟️',
  puzzleFit: '조각을 점선 자리로 옮겨서 퍼즐처럼 맞춰 보자 🧩',
  drawMatch: '15초 동안 이 모양을 손으로 쓱쓱 그려 보자 ✏️',
  wingMirror: '한쪽 날개를 벌리면 반대쪽도 거울처럼 같이 벌어져요.',
};

// [아동반/성인반 실제 차등화] 훈민정음 화면과 같은 축으로, 반(tier)마다 도전 순서 자체가
// 다르다 — 아동반은 인원이 적고 모양이 단순한 진법(원진·을자진·일자진)만, 성인반은
// 더 복잡한 모양(고사리꺾기·기와밟기·학익진·방진)까지 포함한 전체를 돈다.
const ROUND_ORDER_BY_TIER = {
  아동반: ['wonjin', 'eulja', 'iljajin'],
  성인반: ['wonjin', 'eulja', 'gosari', 'giwa', 'hagikjin', 'bangjin', 'iljajin'],
};

export default function JinbeopScreen({ navigation }) {
  const [formationIdx, setFormationIdx] = useState(0);
  const [resultVisible, setResultVisible] = useState(false);
  const [resultComment, setResultComment] = useState('');
  const [completed, setCompleted] = useState(false);
  // [점수제 폐지] streak는 화면에 표시하는 점수/기록이 아니라 난이도 조절용 내부 값이다.
  const [streak, setStreak] = useState(0);
  const [burstNonce, setBurstNonce] = useState(0);
  // 같은 진법을 다시 골랐을 때도 각 놀이 컴포넌트를 처음부터 다시 시작하도록 쓰는 값.
  const [restartNonce, setRestartNonce] = useState(0);
  // [전체 판 공통화] 성인반/아동반 선택과 지도사 노트 펼침 상태 — 전래놀이와 동일한 구조.
  const [tier, setTier] = useState('성인반');
  const [noteOpen, setNoteOpen] = useState(false);
  const [picking, setPicking] = useState(true); // 놀이를 시작하면 고르기 판을 한 줄로 접는다
  // [진법이란?] 처음 들어온 사람도 알 수 있게, 기본으로 펼쳐서 보여준다.
  const [introOpen, setIntroOpen] = useState(false);

  const autoAdvanceRef = useRef(false);
  const mountedRef = useRef(false);
  // [오늘의 기운 선택 기능] 화면마다 따로 뽑지 않고 앱 전체가 공유하는 값을 쓴다.
  const { addResult, skills, recordSkill, ohangKey } = useJourney();
  const ohang = ohangByKey(ohangKey);

  // [아동반/성인반 실제 차등화] 아동반은 인원 적고 모양 단순한 진법(level:'easy')만,
  // 성인반은 전체를 고를 수 있다.
  const availableFormations = useMemo(
    () => FORMATIONS.filter((f) => tier === '성인반' || f.level !== 'hard'),
    [tier]
  );
  const formation = availableFormations[formationIdx] || availableFormations[0];
  // 진법마다 따로 쌓이는 숙련도 — 다른 판(훈민정음/전래놀이)의 숙련도와 섞이지 않도록 접두사를 둔다.
  const skillId = `jinbeop:${formation.id}`;
  const rating = skills[skillId] || 0;

  // 사이드바에서 다른 진법을 고르면(자동 라운드 진행이 아니라면) 난이도를 처음으로 되돌린다.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!autoAdvanceRef.current) {
      setStreak(0);
    }
    autoAdvanceRef.current = false;
    setResultVisible(false);
  }, [formationIdx]);

  // 반(tier)을 바꾸면 그 반에서 고를 수 있는 목록으로 다시 맞춘다(범위를 벗어나면 0번으로).
  const tierMountedRef = useRef(false);
  useEffect(() => {
    if (!tierMountedRef.current) {
      tierMountedRef.current = true;
      return;
    }
    if (formationIdx >= availableFormations.length) {
      setFormationIdx(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier]);

  const chooseFormation = (idx) => {
    setNoteOpen(false);
    setPicking(true);
    if (idx === formationIdx) {
      // 같은 진법을 다시 눌러도 그 진법의 놀이 컴포넌트를 처음부터 다시 시작한다.
      setRestartNonce((v) => v + 1);
      return;
    }
    setFormationIdx(idx);
  };

  const advanceRound = () => {
    const order = ROUND_ORDER_BY_TIER[tier] || ROUND_ORDER_BY_TIER['성인반'];
    const curOrderIdx = order.indexOf(formation.id);
    const nextId = curOrderIdx === -1 ? order[0] : order[(curOrderIdx + 1) % order.length];
    const nextIdx = availableFormations.findIndex((f) => f.id === nextId);
    autoAdvanceRef.current = true;
    setFormationIdx(nextIdx === -1 ? (formationIdx + 1) % availableFormations.length : nextIdx);
  };

  // [놀이 방식 재설계] 이제 7개 진법 모두 조작 방식이 서로 다른 자체 컴포넌트를 쓴다.
  // 화면(JinbeopScreen)은 공통 완성/실패 처리만 맡고, 자리 매칭·그리기 판정·타이밍
  // 같은 세부 규칙은 각 컴포넌트가 스스로 관리한다.
  function completeSuccessSpecial(elapsed) {
    // (각 놀이 컴포넌트가 자기 phase로 중복 호출을 막아주므로, 여기서는 그냥
    // streak·결과 모달 상태만 공통으로 갱신한다.)
    play('gong');
    setTimeout(() => play('piri'), 350);
    setStreak((s) => s + 1);
    setBurstNonce((n) => n + 1);
    setCompleted(true);
    setResultComment(speedComment(elapsed));
    setResultVisible(true);
    recordSkill(skillId, true);
    const mapping = Object.fromEntries(formation.positions.map((_, i) => [i, i]));
    const attemptResult = buildAttemptResult({
      sceneId: 'jinbeop',
      formationId: formation.id,
      mapping,
      slotCount: formation.positions.length,
      ohangKey: ohang.key,
      elapsedMs: elapsed,
    });
    addResult(attemptResult);
  }

  function failSpecial(message) {
    play('geomungo');
    setStreak(0);
    setCompleted(false);
    setResultComment(message);
    setResultVisible(true);
    recordSkill(skillId, false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader scene="Jinbeop" title={i18nT('진법')} sub={i18nT('풍물 · 강강술래 · 역사 속 대형 만들기')} onBack={() => navigation.navigate('Home')} />
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          {/* 성인반/아동반 — 전래놀이와 동일한 반 구분 */}
          <View style={styles.tierRow}>
            {DIFFICULTY_TIERS.map((t) => (
              <Pressable
                key={t}
                style={[styles.tierBtn, tier === t && { backgroundColor: ohang.color, borderColor: ohang.color }]}
                onPress={() => { play('tap'); setTier(t); }}
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
              지도사 노트를 펼치거나 화면이 낮으면 아래쪽(완성! 버튼 등)이 잘린 채
              스크롤할 방법이 없었다 — 전체를 ScrollView로 감싼다. */}
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainScrollContent}
            showsVerticalScrollIndicator={false}
          >
          {/* [진법이란?] "진법이라고 하면 사람이 모르잖아 — 설명이 먼저 있어야지"라는
              요청대로, 놀이에 들어가기 전에 먼저 보이는 자리에 둔다. 기본으로 펼쳐두고,
              한 번 읽고 나면 접어둘 수 있게 한다. */}
          {/* [전체 판 공통화] 지도사 노트 — 전래놀이와 같은 위치·형태의 펼침 패널. */}
          <GamePicker
            items={availableFormations.map((f) => ({ key: f.id, tag: f.tag, name: f.name }))}
            active={formationIdx}
            onPick={chooseFormation}
            collapsed={!picking}
            onExpand={() => setPicking(true)}
          />
          {formation.tip && (
            <View style={styles.noteBox}>
              <Pressable style={styles.noteToggle} onPress={() => setNoteOpen((v) => !v)}>
                <Text style={styles.noteToggleText}>
                  {i18nT(noteOpen ? '▾' : '▸')} {i18nT('지도사 노트')}
                </Text>
              </Pressable>
              {noteOpen && <Text style={styles.noteText}>{i18nT(formation.tip)}</Text>}
            </View>
          )}

          <MissionGate
            resetKey={`${formation.id}-${restartNonce}`}
            onModeSelect={() => setPicking(false)}
            info={{
              scene: 'jinbeop',
              ...(JINBEOP_MISSIONS[formation.id] || { kicker: formation.tag, title: formation.name, story: formation.description, mission: MECHANIC_HINT[formation.mechanic] || i18nT('모양을 맞춰 보자 🧩'), steps: [] }),
              example: <FormationPreview positions={formation.positions} color={ohang.color} size={130} />,
            }}
          >
          {(() => {
            // [놀이 방식 다양화] 진법 7개가 전부 서로 다른 조작 방식(mechanic)을 쓴다.
            // 같은 "자리 맞추기"라도 흐름형(flowSnake)·순서형(sequentialVault)·
            // 장기형(pieceMove)·퍼즐형(puzzleFit)·그리기형(drawMatch)·거울형(wingMirror)이
            // 전부 다르게 느껴지도록 각자 다른 컴포넌트에 맡긴다.
            const mechanicKey = `${formation.id}-${restartNonce}`;
            const showPerformer = formation.tag === '풍물' || formation.tag === '강강술래';
            const completionEffect = (
              <CompletionEffect
                nonce={burstNonce}
                variant="burst"
                color={ohang.color}
                label={i18nT('{p0} 완성!', { p0: i18nT(formation.name) })}
                icons={BURST_ICONS_BY_TAG[formation.tag]}
                showPerformer={showPerformer}
              />
            );
            switch (formation.mechanic) {
              case 'flowSnake':
                return (
                  <View style={styles.specialArea}>
                    <EuljaFlowGame
                      key={mechanicKey}
                      color={ohang.color}
                      peopleCount={formation.positions.length}
                      streak={streak}
                      onSuccess={completeSuccessSpecial}
                      onFail={failSpecial}
                    />
                    {completionEffect}
                  </View>
                );
              case 'sequentialVault':
                return (
                  <View style={styles.specialArea}>
                    <GosariVaultGame
                      key={mechanicKey}
                      peopleCount={formation.positions.length}
                      targetPositions={formation.positions}
                      color={ohang.color}
                      streak={streak}
                      onSuccess={completeSuccessSpecial}
                      onFail={failSpecial}
                    />
                    {completionEffect}
                  </View>
                );
              case 'pieceMove':
                return (
                  <View style={styles.specialArea}>
                    <PieceMoveGame
                      key={mechanicKey}
                      positions={formation.positions}
                      color={ohang.color}
                      streak={streak}
                      onSuccess={completeSuccessSpecial}
                      onFail={failSpecial}
                    />
                    {completionEffect}
                  </View>
                );
              case 'puzzleFit':
                return (
                  <View style={styles.specialArea}>
                    <PuzzleFitGame
                      key={mechanicKey}
                      positions={formation.positions}
                      color={ohang.color}
                      streak={streak}
                      onSuccess={completeSuccessSpecial}
                      onFail={failSpecial}
                    />
                    {completionEffect}
                  </View>
                );
              case 'drawMatch':
                return (
                  <View style={styles.specialArea}>
                    <DrawShapeGame
                      key={mechanicKey}
                      formationId={formation.id}
                      closed={!!formation.closed}
                      color={ohang.color}
                      streak={streak}
                      onSuccess={completeSuccessSpecial}
                      onFail={failSpecial}
                    />
                    {completionEffect}
                  </View>
                );
              case 'wingMirror':
                return (
                  <View style={styles.specialArea}>
                    <WingMirrorGame
                      key={mechanicKey}
                      peopleCount={formation.positions.length}
                      targetPositions={formation.positions}
                      color={ohang.color}
                      streak={streak}
                      onSuccess={completeSuccessSpecial}
                      onFail={failSpecial}
                    />
                    {completionEffect}
                  </View>
                );
              default:
                return (
                  <View style={styles.specialArea}>
                    <Text style={styles.hint}>{i18nT('이 진법의 놀이는 곧 추가될 예정이에요.')}</Text>
                  </View>
                );
            }
          })()}
          </MissionGate>
          </ScrollView>
        </View>
      </View>

      {resultVisible && (
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{i18nT(formation.name)}</Text>
            <Text style={styles.modalBody}>{i18nT(formation.description)}</Text>
            <View style={styles.modalDivider} />
            <Text style={styles.modalComment}>
              {i18nT('오늘의 기운:')} {i18nT(ohang.label)} ({i18nT(ohang.hint)} {i18nT('느낌) —')} {i18nT(resultComment)}
            </Text>
            {completed && <Text style={styles.modalScore}>{skillLabel(rating)}</Text>}
            <TraceReward sceneId="jinbeop" success={completed} />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalClose}
                onPress={() => setResultVisible(false)}
              >
                <Text style={styles.modalCloseText}>{i18nT('닫기')}</Text>
              </Pressable>
              {completed && (
                <>
                  <Pressable
                    style={styles.modalPrimary}
                    onPress={() => {
                      setResultVisible(false);
                      advanceRound();
                    }}
                  >
                    <Text style={styles.modalPrimaryText}>{i18nT('다음 진법 도전!')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalSecondary}
                    onPress={() => {
                      setResultVisible(false);
                      navigation.navigate('Result');
                    }}
                  >
                    <Text style={styles.modalSecondaryText}>{i18nT('결과물 보기')}</Text>
                  </Pressable>
                </>
              )}
            </View>
            {completed && <OtherScenes current="Jinbeop" navigation={navigation} onGo={() => setResultVisible(false)} />}
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
    flexWrap: 'wrap',
    gap: 6,
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
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
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
    minWidth: 112,
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
  mainScrollContent: { flexGrow: 1 },
  introBox: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  introToggle: { paddingVertical: 2 },
  introToggleText: { fontSize: 13.5, fontWeight: '800', color: colors.accentDeep },
  introText: { fontSize: 12, color: colors.ink, lineHeight: 18, marginTop: 8 },
  introExample: { marginTop: 10 },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  previewTextBox: { flex: 1 },
  previewLabel: { fontSize: 12, fontWeight: '700', color: colors.ink, marginBottom: 2 },
  previewHint: { fontSize: 10.5, color: colors.muted, lineHeight: 15 },
  skillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.accentDeep,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  noteBox: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  noteToggle: { paddingVertical: 2 },
  noteToggleText: { fontSize: 12, fontWeight: '700', color: colors.ink },
  noteText: { fontSize: 11.5, color: colors.muted, lineHeight: 17, marginTop: 6 },
  specialArea: {
    minHeight: 420,
    marginHorizontal: 16,
    position: 'relative',
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.muted,
    paddingVertical: 10,
  },
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
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: 8 },
  modalBody: { fontSize: 13, lineHeight: 20, color: colors.ink },
  modalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  modalComment: { fontSize: 12, color: colors.accentDeep, fontWeight: '600' },
  modalScore: { fontSize: 12, color: colors.ink, fontWeight: '700', marginTop: 6 },
  modalActions: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  modalSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
  },
  modalSecondaryText: { color: colors.accentDeep, fontWeight: '700', fontSize: 12 },
});
