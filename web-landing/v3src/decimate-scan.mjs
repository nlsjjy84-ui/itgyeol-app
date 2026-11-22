// 국립중앙박물관 3D 스캔 OBJ → 소개 화면용 작은 .bin (meshoptimizer로 삼각형 수 줄임). 사용: node decimate-scan.mjs in.obj out.bin 30000
import fs from 'fs'; import { MeshoptSimplifier } from 'meshoptimizer';
const [src,out,target]=process.argv.slice(2);
const L=fs.readFileSync(src,'utf8').split('\n'); const v=[],t=[],F=[];
for(const l of L){ if(l.startsWith('v ')){const a=l.split(' ');v.push(+a[1],+a[2],+a[3])} else if(l.startsWith('vt ')){const a=l.split(' ');t.push(+a[1],+a[2])} else if(l.startsWith('f ')){const a=l.trim().split(' ').slice(1).map(s=>s.split('/').map(x=>+x-1)); for(let i=1;i+1<a.length;i++)F.push(a[0],a[i],a[i+1])}}
// unify: key pos/uv
const map=new Map(),P=[],U=[],I=[];
for(const c of F){const k=c[0]+'_'+c[1];let i=map.get(k);if(i===undefined){i=P.length/3;map.set(k,i);P.push(v[c[0]*3],v[c[0]*3+1],v[c[0]*3+2]);U.push(t[c[1]*2],t[c[1]*2+1])}I.push(i)}
console.log('verts',P.length/3,'tris',I.length/3);
await MeshoptSimplifier.ready;
const pos=new Float32Array(P), idx=new Uint32Array(I);
const [ni,err]=MeshoptSimplifier.simplify(idx,pos,3,Math.floor(+target*3),0.01,['LockBorder']);
// compact used verts
const rem=new Map(),P2=[],U2=[],I2=[];
for(const i of ni){let j=rem.get(i);if(j===undefined){j=P2.length/3;rem.set(i,j);P2.push(P[i*3],P[i*3+1],P[i*3+2]);U2.push(U[i*2],U[i*2+1])}I2.push(j)}
const n=P2.length/3; console.log('out verts',n,'tris',I2.length/3,'err',err);
let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let i=0;i<n;i++)for(let a=0;a<3;a++){mn[a]=Math.min(mn[a],P2[i*3+a]);mx[a]=Math.max(mx[a],P2[i*3+a])}
const q=new Uint16Array(n*3);for(let i=0;i<n;i++)for(let a=0;a<3;a++)q[i*3+a]=Math.round((P2[i*3+a]-mn[a])/(mx[a]-mn[a])*65535);
const uv=new Uint16Array(n*2);for(let i=0;i<n*2;i++)uv[i]=Math.round(Math.min(1,Math.max(0,U2[i]))*65535);
const ix=n<65536?new Uint16Array(I2):new Uint32Array(I2);
const head=JSON.stringify({n,t:I2.length/3,mn,mx,i32:!(n<65536)}); const hb=Buffer.from(head.padEnd(Math.ceil((head.length+4)/4)*4-4,' '));
const len=Buffer.alloc(4);len.writeUInt32LE(hb.length);
fs.writeFileSync(out,Buffer.concat([len,hb,Buffer.from(q.buffer),Buffer.from(uv.buffer),Buffer.from(ix.buffer)]));
console.log('bytes',fs.statSync(out).size);
