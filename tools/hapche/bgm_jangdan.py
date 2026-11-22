# 합체 영상 배경음악 — 출동 장면마다 다른 장단(모두 96bpm·한 박 0.625초라 합체 박자·장단 맞추기와 그대로 맞는다)
#   sea   : 중모리(12박) — 느긋하게 넘실대는 바다, 낮은 가야금
#   sky   : 자진모리(4박, 한 박을 셋으로) — 바람 타고 신나게
#   space : 세마치(3박, 한 박을 셋으로) — 높은 소리가 별처럼 띄엄띄엄 + 낮게 울리는 바탕음
#   (land : 굿거리 — 기존 bgm_hapche.wav)
# 사용: python3 bgm_jangdan.py <sea|sky|space> out.wav
import numpy as np, wave, sys
kind = sys.argv[1]
SR = 22050; D = 16.0; n = int(SR * D); x = np.zeros(n)
rng = np.random.default_rng({'sea': 11, 'sky': 12, 'space': 13}[kind])
beat = 60 / 96

def pluck(f, dur, amp, decay=4.0):
    N = int(SR / f); buf = rng.uniform(-1, 1, N); out = np.zeros(int(SR * dur))
    for i in range(len(out)):
        out[i] = buf[i % N]; buf[i % N] = 0.497 * (buf[i % N] + buf[(i + 1) % N])
    return out * amp * np.exp(-np.linspace(0, decay, len(out)))

def add(seg, t):
    s = int(t * SR)
    if s >= n: return
    e = min(n, s + len(seg)); x[s:e] += seg[:e - s]

def drum(f0, dur, amp, noise=0.0):
    tt = np.linspace(0, dur, int(SR * dur), endpoint=False)
    return amp * (np.sin(2 * np.pi * (f0 + 40 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 12) + noise * rng.standard_normal(len(tt)) * np.exp(-tt * 40))

scale = [196.0, 220.0, 261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3]  # 평조 솔라도레미
if kind == 'sea':
    # 중모리: 덩 . 쿵 덕 . 쿵 / 덩 . 덕 쿵 . 덕 (12박)
    pat, bar = [('덩', 0), ('쿵', 2), ('덕', 3), ('쿵', 5), ('덩', 6), ('덕', 8), ('쿵', 9), ('덕', 11)], 12
    mel = [(2, 2), (3, 1), (4, 3), (3, 2), (2, 1), (1, 3), (0, 2), (1, 1), (2, 3), (4, 2), (5, 1), (4, 3), (3, 3), (2, 3)]
    amp, low = 0.45, True
elif kind == 'sky':
    # 자진모리: 한 박을 셋으로 — 덩 . 덕 / 쿵 . 덕 / 쿵 덕 . / 쿵 . 덕
    pat, bar = [('덩', 0), ('덕', 2 / 3), ('쿵', 1), ('덕', 5 / 3), ('쿵', 2), ('덕', 7 / 3), ('쿵', 3), ('덕', 11 / 3)], 4
    mel = [(5, 1), (6, 1 / 3), (5, 2 / 3), (4, 1), (5, 1), (7, 1), (6, 2 / 3), (5, 1 / 3), (4, 1), (3, 1), (4, 2 / 3), (5, 1 / 3), (6, 1), (7, 2)]
    amp, low = 0.42, False
else:
    # 세마치: 덩 덩 덕쿵 (3박)
    pat, bar = [('덩', 0), ('덩', 1), ('덕', 5 / 3), ('쿵', 2)], 3
    mel = [(7, 3), (9, 1.5), (8, 1.5), (7, 3), (5, 3), (6, 1.5), (7, 1.5), (9, 3)]
    amp, low = 0.33, False
    # 낮게 울리는 바탕음(우주의 웅웅거림)
    tt = np.arange(n) / SR
    x += 0.12 * np.sin(2 * np.pi * 98 * tt) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * tt))
# 가락
t = 0.0; i = 0
while t < D - 1:
    deg, ln = mel[i % len(mel)]
    add(pluck(scale[deg], 2.4 if kind != 'sky' else 1.2, amp, 3.0 if kind != 'sky' else 4.5), t)
    if low and i % 3 == 0: add(pluck(scale[0] / 2, 2.6, 0.3), t)
    t += beat * ln; i += 1
# 장구
for b in range(int(D / (beat * bar)) + 1):
    for nm, pos in pat:
        tt0 = (b * bar + pos) * beat
        add(drum(90, 0.35, 0.55, 0.25) if nm in ('덩', '쿵') else drum(320, 0.12, 0.22, 0.5), tt0)
        if nm == '덩': add(drum(320, 0.12, 0.18, 0.5), tt0)  # 덩 = 북편 + 채편 함께
f = int(0.8 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
x = x / np.abs(x).max() * 0.6
w = wave.open(sys.argv[2], 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
print('ok', kind)
