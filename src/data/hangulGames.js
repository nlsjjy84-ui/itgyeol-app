import { t as i18nT } from '../i18n';
// 한글 테트리스 판 — 같은 놀이를 "단계"로 나눠 서로 다른 문제로 센다.
// 단계가 오를수록 지워야 할 줄이 늘고 블록이 빨리 떨어진다.
export const HANGUL_STAGES = [
  { id: 'st1', name: '1단계 · 천천히', tag: '2줄', lines: 2, dropMs: 1200, level: 'easy',
    tip: '블록이 천천히 떨어져요. ㅗ를 돌리면 ㅏ → ㅜ → ㅓ로 바뀌는 걸 읽으며 익혀 봐요.' },
  { id: 'st2', name: '2단계 · 보통', tag: '3줄', lines: 3, dropMs: 950, level: 'easy',
    tip: '막대(ㅣ·ㅡ)는 한 번 돌릴 때마다 서 있다가 누웠다가 해요. 90도씩 네 번 돌리면 처음 모양으로 돌아와요.' },
  { id: 'st3', name: '3단계 · 빠르게', tag: '5줄', lines: 5, dropMs: 720, level: 'hard',
    tip: '속도가 올라가요. 스페이스바로 쭉 내리면 빠르게 쌓을 수 있어요.' },
  { id: 'st4', name: '4단계 · 달인', tag: '8줄', lines: 8, dropMs: 560, level: 'hard',
    tip: 'ㄷ은 5칸짜리 특수 블록이에요. 가끔 나오니 빈칸을 미리 남겨 두면 좋아요.' },
];

export function hangulMission(stage) {
  return {
    kicker: i18nT('한글 · 자모 테트리스'),
    title: i18nT('한글 테트리스'),
    story: i18nT('한글 자음 ㄱ·ㄴ·ㄷ·ㅁ과 모음 ㅏ·ㅑ·ㅓ·ㅕ·ㅗ·ㅛ·ㅜ·ㅠ·ㅡ·ㅣ·ㅐ·ㅒ는 선과 점으로 이루어져 블록처럼 맞춰 쌓을 수 있어요. 규칙은 일반 테트리스와 똑같아요.'),
    mission: i18nT('떨어지는 글자 블록을 쌓아 가로 줄 {p0}줄을 지워 보자 🧱', { p0: stage.lines }),
    steps: [
      i18nT('← → 로 옮기고, 돌리기(↑)를 누를 때마다 90도씩 돌아요. 네 번 돌리면 제자리예요.'),
      i18nT('가로 한 줄이 빈틈없이 차면 그 줄이 지워져요.'),
      i18nT('{p0}줄을 지우면 성공이에요. 꼭대기까지 쌓이면 다시 해요.', { p0: stage.lines }),
    ],
  };
}
