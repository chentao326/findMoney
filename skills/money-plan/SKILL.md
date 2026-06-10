---
name: money-plan
description: 选定某个已过反诈验证的机会 → 输出行动方案 + 小成本验证第一步，并在状态文件里写下预期（校准环的起点）。触发词："给我计划"/"做这个"/"行动方案"/"money plan"。
argument-hint: "<机会名称或 ID>"
allowed-tools: Bash(*), Read, Write, Edit, Glob, Skill
---

# /money-plan — 行动方案 + 校准环起点

## 流程

### Step 1 — 读上下文
- 读 `.money-state.json`，找到对应机会。
- 读 `{{CHEAT_PROJECT_ROOT}}/shared-references/anti-scam-rubric.md`（回顾红线）。
- 读 `lessons.md`（若存在）。

### Step 2 — 输出行动方案
按以下结构：
1. **验证第一步**——最小成本验证能否收到第一笔钱
2. **时间线**——分阶段（尝试期/稳定期/扩展期）
3. **所需资源**——技能/工具/资金
4. **风险提示**——潜在坑 + 止损点

### Step 3 — 记录预期（校准环）
让用户确认以下预期：
- 预计每周投入（小时）
- 预计多久见到第一笔收入（天）
- 预计稳定后月收入范围

### Step 4 — 更新状态文件
```bash
cheat-on-money state read
# 更新 active.chosen_id, active.plan, active.prediction
```
