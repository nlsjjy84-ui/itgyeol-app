import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Platform, Pressable } from 'react-native';
import Text from '../../ui/Text';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { THREE, makeMats, addKeyringHook, dnaRef, deformObject, printSafe, printLook, realLook } from './kit';
import { JourneyContext } from '../../context/JourneyContext';
import { MATERIAL_BY_ID } from '../../data/materialTree';
import { recordRef } from './models_mine';
import { colors } from '../../theme';
import { t } from '../../i18n';

// 진짜 3D 물건 뷰어.
// 결과 그림(조각보)을 한 장 찍어 texture로 만들고, 물건마다 따로 만든 3D 모델에 입힌다.
// 어느 방향으로든 돌려 볼 수 있다: 끌면 좌우로 돌고, 버튼으로 앞·뒤·옆·위에서 바로 본다.
// 준비에 실패하거나 12초가 지나도 안 뜨면, 그림을 그대로 보여 주는 안전 화면으로 바뀐다.

const PAPER = '#fffbf3';
// 촬영 시험용: 주소에 envyaw=숫자 가 있으면 그 각도로(웹에서만)
// 조명 방향: 스튜디오 사진의 밝은 창(소프트박스)이 카메라 쪽 옆에서 비치도록 90° 돌린다 — 평평한 은·놋 판이 까맣게 비치지 않는다.
// (촬영·비교용으로 웹 주소에 ?envyaw=값 을 붙이면 바꿀 수 있다)
const ENV_YAW = (() => { try { const v = typeof location !== 'undefined' && new URLSearchParams(location.search).get('envyaw'); return v ? parseFloat(v) : 1.57; } catch (e) { return 1.57; } })();
// 촬영용(웹): 주소에 still=1 이 있으면 3D가 돌지 않는다(앱이 주소를 지우기 전에 미리 읽어 둔다)
const SHOT_STILL = Platform.OS === 'web' && typeof location !== 'undefined' && /[?&]still=1/.test(location.search || '');

async function snap(ref, w, h) {
  if (Platform.OS === 'web') {
    const node = ref.current && (ref.current.root || ref.current.node || ref.current);
    const dom = node && node.nodeType ? node : null;
    if (!dom) throw new Error('no dom');
    const mod = await import('html2canvas-pro');
    const html2canvas = mod.default || mod;
    const canvas = await html2canvas(dom, { backgroundColor: PAPER, scale: 2, useCORS: true });
    return canvas.toDataURL('image/png');
  }
  return captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', width: w * 2, height: h * 2 });
}

function loadTexture(uri) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      uri,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        t.generateMipmaps = true;
        resolve(t);
      },
      undefined,
      reject
    );
  });
}

function shadowTexture() {
  const n = 64;
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y += 1) {
    for (let x = 0; x < n; x += 1) {
      const d = Math.hypot(x - n / 2 + 0.5, y - n / 2 + 0.5) / (n / 2);
      const a = Math.max(0, 1 - d);
      const v = Math.pow(a, 1.6) * 255;
      const i = (y * n + x) * 4;
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = v * 0.55;
    }
  }
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  t.needsUpdate = true;
  return t;
}

function Scene({ tex, build, hook, dna, record, printable = true, longMm = 50, ctl, onBuilt, onFail, real, surfaceOnly }) {
  const root = useRef();
  const { gl, scene } = useThree();
  const [envOk, setEnvOk] = useState(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        // 실제 사진 스튜디오(소프트박스·흰 배경) 전경 사진으로 빛을 받는다 — Poly Haven studio_small_09(CC0)를 앱용으로 줄인 것.
        // 반사에 실제 조명 모양이 비쳐 옻칠·청자 유약·놋쇠가 실물처럼 보인다. 못 불러오면 예전 방 조명으로.
        const pm = new THREE.PMREMGenerator(gl);
        let env = null;
        try {
          const { Asset } = await import('expo-asset');
          const a = Asset.fromModule(require('../../../assets/env/studio.jpg'));
          if (!a.localUri && a.downloadAsync) await a.downloadAsync();
          const t = await new THREE.TextureLoader().loadAsync(a.localUri || a.uri);
          t.mapping = THREE.EquirectangularReflectionMapping;
          t.colorSpace = THREE.SRGBColorSpace;
          env = pm.fromEquirectangular(t).texture;
          t.dispose();
        } catch (e) {
          const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
          env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
        }
        if (disposed) return;
        scene.environment = env;
        scene.environmentIntensity = 1.05;
        // 카메라 뒤쪽에 스튜디오의 흰 배경막이 오도록 돌린다(납작한 쇠붙이·옻칠 면이 검게 비치지 않게)
        scene.environmentRotation = new THREE.Euler(0, ENV_YAW, 0);
        setEnvOk(true);
      } catch (e) {
        if (!disposed) setEnvOk(false);
      }
    })();
    return () => {
      disposed = true;
    };
  }, [gl, scene]);

  const built = useMemo(() => {
    if (envOk === null || !tex) return null;
    try {
      const m = makeMats(envOk ? 1 : 0.35);
      dnaRef.v = dna;
      recordRef.v = record || null; // 놀이가 모양을 빚는 물건(나만의 패·항아리)이 읽는다
      let obj = build({ tex, m, dna });
      // 화면에 보이는 모양 = 출력하는 모양: 1.5mm보다 얇은 곳을 먼저 두껍게 다듬는다
      if (printable) obj = printSafe(obj, { longMm, dna });
      obj = deformObject(obj, dna);
      if (real && real.base) obj = realLook(obj, real.base, real.accent, (id) => (MATERIAL_BY_ID[id] ? MATERIAL_BY_ID[id].look : null), { surfaceOnly }); // 사용자가 고른 실제 전통 재료
      else if (printable) obj = printLook(obj); // 업체 출력물과 같은 수지 재질(인쇄 굿즈는 원래 재료 그대로)
      if (hook) addKeyringHook(obj, m);
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const k = 2.5 / Math.max(size.x, size.y, size.z, 0.001);
      const pivot = new THREE.Group();
      const holder = new THREE.Group();
      holder.add(obj);
      obj.position.sub(center);
      holder.scale.setScalar(k);
      pivot.add(holder);
      return { pivot, k, height: size.y * k };
    } catch (e) {
      return { error: e };
    }
  }, [envOk, tex, build, hook, dna, record, printable, longMm, real, surfaceOnly]);

  const shadowTex = useMemo(() => shadowTexture(), []);

  useEffect(() => {
    if (built && built.error) onFail && onFail(built.error);
    else if (built) onBuilt && onBuilt(built.pivot);
  }, [built, onFail, onBuilt]);

  // 촬영용: 모델이 다 만들어진 뒤 20장면을 더 그리면 '다 그려짐' 표시(예시 작품 촬영 도구가 이걸 기다렸다가 찍는다)
  const shotFrames = useRef(0);
  useEffect(() => { shotFrames.current = 0; if (SHOT_STILL && typeof window !== 'undefined') window.__shotReady = false; }, [built]);
  useFrame((_, dt) => {
    if (SHOT_STILL && built && !built.error && typeof window !== 'undefined') { shotFrames.current += 1; if (shotFrames.current === 20) window.__shotReady = true; }
    const c = ctl.current;
    if (!root.current) return;
    if (c.auto && !c.drag) c.yaw += dt * 0.6;
    c.yaw += c.vel;
    c.vel *= 0.9;
    // 목표 각도로 부드럽게 이동
    if (c.goto) {
      const d = ((c.goto.yaw - c.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      c.yaw += d * Math.min(1, dt * 7);
      c.pitch += (c.goto.pitch - c.pitch) * Math.min(1, dt * 7);
      if (Math.abs(d) < 0.01 && Math.abs(c.goto.pitch - c.pitch) < 0.01) c.goto = null;
    }
    root.current.rotation.y = c.yaw;
    root.current.rotation.x = c.pitch;
  });

  if (!built || built.error) return null;
  return (
    <>
      {/* 제품 사진처럼: 따뜻한 주광 하나 + 반대편 테두리 빛 + 약한 보조광, 바탕빛은 낮춰 입체가 드러나게 */}
      <ambientLight intensity={envOk ? 0.12 : 0.7} />
      <hemisphereLight args={[0xfff4e0, 0x5a4a3a, envOk ? 0.3 : 0.7]} />
      <directionalLight position={[3, 5, 4]} intensity={envOk ? 1.9 : 2.0} color={0xfff1df} />
      <directionalLight position={[-3.5, 2.5, -4]} intensity={0.9} color={0xdfe8ff} />
      <directionalLight position={[-4, 0.5, 3]} intensity={0.45} color={0xffffff} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -built.height / 2 - 0.12, 0]}>
        <planeGeometry args={[3.2, 3.2]} />
        <meshBasicMaterial map={shadowTex} transparent depthWrite={false} />
      </mesh>
      <group ref={root}>
        <primitive object={built.pivot} />
      </group>
    </>
  );
}

const VIEWS = [
  { id: 'front', label: '앞', yaw: 0, pitch: 0 },
  { id: 'right', label: '오른쪽', yaw: -Math.PI / 2, pitch: 0 },
  { id: 'back', label: '뒤', yaw: Math.PI, pitch: 0 },
  { id: 'left', label: '왼쪽', yaw: Math.PI / 2, pitch: 0 },
  { id: 'top', label: '위', yaw: 0, pitch: 1.15 },
  { id: 'bottom', label: '아래', yaw: 0, pitch: -1.15 },
];

export default function Obj3DViewer({ art, artSize = 280, build, hook = false, dna, width = 320, height = 340, resetKey, onReady, record, printable = true, longMm, surfaceOnly = false }) {
  const jr = React.useContext(JourneyContext);
  const mats = jr && jr.materials;
  const real = React.useMemo(() => {
    const b = mats && mats.base && MATERIAL_BY_ID[mats.base];
    if (!b) return null;
    const a = mats.accent && MATERIAL_BY_ID[mats.accent];
    return { base: b, accent: a || null };
  }, [mats && mats.base, mats && mats.accent]);
  const shotRef = useRef(null);
  const [tex, setTex] = useState(null);
  const [failed, setFailed] = useState(false);
  const [auto, setAuto] = useState(!SHOT_STILL);
  const [activeView, setActiveView] = useState(null);
  // 촬영용(웹): 주소에 still=1 이 있으면 돌지 않고 같은 각도로 멈춰 있다
  const still = SHOT_STILL;
  const ctl = useRef({ yaw: -0.45, pitch: 0.18, vel: 0, drag: false, auto: !still, goto: null });

  useEffect(() => {
    ctl.current.auto = auto;
  }, [auto]);

  useEffect(() => {
    ctl.current.yaw = -0.45;
    ctl.current.pitch = 0.18;
    ctl.current.goto = null;
    setActiveView(null);
  }, [build, hook, resetKey]);

  useEffect(() => {
    let dead = false;
    setFailed(false);
    const timer = setTimeout(() => !dead && setFailed(true), 14000);
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 400));
        const uri = await snap(shotRef, artSize, artSize);
        const t = await loadTexture(uri);
        clearTimeout(timer);
        if (!dead) setTex(t);
      } catch (e) {
        if (!dead) setFailed(true);
      }
    })();
    return () => {
      dead = true;
      clearTimeout(timer);
    };
  }, [artSize, resetKey]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2,
        onPanResponderGrant: () => {
          ctl.current.drag = true;
          ctl.current.goto = null;
          setActiveView(null);
        },
        onPanResponderMove: (_, g) => {
          ctl.current.vel = Math.max(-0.2, Math.min(0.2, g.vx * 0.02));
          ctl.current.yaw += g.vx * 0.016;
        },
        onPanResponderRelease: () => {
          ctl.current.drag = false;
        },
        onPanResponderTerminate: () => {
          ctl.current.drag = false;
        },
      }),
    []
  );

  const goView = (v) => {
    setAuto(false);
    setActiveView(v.id);
    ctl.current.goto = { yaw: v.yaw, pitch: v.pitch };
  };

  return (
    <View style={{ width, alignItems: 'center' }}>
      <View style={{ width, height }} {...pan.panHandlers}>
        <View pointerEvents="none" style={styles.hidden}>
          <ViewShot ref={shotRef} style={{ width: artSize, height: artSize, backgroundColor: PAPER, alignItems: 'center', justifyContent: 'center' }}>
            {art}
          </ViewShot>
        </View>
        {failed ? (
          <View style={[styles.fallback, { width, height }]}>{art}</View>
        ) : tex ? (
          <Canvas
            dpr={[1, 2]}
            style={{ width, height, backgroundColor: 'transparent' }}
            camera={{ position: [0, 0.35, 6.4], fov: 32 }}
            gl={{ alpha: true, antialias: true, preserveDrawingBuffer: SHOT_STILL }}
            onCreated={({ gl }) => { gl.setClearColor(0x000000, 0); gl.toneMappingExposure = 0.9; }}
          >
            <Scene tex={tex} build={build} hook={hook} dna={dna} record={record} printable={printable} real={real} surfaceOnly={surfaceOnly} longMm={longMm || (hook ? 45 : 50)} ctl={ctl} onFail={() => setFailed(true)} onBuilt={onReady} />
          </Canvas>
        ) : (
          <View style={[styles.fallback, { width, height }]}>
            <Text style={styles.loading}>{t('3D 모델을 만드는 중…')}</Text>
          </View>
        )}
      </View>
      <View style={styles.viewRow}>
        {VIEWS.map((v) => (
          <Pressable key={v.id} onPress={() => goView(v)} style={[styles.viewBtn, activeView === v.id && styles.viewBtnOn]}>
            <Text style={[styles.viewTxt, activeView === v.id && styles.viewTxtOn]}>{t(v.label)}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => {
            setActiveView(null);
            ctl.current.goto = null;
            setAuto((a) => !a);
          }}
          style={[styles.viewBtn, auto && styles.viewBtnOn]}
        >
          <Text style={[styles.viewTxt, auto && styles.viewTxtOn]}>{auto ? t('돌리는 중') : t('자동 회전')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', left: -4000, top: 0 },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  loading: { fontSize: 12, color: colors.muted },
  viewRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 6 },
  viewBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.paper,
  },
  viewBtnOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  viewTxt: { fontSize: 11.5, color: colors.muted, fontWeight: '700' },
  viewTxtOn: { color: '#fff' },
});
