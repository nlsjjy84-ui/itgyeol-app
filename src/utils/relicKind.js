// 유물 종류 묶음 — 도감에서 종류별로 골라 보기(예전 합체 「자리」 대신). 박물관 분류(c)와 종류(t_)로 나눈다.
import { MEANING, MOTIF } from '../data/pieceMeaning';

export const KINDS = ['그릇', '문방구', '꾸미개', '기와·벽돌', '무기·말갖춤', '불교·제사', '놀잇감·인형', '생활 도구', '그 밖의 유물'];
const BY_TYPE = [
  ['놀잇감·인형', /토우|인형|바둑|윷|주사위|말모양|말 모양|오리모양|놀이/],
  ['생활 도구', /가락바퀴|방추차|등갓|등잔|^등$|저울|추$|보자기|영자|못$|수레|굴대|열쇠|자물쇠|가위|침통|베개|부채|나침반|척$|해시계|일구|자격루|혼천의|함$|바느질/],
  ['그릇', /항아리|병|주전자|주자|접시|대접|사발|완|잔|발$|합|단지|매병|그릇|찻|술|소반|수저|숟가락|세반|대야/],
  ['문방구', /연적|벼루|필통|도장|인장|먹|붓|문방/],
  ['꾸미개', /흉배|귀걸이|비녀|꽂이|노리개|꾸미개|가락지|곱은옥|허리띠|띠고리|대구|교구|과대|구슬|떨잠|동곳|목걸이|팔찌|거울|경$/],
  ['기와·벽돌', /기와|막새|벽돌|전돌|치미|잡상|풍탁|귀면/],
  ['무기·말갖춤', /칼|검|창|화살|촉|투구|갑옷|활|재갈|등자|안장|행엽|말띠|운주|총통|화포/],
  ['불교·제사', /불상|보살|여래|향로|사리|탑|방울|요령|금강|제기|명기|정병|용작|용준|작$|준$/],
];
const BY_CLASS = [
  ['그릇', /^식 -/],
  ['문방구', /문방구|인장/],
  ['꾸미개', /장신구|^의 -|화장구/],
  ['기와·벽돌', /건축부재/],
  ['무기·말갖춤', /^군사|마구/],
  ['불교·제사', /^종교신앙|제례/],
];
const cache = {};
export function kindOf(p) {
  if (!p) return '그 밖의 유물';
  if (cache[p.k]) return cache[p.k];
  const m = MEANING[p.k] || {};
  const typeId = (m.w || []).find((id) => id.startsWith('t_'));
  const typeName = typeId && MOTIF[typeId] ? MOTIF[typeId].n : '';
  let k = null;
  // 놀잇감·생활 도구는 이름으로 먼저 가린다(박물관 분류에서는 「산업/생업」 등으로 흩어져 있다)
  for (const [name, re] of BY_TYPE.slice(0, 2)) if (re.test(typeName) || re.test(p.name || '')) { k = name; break; }
  if (!k && m.c) for (const [name, re] of BY_CLASS) if (re.test(m.c)) { k = name; break; }
  if (!k) for (const [name, re] of BY_TYPE) if (re.test(typeName) || re.test(p.name || '')) { k = name; break; }
  cache[p.k] = k || '그 밖의 유물';
  return cache[p.k];
}
