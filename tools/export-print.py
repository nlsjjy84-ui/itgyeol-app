"""출력 업체용 파일 바꾸기 — 앱에서 내려받은 색 입힌 .glb(mm 단위)를 풀컬러 3D 출력소가 받는 형식으로 바꾼다.
python3 tools/export-print.py <파일.glb> [내보낼 폴더]
  → <이름>.3mf : 색이 든 3MF(삼각형 꼭짓점마다 색, 단위 mm). HP Jet Fusion 580 등
  → <이름>_wrl.zip : VRML 2.0(.wrl) + 무늬 그림(PNG). Stratasys J826 등 풀컬러 장비가 흔히 받는 형식
필요한 것: pip install trimesh pillow numpy"""
import os, sys, zipfile, io
import numpy as np
import trimesh
from PIL import Image

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.abspath(src))
os.makedirs(out, exist_ok=True)
name = os.path.splitext(os.path.basename(src))[0]
scene = trimesh.load(src, force='scene')


def srgb(c):
    # glTF 색 값(선형)을 화면·출력 색(sRGB)으로
    c = np.asarray(c[:3], dtype=float) / 255.0
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)


parts = []  # (vertices, faces, uv or None, texture PIL or None, rgb 0~1)
for node in scene.graph.nodes_geometry:
    T, gname = scene.graph[node]
    g = scene.geometry[gname].copy()
    g.apply_transform(T)
    mat = getattr(g.visual, 'material', None)
    tex = getattr(mat, 'baseColorTexture', None) if mat is not None else None
    fac = getattr(mat, 'baseColorFactor', None) if mat is not None else None
    rgb = srgb(fac) if fac is not None else np.array([0.8, 0.8, 0.8])
    uv = getattr(g.visual, 'uv', None) if tex is not None else None
    parts.append((np.asarray(g.vertices), np.asarray(g.faces), None if uv is None else np.asarray(uv), tex.convert('RGB') if tex is not None else None, rgb))

# ── 3MF (꼭짓점 색) ──
def vcolors(v, uv, tex, rgb):
    if tex is None or uv is None:
        return np.tile(rgb, (len(v), 1))
    a = np.asarray(tex, dtype=float) / 255.0
    h, w = a.shape[:2]
    x = np.clip((uv[:, 0] % 1.0) * (w - 1), 0, w - 1).astype(int)
    y = np.clip((1 - (uv[:, 1] % 1.0)) * (h - 1), 0, h - 1).astype(int)
    return a[y, x, :3]

objs, items = [], []
for i, (v, f, uv, tex, rgb) in enumerate(parts):
    col = vcolors(v, uv, tex, rgb)
    hexes = ['#%02X%02X%02XFF' % tuple((c * 255).round().astype(int)) for c in col]
    cg = '<m:colorgroup id="%d">' % (1000 + i) + ''.join('<m:color color="%s"/>' % h for h in hexes) + '</m:colorgroup>'
    vs = ''.join('<vertex x="%.4f" y="%.4f" z="%.4f"/>' % tuple(p) for p in v)
    ts = ''.join('<triangle v1="%d" v2="%d" v3="%d" pid="%d" p1="%d" p2="%d" p3="%d"/>' % (a, b, c, 1000 + i, a, b, c) for a, b, c in f)
    objs.append(cg + '<object id="%d" type="model"><mesh><vertices>%s</vertices><triangles>%s</triangles></mesh></object>' % (i + 1, vs, ts))
    items.append('<item objectid="%d"/>' % (i + 1))
model = ('<?xml version="1.0" encoding="UTF-8"?>\n<model unit="millimeter" xml:lang="ko-KR" '
         'xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" '
         'xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02">'
         '<metadata name="Title">%s</metadata><resources>%s</resources><build>%s</build></model>') % (name, ''.join(objs), ''.join(items))
p3 = os.path.join(out, name + '.3mf')
with zipfile.ZipFile(p3, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/></Types>')
    z.writestr('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/></Relationships>')
    z.writestr('3D/3dmodel.model', model)

# ── VRML 2.0 + 그림 ──
shapes, files = [], {}
for i, (v, f, uv, tex, rgb) in enumerate(parts):
    coord = ', '.join('%.4f %.4f %.4f' % tuple(p) for p in v)
    idx = ', '.join('%d, %d, %d, -1' % tuple(t) for t in f)
    if tex is not None and uv is not None:
        tn = '%s_tex%d.png' % (name, i)
        b = io.BytesIO(); tex.save(b, 'PNG'); files[tn] = b.getvalue()
        app = 'appearance Appearance { material Material { diffuseColor 1 1 1 } texture ImageTexture { url "%s" } }' % tn
        tc = 'texCoord TextureCoordinate { point [ %s ] } texCoordIndex [ %s ]' % (', '.join('%.5f %.5f' % tuple(t) for t in uv), idx)
    else:
        app = 'appearance Appearance { material Material { diffuseColor %.4f %.4f %.4f } }' % tuple(rgb)
        tc = ''
    shapes.append('Shape { %s geometry IndexedFaceSet { solid TRUE coord Coordinate { point [ %s ] } coordIndex [ %s ] %s } }' % (app, coord, idx, tc))
wrl = '#VRML V2.0 utf8\n# %s — 단위 mm\n%s\n' % (name, '\n'.join(shapes))
pz = os.path.join(out, name + '_wrl.zip')
with zipfile.ZipFile(pz, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr(name + '.wrl', wrl)
    for k, b in files.items(): z.writestr(k, b)
ext = scene.bounds[1] - scene.bounds[0]
print('만듦', p3, pz, '· 크기(mm) %.1f × %.1f × %.1f' % tuple(ext), '· 삼각형', sum(len(p[1]) for p in parts))
