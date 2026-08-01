/*
 * HELPBUY 文档访问密码门禁（页面内模态弹窗）
 * 作用：受保护的文档页（技术设计 / PRD / 源代码管理）在展示内容前要求输入访问密码。
 *       主页（index）与 DEMO 不挂载本脚本，免密访问。
 * 行为：
 *  - 每次打开受保护文档都强制弹框。
 *  - 密码正确 → 解锁并加载内嵌文档内容。
 *  - 密码错误 → 显示提示，可继续重试。
 *  - 点关闭按钮 / 按 Esc → 关闭弹窗，返回首页（正文保持隐藏，不可绕过）。
 * 防护：
 *  - CSS 静态隐藏正文（body.pw-protected），禁用 JS 也看不到内容。
 *  - 未解锁前不加载 documents.js。
 * 注：密码写死于前端（内部 obscurity，非真安全）。
 */
(function (global) {
  "use strict";

  var PASSWORD = "HELPBUY2026@";
  var HOME_URL = "../"; // 关闭弹窗时跳转目标

  /* ── 内容加载（仅解锁后执行） ───────────────────────────── */
  function loadEmbeddedDocs() {
    if (!global.__HELPBUY_EMBED) return;
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
      if (typeof global.__HELPBUY_BOOT === "function") global.__HELPBUY_BOOT();
    };
    s.onerror = function () {
      if (typeof global.__HELPBUY_BOOT === "function") global.__HELPBUY_BOOT();
    };
    document.head.appendChild(s);
  }

  function unlockAndReveal() {
    try {
      var ov = document.getElementById("pw-gate");
      if (ov) ov.remove();
    } catch (e) {}
    try {
      document.body.classList.remove("pw-protected");
    } catch (e) {}
    loadEmbeddedDocs();
  }

  function dismissAndGoHome() {
    try {
      var ov = document.getElementById("pw-gate");
      if (ov) ov.remove();
    } catch (e) {}
    // 保持 pw-protected 不移除 —— 正文仍然隐藏
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
      "#pw-gate .pw-submit{width:100%;margin-top:12px;padding:11px;color:#fff;font:inherit;font-size:13px;font-weight:750;" +
      "border:0;border-radius:8px;cursor:pointer;background:#0e9e97;transition:background .15s,transform .12s;}" +
      "#pw-gate .pw-submit:hover{background:#0b8a84;}" +
      "#pw-gate .pw-submit:active{transform:translateY(1px);}" +
      "#pw-gate .pw-err{margin:10px 0 0;min-height:16px;color:#c0392b;font-size:12px;line-height:1.5;}" +
      "#pw-gate .pw-hint{margin:14px 0 0;color:#9badb7;font-size:11px;text-align:center;}";
    var style = document.createElement("style");
    style.id = "pw-gate-style";
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ── 弹窗构建 ───────────────────────────────────────────── */
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
      '<p class="pw-sub">请输入访问密码以查看设计文档与源代码映射。密码由平台提供。</p>' +
      '<input id="pw-input" class="pw-input" type="password" placeholder="访问密码" autocomplete="off" spellcheck="false" />' +
      '<button id="pw-submit" class="pw-submit" type="button">确认</button>' +
      '<p id="pw-err" class="pw-err" role="alert"></p>' +
      '<p class="pw-hint">验证通过后可访问受保护文档</p>' +
      "</div>";
    document.body.appendChild(overlay);

    var input = overlay.querySelector("#pw-input");
    var err = overlay.querySelector("#pw-err");
    var submit = overlay.querySelector("#pw-submit");
    var closeBtn = overlay.querySelector("#pw-close-btn");

    function attempt() {
      if (input.value === PASSWORD) {
        unlockAndReveal();
      } else {
        err.textContent = "密码错误，请重试。";
        input.value = "";
        input.focus();
      }
    }

    submit.addEventListener("click", attempt);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") attempt();
    });
    // 关闭按钮 → 返回首页
    closeBtn.addEventListener("click", dismissAndGoHome);
    // Esc → 返回首页
    overlay.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.key === "Esc") {
        dismissAndGoHome();
      }
    });
    setTimeout(function () {
      try { input.focus(); } catch (e) {}
    }, 60);
  }

  function init() {
    buildModal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
