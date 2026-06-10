# findMoney — 找靠谱兼职，不被骗

> 一个帮你在 AI 时代找到**真实可用**兼职/副业的工具。
> 核心功能：搜机会 → 反诈验证 → 出计划 → 复盘沉淀

---

## 这个工具是干嘛的？

网上"教你赚钱"的信息，十个有九个是卖课/割韭菜/骗局。findMoney 换个思路：

1. **看真实的信号** — 去闲鱼看什么东西有人卖、什么价、多少人想要；去 BOSS 直聘看什么岗位在招人、给多少钱
2. **自动反诈** — 每个机会用一套标准查一遍，骗子直接过滤掉
3. **记录复盘** — 做完一个副业，记下来赚了多少、亏在哪，越用越准

适合人群：想搞点副业但怕被骗的小白，或者想系统化找机会的老手。

---

## 快速开始（3 分钟）

### 1️⃣ 下载项目

```bash
git clone https://github.com/chentao326/findMoney.git
cd findMoney
```

### 2️⃣ 一键安装

```bash
chmod +x install.sh
./install.sh
```

安装脚本会自动做三件事：
- 安装依赖 + 编译 TypeScript
- 把 skill 部署到 Claude Code / Codex CLI / Hermes
- 修复所有路径，确保能用

### 3️⃣ 验证安装

```bash
node dist/cli.js --help
```

能看到帮助信息就说明装好了。

---

## 怎么用？

### 小白模式（在 AI 里用）

安装完后，打开你的 AI 编程助手，直接说人话就行：

| 你想做什么 | 就跟 AI 说 |
|---|---|
| 第一次用，先建档 | "我想搞钱" |
| 帮我找兼职机会 | "帮我找机会" |
| 这个 XX 项目靠谱吗 | "XX 靠谱吗" |
| 给我一个行动方案 | "给我计划" |
| 复盘一下我做了什么 | "复盘" |
| 看看我现在的情况 | "现在怎么样了" |

### 高级模式（命令行）

```bash
# 搜索闲鱼上卖什么
findMoney xianyu "AI头像"

# 搜索 BOSS 直聘上招什么
findMoney boss "AIGC"

# 查看你的副业状态
findMoney state status
```

---

## AI Agent 安装指引

> 如果你是 **Claude Code / Codex CLI / Hermes** 等 AI 编码助手，运行以下命令来安装 findMoney：

```bash
# 克隆项目
git clone https://github.com/chentao326/findMoney.git /tmp/findMoney
cd /tmp/findMoney

# 执行安装（自动部署到各平台 skill 目录）
chmod +x install.sh
./install.sh

# 验证
node dist/cli.js --help
```

安装完成后，findMoney 的 6 个 skill 会出现在你的 skill 列表中：

| Skill 名称 | 触发器 | 用途 |
|---|---|---|
| `money-init` | 用户说"我想搞钱" | 首次建档 |
| `money-find` | 用户说"帮我找机会" | 搜兼职机会 |
| `money-verify` | 用户说"XX 靠谱吗" | 反诈验证 |
| `money-plan` | 用户说"给我计划" | 出行动方案 |
| `money-retro` | 用户说"复盘" | 复盘沉淀 |
| `money-status` | 用户说"现在怎么样了" | 状态看板 |

**平台支持**：`install.sh` 自动检测并部署到 `~/.claude/skills/`、`~/.codex/skills/`、`~/.hermes/skills/`，无需手动配置。

---

## 项目结构（简单版）

```
findMoney/
├── src/                    # 核心代码
│   ├── cli.ts             命令行入口
│   ├── cdp-client.ts      Chrome 控制（不需要你装任何东西）
│   ├── chrome-launcher.ts 自动启动 Chrome
│   ├── schema.ts          数据格式定义
│   ├── state-manager.ts   你的副业状态管理
│   └── adapters/          数据来源（闲鱼、BOSS 直聘）
├── skills/                6 个 AI skill
├── shared-references/     反诈规则、方法论
├── tests/                 测试（20 个，全部通过）
└── install.sh             一键安装脚本
```

---

## 开发命令

如果你懂技术，想自己改代码：

```bash
npm run build        # 编译
npm test             # 跑测试（20 个用例）
npm run lint         # 代码检查
npm run format       # 自动格式化代码
```

---

## 注意事项 ⚠️

- 本工具**辅助判断**，不构成投资/就业建议
- **先交钱、刷单、过账、出借账户** — 一律是骗局，立刻拉黑
- 最终决策和风险由你自己承担

---

## 技术概要（给好奇的人）

- **零外部依赖**：不装 Playwright、Puppeteer，直接用 Chrome 原生协议
- **TypeScript**：类型安全，不容易写崩
- **Zod 校验**：数据格式自动检查，坏了会报错
- **三平台适配**：Claude Code / Codex CLI / Hermes 全支持
- **GitHub**：[https://github.com/chentao326/findMoney](https://github.com/chentao326/findMoney)
