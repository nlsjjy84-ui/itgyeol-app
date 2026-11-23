// 효과음 — 북·꽹과리·징·가야금 소리를 짧게 만들어 두었다. 소리가 안 나오는 환경이어도
// 앱이 멈추지 않도록 모든 호출은 조용히 실패한다.
let createAudioPlayer = null;
try {
  // eslint-disable-next-line global-require
  createAudioPlayer = require('expo-audio').createAudioPlayer;
} catch (e) {
  createAudioPlayer = null;
}

const FILES = {
  drum: require('../../assets/sfx/drum.wav'), // 북 — 시작·큰 동작
  gong: require('../../assets/sfx/gong.wav'), // 꽹과리 — 성공 강조
  jing: require('../../assets/sfx/jing.wav'), // 징 — 완성
  tap: require('../../assets/sfx/tap.wav'), // 딱 — 일반 누름
  stamp: require('../../assets/sfx/stamp.wav'), // 도장
  ok: require('../../assets/sfx/ok.wav'), // 가야금 — 맞았을 때
  fail: require('../../assets/sfx/fail.wav'), // 둔한 북 — 아쉬울 때
  // 국악 관·현악기 — 장면마다 악기를 달리 쓴다
  daegeum: require('../../assets/sfx/daegeum_start.wav'), // 대금 — 시작·여는 소리
  piri: require('../../assets/sfx/piri_done.wav'), // 피리 — 완성
  haegeum: require('../../assets/sfx/haegeum_ok.wav'), // 해금 — 성공
  gayageum: require('../../assets/sfx/gayageum_ok.wav'), // 가야금 — 맞췄을 때
  geomungo: require('../../assets/sfx/geomungo_fail.wav'), // 거문고 — 아쉬울 때
  daegeumCalm: require('../../assets/sfx/daegeum_calm.wav'), // 대금 — 결과 화면
  // 유물 합체 — 옛날 로봇 만화영화의 합체 장면처럼
  fly: require('../../assets/sfx/fly.wav'), // 조각이 날아오는 소리
  clank: require('../../assets/sfx/clank.wav'), // 철컥 끼워짐
  lock: require('../../assets/sfx/lock.wav'), // 치익-쿵 잠김
  shine: require('../../assets/sfx/shine.wav'), // 완성 팡파르
  transform: require('../../assets/sfx/transform.wav'), // 변신 기계음
  unwrap: require('../../assets/sfx/unwrap.wav'), // 보따리 풀기
  bgm: require('../../assets/sfx/bgm_hapche.wav'), // 굿거리(들판)
  bgmSea: require('../../assets/sfx/bgm_sea.wav'), // 중모리(바다)
  bgmSky: require('../../assets/sfx/bgm_sky.wav'), // 자진모리(하늘)
  bgmSpace: require('../../assets/sfx/bgm_space.wav'), // 세마치(우주)
  // 이야기 영상 바탕 — 평조 다섯 음을 가야금처럼 뜯는 잔잔한 64초 고리(tools/voice/make_story_bgm.py로 직접 만듦)
  bgmStory: require('../../assets/sfx/bgm_story.mp3'),
  clankMetal: require('../../assets/sfx/clank_metal.wav'), // 쇠 — 쨍
  clankClay: require('../../assets/sfx/clank_clay.wav'), // 흙·도자기 — 탁
  clankStone: require('../../assets/sfx/clank_stone.wav'), // 돌·옥 — 딱
  clankWood: require('../../assets/sfx/clank_wood.wav'), // 나무·종이·천 — 똑
  steam: require('../../assets/sfx/steam.wav'), // 칙칙폭폭(기차 연기)
  splash: require('../../assets/sfx/splash.wav'), // 첨벙(물줄기·물레방아·징검다리·물결)
  whirl: require('../../assets/sfx/whirl.wav'), // 빙글(별·바람개비·팽이·등대 빛)
};

const players = {};
let muted = false;

export function setMuted(v) {
  muted = !!v;
}
export function isMuted() {
  return muted;
}

export function play(name) {
  if (muted || !createAudioPlayer || !FILES[name]) return;
  try {
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(FILES[name]);
      // 귀에 거슬리지 않게 — 효과음은 작게, 배경음악은 더 작게
      try { p.volume = name.startsWith('bgm') ? 0.35 : 0.55; } catch (e) { /* 볼륨을 못 바꾸는 환경 */ }
      players[name] = p;
    }
    try {
      p.seekTo(0);
    } catch (e) {
      // 처음 재생할 때는 되감기가 필요 없다
    }
    const r = p.play();
    if (r && typeof r.catch === 'function') r.catch(() => {});
  } catch (e) {
    // 소리가 안 나도 체험은 계속된다
  }
}

// 길게 나는 소리(배경음악)를 멈춘다
export function stop(name) {
  const p = players[name];
  if (!p) return;
  try {
    p.pause();
    p.seekTo(0);
  } catch (e) {
    // 멈추지 못해도 체험은 계속된다
  }
}

// 배경음악을 작게, 끝없이 돌린다(이야기 영상처럼 목소리 밑에 까는 음악)
// 웹에서는 브라우저 오디오를 직접 써서, 재생 중에 멈춰도 오류가 나지 않게 한다(play()의 약속을 받아 처리).
const webLoops = {};
const isWeb = typeof window !== 'undefined' && typeof window.Audio === 'function';
const srcOf = (m) => (typeof m === 'string' ? m : m && (m.uri || m.default)) || null;
export function playLoop(name, volume = 0.35) {
  if (muted || !FILES[name]) return;
  try {
    if (isWeb) {
      let a = webLoops[name];
      if (!a) {
        const src = srcOf(FILES[name]);
        if (!src) return;
        a = new window.Audio(src);
        a.loop = true;
        webLoops[name] = a;
      }
      a.volume = volume;
      const r = a.play();
      if (r && typeof r.catch === 'function') r.catch(() => {});
      return;
    }
    if (!createAudioPlayer) return;
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(FILES[name]);
      players[name] = p;
    }
    p.loop = true;
    p.volume = volume;
    const r = p.play();
    if (r && typeof r.catch === 'function') r.catch(() => {});
  } catch (e) {
    // 소리가 안 나도 체험은 계속된다
  }
}
export function stopLoop(name) {
  const a = webLoops[name];
  if (a) {
    try {
      a.pause();
    } catch (e) {}
    return;
  }
  stop(name);
}
