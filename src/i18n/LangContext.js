import { createContext, useContext } from 'react';
// AppRoot가 { lang, change } 를 내려 준다. change(id)를 부르면 화면 트리를 새 언어로 다시 그린다.
export const LangContext = createContext({ lang: 'ko', change: () => {} });
export const useLangSwitch = () => useContext(LangContext);
