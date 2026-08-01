/*
 * HELPBUY 文档访问门禁（PBKDF2 + AES-GCM 真实内容加密）
 *
 * 与旧版的本质区别：
 *   旧版是「明文已在页面里，用 JS 挡住不给看」——绕过 JS 即可拿到全文。
 *   本版是「页面里只有密文」——documents.js 是 AES-GCM 密文，
 *   密钥由用户输入的密码经 PBKDF2 在浏览器本地派生，密码从不出现在任何前端文件中。
 *   直接访问/下载 documents.js 只能得到 base64 乱码，无密码在数学上无法还原。
 *
 * 流程：
 *   1. 页面加载即拉取密文包（密文公开无害），并行等待用户输入。
 *   2. 用户提交密码 → PBKDF2-SHA256 310k 次派生 AES-GCM-256 密钥。
 *   3. 先解密 canary 校验：GCM 认证标签失败 = 密码错误（无需存密码指纹）。
 *   4. 校验通过 → 解密全部文档写入 window.HELPBUY_DOCS → 调用页面 __HELPBUY_BOOT() 渲染。
 *
 * 交互：
 *   - 每次打开受保护文档都要求输入密码（不记忆解锁态）。
 *   - 右上角 × 或 Esc 可关闭弹窗并返回首页；正文始终保持隐藏。
 *   - 派生密钥约需数百毫秒，期间按钮进入「验证中…」状态防重复提交。
 *
 * 依赖：WebCrypto（需 HTTPS 或 localhost 安全上下文）。
 */
(function (global) {
  "use strict";

  var HOME_URL = "../";
  var CANARY = "HELPBUY_DOC_OK";
  var encPack = null;      // 密文包
  var encLoadError = false;
  var busy = false;

  /* ── 工具 ─────────────────────────────────────────────────── */
  function b64ToBytes(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function hasWebCrypto() {
    return !!(global.crypto && global.crypto.subtle && typeof atob === "function");
  }

  /* ── 密文包加载（密文公开无害，可提前拉取） ─────────────────── */
  function loadCipherPack() {
    var base = (typeof global.__HELPBUY_BASE !== "undefined") ? global.__HELPBUY_BASE : "assets/";
    var url;
    try {
      url = new URL(base, location.href).href + "documents.js";
    } catch (e) {
      url = base + "documents.js";
    }
    var s = document.createElement("script");
    s.src = url;
    s.onload = function () {
      encPack = global.HELPBUY_DOCS_ENC || null;
      if (!encPack) encLoadError = true;
    };
    s.onerror = function () {
      encLoadError = true;
    };
    document.head.appendChild(s);
  }

  /* ── 解密 ─────────────────────────────────────────────────── */
  function deriveKey(password, saltBytes, iterations) {
    var enc = new TextEncoder();
    return global.crypto.subtle
      .importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"])
      .then(function (baseKey) {
        return global.crypto.subtle.deriveKey(
          { name: "PBKDF2", salt: saltBytes, iterations: iterations, hash: "SHA-256" },
          baseKey,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );
      });
  }

  function decryptEntry(key, entry) {
    return global.crypto.subtle
      .decrypt(
        { name: "AES-GCM", iv: b64ToBytes(entry.iv), tagLength: 128 },
        key,
        b64ToBytes(entry.ct)
      )
      .then(function (buf) {
        return new TextDecoder("utf-8").decode(buf);
      });
  }

  // 校验密码并解密全部文档；密码错时 reject
  function unlockWithPassword(password) {
    var kdf = encPack.kdf;
    return deriveKey(password, b64ToBytes(kdf.salt), kdf.iterations).then(function (key) {
      // canary 解密失败 = 密码错误（GCM 认证标签校验）
      return decryptEntry(key, encPack.check).then(function (text) {
        if (text !== CANARY) throw new Error("canary mismatch");
        var keys = Object.keys(encPack.docs);
        return Promise.all(
          keys.map(function (k) { return decryptEntry(key, encPack.docs[k]); })
        ).then(function (texts) {
          var docs = {};
          keys.forEach(function (k, i) { docs[k] = texts[i]; });
          return docs;
        });
      });
    });
  }

  function revealDocs(docs) {
    global.HELPBUY_DOCS = docs;
    try {
      var ov = document.getElementById("pw-gate");
      if (ov) ov.remove();
    } catch (e) {}
    try {
      document.body.classList.remove("pw-protected");
    } catch (e) {}
    if (typeof global.__HELPBUY_BOOT === "function") global.__HELPBUY_BOOT();
  }

  function dismissAndGoHome() {
    try {
      var ov = document.getElementById("pw-gate");
      if (ov) ov.remove();
    } catch (e) {}
    // 保持 pw-protected：正文始终隐藏
    location.href = HOME_URL;
  }

  /* ── 样式 ─────────────────────────────────────────────────── */
  function injectStyle() {
    if (document.getElementById("pw-gate-style")) return;
    var css =
      "#pw-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;" +
      "background:rgba(9,38,59,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);" +
      "animation:pw-fade .18s ease both;}" +
      "@keyframes pw-fade{from{opacity:0}to{opacity:1}}" +
      "#pw-gate .pw-card{position:relative;width:min(92vw,380px);padding:30px 28px;background:#fff;border:1px solid #d8e3e4;border-radius:14px;" +
      "box-shadow:0 24px 70px rgba(7,28,48,.45);animation:pw-pop .2s cubic-bezier(.2,.8,.3,1) both;}" +
      "@keyframes pw-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}" +
      "#pw-gate .pw-close{position:absolute;top:10px;right:12px;width:28px;height:28px;border:0;background:none;cursor:pointer;" +
      "display:flex;align-items:center;justify-content:center;color:#9badb7;font-size:20px;line-height:1;border-radius:6px;" +
      "transition:color .12s,background .12s;padding:0;}" +
      "#pw-gate .pw-close:hover{color:#c0392b;background:#fef2f2;}" +
      "#pw-gate .pw-brand{font-size:19px;font-weight:850;letter-spacing:-.07em;color:#09263b;}" +
      "#pw-gate .pw-brand span{color:#1bb5ad;}" +
      "#pw-gate .pw-title{margin:18px 0 6px;color:#09263b;font-size:17px;font-weight:750;line-height:1.4;}" +
      "#pw-gate .pw-sub{margin:0;color:#647886;font-size:13px;line-height:1.7;}" +
      "#pw-gate .pw-input{width:100%;margin-top:18px;padding:11px 13px;color:#163346;font:inherit;font-size:14px;" +
      "border:1px solid #b8d8d8;border-radius:8px;background:#fff;transition:border-color .15s,box-shadow .15s;}" +
      "#pw-gate .pw-input::placeholder{color:#9badb7;}" +
      "#pw-gate .pw-input:focus{outline:none;border-color:#08817d;box-shadow:0 0 0 3px rgba(8,129,125,.14);}" +
      "#pw-gate .pw-input:disabled{background:#f4f7f7;color:#9badb7;}" +
      "#pw-gate .pw-submit{width:100%;margin-top:12px;padding:11px;color:#fff;font:inherit;font-size:13px;font-weight:750;" +
      "border:0;border-radius:8px;cursor:pointer;background:#0e9e97;transition:background .15s,transform .12s;}" +
      "#pw-gate .pw-submit:hover{background:#0b8a84;}" +
      "#pw-gate .pw-submit:active{transform:translateY(1px);}" +
      "#pw-gate .pw-submit:disabled{background:#8fc7c4;cursor:progress;}" +
      "#pw-gate .pw-err{margin:10px 0 0;min-height:16px;color:#c0392b;font-size:12px;line-height:1.5;}" +
      "#pw-gate .pw-hint{margin:14px 0 0;color:#9badb7;font-size:11px;text-align:center;}";
    var style = document.createElement("style");
    style.id = "pw-gate-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ── 弹窗 ─────────────────────────────────────────────────── */
  function buildModal() {
    if (document.getElementById("pw-gate")) return;
    injectStyle();
    var overlay = document.createElement("div");
    overlay.id = "pw-gate";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "文档访问密码");
    overlay.innerHTML =
      '<div class="pw-card">' +
      '<button id="pw-close-btn" class="pw-close" type="button" aria-label="关闭">&times;</button>' +
      '<div class="pw-brand">HELP<span>BUY</span></div>' +
      '<p class="pw-title">文档访问需要密码</p>' +
      '<p class="pw-sub">文档以 AES-GCM 加密存储，需输入访问密码在本地解密后查看。密码由平台提供。</p>' +
      '<input id="pw-input" class="pw-input" type="password" placeholder="访问密码" autocomplete="off" spellcheck="false" />' +
      '<button id="pw-submit" class="pw-submit" type="button">解密并查看</button>' +
      '<p id="pw-err" class="pw-err" role="alert"></p>' +
      '<p class="pw-hint">密码仅在本机用于解密，不会上传</p>' +
      "</div>";
    document.body.appendChild(overlay);

    var input = overlay.querySelector("#pw-input");
    var err = overlay.querySelector("#pw-err");
    var submit = overlay.querySelector("#pw-submit");
    var closeBtn = overlay.querySelector("#pw-close-btn");

    function setBusy(on) {
      busy = on;
      submit.disabled = on;
      input.disabled = on;
      submit.textContent = on ? "验证中…" : "解密并查看";
    }

    function attempt() {
      if (busy) return;
      var pwd = input.value;
      if (!pwd) {
        err.textContent = "请输入访问密码。";
        input.focus();
        return;
      }
      if (!hasWebCrypto()) {
        err.textContent = "当前浏览器不支持解密（需 HTTPS 环境的现代浏览器）。";
        return;
      }
      if (encLoadError) {
        err.textContent = "文档密文加载失败，请刷新页面重试。";
        return;
      }
      if (!encPack) {
        // 密文包尚未下载完，稍后自动重试
        err.textContent = "文档正在加载，请稍候…";
        setTimeout(function () {
          if (encPack || encLoadError) { err.textContent = ""; attempt(); }
        }, 400);
        return;
      }
      err.textContent = "";
      setBusy(true);
      unlockWithPassword(pwd).then(
        function (docs) {
          setBusy(false);
          revealDocs(docs);
        },
        function () {
          setBusy(false);
          err.textContent = "密码错误，无法解密文档。";
          input.value = "";
          input.focus();
        }
      );
    }

    submit.addEventListener("click", attempt);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") attempt();
    });
    closeBtn.addEventListener("click", dismissAndGoHome);
    overlay.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Esc") dismissAndGoHome();
    });
    setTimeout(function () {
      try { input.focus(); } catch (e) {}
    }, 60);
  }

  function init() {
    loadCipherPack();
    buildModal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
