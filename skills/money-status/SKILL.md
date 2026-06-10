---
name: money-status
description: 显示当前兼职/副业探索的状态看板——画像概要、机会管道、当前进行中项、复盘历史。触发词："状态"/"看板"/"现在怎么样了"/"money status"。
allowed-tools: Bash(*), Read, Glob
---

# /money-status — 状态看板

## 流程

### Step 1 — 读状态文件
```bash
cheat-on-money state read
```

### Step 2 — 输出看板
格式：
```
## 画像
段位: <tier>
技能: <skills>
每周可投入: <weekly_hours>h
资金: <startup_capital>

## 机会管道
🟢 进行中: <chosen.name>
🟡 验证中: N 个
⚪ 候选: N 个
🔴 已放弃: N 个
✅ 已完成: N 个

## 当前进行
<chosen 详情 + 进度>

## 复盘历史（最近 3 条）
- <date>: <lesson 摘要>
```
