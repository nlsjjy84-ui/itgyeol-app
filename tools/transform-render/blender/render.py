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
ALL = ['diffuser', 'weight', 'coaster4', 'coaster1', 'clock', 'frame', 'bell']
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
