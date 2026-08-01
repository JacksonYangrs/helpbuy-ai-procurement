// 在 Node 沙箱里加载真实的 marked + md-render.js，验证整条渲染管线产出的 HTML 结构
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";

const ROOT = process.cwd();
const markedSrc = fs.readFileSync("docs/assets/vendor/marked.min.js", "utf8");
const mdRenderSrc = fs.readFileSync("docs/assets/md-render.js", "utf8");

// 模拟浏览器 global：window/document/marked/fetch
function makeTarget() {
  return {
    _html: "",
    set innerHTML(v) { this._html = v; },
    get innerHTML() { return this._html; },
    classList: { add() {}, remove() {}, toggle() {} },
    querySelectorAll() { return []; }
  };
}
const sandbox = {
  console,
  TextDecoder,
  setTimeout,
  // mermaid 失败降级路径用到的 document mock
  document: {
    createElement: () => ({ className: "", style: {}, set innerHTML(_) {}, setAttribute() {} }),
    head: { appendChild() {} }
  },
  // mock mermaid：避免沙箱内真实库缺失触发降级替换 DOM，造成计数假象
  mermaid: { initialize() {}, run() { return Promise.resolve(); } },
  fetch: async (url) => {
    const p = path.resolve(ROOT, url.replace(/^\.\//, ""));
    const buf = fs.readFileSync(p);
    return { ok: true, arrayBuffer: async () => buf };
  }
};
sandbox.window = sandbox;
sandbox.self = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

// 1) 加载 marked（UMD 会挂到 sandbox.marked 或 sandbox.window.marked）
vm.runInContext(markedSrc, sandbox);
const markedRef = sandbox.marked || sandbox.window.marked || sandbox.globalThis.marked;
if (!markedRef) { console.error("✗ marked 未挂载到沙箱"); process.exit(1); }
console.log("✓ marked 加载:", typeof markedRef.parse === "function" ? markedRef.version || "ok" : "no parse");

// 2) 加载 md-render.js（IIFE 绑定到 window，暴露 HELPBUY_MD）
vm.runInContext(mdRenderSrc, sandbox);
const MD = sandbox.HELPBUY_MD || sandbox.window.HELPBUY_MD;
if (!MD) { console.error("✗ HELPBUY_MD 未暴露"); process.exit(1); }
console.log("✓ md-render.js 加载: HELPBUY_MD.render =", typeof MD.render === "function" ? "ok" : "missing");

// 3) 逐个文档跑整条管线（mermaid 库不存在 → 走 catch 降级，验证降级不丢信息）
const files = [
  "docs/HELPBUY_采购需求聚合子系统设计.md",
  "docs/HELPBUY_下单执行子系统设计.md",
  "docs/HELPBUY_AI方案设计.md",
  "docs/HELPBUY_PRD_V2_商业计划与产品方案.md",
  "docs/源代码与设计文档映射.md"
];

let allOk = true;
for (const f of files) {
  const target = makeTarget();
  try {
    await MD.render({ file: f, target, baseHref: "../assets/", onError: "加载失败" });
  } catch (e) {
    console.error(`✗ ${f} 渲染抛错:`, e.message);
    allOk = false;
    continue;
  }
  const html = target.innerHTML;
  const tables = (html.match(/class="md-table"/g) || []).length;
  const mermaidBoxes = (html.match(/class="mermaid"/g) || []).length;
  const preBlocks = (html.match(/class="md-pre/g) || []).length;
  const diagrams = (html.match(/is-diagram/g) || []).length;
  const h1 = (html.match(/<h1 /g) || []).length;
  const h2 = (html.match(/<h2 /g) || []).length;
  const err = /class="md-error"/.test(html);
  const ok = !err && h1 >= 1;
  allOk = allOk && ok;
  console.log(
    `${ok ? "✓" : "✗"} ${f}\n   表格:${tables}  mermaid容器:${mermaidBoxes}  代码块:${preBlocks}(含图:${diagrams})  H1:${h1}  H2:${h2}  ${err ? "错误块!" : ""}`
  );
}
console.log(allOk ? "\n=== 管线验证全部通过 ===" : "\n=== 存在失败项 ===");
process.exit(allOk ? 0 : 1);
