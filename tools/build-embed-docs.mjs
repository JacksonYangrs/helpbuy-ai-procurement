/*
 * 文档内容内嵌生成器
 * 目的：把 public/ 下的 Markdown 源文件内嵌进 docs/assets/documents.js（window.HELPBUY_DOCS），
 *      使站点不再发布任何可被直接访问的裸 .md，配合密码门禁实现“全方位保护文档”。
 * 用法：node tools/build-embed-docs.mjs   （部署 CI 与本地预览前均运行）
 * 注意：生成的 documents.js 由本脚本产出，请勿手改；内容源始终为 public/*.md。
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, ".."); // 仓库根 = helpbuy-ai-procurement
const publicDir = resolve(root, "public");
const outFile = resolve(root, "docs/assets/documents.js");

// 源文件名 -> 页面使用的 key（与 design/document/sourcecode 页的 HELPBUY_DOCS[key] 对应）
const MAP = {
  "HELPBUY_总体设计.md": "overall",
  "HELPBUY_采购需求聚合子系统设计.md": "aggregate",
  "HELPBUY_下单执行子系统设计.md": "execution",
  "HELPBUY_AI方案设计.md": "ai",
  "HELPBUY_PRD_V2_商业计划与产品方案.md": "prd",
  "源代码与设计文档映射.md": "mapping",
};

const obj = {};
for (const [file, key] of Object.entries(MAP)) {
  const src = resolve(publicDir, file);
  if (!existsSync(src)) {
    throw new Error("缺少文档源文件：" + src);
  }
  obj[key] = readFileSync(src, "utf8");
}

// JSON 序列化后把所有 "<" 转义为 \u003c，杜绝内容中的 </script> 截断外层 <script>
let json = JSON.stringify(obj).replace(/</g, "\\u003c");
const out =
  "/* 自动生成：文档内容内嵌，避免裸 .md 被直接访问。源 = public/*.md，勿手改。 */\n" +
  "window.HELPBUY_DOCS = " + json + ";\n";

writeFileSync(outFile, out, "utf8");
console.log(
  "embedded " + Object.keys(obj).length + " docs -> " + outFile +
  " (" + (Buffer.byteLength(out, "utf8") / 1024).toFixed(1) + " KB)"
);
