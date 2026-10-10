import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView, Platform, TextInput, useWindowDimensions } from 'react-native';
import Text from '../ui/Text';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import ResultPattern from '../components/ResultPattern';
import MascotDuo from '../components/MascotDuo';
import Obj3DViewer from '../components/obj3d/Obj3DViewer';
import { makeDna, dnaSummary } from '../utils/shapeDna';
import { CATALOG, findItem } from '../components/obj3d/catalog';
import TransformResultShape from '../components/TransformResultShape';
import Jogakbo, { PatchChip } from '../components/Jogakbo';
import StoryScene from '../ui/StoryScene';
import ResultWhy from '../components/ResultWhy';
import { RESULT_LINES } from '../data/story';
import { useJourney } from '../context/JourneyContext';
import { resultOptionCode } from '../utils/resultSeed';
import { synthesizeAttention } from '../utils/attentionSynth';
import { colors } from '../theme';
import ScreenHeader from '../ui/ScreenHeader';
import ArtFrame from '../components/ArtFrame';
import { play } from '../utils/sound';

const SCENE_LABEL = {
  jinbeop: '진법',
  print: '훈민정음·인쇄',
  tbd: '전래놀이',
  hangul: '한글 테트리스',
};

const SCENE_ORDER = ['jinbeop', 'print', 'tbd', 'hangul'];

// 완성한 판들로부터 "가져갈 수 있는 결과물" 선택지를 만든다.
// - 판 하나만 완성했으면: 그 판의 단독 결과물 1개
// - 두 판 이상 완성했으면: 각 판의 단독 결과물 + 처음부터 순서대로 연결한 결합 결과물들
//   (1개 결합, 2개 결합, 3개 결합 ...) 까지 전부 선택지로 제시 — 어떤 걸 가져갈지는 사용자 몫
function buildOptions(attempts) {
  const bySceneId = Object.fromEntries(attempts.map((a) => [a.sceneId, a]));
  const ordered = SCENE_ORDER.map((id) => bySceneId[id]).filter(Boolean);
  if (ordered.length === 0) return [];

  const options = [];
  ordered.forEach((a) => {
    options.push({
      key: `solo-${a.sceneId}`,
      label: `${SCENE_LABEL[a.sceneId] || a.sceneId} 단독 결과`,
      attempts: [a],
    });
  });
  if (ordered.length > 1) {
    for (let n = 2; n <= ordered.length; n++) {
      const slice = ordered.slice(0, n);
      options.push({
        key: `combo-${n}`,
        label: `${slice.map((a) => SCENE_LABEL[a.sceneId] || a.sceneId).join(' + ')} 연결 결과`,
        attempts: slice,
      });
    }
  }
  return options;
}

// 선택한 보기 방식(조각보 / 변형 / 기존 문양)에 맞춰 결과물 그림을 고른다.
function ResultArt({ mode, attempts, size }) {
  if (mode === 'jogakbo') return <Jogakbo attempts={attempts} size={size} />;
  if (mode === 'transform') return <TransformResultShape attempts={attempts} size={size} />;
  return <ResultPattern attempts={attempts} size={size} />;
}

// 3D 물건에 입힐 그림 — 네모 꽉 찬 한 장(원형 테두리 없이)
function TextureArt({ mode, attempts, size }) {
  if (mode === 'jogakbo') return <Jogakbo attempts={attempts} size={size} shape="square" />;
  if (mode === 'transform') return <TransformResultShape attempts={attempts} size={size} />;
  return <ResultPattern attempts={attempts} size={size} />;
}

export default function ResultScreen({ navigation }) {
  const { attempts, skills, progress } = useJourney();
  const shotRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('');
  useEffect(() => {
    play('stamp');
    const t = setTimeout(() => play('daegeumCalm'), 300);
    return () => clearTimeout(t);
  }, []);

  const options = useMemo(() => buildOptions(attempts), [attempts]);
  const [selectedKey, setSelectedKey] = useState(null);
  const selected = options.find((o) => o.key === selectedKey) || options[options.length - 1];
  const selectedAttempts = selected ? selected.attempts : [];
  const code = selected ? resultOptionCode(selectedAttempts) : 'ITGYEOL-----';
  const dna = useMemo(() => makeDna(selectedAttempts), [selectedAttempts]);
  const bySceneId = Object.fromEntries(attempts.map((a) => [a.sceneId, a]));
  const orderedSolved = SCENE_ORDER.map((id) => bySceneId[id]).filter(Boolean);
  const solvedCount = orderedSolved.length;
  // 조각보가 빈 천 색을 정할 때 쓰는 것과 같은 시드(Jogakbo와 동일한 계산)
  const jogakSeed = orderedSolved.reduce((h, a) => Math.imul(h ^ (a.seed >>> 0), 16777619) >>> 0, 2166136261);
  const steps = orderedSolved.map((_, i) => ({
    key: `step-${i}`,
    attempts: orderedSolved.slice(0, i + 1),
    label: i === 0 ? '첫 조각' : i === 1 ? '1+2 이어붙임' : '1+2+3 완성',
  }));
  const { width: winW } = useWindowDimensions();
  const viewerW = Math.min(360, Math.max(260, winW - 44));
  const [groupId, setGroupId] = useState('keyring');
  const [itemId, setItemId] = useState('norigae');
  const [variantId, setVariantId] = useState(null);
  const [hookOn, setHookOn] = useState(true);
  const { group, item } = findItem(groupId, itemId);
  const variant = item.variants.find((v) => v.id === variantId) || item.variants[0];
  const pickGroup = (g) => {
    setGroupId(g.id);
    setItemId(g.items[0].id);
    setVariantId(null);
  };
  const [customShapeText, setCustomShapeText] = useState('');
  const [customRequests, setCustomRequests] = useState([]);
  // [결과물+결과물=전통창작결과물] 두 가지 결과물 보기 방식 — "기존 문양"은 원래 있던
  // 추상적인 꽃문양, "변형 결과물"은 완성한 판들을 실제 인코더-디코더 어텐션으로 섞어
  // 부채→날개 / 붓→칼 / 자모→도형처럼 구체적으로 변형되는 모양. 새로 만든 쪽을 기본값으로 둔다.
  const [patternMode, setPatternMode] = useState('jogakbo');
  const synth = useMemo(
    () => (selectedAttempts.length > 0 ? synthesizeAttention(selectedAttempts) : null),
    [selectedAttempts]
  );

  // [1,2,3에 적용한 걸 결과물에도] 진법·훈민정음·전래놀이 각 판에서 쌓은 실제 숙련도
  // (skills, useJourney가 추적하는 -3~3 레이팅)를 그대로 가져와서, 결과 화면의 두
  // 캐릭터가 "보여주는 존재감"(MascotDuo의 활성화 함수로 변환되는 값)을 결정한다.
  // 풍이=풍물·진법(+전래놀이), 결이=훈민정음·인쇄 담당이라는 기존 설정을 그대로 따른다.
  const { pungValue, gyeolValue } = useMemo(() => {
    const jinbeopVals = [];
    const printVals = [];
    const playVals = [];
    Object.entries(skills || {}).forEach(([key, v]) => {
      if (key.startsWith('jinbeop:')) jinbeopVals.push(v);
      else if (key.startsWith('print:') || key.startsWith('hangul:')) printVals.push(v);
      else playVals.push(v);
    });
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const pungSrc = [...jinbeopVals, ...playVals];
    return { pungValue: avg(pungSrc), gyeolValue: avg(printVals) };
  }, [skills]);

  const handleRequestShape = () => {
    const text = customShapeText.trim();
    if (!text) return;
    setCustomRequests((prev) => [...prev, text]);
    setCustomShapeText('');
  };

  const handleSaveImage = async () => {
    setSaveStatus('저장 중...');
    try {
      if (Platform.OS === 'web') {
        const uri = await shotRef.current.capture();
        const link = document.createElement('a');
        link.href = uri;
        link.download = `${code}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSaveStatus('다운로드 되었습니다.');
      } else {
        const MediaLibrary = require('expo-media-library');
        const uri = await shotRef.current.capture();
        const perm = await MediaLibrary.requestPermissionsAsync();
        if (perm.status === 'granted') {
          await MediaLibrary.saveToLibraryAsync(uri);
          setSaveStatus('사진 앱에 저장되었습니다.');
        } else {
          setSaveStatus('저장 권한이 필요해요.');
        }
      }
    } catch (e) {
      setSaveStatus('이 환경에서는 저장을 미리 볼 수 없어요. (실제 기기에서는 저장돼요)');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="나만의 결과물" sub="완성한 판이 하나의 작품이 돼요" onBack={() => navigation.navigate('Home')} />
        <StoryScene
          art="sunset"
          place="마당 · 해 질 녘"
          lines={RESULT_LINES[Math.min(4, solvedCount)]}
          style={{ marginTop: 4 }}
        />

        <View style={styles.stackBox}>
          <Text style={styles.stackTitle}>내가 모은 조각</Text>
          <View style={styles.stackRow}>
            {SCENE_ORDER.map((id) => (
              <View key={id} style={styles.stackCol}>
                <PatchChip attempt={bySceneId[id]} empty={!bySceneId[id]} size={82} level={Math.max(1, progress.levels[id] || 1)} />
                <Text style={styles.stackLabel}>{SCENE_LABEL[id]}</Text>
                <Text style={styles.stackState}>{bySceneId[id] ? '조각 생김' : '아직 비어 있음'}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.stackTitle, { marginTop: 16 }]}>이어 붙일수록 달라져요</Text>
          <View style={styles.stackRow}>
            {steps.map((st) => (
              <View key={st.key} style={styles.stackCol}>
                <Jogakbo attempts={st.attempts} size={84} />
                <Text style={styles.stackLabel}>{st.label}</Text>
              </View>
            ))}
            {steps.length < 3 ? (
              <View style={styles.stackCol}>
                <View style={styles.nextBox}>
                  <Text style={styles.nextText}>다음 판{'\n'}이 옆에{'\n'}이어져요</Text>
                </View>
                <Text style={styles.stackLabel}>{steps.length === 0 ? '첫 조각' : steps.length === 1 ? '1+2' : '1+2+3'}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.sectionHint}>
            판마다 만든 모양·글자·놀이가 조각 하나로 남고, 조각을 이어 붙이면 한 장의 조각보가 돼요.
            어떤 문제를 어떻게 풀었느냐에 따라 조각보의 모양과 색이 달라지고, 많이 풀수록 더 정교해져요.
          </Text>
        </View>

        <ResultWhy attempts={orderedSolved} seed={jogakSeed} />

        {options.length === 0 ? (
          <Text style={styles.empty}>아직 완성한 판이 없어요. 판을 완성하면 여기 쌓여요.</Text>
        ) : (
          <View style={styles.optionRow}>
            {options.map((o) => (
              <Pressable
                key={o.key}
                style={[styles.optionChip, o.key === selected?.key && styles.optionChipActive]}
                onPress={() => setSelectedKey(o.key)}
              >
                <Text
                  style={[
                    styles.optionChipText,
                    o.key === selected?.key && styles.optionChipTextActive,
                  ]}
                >
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {options.length > 0 && (
          <View style={styles.modeRow}>
            <Pressable
              style={[styles.modeChip, patternMode === 'jogakbo' && styles.modeChipActive]}
              onPress={() => setPatternMode('jogakbo')}
            >
              <Text style={[styles.modeChipText, patternMode === 'jogakbo' && styles.modeChipTextActive]}>
                조각보
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeChip, patternMode === 'transform' && styles.modeChipActive]}
              onPress={() => setPatternMode('transform')}
            >
              <Text style={[styles.modeChipText, patternMode === 'transform' && styles.modeChipTextActive]}>
                변형 (어텐션 합성)
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeChip, patternMode === 'pattern' && styles.modeChipActive]}
              onPress={() => setPatternMode('pattern')}
            >
              <Text style={[styles.modeChipText, patternMode === 'pattern' && styles.modeChipTextActive]}>
                기존 문양
              </Text>
            </Pressable>
          </View>
        )}

        <ViewShot ref={shotRef} style={styles.card} options={{ format: 'png', quality: 1 }}>
          <View style={styles.cardInner}>
            <ArtFrame size={220}>
              <ResultArt mode={patternMode} attempts={selectedAttempts} size={220} />
            </ArtFrame>
            <Text style={styles.code}>{code}</Text>
          </View>
        </ViewShot>

        {patternMode === 'transform' && synth && (
          <View style={styles.attentionBox}>
            <Text style={styles.attentionTitle}>
              부채→날개 · 붓→칼 · 자모→도형 — 어떤 판을 얼마나 반영했는지
            </Text>
            <View style={styles.attentionBars}>
              {SCENE_ORDER.filter((id) => synth.attentionBySceneId[id] !== undefined).map((id) => {
                const pct = Math.round((synth.attentionBySceneId[id] || 0) * 100);
                return (
                  <View key={id} style={styles.attentionRow}>
                    <Text style={styles.attentionLabel}>{SCENE_LABEL[id]}</Text>
                    <View style={styles.attentionTrack}>
                      <View style={[styles.attentionFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.attentionPct}>{pct}%</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.attentionHint}>
              각 판을 완성한 속도·방식에서 나온 실제 숫자를 인코더-디코더 어텐션(6개 층)으로
              섞어요. 아직 완성하지 않았거나 나중에 끝낸 판은 마스킹으로 가려서, 먼저 끝낸
              판의 결과가 나중 판 때문에 거꾸로 바뀌지 않게 했어요. 그 결과가 위 모양의
              날개 폭·칼날 길이·글자 정돈 정도를 직접 결정해요.
            </Text>
          </View>
        )}

        <Pressable
          style={[styles.primaryBtn, !selected && styles.btnDisabled]}
          onPress={handleSaveImage}
          disabled={!selected}
        >
          <Text style={styles.primaryBtnText}>이미지로 저장하기</Text>
        </Pressable>
        {!!saveStatus && <Text style={styles.status}>{saveStatus}</Text>}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR코드로 가져가기</Text>
          <View style={styles.qrBox}>
            <QRCode value={code} size={120} color={colors.ink} backgroundColor={colors.paper} />
          </View>
          <Text style={styles.sectionHint}>이 QR을 찍으면 내가 고른 결과 코드를 확인할 수 있어요.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>내 결과물을 이 물건에 입혀 가져가요</Text>
          <View style={styles.groupRow}>
            {CATALOG.map((g) => (
              <Pressable
                key={g.id}
                style={[styles.groupChip, g.id === groupId && styles.groupChipOn]}
                onPress={() => pickGroup(g)}
              >
                <Text style={[styles.groupChipText, g.id === groupId && styles.groupChipTextOn]}>{g.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sectionHint}>{group.intro}</Text>

          {group.items.length > 1 ? (
            <View style={styles.itemRow}>
              {group.items.map((it) => (
                <Pressable
                  key={it.id}
                  style={[styles.itemChip, it.id === item.id && styles.itemChipOn]}
                  onPress={() => {
                    setItemId(it.id);
                    setVariantId(null);
                  }}
                >
                  <Text style={[styles.itemChipText, it.id === item.id && styles.itemChipTextOn]}>{it.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {item.variants.length > 1 ? (
            <View style={styles.variantRow}>
              <Text style={styles.variantLabel}>모양</Text>
              {item.variants.map((v) => (
                <Pressable
                  key={v.id}
                  style={[styles.variantChip, v.id === variant.id && styles.variantChipOn]}
                  onPress={() => setVariantId(v.id)}
                >
                  <Text style={[styles.variantChipText, v.id === variant.id && styles.variantChipTextOn]}>{v.label}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Obj3DViewer
            art={<TextureArt mode={patternMode} attempts={selectedAttempts} size={256} />}
            artSize={256}
            build={variant.build}
            hook={group.hook && hookOn}
            dna={dna}
            width={viewerW}
            height={Math.round(viewerW * 1.05)}
            resetKey={`${patternMode}|${selectedKey || ''}|${selectedAttempts.length}|${dna.code}`}
          />
          {dna.k ? (
            <Text style={styles.dnaLine}>
              이 작품만의 형태 · #{dna.code} — {dnaSummary(dna)}. 같은 놀이 기록은 같은 모양, 기록이 다르면 모양도 달라져요.
            </Text>
          ) : null}

          {group.hook ? (
            <Pressable style={[styles.hookBtn, hookOn && styles.hookBtnOn]} onPress={() => setHookOn((v) => !v)}>
              <Text style={[styles.hookBtnText, hookOn && styles.hookBtnTextOn]}>
                키링 고리 {hookOn ? '달려 있어요' : '빼고 보기'}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.aboutBox}>
            <Text style={styles.aboutTitle}>
              {item.label} · {variant.label}
            </Text>
            <Text style={styles.aboutText}>{item.about}</Text>
            {variant.note ? <Text style={styles.aboutText}>{variant.note}</Text> : null}
            <Text style={styles.aboutText}>
              끌어서 돌리거나 아래 버튼으로 앞·뒤·옆·위·아래를 바로 볼 수 있어요. 물건의 앞뒤 모두 그 물건의 실제 모양이에요.
            </Text>
          </View>

          <View style={styles.customBox}>
            <Text style={styles.customLabel}>그 외 다른 전통 물건에 입히고 싶나요?</Text>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                value={customShapeText}
                onChangeText={setCustomShapeText}
                placeholder="예: 갓끈, 향낭, 베개..."
                placeholderTextColor={colors.muted}
                onSubmitEditing={handleRequestShape}
                returnKeyType="done"
              />
              <Pressable style={styles.customBtn} onPress={handleRequestShape}>
                <Text style={styles.customBtnText}>요청하기</Text>
              </Pressable>
            </View>
            {customRequests.length > 0 && (
              <Text style={styles.customAck}>
                '{customRequests[customRequests.length - 1]}' 요청을 받았어요! 새 물건은 같은 방식으로 계속 추가할 수 있어요.
              </Text>
            )}
          </View>
        </View>

        <Pressable style={styles.secondaryBtn} onPress={() => navigation.popToTop()}>
          <Text style={styles.secondaryBtnText}>홈으로</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dnaLine: { fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 18, marginTop: 6, paddingHorizontal: 8 },
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 22, alignItems: 'center', paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, marginBottom: 6 },
  mascotIntro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    width: '100%',
  },
  mascotPair: { flexDirection: 'row' },
  introBubble: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  introText: { fontSize: 12, color: colors.ink, fontWeight: '600' },
  subtitle: {
    fontSize: 12.5,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  empty: { fontSize: 12, color: colors.muted, textAlign: 'center', marginBottom: 12 },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  optionChipText: { fontSize: 11.5, color: colors.muted, fontWeight: '600' },
  optionChipTextActive: { color: '#fff' },
  stackBox: { marginTop: 18, marginBottom: 6 },
  stackTitle: { fontSize: 14, fontWeight: '800', color: colors.ink, letterSpacing: 1, marginBottom: 8 },
  stackRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-start', gap: 6 },
  stackCol: { alignItems: 'center', gap: 4, flex: 1 },
  stackLabel: { fontSize: 12.5, color: colors.ink, fontWeight: '700' },
  stackState: { fontSize: 11, color: colors.muted },
  nextBox: {
    width: 84,
    height: 84,
    borderWidth: 1.4,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: { fontSize: 11, color: colors.muted, textAlign: 'center', lineHeight: 16 },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeChipActive: { backgroundColor: colors.accentDeep, borderColor: colors.accentDeep },
  modeChipText: { fontSize: 11.5, color: colors.muted, fontWeight: '700' },
  modeChipTextActive: { color: '#fff' },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardInner: { alignItems: 'center', padding: 18 },
  code: { marginTop: 10, fontSize: 12, color: colors.accentDeep, fontWeight: '700', letterSpacing: 1 },
  primaryBtn: {
    marginTop: 18,
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  status: { marginTop: 8, fontSize: 11.5, color: colors.muted },
  attentionBox: {
    width: '100%',
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  attentionTitle: { fontSize: 12, fontWeight: '700', color: colors.ink, marginBottom: 10, textAlign: 'center' },
  attentionBars: { gap: 7 },
  attentionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attentionLabel: { width: 72, fontSize: 11, color: colors.muted, fontWeight: '600' },
  attentionTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  attentionFill: { height: '100%', backgroundColor: colors.accentDeep },
  attentionPct: { width: 36, fontSize: 11, color: colors.ink, fontWeight: '700', textAlign: 'right' },
  attentionHint: { fontSize: 10.5, color: colors.muted, lineHeight: 15, marginTop: 10, textAlign: 'center' },
  section: {
    width: '100%',
    marginTop: 26,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    paddingTop: 20,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.ink, marginBottom: 10 },
  sectionHint: { fontSize: 11, color: colors.muted, marginTop: 8, textAlign: 'center' },
  qrBox: {
    padding: 14,
    backgroundColor: colors.paper,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shapeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  shapeIconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  shapeIconChip: {
    width: 66,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  shapeIconChipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  shapeIconLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  shapeIconLabelActive: { color: colors.accentDeep },
  disc: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: colors.paper,
    borderWidth: 3,
    borderColor: colors.accentDeep,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  discBack: { backgroundColor: colors.accentSoft },
  groupRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 4 },
  groupChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  groupChipOn: { backgroundColor: colors.accentDeep, borderColor: colors.accentDeep },
  groupChipText: { fontSize: 13, fontWeight: '800', color: colors.muted },
  groupChipTextOn: { color: '#fff' },
  itemRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 10 },
  itemChip: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper },
  itemChipOn: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  itemChipText: { fontSize: 12, fontWeight: '700', color: colors.muted },
  itemChipTextOn: { color: colors.accentDeep },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, marginBottom: 6 },
  variantLabel: { fontSize: 11.5, color: colors.muted, fontWeight: '700', marginRight: 2 },
  variantChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  variantChipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  variantChipText: { fontSize: 11.5, fontWeight: '700', color: colors.muted },
  variantChipTextOn: { color: '#fff' },
  hookBtn: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  hookBtnOn: { borderColor: colors.accent },
  hookBtnText: { fontSize: 11.5, color: colors.muted, fontWeight: '700' },
  hookBtnTextOn: { color: colors.accent },
  aboutBox: { marginTop: 12, width: '100%', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.paper, gap: 4 },
  aboutTitle: { fontSize: 13.5, fontWeight: '800', color: colors.ink },
  aboutText: { fontSize: 12, color: colors.ink, lineHeight: 18 },
  customBox: {
    width: '100%',
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  customLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  customRow: { flexDirection: 'row', gap: 8 },
  customInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    fontSize: 12.5,
    color: colors.ink,
  },
  customBtn: {
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  customBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  customAck: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 17,
    color: colors.accentDeep,
    textAlign: 'center',
  },
  formatBox: {
    width: '100%',
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  formatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  formatChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
    alignItems: 'center',
    opacity: 0.6,
  },
  formatChipReady: {
    opacity: 1,
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  formatChipLabel: { fontSize: 12, fontWeight: '700', color: colors.ink },
  formatChipState: { fontSize: 9.5, color: colors.muted, marginTop: 2 },
  secondaryBtn: {
    marginTop: 26,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.ink, fontWeight: '600' },
});
