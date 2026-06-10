# findMoney v2 重构完成检查清单

状态图例: ✅ 已完成 · ⏳ 待验证 · 🔜 二期

## A. 核心机制（不变，v1 已验证）
- ✅ 反诈 rubric（6 条硬红线 + 存疑 + 实时查证）
- ✅ 时效核查 C′（>24 月失效、关键数字下钻一手）
- ✅ 需求信号反推法（信源分级 + 四步 + 交叉验证）
- ✅ 用户段位 T0–T3 分流
- ✅ 校准闭环（plan → retro → lessons.md）

## B. 基础设施（v2 新增）
- ✅ 统一 CLI 入口（xianyu / boss / state / chrome 子命令）
- ✅ 共享 CDP 客户端（零外部依赖）
- ✅ 共享 Chrome 启动器（自动检测系统路径）
- ✅ TypeScript 编译通过
- ✅ Zod schema 校验 + v1→v2 迁移
- ✅ CHEAT_PROJECT_ROOT 路径替换机制
- ⏳ adapter 真机验证（闲鱼 + BOSS）

## C. 文件完整性
- ✅ 6 个 skill 文件已更新路径
- ✅ shared-references 已复制（含 worked-examples）
- ✅ templates 已复制
- ✅ install.sh 增强版（含模板替换 + 构建）
- ✅ .gitignore
- ✅ README.md 更新
- ✅ RELEASE-CHECKLIST.md 更新

## D. 待验证
- ⏳ npm install + build 无报错
- ⏳ CLI --help 输出正确
- ⏳ Chrome 检测功能正常
- ⏳ 闲鱼 adapter 真实浏览器端到端测试
- ⏳ BOSS adapter 真实浏览器端到端测试
- ⏳ install.sh 在新环境完整跑通
