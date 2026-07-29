"use client";

import { useEffect, useState } from "react";

const source = "/HELPBUY_产品与技术设计文档_V1.md";

export default function DesignDocumentPage() {
  const [content, setContent] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(source)
      .then((response) => {
        if (!response.ok) throw new Error("无法读取文档");
        return response.arrayBuffer();
      })
      .then((buffer) => setContent(new TextDecoder("utf-8").decode(buffer).replace(/^\uFEFF/, "")))
      .catch(() => setError(true));
  }, []);

  return (
    <main className="document-reader">
      <header className="document-header">
        <a className="document-brand" href="/">HELP<span>BUY</span></a>
        <div className="document-actions">
          <a href="/">返回概览</a>
          <a href="/document">商业计划与 PRD</a>
          <a className="document-download" href={source} download>下载 Markdown</a>
        </div>
      </header>
      <article className="document-content">
        <p className="document-kicker">PRODUCT & TECHNICAL DESIGN · V1.0</p>
        <h1>HELPBUY：产品与技术设计文档</h1>
        <p className="document-lead">模块划分、数据模型、执行通道、AI 技术路线、付款安全、研发阶段与技术难点分析。</p>
        {error ? (
          <p className="document-error">文档暂时无法加载，请使用右上角“下载 Markdown”。</p>
        ) : content ? (
          <pre>{content}</pre>
        ) : (
          <p className="document-loading">正在加载设计文档…</p>
        )}
      </article>
    </main>
  );
}
