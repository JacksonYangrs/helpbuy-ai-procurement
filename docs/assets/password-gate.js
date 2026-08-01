/*
 * HELPBUY 文档访问密码门禁（当前页内模态弹窗，不可关闭）
 * 作用：受保护的文档页（技术设计 / PRD / 源代码管理）在展示任何内容前，以「页面内弹窗」形式
 *       强制要求输入访问密码；校验通过才解锁并加载内嵌文档内容。
 *       主页（index）与 DEMO 不挂载本脚本，免密访问。
 * 加固（本版重点：弹窗不可关闭 / 不可绕过）：
 *  1) 页面内容由 CSS `body.pw-protected` 静态隐藏 —— 即使禁用 JS 也看不到正文（不依赖脚本生效）。
 *  2) MutationObserver + 定时巡检：弹窗或样式被删除（含 DevTools 手删节点）立即自动重建。
 *  3) 拦截 Esc、遮罩点击、焦点逃逸（Tab 焦点锁在卡片内），无任何关闭按钮与关闭路径。
 *  4) 未解锁前不加载 documents.js，正文内容根本不进入页面。
 * 注：密码写死于前端（内部 obscurity，非真安全）；documents.js 本体仍为明文，若需更强防护应做内容加密。
 */
(function (global) {
  "use strict";

  var PASSWORD = "HELPBUY2026@";
  var unlocked = false;
  var observer = null;
  var patrol = null;

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
    unlocked = true;
    stopGuard();
    try {
      var ov = document.getElementById("pw-gate");
      if (ov) ov.remove();
    } catch (e) {}
    try {
      document.body.classList.remove("pw-protected");
    } catch (e) {}
    loadEmbeddedDocs();
  }

  /* ── 样式（弹窗自身样式；正文隐藏样式在 site.css，静态生效） ─── */
  function injectStyle() {
    if (document.getElementById("pw-gate-style")) return;
    var css =
      "#pw-gate{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:24px;" +
      "background:rgba(9,38,59,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);" +
      "animation:pw-fade .18s ease both;}" +
      "@keyframes pw-fade{from{opacity:0}to{opacity:1}}" +
      "#pw-gate .pw-card{width:min(92vw,380px);padding:30px 28px;background:#fff;border:1px solid #d8e3e4;border-radius:14px;" +
      "box-shadow:0 24px 70px rgba(7,28,48,.45);animation:pw-pop .2s cubic-bezier(.2,.8,.3,1) both;}" +
      "@keyframes pw-pop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}" +
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
    if (unlocked || document.getElementById("pw-gate")) return;
    injectStyle();
    var overlay = document.createElement("div");
    overlay.id = "pw-gate";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "文档访问密码");
    overlay.innerHTML =
      '<div class="pw-card">' +
      '<div class="pw-brand">HELP<span>BUY</span></div>' +
      '<p class="pw-title">文档访问需要密码</p>' +
      '<p class="pw-sub">请输入访问密码以查看设计文档与源代码映射。密码由平台提供。</p>' +
      '<input id="pw-input" class="pw-input" type="password" placeholder="访问密码" autocomplete="off" spellcheck="false" />' +
      '<button id="pw-submit" class="pw-submit" type="button">确认</button>' +
      '<p id="pw-err" class="pw-err" role="alert"></p>' +
      '<p class="pw-hint">验证通过后可访问受保护文档</p>' +
      "</div>";
    document.body.appendChild(overlay);

    var card = overlay.querySelector(".pw-card");
    var input = overlay.querySelector("#pw-input");
    var err = overlay.querySelector("#pw-err");
    var submit = overlay.querySelector("#pw-submit");

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
    // 点击遮罩不关闭（吞掉冒泡，避免误触发页面其它逻辑）
    overlay.addEventListener("click", function (e) {
      if (!card.contains(e.target)) e.stopPropagation();
    });
    setTimeout(function () {
      try { input.focus(); } catch (e) {}
    }, 60);
  }

  /* ── 守卫：弹窗不可关闭、不可绕过 ───────────────────────── */
  function ensureLocked() {
    if (unlocked) return;
    try {
      if (document.body && !document.body.classList.contains("pw-protected")) {
        document.body.classList.add("pw-protected");
      }
    } catch (e) {}
    if (!document.getElementById("pw-gate-style")) injectStyle();
    if (!document.getElementById("pw-gate")) buildModal();
  }

  function onKeyDown(e) {
    if (unlocked) return;
    // Esc 不关闭
    if (e.key === "Escape" || e.key === "Esc") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Tab 焦点锁在弹窗内
    if (e.key === "Tab") {
      var gate = document.getElementById("pw-gate");
      if (!gate) return;
      var focusables = gate.querySelectorAll("input,button");
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      var active = document.activeElement;
      if (e.shiftKey && (active === first || !gate.contains(active))) {
        e.preventDefault();
        try { last.focus(); } catch (err) {}
      } else if (!e.shiftKey && (active === last || !gate.contains(active))) {
        e.preventDefault();
        try { first.focus(); } catch (err) {}
      }
    }
  }

  function onFocusIn(e) {
    if (unlocked) return;
    var gate = document.getElementById("pw-gate");
    if (!gate) return;
    if (!gate.contains(e.target)) {
      var input = gate.querySelector("#pw-input");
      if (input) { try { input.focus(); } catch (err) {} }
    }
  }

  function startGuard() {
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("focusin", onFocusIn, true);
    if (typeof MutationObserver === "function") {
      observer = new MutationObserver(ensureLocked);
      observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    }
    patrol = setInterval(ensureLocked, 700);
  }

  function stopGuard() {
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("focusin", onFocusIn, true);
    if (observer) { try { observer.disconnect(); } catch (e) {} observer = null; }
    if (patrol) { clearInterval(patrol); patrol = null; }
  }

  function init() {
    // 每次打开受保护文档都强制弹框，且无法关闭，只能输入正确密码
    ensureLocked();
    startGuard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
