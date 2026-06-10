---
name: money-retro
description: 复盘实际投入/收入 vs 预期，沉淀经验到 lessons.md（校准环闭环）。触发词："复盘"/"回顾"/"retro"/"效果怎么样"/"money retro"。
allowed-tools: Bash(*), Read, Write, Edit, Glob, Skill
---

# /money-retro — 复盘（校准环闭环）

## 流程

### Step 1 — 读上下文
- 读 `.money-state.json`，拿 active 和对应机会。
- 读 `lessons.md`（已有经验沉淀）。

### Step 2 — 对话收集实际数据
- 实际投入了多少小时？
- 多久见到第一笔收入？
- 实际收入范围？
- 踩了什么坑？
- 有什么意外发现？

### Step 3 — 对比预期 vs 实际

| | 预期 | 实际 | 偏差 |
|---|---|---|---|
| 每周投入 | ... | ... | ... |
| 见第一笔收入 | ... | ... | ... |
| 月收入 | ... | ... | ... |

### Step 4 — 沉淀到 lessons.md
```bash
cat >> lessons.md << 'EOF'
## <日期> <机会名> 复盘
- 预期: ...
- 实际: ...
- 教训: ...
- 意外发现: ...
EOF
```

### Step 5 — 更新状态文件
```bash
cheat-on-money state read
# 追加 retro_log 条目，重置 active
```
