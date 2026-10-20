"""한글 테트리스 난이도 재기 — 컴퓨터가 단계마다 여러 판을 혼자 두어, 성공률과 걸리는 시간을 잰다.
블록 모양·나오는 비율(WEIGHT)·판 크기는 src/components/HangulTetris.js 에서, 단계(지울 줄·떨어지는 속도)는 src/data/hangulGames.js 에서 그대로 읽는다.
python3 tools/tetris-balance.py [판 수=400]           · 비율을 바꿔 보려면  WEIGHT='{"m9":1,"s":3}' python3 tools/tetris-balance.py  (속도는 DROP='{"st1":1000}')

두는 사람 두 가지:
  처음 하는 사람(어린이) — 좋은 자리를 고르긴 하지만 셋에 하나는 덜 좋은 자리, 열에 하나는 아무 데나. 열에 넷은 자리를 잡고 3초 안에 내리고, 나머지는 저절로 떨어질 때까지 기다림
  익숙한 사람(어른)      — 거의 가장 좋은 자리, 자리를 잡으면 쭉 내림(블록 하나에 약 2초)
"""
import json, os, random, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, '..', 'src', 'components', 'HangulTetris.js'), encoding='utf-8').read()
COLS = int(re.search(r'const COLS = (\d+)', src).group(1))
ROWS = int(re.search(r'const ROWS = (\d+)', src).group(1))
RESCUE = int(re.search(r'const RESCUE_ROWS = (\d+)', src).group(1))
base = src[src.index('const BASE = {'):src.index('};', src.index('const BASE = {'))]
parts = re.split(r'\n  (\w+): \{', base)
PIECES = {}
for k, body in zip(parts[1::2], parts[2::2]):
    cells = [(int(a), int(b)) for a, b in re.findall(r'\[(\d+), (\d+)\]', body.split('cells:')[1].split(']]')[0] + ']]')]
    PIECES[k] = cells
WEIGHT = {k: int(v) for k, v in re.findall(r'(\w+): (\d+)', re.search(r'const WEIGHT = \{([^}]*)\}', src).group(1))}
WEIGHT.update(json.loads(os.environ.get('WEIGHT', '{}')))
gsrc = open(os.path.join(HERE, '..', 'src', 'data', 'hangulGames.js'), encoding='utf-8').read()
STAGES = [(m.group(1), int(m.group(2)), int(m.group(3))) for m in re.finditer(r"id: '(st\d)'.*?lines: (\d+), dropMs: (\d+)", gsrc)]
_drop = json.loads(os.environ.get('DROP', '{}'))  # 떨어지는 속도를 바꿔 보려면 DROP='{"st1":1000}'
_lines = json.loads(os.environ.get('LINES', '{}'))  # 지울 줄 수를 바꿔 보려면 LINES='{"st1":5}'
STAGES = [(sid, _lines.get(sid, tg), _drop.get(sid, ms)) for sid, tg, ms in STAGES]


def rot(cells):
    r = [(-y, x) for x, y in cells]
    mx = min(a for a, b in r); my = min(b for a, b in r)
    return tuple(sorted((a - mx, b - my) for a, b in r))


ROTS = {}
for k, c in PIECES.items():
    seen, cur = [], tuple(sorted(c))
    for _ in range(4):
        if cur not in seen: seen.append(cur)
        cur = rot(cur)
    ROTS[k] = seen
BAG = [k for k, w in WEIGHT.items() if k in PIECES for _ in range(w)]
SPAWN_X = (COLS - 2) // 2 - 1


def fits(board, cells, x, y):
    for cx, cy in cells:
        px, py = x + cx, y + cy
        if px < 0 or px >= COLS or py >= ROWS: return False
        if py >= 0 and board[py][px]: return False
    return True


def drop(board, cells, x):
    if not fits(board, cells, x, 0): return None
    y = 0
    while fits(board, cells, x, y + 1): y += 1
    return y


def place(board, cells, x, y):
    b = [row[:] for row in board]
    for cx, cy in cells: b[y + cy][x + cx] = 1
    keep = [r for r in b if not all(r)]
    n = ROWS - len(keep)
    return [[0] * COLS for _ in range(n)] + keep, n


def score(board, cleared, cells, y):
    # El-Tetris 계수(Pierre Dellacherie 방식을 다듬은 값): 높이·지운 줄·가로 바뀜·세로 바뀜·구멍·우물
    h = max(ROWS - (y + cy) for cx, cy in cells)
    heights = []
    for x in range(COLS):
        top = next((r for r in range(ROWS) if board[r][x]), ROWS)
        heights.append(ROWS - top)
    rt = 0
    for r in board:
        if not any(r): continue
        row = [1] + [1 if c else 0 for c in r] + [1]  # 양옆 벽은 찬 칸으로 본다
        rt += sum(1 for a, b in zip(row, row[1:]) if a != b)
    ct = holes = 0
    for x in range(COLS):
        col = [1 if board[r][x] else 0 for r in range(ROWS - heights[x], ROWS)] + [1]  # 바닥은 찬 칸
        ct += sum(1 for a, b in zip(col, col[1:]) if a != b)
        holes += col.count(0)
    wells = 0
    for x in range(COLS):
        l = heights[x - 1] if x > 0 else ROWS
        r = heights[x + 1] if x < COLS - 1 else ROWS
        d = min(l, r) - heights[x]
        if d > 0: wells += d * (d + 1) // 2
    return -4.5 * h + 3.4 * cleared - 3.2 * rt - 9.3 * ct - 7.9 * holes - 3.4 * wells


def game(target, drop_ms, kid, rng):
    board = [[0] * COLS for _ in range(ROWS)]
    lines = 0; t = 0.0; n = 0; rescues = 0
    nxt = rng.choice(BAG)
    while True:
        k = nxt; nxt = rng.choice(BAG)
        if not fits(board, ROTS[k][0], SPAWN_X, 0):
            # 앱과 같은 규칙: 끝내지 않고 맨 아래 RESCUE 줄을 비운다(지운 줄로 세지 않음)
            board = [[0] * COLS for _ in range(RESCUE)] + board[:ROWS - RESCUE]; rescues += 1
            if rescues > 50: return False, t, n, lines, rescues
        opts = []
        for cells in ROTS[k]:
            w = max(c[0] for c in cells) + 1
            for x in range(0, COLS - w + 1):
                y = drop(board, cells, x)
                if y is None: continue
                b2, cl = place(board, cells, x, y)
                opts.append((score(b2, cl, cells, y), b2, cl, y))
        if not opts: return False, t, n, lines, rescues
        opts.sort(key=lambda o: -o[0])
        if kid:
            u = rng.random()
            o = rng.choice(opts) if u < 0.10 else (opts[min(len(opts) - 1, rng.randint(1, 3))] if u < 0.43 else opts[0])
        else:
            o = opts[1] if rng.random() < 0.08 and len(opts) > 1 else opts[0]
        _, board, cl, y = o
        ms = max(350, drop_ms - lines * 60) / 1000
        t += ((y + 1) * ms if rng.random() < 0.6 else min((y + 1) * ms, 3.0)) if kid else min((y + 1) * ms, 2.0)
        n += 1; lines += cl
        if lines >= target: return True, t, n, lines, rescues


def run(games):
    rng = random.Random(7)
    out = []
    for sid, target, ms in STAGES:
        row = [sid, target, ms]
        for kid in (True, False):
            res = [game(target, ms, kid, rng) for _ in range(games)]
            win = [r for r in res if r[0]]
            ts = sorted(r[1] for r in win)
            row += [sum(1 for r in res if r[4] == 0) / games, ts[len(ts) // 2] if ts else 0, sum(r[4] for r in res) / games]
        out.append(row)
    return out


if __name__ == '__main__':
    g = int(sys.argv[1]) if len(sys.argv) > 1 else 400
    print('블록', len(BAG), '장 주머니 ·', ' '.join(f'{k}:{WEIGHT[k]}' for k in WEIGHT if k in PIECES))
    print('단계  줄  속도ms | 처음 하는 사람: 도움 없이 끝냄  걸린 시간(가운데값)  도움 평균 | 익숙한 사람: 도움 없이  시간  도움')
    for sid, tg, ms, kw, kt, kn, aw, at, an in run(g):
        print(f'{sid}  {tg:>2}  {ms:>5} | {kw*100:5.0f}%  {kt:6.0f}초  {kn:4.1f}번 | {aw*100:5.0f}%  {at:6.0f}초  {an:4.1f}번')
