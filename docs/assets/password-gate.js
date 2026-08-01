/*
 * HELPBUY 文档访问密码门禁（当前页内模态弹窗）
 * 作用：受保护的文档页（技术设计 / PRD / 源代码管理）在展示内容前，以「页面内弹窗」形式
 *       要求输入访问密码；校验通过（本标签内）才解锁，GitHub 链接等跳转仅在解锁后可点击。
 *       主页（index）与 DEMO 不挂载本脚本，免密访问。
 * 样式：半透明遮罩 + 背景模糊，卡片对齐站点配色（navy/teal/aqua），非整页遮挡的独立页面。
 * 行为：
 *  - 每次打开受保护文档都强制弹框（不记忆解锁态，满足「打开任何一个文档都必须输入密码」）。
 *  - 密码正确 → 移除弹窗并加载内嵌文档内容。
 *  - 密码错误 → 卡片内提示并清空输入、重新聚焦。
 * 注：密码写死于前端（内部 obscurity，非真安全）。
 */
(function (global) {
  "use strict";

  var PASSWORD = "HELPBUY2026@";

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
    loadEmbeddedDocs();
  }

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

  function buildModal() {
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
    setTimeout(function () {
      input.focus();
    }, 60);
  }

  function init() {
    // 始终弹框：每次打开受保护文档都要求输入密码
    buildModal();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
