/*
 * HELPBUY 文档访问密码门禁
 * 作用：网站所有文档页在展示内容前需输入访问密码；校验通过（本标签内）才解锁，
 *       GitHub 链接等文档内跳转仅在解锁后可点击。密码写死于前端（内部 obscurity，非真安全）。
 * 行为：
 *  - 密码正确 → sessionStorage 置位，移除遮罩，本标签内跳转其他文档页不再重复提示。
 *  - 密码错误 → 提示并清空输入。
 *  - 新标签 / 无 sessionStorage → 重新提示。
 */
(function (global) {
  "use strict";

  var PASSWORD = "HELPBUY2026@";
  var STORAGE_KEY = "helpbuy_doc_unlocked";

  function isUnlocked() {
    try {
      return global.sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function unlock() {
    try {
      global.sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
  }

  function buildOverlay() {
    var overlay = document.createElement("div");
    overlay.id = "pw-gate";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "文档访问密码");
    overlay.innerHTML =
      '<div class="pw-box">' +
      '<div class="pw-brand">HELP<span>BUY</span></div>' +
      '<p class="pw-title">文档访问需要密码</p>' +
      '<p class="pw-sub">请输入访问密码以查看设计文档与源代码映射</p>' +
      '<input id="pw-input" class="pw-input" type="password" placeholder="访问密码" autocomplete="off" spellcheck="false" />' +
      '<button id="pw-submit" class="pw-submit" type="button">确认</button>' +
      '<p id="pw-err" class="pw-err" role="alert"></p>' +
      "</div>";

    overlay.style.cssText =
      "position:fixed;inset:0;z-index:2147483647;background:rgba(8,38,59,.97);" +
      "display:flex;align-items:center;justify-content:center;padding:24px;";

    // 遮罩未解锁前禁止页面滚动与交互
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.appendChild(overlay);

    var input = overlay.querySelector("#pw-input");
    var err = overlay.querySelector("#pw-err");
    var submit = overlay.querySelector("#pw-submit");

    function attempt() {
      if (input.value === PASSWORD) {
        unlock();
        overlay.remove();
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
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
    input.focus();
  }

  function init() {
    if (isUnlocked()) return;
    buildOverlay();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(window);
