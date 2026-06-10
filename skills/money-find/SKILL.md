---
name: money-find
description: 用「需求信号反推法」找 AI 时代兼职/副业机会——不搜"教你赚钱"的帖子（那是卖课钓粉的污染信源），而是看行业报告/招聘数据/采购数据等利益中立的需求信号，推理出个人能供给的机会，并用多个独立信号交叉验证，每个机会再过反诈+时效 rubric。触发词："帮我找机会"/"找AI兼职"/"有什么能搞钱的"/"money find"/"找副业"。前置：需要 .money-state.json（无则先路由到 money-init）。
argument-hint: "[可选：限定方向，如「内容创作」「接单」「出海」]"
allowed-tools: Bash(*), Read, Write, Edit, Glob, WebSearch, WebFetch, Skill
---

# /money-find — 需求信号反推 + 反诈筛选

## 核心方法（先读这条）

**主方法是「需求信号反推法」，不是「搜怎么赚钱的帖子」。**
完整方法见 `{{CHEAT_PROJECT_ROOT}}/shared-references/demand-signal-method.md`，本 skill 严格执行它。

## 铁律

1. **主信源是一级信号**（报告/招聘/采购/政策），**"教你赚钱"类帖子不作依据**。
2. **每个机会要给"推理链 + 交叉验证"**：从哪个信号推出来、另一个独立信号怎么印证。
3. **绝不凭记忆。** 信号一律 WebSearch 实时获取。
4. **核查发布日期（rubric C′）。** 超 24 个月默认失效。
5. **每个机会先答"钱从哪来"**，过三连：谁有真需求 / 个人能否供给 / 买家够得着。
6. **每个机会必须过 `{{CHEAT_PROJECT_ROOT}}/shared-references/anti-scam-rubric.md`**（含 C′）。
7. **按画像收敛**，不全量铺开。

## 流程

### Step 0 — 读上下文
- 读 `.money-state.json` 拿画像 + **`profile.tier` 段位**（无 → 路由 `money-init`）。
- 读 `{{CHEAT_PROJECT_ROOT}}/shared-references/user-tiers.md`（按段位分流）。
- 读 `{{CHEAT_PROJECT_ROOT}}/shared-references/demand-signal-method.md`（主方法）。
- 读 `{{CHEAT_PROJECT_ROOT}}/shared-references/opportunity-taxonomy.md`（机会类型，仅辅助分类）。
- 读 `{{CHEAT_PROJECT_ROOT}}/shared-references/anti-scam-rubric.md`（反诈 + 时效）。
- **读 `lessons.md`（若存在）**：用户过往复盘沉淀的经验。
- **看 `{{CHEAT_PROJECT_ROOT}}/shared-references/worked-examples.md`** 作为高质量推理范本参照。

### Step 1 — 采集需求信号
**先按段位锁定方向范围**（user-tiers）。按方向 WebSearch **一级信源**（都加年份）：
- **真实招聘需求**（BOSS/猎聘）
- **成交侧**（闲鱼/1688/淘宝）
- `<行业> AI 落地 需求 / 缺口 / 痛点 报告`
- `<工具/服务> 市场规模 增长 采购`
- `平台 官方 创作者 扶持 / 变现 政策`

### Step 2 — 推理 + 交叉验证
对每个信号过三连，并**找至少两个独立信号互相印证**才往下推。

### Step 3 — 形成方案 + 过反诈
每个方案套 anti-scam-rubric.md 的 D 节格式输出，并额外带「推理链」「交叉验证」两行。
**验证第一步和收入预期都按用户段位写**。

### Step 4 — 写入状态文件
```bash
cheat-on-money state read  # 看当前状态
# 然后更新 opportunities 数组
```
