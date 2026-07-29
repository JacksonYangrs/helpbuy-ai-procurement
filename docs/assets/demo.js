const statuses = ["AI 待确认", "已确认待执行", "待付款", "执行中", "履约中", "已完成"];
const routes = ["仅代付", "电商下单", "直接采购", "询价代采"];
const intakeOptions = [
  { key:"mail", label:"采购邮箱", customer:"启明联合办公", route:"询价代采", source:"采购邮箱 · 未读邮件 + Excel 附件", product:"办公室空气净化器", specs:"适用 60–80㎡；HEPA H13；含上门安装", quantity:"8 台", delivery:"本周五前送达", amount:12400, fee:620, ai:9, manual:110, capital:48, risk:"中", request:"专用采购邮箱收到行政邮件及 Excel 附件：需要为新办公区采购 8 台空气净化器，预算不超过 1.3 万元。", question:"附件未说明 CADR 指标，AI 已标记为待确认项。", confidence:96, scope:"仅扫描专用采购邮箱中新增的邮件线程与附件", summary:"识别到采购意图、预算、数量和交期；建议进入询价代采路径。" },
  { key:"feishu", label:"飞书采购群", customer:"众创商业中心", route:"电商下单", source:"飞书采购群 · @HELPBUY 机器人消息", product:"前台接待区绿植与花盆", specs:"指定商品链接；含配送与摆放", quantity:"14 盆", delivery:"明天 18:00 前", amount:2680, fee:134, ai:4, manual:36, capital:10, risk:"低", request:"飞书采购群中 @HELPBUY：请按链接采购 14 盆绿植，明天下班前送至前台并摆放。", question:"收货人电话未在消息中给出，AI 已创建待补充项。", confidence:98, scope:"仅采集已授权群内 @HELPBUY 的消息、附件与引用上下文", summary:"商品链接、数量和交期已识别；建议进入电商下单路径。" },
  { key:"wechat", label:"微信导入", customer:"汇景品牌工作室", route:"仅代付", source:"微信导入 · 转发聊天记录 + 付款截图", product:"线下活动场地制作服务", specs:"供应商、金额与付款依据已在导入内容中确认", quantity:"1 项", delivery:"按活动节点交付", amount:18000, fee:540, ai:5, manual:42, capital:72, risk:"中", request:"运营人员导入客户转发的微信聊天记录和付款截图：供应商与金额已谈妥，需要代为付款。", question:"付款截图中的合同编号需与附件再次核验。", confidence:91, scope:"仅处理运营人员主动导入或客户转发的微信内容，不读取私人聊天", summary:"已匹配供应商、金额和付款依据；建议进入仅代付路径。" },
  { key:"portal", label:"第三方渠道", customer:"远峰共享服务中心", route:"电商下单", source:"授权供应商门户 · 新建采购申请", product:"会议区地毯与防滑垫", specs:"阻燃耐磨；含上门铺设；指定灰色系", quantity:"320 ㎡", delivery:"10 个工作日内", amount:28700, fee:1148, ai:12, manual:146, capital:126, risk:"中", request:"已授权的供应商门户产生新采购申请：会议区地毯与防滑垫，要求按指定颜色、面积和工期执行。", question:"门户仅同步了面积区间，AI 建议在执行前确认现场最终测量结果。", confidence:93, scope:"仅同步已签约第三方门户中新增、并授权给 HELPBUY 的采购申请", summary:"已识别商品类别、预算和交期；建议经受控浏览器或正式接口创建订单。" },
  { key:"file", label:"文件 / 图片", customer:"瑞达科技园", route:"直接采购", source:"文件上传 · 合同 PDF + 采购清单图片", product:"门禁系统配件", specs:"读卡器、控制器、电源模块；含安装调试", quantity:"22 个 SKU", delivery:"分两批，首批 7 天内", amount:33600, fee:1344, ai:13, manual:180, capital:145, risk:"中", request:"上传的合同 PDF 和采购清单图片显示：供应商及单价已确定，需按两批交期执行并跟进安装。", question:"AI 发现 2 个 SKU 的图片文字置信度偏低，需要人工核对型号。", confidence:89, scope:"仅解析本次主动上传的文件和图片，并保留原始证据", summary:"已匹配合同供应商和清单金额；建议进入直接采购路径。" }
];
const orders = [
  { id:"HB-260729-008", customer:"云合空间（成都）", route:"询价代采", source:"Excel 采购清单", product:"中心排风扇", specs:"400mm 工业级；220V；含安装辅材", quantity:"12 台", delivery:"8 月 5 日前送达", amount:18600, fee:930, ai:11, manual:175, capital:86, status:"AI 待确认", risk:"中", request:"成都中心行政发来采购清单：中心排风扇 12 台，要求送货上门并在下周完成安装。", question:"需确认风量和是否含安装服务，AI 已标记为待确认项。" },
  { id:"HB-260729-007", customer:"澄光品牌工作室", route:"仅代付", source:"群聊付款指令", product:"秋冬拍摄制作服务", specs:"供应商、价格和付款资料已确认", quantity:"1 项", delivery:"按合同节点交付", amount:40000, fee:1200, ai:3, manual:35, capital:170, status:"待付款", risk:"低", request:"群聊确认供应商和制作费用，需代为完成付款，并在付款后保留付款凭证。", question:"收款主体与订单依据已匹配，等待运营人员模拟付款。" },
  { id:"HB-260729-006", customer:"新川企业服务中心", route:"电商下单", source:"商品链接 + 聊天记录", product:"会议室白板与移动支架", specs:"1200×900mm；双面磁性；带锁止脚轮", quantity:"6 套", delivery:"48 小时内送货", amount:5280, fee:264, ai:4, manual:48, capital:22, status:"执行中", risk:"低", request:"客户在飞书群发来商品链接和收货信息，要求当天完成下单并同步物流。", question:"价格、规格与送货地址已确认，等待模拟下单完成。" },
  { id:"HB-260728-022", customer:"宏远科技园", route:"直接采购", source:"采购合同附件", product:"办公区窗帘改造", specs:"遮光布；阻燃等级 B1；含测量与安装", quantity:"860 ㎡", delivery:"分两批，首批 8 月 3 日", amount:68200, fee:2728, ai:16, manual:320, capital:410, status:"履约中", risk:"需关注", request:"合同中已明确供应商和单价，需按首批交期跟进测量、排产、送货和验收。", question:"首批物流尚未回传，AI 已安排今天 16:00 前自动提醒运营跟进。" },
  { id:"HB-260728-019", customer:"十方设计事务所", route:"电商下单", source:"采购清单图片", product:"茶水间耗材", specs:"纸杯、咖啡豆、清洁用品，已指定品牌", quantity:"18 个 SKU", delivery:"已签收", amount:3260, fee:163, ai:6, manual:50, capital:12, status:"已完成", risk:"低", request:"图片清单包含 18 个商品，指定品牌和数量，要求统一开票并送至前台。", question:"验收与结算资料已归档，可进入日报复盘。" }
];

let selectedId = orders[0].id;
let filter = "全部";
let intakeKey = "mail";
let intakeCandidate = null;
let intakeRun = 0;
let intakeScanning = false;
let autoIntake = true;
let editing = false;
let editDraft = null;
const money = value => new Intl.NumberFormat("zh-CN", { style:"currency", currency:"CNY", maximumFractionDigits:0 }).format(value);
const $ = id => document.getElementById(id);
const selected = () => orders.find(order => order.id === selectedId);
const visible = () => filter === "全部" ? orders : orders.filter(order => order.status === filter);
const intake = () => intakeOptions.find(option => option.key === intakeKey);
const setNotice = text => { $("notice").textContent = text; };
const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[char]);

function renderMetrics() {
  const total = orders.reduce((sum, order) => sum + order.amount, 0);
  const revenue = orders.reduce((sum, order) => sum + order.fee, 0);
  const profit = revenue - orders.reduce((sum, order) => sum + order.ai + order.manual + order.capital, 0);
  const advances = orders.filter(order => order.status !== "已完成").reduce((sum, order) => sum + order.amount, 0);
  $("order-count").textContent = orders.length;
  $("gmv").textContent = money(total);
  $("revenue").textContent = money(revenue);
  $("profit").textContent = money(profit);
  $("advance").textContent = money(advances);
  $("advance-copy").textContent = "当前有 " + orders.filter(order => order.status === "待付款").length + " 笔待付款；" + orders.filter(order => order.risk === "需关注").length + " 笔需重点跟进履约。";
  $("ai-cost").textContent = money(orders.reduce((sum, order) => sum + order.ai, 0) / orders.length);
  $("efficiency").textContent = orders.length.toFixed(1) + " 单 / 人 / 日";
  $("queue-count").textContent = visible().length + " 笔";
}

function renderQueue() {
  $("filters").innerHTML = ["全部"].concat(statuses).map(item => '<button class="' + (filter === item ? "active" : "") + '" data-filter="' + item + '">' + item + "</button>").join("");
  $("orders").innerHTML = visible().map(order => '<button class="order ' + (order.id === selectedId ? "selected" : "") + '" data-id="' + order.id + '"><div><span class="route">' + order.route + "</span><time>" + order.status + "</time></div><strong>" + order.product + "</strong><p>" + order.customer + '</p><footer><span class="risk ' + order.risk + '">' + order.risk + "</span><b>" + money(order.amount) + "</b></footer></button>").join("");
  document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => { filter = button.dataset.filter; render(); }));
  document.querySelectorAll("[data-id]").forEach(button => button.addEventListener("click", () => { selectedId = button.dataset.id; editing = false; editDraft = null; render(); }));
}

function actionText(order) {
  if (order.status === "AI 待确认") return "确认 AI 结果并纳入执行清单";
  if (order.status === "已确认待执行") return "生成待支付订单 / 执行指令";
  if (order.status === "待付款") return "付款审核通过并模拟付款";
  if (order.status === "执行中") return "模拟下单完成";
  if (order.status === "履约中") return "模拟验收完成";
  return "订单已完成";
}

function renderWorkbench() {
  const order = selected();
  const progress = statuses.indexOf(order.status);
  $("product-title").textContent = order.product;
  $("product-meta").textContent = order.id + " · " + order.customer + " · " + order.source;
  $("status").textContent = order.status;
  $("status").className = "status status-" + progress;
  $("timeline").innerHTML = statuses.map((item, index) => '<div class="' + (index <= progress ? "done" : "") + '"><i>' + (index < progress ? "✓" : index + 1) + "</i><span>" + item + "</span></div>").join("");
  $("request").textContent = "“" + order.request + "”";
  $("source").textContent = order.source;
  $("route").textContent = order.route;
  const detailFields = [["商品 / 服务", "product"], ["规格", "specs"], ["数量", "quantity"], ["交期", "delivery"], ["采购金额", "amount"]];
  $("details").innerHTML = detailFields.map(item => {
    const value = editing ? editDraft[item[1]] : order[item[1]];
    const display = item[1] === "amount" && !editing ? money(value) : value;
    return "<div><dt>" + item[0] + "</dt><dd>" + (editing ? '<input data-edit-field="' + item[1] + '" value="' + escapeHtml(display) + '">' : escapeHtml(display)) + "</dd></div>";
  }).join("");
  $("question").innerHTML = editing ? '<b>待确认：</b><textarea id="edit-question">' + escapeHtml(editDraft.question) + "</textarea>" : "<b>待确认：</b>" + escapeHtml(order.question);
  $("edit-draft").textContent = editing ? "保存修改" : "编辑 AI 结果";
  $("action-route").textContent = order.route;
  $("fee").textContent = money(order.fee);
  $("next").innerHTML = actionText(order) + " <span>→</span>";
  $("browser").disabled = order.status === "AI 待确认";
  $("browser").textContent = order.status === "AI 待确认" ? "确认 AI 结果后可执行" : "打开受控浏览器（模拟）";
  if (editing) {
    document.querySelectorAll("[data-edit-field]").forEach(input => input.addEventListener("input", () => {
      const field = input.dataset.editField;
      editDraft[field] = field === "amount" ? Number(input.value) || 0 : input.value;
    }));
    $("edit-question").addEventListener("input", event => { editDraft.question = event.target.value; });
  }
}

function renderTower() {
  $("route-stats").innerHTML = routes.map(route => {
    const count = orders.filter(order => order.route === route).length;
    return "<div><span>" + route + "</span><i><b style=\"width:" + Math.max(12, count / orders.length * 100) + "%\"></b></i><em>" + count + "</em></div>";
  }).join("");
}

function renderIntake() {
  const option = intake();
  $("intake-sources").innerHTML = intakeOptions.map(item => '<button class="' + (item.key === intakeKey ? "active" : "") + '" data-intake-source="' + item.key + '"' + (intakeScanning ? " disabled" : "") + ">" + item.label + "</button>").join("");
  $("scan-scope").textContent = option.scope;
  $("auto-intake-state").textContent = autoIntake ? "已启用" : "已暂停";
  $("toggle-auto-intake").textContent = autoIntake ? "暂停自动采集" : "启用自动采集";
  $("scan").disabled = intakeScanning;
  $("scan").innerHTML = intakeScanning ? "AI 扫描中…" : "扫描" + option.label + "（模拟） <span>→</span>";
  $("candidate").hidden = !intakeCandidate;
  $("intake-empty").hidden = Boolean(intakeCandidate);
  if (intakeCandidate) {
    $("candidate-product").textContent = intakeCandidate.product;
    $("candidate-source").textContent = intakeCandidate.source + " · 状态：AI 待确认";
    $("candidate-summary").textContent = intakeCandidate.summary;
    $("candidate-confidence").textContent = intakeCandidate.confidence + "%";
    $("candidate-route").textContent = intakeCandidate.route;
    $("candidate-amount").textContent = money(intakeCandidate.amount);
  }
  document.querySelectorAll("[data-intake-source]").forEach(button => button.addEventListener("click", () => { intakeKey = button.dataset.intakeSource; intakeCandidate = null; renderIntake(); }));
}

function render() { renderMetrics(); renderQueue(); renderWorkbench(); renderTower(); renderIntake(); }

$("parse").addEventListener("click", () => {
  const button = $("parse");
  button.disabled = true; button.textContent = "AI 解析中…";
  setNotice("AI 正在从非标准需求中提取商品、规格、数量、交期与待确认项…");
  window.setTimeout(() => { button.disabled = false; button.textContent = "模拟 AI 解析"; setNotice(selected().id + " 的任务草稿已生成，建议执行路径：" + selected().route + "。"); }, 850);
});
$("next").addEventListener("click", () => {
  const order = selected();
  const index = statuses.indexOf(order.status);
  if (index === statuses.length - 1) { setNotice("该订单已完成。可以在经营看板中查看其模拟利润与人效数据。"); return; }
  order.status = statuses[index + 1];
  setNotice(order.id + " 已模拟推进至“" + order.status + "”。此操作仅改变本页假数据。");
  render();
});
$("edit-draft").addEventListener("click", () => {
  if (!editing) {
    editDraft = { ...selected() };
    editing = true;
    setNotice("正在修改 AI 结构化结果；保存后再确认执行。");
    renderWorkbench();
    return;
  }
  Object.assign(selected(), editDraft);
  editing = false;
  editDraft = null;
  setNotice(selected().id + " 的 AI 结构化结果已人工修正，仍需确认后才会执行。");
  render();
});
$("browser").addEventListener("click", () => {
  const order = selected();
  if (order.status === "AI 待确认") { setNotice("请先核对并确认 AI 结果；确认后才可打开受控浏览器执行通道。"); return; }
  const button = $("browser");
  button.disabled = true;
  button.textContent = "浏览器会话启动中…";
  setNotice("正在模拟打开独立浏览器会话：AI 将填入已确认的商品、数量、地址与发票信息…");
  window.setTimeout(() => { renderWorkbench(); setNotice("受控浏览器会话已就绪：运营人员登录第三方平台、处理验证码，并在付款前回到 HELPBUY 完成逐单审核。"); }, 850);
});
$("scan").addEventListener("click", () => {
  if (intakeScanning) return;
  intakeScanning = true;
  intakeCandidate = null;
  renderIntake();
  setNotice("AI 正在按授权范围扫描" + intake().label + "中的新增采购需求…");
  window.setTimeout(() => {
    const option = intake();
    intakeRun += 1;
    intakeCandidate = { ...option, id:"HB-260729-" + String(900 + intakeRun).padStart(3, "0"), status:"AI 待确认" };
    orders.unshift(intakeCandidate);
    selectedId = intakeCandidate.id;
    filter = "全部";
    intakeScanning = false;
    render();
    setNotice("AI 已识别 1 条" + option.label + "需求并自动进入任务池，状态为“AI 待确认”。");
  }, 900);
});
$("admit").addEventListener("click", () => {
  if (!intakeCandidate) return;
  selectedId = intakeCandidate.id;
  filter = "全部";
  setNotice(intakeCandidate.id + " 已在任务池中打开；请核对原始需求与 AI 结果后确认执行。");
  intakeCandidate = null;
  render();
});
$("toggle-auto-intake").addEventListener("click", () => { autoIntake = !autoIntake; renderIntake(); setNotice(autoIntake ? "定时自动采集已启用：新需求将自动归集至 AI 待确认任务池。" : "定时自动采集已暂停：已配置来源不会继续自动归集。 "); });
$("reset").addEventListener("click", () => window.location.reload());
render();
