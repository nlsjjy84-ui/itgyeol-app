// 결과물(물건)과 닿아 있는 전통 자료를 고르는 규칙 — 자료 이름·분야·재료·문양으로만 고른다.
import { ARCHIVE } from './archive';

const has = (e, re) => re.test(e.ko);
const RULES = {
  norigae: [(e) => has(e, /패옥|매듭|주머니|향갑|노리개|족두리/), (e) => e.cat === 'royal'],
  binyeo: [(e) => has(e, /비녀|동곳/), (e) => has(e, /족두리|관|드리개|장식/)],
  ring: (e) => e.cat === 'royal' && has(e, /팔찌|귀걸이|목걸이|비녀|가락지/),
  mirror: (e) => has(e, /거울/),
  brush: (e) => e.cat === 'scholar',
  ink: [(e) => has(e, /연적|벼루/), (e) => has(e, /필통|책|문자도|두보/)],
  fan: [(e) => has(e, /부채/), (e) => e.mot.includes('학')],
  lock: [(e) => has(e, /자물쇠/), (e) => has(e, /문서함|궤|장$|서랍장|상자|담배합/)],
  sogo: (e) => e.cat === 'music',
  pouch: [(e) => has(e, /주머니/), (e) => has(e, /향갑|패옥|매듭|자수|버선|활옷/)],
  dice: (e) => e.cat === 'motif',
  brooch: [(e) => has(e, /장식|드리개|비녀/), (e) => e.cat === 'motif' || e.cat === 'royal'],
  magnet: (e) => e.cat === 'motif',
  sticker: (e) => e.cat === 'motif',
  moonjar: [(e) => has(e, /달항아리/), (e) => e.mat.includes('백자')],
  maebyeong: [(e) => has(e, /매병/), (e) => has(e, /청자/)],
  bandaji: (e) => e.cat === 'wood',
  bottari: (e) => e.cat === 'textile',
  gat: [(e) => has(e, /갓|백립/), (e) => has(e, /관|단령|흉배/)],
  soban: [(e) => has(e, /상$|소반/), (e) => e.cat === 'wood'],
  bell: [(e) => has(e, /동종|종$/), (e) => has(e, /풍경|요령/)],
  crown: [(e) => has(e, /금관|은관|관\(冠\)|드리개/), (e) => has(e, /금|허리띠|귀걸이|목걸이|족두리/)],
  pagoda: [(e) => has(e, /탑/), (e) => has(e, /사리|불|향로|향완|풍경|요령/)],
  hanok: (e) => e.cat === 'architecture' || has(e, /수막새|서까래|종택/),
  onggi: [(e) => has(e, /항아리/), (e) => has(e, /병$|매병/)],
  kite: [(e) => has(e, /꼭지연/), (e) => e.cat === 'music'],
};

// 규칙은 함수 하나(조건) 또는 [강한 조건, 약한 조건]. 강하게 닿은 자료를 앞에 둔다.
export function linkedArchive(itemId, limit = 10) {
  const rule = RULES[itemId];
  if (!rule) return ARCHIVE.slice(0, limit);
  const [strong, weak] = Array.isArray(rule) ? rule : [rule, null];
  const a = ARCHIVE.filter(strong);
  const b = weak ? ARCHIVE.filter((e) => !strong(e) && weak(e)) : [];
  const hit = [...a, ...b];
  return (hit.length ? hit : ARCHIVE.filter((e) => e.cat === 'motif')).slice(0, limit);
}
