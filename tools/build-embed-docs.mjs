/*
 * 文档加密打包器（PBKDF2 + AES-GCM）
 *
 * 目的：本网站仓是 PUBLIC 仓，任何提交进来的明文都等于公开发布。
 *      因此文档明文**只允许存在于私有核心仓**，本脚本从私有核心仓读取明文，
 *      用访问密码派生密钥加密后，只把**密文**写入 docs/assets/documents.js。
 *      直接打开/下载 documents.js 只能看到 base64 乱码；只有在浏览器输入正确密码，
 *      由 WebCrypto 在本地派生密钥解密后，才能得到明文。
 *
 * 安全约定（必须遵守）：
 *  - 本文件会随公开仓发布，**严禁**在此硬编码密码，密码只能来自环境变量。
 *  - 明文源目录（私有核心仓）不得被复制进本仓任何被跟踪的路径。
 *  - 生成的 documents.js 只含密文，可安全提交。
 *
 * 用法：
 *   HELPBUY_DOC_PASSWORD='<访问密码>' node tools/build-embed-docs.mjs
 * 可选环境变量：
 *   HELPBUY_DOC_SRC   明文源目录，默认 ../（即私有核心仓根目录）
 *
 * 加密参数（与前端 password-gate.js 必须一致）：
 *   KDF     PBKDF2-HMAC-SHA256, 310000 次迭代, 16 字节随机 salt（全局共用）
 *   Cipher  AES-GCM 256 位, 每份文档独立 12 字节随机 IV, 128 位认证标签
 *   校验    canary 密文；密码错误时 GCM 认证失败直接抛错，无需存任何密码指纹
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { webcrypto } from "node:crypto";

const subtle = webcrypto.subtle;
// 注意：getRandomValues 依赖 this 绑定到 Crypto 实例，不能直接解构
const getRandomValues = (arr) => webcrypto.getRandomValues(arr);

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, ".."); // 网站仓根 = helpbuy-ai-procurement
const outFile = resolve(root, "docs/assets/documents.js");

// 明文源目录：默认取上级目录（私有核心仓 helpbuy-procurement-core）
const srcDir = resolve(root, process.env.HELPBUY_DOC_SRC || "..");

// 私有核心仓文件名 -> 页面使用的 key（页面读 window.HELPBUY_DOCS[key]）
const MAP = {
  "HELPBUY_总体设计.md": "overall",
  "设计方案_采购需求聚合子系统.md": "aggregate",
  "设计方案_下单执行子系统.md": "execution",
  "设计方案_代采平台AI方案.md": "ai",
  "HELPBUY_PRD_V2_商业计划与产品方案.md": "prd",
  "源代码与设计文档映射.md": "mapping",
};

const KDF_ITERATIONS = 310000;
const CANARY = "HELPBUY_DOC_OK";

const password = process.env.HELPBUY_DOC_PASSWORD;
if (!password) {
  console.error(
    "错误：缺少环境变量 HELPBUY_DOC_PASSWORD。\n" +
    "本仓为公开仓，密码不得写入代码，请通过环境变量传入：\n" +
    "  HELPBUY_DOC_PASSWORD='<访问密码>' node tools/build-embed-docs.mjs"
  );
  process.exit(1);
}

const b64 = (buf) => Buffer.from(buf).toString("base64");
const utf8 = (str) => new TextEncoder().encode(str);

async function deriveKey(pwd, salt) {
  const base = await subtle.importKey("raw", utf8(pwd), "PBKDF2", false, ["deriveKey"]);
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: KDF_ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(key, plaintext) {
  const iv = getRandomValues(new Uint8Array(12));
  const ct = await subtle.encrypt({ name: "AES-GCM", iv, tagLength: 128 }, key, utf8(plaintext));
  return { iv: b64(iv), ct: b64(ct) };
}

async function main() {
  // 1. 读取私有核心仓明文
  const plain = {};
  for (const [file, key] of Object.entries(MAP)) {
    const src = resolve(srcDir, file);
    if (!existsSync(src)) {
      throw new Error(
        "缺少明文源文件：" + src + "\n" +
        "提示：明文只保存在私有核心仓，请确认 HELPBUY_DOC_SRC 指向该仓根目录。"
      );
    }
    plain[key] = readFileSync(src, "utf8");
  }

  // 2. 派生密钥并逐份加密
  const salt = getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);

  const docs = {};
  let rawBytes = 0;
  for (const [k, text] of Object.entries(plain)) {
    docs[k] = await encrypt(key, text);
    rawBytes += Buffer.byteLength(text, "utf8");
  }
  const check = await encrypt(key, CANARY);

  // 3. 只输出密文
  const payload = {
    v: 1,
    kdf: { name: "PBKDF2", hash: "SHA-256", iterations: KDF_ITERATIONS, salt: b64(salt) },
    cipher: "AES-GCM",
    check,
    docs,
  };

  const out =
    "/* 自动生成：文档密文（PBKDF2-SHA256/310k + AES-GCM-256）。\n" +
    "   明文只存在于私有核心仓；本文件不含明文，也不含密码。\n" +
    "   重建：HELPBUY_DOC_PASSWORD='<访问密码>' node tools/build-embed-docs.mjs */\n" +
    "window.HELPBUY_DOCS_ENC = " + JSON.stringify(payload) + ";\n";

  writeFileSync(outFile, out, "utf8");

  const kb = (n) => (n / 1024).toFixed(1) + " KB";
  console.log(
    "已加密 " + Object.keys(docs).length + " 份文档 -> " + outFile + "\n" +
    "  明文合计 " + kb(rawBytes) + " → 密文文件 " + kb(Buffer.byteLength(out, "utf8")) + "\n" +
    "  KDF PBKDF2-SHA256 x" + KDF_ITERATIONS + " / AES-GCM-256 / 每文档独立 IV"
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
