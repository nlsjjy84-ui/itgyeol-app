// 멀티헤드 어텐션 — 논문 그대로의 구조.
//   MultiHead(Q,K,V) = Concat(head_1, ..., head_h) W^O
//   head_i = Attention(Q W_i^Q, K W_i^K, V W_i^V) = softmax(QK^T / sqrt(d_k)) V
// 헤더(head)마다 Wq/Wk/Wv를 "각각 다르게" 쓰고, 그 결과를 가로로 이어붙인(concat) 뒤
// 마지막에 선형(linear) 출력 투영 W^O 하나를 통과시켜 원래 차원으로 되돌린다.
// 기본 트랜스포머는 8헤더 × 64차원(=512차원)을 쓰지만, 여기서는 실제 입력이
// 사물놀이 장단이나 자모 몇 글자 수준이라 512차원을 쓰면 숫자만 커질 뿐 아무 의미가
// 없다 — 그래서 "헤더 개수 × 헤더당 차원"이라는 같은 구조를 그대로 쓰되 규모만
// 줄였다(4헤더 × 4차원 = 16차원). 헤더 수는 1~8 사이에서 바꿀 수 있게 열어둔다.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashTag(tag) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) | 0;
  return h >>> 0;
}

export function randMatrix(rows, cols, rng, scale = 0.6) {
  const m = [];
  for (let i = 0; i < rows; i++) {
    const row = [];
    for (let j = 0; j < cols; j++) row.push((rng() * 2 - 1) * scale);
    m.push(row);
  }
  return m;
}

export function matVec(mat, vec) {
  return mat.map((row) => row.reduce((s, w, j) => s + w * vec[j], 0));
}

export function dot(a, b) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

export function addVec(a, b) {
  return a.map((v, i) => v + b[i]);
}

export function softmax(arr) {
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0) || 1;
  return exps.map((v) => v / sum);
}

// ReLU — 음수는 0으로 끊어버리는 가장 기본적인 활성화 함수.
export function relu(x) {
  return Math.max(0, x);
}

// 포지션별 피드포워드(FFN) — 트랜스포머 블록에서 셀프/교차 어텐션 다음에 반드시
// 들어가는 부분인데, 이게 빠지면 어텐션만 여러 층 쌓을 때 토큰들이 전부 "같은 값으로
// 뭉개지는" 현상(representation collapse)이 생긴다 — 셀프 어텐션은 결국 값(V)들의
// 가중 평균이라서, 활성화 함수 없이 평균만 계속 반복하면 몇 개 안 되는 토큰은 금방
// 서로 구별이 안 되는 하나의 값으로 수렴해버린다. Linear → ReLU(비선형) → Linear로
// 토큰마다 독립적으로 비선형 변환을 끼워 넣어야 그 수렴을 막을 수 있다 — 논문의
// FFN(x) = max(0, xW1+b1)W2+b2 그대로.
export function makeFFNWeights(dModel, dHidden, seed, tag) {
  const rng = mulberry32(seed ^ hashTag(tag));
  return {
    W1: randMatrix(dHidden, dModel, rng, 0.5),
    b1: Array.from({ length: dHidden }, () => (rng() * 2 - 1) * 0.1),
    W2: randMatrix(dModel, dHidden, rng, 0.5),
    b2: Array.from({ length: dModel }, () => (rng() * 2 - 1) * 0.1),
  };
}

export function feedForward(x, ffn) {
  const hidden = matVec(ffn.W1, x).map((v, i) => relu(v + ffn.b1[i]));
  return matVec(ffn.W2, hidden).map((v, i) => v + ffn.b2[i]);
}

// FFN + 잔차연결 + 정규화 — 시퀀스 전체(각 포지션에 독립적으로)에 적용한다.
export function applyFeedForward(seq, ffn) {
  return seq.map((x) => layerNorm(addVec(x, feedForward(x, ffn))));
}

// 아주 단순화한 레이어 정규화: 평균을 빼고 크기를 1 근처로 맞춘다.
export function layerNorm(vec) {
  const mean = vec.reduce((a, b) => a + b, 0) / vec.length;
  const centered = vec.map((v) => v - mean);
  const mag = Math.sqrt(centered.reduce((s, v) => s + v * v, 0)) || 1;
  return centered.map((v) => v / mag);
}

// "Attention Is All You Need"의 사인/코사인 포지셔널 인코딩 공식 그대로.
export function positionalEncoding(pos, dModel) {
  const pe = new Array(dModel).fill(0);
  for (let i = 0; i < dModel; i += 2) {
    const freq = 1 / Math.pow(10000, i / dModel);
    pe[i] = Math.sin(pos * freq);
    if (i + 1 < dModel) pe[i + 1] = Math.cos(pos * freq);
  }
  return pe;
}

// 헤더마다 고정된(=학습되진 않았지만 매번 재현되는) Wq/Wk/Wv + 마지막 출력 투영 W^O.
//
// [실측으로 찾은 버그 수정] Wq/Wk를 다른 행렬과 같은 작은 스케일(0.6)로 두면, 입력을
// 정규화(layerNorm)한 뒤라 Q·K의 분산이 지나치게 작아져서(실측 스코어 표준편차 ~0.12)
// 소프트맥스가 키가 몇 개든 거의 항상 33:33:33으로 뭉개진다 — 토큰이 서로 아무리
// 달라도 결과가 "항상 똑같아" 보이는 원인이 바로 이거였다. "스케일드 닷-프로덕트
// 어텐션"이 원래 전제하는 건 Q·K 각 성분이 분산 ~1 수준이라는 것(그래야 QKᵀ의 분산이
// 대략 d_k가 되고, 그걸 √d_k로 나눠야 분산이 다시 ~1로 돌아온다) — 그 전제가 깨져 있었다.
// Wq/Wk만 스케일을 키워서(QK_SCALE) 그 전제를 다시 맞춘다. Wv/Wo는 출력 쪽이라
// 기존 스케일을 유지해도 된다(어차피 다음 레이어에서 다시 정규화된다).
const QK_SCALE = 1.7;
export function makeHeadWeights(numHeads, dModel, headDim, seed, tag) {
  const rng = mulberry32(seed ^ hashTag(tag));
  const heads = [];
  for (let h = 0; h < numHeads; h++) {
    heads.push({
      Wq: randMatrix(headDim, dModel, rng, QK_SCALE),
      Wk: randMatrix(headDim, dModel, rng, QK_SCALE),
      Wv: randMatrix(headDim, dModel, rng),
    });
  }
  const Wo = randMatrix(dModel, numHeads * headDim, rng);
  return { heads, Wo, numHeads, headDim, dModel };
}

// 멀티헤드 셀프 어텐션(한 시퀀스가 자기 자신에게 주목) — causal=true면 i번째가
// j>i인 미래 위치를 보지 못하도록 마스킹한다.
// 결과로 {out, attn}을 돌려준다 — attn[h][i][j] = 헤더 h가 i가 j에 준 소프트맥스 가중치.
export function multiHeadSelfAttention(seq, mh, { causal = false } = {}) {
  const { heads, Wo, headDim } = mh;
  const scale = Math.sqrt(headDim);
  const attn = [];
  const perHeadOutputs = heads.map((head) => {
    const Qs = seq.map((v) => matVec(head.Wq, v));
    const Ks = seq.map((v) => matVec(head.Wk, v));
    const Vs = seq.map((v) => matVec(head.Wv, v));
    const headAttn = [];
    const outs = seq.map((_, i) => {
      const scores = Ks.map((k, j) => (causal && j > i ? -Infinity : dot(Qs[i], k) / scale));
      const weights = softmax(scores); // 소프트맥스를 통과시켜 "가중치"로 나타낸다
      headAttn.push(weights);
      let out = new Array(headDim).fill(0);
      weights.forEach((w, j) => {
        out = addVec(out, Vs[j].map((x) => x * w));
      });
      return out;
    });
    attn.push(headAttn);
    return outs;
  });

  const out = seq.map((_, i) => {
    const concat = []; // 가로로 컨캣 — 헤더별 출력을 순서대로 이어붙인다
    perHeadOutputs.forEach((headSeq) => concat.push(...headSeq[i]));
    const projected = matVec(Wo, concat); // 선형 출력 투영 W^O
    return layerNorm(addVec(seq[i], projected)); // 잔차 연결 + 정규화
  });

  return { out, attn };
}

// 멀티헤드 교차 어텐션 — 쿼리 하나가 인코더 시퀀스 전체에 주목한다.
// temperature(<1)를 주면 소프트맥스를 더 날카롭게 만든다 — 이건 어텐션 공식을 바꾸는
// 게 아니라(점수를 스케일링한 뒤 소프트맥스를 통과시키는 건 표준적인 보정이다), 레이어
// 정규화를 여러 번 거치며 입력끼리 값이 비슷해져서 소프트맥스가 항상 33:33:33으로
// 뭉개지는 걸 막기 위한 것 — 실제 입력 차이가 화면에도 눈에 띄게 드러나게 한다.
export function multiHeadCrossAttention(query, encSeq, mh, temperature = 1) {
  const { heads, Wo, headDim } = mh;
  const scale = Math.sqrt(headDim) * temperature;
  const attn = [];
  const perHeadOutputs = heads.map((head) => {
    const Q = matVec(head.Wq, query);
    const Ks = encSeq.map((v) => matVec(head.Wk, v));
    const Vs = encSeq.map((v) => matVec(head.Wv, v));
    const scores = Ks.map((k) => dot(Q, k) / scale);
    const weights = softmax(scores);
    attn.push(weights);
    let out = new Array(headDim).fill(0);
    weights.forEach((w, j) => {
      out = addVec(out, Vs[j].map((x) => x * w));
    });
    return out;
  });
  const concat = [];
  perHeadOutputs.forEach((headOut) => concat.push(...headOut));
  const projected = matVec(Wo, concat);
  const out = layerNorm(addVec(query, projected));
  // 헤더별 가중치를 평균 내서 "이 판에 전체적으로 얼마나 주목했는지" 하나의 숫자로 보여준다.
  const avgWeights = encSeq.map((_, j) => attn.reduce((s, w) => s + w[j], 0) / attn.length);
  return { out, attn, avgWeights };
}
