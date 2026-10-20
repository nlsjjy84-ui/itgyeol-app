// 업체용 제작 사양서 — 업체가 다시 묻지 않고 견적·제작할 수 있게, 물건마다 크기·재질·공정·따로 다는 부품·색 기준을 한 장으로 적는다.
// 화면과 떨어진 순수 함수라 테스트로 바로 확인한다. 공정·부품 값은 조사한 업체 기준을 옮긴 것이고, 최종 값은 업체 견적에서 확인한다.
// 근거: 풀컬러 출력 최소 벽 1.5mm(JLC3DP 풀컬러 설계 기준) · 부식 구멍 지름 ≥ 판 두께×1.4(Photofabrication Engineering 설계 지침)
//       · 금속 책갈피 0.5mm 화학 부식, 1장 $165 / 100장 $2.48(My Metal Business Card) → 한 판에 모아 부식해야 값이 맞음
//       · 유약 위 전사지 소성 약 800℃ 15분, 식품용 디지털 전사지 약 770℃(The Ceramic Shop 소성 안내)
const PRINT = '풀컬러 3D 프린팅(풀컬러 레진, WJP/PolyJet 계열) — 출력 후 얇은 투명 코팅';
const PRINT_RULE = '최소 벽·기둥 두께 1.5mm(화면 모양에 이미 반영), 색 글자 굵기 0.4mm 이상, 양각 높이 0.8mm 이상';
const COLOR = '색과 무늬는 .glb 파일에 들어 있는 텍스처(sRGB) 그대로. 화면 색과 다르면 파일 색이 기준';

export const SPEC = {
  badge: { size: '가장 긴 변 32mm', material: PRINT, rule: PRINT_RULE, parts: ['뒷면 버터플라이 핀(쇠) 접착'], files: ['출력용 3D 파일(.glb)'] },
  keyring: { size: '가장 긴 변 45mm(술 제외)', material: PRINT, rule: PRINT_RULE, parts: ['쇠 고리(D링 + 열쇠고리)', '술·매듭: 붉은 명주실(파일에서 뺀 부품, 따로 달기)'], files: ['출력용 3D 파일(.glb)'] },
  stamp: { size: '약 20×20×40mm', material: PRINT, rule: `${PRINT_RULE}, 도장면 글자는 좌우가 뒤집힌 채로(찍으면 바로 읽힘) 양각 1mm 이상`, parts: [], files: ['출력용 3D 파일(.glb)'] },
  sumak: { size: '지름 약 45mm', material: PRINT, rule: PRINT_RULE, parts: ['뒷면 네오디뮴 자석(지름 10mm 안팎) 접착'], files: ['출력용 3D 파일(.glb)'] },
  paperweight: { size: '높이 약 70mm', material: PRINT, rule: `${PRINT_RULE}, 속을 꽉 채워 출력(문진 무게)`, parts: ['바닥 미끄럼 방지 펠트'], files: ['출력용 3D 파일(.glb)'] },
  coaster: { size: '지름 약 90mm, 두께 약 4mm', material: PRINT, rule: `${PRINT_RULE}, 컵이 닿는 가운데는 평평하게`, parts: ['바닥 미끄럼 방지 패드'], files: ['출력용 3D 파일(.glb)'] },
  bookmark: { size: '약 30×120mm, 두께 0.5mm', material: '황동 판 0.5mm — 사진 부식(에칭)으로 윤곽 절단과 선 새김을 한 번에. 여러 사람의 책갈피를 한 판에 모아 부식', rule: '구멍 지름은 판 두께의 1.4배(0.7mm) 이상(화면 모양은 약 3mm), 가는 선 폭도 0.7mm 이상', parts: ['술: 붉은 명주실(맨 위 구멍)'], files: ['윤곽 참고용 3D 파일(.glb)', '결과 화면 이미지'] },
  model: { size: '높이 약 50mm', material: PRINT, rule: PRINT_RULE, parts: [], files: ['출력용 3D 파일(.glb)'] },
  fan: { size: '한지 접부채(기성품 살)', material: '한지에 디지털 인쇄 후 대나무 살에 붙임', rule: '무늬 이미지 300dpi 이상', parts: [], files: ['무늬 이미지(결과 화면 이미지 저장)'] },
  towel: { size: '34×80cm 면 수건', material: '면 디지털 날염', rule: '무늬 이미지 300dpi 이상', parts: [], files: ['무늬 이미지(결과 화면 이미지 저장)'] },
  hanky: { size: '45×45cm 면 손수건, 말아박기 단', material: '면 디지털 날염', rule: '무늬 이미지 300dpi 이상', parts: [], files: ['무늬 이미지(결과 화면 이미지 저장)'] },
  scarf: { size: '약 50×150cm 실크(또는 폴리) 스카프', material: '디지털 날염', rule: '무늬 이미지 300dpi 이상, 길이 방향 2회 반복', parts: [], files: ['무늬 이미지(결과 화면 이미지 저장)'] },
  pouch: { size: '약 18×12cm 지퍼 파우치', material: '면·캔버스 디지털 날염 후 봉제', rule: '무늬 이미지 300dpi 이상', parts: ['지퍼'], files: ['무늬 이미지(결과 화면 이미지 저장)'] },
  postcard: { size: '148×100mm 엽서 2장', material: '두꺼운 종이 디지털 인쇄', rule: '무늬 이미지 300dpi 이상', parts: [], files: ['무늬 이미지(결과 화면 이미지 저장)'] },
  frame: { size: '약 10×10cm 그림 + 나무 액자', material: '종이 디지털 인쇄 + 원목 액자(기성품)', rule: '무늬 이미지 300dpi 이상', parts: ['원목 액자·받침'], files: ['무늬 이미지(결과 화면 이미지 저장)'] },
  cup: { size: '백자 잔(기성품)', material: '유약 위 전사(세라믹 전사지를 붙여 약 770~800℃로 다시 구움) — 3D 출력 아님', rule: '입이 닿는 테두리 아래 1cm는 비움', parts: [], files: ['무늬 이미지(결과 화면 이미지 저장)'] },
  spoonrest: { size: '백자 수저받침(기성품)', material: '유약 위 전사(세라믹 전사지를 붙여 약 770~800℃로 다시 구움) — 3D 출력 아님', rule: '수저가 닿는 윗면 가운데는 비움', parts: [], files: ['무늬 이미지(결과 화면 이미지 저장)'] },
};

// 사용자가 고른 실제 전통 재료로 만들 때의 기법 — 결과 화면 3D(kit.js realLook)와 같은 짝
const TECH_OF = { celadon: '상감(흰·검은 흙)', porcelain: '청화(코발트 그림)', buncheong: '박지·조화(흰 흙 긁어내기)', onggi: '잿물 위 새김', earthen: '새김',
  gold: '두드림(타출)·새김', silver: '두드림(타출)·새김', yugi: '방짜 두드림·새김', bronze: '주물·새김', iron: '두드림', ipsa: '입사(쇠 바탕에 은실 박기)',
  silk: '자수', ramie: '자수', hemp: '자수', cotton: '자수', knot: '매듭·자수', horsehair: '말총 엮기',
  wood: '새김(조각)', paulownia: '새김(조각)', bamboo: '새김(낙죽)', jade: '새김', granite: '새김', inkstone: '새김', bone: '새김', gem: '새김', glass: '새김',
  hanji: '찍기(목판·인쇄)', straw: '엮기·물들이기', leather: '찍기·새김', dancheong: '단청 채색', ink: '먹 그림' };
const INLAY_OF = { najeon: '나전(자개 붙이기)', hwagak: '화각(쇠뿔 뒷그림)', gilt: '금박', gold: '금박', silver: '은입사' };
export function techniqueOf(baseId, accentId) {
  if (baseId === 'otchil') return accentId ? INLAY_OF[accentId] || '칠 위 무늬 박기' : '주칠 그림';
  return TECH_OF[baseId] || '찍기(인쇄)';
}
// mat: { base: {id, name}, accent: {id, name} | null, shops: [[이름, 갈래, 주소, 전화]] }
export function materialLines(mat) {
  if (!mat || !mat.base) return [];
  const names = [mat.base.name, mat.accent ? mat.accent.name : null].filter(Boolean).join(' 바탕 + 무늬 ');
  return [
    `고른 전통 재료: ${mat.accent ? names : mat.base.name}`,
    `전통 기법: ${techniqueOf(mat.base.id, mat.accent && mat.accent.id)} — 무늬 자리는 출력용 파일(.glb)의 무늬를 그대로 따른다`,
    `실물 공정: 공방 수작업(재료가 바뀌면 풀컬러 출력이 아니라 해당 재료 공방에서 만든다. 출력물은 시안으로 함께 보낼 수 있음)`,
    mat.shops && mat.shops.length ? `맡길 수 있는 곳(예): ${mat.shops.slice(0, 3).map((x) => [x[0], x[3]].filter(Boolean).join(' ')).join(' / ')}` : null,
  ].filter(Boolean);
}

// 사양서 글 만들기: 주문 번호·물건·크기(출력 파일에서 잰 값이 있으면 그 값)·재질·공정·부품·파일
export function makerSpec({ product, title, variant, code, mm, made, mat }) {
  const s = SPEC[product];
  if (!s) return null;
  const size = mm ? `${Math.round(mm.x)}×${Math.round(mm.y)}×${Math.round(mm.z)}mm (출력용 파일에서 잰 값)` : s.size;
  const lines = [
    '잇결 제작 사양서',
    `주문 번호: ${code || '-'}`,
    `물건: ${title}${variant ? ` · ${variant}` : ''}`,
    `크기: ${size}`,
    ...(mat && mat.base ? materialLines(mat) : [`재질·공정: ${s.material}`]),
    `제작 기준: ${s.rule}`,
    `따로 다는 부품: ${s.parts.length ? s.parts.join(', ') : '없음'}`,
    `받을 파일: ${s.files.join(', ')}`,
    `색 기준: ${COLOR}`,
    made ? `만든 날: ${made}` : null,
    '',
    '이 모양은 사용자의 놀이 기록으로 만들어진 하나뿐인 모양입니다. 모양을 바꾸지 말고, 만들 수 없는 곳이 있으면 제작 전에 알려 주세요.',
  ];
  return lines.filter((x) => x !== null).join('\n');
}
