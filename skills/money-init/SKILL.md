---
name: money-init
description: 首次使用 cheat-on-money 时建用户画像（技能/时间/资金/地区/露脸）+ 初始化状态文件。触发词："我想搞钱"/"init"/"初始化"/"第一次用"。前置：无。
allowed-tools: Bash(*), Read, Write, Edit, Glob
---

# /money-init — 初始化

## 流程

### Step 1 — 读上下文
- 读 `{{CHEAT_PROJECT_ROOT}}/shared-references/user-tiers.md`，按"技能 × 资源 × 目标"把用户归到 **T0/T1/T2/T3** 一档。
- 读 `{{CHEAT_PROJECT_ROOT}}/shared-references/anti-scam-rubric.md`，**确保用户已阅读并理解**反诈红线。

### Step 2 — 收集用户画像
通过对话收集（以下都问，但允许用户跳过任何项）：
| 字段 | 说明 | 默认 |
|---|---|---|
| skills | 你会什么（技术/语言/专业/手艺） | — |
| weekly_hours | 每周能投入多少小时 | 10 |
| startup_capital | 能投入的启动资金（0=N 无） | 0 |
| region | 你在哪 | 中国大陆 |
| can_show_face | 能否露脸/出镜 | null（不确定） |
| language | 你会啥语言 | ["中文"] |

段位引导（tier 决定给什么级别机会）：
- **T0**：无资金/单一技能/业余时间少 → 平台众包、微任务、内容平台变现
- **T1**：有基础技能/能投入时间 → 技能服务、B端陪跑
- **T2**：有技术/有小资金 → 小工具、GEO、SaaS
- **T3**：有专业能力/有资源 → 垂直专业服务

**tier 判断规则**：按"用户实际有什么"判，不按"用户想干什么"判。
**允许用户自行调整 tier**，但标注推荐理由。

### Step 3 — 初始化状态文件
```bash
cd <用户工作目录>
cheat-on-money state init
```

### Step 4 — 写用户画像到状态文件
```bash
cheat-on-money state read > /tmp/money-state.json
# 编辑 /tmp/money-state.json 填入 profile
# 然后用编辑后的内容写回
```

完成后告知用户：
- 随时可以说「帮我找机会」触发 money-find
- 发现可疑机会说「XX 靠谱吗」触发 money-verify
- 建议收藏 `{{CHEAT_PROJECT_ROOT}}/shared-references/anti-scam-rubric.md` 常读
