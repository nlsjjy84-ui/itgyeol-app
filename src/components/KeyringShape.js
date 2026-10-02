import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import ResultPattern from './ResultPattern';
import TransformResultShape from './TransformResultShape';
import { colors } from '../theme';

// 예시로 보여주는 10가지 전통 소재 키링 모양.
// 세상의 모든 전통 소재를 다 만들어두진 못했기 때문에(그건 업체 몫이거나 다음 확장 작업),
// 우선 대표적인 것 10가지만 골라 두고, 화면에서는 직접 입력도 받을 수 있게 한다.
export const KEYRING_SHAPES = [
  { id: 'circle', label: '원형 노리개' },
  { id: 'binyeo', label: '비녀' },
  { id: 'mirror', label: '거울' },
  { id: 'brush', label: '붓' },
  { id: 'ink', label: '먹' },
  { id: 'fan', label: '부채' },
  { id: 'ring', label: '가락지' },
  { id: 'lock', label: '자물쇠' },
  { id: 'sogo', label: '소고' },
  { id: 'pouch', label: '복주머니' },
];

// [색상 수정] 전통 소재인데 색이 없어서(회색 하나로 퉁치는) 문제였다 — 실제 전통
// 공예에 자주 쓰이는 색을 종류별로 나눠 입힌다: 금속은 차가운 회색이 아니라 따뜻한
// 금동/은 빛, 자개·옥·산호·단청에 쓰이는 색도 실제 쓰이는 색 그대로 가져온다.
const GOLD = '#c9a24b'; // 금동 장식
const SILVER = '#b9c0c6'; // 은장식
const WOOD = '#8a5a34';
const INK = '#2c3038';
const JADE = '#5f8b6e'; // 옥
const CORAL = '#c1592f'; // 산호·주칠
const LACQUER = '#8c2f2f'; // 자개함·매듭에 쓰는 짙은 붉은 옻칠색
const INDIGO = '#2d4a6b'; // 쪽빛
const DRUMHEAD = '#f1e6cf'; // 가죽 북면(가죽 특유의 미색)
const CORD = '#8c2f2f'; // 소고 손잡이 끈 — 통상 붉은색 계열 끈을 쓴다

function RingLoop({ x, y }) {
  return <Circle cx={x} cy={y} r={7} stroke={GOLD} strokeWidth={3} fill="none" />;
}

// 모양마다: 전체 박스 크기, 무늬가 들어갈 자리(위치/크기/형태), 나머지 몸체를 그리는 프레임
const SHAPE_DEFS = {
  circle: {
    // 원형 노리개: 전통 노리개는 몸체 아래로 색실 술(장식 매듭)이 늘어진다 — 민짜 원이
    // 아니라 금동 테두리 + 아래로 늘어지는 홍색 술까지 넣어야 "노리개"로 읽힌다.
    width: 180,
    height: 230,
    face: { shape: 'circle', left: 25, top: 50, size: 130 },
    Frame: () => (
      <>
        <RingLoop x={90} y={18} />
        <Line x1={90} y1={25} x2={90} y2={50} stroke={GOLD} strokeWidth={3} />
        <Path d="M90 180 L90 212" stroke={LACQUER} strokeWidth={3} />
        <Path d="M78 212 Q90 230 102 212" stroke={LACQUER} strokeWidth={3} fill="none" />
        <Circle cx={90} cy={212} r={4} fill={GOLD} />
      </>
    ),
    // 금동 테두리 장식 — 무늬(원판) 가장자리 위로 겹쳐서 또렷한 테로 보이게 한다.
    Overlay: () => <Circle cx={90} cy={115} r={65} fill="none" stroke={GOLD} strokeWidth={3} opacity={0.85} />,
  },
  binyeo: {
    // 비녀: 긴 봉 끝에 옥/산호 장식 머리, 반대쪽은 뾰족한 핀. 금동 봉에 옥색 머리 장식을
    // 얹는 전통 비녀(옥비녀) 배색을 따른다 — 회색 쇠봉 하나로 퉁치지 않는다.
    width: 180,
    height: 260,
    face: { shape: 'circle', left: 50, top: 18, size: 80 },
    Frame: () => (
      <>
        <RingLoop x={90} y={6} />
        <Path d="M85 95 L95 95 L92 222 L88 222 Z" fill={GOLD} />
        <Rect x={83.5} y={120} width={13} height={4} rx={2} fill={JADE} opacity={0.9} />
        <Rect x={84.3} y={160} width={11.4} height={4} rx={2} fill={JADE} opacity={0.9} />
        <Path d="M84 220 L96 220 L90 252 Z" fill={SILVER} />
      </>
    ),
  },
  mirror: {
    // 거울(병경·동경): 실제 청동거울은 차가운 회색이 아니라 금동색 테 — 둥근 거울 면을
    // 두 겹 금동 테가 감싸고, 어깨 장식을 거쳐 옻칠 자루로 이어지는 전통 구조.
    width: 180,
    height: 272,
    face: { shape: 'circle', left: 15, top: 8, size: 150 },
    Frame: () => (
      <>
        <Circle cx={90} cy={83} r={79} fill="none" stroke={GOLD} strokeWidth={5} opacity={0.92} />
        <Circle cx={90} cy={83} r={70} fill="none" stroke={GOLD} strokeWidth={1.6} opacity={0.5} />
        <Path d="M66 152 Q90 168 114 152 L109 174 Q90 184 71 174 Z" fill={GOLD} />
        <Path d="M77 171 L103 171 L97 246 Q90 255 83 246 Z" fill={LACQUER} />
        <Rect x={75.5} y={193} width={29} height={5} rx={2.5} fill={GOLD} opacity={0.88} />
        <Rect x={79} y={219} width={22} height={5} rx={2.5} fill={GOLD} opacity={0.88} />
        <Circle cx={90} cy={252} r={5.5} fill="none" stroke={GOLD} strokeWidth={3} />
        <RingLoop x={90} y={262} />
      </>
    ),
  },
  brush: {
    // 붓: 뚜껑 고리 + 대나무 자루(장식 띠 둘, 금동) + 끝으로 갈수록 짙어지는 붓촉.
    width: 180,
    height: 262,
    face: { shape: 'circle', left: 50, top: 8, size: 80 },
    Frame: () => (
      <>
        <RingLoop x={90} y={2} />
        <Path d="M80 88 L100 88 L97 188 L83 188 Z" fill={WOOD} />
        <Rect x={79.5} y={110} width={21} height={4.5} fill={GOLD} opacity={0.9} />
        <Rect x={80.5} y={150} width={19} height={4.5} fill={GOLD} opacity={0.9} />
        <Path d="M83 188 L97 188 L90 250 Z" fill="url(#brushTipGrad)" />
      </>
    ),
  },
  ink: {
    // 먹: 실제 먹은 새까만 덩어리가 아니라, 옻칠 바탕에 금박 글씨·꽃무늬를 찍어 넣는다.
    width: 200,
    height: 140,
    face: { shape: 'rect', left: 25, top: 25, width: 150, height: 90 },
    Frame: () => (
      <>
        <RingLoop x={100} y={8} />
        <Rect x={15} y={15} width={170} height={110} rx={10} fill={INK} />
        <Rect x={15} y={15} width={170} height={110} rx={10} fill="none" stroke={GOLD} strokeWidth={2} opacity={0.6} />
        <Circle cx={30} cy={30} r={2.4} fill={GOLD} opacity={0.85} />
        <Circle cx={170} cy={30} r={2.4} fill={GOLD} opacity={0.85} />
        <Circle cx={30} cy={110} r={2.4} fill={GOLD} opacity={0.85} />
        <Circle cx={170} cy={110} r={2.4} fill={GOLD} opacity={0.85} />
      </>
    ),
  },
  fan: {
    // [구조 수정] 그동안은 살만 그려서 "부채처럼 안 보인다"는 지적을 받았다 — 실제 접부채는
    // 살 위에 색종이(선면)가 펼쳐져 있다. 살 뒤에 반원형 부채면(크림색)을 먼저 깔고, 그
    // 위에 살을 얹은 뒤, 자루 끝에는 전통 부채 특유의 색실 선추(장식술)를 늘어뜨린다.
    width: 200,
    height: 230,
    face: { shape: 'circle', left: 42, top: 95, size: 116 },
    Frame: () => (
      <>
        <Path
          d="M100 205 L23 128 A95 95 0 0 1 177 128 Z"
          fill={CORAL}
          opacity={0.22}
        />
        <Path
          d="M23 128 A95 95 0 0 1 177 128"
          fill="none"
          stroke={CORAL}
          strokeWidth={3}
        />
        <Rect x={92} y={198} width={16} height={22} rx={4} fill={GOLD} />
        <Path d="M100 220 L100 232" stroke={LACQUER} strokeWidth={2.5} />
        <Circle cx={100} cy={234} r={3.5} fill={LACQUER} />
      </>
    ),
    // 부채 살 — 펼쳐진 부채면(무늬) 위로 걸쳐 보여야 "부채"로 읽힌다.
    Overlay: () => (
      <>
        {[-50, -25, 0, 25, 50].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <Line
              key={deg}
              x1={100}
              y1={205}
              x2={100 + Math.sin(rad) * 95}
              y2={205 - Math.cos(rad) * 95}
              stroke={WOOD}
              strokeWidth={2}
              opacity={0.8}
            />
          );
        })}
      </>
    ),
  },
  ring: {
    // [구조 수정] "가락지는 한 짝이 아니라 쌍가락지"라는 지적을 반영 — 금가락지 한 쌍이
    // 서로 살짝 엇갈려 겹치는 모양으로 바꾸고, 겹치는 자리에 작은 보석 장식을 얹는다.
    width: 170,
    height: 190,
    face: { shape: 'circle', left: 40, top: 25, size: 85 },
    Frame: () => (
      <>
        <RingLoop x={85} y={6} />
        <Line x1={85} y1={13} x2={85} y2={18} stroke={GOLD} strokeWidth={3} />
        <Circle cx={72} cy={70} r={46} stroke={GOLD} strokeWidth={10} fill="none" />
      </>
    ),
    // 뒤쪽 가락지(은) + 겹치는 자리의 보석 — 무늬(가운데 보석 자리) 위로 겹쳐 보여야
    // "쌍가락지가 겹친" 모양으로 읽힌다.
    Overlay: () => (
      <>
        <Circle cx={98} cy={70} r={46} stroke={SILVER} strokeWidth={8} fill="none" opacity={0.9} />
      </>
    ),
  },
  lock: {
    // 자물쇠: 실제 전통 자물쇠(용충·거북 모양 장석)는 금동빛에 뚫음무늬 장식이 있다 —
    // 회색 쇠가 아니라 금동색으로, 몸체에 작은 뚫음무늬 점열을 더한다.
    width: 180,
    height: 220,
    face: { shape: 'rect', left: 35, top: 80, width: 110, height: 100 },
    Frame: () => (
      <>
        <Path
          d="M55 80 L55 45 Q55 15 90 15 Q125 15 125 45 L125 80"
          stroke={GOLD}
          strokeWidth={14}
          fill="none"
        />
        <Rect x={25} y={70} width={130} height={120} rx={14} fill="none" stroke={GOLD} strokeWidth={4} />
        {[42, 90, 138].map((x) => (
          <Circle key={x} cx={x} cy={178} r={2.6} fill={GOLD} opacity={0.75} />
        ))}
      </>
    ),
  },
  sogo: {
    // [구조 수정] "손잡이 없는 건 소고가 아니라 법고" — 테두리에 묶인 붉은 끈 손잡이를
    // 추가했다. 손잡이는 나무 자루가 아니라 끈으로, 테 양쪽에 매듭지어 고리처럼 늘어진다.
    width: 180,
    height: 190,
    face: { shape: 'circle', left: 33, top: 13, size: 114 },
    Frame: () => (
      <>
        <RingLoop x={90} y={5} />
        <Line x1={90} y1={12} x2={90} y2={13} stroke={GOLD} strokeWidth={3} />
        <Circle cx={90} cy={70} r={62} fill={DRUMHEAD} stroke={WOOD} strokeWidth={6} />
      </>
    ),
    // [구조 수정] 북면을 엇갈려 묶는 끈 + 손잡이 끈 — 전부 북면(무늬) "위"에 걸쳐
    // 있어야 진짜 소고처럼 보인다. 손잡이가 없으면 소고가 아니라 법고라는 지적을
    // 반영해, 테 양쪽에 묶여 아래로 늘어지는 손잡이 끈 고리를 꼭 넣는다.
    Overlay: () => (
      <>
        <Line x1={28} y1={70} x2={152} y2={70} stroke={CORD} strokeWidth={2} opacity={0.85} />
        <Line x1={60} y1={18} x2={120} y2={122} stroke={CORD} strokeWidth={2} opacity={0.85} />
        <Line x1={120} y1={18} x2={60} y2={122} stroke={CORD} strokeWidth={2} opacity={0.85} />
        <Path
          d="M55 118 Q90 168 125 118"
          stroke={CORD}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
        <Circle cx={55} cy={118} r={4} fill={CORD} />
        <Circle cx={125} cy={118} r={4} fill={CORD} />
      </>
    ),
  },
  pouch: {
    // [색상 수정] 복주머니는 전통 공예 중에서도 색이 가장 화려한 소재인데 무채색이었다 —
    // 남색·홍색 양단에 금박 매듭(금사 매듭)을 더한다.
    width: 180,
    height: 205,
    face: { shape: 'circle', left: 30, top: 60, size: 120 },
    Frame: () => (
      <>
        <RingLoop x={90} y={8} />
        <Line x1={90} y1={15} x2={90} y2={38} stroke={GOLD} strokeWidth={3} />
        <Path d="M58 62 Q90 32 122 62" stroke={INDIGO} strokeWidth={5} fill="none" />
        <Circle cx={90} cy={44} r={6} fill={GOLD} />
        <Circle cx={76} cy={50} r={3} fill={CORAL} />
        <Circle cx={104} cy={50} r={3} fill={CORAL} />
      </>
    ),
  },
};

// shapeId에 해당하는 전통 소재 틀 안에 결과 무늬를 담아 보여준다.
// blank=true면 무늬 없이 뒷면(빈 면)으로 렌더링 — 3D로 돌렸을 때 뒷모습 표현용.
// patternMode='transform'(기본값)이면 3D 모델 예시와 똑같이 실제 어텐션으로 합성한
// 변형 결과물(TransformResultShape)을 넣는다 — 전에는 여기만 옛 ResultPattern을
// 그대로 박아 넣고 있어서 키링이 가중치/어텐션과 무관하게 항상 똑같은 무늬였다.
export default function KeyringShape({ shapeId, attempts, size = 1, blank = false, patternMode = 'transform' }) {
  const def = SHAPE_DEFS[shapeId] || SHAPE_DEFS.circle;
  const { width, height, face, Frame, Overlay } = def;
  const faceLeft = face.left * size;
  const faceTop = face.top * size;
  const faceW = (face.shape === 'circle' ? face.size : face.width) * size;
  const faceH = (face.shape === 'circle' ? face.size : face.height) * size;

  return (
    <View style={{ width: width * size, height: height * size }}>
      <Svg
        width={width * size}
        height={height * size}
        viewBox={`0 0 ${width} ${height}`}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <LinearGradient id="brushTipGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#4a3524" />
            <Stop offset="1" stopColor="#13100e" />
          </LinearGradient>
        </Defs>
        <Frame />
      </Svg>
      <View
        style={[
          styles.face,
          {
            left: faceLeft,
            top: faceTop,
            width: faceW,
            height: faceH,
            borderRadius: face.shape === 'circle' ? faceW / 2 : 10 * size,
            backgroundColor: blank ? colors.accentSoft : '#fffbf3',
          },
        ]}
      >
        {!blank &&
          (patternMode === 'transform' ? (
            <TransformResultShape attempts={attempts} size={Math.min(faceW, faceH)} />
          ) : (
            <ResultPattern attempts={attempts} size={Math.min(faceW, faceH)} />
          ))}
      </View>
      {/* [구조 수정] 소고 끈·부채 살·가락지 보석처럼 실제로는 무늬 "위"에 걸쳐 있어야
          하는 부분은 Frame(배경)이 아니라 여기(Overlay, 무늬보다 앞쪽)에 그린다 —
          전에는 전부 Frame에 있어서, 안에 들어간 무늬(face)가 그 위를 덮어버려
          소고에 끈이 있어도 안 보이고 부채 살도 안 보이는 문제가 있었다. */}
      {Overlay && (
        <Svg
          width={width * size}
          height={height * size}
          viewBox={`0 0 ${width} ${height}`}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Overlay />
        </Svg>
      )}
    </View>
  );
}

// 선택 칩에 쓰는 작은 아이콘 — 실제 모양(비녀/거울/붓...)을 글자 대신 눈으로 바로 알아볼 수 있게
// 틀만 축소해서 보여준다(결과 무늬 없이 빈 면으로).
export function KeyringShapeIcon({ shapeId, boxSize = 42 }) {
  const def = SHAPE_DEFS[shapeId] || SHAPE_DEFS.circle;
  const scale = (boxSize * 0.86) / Math.max(def.width, def.height);
  return (
    <View style={{ width: boxSize, height: boxSize, alignItems: 'center', justifyContent: 'center' }}>
      <KeyringShape shapeId={shapeId} attempts={[]} size={scale} blank />
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
