"use client";

import { useEffect, useState } from "react";

const source = "/HELPBUY_PRD_V2_商业计划与产品方案.md";

export default function DocumentPage() {
  const [content, setContent] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(source)
      .then((response) => {
        if (!response.ok) throw new Error("无法读取文档");
        return response.arrayBuffer();
      })
      .then((buffer) => setContent(new TextDecoder("utf-8").decode(buffer)))
      .catch(() => setError(true));
  }, []);

  return (
    <main className="document-reader">
      <header className="document-header">
        <a className="document-brand" href="/">HELP<span>BUY</span></a>
        <div className="document-actions">
          <a href="/">返回概览</a>
          <a className="document-download" href={source} download>
            下载 Markdown
          </a>
        </div>
      </header>
      <article className="document-content">
        <p className="document-kicker">FULL DOCUMENT · V2.0</p>
        {error ? (
          <p className="document-error">文档暂时无法加载，请使用右上角“下载 Markdown”。</p>
        ) : content ? (
          <pre>{content}</pre>
        ) : (
          <p className="document-loading">正在加载完整文档…</p>
        )}
      </article>
    </main>
  );
}
