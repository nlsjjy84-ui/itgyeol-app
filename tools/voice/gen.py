import json,re,subprocess,os,sys
from supertonic import TTS
d=json.load(open('/tmp/ld/lines.json'))
EMO=re.compile('[\U0001F300-\U0001FAFF\u2600-\u27BF]')
import unicodedata
def speakable(s): return ''.join(ch for ch in s if unicodedata.category(ch)[0] in 'LNPZ').strip()
def clean(s): return EMO.sub('',re.sub(r'[「」『』《》<>\[\]()…]',' ',s)).strip()
def h(s):
    x=5381
    for ch in s: x=((x*33) ^ ord(ch)) & 0xFFFFFFFF
    return format(x,'x')
t=TTS()
V={'pung':(t.get_voice_style('F4'),1.12),'gyeol':(t.get_voice_style('F5'),1.0)}
HANG=re.compile('[가-힣ㄱ-ㅣ]')
idx={}
for lang,items in d.items():
    for who,text in items:
        if lang!='ko' and HANG.search(text): continue
        c=clean(text)
        if not c: continue
        key=h(f'{lang}|{who}|{c}')
        out=f'/home/claude/itgyeol-app/assets/voice/{key}.mp3'
        idx[key]=[lang,who,c]
        if os.path.exists(out): continue
        st,sp=V[who]
        tts_text=re.sub(r'\s+',' ',speakable(c.replace('~',' ')))
        w,_=t.synthesize(tts_text,st,lang=lang,speed=sp,total_steps=10)
        t.save_audio(w,'/tmp/tts/tmp.wav')
        subprocess.run(['ffmpeg','-y','-loglevel','error','-i','/tmp/tts/tmp.wav','-af','loudnorm=I=-18:TP=-2,afade=t=out:st=0:d=0','-ac','1','-ar','24000','-b:a','40k',out],check=True)
json.dump(idx,open('/tmp/tts/index.json','w'),ensure_ascii=False)
print(len(idx))
