import { useEffect, useState } from 'react';

// 화면이 열려 있는 동안 fn을 바로 한 번, 그리고 ms마다 부른다. 서버와 이어졌는지(true/false/null)를 돌려준다.
export default function useLive(fn, ms = 5000) {
  const [ok, setOk] = useState(null);
  useEffect(() => {
    let live = true;
    const tick = () => Promise.resolve(fn()).then((v) => live && setOk(v !== false)).catch(() => live && setOk(false));
    tick();
    const id = setInterval(tick, ms);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, [fn, ms]);
  return ok;
}
