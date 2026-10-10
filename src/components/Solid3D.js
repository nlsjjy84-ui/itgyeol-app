import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Platform } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Rotatable3D from './Rotatable3D';

// 진짜 3D(three.js) 뷰어.
// 화면에 그려 둔 2D 그림(앞면/뒷면)을 사진처럼 찍어 "투명 배경 PNG"로 만든 뒤,
//  - 앞면 판, 뒷면 판
//  - 그 사이에 같은 윤곽을 따라 얇게 여러 장 겹친 "옆면 층"
// 으로 두께가 있는 입체 오브젝트를 만든다. 어떤 모양(원·비녀·붓·부채…)이든 윤곽만 있으면 된다.
// 손으로 끌면 직접 돌릴 수 있고, 가만히 두면 천천히 돈다.
//
// [안전장치] 캡처·WebGL에 문제가 생기거나 12초 안에 준비되지 않으면, 예전 방식(Rotatable3D)으로
// 자동 전환한다 — 화면이 비거나 멈추는 일이 없도록.

const LAYERS = 120;

async function snap(ref, w, h) {
  if (Platform.OS === 'web') {
    const node = ref.current && (ref.current.root || ref.current.node || ref.current);
    const dom = node && node.nodeType ? node : null;
    if (!dom) throw new Error('no dom');
    const mod = await import('html2canvas-pro');
    const html2canvas = mod.default || mod;
    const canvas = await html2canvas(dom, { backgroundColor: null, scale: 2, useCORS: true });
    return canvas.toDataURL('image/png');
  }
  const uri = await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', width: w * 2, height: h * 2 });
  return uri;
}

function loadTexture(uri) {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      uri,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        resolve(t);
      },
      undefined,
      reject
    );
  });
}

// 옆면 층: 그림의 윤곽(알파)만 쓰고 색은 한 가지 금동색으로 칠한다. 얇은 판 수십 장을 두께 방향으로
// 촘촘히 쌓아 "하나의 덩어리 지오메트리"로 합쳐 한 번에 그린다(인스턴싱 같은 특수 기능을 쓰지 않아
// 웹·폰 모두 안전). 층마다 밝기를 조금씩 달리해 겹쳐 쌓인 결이 있는 옆면처럼 보인다.
function SideLayers({ map, planeW, planeH, depth }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { map: { value: map } },
        side: THREE.DoubleSide,
        vertexShader:
          'varying vec2 vUv; varying float vShade; attribute float shade; void main(){ vUv = uv; vShade = shade; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
        fragmentShader:
          'uniform sampler2D map; varying vec2 vUv; varying float vShade; void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.5) discard; gl_FragColor = vec4(vec3(0.72,0.56,0.27) * vShade, 1.0); }',
      }),
    [map]
  );
  const geo = useMemo(() => {
    const pos = new Float32Array(LAYERS * 12);
    const uv = new Float32Array(LAYERS * 8);
    const shade = new Float32Array(LAYERS * 4);
    const idx = new Uint16Array(LAYERS * 6);
    const hw = planeW / 2;
    const hh = planeH / 2;
    for (let i = 0; i < LAYERS; i += 1) {
      const z = -depth / 2 + (depth * i) / (LAYERS - 1);
      pos.set([-hw, -hh, z, hw, -hh, z, hw, hh, z, -hw, hh, z], i * 12);
      uv.set([0, 0, 1, 0, 1, 1, 0, 1], i * 8);
      const sh = 0.62 + 0.3 * (i / (LAYERS - 1)) + (i % 2 ? 0.06 : 0);
      shade.set([sh, sh, sh, sh], i * 4);
      const v = i * 4;
      idx.set([v, v + 1, v + 2, v, v + 2, v + 3], i * 6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setAttribute('shade', new THREE.BufferAttribute(shade, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  }, [planeW, planeH, depth]);
  useEffect(() => () => { mat.dispose(); geo.dispose(); }, [mat, geo]);
  return <mesh geometry={geo} material={mat} frustumCulled={false} />;
}

function Object3D({ front, back, aspect, spin, drag }) {
  const group = useRef();
  const last = useRef(0);
  const planeW = 2 * aspect;
  const planeH = 2;
  const depth = 0.36;

  useFrame((_, dt) => {
    if (!group.current) return;
    const d = drag.current;
    if (d.active) {
      group.current.rotation.y += d.dx * 0.012;
      d.dx = 0;
    } else {
      group.current.rotation.y += dt * 0.7;
    }
    group.current.rotation.x = 0.16 + Math.sin(last.current) * 0.08;
    last.current += dt * 0.8;
  });

  return (
    <group ref={group}>
      <SideLayers map={front} planeW={planeW} planeH={planeH} depth={depth} />
      <mesh position={[0, 0, depth / 2 + 0.002]}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial map={front} transparent alphaTest={0.02} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -depth / 2 - 0.002]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial map={back} transparent alphaTest={0.02} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function Solid3D({ front, back, width, height }) {
  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [tex, setTex] = useState(null);
  const [failed, setFailed] = useState(false);
  const drag = useRef({ active: false, dx: 0 });

  useEffect(() => {
    let dead = false;
    const timer = setTimeout(() => {
      if (!dead) setFailed(true);
    }, 12000);
    const done = () => clearTimeout(timer);
    const run = async () => {
      try {
        await new Promise((r) => setTimeout(r, 350)); // 레이아웃·글꼴이 자리 잡을 시간
        const [fu, bu] = [await snap(frontRef, width, height), await snap(backRef, width, height)];
        const [ft, bt] = [await loadTexture(fu), await loadTexture(bu)];
        done();
        if (!dead) setTex({ ft, bt });
      } catch (e) {
        if (!dead) setFailed(true);
      }
    };
    run();
    return () => {
      dead = true;
      clearTimeout(timer);
    };
  }, [width, height]);

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderGrant: () => {
          drag.current.active = true;
        },
        onPanResponderMove: (_, g) => {
          drag.current.dx = g.vx * 16;
        },
        onPanResponderRelease: () => {
          drag.current.active = false;
        },
        onPanResponderTerminate: () => {
          drag.current.active = false;
        },
      }),
    []
  );

  if (failed) return <Rotatable3D front={front} back={back} width={width} height={height} />;

  return (
    <View style={{ width, height }} {...pan.panHandlers}>
      {/* 사진 찍기용 숨은 화면 — 화면 밖에 둔다 */}
      <View pointerEvents="none" style={styles.hidden}>
        <ViewShot ref={frontRef} style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
          {front}
        </ViewShot>
        <ViewShot ref={backRef} style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
          {back}
        </ViewShot>
      </View>
      {tex ? (
        <Canvas
          style={{ width, height, backgroundColor: 'transparent' }}
          camera={{ position: [0, 0, 5.2], fov: 32 }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <Object3D front={tex.ft} back={tex.bt} aspect={width / height} drag={drag} />
        </Canvas>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { position: 'absolute', left: -4000, top: 0 },
});
