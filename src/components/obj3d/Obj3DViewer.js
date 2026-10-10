import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Platform, Pressable } from 'react-native';
import Text from '../../ui/Text';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { THREE, makeMats, addKeyringHook, dnaRef, deformObject } from './kit';
import { colors } from '../../theme';
import { t } from '../../i18n';

// 진짜 3D 물건 뷰어.
// 결과 그림(조각보)을 한 장 찍어 texture로 만들고, 물건마다 따로 만든 3D 모델에 입힌다.
// 어느 방향으로든 돌려 볼 수 있다: 끌면 좌우로 돌고, 버튼으로 앞·뒤·옆·위에서 바로 본다.
// 준비에 실패하거나 12초가 지나도 안 뜨면, 그림을 그대로 보여 주는 안전 화면으로 바뀐다.

const PAPER = '#fffbf3';

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

function Scene({ tex, build, hook, dna, ctl, onBuilt, onFail }) {
  const root = useRef();
  const { gl, scene } = useThree();
  const [envOk, setEnvOk] = useState(null);

  useEffect(() => {
    let disposed = false;
    (async () => {
      try {
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        const pm = new THREE.PMREMGenerator(gl);
        const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
        if (disposed) return;
        scene.environment = env;
        scene.environmentIntensity = 0.7;
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
      let obj = build({ tex, m, dna });
      obj = deformObject(obj, dna);
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
  }, [envOk, tex, build, hook, dna]);

  const shadowTex = useMemo(() => shadowTexture(), []);

  useEffect(() => {
    if (built && built.error) onFail && onFail(built.error);
    else if (built) onBuilt && onBuilt();
  }, [built, onFail, onBuilt]);

  useFrame((_, dt) => {
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
      <ambientLight intensity={envOk ? 0.35 : 0.9} />
      <hemisphereLight args={[0xfff4e0, 0x6a5a48, envOk ? 0.45 : 0.8]} />
      <directionalLight position={[3, 4, 5]} intensity={envOk ? 1.4 : 1.7} />
      <directionalLight position={[-4, 1.5, -3]} intensity={0.6} color={0xdfe8ff} />
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

export default function Obj3DViewer({ art, artSize = 280, build, hook = false, dna, width = 320, height = 340, resetKey }) {
  const shotRef = useRef(null);
  const [tex, setTex] = useState(null);
  const [failed, setFailed] = useState(false);
  const [auto, setAuto] = useState(true);
  const [activeView, setActiveView] = useState(null);
  const ctl = useRef({ yaw: -0.45, pitch: 0.18, vel: 0, drag: false, auto: true, goto: null });

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
            flat
            dpr={[1, 2]}
            style={{ width, height, backgroundColor: 'transparent' }}
            camera={{ position: [0, 0.35, 6.4], fov: 32 }}
            gl={{ alpha: true, antialias: true }}
            onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          >
            <Scene tex={tex} build={build} hook={hook} dna={dna} ctl={ctl} onFail={() => setFailed(true)} />
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
