# 잇결 합체 효과음 — 옛날 로봇 만화영화 합체 장면 느낌(날아오는 소리, 철컥 끼움, 잠김, 빛나는 완성)
import numpy as np, wave, os, sys
SR=22050
OUT=sys.argv[1]
def save(name, x):
    x = x / (np.abs(x).max()+1e-9) * 0.85
    w = wave.open(os.path.join(OUT,name),'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((x*32767).astype(np.int16).tobytes()); w.close()
def t(d): return np.linspace(0,d,int(SR*d),endpoint=False)
def env(n,a=0.01,r=0.2):
    e=np.ones(n); A=int(SR*a); R=int(SR*r)
    e[:A]=np.linspace(0,1,A); e[-R:]*=np.linspace(1,0,R); return e
rng=np.random.default_rng(1)
# 1) 날아오는 소리: 위로 올라가는 쓸림 + 바람
d=0.55; tt=t(d); f=np.linspace(220,1300,len(tt))**1.0
ph=2*np.pi*np.cumsum(f)/SR
x=0.6*np.sin(ph)+0.25*np.sign(np.sin(ph*0.5))+0.35*rng.standard_normal(len(tt))*np.linspace(0.2,1,len(tt))
save('fly.wav', x*env(len(tt),0.02,0.12))
# 2) 철컥: 금속 부딪힘(짧은 잡음 + 높은 울림 둘)
d=0.32; tt=t(d)
x=rng.standard_normal(len(tt))*np.exp(-tt*60)
for fr,dec in [(1850,22),(2730,30),(640,14)]: x+=0.7*np.sin(2*np.pi*fr*tt)*np.exp(-tt*dec)
save('clank.wav', x)
# 3) 잠김: 치익(공기) + 쿵(낮은 북)
d=0.7; tt=t(d)
hiss=rng.standard_normal(len(tt))*np.exp(-tt*9)*(tt<0.35)
hp=np.diff(np.concatenate([[0],hiss]))
boom=np.sin(2*np.pi*(70+60*np.exp(-tt*20))*tt)*np.exp(-tt*5)*(tt>0.22)
save('lock.wav', 0.6*hp+1.2*boom)
# 4) 완성: 밝은 화음 팡파르(5음 오름) + 반짝임
d=1.8; tt=t(d); x=np.zeros(len(tt))
notes=[392,494,587,784,988]
for i,fr in enumerate(notes):
    s=int(SR*i*0.09); seg=tt[:len(tt)-s]
    tone=(np.sin(2*np.pi*fr*seg)+0.4*np.sin(2*np.pi*fr*2*seg)+0.2*np.sign(np.sin(2*np.pi*fr*seg)))*np.exp(-seg*1.6)
    x[s:]+=tone
spark=np.zeros(len(tt))
for k in range(26):
    s=int(rng.uniform(0.25,1.5)*SR); fr=rng.uniform(2400,5200); n=int(0.06*SR)
    if s+n<len(tt): spark[s:s+n]+=np.sin(2*np.pi*fr*t(0.06))*np.exp(-t(0.06)*50)
save('shine.wav', x+0.5*spark)
# 5) 변신: 기계음 돌아가는 소리(위아래 흔들림) + 끝 철컥
d=1.1; tt=t(d); f=500+300*np.sin(2*np.pi*7*tt)+np.linspace(0,600,len(tt))
ph=2*np.pi*np.cumsum(f)/SR; x=np.sign(np.sin(ph))*0.4+np.sin(ph*1.5)*0.4
x*=env(len(tt),0.02,0.2)
c=rng.standard_normal(int(0.2*SR))*np.exp(-t(0.2)*50)+np.sin(2*np.pi*2100*t(0.2))*np.exp(-t(0.2)*25)
x[-len(c):]+=c*1.5
save('transform.wav', x)
# 6) 보따리 풀기: 종이 바스락 + 딩
d=0.6; tt=t(d)
x=rng.standard_normal(len(tt))*(np.abs(np.sin(2*np.pi*14*tt))**3)*np.exp(-tt*4)*0.5
x+=np.sin(2*np.pi*1320*tt)*np.exp(-tt*6)*(tt>0.25)
save('unwrap.wav', x)
print('ok')
