# 합체 영상 배경음악 크기 맞추기(2026-11-22) — 북 소리 봉우리 때문에 전체가 작게 들리던 것을
# 부드럽게 눌러(tanh) 평균 크기를 효과음과 어울리게 올린다. 네 장단(굿거리·중모리·자진모리·세마치)을 같은 크기로.
import wave, numpy as np, sys, os
SFX = sys.argv[1] if len(sys.argv) > 1 else 'assets/sfx'
TARGET = 4000  # 평균(RMS) 목표 — 효과음(철컥 2100·잠김 3000·완성 5400) 사이, 소리가 뭉개지지 않을 만큼만
for name in ['bgm_hapche', 'bgm_sea', 'bgm_sky', 'bgm_space']:
    p = os.path.join(SFX, name + '.wav')
    w = wave.open(p); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(float) / 32768; w.close()
    x = x / (np.abs(x).max() + 1e-9)
    best = None
    for k in np.linspace(1, 8, 141):
        y = np.tanh(k * x) / np.tanh(k) * 0.85
        r = np.sqrt((y ** 2).mean()) * 32768
        if best is None or abs(r - TARGET) < abs(best[1] - TARGET):
            best = (k, r, y)
    k, r, y = best
    w = wave.open(p, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((y * 32767).astype(np.int16).tobytes()); w.close()
    print(name, 'k=%.2f' % k, 'rms', int(r))
