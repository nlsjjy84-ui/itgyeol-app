# 잇결 작업실 시제품 렌더 — Blender(Cycles) + 그래픽카드(RTX: OptiX → CUDA → CPU 순으로 자동 선택)
# 유물: 국립중앙박물관 공개 3D 스캔(공공누리 제1유형). 재질: ambientCG(CC0). 조명: Poly Haven studio_small_09(CC0).
# 실행: blender -b --factory-startup --python render.py -- [장면 이름들] [--samples 256] [--res 1600] [--out 폴더]
# 장면: diffuser weight coaster4 coaster1 clock frame bell  (안 적으면 전부)
import bpy, sys, os, math, time
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def opt(name, default):
    if name in argv:
        i = argv.index(name); v = argv[i + 1]; del argv[i:i + 2]; return type(default)(v)
    return default
SAMPLES = opt('--samples', 256)
RES = opt('--res', 1600)
OUT = opt('--out', os.path.join(HERE, '결과'))
FORCE_CPU = '--cpu' in argv
if FORCE_CPU: argv.remove('--cpu')
ALL = ['diffuser', 'weight', 'coaster4', 'coaster1', 'clock', 'frame', 'bell', 'shield_keys', 'shield_bookends', 'duck_water', 'duck_rest', 'pom_tea', 'pom_vase', 'grape_decanter', 'grape_bowl', 'kirin_incense', 'kirin_trophy', 'mandarin_ring', 'mandarin_incense', 'lotus_trivet', 'duck_pen', 'probe']
SCENES = [a for a in argv if a in ALL] or ALL
os.makedirs(OUT, exist_ok=True)
LOG = open(os.path.join(OUT, '렌더_기록.txt'), 'a', encoding='utf-8')
def log(*a):
    s = ' '.join(str(x) for x in a); print(s); LOG.write(s + '\n'); LOG.flush()

# three.js 좌표(Y가 위, mm) → Blender 좌표(Z가 위, mm)
def P(x, y, z): return Vector((x, -z, y))

def setup_device():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    if FORCE_CPU:
        sc.cycles.device = 'CPU'; return 'CPU'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for kind in ('OPTIX', 'CUDA', 'HIP'):
        try:
            prefs.compute_device_type = kind
            prefs.get_devices()
            devs = [d for d in prefs.devices if d.type == kind]
            if not devs: continue
            for d in prefs.devices: d.use = (d.type == kind) and ('NVIDIA' in d.name or kind == 'HIP')
            if any(d.use for d in prefs.devices):
                sc.cycles.device = 'GPU'
                return kind + ' · ' + ', '.join(d.name for d in prefs.devices if d.use)
        except Exception as e:
            log('장치', kind, '사용 못 함:', e)
    sc.cycles.device = 'CPU'; return 'CPU'

def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)

# ── 재질 ──────────────────────────────────────────
def img(path, color=True):
    im = bpy.data.images.load(path, check_existing=True)
    if not color: im.colorspace_settings.name = 'Non-Color'
    return im

def mat_pbr(name, tex, rep=1.0, rough=None, tint=None, bump=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    bsdf = N['Principled BSDF']
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (rep, rep, rep)
    L.new(tc.outputs['UV'], mp.inputs['Vector'])
    b = os.path.join(HERE, 'tex', tex, f'{tex}_1K-JPG_')
    c = N.new('ShaderNodeTexImage'); c.image = img(b + 'Color.jpg'); L.new(mp.outputs['Vector'], c.inputs['Vector'])
    if tint:
        mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = 1.0
        L.new(c.outputs['Color'], mix.inputs[6]); mix.inputs[7].default_value = (*tint, 1)
        L.new(mix.outputs[2], bsdf.inputs['Base Color'])
    else:
        L.new(c.outputs['Color'], bsdf.inputs['Base Color'])
    if rough is None:
        r = N.new('ShaderNodeTexImage'); r.image = img(b + 'Roughness.jpg', False); L.new(mp.outputs['Vector'], r.inputs['Vector']); L.new(r.outputs['Color'], bsdf.inputs['Roughness'])
    else:
        bsdf.inputs['Roughness'].default_value = rough
    n = N.new('ShaderNodeTexImage'); n.image = img(b + 'NormalGL.jpg', False); L.new(mp.outputs['Vector'], n.inputs['Vector'])
    nm = N.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = bump
    L.new(n.outputs['Color'], nm.inputs['Color']); L.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    return m

def mat_plain(name, rgb, rough=0.8, metal=0.0, sheen=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if sheen: b.inputs['Sheen Weight'].default_value = sheen
    return m

def hexc(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c)

# ── 유물 스캔 불러오기 (바닥 가운데가 원점) ──────────
_cache = {}
def relic(name, rough=0.85, metal=0.0, coat=0.0, use_nor=True):
    path = os.path.join(HERE, 'scans', name, name + '.obj')
    bpy.ops.wm.obj_import(filepath=path, forward_axis='NEGATIVE_Z', up_axis='Y')
    ob = bpy.context.selected_objects[0]
    # 불러오기는 「Y가 위」를 물체 회전(90°)으로만 바꿔 둔다 — 그 회전을 모양에 굳혀서 Z가 위인 모양으로 만든다
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    me = ob.data
    xs = [v.co.x for v in me.vertices]; ys = [v.co.y for v in me.vertices]; zs = [v.co.z for v in me.vertices]
    off = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, min(zs)))
    for v in me.vertices: v.co -= off
    for p in me.polygons: p.use_smooth = True
    m = bpy.data.materials.new('relic_' + name); m.use_nodes = True
    N = m.node_tree.nodes; Lk = m.node_tree.links; bsdf = N['Principled BSDF']
    c = N.new('ShaderNodeTexImage'); c.image = img(os.path.join(HERE, 'scans', name, name + '_col.jpg'))
    Lk.new(c.outputs['Color'], bsdf.inputs['Base Color'])
    bsdf.inputs['Roughness'].default_value = rough; bsdf.inputs['Metallic'].default_value = metal
    if coat: bsdf.inputs['Coat Weight'].default_value = coat; bsdf.inputs['Coat Roughness'].default_value = 0.08
    nor = os.path.join(HERE, 'scans', name, name + '_nor.jpg')
    if use_nor and os.path.exists(nor):
        n = N.new('ShaderNodeTexImage'); n.image = img(nor, False)
        nm = N.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 0.8
        Lk.new(n.outputs['Color'], nm.inputs['Color']); Lk.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    me.materials.clear(); me.materials.append(m)
    size = Vector((max(xs) - min(xs), max(ys) - min(ys), max(zs) - min(zs)))
    return ob, size

def dup(ob):
    o = ob.copy(); bpy.context.collection.objects.link(o); return o

# ── 기본 도형 ─────────────────────────────────────
def box(sx, sy, sz, loc, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.scale = (sx, sy, sz); bpy.ops.object.transform_apply(scale=True)
    bev = o.modifiers.new('b', 'BEVEL'); bev.width = min(sx, sy, sz) * 0.06; bev.segments = 3
    o.data.materials.append(mat); return o

def cyl(r, h, loc, mat, rot=(0, 0, 0), verts=96):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.object; bpy.ops.object.shade_smooth()
    bev = o.modifiers.new('b', 'BEVEL'); bev.width = min(r, h) * 0.08; bev.segments = 3; bev.limit_method = 'ANGLE'
    o.data.materials.append(mat); return o

def plane(size, loc, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_plane_add(size=size, location=loc, rotation=rot)
    o = bpy.context.object; o.data.materials.append(mat); return o

def table(tint=None):
    return plane(6000, (0, 0, 0), mat_pbr('wood', 'Wood066', rep=12, rough=0.55, tint=tint, bump=0.6))

def wall(tint=(0.93, 0.9, 0.86)):
    return plane(4000, (0, 0, 0), mat_pbr('plaster', 'Plaster001', rep=6, rough=0.95, tint=tint, bump=0.5), rot=(math.pi / 2, 0, 0))

# ── 조명·카메라·배경 ──────────────────────────────
def world(bg_hex, strength=0.8):
    w = bpy.data.worlds.new('w'); bpy.context.scene.world = w; w.use_nodes = True
    N = w.node_tree.nodes; L = w.node_tree.links
    out = N['World Output']; bgn = N['Background']
    env = N.new('ShaderNodeTexEnvironment'); env.image = bpy.data.images.load(os.path.join(HERE, 'studio.hdr'))
    L.new(env.outputs['Color'], bgn.inputs['Color']); bgn.inputs['Strength'].default_value = strength
    # 카메라에 비치는 배경은 단색(사진관 배경지), 빛은 HDRI
    solid = N.new('ShaderNodeBackground'); solid.inputs['Color'].default_value = (*hexc(bg_hex), 1); solid.inputs['Strength'].default_value = 1.0
    lp = N.new('ShaderNodeLightPath'); mix = N.new('ShaderNodeMixShader')
    L.new(lp.outputs['Is Camera Ray'], mix.inputs['Fac']); L.new(bgn.outputs['Background'], mix.inputs[1]); L.new(solid.outputs['Background'], mix.inputs[2])
    L.new(mix.outputs['Shader'], out.inputs['Surface'])

def sun(pos3, strength=3.2, angle=4.0):
    d = P(*pos3).normalized()
    bpy.ops.object.light_add(type='SUN')
    s = bpy.context.object; s.data.energy = strength; s.data.angle = math.radians(angle)
    s.data.color = (1.0, 0.957, 0.902)
    s.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    return s

def camera(pos3, look3, fov=32, fstop=None):
    bpy.ops.object.camera_add(location=P(*pos3))
    c = bpy.context.object; bpy.context.scene.camera = c
    c.data.sensor_fit = 'VERTICAL'; c.data.angle = math.radians(fov); c.data.clip_start = 1; c.data.clip_end = 20000
    t = P(*look3); c.rotation_euler = (t - c.location).to_track_quat('-Z', 'Y').to_euler()
    if fstop:
        c.data.dof.use_dof = True; c.data.dof.focus_distance = (t - c.location).length; c.data.dof.aperture_fstop = fstop
    return c

# ── 장면 ──────────────────────────────────────────
def s_diffuser():
    world('#dcd6cc'); table()
    m, size = relic('monkey', rough=0.32, coat=0.6)
    k = 130 / size.z; m.scale = (k, k, k)
    # 꽃 모양 구멍: 가장 높은 꼭짓점들의 평균 자리
    top = [v.co for v in m.data.vertices if v.co.z > size.z - 6]
    ox = sum(v.x for v in top) / len(top) * k; oy = sum(v.y for v in top) / len(top) * k; oz = (size.z - 6) * k
    reed = mat_plain('reed', hexc('#cdb994'), 0.9)
    for i in range(7):
        a = i / 7 * math.pi * 2 + 0.3; t = 0.16 + 0.06 * math.sin(i * 2.1); Lr = 230
        bpy.ops.mesh.primitive_cylinder_add(radius=1.5, depth=Lr, vertices=10)
        r = bpy.context.object; r.data.materials.append(reed)
        for v in r.data.vertices: v.co.z += Lr / 2
        r.location = (ox, oy, oz - 25)
        r.rotation_euler = (math.sin(a) * t, math.cos(a) * t, 0)
    sun((-200, 420, 260)); camera((300, 190, 500), (0, 115, 0), fov=33, fstop=4)

def s_weight():
    world('#d9d2c7'); table()
    paper = box(300, 420, 0.6, (0, 0, 0.3), mat_plain('hanji', hexc('#f1ece0'), 0.95, sheen=0.3), rot=(0, 0, 0.12))  # 한지
    m, size = relic('monkey', rough=0.32, coat=0.6)
    k = 80 / max(size.x, size.y, size.z)  # 실제 크기 약 8cm
    m.scale = (k, k, k); m.location = P(70, 0.6, -110); m.rotation_euler = (0, 0, -0.6)
    sun((-260, 520, 180)); camera((190, 200, 150), (40, 20, -70), fov=32, fstop=3.2)

def _coaster_set(stack=False):
    world('#d9d2c7'); table()
    br, size = relic('lotus', rough=0.88)
    W = 100; k = W / max(size.x, size.y); relief = 7 / size.z
    cork = mat_pbr('cork', 'Cork001', rep=0.25, rough=0.95)
    br.hide_render = True; br.hide_viewport = True
    def coaster(x, z, rot, y=0):
        o = dup(br); o.hide_render = False; o.hide_viewport = False
        o.scale = (k, k, relief); o.location = P(x, y + 3, z); o.rotation_euler = (0, 0, rot)
        pad = box(size.x * k - 2, size.y * k - 2, 3, P(x, y + 1.5, z), cork, rot=(0, 0, rot))
        return o
    s = size.x * k / 2 + 1.2
    if not stack:
        coaster(-s, -s, 0); coaster(s, -s, math.pi / 2); coaster(s, s, math.pi); coaster(-s, s, -math.pi / 2)
        sun((-260, 520, 180)); camera((170, 330, 300), (0, 0, 10), fov=32, fstop=5.6)
    else:
        for i in range(4): coaster(-40, -30, 0.08 * i, y=i * 10.2)
        coaster(75, 70, -0.35)
        sun((-260, 520, 180)); camera((260, 230, 330), (10, 15, 20), fov=32, fstop=4)

def s_coaster4(): _coaster_set(False)
def s_coaster1(): _coaster_set(True)

def _flat(ob, size, W, relief):
    k = W / max(size.x, size.y); ob.scale = (k, k, relief / size.z); return size.x * k, size.y * k

def s_clock():
    world('#e4ddd2'); wall()
    m, size = relic('lotus', rough=0.88)
    w, d = _flat(m, size, 260, 12)
    m.rotation_euler = (math.pi / 2, 0, 0); m.location = (0, 0, 0)  # 벽 앞으로 세움, 앞면이 카메라 쪽(-Y)
    metal = mat_plain('hand', (0.03, 0.03, 0.03), 0.35, 0.6)
    def hand(L, wd, ang, z):
        bpy.ops.mesh.primitive_cube_add(size=1); h = bpy.context.object; h.scale = (wd, 1.2, L); bpy.ops.object.transform_apply(scale=True)
        for v in h.data.vertices: v.co.z += L / 2 - 8
        h.data.materials.append(metal); h.location = (0, -z, 0); h.rotation_euler = (0, ang, 0)
    hand(68, 5, -1.0, 16); hand(96, 3.4, 1.9, 18)  # 10시 20분쯤
    cyl(4, 6, (0, -19, 0), metal, rot=(math.pi / 2, 0, 0), verts=24)
    sun((-300, 450, 500), 3.4); camera((120, 60, 620), (0, 0, 0), fov=32)

def s_frame():
    world('#e4ddd2'); wall()
    m, size = relic('sansu', rough=0.88)
    w, d = _flat(m, size, 200, 8)
    m.rotation_euler = (math.pi / 2, 0, 0); m.location = (0, -12, 0)
    matb = box(w + 70, 12, d + 70, (0, -6, 0), mat_plain('mat', hexc('#f3efe6'), 0.95))
    wood = mat_pbr('frame', 'Wood066', rep=0.4, rough=0.42, tint=hexc('#5a3c28'))
    F, D = 22, 30; W2 = w + 70 + 2 * F; H2 = d + 70 + 2 * F
    for x, z, ww, hh in [(0, (H2 - F) / 2, W2, F), (0, -(H2 - F) / 2, W2, F), ((W2 - F) / 2, 0, F, H2 - 2 * F), (-(W2 - F) / 2, 0, F, H2 - 2 * F)]:
        box(ww, D, hh, (x, -D / 2, z), wood)
    sun((-520, 380, 260), 3.6); camera((140, 40, 700), (0, 0, 0), fov=32)

def s_bell():
    world('#cfc6b8'); table(tint=hexc('#8c8070'))
    wood = mat_pbr('stand', 'Wood066', rep=0.3, rough=0.45)
    cyl(64, 14, (0, 0, 7), wood)
    cyl(50, 2, (0, 0, 15), mat_plain('felt', hexc('#4a1c1c'), 1.0, sheen=0.15))
    m, size = relic('bell', rough=0.42, metal=0.6)
    k = 150 / size.z; m.scale = (k, k, k); m.location = (0, 0, 16)
    sun((-220, 460, 220)); camera((230, 210, 360), (0, 85, 0), fov=30, fstop=4)


# ── 방패형 동기(초기철기, 대전 괴정동 출토 계열 · 국립중앙박물관 신수1846) ─────────────
# 원래 쓰임: 제사장이 의식 때 쓰던 청동 의기. 위쪽 구멍이 닳아 있어 끈으로 매달아 썼던 것으로 본다.
# 바꾼 물건: ① 현관 열쇠걸이(매달던 물건 + 「방패」=지킴) ② 북엔드 한 쌍(세워서 책을 지키는 방패)
def _shield(rough=0.45, metal=0.55):
    m, size = relic('shield', rough=rough, metal=metal)
    return m, size

def _key(x, z, ang, y, mat):
    # 열쇠: 둥근 머리(구멍) + 몸통 + 이빨 두 개
    bpy.ops.mesh.primitive_torus_add(major_radius=9, minor_radius=3.2, location=(x, y, z), rotation=(math.pi / 2, 0, 0))
    h = bpy.context.object; h.data.materials.append(mat)
    parts = [h]
    parts.append(box(4.5, 2.2, 40, (x, y, z - 30), mat))
    parts.append(box(7, 2.2, 4, (x + 5, y, z - 44), mat))
    parts.append(box(5, 2.2, 4, (x + 4, y, z - 36), mat))
    return parts

def s_shield_keys():
    world('#e2dbcf'); wall()
    m, size = _shield()
    # 구멍이 위로 오게 세움(원래 구멍에 끈을 꿰어 매달던 물건)
    m.rotation_euler = (-math.pi / 2, 0, math.pi); m.location = (0, 0, 0)
    bpy.context.view_layer.update()
    zs = [ (m.matrix_world @ v.co).z for v in m.data.vertices ]
    top, bot = max(zs), min(zs)
    brass = mat_plain('brass', (0.78, 0.55, 0.25), 0.3, 1.0)
    cord = mat_plain('cord', hexc('#6b2b22'), 0.9)
    # 벽 못 하나에 끈 두 가닥으로 매닮
    cyl(2.5, 14, (0, -7, top + 55), brass, rot=(math.pi / 2, 0, 0), verts=20)
    nail = Vector((0, -9, top + 55))
    for sx in (-1, 1):
        hole = Vector((sx * 32, -6, top - 10))
        d = nail - hole; L = d.length; mid = (nail + hole) / 2
        bpy.ops.mesh.primitive_cylinder_add(radius=1.1, depth=L, vertices=10, location=mid)
        c = bpy.context.object; c.rotation_euler = d.to_track_quat('Z', 'Y').to_euler(); c.data.materials.append(cord)
    # 아래에 놋쇠 고리 세 개 — 가운데에 열쇠 꾸러미
    hz = bot - 30
    for x in (-45, 0, 45):
        cyl(3, 16, (x, -8, hz), brass, rot=(math.pi / 2, 0, 0), verts=24)
        bpy.ops.mesh.primitive_torus_add(major_radius=6, minor_radius=1.5, location=(x, -17, hz - 5), rotation=(0, math.pi / 2, 0))
        bpy.context.object.data.materials.append(brass)
    steel = mat_plain('steel', (0.72, 0.72, 0.74), 0.25, 1.0)
    bpy.ops.mesh.primitive_torus_add(major_radius=13, minor_radius=1.2, location=(0, -18, hz - 22), rotation=(math.pi / 2, 0, 0))
    bpy.context.object.data.materials.append(steel)
    _key(-7, hz - 38, 0, -20, brass); _key(8, hz - 39, 0, -23, steel)
    midz = (top + 55 + hz - 70) / 2
    sun((-320, 420, 520), 3.4); camera((70, midz + 10, 640), (0, midz, -10), fov=36)

def s_shield_bookends():
    world('#d9d2c7'); table()
    m, size = _shield()
    m2 = dup(m)
    books_w = 0; cols = ['#7a2e2a', '#2f4b63', '#c9b48a', '#3d5a40', '#8a6d3b', '#e8e1d2']
    ws = [24, 30, 20, 34, 26, 22]; hs = [150, 172, 140, 165, 158, 145]
    total = sum(ws) + 1.5 * (len(ws) - 1)
    x = -total / 2
    for i, c in enumerate(cols):
        box(ws[i], 110, hs[i], (x + ws[i] / 2, 0, hs[i] / 2), mat_plain('book%d' % i, hexc(c), 0.7))
        x += ws[i] + 1.5
    base = mat_pbr('base', 'Wood066', rep=0.3, rough=0.4, tint=hexc('#6b4a33'))
    for ob, sx in ((m, -1), (m2, 1)):
        # 방패 면이 바깥(옆)을 보게 세워 책을 양쪽에서 받친다 — 구멍이 위
        ob.scale = (1.3, 1.3, 1.3)
        ob.rotation_euler = (-math.pi / 2, 0, -sx * math.pi / 2)
        ob.location = (sx * (total / 2 + 9), 0, 10)
        box(14, 120, 10, (sx * (total / 2 + 6), 0, 5), base)
        box(6, 120, 40, (sx * (total / 2 + 2), 0, 20), base)
    sun((-260, 520, 180)); camera((330, 260, 420), (0, 85, 0), fov=34, fstop=4)


# ── 청자 오리 모양 연적(고려, 국립중앙박물관) ─────────────────────
# 원래 쓰임: 등의 구멍으로 물을 넣고 부리 쪽으로 한 방울씩 벼루에 따르던 연적.
# 뜻: 오리는 철 따라 오가며 농사의 때를 알리고, 혼인·다산을 뜻함(국립중앙박물관 오리모양토기 설명).
# 바꾼 물건: ① 화분 물주개(한 방울씩 따르던 구조 그대로) ② 한 쌍 수저받침(혼인의 뜻 — 신혼 선물)
def s_duck_water():
    world('#dcd6cc'); table()
    m, size = relic('duck', rough=0.3, coat=0.6)
    m.location = (40, 0, 0); m.rotation_euler = (0, 0, math.pi)
    terra = mat_plain('terra', hexc('#b5653d'), 0.85)
    soil = mat_plain('soil', hexc('#3b2a1e'), 1.0)
    leaf = mat_plain('leaf', hexc('#6f8f5a'), 0.6)
    px = -95
    cyl(42, 70, (px, 0, 35), terra, verts=64)
    cyl(37, 4, (px, 0, 68), soil, verts=64)
    import random; random.seed(3)
    for i in range(9):
        a = i / 9 * math.tau; r = 8 + (i % 3) * 9
        bpy.ops.mesh.primitive_uv_sphere_add(radius=9 - (i % 3) * 1.5, location=(px + math.cos(a) * r, math.sin(a) * r, 78))
        o = bpy.context.object; o.scale = (1, 0.7, 1.6); o.rotation_euler = (math.cos(a) * 0.5, math.sin(a) * 0.5, a)
        bpy.ops.object.shade_smooth(); o.data.materials.append(leaf)
    sun((-200, 420, 260)); camera((60, 150, 420), (-25, 45, 0), fov=34, fstop=4)

def _stick(a, b, r1, r2, mat):
    a = Vector(a); b = Vector(b); d = b - a
    bpy.ops.mesh.primitive_cone_add(radius1=r1, radius2=r2, depth=d.length, vertices=20, location=(a + b) / 2)
    c = bpy.context.object; c.rotation_mode = 'QUATERNION'; c.rotation_quaternion = d.to_track_quat('Z', 'Y')
    bpy.ops.object.shade_smooth(); c.data.materials.append(mat); return c

def s_duck_rest():
    world('#e4ddd2'); table(tint=hexc('#c9b8a6'))
    m, size = relic('duck', rough=0.3, coat=0.6)
    k = 0.55; m.scale = (k, k, k)
    m2 = dup(m)
    m.location = (-80, 0, 0); m.rotation_euler = (0, 0, 0.25)
    m2.location = (80, 0, 0); m2.rotation_euler = (0, 0, math.pi - 0.25)
    wood = mat_pbr('chop', 'Wood066', rep=0.2, rough=0.35, tint=hexc('#7a4a2e'))
    brass = mat_plain('spoon', hexc('#c9a45a'), 0.25, metal=1.0) if 'metal' in mat_plain.__code__.co_varnames else mat_plain('spoon', hexc('#c9a45a'), 0.25)
    back = size.z * k * 0.62
    for cx in (-80, 80):
        for dx in (-5, 5):
            _stick((cx + dx, -200, 3.4), (cx + dx * 0.6, 25, back + 2.5), 3.4, 1.6, wood)
    plate = mat_plain('plate', hexc('#f3f1ec'), 0.12)
    cyl(80, 5, (0, -330, 2.5), plate, verts=96)
    sun((-240, 480, 260)); camera((150, 230, 430), (0, 10, 70), fov=34, fstop=5)


def s_probe():
    world('#e8e4dc'); table()
    name = os.environ.get('PROBE', 'pomjug')
    m, size = relic(name, rough=0.3, coat=0.5)
    print('SIZE', name, [round(v, 1) for v in size])
    h = max(size); sun((-200, 420, 260))
    camera((0, size.z * 0.6 + h * 0.35, h * 2.6), (0, size.z * 0.45, 0), fov=34)



def lathe(prof, loc, mat, segs=64, smooth=True):
    """prof: [(r, z), ...] 바깥→안쪽 순서로 한 줄 — 돌려서 그릇 모양을 만든다"""
    me = bpy.data.meshes.new('lathe'); vs = []; fs = []
    n = len(prof)
    for i in range(segs):
        a = i / segs * math.tau
        for r, z in prof: vs.append((math.cos(a) * r, math.sin(a) * r, z))
    for i in range(segs):
        j = (i + 1) % segs
        for k in range(n - 1): fs.append((i * n + k, j * n + k, j * n + k + 1, i * n + k + 1))
    me.from_pydata(vs, [], fs); me.update()
    o = bpy.data.objects.new('lathe', me); bpy.context.collection.objects.link(o); o.location = loc
    if smooth:
        for pl in me.polygons: pl.use_smooth = True
    me.materials.append(mat); return o

def glass_mat():
    g = bpy.data.materials.new('glass'); g.use_nodes = True
    b = g.node_tree.nodes['Principled BSDF']; b.inputs['Transmission Weight'].default_value = 1.0; b.inputs['Roughness'].default_value = 0.02; b.inputs['IOR'].default_value = 1.5
    return g

def teacup(loc, mat, liquid=None, r=34, h=40):
    lathe([(0.01, 0), (r * 0.62, 0), (r * 0.66, 3), (r * 0.7, 6), (r * 0.95, h * 0.55), (r, h), (r - 2.2, h), (r * 0.93 - 2, h * 0.55), (r * 0.6 - 2, 8), (0.01, 7)], loc, mat)
    if liquid: cyl(r * 0.9, 1.0, (loc[0], loc[1], loc[2] + h * 0.72), liquid, verts=64)

def wineglass(loc, gm, wine=None):
    x, y, z = loc
    lathe([(0.01, 0), (38, 0), (38, 2), (4, 4), (3.5, 85), (6, 92), (30, 115), (42, 150), (38, 190), (36.5, 190), (40.5, 150), (29, 117), (0.01, 96)], loc, gm)
    if wine: lathe([(0.01, 97), (28, 117.5), (38.5, 140), (0.01, 140)], loc, wine)

def _cup(r, h, loc, mat):
    o = cyl(r, h, loc, mat, verts=64)
    return o

# ── 청자 석류 모양 주전자(고려) — 석류는 씨가 많아 자손·다산을 빌던 열매 ──
def s_pom_tea():
    world('#ddd5c8'); table(tint=hexc('#b89a7c'))
    m, size = relic('pomjug', rough=0.25, coat=0.6)
    m.location = (0, 0, 0); m.rotation_euler = (0, 0, -0.5)
    cel = mat_plain('cupc', hexc('#9fb5a3'), 0.15)
    tea = mat_plain('tea', hexc('#a8742c'), 0.05)
    tray = mat_pbr('tray', 'Wood066', rep=0.5, rough=0.4, tint=hexc('#6b4128'))
    cyl(230, 10, (40, 10, 5), tray, verts=128)
    m.location = (-20, 20, 10)
    for (x, y) in ((140, -60), (120, 90)):
        teacup((x, y, 10), cel, tea)
    sun((-220, 460, 260)); camera((60, 280, 520), (20, 70, 0), fov=34, fstop=5)

def s_pom_vase():
    world('#e6e0d6'); wall(); table(tint=hexc('#cdb9a2'))
    m, size = relic('pomjug', rough=0.25, coat=0.6)
    m.location = (0, -120, 0); m.rotation_euler = (0, 0, -0.3)
    stem = mat_plain('stem', hexc('#4f6b3a'), 0.6)
    pet = mat_plain('pet', hexc('#d9534a'), 0.5, sheen=0.4)
    pet2 = mat_plain('pet2', hexc('#f3efe6'), 0.5, sheen=0.4)
    top = Vector((m.location.x + 5, m.location.y, size.z - 8))
    import random; random.seed(7)
    for i in range(5):
        a = i / 5 * math.tau + 0.3; L = 90 + random.random() * 45
        tip = top + Vector((math.cos(a) * 45, math.sin(a) * 30, L))
        _stick(top, tip, 1.8, 1.4, stem)
        for q in range(6):
            b2 = q / 6 * math.tau
            bpy.ops.mesh.primitive_uv_sphere_add(radius=9, location=tip + Vector((math.cos(b2) * 8, math.sin(b2) * 8, 2)), segments=16, ring_count=8)
            f = bpy.context.object; f.scale = (1.3, 0.8, 0.45); f.rotation_euler = (0.5 * math.cos(b2), 0.5 * math.sin(b2), b2); bpy.ops.object.shade_smooth(); f.data.materials.append(pet if i % 2 else pet2)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=4.5, location=tip + Vector((0, 0, 4)), segments=12, ring_count=6); bpy.context.object.data.materials.append(mat_plain('core', hexc('#e8c440'), 0.6))
    sun((-260, 420, 300)); camera((90, 330, 900), (0, 175, 130), fov=34, fstop=8)

# ── 청자 상감 동화 포도·동자 무늬 조롱박 모양 주전자와 받침(국보) ──
# 포도알·동자 = 자손이 넘치길, 조롱박 = 복을 담는 그릇
def s_grape_decanter():
    world('#d8d0c4'); table(tint=hexc('#a88b6e'))
    b, bs = relic('grape1', rough=0.25, coat=0.5)
    j, js = relic('grape2', rough=0.25, coat=0.5)
    b.location = (0, 0, 0); j.location = (0, 0, bs.z * 0.55)
    gm = glass_mat(); wine = mat_plain('wine', hexc('#5a0f1c'), 0.05)
    for x, y in ((230, 20), (200, 160)):
        wineglass((x, y, 0), gm, wine)
    sun((-240, 460, 260)); camera((120, 330, 820), (60, 150, 0), fov=34, fstop=6)

def s_grape_bowl():
    world('#e2dbd0'); table(tint=hexc('#c2a98e'))
    b, bs = relic('grape1', rough=0.25, coat=0.5)
    gm = mat_plain('grapes', hexc('#3b2242'), 0.2)
    gg = mat_plain('grapesg', hexc('#9fb04f'), 0.2)
    import random; random.seed(11)
    for c, (cx, cy, mt) in enumerate(((-25, 10, gm), (30, -15, gg))):
        for i in range(36):
            z = bs.z * 0.55 + (i // 9) * 13; rr = 34 - (i // 9) * 7; a = (i % 9) / 9 * math.tau + random.random() * 0.3
            bpy.ops.mesh.primitive_uv_sphere_add(radius=9.5, location=(cx + math.cos(a) * rr, cy + math.sin(a) * rr, z), segments=20, ring_count=10)
            o = bpy.context.object; o.scale = (1, 1, 1.12); bpy.ops.object.shade_smooth(); o.data.materials.append(mt)
    sun((-240, 460, 260)); camera((0, 260, 380), (0, 40, 0), fov=34, fstop=4)

# ── 청자 기린 장식 향로(고려) — 기린은 어질고 뛰어난 인재(기린아)를 뜻함 ──
def s_kirin_incense():
    world('#cfc6ba'); wall(tint=(0.8, 0.77, 0.72)); table(tint=hexc('#7d5e46'))
    a, asz = relic('kirin1', rough=0.25, coat=0.5)
    k, ksz = relic('kirin2', rough=0.25, coat=0.5)
    a.location = (-60, -140, 0); k.location = (110, -190, 0); k.rotation_euler = (0, 0, -0.6)
    wax = mat_plain('wax', hexc('#f1e9d8'), 0.6, sheen=0.2)
    wax_n = wax.node_tree.nodes['Principled BSDF']; wax_n.inputs['Subsurface Weight'].default_value = 0.4
    cyl(38, 60, (-60, -140, asz.z * 0.35 + 30), wax, verts=64)
    wick = mat_plain('wick', hexc('#222222'), 0.9)
    cyl(1.2, 8, (-60, -140, asz.z * 0.35 + 64), wick, verts=12)
    fl = bpy.data.materials.new('flame'); fl.use_nodes = True
    fb = fl.node_tree.nodes['Principled BSDF']; fb.inputs['Emission Color'].default_value = (1.0, 0.62, 0.22, 1); fb.inputs['Emission Strength'].default_value = 40
    bpy.ops.mesh.primitive_uv_sphere_add(radius=4, location=(-60, -140, asz.z * 0.35 + 76), segments=16, ring_count=8)
    f = bpy.context.object; f.scale = (1, 1, 2.6); bpy.ops.object.shade_smooth(); f.data.materials.append(fl)
    bpy.ops.object.light_add(type='POINT', location=(-60, -140, asz.z * 0.35 + 80)); L = bpy.context.object; L.data.energy = 60; L.data.color = (1.0, 0.7, 0.4); L.data.shadow_soft_size = 4
    sun((-260, 420, 300), strength=1.6); camera((60, 260, 780), (25, 80, 160), fov=32, fstop=8)

def s_kirin_trophy():
    world('#e4ddd2'); table(tint=hexc('#c9b8a6'))
    k, ksz = relic('kirin2', rough=0.25, coat=0.5)
    wood = mat_pbr('base', 'Wood066', rep=0.3, rough=0.35, tint=hexc('#3a2418'))
    brass = mat_plain('brass', hexc('#c9a45a'), 0.25, metal=1.0)
    box(150, 150, 40, (0, 0, 20), wood)
    box(90, 2, 18, (0, -76, 20), brass)
    k.location = (0, 0, 40)
    sun((-240, 460, 260)); camera((90, 170, 430), (0, 75, 0), fov=34, fstop=5)

# ── 청자 원앙 모양 향로 뚜껑(고려) — 원앙은 평생 짝을 지키는 부부 금실 ──
def s_mandarin_ring():
    world('#e8e2d8'); table(tint=hexc('#d2c2ae'))
    m, size = relic('mandarin', rough=0.25, coat=0.6)
    m2 = dup(m)
    m.location = (-75, 0, 0); m.rotation_euler = (0, 0, -0.35)
    m2.location = (75, 0, 0); m2.rotation_euler = (0, 0, math.pi + 0.35)
    gold = mat_plain('gold', hexc('#e0b860'), 0.15, metal=1.0)
    for x, sgn in ((-10, 1), (12, -1)):
        bpy.ops.mesh.primitive_torus_add(major_radius=9, minor_radius=1.6, location=(x, -95, 9.5), rotation=(math.pi / 2, 0, 0.3 * sgn))
        bpy.ops.object.shade_smooth(); bpy.context.object.data.materials.append(gold)
    sun((-240, 460, 260)); camera((40, 190, 430), (0, 40, -20), fov=34, fstop=4)

def s_mandarin_incense():
    world('#ece6dc'); table(tint=hexc('#efe6d8'))
    m, size = relic('mandarin', rough=0.25, coat=0.6)
    m2 = dup(m)
    m.location = (-80, 0, 0); m.rotation_euler = (0, 0, 0)
    m2.location = (80, 0, 0); m2.rotation_euler = (0, 0, 0)
    card = mat_plain('card', hexc('#fbf8f1'), 0.7)
    gold = mat_plain('goldline', hexc('#c9a45a'), 0.3, metal=1.0)
    for cx in (-80, 80):
        box(78, 1.2, 50, (cx, -82, 23), card, rot=(-0.22, 0, 0))
        box(44, 0.5, 1.6, (cx, -83.6, 18), gold, rot=(-0.22, 0, 0))
    plate = mat_plain('plate2', hexc('#f6f4ef'), 0.12)
    cyl(110, 6, (0, -230, 3), plate, verts=128)
    sun((-240, 460, 260)); camera((20, 200, 600), (0, 40, -50), fov=34, fstop=5)

# 연화문 벽돌 → 냄비 받침: 흙을 구워 만든 벽돌이라 뜨거운 그릇을 받쳐도 끄떡없음
def s_lotus_trivet():
    world('#d6cec2'); table(tint=hexc('#b9a58e'))
    m, size = relic('lotus', rough=0.88)
    w, d = _flat(m, size, 200, 26); m.rotation_euler = (0, 0, 0.12); m.location = (0, 0, 0)
    iron = mat_plain('iron', hexc('#1d1c1b'), 0.55, metal=0.7)
    q = 0.62; ox, oy = 30, 35
    lathe([(0.01, 0), (70 * q, 0), (85 * q, 10 * q), (92 * q, 45 * q), (90 * q, 80 * q), (84 * q, 92 * q), (86 * q, 96 * q), (80 * q, 98 * q), (0.01, 98 * q)], (ox, oy, 26), iron)
    lathe([(0.01, 0), (86 * q, 0), (86 * q, 4), (60 * q, 14 * q), (14 * q, 18 * q), (14 * q, 30 * q), (0.01, 32 * q)], (ox, oy, 26 + 98 * q), iron)
    for sx in (-1, 1): box(14, 9, 7, (ox + sx * 62, oy, 26 + 48), iron)
    sun((-240, 460, 260)); camera((40, 380, 330), (0, 30, 0), fov=34, fstop=5)

# 청자 오리 모양 연적 → 합격 기원 펜꽂이: 연꽃+오리 = 장원 급제를 비는 그림 뜻
def s_duck_pen():
    world('#e0d9ce'); wall(tint=(0.9, 0.87, 0.82)); table(tint=hexc('#a88b6e'))
    m, size = relic('duck', rough=0.3, coat=0.6)
    m.location = (0, -110, 0); m.rotation_euler = (0, 0, 0.35)
    cols = ['#d9b23a', '#2f5d8a', '#c0392b']
    base = Vector((m.location.x - 4, m.location.y + 2, size.z * 0.78))
    for i, c in enumerate(cols):
        a = (i - 1) * 0.22
        tip = base + Vector((math.sin(a) * 45, 10 * (i - 1), 125))
        _stick(base, tip, 3.6, 3.6, mat_plain('pen%d' % i, hexc(c), 0.45))
    paper = mat_plain('note', hexc('#f7f3ea'), 0.8)
    box(150, 210, 8, (170, -150, 4), paper, rot=(0, 0, 0.2))
    sun((-260, 420, 300)); camera((70, 240, 600), (25, 110, 110), fov=30, fstop=7)

def render(name):
    reset()
    dev = setup_device()
    sc = bpy.context.scene
    sc.render.resolution_x = sc.render.resolution_y = RES
    sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
    try: sc.cycles.denoiser = 'OPTIX' if dev.startswith('OPTIX') else 'OPENIMAGEDENOISE'
    except Exception: pass
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    sc.view_settings.exposure = -0.3
    sc.render.image_settings.file_format = 'PNG'
    globals()['s_' + name]()
    sc.render.filepath = os.path.join(OUT, f'{name}.png')
    t0 = time.time(); bpy.ops.render.render(write_still=True)
    log(f'{name}: {time.time() - t0:.1f}초 · {dev} · {RES}px · {SAMPLES}샘플 → {sc.render.filepath}')

log('── 렌더 시작', time.strftime('%Y-%m-%d %H:%M:%S'), SCENES)
for n in SCENES:
    try: render(n)
    except Exception as e:
        import traceback; log(f'{n}: 실패 — {e}'); log(traceback.format_exc())
log('── 끝')
