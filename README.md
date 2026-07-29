# HELPBUY：AI 代采购执行平台

HELPBUY 是面向代采执行团队的内部 AI 运营平台。它接受客户既有的文件、合同、邮件、聊天、图片和商品链接，将非标准采购需求整理为可执行任务，并通过 API 或受控浏览器推动下单、付款、履约和结算。

客户、供应商和工厂不需要注册或使用 HELPBUY；平台的目标是降低代采团队的人力与时间成本，在同等人力下承接更多订单。

## 完整方案文档

- [商业计划与产品需求文档（完整 PRD）](public/HELPBUY_PRD_V2_商业计划与产品方案.md)
- [产品与技术设计文档](public/HELPBUY_产品与技术设计文档_V1.md)
- [公开概览站](https://jacksonyangrs.github.io/helpbuy-ai-procurement/)
- [完整 PRD 在线阅读](https://jacksonyangrs.github.io/helpbuy-ai-procurement/document/)
- [产品与技术设计在线阅读](https://jacksonyangrs.github.io/helpbuy-ai-procurement/design/)
- [交互式运营 Demo](https://jacksonyangrs.github.io/helpbuy-ai-procurement/demo/)

## 核心产品范围

- 泛输入受理与 AI 结构化：文件、合同、图片、聊天、邮件和链接；
- 四条执行路径：仅代付、电商下单、指定供应商直接采购、询价代采；
- 任务工作台：确认规格、执行下单、跟踪付款与履约、归档证据；
- 付款安全：每笔付款均需审核；AI 不拥有付款放行权；
- 执行通道：优先第三方企业采购 API；无 API 时使用受控浏览器辅助填单，人完成登录、验证码与最终支付确认；
- 经营看板：GMV、服务费、人工/AI/资金成本、利润、垫资、应收与人效。

## 本地开发

```bash
npm install
npm run dev
npm run build
```

`docs/` 是 GitHub Pages 静态站点来源。发布工作流会将 `public/` 中的完整 PRD 同步到 GitHub Pages，确保在线“完整方案”页与仓库 PRD 原文一致。
