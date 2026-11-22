// 작업실 시제품 — 국립중앙박물관이 공개한 유물 3D 스캔(공공누리 제1유형)을 실사 재질·조명 속에 놓아 렌더한 사진.
// k: 앱 유물 키(앱 도감에 있는 유물만), relicId: 국립중앙박물관 소장품 번호.
export const CRAFT_SHOTS = [
  {
    id: 'monkey_diffuser',
    k: 'nmk_4220',
    relicId: 4220,
    relic: '청자 석류 모양 연적',
    to: '한 방울 디퓨저',
    why: '위 꽃 모양 구멍으로 물을 넣고 원숭이 입으로 조금씩 따르던 연적이라, 같은 구멍에 리드를 꽂아 향을 조금씩 올려요.',
    img: require('../../assets/crafts/monkey_diffuser.webp'),
  },
  {
    id: 'monkey_weight',
    k: 'nmk_4220',
    relicId: 4220,
    relic: '청자 석류 모양 연적',
    to: '한지 위 문진',
    why: '먹과 붓 곁, 책상 위에 있던 문방구라 실제 크기(약 8cm) 그대로 종이를 눌러 둬요.',
    img: require('../../assets/crafts/monkey_weight.webp'),
  },
  {
    id: 'lotus_coaster',
    relicId: 4390,
    relic: '연화문 벽돌 (백제)',
    to: '코스터 4장 세트',
    why: '네 모서리에 꽃을 4분의 1씩 새겨 4장을 이어 깔면 꽃 하나가 되던 벽돌이라, 넷이 둘러앉아 잔을 놓는 코스터 4장이 돼요. (보물 — 실물 복제품은 박물관 허가가 필요해요)',
    img: require('../../assets/crafts/lotus_coaster.webp'),
  },
  {
    id: 'lotus_clock',
    relicId: 4390,
    relic: '연화문 벽돌 (백제)',
    to: '벽시계',
    why: '건물 벽과 기단에 깔던 벽돌이라 다시 벽으로 — 연꽃 가운데 씨방 자리에 시곗바늘 축을 둬요. (보물 — 실물 복제품은 박물관 허가가 필요해요)',
    img: require('../../assets/crafts/lotus_clock.webp'),
  },
  {
    id: 'sansu_frame',
    relicId: 856,
    relic: '산수무늬 벽돌 (백제)',
    to: '부조 액자',
    why: '산·나무·물·구름을 산수화처럼 새긴 벽돌이라, 그림처럼 벽에 거는 액자가 돼요. (보물 — 실물 복제품은 박물관 허가가 필요해요)',
    img: require('../../assets/crafts/sansu_frame.webp'),
  },
  {
    id: 'bell_meditation',
    relicId: 1168,
    relic: '청동 금강령',
    to: '탁상 명상벨',
    why: '모든 부처를 기쁘게 하고 중생의 잠든 불성을 일깨우려 흔들던 방울이라, 하루를 시작하고 마음을 모을 때 울리는 종이 돼요.',
    img: require('../../assets/crafts/bell_meditation.webp'),
  },
];
export const relicPage = (id) => `https://www.museum.go.kr/MUSEUM/contents/M0502000000.do?schM=view&searchId=search&relicId=${id}`;
