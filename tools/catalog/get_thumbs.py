import json,re,os,time,urllib.request,random,io
from PIL import Image
import os, re
from paths import RAW, WORK
os.makedirs(os.path.join(WORK, 'thumbs'), exist_ok=True)
KRDES = re.compile(r'대한민국|특별시|광역시|도의|시의|군의|구의|특별자치|향토|서울미래유산|등록|조선|북한')
w=[r for r in json.load(open(os.path.join(RAW, 'itgyeol_wikidata.json'))) if any(KRDES.search(x) for x in r.get('desig', []))]
def free(l):
    l=(l or '').lower(); return ('cc0' in l or 'public domain' in l or l.startswith('pd') or 'kogl type 1' in l or ('cc by' in l and 'sa' not in l))
c=[r for r in w if r.get('thumb') and free(r.get('imgLic'))]
obj=[r for r in c if not re.search(r'사적|명승|천연기념물|기념물|등록',' '.join(r['desig']))]
site=[r for r in c if r not in obj]
random.seed(3); random.shuffle(obj); random.shuffle(site)
sel=obj[:320]+site[:80]
out={}
for r in sel:
    u=re.sub(r'/\d+px-','/330px-',r['thumb'].split('?')[0])
    try:
        b=urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'itgyeol-research/0.1 (nlsjjy84)'}),timeout=30).read()
        im=Image.open(io.BytesIO(b)).convert('RGB'); im.thumbnail((320,320)); buf=io.BytesIO(); im.save(buf,'JPEG',quality=72)
        open(os.path.join(WORK, "thumbs", f"{r['id']}.jpg"),'wb').write(buf.getvalue()); out[r['id']]=1
    except Exception as e: print('x',r['id'],e)
    time.sleep(0.3)
print(len(sel),len(out))
