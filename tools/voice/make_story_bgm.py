import numpy as np, random, subprocess
from scipy.io import wavfile
from scipy.signal import fftconvolve
sr=44100; L=64.0; N=int(sr*L)
rng=np.random.default_rng(7)
def ks(f,dur,amp=0.5,bright=0.5):
    n=int(sr*dur); p=int(sr/f); buf=rng.uniform(-1,1,p)
    # 손가락으로 뜯는 느낌: 처음 잡음을 부드럽게
    for _ in range(2): buf=0.5*(buf+np.roll(buf,1))
    out=np.zeros(n); 
    for i in range(n):
        out[i]=buf[i%p]
        j=i%p; buf[j]=0.996*(bright*buf[j]+(1-bright)*buf[(j-1)%p])
    env=np.minimum(1,np.arange(n)/(0.004*sr))
    return out*env*amp
# 평조 다섯 음 (황·태·중·임·남 ≈ Eb F Ab Bb C) — 낮은 옥타브 중심
base=155.56
scale=[1,9/8,4/3,3/2,27/16]
notes=[base*r*o for o in (0.5,1,2) for r in scale]
mix=np.zeros(N+sr*6)
t=0.0; beat=60/48
phr=[(0,2),(2,1),(4,1),(3,2),(2,2),(1,1),(0,3)]
while t<L-4:
    for deg,len_ in phr:
        if t>=L-4: break
        f=notes[5+deg] if rng.random()<0.8 else notes[deg]
        s=ks(f, min(4.5,len_*beat+2.5), amp=0.32, bright=0.55)
        i=int(t*sr); mix[i:i+len(s)]+=s
        # 가끔 한 옥타브 아래 받쳐 주기
        if rng.random()<0.35:
            s2=ks(f/2, 4.0, amp=0.18, bright=0.4); mix[i:i+len(s2)]+=s2
        t+=len_*beat*rng.choice([1,1,1.25])
    t+=beat*2
# 은은한 바탕(대금처럼 길게): 낮은 사인 두 음
tt=np.arange(len(mix))/sr
drone=0.03*np.sin(2*np.pi*base/2*tt)*(0.6+0.4*np.sin(2*np.pi*tt/16))+0.02*np.sin(2*np.pi*base*3/4*tt)
mix+=drone
# 잔향
ir_t=np.arange(int(sr*2.8))/sr; ir=rng.normal(0,1,len(ir_t))*np.exp(-ir_t*2.2); ir[0]=1.8
wet=fftconvolve(mix,ir)[:len(mix)]; wet/=np.max(np.abs(wet))
dry=mix/np.max(np.abs(mix))
y=0.55*dry+0.45*wet
# 이어 붙여 돌리기: 끝 6초를 처음에 겹쳐 고리처럼
tail=y[N:N+sr*6]; y=y[:N].copy(); fade=np.linspace(0,1,len(tail)); y[:len(tail)]=y[:len(tail)]*fade+tail*(1-fade)
y=y/np.max(np.abs(y))*0.8
st=np.stack([y,np.roll(y,int(sr*0.012))],1)
wavfile.write('calm.wav',sr,(st*32767).astype(np.int16))
subprocess.run(['ffmpeg','-y','-loglevel','error','-i','calm.wav','-af','loudnorm=I=-26:TP=-3','-ar','44100','-b:a','96k','calm.mp3'],check=True)
