# findMoney v2 — AI 时代靠谱兼职发现 + 反诈验证系统

> 零外部依赖 · TypeScript 化 · Zod schema 校验 · 统一 CLI · 可测试

帮你在 AI 时代找到**真能用**的兼职/副业。核心靠四件事：

1. **需求信号反推** — 不搜"教你赚钱"的帖子（那是卖课钓粉的污染信源），看行业报告/招聘/采购等利益中立信号
2. **实时检索 + 时效核查** — 不靠模型记忆；来源超 24 个月默认失效
3. **反诈 rubric** — 每个机会过硬红线，宁可错杀
4. **校准闭环** — 预期 → 执行 → 复盘 → 经验回流，越用越准

---

## 安装

```bash
git clone <repo-url> findMoney
cd findMoney
chmod +x install.sh
./install.sh
```

安装脚本会：
1. 安装 npm 依赖并构建 TypeScript
2. 替换 SKILL.md 中的 `{{CHEAT_PROJECT_ROOT}}` 为实际路径
3. 将 6 个子 skill 软链到 `~/.claude/skills/`
4. 创建 `CHEAT_PROJECT_ROOT` 标记文件

---

## CLI 使用

编译后通过 `node dist/cli.js` 或直接用 `npx tsx src/cli.ts` 运行。

### 子命令一览

```
findMoney xianyu <关键词> [端口]         闲鱼成交侧搜索
findMoney boss <关键词> [城市码] [端口]   BOSS直聘招聘侧搜索
findMoney state read                    查看当前状态
findMoney state init                    初始化状态文件
findMoney state status                  检查状态文件是否存在
findMoney chrome launch [端口] [URL]     启动 Chrome（调试模式）
findMoney chrome check [端口]            检查 Chrome 调试端口
findMoney help                          显示帮助
```

### 完整工作流

#### 第一次使用

```bash
# 1. 初始化状态文件
findMoney state init

# 2. 查看状态
findMoney state status
```

#### 使用 adapter 搜索一手数据

adapter 是 **B 档半自动模式**：你自己在浏览器里登录 → adapter 只读当前页的公开列表数据。

```bash
# 1. 启动 Chrome（调试模式），手动登录对应平台
findMoney chrome launch

# 2. 在另一个终端搜索闲鱼成交数据
findMoney xianyu "AI头像"

# 3. 搜索 BOSS直聘招聘数据
findMoney boss "AIGC" 100010000
```

> 闲鱼 adapter 看"在卖什么 / 什么价 / 多少人想要"（真实的成交侧证据）
> BOSS adapter 看"在招什么 / 给多少 / 要哪些 AI 技能"（最诚实的需求温度计）

#### 在 Claude Code 中使用 Skill

| 触发词 | Skill | 作用 |
|---|---|---|
| "我想搞钱" | `money-init` | 首次：建画像 + 状态文件 |
| "帮我找机会" | `money-find` | 按画像实时检索 + 反诈筛选 |
| "XX 靠谱吗" | `money-verify` | **核心**：验证具体机会是不是骗局 |
| "给我计划" | `money-plan` | 行动方案 + 小成本验证第一步 |
| "复盘" | `money-retro` | 实际 vs 预期对账，沉淀经验 |
| "现在怎么样了" | `money-status` | 状态看板 |

### 边界处理

| 场景 | 行为 |
|---|---|
| 无效命令 | 显示错误 + 帮助 |
| 无效端口（abc / -1 / 99999） | 回退到默认 9222 |
| adapter 无关键词 | 显示用法提示 |
| 状态文件不存在 | 提示先运行 `state init` |
| Chrome 未启动 | 提示启动 Chrome |
| 状态文件损坏 | 报错提示手动修复或重 init |

---

## 开发

```bash
# 编译
npm run build

# 测试（20 个测试）
npm test

# 监听模式
npm run test:watch

# Lint
npm run lint

# 格式化
npm run format

# 格式检查
npm run format:check
```

### 测试覆盖

| 文件 | 测试数 | 覆盖内容 |
|---|---|---|
| `tests/schema.test.ts` | 6 | schema 校验 / v1 检测 / v1→v2 迁移 |
| `tests/state-manager.test.ts` | 4 | 初始化 / 读写 / 校验拒绝 |
| `tests/cdp-client.test.ts` | 4 | mock HTTP 端点 / listTargets / createBlankTab / getPageTarget |
| `tests/adapters-extractor.test.ts` | 6 | HTML fixture 选择器验证 |

---

## 项目结构

```
findMoney/
├── src/
│   ├── cli.ts                  统一 CLI 入口
│   ├── cdp-client.ts           共享 CDP 客户端（零依赖）
│   ├── chrome-launcher.ts      共享 Chrome 启动器（跨平台）
│   ├── schema.ts               Zod schema + v1→v2 迁移
│   ├── state-manager.ts        状态文件读写/校验/合并更新
│   └── adapters/
│       ├── boss.ts             BOSS直聘 adapter
│       └── xianyu.ts           闲鱼 adapter
├── shared-references/          共享知识层
│   ├── anti-scam-rubric.md     反诈判定标准
│   ├── demand-signal-method.md 需求信号反推法
│   ├── user-tiers.md           用户段位 T0-T3
│   ├── opportunity-taxonomy.md 机会分类框架
│   └── worked-examples.md      真实范本
├── skills/                     6 个 SKILL.md
├── templates/                  状态文件模板
├── tests/                      测试
│   ├── fixtures/               HTML fixture
│   ├── schema.test.ts
│   ├── state-manager.test.ts
│   ├── cdp-client.test.ts
│   └── adapters-extractor.test.ts
├── eslint.config.js
├── .prettierrc
├── tsconfig.json
├── vitest.config.ts
├── install.sh                  安装脚本
└── CHEAT_PROJECT_ROOT          路径标记文件
```

---

## 多平台 Skill 适配

findMoney 的 skill 同时支持三个 AI 编码助手：

- **Claude Code** — 通过 `~/.claude/skills/` 软链加载，口语化指令触发
- **Codex CLI** — 通过 `~/.codex/skills/` 软链加载，自动发现 skill
- **Hermes** — 通过 `~/.hermes/skills/` 软链加载，自动发现 skill

所有 SKILL.md 使用相同的 YAML frontmatter 格式，`install.sh` 安装时自动将 `{{CHEAT_PROJECT_ROOT}}` 替换为项目绝对路径，根除跨平台路径断裂问题。

---

## 架构要点

两个 adapter 都使用 Chrome DevTools Protocol 原生交互，不走 playwright：

- **BOSS adapter** — 已验证生产可用，零外部依赖，Node 22+ 原生 `http` + `WebSocket`
- **闲鱼 adapter** — 从 playwright-core 迁移到纯 CDP，解决 Chrome 148+ 不兼容问题

共享 `CdpClient` 类封装了 WebSocket id 匹配校验、超时处理、settled guard 防止双重 resolve。

### 状态管理

`.money-state.json` 通过 Zod schema 做运行时校验：

- 读写时自动校验字段类型和枚举值
- 检测到旧版 v1 schema 自动迁移到 v2
- 更新操作支持部分字段合并

### CHEAT_PROJECT_ROOT机制

SKILL.md 中使用 `{{CHEAT_PROJECT_ROOT}}` 占位符，`install.sh` 安装时替换为实际绝对路径。彻底根除软链接导致的路径断裂问题。

---

## 重要声明

本工具提供的是**判断框架与实时检索辅助**，不构成投资/就业建议。最终决策与风险由用户自行承担。
凡涉及"先交钱、刷单、过账、出借账户"的，一律是骗局或违法，立刻远离。
