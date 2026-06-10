---
name: money-verify
description: 验证某个具体兼职/副业机会是不是骗局——严格按反诈 rubric 逐条过，如实标注。触发词："XX 靠谱吗"/"验证"/"这是骗局吗"/"money verify"。前置：需要 .money-state.json（无则路由 money-init）。
argument-hint: "<要验证的机会描述或链接>"
allowed-tools: Bash(*), Read, Write, Edit, Glob, WebSearch, WebFetch, Skill
---

# /money-verify — 反诈验证

## 核心方法

打分必须严格依据 `{{CHEAT_PROJECT_ROOT}}/shared-references/anti-scam-rubric.md`。
**不要凭直觉**，逐条对照红线。

## 流程

### Step 1 — 读上下文
- 读 `.money-state.json`。
- 读 `{{CHEAT_PROJECT_ROOT}}/shared-references/anti-scam-rubric.md`（反诈标准唯一来源）。
- 读 `lessons.md`（若存在）。

### Step 2 — 采集一手信息
用 WebSearch / WebFetch 找该项目的：
- 最近 3 个月的真实用户反馈（非官方渠道）
- 媒体报道 / 监管记录
- 公司工商信息（天眼查/企查查）

### Step 3 — 逐条对照反诈 rubric
按 A（硬红线）→ B（存疑信号）→ C（周边核查）→ C′（时效核查）顺序。

### Step 4 — 输出判定
格式：机会 / 硬红线 / 存疑信号 / 信息时效 / 判定（高危|存疑|可行） / 依据

### Step 5 — 写入状态文件
```bash
cheat-on-money state read
# 更新对应机会的 verdict
```
