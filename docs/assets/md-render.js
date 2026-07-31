/*
 * HELPBUY 文档阅读器 · Markdown 渲染
 * 目标：Markdown 表格渲染成真表格；ASCII 框线图等宽保真、横向滚动不折行；
 *      ```mermaid 代码块渲染成矢量图（mermaid 按需懒加载，无图的文档不加载 3MB 库）。
 * 依赖：assets/vendor/marked.min.js（同步引入）、assets/vendor/mermaid.min.js（按需引入）
 */
(function (global) {
  "use strict";

  var MERMAID_SRC = "vendor/mermaid.min.js";

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* 标题生成锚点 id，便于目录跳转与外部深链 */
  function slugify(text) {
    return String(text)
      .toLowerCase()
      .replace(/<[^>]+>/g, "")
      .replace(/[^\u4e00-\u9fa5a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  }

  function buildRenderer() {
    var renderer = new global.marked.Renderer();
    var usedSlugs = Object.create(null);

    /* 代码块：mermaid → 矢量图容器；其余 → 等宽保真代码块（含 ASCII 架构图） */
    renderer.code = function (code, infostring) {
      var lang = (infostring || "").trim().split(/\s+/)[0].toLowerCase();
      if (lang === "mermaid") {
        return '<div class="md-figure"><div class="mermaid">' + escapeHtml(code) + "</div></div>";
      }
      var isDiagram = /[\u2500-\u257f\u2190-\u21ff]/.test(code);
      return (
        '<div class="md-pre' + (isDiagram ? " is-diagram" : "") + '">' +
        (lang ? '<span class="md-pre-tag">' + escapeHtml(lang) + "</span>" : "") +
        "<pre><code>" + escapeHtml(code) + "</code></pre></div>"
      );
    };

    /* 表格：套壳一层横向滚动容器，宽表在窄屏不撑破版心 */
    renderer.table = function (header, body) {
      return (
        '<div class="md-table-scroll"><table class="md-table"><thead>' +
        header + "</thead><tbody>" + body + "</tbody></table></div>"
      );
    };

    renderer.heading = function (text, level) {
      var base = slugify(text);
      usedSlugs[base] = (usedSlugs[base] || 0) + 1;
      var id = usedSlugs[base] > 1 ? base + "-" + usedSlugs[base] : base;
      return (
        "<h" + level + ' id="' + id + '" class="md-h md-h' + level + '">' +
        '<a class="md-anchor" href="#' + id + '" aria-label="锚点">#</a>' +
        text + "</h" + level + ">"
      );
    };

    return renderer;
  }

  function loadMermaid(baseHref) {
    return new Promise(function (resolve, reject) {
      if (global.mermaid) return resolve(global.mermaid);
      var script = document.createElement("script");
      script.src = baseHref + MERMAID_SRC;
      script.onload = function () { resolve(global.mermaid); };
      script.onerror = function () { reject(new Error("mermaid 加载失败")); };
      document.head.appendChild(script);
    });
  }

  function runMermaid(container, baseHref) {
    var nodes = container.querySelectorAll(".mermaid");
    if (!nodes.length) return Promise.resolve();
    return loadMermaid(baseHref)
      .then(function (mermaid) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          fontFamily: '"PingFang SC","Microsoft YaHei","Noto Sans SC",Arial,sans-serif',
          themeVariables: {
            primaryColor: "#e8f2f2",
            primaryTextColor: "#09263b",
            primaryBorderColor: "#08817d",
            lineColor: "#4b6b7c",
            secondaryColor: "#f6f8f7",
            tertiaryColor: "#ffffff",
            fontSize: "14px"
          },
          flowchart: { curve: "basis", htmlLabels: true, useMaxWidth: true },
          sequence: { useMaxWidth: true }
        });
        return mermaid.run({ nodes: nodes });
      })
      .catch(function () {
        /* 渲染失败不影响正文：退回等宽源码展示，保证信息不丢 */
        Array.prototype.forEach.call(nodes, function (node) {
          var pre = document.createElement("div");
          pre.className = "md-pre is-diagram";
          pre.innerHTML = "<pre><code>" + escapeHtml(node.textContent) + "</code></pre>";
          node.parentNode.replaceChild(pre, node);
        });
      });
  }

  /*
   * render(options)
   *   file       {string} Markdown 文件地址
   *   target     {Element} 渲染容器
   *   baseHref   {string} 资源相对前缀（用于懒加载 mermaid），如 "../assets/"
   *   onError    {string} 加载失败时的提示文案
   */
  function render(options) {
    var target = options.target;
    var baseHref = options.baseHref || "assets/";

    return fetch(options.file)
      .then(function (response) {
        if (!response.ok) throw new Error("无法读取文档");
        return response.arrayBuffer();
      })
      .then(function (buffer) {
        var text = new TextDecoder("utf-8").decode(buffer).replace(/^\uFEFF/, "");
        global.marked.setOptions({
          renderer: buildRenderer(),
          gfm: true,
          breaks: false,
          headerIds: false,
          mangle: false
        });
        target.innerHTML = global.marked.parse(text);
        target.classList.add("is-rendered");
        return runMermaid(target, baseHref);
      })
      .catch(function () {
        target.innerHTML =
          '<p class="md-error">' +
          (options.onError || "文档暂时无法加载。请使用右上角下载按钮获取原文。") +
          "</p>";
      });
  }

  global.HELPBUY_MD = { render: render };
})(window);
