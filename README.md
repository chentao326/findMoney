# cheat-on-money v2 — AI 时代靠谱兼职发现 + 反诈验证 skill

> 重构版：统一 adapter 技术栈、TypeScript 化、零依赖 CDP 协议、Zod schema 校验

帮你在 AI 时代找到**真能用**的兼职/副业。核心方法论不变：

1. **需求信号反推**，不搜"教你赚钱"的帖子（那是卖课钓粉的污染信源）
2. **实时检索 + 时效核查**，不靠模型记忆；来源超 24 个月默认失效
3. **反诈 rubric**，每个机会过硬红线
4. **个性化 + 可验证**，按你的画像匹配

## 相比 v1 的变化

| 变化 | 说明 |
|---|---|
| 统一 CLI 入口 | `cheat-on-money xianyu/boss/state/chrome` |
| 零依赖 adapter | 全部用原始 CDP 协议，移除 playwright-core |
| TypeScript 化 | 全量类型定义，编译后仍可被 Skill 调用 |
| Schema 校验 | Zod 校验 `.money-state.json`，防字段漂移 |
| 共享基础设施 | 合并两份 launch-chrome.sh，提取共享 CDP 客户端 |
| 路径修复 | CHEAT_PROJECT_ROOT 环境变量替代断裂的软链接路径 |

## 子 skill

| 命令 | 作用 |
|---|---|
| `money-init` | 首次：建画像 + 状态文件 |
| `money-find` | 按画像实时检索机会 + 反诈筛选 |
| `money-verify` | **核心**：验证某个具体机会是不是骗局 |
| `money-plan` | 选定机会 → 行动方案 + 小成本验证第一步 |
| `money-retro` | 复盘实际投入/收入 vs 预期，沉淀经验 |
| `money-status` | 状态看板，任何时候可调 |

## 安装

```bash
cd cheat-on-money-v2
chmod +x install.sh
./install.sh
```

这会：
1. 安装 npm 依赖并构建 TypeScript
2. 把 skill 软链到 `~/.claude/skills/`
3. 自动替换 SKILL.md 中的路径占位符

## 快速开始

```bash
# 查看帮助
npx tsx src/cli.ts --help

# 检查 Chrome
npx tsx src/cli.ts chrome check

# 启动 Chrome（调试模式）
npx tsx src/cli.ts chrome launch

# 搜索闲鱼
npx tsx src/cli.ts xianyu "AI头像" 9222

# 搜索 BOSS直聘
npx tsx src/cli.ts boss "AIGC" 100010000 9222

# 初始化状态文件
npx tsx src/cli.ts state init

# 查看状态
npx tsx src/cli.ts state read
```

## 项目结构

```
cheat-on-money-v2/
├── src/
│   ├── cli.ts              # 统一 CLI 入口
│   ├── cdp-client.ts        # 共享 CDP 客户端（零依赖）
│   ├── chrome-launcher.ts   # 共享 Chrome 启动器
│   ├── state-manager.ts     # 状态文件读写 + schema 校验
│   ├── schema.ts            # Zod schema 定义
│   └── adapters/
│       ├── boss.ts          # BOSS直聘 adapter
│       └── xianyu.ts        # 闲鱼 adapter
├── shared-references/       # 共享知识层
├── templates/               # 模板文件
├── skills/                  # Skill 定义
├── tests/                   # 测试
└── install.sh               # 安装脚本
```

## 重要声明

本工具提供的是**判断框架与实时检索辅助**，不构成投资/就业建议。最终决策与风险由用户自行承担。
凡涉及"先交钱、刷单、过账、出借账户"的，一律是骗局或违法，立刻远离。
