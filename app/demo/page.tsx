"use client";

import { useMemo, useState } from "react";

type OrderStatus = "待任务确认" | "待付款" | "执行中" | "履约中" | "已完成";

type Order = {
  id: string;
  customer: string;
  route: string;
  source: string;
  product: string;
  specs: string;
  quantity: string;
  delivery: string;
  amount: number;
  fee: number;
  aiCost: number;
  manualCost: number;
  capitalCost: number;
  status: OrderStatus;
  risk: "低" | "中" | "需关注";
  request: string;
  question: string;
};

type IntakeSource = "采购邮箱" | "飞书采购群" | "微信导入" | "文件 / 图片";

type IntakeCandidate = Order & {
  confidence: number;
  scanScope: string;
  summary: string;
};

const seedOrders: Order[] = [
  {
    id: "HB-260729-008",
    customer: "云合空间（成都）",
    route: "询价代采",
    source: "Excel 采购清单",
    product: "中心排风扇",
    specs: "400mm 工业级；220V；含安装辅材",
    quantity: "12 台",
    delivery: "8 月 5 日前送达",
    amount: 18600,
    fee: 930,
    aiCost: 11,
    manualCost: 175,
    capitalCost: 86,
    status: "待任务确认",
    risk: "中",
    request: "成都中心行政发来采购清单：中心排风扇 12 台，要求送货上门并在下周完成安装。",
    question: "需确认风量和是否含安装服务，AI 已标记为待确认项。",
  },
  {
    id: "HB-260729-007",
    customer: "澄光品牌工作室",
    route: "仅代付",
    source: "群聊付款指令",
    product: "秋冬拍摄制作服务",
    specs: "供应商、价格和付款资料已确认",
    quantity: "1 项",
    delivery: "按合同节点交付",
    amount: 40000,
    fee: 1200,
    aiCost: 3,
    manualCost: 35,
    capitalCost: 170,
    status: "待付款",
    risk: "低",
    request: "群聊确认供应商和制作费用，需代为完成付款，并在付款后保留付款凭证。",
    question: "收款主体与订单依据已匹配，等待运营人员模拟付款。",
  },
  {
    id: "HB-260729-006",
    customer: "新川企业服务中心",
    route: "电商下单",
    source: "商品链接 + 聊天记录",
    product: "会议室白板与移动支架",
    specs: "1200×900mm；双面磁性；带锁止脚轮",
    quantity: "6 套",
    delivery: "48 小时内送货",
    amount: 5280,
    fee: 264,
    aiCost: 4,
    manualCost: 48,
    capitalCost: 22,
    status: "执行中",
    risk: "低",
    request: "客户在飞书群发来商品链接和收货信息，要求当天完成下单并同步物流。",
    question: "价格、规格与送货地址已确认，等待模拟下单完成。",
  },
  {
    id: "HB-260728-022",
    customer: "宏远科技园",
    route: "直接采购",
    source: "采购合同附件",
    product: "办公区窗帘改造",
    specs: "遮光布；阻燃等级 B1；含测量与安装",
    quantity: "860 ㎡",
    delivery: "分两批，首批 8 月 3 日",
    amount: 68200,
    fee: 2728,
    aiCost: 16,
    manualCost: 320,
    capitalCost: 410,
    status: "履约中",
    risk: "需关注",
    request: "合同中已明确供应商和单价，需按首批交期跟进测量、排产、送货和验收。",
    question: "首批物流尚未回传，AI 已安排今天 16:00 前自动提醒运营跟进。",
  },
  {
    id: "HB-260728-019",
    customer: "十方设计事务所",
    route: "电商下单",
    source: "采购清单图片",
    product: "茶水间耗材",
    specs: "纸杯、咖啡豆、清洁用品，已指定品牌",
    quantity: "18 个 SKU",
    delivery: "已签收",
    amount: 3260,
    fee: 163,
    aiCost: 6,
    manualCost: 50,
    capitalCost: 12,
    status: "已完成",
    risk: "低",
    request: "图片清单包含 18 个商品，指定品牌和数量，要求统一开票并送至前台。",
    question: "验收与结算资料已归档，可进入日报复盘。",
  },
];

const statuses: OrderStatus[] = ["待任务确认", "待付款", "执行中", "履约中", "已完成"];

const routeTone: Record<string, string> = {
  "仅代付": "payment",
  "电商下单": "commerce",
  "直接采购": "direct",
  "询价代采": "sourcing",
};

const intakeTemplates: Record<IntakeSource, Omit<IntakeCandidate, "id">> = {
  "采购邮箱": {
    customer: "启明联合办公",
    route: "询价代采",
    source: "采购邮箱 · 未读邮件 + Excel 附件",
    product: "办公室空气净化器",
    specs: "适用 60–80㎡；HEPA H13；含上门安装",
    quantity: "8 台",
    delivery: "本周五前送达",
    amount: 12400,
    fee: 620,
    aiCost: 9,
    manualCost: 110,
    capitalCost: 48,
    status: "待任务确认",
    risk: "中",
    request: "专用采购邮箱收到行政邮件及 Excel 附件：需要为新办公区采购 8 台空气净化器，预算不超过 1.3 万元。",
    question: "附件未说明 CADR 指标，AI 已标记为待确认项。",
    confidence: 96,
    scanScope: "仅扫描专用采购邮箱中新增的邮件线程与附件",
    summary: "识别到采购意图、预算、数量和交期；建议进入询价代采路径。",
  },
  "飞书采购群": {
    customer: "众创商业中心",
    route: "电商下单",
    source: "飞书采购群 · @HELPBUY 机器人消息",
    product: "前台接待区绿植与花盆",
    specs: "指定商品链接；含配送与摆放",
    quantity: "14 盆",
    delivery: "明天 18:00 前",
    amount: 2680,
    fee: 134,
    aiCost: 4,
    manualCost: 36,
    capitalCost: 10,
    status: "待任务确认",
    risk: "低",
    request: "飞书采购群中 @HELPBUY：请按链接采购 14 盆绿植，明天下班前送至前台并摆放。",
    question: "收货人电话未在消息中给出，AI 已创建待补充项。",
    confidence: 98,
    scanScope: "仅采集已授权群内 @HELPBUY 的消息、附件与引用上下文",
    summary: "商品链接、数量和交期已识别；建议进入电商下单路径。",
  },
  "微信导入": {
    customer: "汇景品牌工作室",
    route: "仅代付",
    source: "微信导入 · 转发聊天记录 + 付款截图",
    product: "线下活动场地制作服务",
    specs: "供应商、金额与付款依据已在导入内容中确认",
    quantity: "1 项",
    delivery: "按活动节点交付",
    amount: 18000,
    fee: 540,
    aiCost: 5,
    manualCost: 42,
    capitalCost: 72,
    status: "待任务确认",
    risk: "中",
    request: "运营人员导入客户转发的微信聊天记录和付款截图：供应商与金额已谈妥，需要代为付款。",
    question: "付款截图中的合同编号需与附件再次核验。",
    confidence: 91,
    scanScope: "仅处理运营人员主动导入或客户转发的微信内容，不读取私人聊天",
    summary: "已匹配供应商、金额和付款依据；建议进入仅代付路径。",
  },
  "文件 / 图片": {
    customer: "瑞达科技园",
    route: "直接采购",
    source: "文件上传 · 合同 PDF + 采购清单图片",
    product: "门禁系统配件",
    specs: "读卡器、控制器、电源模块；含安装调试",
    quantity: "22 个 SKU",
    delivery: "分两批，首批 7 天内",
    amount: 33600,
    fee: 1344,
    aiCost: 13,
    manualCost: 180,
    capitalCost: 145,
    status: "待任务确认",
    risk: "中",
    request: "上传的合同 PDF 和采购清单图片显示：供应商及单价已确定，需按两批交期执行并跟进安装。",
    question: "AI 发现 2 个 SKU 的图片文字置信度偏低，需要人工核对型号。",
    confidence: 89,
    scanScope: "仅解析本次主动上传的文件和图片，并保留原始证据",
    summary: "已匹配合同供应商和清单金额；建议进入直接采购路径。",
  },
};

const money = (amount: number) =>
  new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CNY", maximumFractionDigits: 0 }).format(amount);

export default function DemoPage() {
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [selectedId, setSelectedId] = useState(seedOrders[0].id);
  const [filter, setFilter] = useState<"全部" | OrderStatus>("全部");
  const [isParsing, setIsParsing] = useState(false);
  const [intakeSource, setIntakeSource] = useState<IntakeSource>("采购邮箱");
  const [isScanning, setIsScanning] = useState(false);
  const [intakeRun, setIntakeRun] = useState(0);
  const [candidate, setCandidate] = useState<IntakeCandidate | null>(null);
  const [notice, setNotice] = useState("演示模式：所有数据和操作均为虚构，不会触发真实采购或付款。");

  const selected = orders.find((order) => order.id === selectedId) ?? orders[0];
  const visibleOrders = filter === "全部" ? orders : orders.filter((order) => order.status === filter);
  const metrics = useMemo(() => {
    const total = orders.reduce((sum, order) => sum + order.amount, 0);
    const revenue = orders.reduce((sum, order) => sum + order.fee, 0);
    const cost = orders.reduce((sum, order) => sum + order.aiCost + order.manualCost + order.capitalCost, 0);
    const advances = orders.filter((order) => order.status !== "已完成").reduce((sum, order) => sum + order.amount, 0);
    return { total, revenue, profit: revenue - cost, advances };
  }, [orders]);

  const progress = statuses.indexOf(selected.status);
  const nextStatus = statuses[progress + 1];
  const nextAction =
    selected.status === "待任务确认" ? "确认任务并进入执行" :
    selected.status === "待付款" ? "模拟付款" :
    selected.status === "执行中" ? "模拟下单完成" :
    selected.status === "履约中" ? "模拟验收完成" : "订单已完成";

  function runAi() {
    setIsParsing(true);
    setNotice("AI 正在从非标准需求中提取商品、规格、数量、交期与待确认项…");
    window.setTimeout(() => {
      setIsParsing(false);
      setNotice(`${selected.id} 的任务草稿已生成，建议执行路径：${selected.route}。`);
    }, 850);
  }

  function moveOrder() {
    if (!nextStatus) {
      setNotice("该订单已完成。可以在经营看板中查看其模拟利润与人效数据。");
      return;
    }
    setOrders((current) => current.map((order) => order.id === selected.id ? { ...order, status: nextStatus } : order));
    setNotice(`${selected.id} 已模拟推进至“${nextStatus}”。此操作仅改变本页假数据。`);
  }

  function scanIntake() {
    setIsScanning(true);
    setCandidate(null);
    setNotice(`AI 正在按授权范围扫描${intakeSource}中的新增采购需求…`);
    window.setTimeout(() => {
      const template = intakeTemplates[intakeSource];
      const nextRun = intakeRun + 1;
      setIntakeRun(nextRun);
      setCandidate({ ...template, id: `HB-260729-${String(900 + nextRun).padStart(3, "0")}` });
      setIsScanning(false);
      setNotice(`AI 已识别 1 条${intakeSource}候选需求，等待确认后才会进入任务池。`);
    }, 900);
  }

  function addCandidateToQueue() {
    if (!candidate) return;
    setOrders((current) => [candidate, ...current]);
    setSelectedId(candidate.id);
    setFilter("全部");
    setCandidate(null);
    setNotice(`${candidate.id} 已由 AI 草稿进入任务池，运营人员可继续确认和执行。`);
  }

  function resetDemo() {
    setOrders(seedOrders);
    setSelectedId(seedOrders[0].id);
    setFilter("全部");
    setCandidate(null);
    setIsScanning(false);
    setIntakeRun(0);
    setNotice("演示已重置为初始假数据。");
  }

  return (
    <main className="demo-shell">
      <header className="demo-topbar">
        <a className="demo-brand" href="/">HELP<span>BUY</span><small>DEMO</small></a>
        <div className="demo-mode"><i /> 演示数据模式 · 不连接真实供应商、支付或客户资料</div>
        <div className="demo-top-actions"><a href="/">查看方案</a><button onClick={resetDemo}>重置演示</button></div>
      </header>

      <section className="demo-overview">
        <div>
          <p className="demo-eyebrow">AI PROCUREMENT EXECUTION · OPERATIONS SIMULATOR</p>
          <h1>一名运营，如何在同一屏推进多类代采任务</h1>
          <p>从采购邮箱、飞书群、微信导入、文件与合同中提取需求，按任务路径推进确认、付款、下单、履约与结算。</p>
        </div>
        <div className="demo-kpis" aria-label="经营看板假数据">
          <article><span>今日订单</span><strong>{orders.length}</strong><small>含 {orders.filter((order) => order.status !== "已完成").length} 笔在途</small></article>
          <article><span>模拟 GMV</span><strong>{money(metrics.total)}</strong><small>五笔示例订单</small></article>
          <article><span>服务收入</span><strong>{money(metrics.revenue)}</strong><small>按假设费率计算</small></article>
          <article><span>贡献利润</span><strong className={metrics.profit > 0 ? "positive" : "negative"}>{money(metrics.profit)}</strong><small>已扣 AI、人工与资金成本</small></article>
        </div>
      </section>

      <section className="intake-center" aria-label="AI 需求采集中心">
        <div className="intake-head">
          <div>
            <p className="demo-eyebrow">AI INTAKE CENTER</p>
            <h2>从外部输入中识别采购需求</h2>
            <p>只扫描已授权入口；微信内容仅支持主动导入或转发，不读取私人聊天。</p>
          </div>
          <div className="intake-status"><span>扫描范围</span><b>{intakeTemplates[intakeSource].scanScope}</b></div>
        </div>
        <div className="intake-controls">
          <div className="intake-sources" aria-label="需求来源选择">
            {(Object.keys(intakeTemplates) as IntakeSource[]).map((source) => (
              <button className={intakeSource === source ? "active" : ""} key={source} onClick={() => { setIntakeSource(source); setCandidate(null); }} disabled={isScanning}>{source}</button>
            ))}
          </div>
          <button className="scan-action" onClick={scanIntake} disabled={isScanning}>{isScanning ? "AI 扫描中…" : `扫描${intakeSource}（模拟）`} <span>→</span></button>
        </div>
        {candidate ? (
          <article className="candidate-card">
            <div className="candidate-title"><p>AI 发现候选需求</p><h3>{candidate.product}</h3><span>{candidate.source}</span></div>
            <div className="candidate-summary"><span>识别结果</span><p>{candidate.summary}</p><dl><div><dt>识别置信度</dt><dd>{candidate.confidence}%</dd></div><div><dt>推荐路径</dt><dd>{candidate.route}</dd></div><div><dt>预估金额</dt><dd>{money(candidate.amount)}</dd></div></dl></div>
            <button className="admit-action" onClick={addCandidateToQueue}>生成任务草稿并加入任务池 <span>→</span></button>
          </article>
        ) : <p className="intake-empty">选择一个已授权输入入口，点击扫描后查看 AI 候选任务。</p>}
      </section>

      <div className="demo-layout">
        <aside className="demo-queue" aria-label="代采任务清单">
          <div className="queue-head"><div><p className="demo-eyebrow">任务池</p><h2>今日执行清单</h2></div><span>{visibleOrders.length} 笔</span></div>
          <div className="filter-row" aria-label="任务状态筛选">
            {(["全部", ...statuses] as const).map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
          <div className="order-list">
            {visibleOrders.map((order) => (
              <button className={`order-card ${selected.id === order.id ? "selected" : ""}`} key={order.id} onClick={() => setSelectedId(order.id)}>
                <div><span className={`route-badge ${routeTone[order.route]}`}>{order.route}</span><time>{order.id.slice(-3)}</time></div>
                <strong>{order.product}</strong>
                <p>{order.customer}</p>
                <footer><span className={`risk ${order.risk === "低" ? "low" : order.risk === "中" ? "medium" : "watch"}`}>{order.risk}</span><b>{money(order.amount)}</b></footer>
              </button>
            ))}
          </div>
        </aside>

        <section className="demo-workbench" aria-label="AI 代采执行工作台">
          <div className="workbench-head">
            <div><p className="demo-eyebrow">AI EXECUTION WORKBENCH</p><h2>{selected.product}</h2><p>{selected.id} · {selected.customer} · {selected.source}</p></div>
            <span className={`status-pill s-${progress}`}>{selected.status}</span>
          </div>

          <div className="timeline" aria-label="订单状态流程">
            {statuses.map((status, index) => <div className={index <= progress ? "done" : ""} key={status}><i>{index < progress ? "✓" : index + 1}</i><span>{status}</span></div>)}
          </div>

          <div className="notice" role="status"><span>{isParsing ? "AI" : "提示"}</span>{notice}</div>

          <div className="workbench-grid">
            <article className="task-card source-card">
              <div className="card-title"><span>01</span><h3>原始需求</h3><button className={isParsing ? "busy" : ""} onClick={runAi} disabled={isParsing}>{isParsing ? "AI 解析中…" : "模拟 AI 解析"}</button></div>
              <p className="request-quote">“{selected.request}”</p>
              <div className="source-meta"><span>输入来源</span><b>{selected.source}</b><span>推荐路径</span><b>{selected.route}</b></div>
            </article>

            <article className="task-card structured-card">
              <div className="card-title"><span>02</span><h3>AI 结构化任务草稿</h3><em>需人工确认</em></div>
              <dl>
                <div><dt>商品 / 服务</dt><dd>{selected.product}</dd></div>
                <div><dt>规格</dt><dd>{selected.specs}</dd></div>
                <div><dt>数量</dt><dd>{selected.quantity}</dd></div>
                <div><dt>交期</dt><dd>{selected.delivery}</dd></div>
                <div><dt>采购金额</dt><dd>{money(selected.amount)}</dd></div>
              </dl>
              <p className="question"><b>待确认：</b>{selected.question}</p>
            </article>

            <article className="task-card action-card">
              <div className="card-title"><span>03</span><h3>下一步执行</h3></div>
              <p>AI 根据订单路径和当前状态生成操作建议；运营只需核对关键规格和付款依据。</p>
              <div className="action-summary"><span>当前路径</span><b>{selected.route}</b><span>服务费</span><b>{money(selected.fee)}</b></div>
              <button className="main-action" onClick={moveOrder}>{nextAction} <span>→</span></button>
              <small>仅模拟状态变更，不会发送款项或创建真实订单。</small>
            </article>
          </div>
        </section>

        <aside className="demo-control" aria-label="经营控制塔">
          <p className="demo-eyebrow">MANAGEMENT CONTROL TOWER</p>
          <h2>经营控制塔</h2>
          <article className="control-finance"><span>在途垫资</span><strong>{money(metrics.advances)}</strong><p>当前有 {orders.filter((order) => order.status === "待付款").length} 笔待付款；{orders.filter((order) => order.risk === "需关注").length} 笔需重点跟进履约。</p></article>
          <article className="control-routes"><h3>路径分布</h3>{Object.keys(routeTone).map((route) => <div key={route}><span>{route}</span><i><b style={{ width: `${Math.max(15, orders.filter((order) => order.route === route).length / orders.length * 100)}%` }} /></i><em>{orders.filter((order) => order.route === route).length}</em></div>)}</article>
          <article className="daily-report"><p>AI 日报摘要</p><strong>今日建议优先处理</strong><ul><li>确认“中心排风扇”的规格待确认项</li><li>完成 1 笔仅代付的付款依据复核</li><li>跟进窗帘改造的首批物流回传</li></ul></article>
          <div className="control-foot"><span>AI 单均成本</span><b>{money(orders.reduce((sum, order) => sum + order.aiCost, 0) / orders.length)}</b><span>模拟人效</span><b>{(orders.length / 1).toFixed(1)} 单 / 人 / 日</b></div>
        </aside>
      </div>
    </main>
  );
}
