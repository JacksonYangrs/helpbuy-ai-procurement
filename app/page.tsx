const stages = [
  {
    no: "01",
    title: "运营替身",
    eyebrow: "先验证单位经济",
    business: "验证 AI 是否减少人工分钟；3% 起的服务收入能否覆盖人工、AI、资金与履约成本。",
    product: "单人 AI 执行工作台 + 总经理经营看板。",
    people: "一名运营人员端到端执行；负责人按日看订单、资金和利润。",
  },
  {
    no: "02",
    title: "可复制运营",
    eyebrow: "再验证协作与定价",
    business: "形成客户等级、订单路径、复杂度、资金占用与回款风险对应的动态服务费。",
    product: "多人任务协同、供应商履约知识、异常队列与规则化提醒。",
    people: "多名运营共享任务池；财务/资金复核覆盖例外事项。",
  },
  {
    no: "03",
    title: "规模化业务",
    eyebrow: "最后复制盈利能力",
    business: "建立可预测的人效、利润、资金和客户扩张模型。",
    product: "规则引擎、经营预测、例外控制与内部系统集成。",
    people: "采购运营、客户服务、资金/财务、风控与 AI 运营逐步专业化。",
  },
];

const routes = [
  ["01", "仅代付", "已有供应商、价格与付款资料，核对依据后付款并归档。"],
  ["02", "电商下单", "已有商品链接或标准商品信息，完成下单、付款和物流跟踪。"],
  ["03", "直接采购", "供应商与价格已定，确认规格和交期后执行订单与履约。"],
  ["04", "询价代采", "规格明确但供应商或价格未定，完成询价、比价与后续执行。"],
];

const aiLayers = [
  ["文件与信息", "Excel 读取、PDF/图片 OCR、合同和聊天内容导入"],
  ["AI 结构化", "将非标准输入提取为商品、规格、数量、交期、价格与待确认项"],
  ["规则与路由", "用确定性规则判断路径、状态、金额阈值与例外"],
  ["执行与复盘", "生成待办、沟通草稿、日报和成本/人效复盘"],
];

export default function Home() {
  return (
    <main>
      <nav className="nav" aria-label="页面导航">
        <a className="brand" href="#top" aria-label="HELPBUY 首页">
          HELP<span>BUY</span>
        </a>
        <div className="nav-links">
          <a href="#model">商业模型</a>
          <a href="#stages">三阶段路径</a>
          <a href="#product">产品方案</a>
          <a href="#ai">AI 与成本</a>
        </div>
        <a className="nav-file" href="/document">
          阅读完整方案 <span aria-hidden="true">↗</span>
        </a>
      </nav>

      <section id="top" className="hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-inner">
          <p className="eyebrow light">AI PROCUREMENT EXECUTION PLATFORM · V2.0</p>
          <h1>
            让代采购执行
            <br />
            <em>从人力生意变成可复制的能力</em>
          </h1>
          <p className="hero-copy">
            HELPBUY 是代采团队内部使用的 AI 采购执行系统。
            不改变客户和供应商的工作习惯，将文件、合同、群聊与链接转为可执行任务，降低人工成本，提高订单处理效率与时间确定性。
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#model">查看商业逻辑 <span>↓</span></a>
            <a className="button secondary" href="#product">查看产品方案</a>
          </div>
          <div className="metrics" aria-label="核心要点">
            <div><strong>3%</strong><span>起始服务费假设</span></div>
            <div><strong>3</strong><span>阶段验证与扩张</span></div>
            <div><strong>4</strong><span>统一执行路径</span></div>
            <div><strong>2</strong><span>第一阶段核心模块</span></div>
          </div>
        </div>
        <div className="hero-flow" aria-hidden="true">
          <span className="flow-card input">文件<br />合同<br />群聊</span>
          <i />
          <span className="flow-card ai">AI<br />任务<br />草稿</span>
          <i />
          <span className="flow-card action">执行<br />跟单<br />结算</span>
        </div>
      </section>

      <section className="section intro">
        <div className="section-label">01 · THE THESIS</div>
        <div className="intro-copy">
          <h2>先验证每一单是否更有效率、更有利润，<br />再讨论规模化。</h2>
          <p>
            当前人工小批量业务已证明代采执行需求真实存在。下一步的关键不是增加更多人工，而是验证：AI 是否让一名运营稳定处理更多订单，并让服务收入覆盖执行、资金与风险成本。
          </p>
        </div>
      </section>

      <section id="model" className="section model-section">
        <div className="section-head">
          <div>
            <p className="section-label">02 · BUSINESS MODEL</p>
            <h2>服务费不是单一比例，<br />而是对资源与风险的定价。</h2>
          </div>
          <p className="aside-copy">3% 是人工验证阶段的常规订单基础执行费率假设，不是长期固定费率，也不等同于利润率。</p>
        </div>

        <div className="formula-card">
          <span className="formula-kicker">动态服务费</span>
          <p>
            max（最低服务费，订单 GMV × 基础执行费率）
            <b>+</b> 人工复杂度溢价 <b>+</b> 资金占用溢价 <b>+</b> 回款风险溢价 <b>+</b> 履约/售后风险溢价
            <b>−</b> 已达成条件的客户等级优惠
          </p>
        </div>

        <div className="premium-grid">
          <article>
            <span>01</span><h3>人工复杂度</h3>
            <p>非标规格、多轮询价、频繁变更、多明细、多供应商、紧急采购或复杂对账。</p>
          </article>
          <article>
            <span>02</span><h3>资金占用</h3>
            <p>垫资金额、占用天数、分批付款与支付次数，决定资金的可用性成本。</p>
          </article>
          <article>
            <span>03</span><h3>回款风险</h3>
            <p>账期、首次合作、回款表现与争议概率，决定预期坏账和催收成本。</p>
          </article>
          <article>
            <span>04</span><h3>履约与售后</h3>
            <p>交期压力、多批发货、易退换、质量责任和现场交付，决定风险准备金。</p>
          </article>
        </div>

        <div className="unit-economics">
          <div>
            <p className="section-label">UNIT ECONOMICS</p>
            <h3>订单多，不等于业务赚钱。</h3>
          </div>
          <p className="equation">
            贡献利润 = 服务收入 − 人工执行成本 − AI/系统变动成本 − 资金成本 − 预期回款风险 − 履约与售后成本
          </p>
          <p className="equation-note">只有贡献利润为正、回款可控、人工分钟/单持续下降，增长才有意义。</p>
        </div>
      </section>

      <section id="stages" className="section stages-section">
        <div className="section-head compact">
          <div>
            <p className="section-label">03 · THREE STAGES</p>
            <h2>产品、商业与岗位，<br />必须沿同一条路径升级。</h2>
          </div>
        </div>
        <div className="stages">
          {stages.map((stage) => (
            <article className="stage" key={stage.no}>
              <div className="stage-top"><span>{stage.no}</span><p>{stage.eyebrow}</p></div>
              <h3>{stage.title}</h3>
              <dl>
                <div><dt>商业</dt><dd>{stage.business}</dd></div>
                <div><dt>产品</dt><dd>{stage.product}</dd></div>
                <div><dt>岗位</dt><dd>{stage.people}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section id="product" className="product-section">
        <div className="section product-inner">
          <div className="section-head">
            <div>
              <p className="section-label light">04 · PRODUCT V1</p>
              <h2>第一阶段只有两个重点：<br />把订单执行好，把经营看清楚。</h2>
            </div>
            <p className="aside-copy light">不建设外部门户，不强制模板，不让正常小额订单被内部审批流卡住。</p>
          </div>
          <div className="product-modules">
            <article className="module-card execution">
              <div className="module-number">A</div>
              <p className="eyebrow light">AI EXECUTION WORKBENCH</p>
              <h3>AI 代采执行工作台</h3>
              <p>让一名运营在一个页面中看清每笔订单的来源、路径、下一步、截止时间、待确认项、资金状态和履约状态。</p>
              <ul>
                <li>接受文件、合同、群聊、图片、链接等非标准输入</li>
                <li>AI 自动生成任务草稿与待确认清单</li>
                <li>按任务推进询价、下单、付款、跟单、验收与结算</li>
                <li>保留全部外部证据与内部执行留痕</li>
              </ul>
            </article>
            <article className="module-card dashboard">
              <div className="module-number">B</div>
              <p className="eyebrow light">MANAGEMENT CONTROL TOWER</p>
              <h3>总经理经营看板</h3>
              <p>每天回答四个经营问题：订单是否增长、是否赚钱、资金是否安全、运营人效是否提升。</p>
              <ul>
                <li>订单、GMV、服务收入、客户数、供应商数</li>
                <li>人工、AI、资金、履约成本与贡献利润</li>
                <li>在途垫资、应收、到期应收与逾期风险</li>
                <li>按执行路径拆解处理时长、AI 成本与利润</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section routes-section">
        <div className="section-head compact">
          <div>
            <p className="section-label">05 · ONE TASK, MULTIPLE ROUTES</p>
            <h2>统一的任务状态，<br />而不是四套割裂流程。</h2>
          </div>
          <p className="aside-copy">“待任务确认”由运营人员完成，不等同于管理层审批。只有命中例外规则的订单，才需要负责人关注。</p>
        </div>
        <div className="route-flow" aria-label="统一状态流程">
          <span>AI 草稿 / 待补充</span><i>→</i><span>待任务确认</span><i>→</i><span>执行中</span><i>→</i><span>履约中</span><i>→</i><span>结算 / 完成</span>
        </div>
        <div className="routes">
          {routes.map(([no, title, copy]) => (
            <article key={no}>
              <span>{no}</span><h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="ai" className="section ai-section">
        <div className="ai-head">
          <div>
            <p className="section-label">06 · AI ARCHITECTURE & COST</p>
            <h2>模型应是可替换的执行能力，<br />不能变成吞噬利润的黑箱。</h2>
          </div>
          <p>第一阶段接入第三方模型 API，但不绑定单一供应商；不训练基础模型，不自建 GPU。HELPBUY 自己掌握任务、规则、数据、履约知识与成本账。</p>
        </div>
        <div className="ai-layout">
          <div className="ai-stack">
            {aiLayers.map(([title, copy], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
          <div className="cost-card">
            <p className="eyebrow">COST DISCIPLINE</p>
            <h3>每一笔 AI 调用，都要能回到一张订单。</h3>
            <p className="cost-formula">AI 全成本 = 文件/OCR + 模型 + 搜索/商品数据 + 云资源 + 质量评测与返工</p>
            <ul>
              <li>先程序，后模型；先低成本模型，后强模型。</li>
              <li>一次解析，长期复用；不重复发送完整文件与聊天记录。</li>
              <li>固定 JSON、限制输出、日报批量处理。</li>
              <li>按路径设单笔调用预算，周度复盘 AI 成本率与人工节省。</li>
            </ul>
            <strong>AI 的价值 = 每单少花的人工分钟 + 新增可承接订单 − AI 全成本</strong>
          </div>
        </div>
      </section>

      <section className="closing">
        <p className="eyebrow light">THE DECISION RULE</p>
        <h2>先跑真实订单，<br />再决定要不要扩大投入。</h2>
        <p>
          用真实订单验证非标准输入解析、人工分钟/单、AI 全成本、动态服务费、资金占用与贡献利润。
          当这些数据证明业务可以盈利且可复制，HELPBUY 才进入规模化推广。
        </p>
        <a className="button primary inverted" href="/document">阅读完整方案 <span>↗</span></a>
      </section>

      <footer>
        <a className="brand" href="#top">HELP<span>BUY</span></a>
        <p>AI 代采购商业计划与产品需求文档 · V2.0</p>
        <p>公开阅读版 · 2026-07-29</p>
      </footer>
    </main>
  );
}
