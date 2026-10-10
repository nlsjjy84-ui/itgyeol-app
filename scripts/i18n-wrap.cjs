// 한 번 쓰고 마는 도구: 화면 파일 속 한국어 문장을 찾아 i18nT('…') 번역 자리로 바꾼다.
// - 함수 안의 문자열·JSX 글자·템플릿 문자열만 바꾼다(모듈 맨 위 자료는 화면에 그릴 때 감싼다).
// - 비교(===, case)에 쓰이는 문자열은 값으로 쓰이는 것이라 건드리지 않는다.
// - <Text> 안에 {변수}로 그리는 글자도 i18nT(변수)로 감싼다(자료 파일의 한국어가 화면에 나올 때 번역되게).
// 사용: node scripts/i18n-wrap.cjs <파일...>  → 바꾼 파일을 저장하고, 찾은 문장 목록을 /tmp/qa/msgs2.json에 모은다.
const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const H = /[가-힣]/;
const files = process.argv.slice(2);
const all = new Set(fs.existsSync('/tmp/qa/msgs2.json') ? JSON.parse(fs.readFileSync('/tmp/qa/msgs2.json', 'utf8')) : []);
const q = (s) => "'" + s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'";

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(src, { sourceType: 'module', plugins: ['jsx'] });
  const compared = new Set();
  traverse(ast, {
    BinaryExpression(p) {
      for (const s of [p.node.left, p.node.right]) if (s.type === 'StringLiteral') compared.add(s.value);
    },
    SwitchCase(p) { if (p.node.test && p.node.test.type === 'StringLiteral') compared.add(p.node.test.value); },
  });
  const edits = [];
  const inFn = (p) => !!p.getFunctionParent();
  const isTCall = (p) => p.parentPath && p.parentPath.isCallExpression() && ['t', 'tr', 'i18nT'].includes(p.parentPath.node.callee.name);
  traverse(ast, {
    StringLiteral(p) {
      const v = p.node.value;
      if (!H.test(v)) return;
      all.add(v);
      if (!inFn(p) || isTCall(p) || compared.has(v)) return;
      const par = p.parentPath;
      if (par.isImportDeclaration() || par.isExportDeclaration()) return;
      if (par.isObjectProperty() && par.node.key === p.node) return;
      if (par.isMemberExpression() && par.node.property === p.node) return;
      if (par.isCallExpression() && par.node.callee.type === 'MemberExpression' && par.node.callee.object.name === 'console') return;
      if (par.isJSXAttribute()) { edits.push([p.node.start, p.node.end, `{i18nT(${q(v)})}`]); return; }
      edits.push([p.node.start, p.node.end, `i18nT(${q(v)})`]);
    },
    TemplateLiteral(p) {
      const raw = p.node.quasis.map((x) => x.value.cooked).join('{}');
      if (!H.test(raw)) return;
      if (p.parentPath.isTaggedTemplateExpression()) return;
      let key = ''; const vars = [];
      p.node.quasis.forEach((qq, i) => {
        key += qq.value.cooked;
        if (i < p.node.expressions.length) { key += `{p${i}}`; vars.push(`p${i}: ${src.slice(p.node.expressions[i].start, p.node.expressions[i].end)}`); }
      });
      all.add(key);
      if (!inFn(p) || isTCall(p)) return;
      edits.push([p.node.start, p.node.end, vars.length ? `i18nT(${q(key)}, { ${vars.join(', ')} })` : `i18nT(${q(key)})`]);
    },
    JSXText(p) {
      const v = p.node.value;
      if (!H.test(v)) return;
      const lead = v.match(/^\s*/)[0]; const trail = v.match(/\s*$/)[0];
      const core = v.trim().replace(/\s*\n\s*/g, ' ');
      all.add(core);
      edits.push([p.node.start, p.node.end, `${lead}{i18nT(${q(core)})}${trail}`]);
    },
    JSXExpressionContainer(p) {
      const e = p.node.expression;
      if (!['MemberExpression', 'Identifier', 'ConditionalExpression', 'LogicalExpression'].includes(e.type)) return;
      if (e.type === 'Identifier' && ['children', 'undefined'].includes(e.name)) return;
      const el = p.parentPath;
      if (!el.isJSXElement()) return;
      const name = el.node.openingElement.name;
      if (!(name.type === 'JSXIdentifier' && name.name === 'Text')) return;
      edits.push([e.start, e.end, `i18nT(${src.slice(e.start, e.end)})`]);
    },
  });
  if (!edits.length) continue;
  // 겹치는 편집(바깥이 안쪽을 감싸는 경우)은 바깥 것만 남긴다: 넓은 것부터 보고, 이미 고른 것 안에 들어가면 버린다
  edits.sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]));
  const kept = [];
  for (const ed of edits) { if (!kept.some((k) => ed[0] >= k[0] && ed[1] <= k[1])) kept.push(ed); }
  kept.sort((a, b) => b[0] - a[0]);
  let out = src;
  for (const [s, e, r] of kept) out = out.slice(0, s) + r + out.slice(e);
  if (!/import \{[^}]*\bt as i18nT\b[^}]*\} from/.test(out)) {
    const rel = path.relative(path.dirname(file), path.join(__dirname, '..', 'src', 'i18n')).replace(/\\/g, '/');
    const imp = `import { t as i18nT } from '${rel.startsWith('.') ? rel : './' + rel}';\n`;
    const lines = out.split('\n'); let idx = -1;
    lines.forEach((l, i) => { if (/^import .* from ['"].*['"];?\s*$/.test(l)) idx = i; });
    lines.splice(idx + 1, 0, imp.trimEnd()); out = lines.join('\n');
  }
  fs.writeFileSync(file, out);
  console.log('wrapped', kept.length, file);
}
fs.writeFileSync('/tmp/qa/msgs2.json', JSON.stringify([...all], null, 1));
console.log('msgids', all.size);
