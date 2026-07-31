# 代采平台 · 采购需求聚合子系统 — 设计文档

> 版本：v1.7 ｜ 状态：设计稿（待评审）
> 定位：代采平台下两大平行子系统之一（另一为《设计方案_下单执行子系统.md》下单执行子系统）；采购需求聚合子系统与下单执行子系统是代采平台下的两个平行子系统，前者负责采集 / 结构化 / AI 识别，后者负责自动下单 / 付款，二者通过 procurement_order 状态衔接
> 变更：v1.0 → v1.1：① 重构为「采购申请(父单)+待采订单(子单)」两级结构；② 状态机新增 `AI待确认` 初态；③ 明确下单阶段**禁止合并**；④ 新增第 6 章「AI / LLM 如何工作」。
> 变更：v1.1 → v1.2：① 新增 §6.9 图片识别选型对比（视觉 LLM vs 独立 OCR 后端）与决策建议；② 明确 `ocr_backend` 抽象：默认视觉 LLM，OCR 为可插拔降级后端（本期不实现 OCR 后端）。
> 变更：v1.2 → v1.3：① 修正文档内图片表述冲突（§3 / §6.1 / §6.2 / §6.3 原写"图片 OCR 后送 LLM"，与 §6.9 路线 A 决策矛盾）→ 统一为"默认视觉 LLM 后端（路线 A）"并加交叉引用；② 明确"文件解析 vs 图片解析"统一原则：文件由非 LLM 模块（openpyxl / markitdown）转文本、图片由视觉 LLM 转文本，二者均先转文本再交统一 LLM 抽取；③ 同步修正 `extractors.py` 注释（跨文件一致性）。
> 变更：v1.3 → v1.4：① 整合 AI 方案为统一「§6 AI 方案」章节（原 §7 成本追踪并入 §6.7，原 §8/§9 顺延为 §7/§8）；② 新增 §6.10 模型迭代与语料归属（微调机制、权重归厂商以 config 引用、标注语料存本库、人工确认即语料生产）；③ 新增 §6.11 开源 vs 闭源模型选型对比与选型建议。
> 变更：v1.4 → v1.5：① 将「§6 AI 方案」整章独立成单独文档《设计方案_代采平台AI方案.md》（§6.1–§6.12，含新增 §6.12 国内外模型并存路由）；② 主文档 §6 改为指针 + 目录，保留系统架构/数据模型/采集调度；③ 更新 §3/§4 等处交叉引用指向 AI 文档。
> 变更：v1.5 → v1.6：① 新增 §9 下单执行子系统指针（独立文档《设计方案_下单执行子系统.md》）；② 实施阶段追加 P5–P8（下单执行子系统四阶段）。
> 变更：v1.6 → v1.7（冲突检测同步）：① AI 文档由「本子系统的 AI 子文档」升格为**代采平台总体 AI 方案**，文件更名为《设计方案_代采平台AI方案.md》，本文档全部交叉引用同步更名；② §6 表述修正——AI 文档覆盖「采购需求聚合」与「下单执行」两大应用场景，本子系统对应 §6.1–§6.12 及场景一；③ §6 目录补 §6.13 应用场景二（下单执行）；④ §9 视觉兜底引用补 §6.13。

---

## 1. 概述

### 1.1 业务背景
代采平台：真实的采购方（= 客户 / 原始采购方）通过 **邮件、飞书群、企业微信群** 把采购需求"甩"给平台，平台代为采购（代付款 / 代下单 / 代询价比价 / 全包）。系统需自动采集、结构化沉淀，并由 AI 识别业务路径与付款方归属。

### 1.2 目标
- 从三个渠道自动采集采购需求，归并为「客户 → 采购申请 → 待采子单 → 付款 → 物流 → 发票」完整链路
- AI 自动识别 `business_type`（代采路径）与 `payer_type`（付款方归属）
- 控制扫描成本：去重避免重复消耗 token + 每次 AI 调用费用独立追踪

### 1.3 模块定位
本系统是**大平台的核心业务模块**，未来代码/文档集成进大项目。须按模块开发：**边界清晰、解耦、独立可测试、独立可交付**。设计文档与代码均自包含（自带配置、测试、可独立运行验证）。

---

## 2. 整体架构

```
[客户渠道]          [接入适配层]              [处理层]                              [输出]
邮件账号  ─┐
飞书群    ─┼─→ adapter(per channel) ─→ 多模态提取 ─→ AI:结构化+拆单+分类识别 ─→ 落库(父单+子单+付款+物流+发票)
企微群    ─┘       (按 channel 调度)        (text/file/image)  (见《设计方案_代采平台AI方案.md》)              │
                                                                                   └→ ai_api_cost 记录
```

### 建议模块包结构
```
procurement_ingest/
  adapters/      # 各渠道接入（email / feishu / wecom）
  extractors/    # 多模态内容提取（text / file / image）
  llm/           # LLM 调用封装（prompt、structured output、模型路由、重试）
  classifiers/   # AI 业务类型 & 付款方识别（调用 llm）
  splitter/      # 拆单：提取结果 → 父单+子单
  models/        # 数据模型定义
  scheduler/     # 按 channel 调度扫描
  cost/          # 成本追踪
  storage/       # 落库（默认 SQLite，可替换）
  config/        # 渠道与扫描配置
  tests/         # 独立测试
```
**对外仅暴露**：配置加载、单次扫描执行、定时调度入口。其余内部实现可替换，不依赖大平台其他模块。

---

## 3. 数据源与多模态内容

每个渠道的消息可能包含**多种形态**的内容，提取管线须分别处理：

| 渠道 | 正文文本 | 附件 / 文件 | 图片 |
|------|:---:|:---:|:---:|
| 邮箱 | ✓ | ✓ (docx/xlsx/pdf) | ✓ (内嵌图) |
| 飞书群 | ✓ | ✓ | ✓ |
| 企业微信群 | ✓ | ✓ | ✓ |

**提取管线**
- **文本** → 直接送 LLM 结构化提取
- **文件（xlsx/docx/pdf）** → 由**专用非 LLM 解析模块**转换：Excel 用 openpyxl，docx/pdf 用 markitdown 转 markdown；产出纯文本/结构化文本后**再送 LLM 做统一结构化提取**。**LLM 不直接解析二进制文件**。
- **图片** → 由 `ocr_backend` 处理。**默认后端为视觉 LLM（路线 A，详见《设计方案_代采平台AI方案.md》§6.9）**：视觉模型一次性完成"识图 + 抽取要素"并产出文本；该文本与前述统一进入 LLM 结构化提取。独立 OCR 后端（路线 B）仅作可插拔降级，本期不实现。
- 一条消息可**同时含文本 + 附件 + 图片**，需先聚合同形态提取结果，再做统一结构化

> **模态处理统一原则（重要）**：三种模态最终都归一为「纯文本」再交给同一套结构化提取 LLM；差别只在"文本从哪来"——
> - 文本：原文即文本；
> - 文件：由**非 LLM 解析模块**（openpyxl / markitdown）转换——格式结构化、有可靠解析器，比让 LLM 直接读二进制更准更省；
> - 图片：由**视觉 LLM 后端**（路线 A）转换——像素无可靠非 LLM 解析器。
> 即：**文件 = 解析模块转文本，图片 = 视觉 LLM 转文本，二者都"先转文本、再由同一 LLM 结构化抽取"**，不另开分支。

> 示例：邮箱一则需求，正文写"排风扇采购见附件"，附件是 xlsx 清单 → openpyxl 解析为文本，与正文合并提取；微信群一条消息发了一张采购单截图 → 经视觉 LLM 识别（见《设计方案_代采平台AI方案.md》§6.9）转文本后提取。

---

## 4. 数据模型（客户为核心 · 父单/子单两级）

### 4.1 实体关系
```
customer (1) ──< (N) channel                  # 一个客户可用多个渠道
customer (1) ──< (N) procurement_request       # 客户有多笔采购申请（父单）
procurement_request (1) ──< (N) procurement_order   # 一笔申请拆成多个待采子单
procurement_order (1) ──< (N) payment_record
procurement_order (1) ── (1) invoice_info
procurement_order (1) ── (1) logistics_detail  # address_ref 指向 customer.shipping_addresses
channel (1) ── (1) scan 配置+游标              # 独立调度与去重
每次 AI 调用 ──> ai_api_cost                  # 独立成本表
```

### 4.2 表结构

**customer**（核心基础表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| company_name | string | 公司名称（原始采购方） |
| contact_name | string | 联系人 |
| contact_phone | string | 联系电话 |
| shipping_addresses | json[] | 收货地址列表 |
| billing_companies | json[] | 可开票公司 + 税号 |
| source_channel | enum | 首次来源渠道 |
| created_at / updated_at | datetime | |

**channel**（渠道实体 — 承载扫描配置与游标）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| source_type | enum | email / feishu / wecom |
| identifier | string | 具体账号/群ID（邮箱地址 / chat_id / group_id） |
| customer_id | UUID FK | 可空，未识别归属客户时为空 |
| scan_schedule | json | 扫描时间配置，如 `[{"time":"09:00"},{"time":"13:00"},{"time":"18:00"}]` |
| last_scan_at | datetime | 游标：只扫此后的新消息 |
| status | enum | active / paused |
| created_at | datetime | |

**procurement_request**（采购申请 · 父单）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| customer_id | UUID FK | 归属客户 |
| channel_id | UUID FK | 来源渠道 |
| source | enum | email / feishu / wecom / excel |
| source_id | string | 原始消息ID/行号（去重溯源） |
| raw_content | text | 原始消息全文（含多模态摘要） |
| parsed_at | datetime | AI 解析时间 |
| overall_confidence | float | 整体置信度 |
| status | enum | **AI待确认** / 已确认 |
| created_at | datetime | |

> 父单只挂"原始需求上下文"，不挂商品明细；商品明细在子单。

**procurement_order**（待采子单 · 商品级）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| request_id | UUID FK | 归属父单 |
| customer_id | UUID FK | 归属客户 |
| channel_id | UUID FK | 来源渠道 |
| item | string | 商品名（品名） |
| model | string | 型号 |
| qty | int | 数量 |
| unit | string | 单位 |
| spec | string | 规格 |
| budget | decimal | 单价/预算 |
| total_amount | decimal | 该子单金额 = qty × budget |
| category | string | 分类 |
| handler | string | 平台经办人（内部） |
| status | enum | **AI待确认** / 已确认 / 已下单 / 已付款 / 已完成 / 已取消 |
| priority | enum | high / medium / low |
| business_type | enum | 代付款 / 代下单 / 代询价比价 / 全包（AI） |
| confidence | float | AI 置信度（该子单） |
| unique_key | string | 派生于 `客户+商品+时间`，用于唯一定义与跨源去重 |
| created_at | datetime | |

> **拆单粒度**：`客户 + 商品 + 时间` 三要素约束一个唯一子单（详见《设计方案_代采平台AI方案.md》§6.4 拆单）。
> **下单约束**：进入「已下单」后，**每个子单必须在第三方平台独立下单，禁止合并**（见 4.3）。

**payment_record**（付款记录）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| order_id | UUID FK | |
| amount | decimal | 付款金额 |
| payer | string | 付款人 |
| payee_account | json | `{name, bank, card_no}` 收款账户 |
| payer_type | enum | customer（客户自付）/ platform（平台代付），AI 结合合同 |
| status | enum | pending / paid / confirmed |
| proof_url | string | 转账截图等凭证 |
| paid_at | datetime | |
| confirmed_by | string | |

**logistics_detail**（物流）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| order_id | UUID FK | |
| address_ref | UUID | → customer.shipping_addresses 中某条地址（= 该子单收货单位） |
| courier | string | 快递公司 |
| tracking_no | string | 运单号 |
| platform_order | string | 平台订单号 |
| product_url | string | 商品链接 |

**invoice_info**（发票）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| order_id | UUID FK | |
| invoice_type | enum | 普通发票 / 专用发票 |
| billing_company | string | 取自 customer.billing_companies |
| tax_id | string | 税号 |
| status | enum | pending / issued / received |

**customer.contract_term**（合同基础 — 可为 customer 扩展字段或独立表）
| 字段 | 类型 | 说明 |
|------|------|------|
| default_payer_type | enum | customer / platform（合同约定默认付款方） |
| service_scope | enum | 代付款 / 代下单 / 全包 |
| needs_review_flag | bool | 内容偏离合同时置位 |

**ai_api_cost**（成本追踪 — 独立表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | PK |
| created_at | datetime | |
| channel_id | UUID FK | 触发扫描的渠道 |
| operation | string | extraction / split / classification / ocr |
| model | string | 使用的模型 |
| input_tokens | int | 输入 token |
| output_tokens | int | 输出 token |
| cost_cny | decimal | 费用（¥） |
| related_request_id | UUID | 可空，关联父单 |
| related_order_id | UUID | 可空，关联子单 |
| notes | string | |

### 4.3 下单策略：禁止合并（重要约束）
> 在第三方电商平台（淘宝/京东/拼多多等）实际下单时，**收货单位必须是原始采购商（客户）**，且必须**分次下单**。
> - 即使同一 SKU、同一客户，**也不能合并下单**——合并会导致收货单位/物流错乱，破坏"谁买的货发到谁的地址"的追溯链。
> - 因此：每个 `procurement_order` 子单独立下单，`logistics_detail.address_ref` 锁定为该子单对应客户的收货地址。
> - 原"同平台同 SKU 合并后再拆单"思路**作废**。是否存"向上游供应商集采议价"层面的合并，属未定后续业务，本期不纳入。

---

## 5. 扫描去重与调度

### 5.1 游标去重机制
- 每个 **channel** 独立维护 `last_scan_at`
- 每次扫描只拉取 `message_time > last_scan_at` 的消息
- 扫描结束（无论有无新消息）即更新 `last_scan_at = 本次触发时间`
- 保证同一消息不被重复读取、不重复消耗 token

### 5.2 调度配置（可配置、per-channel、可岔开）
- 每个 channel 的 `scan_schedule` 独立配置（每日次数 + 每次开始时间）
- 各渠道时间可不同、可岔开，避免并发峰值
- 调度器读取所有 `active` channel 的 schedule，到点触发对应 channel 扫描
- 示例：邮箱 `09:00 / 18:00`；飞书群A `09:30`；企微群B `10:00 / 14:00 / 17:00`

---

## 6. AI / LLM 方案（见平台总体 AI 文档）

AI 部分（三段式管线、模型路由、提取/拆单/分类、置信度、成本控制、容错、图片选型、模型迭代、开源闭源、多模型路由）已独立成文档：**《设计方案_代采平台AI方案.md》** —— 该文档为**代采平台总体 AI 方案**，先讲平台级总体策略（模型选型 / 多模态处理 / 成本 / 容错 / 迭代），再落到两大应用场景：**场景一 = 采购需求聚合（即本子系统）**、**场景二 = 下单执行（直接下单，见其 §6.13）**。

主文档聚焦系统架构、数据模型与采集调度；AI 相关全部逻辑、策略与选型以总体 AI 文档为准，便于单独评审与演进。AI 文档章节（保持 §6.x 编号以便交叉引用）：

- §6.1 三段式管线总览
- §6.2 模型选型与路由
- §6.3 内容提取（Extraction）
- §6.4 拆单（Splitting）
- §6.5 分类识别（Classification）
- §6.6 置信度与人工确认
- §6.7 成本控制机制
- §6.8 容错与降级
- §6.9 图片识别选型（视觉 LLM vs OCR）
- §6.10 模型迭代与语料归属
- §6.11 开源 vs 闭源选型
- §6.12 多模型路由：国内外模型并存
- §6.13 应用场景二：下单执行（直接下单）的 AI —— *不属于本子系统，见《设计方案_下单执行子系统.md》*

> 上表中 §6.1 为总览（总体 AI 方案 + 两大场景），§6.3–§6.6、§6.8 构成**场景一（本子系统）**的 AI 主链路；§6.2 / §6.7 / §6.9 / §6.10 / §6.11 / §6.12 为两大场景**共用基础设施**。

> 数据模型中由 AI 填充的字段（`business_type` / `payer_type` / `confidence` / `ai_api_cost` 等）定义见第 4 章；其识别逻辑见《设计方案_代采平台AI方案.md》。

---

## 7. 模块边界与测试策略

### 8.1 边界
- **输入**：配置（channels）+ 定时触发
- **输出**：结构化数据落库 + 成本记录 + 汇总报告
- 不依赖大平台其他模块；存储默认 SQLite，生产可替换为平台统一存储

### 8.2 测试
- **单元测试**：extractors（text/file/image 各形态）、llm（mock 模型返回固定 JSON 验证 prompt 解析）、splitter（拆单唯一性）、classifiers
- **集成测试**：用 mock adapter 模拟各渠道消息，验证「扫描 → 提取 → 拆单 → 落库 → 成本记录」全链路
- **独立运行**：`python -m procurement_ingest --scan --channel <id>` 手动触发验证

---

## 8. 实施阶段
| 阶段 | 内容 | 阻塞项 |
|------|------|--------|
| P1 | 邮箱渠道 + 处理层（提取/拆单/分类）+ 父单子单落库 + 成本表 + 汇总报告 | 无（Agent Mail 已连接） |
| P2 | 飞书渠道 | 待 App ID / Secret / Chat ID |
| P3 | 企业微信渠道 | 待 Corp ID / Secret + 会话存档权限 |
| P4 | 三源整合 + 定时调度 + 大项目集成适配 | P1–P3 完成 |
| P5 | 下单执行子系统：引擎 + 浏览器 session + 人工闸 + 淘宝适配器 | 淘宝测试账号 |
| P6 | 京东 / 拼多多适配器 + AI 视觉兜底 | 各平台测试账号 |
| P7 | 付款执行（主+备账号）+ 风控应急全链路 | 平台付款账号（主+备） |
| P8 | 与大平台集成、与采集层确认后触发衔接 | P1–P7 完成 |

---

## 9. 下单执行子系统（平行子系统）

已确认子单在第三方电商（淘宝/京东/拼多多…）的自动选品/填单/下单/付款，由**平行子系统**承担：**《设计方案_下单执行子系统.md》**。

采购需求聚合子系统与下单执行子系统是代采平台下**两大平行 AI 子系统**：前者负责采集 / 结构化 / AI 识别（business_type / payer_type），后者负责自动下单 / 付款；两者通过 `procurement_order` 状态衔接（前者交付「已确认」子单，后者消费），无父子 / 主从关系。下单执行子系统要点（以其独立文档为准）：
- 混合架构：确定性 DOM 层（Playwright 主力）+ AI 视觉层（computer-use / 视觉 LLM 兜底，见《设计方案_代采平台AI方案.md》§6.13 应用场景二，视觉能力选型呼应其 §6.9）+ 人工确认闸（合规底线）
- 付款用平台账号（`payer_type = platform`），全平台 per-platform 适配器
- 最大风险 = 平台自动化风控 →「检测 → 熔断 → 转人工 → 同浏览器续跑 / 切备用账号」应急链路
- 复用现有状态机（扩展 `status` 枚举），执行明细存独立 `execution_task` 表（类比 `ai_api_cost`）
- 收货单位 = 客户，沿用 §4.3 禁止合并；`business_type ∈ {代付款, 代询价比价}` 不进入下单执行子系统
- 未来演进（官方 API 直连 / A2A agent tool-calling，预留接口、去语音流兜底）见其文档 §12 未来展望

> 主文档 §4.3 下单约束、§4 数据模型（payment_record / logistics_detail / customer 字段）为下单执行子系统直接复用；该系统新增加的 `execution_task` / `platform_account` 见其独立文档。

## 附录：需求溯源
- 数据源：邮箱（已连）/ 飞书群 / 企业微信群（企业微信，非个人微信）
- 客户为核心：收货地址、开票公司归入 customer
- 数据结构：父单 `procurement_request` + 子单 `procurement_order`（商品级）
- 拆单粒度：客户 + 商品 + 时间 唯一定义一个子单
- 状态机：子单初态 `AI待确认` → 已确认 → 已下单 → 已付款 → 已完成（可取消）
- 下单约束：**禁止合并**，每个子单独立下单，收货单位=对应客户
- AI 识别：business_type、payer_type（结合合同，冲突置 needs_review）
- 扫描去重：last_scan_at 游标
- 扫描调度：可配置、per-channel、可岔开
- 扫描颗粒度：细颗粒度（具体账号/群），引入 channel 实体
- 成本追踪：独立表，货币 ¥
- 多模态：文本 / 文件 / 图片 分别提取后聚合
- 文件解析：xlsx/docx/pdf 由专用非 LLM 模块（openpyxl / markitdown）转文本，再由统一 LLM 结构化；**LLM 不直接解析二进制文件**
- 图片识别选型（2026-07-31）：默认视觉 LLM（路线A，视觉模型已含 OCR 能力）；独立 OCR（路线B）仅作可插拔降级后端，本期不实现，仅保留 `ocr_backend` 抽象
- 模态处理统一原则：文件=解析模块转文本，图片=视觉LLM转文本，二者均先转文本再交同一 LLM 抽取（见 §3 提取管线）
- 模块形态：核心模块，独立可测试、可交付
- AI/LLM：三段式管线（提取 → 拆单 → 分类），structured output + few-shot，模型可配置/可路由，按调用记账与容错降级
- 模型迭代与语料归属（2026-07-31）：当前用 prompt 工程，不做权重训练；若微调，权重归厂商以 config 引用，标注语料（人工确认过的订单）存本库，人工确认即语料生产；训练费单独核算不计 ai_api_cost
- 开源 vs 闭源选型（2026-07-31）：当前阶段用闭源国内厂商 API（通义/智谱）快速验证；数据敏感/规模化切自托管开源（DeepSeek/Qwen）；混合策略——文本用便宜模型、图片视觉用强闭源；切换仅改 config，代码零改动
