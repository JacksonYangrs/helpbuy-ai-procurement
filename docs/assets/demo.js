const statuses = ["待任务确认", "待付款", "执行中", "履约中", "已完成"];
const routes = ["仅代付", "电商下单", "直接采购", "询价代采"];
const orders = [
  { id:"HB-260729-008", customer:"云合空间（成都）", route:"询价代采", source:"Excel 采购清单", product:"中心排风扇", specs:"400mm 工业级；220V；含安装辅材", quantity:"12 台", delivery:"8 月 5 日前送达", amount:18600, fee:930, ai:11, manual:175, capital:86, status:"待任务确认", risk:"中", request:"成都中心行政发来采购清单：中心排风扇 12 台，要求送货上门并在下周完成安装。", question:"需确认风量和是否含安装服务，AI 已标记为待确认项。" },
  { id:"HB-260729-007", customer:"澄光品牌工作室", route:"仅代付", source:"群聊付款指令", product:"秋冬拍摄制作服务", specs:"供应商、价格和付款资料已确认", quantity:"1 项", delivery:"按合同节点交付", amount:40000, fee:1200, ai:3, manual:35, capital:170, status:"待付款", risk:"低", request:"群聊确认供应商和制作费用，需代为完成付款，并在付款后保留付款凭证。", question:"收款主体与订单依据已匹配，等待运营人员模拟付款。" },
  { id:"HB-260729-006", customer:"新川企业服务中心", route:"电商下单", source:"商品链接 + 聊天记录", product:"会议室白板与移动支架", specs:"1200×900mm；双面磁性；带锁止脚轮", quantity:"6 套", delivery:"48 小时内送货", amount:5280, fee:264, ai:4, manual:48, capital:22, status:"执行中", risk:"低", request:"客户在飞书群发来商品链接和收货信息，要求当天完成下单并同步物流。", question:"价格、规格与送货地址已确认，等待模拟下单完成。" },
  { id:"HB-260728-022", customer:"宏远科技园", route:"直接采购", source:"采购合同附件", product:"办公区窗帘改造", specs:"遮光布；阻燃等级 B1；含测量与安装", quantity:"860 ㎡", delivery:"分两批，首批 8 月 3 日", amount:68200, fee:2728, ai:16, manual:320, capital:410, status:"履约中", risk:"需关注", request:"合同中已明确供应商和单价，需按首批交期跟进测量、排产、送货和验收。", question:"首批物流尚未回传，AI 已安排今天 16:00 前自动提醒运营跟进。" },
  { id:"HB-260728-019", customer:"十方设计事务所", route:"电商下单", source:"采购清单图片", product:"茶水间耗材", specs:"纸杯、咖啡豆、清洁用品，已指定品牌", quantity:"18 个 SKU", delivery:"已签收", amount:3260, fee:163, ai:6, manual:50, capital:12, status:"已完成", risk:"低", request:"图片清单包含 18 个商品，指定品牌和数量，要求统一开票并送至前台。", question:"验收与结算资料已归档，可进入日报复盘。" }
];

let selectedId = orders[0].id;
let filter = "全部";
const money = value => new Intl.NumberFormat("zh-CN", { style:"currency", currency:"CNY", maximumFractionDigits:0 }).format(value);
const $ = id => document.getElementById(id);
const selected = () => orders.find(order => order.id === selectedId);
const visible = () => filter === "全部" ? orders : orders.filter(order => order.status === filter);
const setNotice = text => { $("notice").textContent = text; };

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
  $("orders").innerHTML = visible().map(order => '<button class="order ' + (order.id === selectedId ? "selected" : "") + '" data-id="' + order.id + '"><div><span class="route">' + order.route + "</span><time>" + order.id.slice(-3) + "</time></div><strong>" + order.product + "</strong><p>" + order.customer + '</p><footer><span class="risk ' + order.risk + '">' + order.risk + "</span><b>" + money(order.amount) + "</b></footer></button>").join("");
  document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => { filter = button.dataset.filter; render(); }));
  document.querySelectorAll("[data-id]").forEach(button => button.addEventListener("click", () => { selectedId = button.dataset.id; render(); }));
}

function actionText(order) {
  if (order.status === "待任务确认") return "确认任务并进入执行";
  if (order.status === "待付款") return "模拟付款";
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
  $("details").innerHTML = [["商品 / 服务", order.product], ["规格", order.specs], ["数量", order.quantity], ["交期", order.delivery], ["采购金额", money(order.amount)]].map(item => "<div><dt>" + item[0] + "</dt><dd>" + item[1] + "</dd></div>").join("");
  $("question").innerHTML = "<b>待确认：</b>" + order.question;
  $("action-route").textContent = order.route;
  $("fee").textContent = money(order.fee);
  $("next").innerHTML = actionText(order) + " <span>→</span>";
}

function renderTower() {
  $("route-stats").innerHTML = routes.map(route => {
    const count = orders.filter(order => order.route === route).length;
    return "<div><span>" + route + "</span><i><b style=\"width:" + Math.max(12, count / orders.length * 100) + "%\"></b></i><em>" + count + "</em></div>";
  }).join("");
}

function render() { renderMetrics(); renderQueue(); renderWorkbench(); renderTower(); }

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
$("reset").addEventListener("click", () => window.location.reload());
render();
