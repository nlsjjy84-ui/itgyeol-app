# 합체 영상 배경음악 — 국악 느낌(평조 5음 가야금 뜯는 소리 + 장구 굿거리 비슷한 장단), 16초 반복 가능
import numpy as np, wave, sys
SR=22050; D=16.0; n=int(SR*D); x=np.zeros(n)
rng=np.random.default_rng(5)
def pluck(f, dur, amp):
    # Karplus-Strong 현 뜯기
    N=int(SR/f); buf=rng.uniform(-1,1,N); out=np.zeros(int(SR*dur))
    for i in range(len(out)):
        out[i]=buf[i%N]; buf[i%N]=0.497*(buf[i%N]+buf[(i+1)%N])
    return out*amp*np.exp(-np.linspace(0,4,len(out)))
# 평조(솔라도레미) 음계 — G3 A3 C4 D4 E4 G4 A4
scale=[196.0,220.0,261.6,293.7,329.6,392.0,440.0,523.3]
beat=60/96  # 느린 굿거리 느낌
melody=[4,5,4,3,2,3,4,0, 5,6,5,4,3,4,2,1, 4,5,7,6,5,4,3,4, 2,3,4,5,4,2,1,0]
t=0.0; i=0
while t < D-1:
    f=scale[melody[i%len(melody)]]; s=int(t*SR); seg=pluck(f, 1.6, 0.5)
    e=min(n, s+len(seg)); x[s:e]+=seg[:e-s]
    if i%4==0:  # 낮은 음 받침
        seg2=pluck(scale[0]/2, 2.2, 0.35); e2=min(n,s+len(seg2)); x[s:e2]+=seg2[:e2-s]
    t+=beat*(1.5 if i%3==2 else 1.0); i+=1
# 장구: 덩(낮은 북+높은 채) · 기덕
def drum(f0, dur, amp, noise=0.0):
    tt=np.linspace(0,dur,int(SR*dur),endpoint=False)
    return amp*(np.sin(2*np.pi*(f0+40*np.exp(-tt*30))*tt)*np.exp(-tt*12) + noise*rng.standard_normal(len(tt))*np.exp(-tt*40))
pattern=[('덩',0),('기',1.5),('덕',2),('쿵',3),('기',4.5),('덕',5)]  # 6박 단위
bar=beat*6
for b in range(int(D/bar)+1):
    for nm,pos in pattern:
        s=int((b*bar+pos*beat)*SR)
        if s>=n: continue
        seg = drum(90,0.35,0.6,0.25) if nm in('덩','쿵') else drum(320,0.12,0.25,0.5)
        e=min(n,s+len(seg)); x[s:e]+=seg[:e-s]
# 부드럽게 시작·끝
f=int(0.8*SR); x[:f]*=np.linspace(0,1,f); x[-f:]*=np.linspace(1,0,f)
x=x/np.abs(x).max()*0.6
w=wave.open(sys.argv[1],'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x*32767).astype(np.int16).tobytes()); w.close()
print('ok')
