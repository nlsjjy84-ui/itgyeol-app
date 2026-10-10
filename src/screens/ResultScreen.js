import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, SafeAreaView, ScrollView, Platform, TextInput } from 'react-native';
import Text from '../ui/Text';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import ResultPattern from '../components/ResultPattern';
import MascotDuo from '../components/MascotDuo';
import Rotatable3D from '../components/Rotatable3D';
import KeyringShape, { KEYRING_SHAPES, KeyringShapeIcon } from '../components/KeyringShape';
import TransformResultShape from '../components/TransformResultShape';
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
};

const SCENE_ORDER = ['jinbeop', 'print', 'tbd'];

// 결과물을 담아낼 수 있는 형태. 키링만 실제로 끝까지 구현했고(10가지 모양 +
// 3D 회전 + 이미지 저장 + QR), 나머지는 "이런 형태로도 나올 수 있다"는 걸
// 보여주기만 한다 — 전부 다 지금 만들 필요는 없다는 방침.
const ITEM_FORMATS = [
  { id: 'keyring', label: '키링', ready: true },
  { id: 'brooch', label: '브로치', ready: false },
  { id: 'magnet', label: '마그넷', ready: false },
  { id: 'sticker', label: '스티커', ready: false },
];

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

export default function ResultScreen({ navigation }) {
  const { attempts, skills } = useJourney();
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
  const [keyringShapeId, setKeyringShapeId] = useState('circle');
  const [customShapeText, setCustomShapeText] = useState('');
  const [customRequests, setCustomRequests] = useState([]);
  // [결과물+결과물=전통창작결과물] 두 가지 결과물 보기 방식 — "기존 문양"은 원래 있던
  // 추상적인 꽃문양, "변형 결과물"은 완성한 판들을 실제 인코더-디코더 어텐션으로 섞어
  // 부채→날개 / 붓→칼 / 자모→도형처럼 구체적으로 변형되는 모양. 새로 만든 쪽을 기본값으로 둔다.
  const [patternMode, setPatternMode] = useState('transform');
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
      else if (key.startsWith('print:')) printVals.push(v);
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
        <MascotDuo
          leftValue={pungValue}
          rightValue={gyeolValue}
          caption="짝짝짝! 우리가 함께 만든 결과물이에요. 그동안 쌓은 실력만큼 우리 둘의 존재감도 또렷해져요."
        />
        <Text style={styles.subtitle}>
          완성한 판마다 결과물이 하나씩 생기고, 판을 이어서 완성할수록 그 결과물들을 연결해 더
          발전된 하나의 결과물로 만들 수도 있어요. 부채가 날개로, 붓이 칼로, 자모가 도형으로
          — 어떤 판을 얼마나 반영했는지에 따라 실제로 다르게 변형돼요. 어떤 결과물을 가져갈지는
          직접 골라보세요.
        </Text>

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
              style={[styles.modeChip, patternMode === 'transform' && styles.modeChipActive]}
              onPress={() => setPatternMode('transform')}
            >
              <Text style={[styles.modeChipText, patternMode === 'transform' && styles.modeChipTextActive]}>
                변형 결과물 (어텐션 합성)
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
              {patternMode === 'transform' ? (
                <TransformResultShape attempts={selectedAttempts} size={220} />
              ) : (
                <ResultPattern attempts={selectedAttempts} size={220} />
              )}
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
          <Text style={styles.sectionTitle}>3D 모델 예시</Text>
          <Rotatable3D
            width={180}
            height={180}
            front={
              <View style={styles.disc}>
                {patternMode === 'transform' ? (
                  <TransformResultShape attempts={selectedAttempts} size={140} />
                ) : (
                  <ResultPattern attempts={selectedAttempts} size={140} />
                )}
              </View>
            }
            back={<View style={[styles.disc, styles.discBack]} />}
          />
          <Text style={styles.sectionHint}>
            손가락으로 좌우로 끌어 직접 돌려볼 수 있어요. 같은 무늬를 입체 오브젝트로 만들었을 때의
            예시입니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>키링 예시</Text>
          <View style={styles.shapeIconRow}>
            {KEYRING_SHAPES.map((s) => (
              <Pressable
                key={s.id}
                style={[
                  styles.shapeIconChip,
                  s.id === keyringShapeId && styles.shapeIconChipActive,
                ]}
                onPress={() => setKeyringShapeId(s.id)}
              >
                <KeyringShapeIcon shapeId={s.id} boxSize={40} />
                <Text
                  style={[
                    styles.shapeIconLabel,
                    s.id === keyringShapeId && styles.shapeIconLabelActive,
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Rotatable3D
            width={160}
            height={220}
            front={
              <KeyringShape
                shapeId={keyringShapeId}
                attempts={selectedAttempts}
                patternMode={patternMode}
              />
            }
            back={
              <KeyringShape
                shapeId={keyringShapeId}
                attempts={selectedAttempts}
                patternMode={patternMode}
                blank
              />
            }
          />
          <Text style={styles.sectionHint}>
            원형뿐 아니라 비녀·거울·붓·먹 같은 전통 소재 모양으로도 가져갈 수 있어요. 이것도
            돌려볼 수 있어요.
          </Text>

          <View style={styles.customBox}>
            <Text style={styles.customLabel}>그 외 다른 모양의 전통소재를 가져가고 싶나요?</Text>
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                value={customShapeText}
                onChangeText={setCustomShapeText}
                placeholder="예: 노리개, 갓, 항아리..."
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
                '{customRequests[customRequests.length - 1]}' 모양 요청을 받았어요! 지금은 예시로
                10가지 모양만 보여드리고 있지만, 실제 서비스에서는 이렇게 요청해주신 전통 소재
                모양들을 계속 추가해 나갈 수 있어요.
              </Text>
            )}
          </View>

          {/* [결과물 형태 확장 근거] 키링 "하나의 형태"만 끝까지 완성해두고, 그 외
              형태는 전부 다 모델링해 넣는 대신 "이런 형태로도 나올 수 있다"는 것만
              보여준다 — 실제 제작(인쇄소·업체 연결)은 이 결과물을 채택하는 쪽의
              몫이라는 방침과 같은 선상. */}
          <View style={styles.formatBox}>
            <Text style={styles.customLabel}>키링 말고 다른 형태로도 가져갈 수 있어요</Text>
            <View style={styles.formatRow}>
              {ITEM_FORMATS.map((f) => (
                <View key={f.id} style={[styles.formatChip, f.ready && styles.formatChipReady]}>
                  <Text style={styles.formatChipLabel}>{f.label}</Text>
                  <Text style={styles.formatChipState}>{f.ready ? '지금 가능' : '준비 중'}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.sectionHint}>
              지금 만든 무늬를 입히는 방식 자체는 형태가 바뀌어도 똑같아서, 키링에서 검증한
              걸 그대로 브로치·마그넷·스티커 제작으로 넓힐 수 있어요. 실제 인쇄·제작은
              이 결과물을 쓰는 쪽에서 업체를 연결해 진행하면 됩니다.
            </Text>
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
