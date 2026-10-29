import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Text from './Text';
import Mascot from '../components/Mascot';
import { colors, fonts } from '../theme';
import { play } from '../utils/sound';
import { t } from '../i18n';
import { useJourney } from '../context/JourneyContext';

// 풍이와 결이의 길 안내 — 처음 온 사람(면접관·전시 관람객)이 앱 전체를 따라오며 보게 한다.
// AIRA와 같은 대표 캐릭터·같은 방식: 코스를 고르고(3분 간략 / 10분 자세히 / 평가자용 5분),
// 지금 있는 곳과 다음 목적지를 말해 주고, 「데려다줄게」로 그 화면까지 바로 간다.
// 말풍선은 두 줄 안팎으로 "이게 뭔지, 왜 좋은지"만. 끝까지 돌면 오늘 한 일을 큰 글씨로 정리한다.
// 놀이를 끝까지 해야만 다음으로 가지는 않는다(놀이 하나가 3~5분이라, 보고 넘어가도 되게).

const KEY = 'itgyeol_guide_v1';
const GREETED = 'itgyeol_guide_greeted';
const isWeb = Platform.OS === 'web';
// 자동 브라우저 테스트(Playwright 등)에서는 안내가 화면을 가리지 않게 숨긴다. 주소에 guide=1 이 있으면 테스트에서도 켠다.
const HIDDEN = (() => {
  try {
    return isWeb && typeof navigator !== 'undefined' && navigator.webdriver && !(typeof location !== 'undefined' && /[?&]guide=1/.test(location.search || ''));
  } catch (e) {
    return false;
  }
})();

// 화면 이름(지금 위치를 말할 때)
const PLACE = {
  Home: '홈',
  Jinbeop: '진법 판',
  Print: '훈민정음·인쇄 판',
  Play: '전래놀이 판',
  Hangul: '한글 테트리스 판',
  Talchum: '탈춤 판',
  Dancheong: '단청 판',
  Result: '내 작품',
  Materials: '전통 재료',
  Gallery: '예시 작품',
  Archive: '전통 자료실',
  Exhibit: '잇결 전시관',
  ExhibitWall: '전시 벽',
  Kiosk: '키오스크',
  Maker: '업체 화면',
  Book: '그림책',
  Taste: '시작 질문',
};

export const STEPS = {
  play: { route: 'Play', who: 'pung', say: '전래놀이 하나만 짧게 해 보자! 놀이마다 손 동작이 다 달라. 마음에 드는 걸 골라 봐.' },
  result: { route: 'Result', who: 'gyeol', say: '놀이한 기록이 작품 모양을 빚었어. 손가락으로 돌려 봐! 같은 기록이면 같은 작품, 다른 놀이면 다른 모양이야.' },
  gallery: { route: 'Gallery', who: 'pung', say: '다른 사람들이 가져간 예시 작품 450점이야. 똑같은 게 하나도 없지?' },
  archive: { route: 'Archive', who: 'gyeol', say: '작품의 바탕이 된 실제 유물 121점이야. 이름·시대·재료는 박물관 기록에서만 가져왔어.' },
  jinbeop: { route: 'Jinbeop', who: 'pung', say: '풍물 진풀이·강강술래·학익진 같은 대형을 만드는 판이야. 누가 어느 자리에 섰는지까지 작품에 남아.' },
  print: { route: 'Print', who: 'gyeol', say: '자음·모음을 짓고 활자로 새겨 찍는 판이야. 훈민정음과 금속활자를 한 판에 담았어.' },
  hangul: { route: 'Hangul', who: 'gyeol', say: '자음·모음 블록을 쌓아 줄을 지우는 한글 테트리스야. 블록을 돌리면 모음도 바뀌어.' },
  talchum: { route: 'Talchum', who: 'pung', say: '북이 덩! 울릴 때 한삼을 휙 뿌리는 탈춤 판이야. 장단이 점점 빨라져. 얼쑤!' },
  dancheong: { route: 'Dancheong', who: 'gyeol', say: '단청은 칸마다 맡은 색과 칠하는 순서가 있어. 순서대로 칠해 봐.' },
  materials: { route: 'Materials', who: 'pung', say: '옻칠·자개·놋쇠·청자·비단… 실제 전통 재료 35가지야. 고른 재료가 작품의 재질이 돼.' },
  exhibit: { route: 'Exhibit', who: 'gyeol', say: '동의한 작품은 잇결 전시관에 걸려. 이름 대신 별명과 나라만 남아.' },
  kiosk: { route: 'Kiosk', who: 'pung', say: '박물관 키오스크 화면이야. QR을 찍으면 줄 서지 않고 내 폰으로 이어서 할 수 있어.' },
  // 평가자용 — 화면보다 "어떻게 믿을 수 있게 만들었는지"
  jResult: { route: 'Result', who: 'gyeol', say: '형태 유전자: 놀이 기록 숫자로 모양을 정해. 같은 기록이면 언제 열어도 같은 작품이고, 1.5mm보다 얇은 곳은 출력 전에 두껍게 다듬어.' },
  jMaterials: { route: 'Materials', who: 'pung', say: '재료 35가지마다 실물 사진에서 색·거칠기·광택을 정했어. 재료가 기법(상감·청화·나전)을 정해.' },
  jMaker: { route: 'Maker', who: 'gyeol', say: '업체 화면이야. 결제가 끝난 주문이 제작 사양서와 함께 들어오고, 서버로 손님 폰·키오스크와 이어져.' },
  jWall: { route: 'ExhibitWall', who: 'pung', say: '전시 벽이야. 다른 기기에서 전시를 신청한 작품도 서버를 거쳐 여기 같이 걸려.' },
  jArchive: { route: 'Archive', who: 'gyeol', say: '실제 유물 121점과 출처야. 사실(박물관 기록)과 해석(짝짓기)을 나눠서 보여 줘.' },
};

export const COURSES = {
  short: { name: '3분 간략', zones: [{ name: '핵심 네 곳', ids: ['play', 'result', 'gallery', 'archive'] }] },
  long: {
    name: '10분 자세히',
    zones: [
      { name: '① 여섯 판', ids: ['jinbeop', 'print', 'play', 'hangul', 'talchum', 'dancheong'] },
      { name: '② 내 작품', ids: ['materials', 'result'] },
      { name: '③ 전시', ids: ['exhibit', 'kiosk'] },
      { name: '④ 자료', ids: ['gallery', 'archive'] },
    ],
  },
  judge: { name: '평가자용 빠른 코스', zones: [{ name: '한 판 놀고 기술 다섯 곳', ids: ['play', 'jResult', 'jMaterials', 'jMaker', 'jWall', 'jArchive'] }] },
};

// 평가자용을 끝내고 10분 코스로 이어 갈 때, 같은 화면은 다시 안 보여 준다.
const SAME_PLACE = { jResult: 'result', jMaterials: 'materials', jArchive: 'archive' };

export const courseIds = (course) => COURSES[course].zones.flatMap((z) => z.ids);
export const zoneOf = (course, id) => COURSES[course].zones.find((z) => z.ids.includes(id)) || null;

function readStore(key) {
  try {
    if (isWeb && typeof window !== 'undefined' && window.sessionStorage) return JSON.parse(window.sessionStorage.getItem(key) || 'null');
  } catch (e) {}
  return null;
}
function writeStore(key, v) {
  try {
    if (isWeb && typeof window !== 'undefined' && window.sessionStorage) window.sessionStorage.setItem(key, JSON.stringify(v));
  } catch (e) {}
}

export function recapLines(done, attempts, materials, course) {
  const boards = new Set((attempts || []).map((a) => a.sceneId)).size;
  // 코스 안의 걸음만 센다(평가자용 걸음이 같은 화면의 일반 걸음까지 본 것으로 쳐서 두 번 세지 않게).
  const ids = course && COURSES[course] ? COURSES[course].zones.flatMap((z) => z.ids) : done;
  const lines = [{ big: t('{n}곳', { n: ids.filter((id) => done.includes(id)).length }), small: t('풍이·결이와 들른 곳') }];
  lines.push({ big: t('{n}판', { n: boards }), small: t('끝까지 놀아서 조각이 생긴 판') });
  if (materials && materials.base) lines.push({ big: t('재료'), small: t('고른 재료가 작품의 재질이 됐어') });
  return lines;
}

const EMPTY = { course: null, index: 0, open: false, done: [] };

function Face({ who, size = 40 }) {
  return <Mascot which={who} size={size} />;
}

function Glow({ label, sub, onPress, soft, wide }) {
  return (
    <Pressable
      onPress={() => { play('tap'); onPress(); }}
      accessibilityRole="button"
      style={({ pressed }) => [st.glow, soft && st.glowSoft, wide && st.wide, pressed && { opacity: 0.85 }]}
    >
      <Text style={[st.glowTxt, soft && st.glowTxtSoft]}>{label}</Text>
      {sub ? <Text style={[st.glowSub, soft && st.glowTxtSoft]}>{sub}</Text> : null}
    </Pressable>
  );
}

function Lanterns({ course, current, done }) {
  return (
    <View style={st.lanterns} accessibilityLabel={t('진행')}>
      {COURSES[course].zones.map((z) => (
        <View key={z.name} style={st.zone}>
          {z.ids.map((id) => (
            <View key={id} style={[st.dot, done.includes(id) && st.dotLit, id === current && st.dotNow]} />
          ))}
        </View>
      ))}
    </View>
  );
}

/** routeName: 지금 화면 이름, navigate: (route) => void, greet: 처음 온 사람에게 한 번 인사할지 */
export default function GuideDuo(props) {
  if (HIDDEN) return null;
  return <Guide {...props} />;
}

function Guide({ routeName, navigate, greet = true }) {
  const journey = useJourney();
  const [state, setState] = useState(() => ({ ...EMPTY, ...(readStore(KEY) || {}) }));
  const update = (patch) =>
    setState((cur) => {
      const change = typeof patch === 'function' ? patch(cur) : patch;
      if (!change || Object.keys(change).length === 0) return cur;
      const next = { ...cur, ...change };
      writeStore(KEY, next);
      return next;
    });

  // 처음 온 사람에게 한 번만 인사(닫으면 다시 강요하지 않는다). 전시 벽·키오스크 같은 전시용 화면에서는 인사하지 않는다.
  useEffect(() => {
    if (!greet || state.course || state.open) return undefined;
    if (routeName === 'ExhibitWall' || routeName === 'Kiosk' || routeName === 'Taste' || routeName === 'Book') return undefined;
    if (readStore(GREETED)) return undefined;
    const timer = setTimeout(() => { writeStore(GREETED, 1); update({ open: true }); }, 1500);
    return () => clearTimeout(timer);
  }, [greet, routeName]); // eslint-disable-line react-hooks/exhaustive-deps

  const ids = state.course ? courseIds(state.course) : [];
  const finished = Boolean(state.course) && state.index >= ids.length;
  const stepId = state.course && !finished ? ids[state.index] : null;
  const step = stepId ? STEPS[stepId] : null;
  const at = Boolean(step) && routeName === step.route;

  const start = (course) => {
    const list = courseIds(course);
    let index = 0;
    while (index < list.length && state.done.includes(list[index])) index += 1;
    update({ course, index, open: true });
  };
  const next = () =>
    update((cur) => {
      const list = courseIds(cur.course);
      const id = list[cur.index];
      const done = [...new Set([...cur.done, id, ...(SAME_PLACE[id] ? [SAME_PLACE[id]] : [])])];
      let index = cur.index + 1;
      while (index < list.length && done.includes(list[index])) index += 1;
      return { index, done };
    });
  const back = () => update((cur) => ({ index: Math.max(0, cur.index - 1) }));
  const finish = () => update({ course: null, index: 0, open: false });
  const go = () => { if (step) navigate(step.route); };

  const zone = step && state.course ? zoneOf(state.course, stepId) : null;
  const position = step && zone ? `${zone.ids.indexOf(stepId) + 1} / ${zone.ids.length}` : '';
  const recap = useMemo(() => recapLines(state.done, journey && journey.attempts, journey && journey.materials, state.course), [state.done, journey, state.course]);

  let body = null;
  if (state.open && !state.course) {
    body = (
      <>
        <View style={st.who}>
          <View style={st.faces}><Face who="pung" /><View style={{ marginLeft: -12 }}><Face who="gyeol" /></View></View>
          <View style={st.whoTxt}><Text style={st.name}>{t('풍이와 결이')}</Text><Text style={st.small}>{t('잇결 길 안내')}</Text></View>
          <Pressable onPress={() => update({ open: false })} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('닫기')}><Text style={st.x}>×</Text></Pressable>
        </View>
        <Text style={st.say}>{t('처음이야? 우리가 앞장설게. 얼마나 둘러볼래?')}</Text>
        <View style={st.choice}>
          <Glow label={t('3분 간략')} sub={t('핵심 네 곳')} onPress={() => start('short')} />
          <Glow label={t('10분 자세히')} sub={t('4구역 열두 곳')} onPress={() => start('long')} soft />
          <Glow label={t('평가자용 빠른 코스')} sub={t('5분 · 면접관·선생님께 · 믿을 수 있게 만든 곳')} onPress={() => start('judge')} soft wide />
        </View>
        <Pressable onPress={() => update({ open: false })} accessibilityRole="button"><Text style={st.link}>{t('나중에 볼게')}</Text></Pressable>
      </>
    );
  } else if (state.open && finished) {
    const short = state.course === 'short';
    const judge = state.course === 'judge';
    body = (
      <>
        <View style={st.who}>
          <View style={st.faces}><Face who="pung" /><View style={{ marginLeft: -12 }}><Face who="gyeol" /></View></View>
          <View style={st.whoTxt}><Text style={st.name}>{t('풍이와 결이')}</Text><Text style={st.small}>{t(COURSES[state.course].name)} · {t('완주')}</Text></View>
        </View>
        <Lanterns course={state.course} current={null} done={state.done} />
        <View style={st.recap} accessibilityLabel={t('오늘의 잇결 길 결산')}>
          <Text style={st.recapTitle}>{t('오늘의 잇결 길 결산')}</Text>
          {recap.map((l) => (
            <View key={l.small} style={st.recapRow}><Text style={st.recapBig}>{l.big}</Text><Text style={st.recapSmall}>{l.small}</Text></View>
          ))}
        </View>
        <Text style={st.say}>
          {judge ? t('평가자용 코스 끝! 설계·테스트 기록은 GitHub와 포트폴리오에 정리해 뒀어.') : short ? t('3분 길 안내 끝! 10분 자세히 코스가 열렸어. 여섯 판을 다 돌아볼래?') : t('네 구역을 다 돌았어! 이제 마음 가는 판부터 놀아 봐. 오른쪽 아래 우리를 누르면 언제든 다시 안내할게.')}
        </Text>
        <View style={st.actions}>
          {short || judge ? <Glow label={judge ? t('나머지도 이어 보기(10분 코스)') : t('10분 자세히 이어 가기')} onPress={() => start('long')} /> : null}
          <Pressable onPress={finish} accessibilityRole="button"><Text style={st.link}>{short || judge ? t('여기까지 볼게') : t('안내 닫기')}</Text></Pressable>
        </View>
      </>
    );
  } else if (state.open && step) {
    body = (
      <>
        <View style={st.who}>
          <Face who={step.who} />
          <View style={st.whoTxt}>
            <Text style={st.name}>{step.who === 'pung' ? t('풍이') : t('결이')}</Text>
            <Text style={st.small}>{t(COURSES[state.course].name)} · {zone ? t(zone.name) : ''} {position}</Text>
          </View>
          <Pressable onPress={() => update({ open: false })} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('안내 접기')}><Text style={st.x}>×</Text></Pressable>
        </View>
        <Lanterns course={state.course} current={stepId} done={state.done} />
        <Text style={st.say}>
          {at ? t(step.say) : t('지금은 {here}에 있어. 다음 목적지는 바로 「{there}」!', { here: t(PLACE[routeName] || '다른 화면'), there: t(PLACE[step.route] || step.route) })}
        </Text>
        <View style={st.actions}>
          {at ? <Glow label={t('다음')} onPress={next} /> : <Glow label={t('데려다줄게')} onPress={go} />}
        </View>
        <View style={st.links}>
          {state.index > 0 ? <Pressable onPress={back} accessibilityRole="button"><Text style={st.link}>{t('이전')}</Text></Pressable> : null}
          {!at ? <Pressable onPress={next} accessibilityRole="button"><Text style={st.link}>{t('건너뛰기')}</Text></Pressable> : null}
          <Pressable onPress={finish} accessibilityRole="button"><Text style={st.link}>{t('안내 끝내기')}</Text></Pressable>
        </View>
      </>
    );
  }

  return (
    <View pointerEvents="box-none" style={st.root}>
      {body ? <View style={st.bubble} accessibilityRole="dialog" accessibilityLabel={t('풍이와 결이의 길 안내')}>{body}</View> : null}
      {/* 첫 질문·그림책·키오스크·전시 벽은 화면 아래 버튼이 많아 길 안내 버튼을 숨긴다(안내를 연 동안만 보인다). */}
      {['Taste', 'Book', 'Kiosk', 'ExhibitWall'].includes(routeName) && !state.open ? null : <Pressable
        onPress={() => { play('tap'); update((cur) => ({ open: !cur.open })); }}
        accessibilityRole="button"
        accessibilityLabel={t('풍이와 결이의 길 안내')}
        style={({ pressed }) => [st.launcher, pressed && { opacity: 0.85 }]}
      >
        <Face who="pung" size={30} />
        <Text style={st.launcherTxt}>{state.course && !finished ? t('이어서 안내') : t('길 안내')}</Text>
        {state.course && !state.open && !finished ? <View style={st.waiting} /> : null}
      </Pressable>}
    </View>
  );
}

const glowShadow = isWeb ? { boxShadow: `0 0 16px ${colors.accent}66, 0 0 34px ${colors.accent}33` } : { shadowColor: colors.accent, shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 };
const st = StyleSheet.create({
  root: { position: isWeb ? 'fixed' : 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 50 },
  launcher: {
    position: 'absolute', right: 14, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 4, paddingLeft: 4, paddingRight: 14, borderRadius: 999, backgroundColor: colors.paper,
    borderWidth: 1, borderColor: colors.borderSoft, ...glowShadow,
  },
  launcherTxt: { fontSize: 13, color: colors.ink, fontFamily: fonts.serifBold },
  waiting: { position: 'absolute', top: 2, left: 28, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.accent },
  bubble: {
    position: 'absolute', right: 12, bottom: 64, width: 340, maxWidth: '94%', padding: 14, gap: 10,
    borderRadius: 22, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.borderSoft, ...glowShadow,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  faces: { flexDirection: 'row' },
  whoTxt: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, color: colors.ink, fontFamily: fonts.serifBold },
  small: { fontSize: 11.5, color: colors.muted },
  x: { fontSize: 22, color: colors.muted, paddingHorizontal: 4 },
  say: { fontSize: 14.5, lineHeight: 22, color: colors.ink },
  choice: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  link: { fontSize: 12.5, color: colors.muted, paddingVertical: 2 },
  glow: { flexGrow: 1, minWidth: 120, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: colors.accent, ...glowShadow },
  glowSoft: { backgroundColor: colors.accentSoft },
  wide: { flexBasis: '100%' },
  glowTxt: { fontSize: 14.5, color: '#fff', fontFamily: fonts.serifBold },
  glowTxtSoft: { color: colors.accentDeep },
  glowSub: { fontSize: 11, color: '#fff', opacity: 0.9, marginTop: 2 },
  lanterns: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  zone: { flexDirection: 'row', gap: 5 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.borderSoft },
  dotLit: { backgroundColor: colors.hwang },
  dotNow: { backgroundColor: colors.accent },
  recap: { padding: 12, borderRadius: 16, backgroundColor: colors.accentSoft, gap: 6 },
  recapTitle: { fontSize: 11, letterSpacing: 1.5, color: colors.accentDeep, fontFamily: fonts.serifBold },
  recapRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  recapBig: { minWidth: 64, fontSize: 22, color: colors.ink, fontFamily: fonts.serifBold },
  recapSmall: { flex: 1, fontSize: 12.5, color: colors.muted },
});
