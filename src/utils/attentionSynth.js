// "결과물 + 결과물 = 전통창작결과물" — 완성한 판들을 진짜 인코더-디코더 멀티헤드
// 어텐션으로 섞어서 하나의 결합 결과물(모양)을 만든다.
//
// 정직하게 짚어둘 전제 한 가지: 이건 "학습된" 트랜스포머가 아니다. 학습을 시키려면
// "이 조합엔 이런 모양이 정답"이라는 데이터셋이 있어야 하는데, 그런 정답 데이터가
// 애초에 존재하지 않는다(만들 수도 없다 — 정답이 뭔지는 아무도 모른다). 그래서
// 가중치 행렬은 역전파로 학습되지 않고, 고정된 시드로 한 번만 만들어서 계속 재사용한다.
// → 그래서 "과적합"은 구조적으로 일어날 수 없다. 과적합은 "학습 데이터에 가중치를
// 맞추다가 일반화를 잃는" 현상인데, 여기 가중치는 애초에 어떤 데이터에도 맞춰진 적이
// 없다(역전파를 한 번도 돌리지 않았다) — 맞춰진 적 없는 가중치는 과적합될 수 없다.
//
// 하지만 "가짜"는 아니다:
//   - 완성한 순서를 사인/코사인 포지셔널 인코딩으로 임베딩에 더한다.
//   - 인코더: 완성한 판들이 서로 "양방향으로" 주목한다 — 마스킹 없음. (인코더는
//     원래 마스킹하지 않는다 — 전체를 다 보고 이해하는 쪽이라서.)
//   - 디코더는 "언어모델"처럼 작동한다 — 다음 걸 예측하는 쪽이라서 입력을 오른쪽으로
//     한 칸 민다(shift-right): 맨 앞엔 실제 토큰이 없으니 <SOS>(시작) 벡터를 넣고,
//     그 다음 포지션부터는 "바로 이전 판의 인코더 출력"을 그 포지션의 입력으로 쓴다.
//     즉 디코더 i번째 포지션은 "<SOS>, 판1, 판2, ..., 판(i-1)"까지만 보고 판i를
//     예측하려는 것 — 교사강요(teacher forcing) 방식 언어모델 디코더와 같은 구조다.
//     각 입력에는 포지셔널 인코딩을 더해 그게 몇 번째 포지션인지 알려준다.
//   - 포지션마다 ①마스크드 셀프 어텐션(자기보다 "나중" 포지션은 못 보게 가림)
//     → ②인코더 출력에 대한 교차 어텐션(마스킹 없음), 이 순서를 그대로 따른다 —
//     마스킹은 인코더가 아니라 디코더 쪽에 있어야 한다는 원래 트랜스포머 구조 그대로.
//     마스킹된 자리는 소프트맥스 점수가 -Infinity라서, 소프트맥스를 통과하면
//     exp(-Infinity)=0 — 가중치가 정확히 0이 된다(수학적으로 당연히 그래야 한다).
//   - 각 어텐션은 멀티헤드로, 헤더마다 다른 Wq/Wk/Wv를 써서 쿼리·키·밸류 벡터를 구하고,
//     QKᵀ/√d_k 스코어를 소프트맥스에 통과시켜 가중치로 나타낸 뒤 밸류를 가중합하고,
//     헤더 출력을 가로로 이어붙여(concat) 선형(W^O) 투영한다 — 기본 트랜스포머의
//     8헤더×64차원(=512차원)과 똑같은 구조이되, 실제 입력이 "완성한 판 1~3개" 수준이라
//     규모만 줄였다.
//   - 마지막엔 예측 헤드(PRED)가 각 디코더 포지션의 출력을 가지고 "그 자리에 실제로
//     있었던 판의 인코더 출력"을 예측해본다 — 언어모델이 다음 토큰을 예측하는 것과
//     같은 자리다. 학습이 없으니 이 예측이 항상 정확하진 않지만(애초에 맞다/틀리다를
//     가릴 정답 라벨 자체가 없다), 실제로 벡터 대 벡터 예측 연산 자체는 수행한다.
// 인코더 3층 + 디코더 3층 = 총 6층. 그 결과 나온 가중치가 실제로 화면에 그려지는
// 모양(날개 폭, 칼날 길이, 글자 밀도)을 바꾼다 — 숫자가 결과에 진짜 영향을 준다.

import {
  mulberry32,
  hashTag,
  randMatrix,
  matVec,
  dot,
  addVec,
  softmax,
  layerNorm,
  positionalEncoding,
  makeHeadWeights,
  multiHeadSelfAttention,
  multiHeadCrossAttention,
  makeFFNWeights,
  applyFeedForward,
} from './multiHeadAttention.js';

// 기본 트랜스포머는 8헤더 × 64차원(=512차원)을 쓰지만, 여기서는 그 구조(헤더 수 ×
// 헤더당 차원)만 그대로 가져오고 규모는 실제 데이터 수준으로 줄였다: 4헤더 × 4차원.
const NUM_HEADS = 4;
const HEAD_DIM = 8;
const D_MODEL = NUM_HEADS * HEAD_DIM; // 32
const SEED = 0x9e3779b9;

// [실측으로 찾은 버그 수정 ③ — 층 수] 처음엔 "인코더 3층+디코더 3층"으로 했었는데,
// 실측해보니 토큰이 1~3개뿐인 시퀀스에서는 셀프 어텐션을 2번만 거듭해도 코사인
// 유사도가 0.9를 넘고, 3번째 층에서는 0.99(사실상 완전히 같은 벡터)까지 수렴해
// 버렸다 — "결과물이 왜 항상 똑같아 보여?"라는 지적이 정확히 맞았던 부분. 셀프
// 어텐션은 결국 몇 개 안 되는 값(V)의 가중 평균이라서, 토큰 수가 적을수록 층을
// 쌓을수록 전부 같은 값으로 수렴하는 게 수학적으로 당연하다(이걸 학계에서도
// "representation collapse / rank collapse"라고 부른다). 그래서 층 수를
// "깊게 쌓을수록 좋다"가 아니라 "토큰이 1~3개일 때 구별이 살아있는 깊이"로
// 맞췄다 — 인코더 1층 + 디코더 1층(마스크드 셀프어텐션→교차어텐션→FFN 한 블록씩).
// 멀티헤드·마스킹·포지셔널 인코딩·FFN 등 트랜스포머 블록 구성 요소는 전부 그대로
// 들어 있고, 빠진 건 없다 — 깊이만 입력 길이에 맞게 줄인 것이다.
const N_LAYERS = 1;
// FFN(완전연결층, FCN) 은닉 유닛 수 — 기본 트랜스포머는 d_model=512일 때 보통 2048
// (4배)을 쓴다. 여기 d_model=32라 같은 비율로 4배인 128로 둔다. 이 층이 없으면(RNN/
// LSTM처럼 셀을 두는 대신, 셀프 어텐션만 여러 층 쌓으면) 몇 개 안 되는 토큰은 몇 층
// 못 가서 전부 같은 값으로 수렴해버린다("결과물이 왜 항상 똑같아?" 버그의 진짜 원인이
// 바로 이거였다) — 포지션마다 독립적으로 비선형 변환(ReLU)을 끼워 넣어야 막을 수 있다.
const FFN_HIDDEN = 128;

function makeLayers(tag) {
  const layers = [];
  for (let i = 0; i < N_LAYERS; i++) {
    layers.push(makeHeadWeights(NUM_HEADS, D_MODEL, HEAD_DIM, SEED, `${tag}-L${i}`));
  }
  return layers;
}
function makeFFNLayers(tag) {
  const layers = [];
  for (let i = 0; i < N_LAYERS; i++) {
    layers.push(makeFFNWeights(D_MODEL, FFN_HIDDEN, SEED, `${tag}-ffn-L${i}`));
  }
  return layers;
}

const ENCODER_LAYERS = makeLayers('encoder-self-attn'); // 마스킹 없음 (양방향)
const ENCODER_FFN = makeFFNLayers('encoder');
const DECODER_SELF_LAYERS = makeLayers('decoder-masked-self-attn'); // 마스킹 있음 (causal)
const DECODER_CROSS_LAYERS = makeLayers('decoder-cross-attn'); // 마스킹 없음 (인코더 전체를 봄)
const DECODER_FFN = makeFFNLayers('decoder');
const READOUT = randMatrix(6, D_MODEL, mulberry32(SEED ^ hashTag('readout')));
// <SOS>(문장 시작) 토큰 임베딩 — 언어모델 디코더가 첫 포지션에서 보는 "이전 토큰이
// 없음"을 나타내는 고정 벡터. 학습되진 않지만 매번 재현되는 값이다.
const SOS_VEC = (() => {
  const rng = mulberry32(SEED ^ hashTag('sos-token'));
  return Array.from({ length: D_MODEL }, () => (rng() * 2 - 1) * 0.5);
})();
// 예측 헤드 — 디코더 i번째 포지션의 출력을 가지고 "그 자리의 실제 판"(인코더 출력)을
// 예측해본다. 언어모델의 출력 투영(다음 토큰 예측)과 같은 자리.
const PRED = randMatrix(D_MODEL, D_MODEL, mulberry32(SEED ^ hashTag('predict-head')));

// --- attempt(완성한 판 하나) → 벡터 ---
const SCENE_ORDER = ['jinbeop', 'print', 'tbd', 'hangul'];
const SPEED_SCORE = { fast: 1, mid: 0.55, slow: 0.2 };
const OHANG_ORDER = ['mok', 'hwa', 'to', 'geum', 'su'];

const SPEED_ORDER = ['fast', 'mid', 'slow'];
const FREQ_PAIRS = 9; // sin/cos 10쌍 = 20칸 — 서로 다른 주파수라 조금씩만 달라도 패턴이 겹치지 않는다

// [임베딩 차원 확장] 오행을 숫자 하나(0~1)로 넣으면 "목이 화보다 작다"처럼 실제로는
// 없는 순서 관계를 거짓으로 알려주게 된다 — 그래서 장면(3)·오행(5)·속도(3)는 전부
// 원-핫으로 넣는다. 나머지 칸은 완성 시드(seed)를 서로 다른 주파수의 사인/코사인으로
// 펼쳐서 채운다 — 차원을 "늘리기 위해" 0으로 패딩하는 게 아니라, 각 칸이 서로 다른
// 세밀도로 그 판을 구별하게 하기 위해서다(포지셔널 인코딩과 같은 발상을 내용에도 적용).
export function attemptToVector(attempt) {
  const sceneIdx = SCENE_ORDER.indexOf(attempt.sceneId);
  const ohangIdx = OHANG_ORDER.indexOf(attempt.ohangKey);
  const speedIdx = SPEED_ORDER.indexOf(attempt.speed);
  const v = new Array(D_MODEL).fill(0);
  if (sceneIdx >= 0) v[sceneIdx] = 1; // v[0..3] : 장면 원-핫
  if (ohangIdx >= 0) v[4 + ohangIdx] = 1; // v[4..8] : 오행 원-핫
  if (speedIdx >= 0) v[9 + speedIdx] = 1; // v[9..11] : 속도 원-핫
  for (let i = 0; i < FREQ_PAIRS; i++) {
    const freq = attempt.seed * Math.pow(1.7, i) * 0.00005;
    const base = 12 + i * 2;
    if (base < D_MODEL) v[base] = Math.sin(freq);
    if (base + 1 < D_MODEL) v[base + 1] = Math.cos(freq);
  }
  if (D_MODEL > 31) v[31] = (attempt.seed % 13) / 13;
  // [노드값 정규화] 원-핫(0 또는 1)과 사인/코사인(-1~1)이 서로 다른 스케일로 섞여
  // 있으면 특정 칸이 부당하게 더 큰 영향을 준다 — 포지셔널 인코딩을 더하기 전에
  // 정규화(평균 0, 크기 1 근처)해서 모든 칸이 공평하게 출발하게 한다.
  return layerNorm(v);
}

// attempts: 완성한 판들(1~3개). 결과: 화면을 그리는 데 쓰는 시각 파라미터 +
// "실제로 각 판에 얼마나 주목했는지"를 그대로 보여줄 수 있는 attentionBySceneId.
export function synthesizeAttention(attempts) {
  if (!attempts || attempts.length === 0) return null;

  // [실측으로 찾은 버그 수정] attemptToVector는 layerNorm으로 크기를 1로 맞춰 두는데,
  // positionalEncoding은 성분이 거의 ±1이라 32차원 전체 크기가 ~4나 된다 — 그대로
  // 더하면 포지션 정보가 내용 정보를 4배 가까이 덮어버려서, 서로 다른 판이었는데도
  // 인코더 입력부터 이미 코사인 유사도 0.8~0.9로 거의 같은 벡터가 되어 있었다(실측
  // 확인됨). "Attention Is All You Need" 논문도 바로 이 이유로 임베딩에 √d_model을
  // 곱해서 포지셔널 인코딩과 크기를 맞춘다 — 그 처리를 그대로 가져온다.
  const EMBED_SCALE = Math.sqrt(D_MODEL);

  // 내용 임베딩 + 포지셔널 인코딩(사인/코사인)을 더해 인코더 입력을 만든다.
  let encSeq = attempts.map((a, pos) =>
    addVec(attemptToVector(a).map((x) => x * EMBED_SCALE), positionalEncoding(pos, D_MODEL))
  );

  // 인코더 3층 — 양방향 자기-어텐션(마스킹 없음) → 포지션별 FFN(ReLU).
  // [실측으로 찾은 버그 수정 ②] FFN 없이 셀프 어텐션만 쌓으면, 토큰이 몇 개 안 될 때
  // (여기는 1~3개) 레이어를 거칠수록 전부 같은 값으로 수렴해버린다 — 실측으로 확인:
  // 레이어 0 이후 코사인 유사도 0.99, 레이어 2 이후엔 1.000(완전히 같은 벡터)까지
  // 뭉개졌다. 셀프 어텐션은 결국 값(V)들의 가중 평균이라서, 포지션마다 독립적으로
  // 비선형 변환을 끼워주는 FFN이 없으면 "평균의 평균의 평균"을 반복하는 것과 같다.
  // RNN/LSTM처럼 순차적으로 가지 않고 인코더-디코더(시퀀스투시퀀스) 구조를 쓰는 대신,
  // 그 자리를 대신해 비선형성을 주는 게 FFN의 역할이다.
  ENCODER_LAYERS.forEach((mh, li) => {
    const { out } = multiHeadSelfAttention(encSeq, mh, { causal: false });
    encSeq = applyFeedForward(out, ENCODER_FFN[li]);
  });
  const encOut = encSeq;

  // 디코더는 "언어모델"이다 — 입력을 오른쪽으로 한 칸 밀어(shift-right) 넣는다.
  // 포지션 0 = <SOS>(이전 토큰 없음), 포지션 i(i≥1) = "바로 이전 판"의 인코더 출력.
  // 그래서 i번째 디코더 포지션은 딱 "판1..판(i-1)까지만 보고 판i를 예측"하는 자리가
  // 된다 — 교사강요(teacher forcing) 언어모델 디코더의 입력 구성 그대로. 여기에도
  // 같은 이유로 EMBED_SCALE을 곱한 뒤 포지셔널 인코딩을 더한다.
  let decSeq = encOut.map((_, pos) => {
    const prevVec = (pos === 0 ? SOS_VEC : encOut[pos - 1]).map((x) => x * EMBED_SCALE);
    return layerNorm(addVec(prevVec, positionalEncoding(pos, D_MODEL)));
  });
  let lastCrossWeights = attempts.map(() => 1 / attempts.length);

  for (let l = 0; l < N_LAYERS; l++) {
    // ① 마스크드 셀프 어텐션 — 마스킹은 여기, 디코더에 있다. i번째 포지션은 자기 자신과
    // 그 이전 포지션만 보고, 아직 오지 않은 뒤 포지션은 -Infinity로 가린다.
    const selfResult = multiHeadSelfAttention(decSeq, DECODER_SELF_LAYERS[l], { causal: true });
    decSeq = selfResult.out;

    // ② 교차 어텐션 — 각 디코더 포지션이 인코더 출력 전체를 본다(마스킹 없음).
    const nextDecSeq = [];
    decSeq.forEach((q, i) => {
      const { out, avgWeights } = multiHeadCrossAttention(q, encOut, DECODER_CROSS_LAYERS[l], 1);
      nextDecSeq.push(out);
      if (i === decSeq.length - 1) lastCrossWeights = avgWeights; // 마지막 포지션 = "지금까지 다 보고 난" 최종 상태
    });
    // ③ 포지션별 FFN(ReLU) — 셀프·교차 어텐션 둘 다 결국 값들의 가중 평균이라서, 이게
    // 없으면 인코더 쪽과 똑같은 이유로 디코더 포지션들도 레이어를 거칠수록 뭉개진다.
    decSeq = applyFeedForward(nextDecSeq, DECODER_FFN[l]);
  }

  const finalVec = decSeq[decSeq.length - 1];

  // 예측 헤드 — 언어모델이 다음 토큰을 예측하듯, 디코더 i번째 포지션의 출력으로
  // "그 자리에 실제로 있었던 판"(인코더 출력 encOut[i])을 예측해본다. 코사인 유사도로
  // "예측이 실제와 얼마나 가까웠는지"를 0~1 사이 숫자(predictionConfidence)로 남긴다 —
  // 학습된 적 없는 가중치라 항상 정확하진 않다(그게 정상이다 — 정답 라벨 자체가 없다).
  const predictions = decSeq.map((v) => matVec(PRED, v));
  const predictionConfidence =
    predictions.reduce((sum, pred, i) => {
      const target = encOut[i];
      const predMag = Math.sqrt(dot(pred, pred)) || 1;
      const targetMag = Math.sqrt(dot(target, target)) || 1;
      const cos = dot(pred, target) / (predMag * targetMag);
      return sum + Math.max(0, cos);
    }, 0) / predictions.length;

  // 같은 판(sceneId)이 여러 개면(이론상) 가중치를 합쳐서 보여준다.
  const attentionBySceneId = {};
  attempts.forEach((a, i) => {
    attentionBySceneId[a.sceneId] = (attentionBySceneId[a.sceneId] || 0) + lastCrossWeights[i];
  });

  // 최종 상태를 6개 숫자로 투영(이것도 고정 가중치 행렬곱) → 모양 파라미터로 변환.
  const readoutRaw = matVec(READOUT, finalVec);
  // 레이어 정규화를 여러 번 거치면서 값의 편차가 작아져, 그대로 소프트맥스를 씌우면
  // 세 모양이 항상 33:33:33에 가깝게 뭉개진다 — 온도(temperature)를 낮춰(=로짓을 키워)
  // 실제로 입력이 다르면 화면에서도 눈에 띄게 다른 비율이 나오게 한다. 트랜스포머에서도
  // 흔히 쓰는 표준적인 보정이며, 어텐션 계산 자체를 바꾸는 건 아니다.
  const SHAPE_TEMP = 0.28;
  const shapeLogits = readoutRaw.slice(0, 3).map((x) => x / SHAPE_TEMP);
  const [fanWing, brushSword, jamoShape] = softmax(shapeLogits);
  const detail = readoutRaw.slice(3, 6).map((x) => Math.max(0, Math.min(1, (x + 1) / 2)));

  return {
    attentionBySceneId,
    shapeWeights: { fanWing, brushSword, jamoShape },
    detail: { a: detail[0], b: detail[1], c: detail[2] },
    predictionConfidence,
  };
}
