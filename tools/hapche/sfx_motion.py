# 잇결 합체 — 완성 뒤 움직임 효과음(2026-11-22): 기차 칙칙폭폭, 물 첨벙·솟구침, 빙글 도는 바람 소리
import numpy as np, wave, os, sys
SR = 22050
OUT = sys.argv[1]
rng = np.random.default_rng(7)
def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.8
    w = wave.open(os.path.join(OUT, name), 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
def t(d): return np.linspace(0, d, int(SR * d), endpoint=False)
def lowpass(x, a):
    y = np.zeros_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y
# 1) 칙칙폭폭 — 증기 네 번(치-익) + 마지막 기적 소리(뿌우)
d = 1.6; tt = t(d); x = np.zeros(len(tt))
for k in range(4):
    s = int(SR * k * 0.22); n = int(SR * 0.18)
    burst = rng.standard_normal(n) * np.exp(-t(0.18) * 18)
    x[s:s + n] += np.diff(np.concatenate([[0], burst])) * (1.0 if k % 2 == 0 else 0.7)
s = int(SR * 0.9); seg = t(d - 0.9)
whistle = (np.sin(2 * np.pi * 587 * seg) + 0.6 * np.sin(2 * np.pi * 740 * seg)) * np.minimum(1, seg * 12) * np.exp(-seg * 2.2)
x[s:] += 0.5 * whistle
save('steam.wav', x)
# 2) 첨벙·솟구침 — 낮은 물소리(잡음 걸러서) + 방울 소리 몇 개
d = 1.2; tt = t(d)
x = lowpass(rng.standard_normal(len(tt)), 0.08) * np.exp(-tt * 3) * 3
for k in range(7):
    s = int(rng.uniform(0.05, 0.9) * SR); n = int(0.07 * SR)
    f0 = rng.uniform(500, 1200); seg = t(0.07)
    x[s:s + n] += 0.35 * np.sin(2 * np.pi * (f0 + 3000 * seg) * seg) * np.exp(-seg * 40)
save('splash.wav', x)
# 3) 빙글 — 바람이 돌며 오르내리는 소리(걸러 낸 잡음의 세기가 출렁)
d = 1.5; tt = t(d)
x = lowpass(rng.standard_normal(len(tt)), 0.15) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.2 * tt)) * np.minimum(1, tt * 4) * np.exp(-tt * 1.2)
x += 0.15 * np.sin(2 * np.pi * (220 + 60 * np.sin(2 * np.pi * 3.2 * tt)) * tt) * np.exp(-tt * 1.5)
save('whirl.wav', x)
print('ok')
