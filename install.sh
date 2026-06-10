#!/usr/bin/env bash
# cheat-on-money v2 安装脚本
#
# 1. 安装 npm 依赖 & 构建 TypeScript
# 2. 在 SKILL.md 中替换 {{CHEAT_PROJECT_ROOT}} 为实际项目路径
# 3. 把各子 skill 软链到 ~/.claude/skills/
# 4. 创建 CHEAT_PROJECT_ROOT 标记文件
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/.claude/skills"
MARKER="$ROOT/CHEAT_PROJECT_ROOT"

echo "=== cheat-on-money v2 安装 ==="
echo "项目路径: $ROOT"

# 0. 创建项目标记文件
touch "$MARKER"
echo "✓ CHEAT_PROJECT_ROOT 标记文件已创建"

# 1. 安装依赖 + 构建
echo "--- 安装 npm 依赖 ---"
cd "$ROOT"
npm install
echo "--- 构建 TypeScript ---"
npm run build

# 2. 在 SKILL.md 中替换路径占位符
#    使用 .bak 兼容 macOS 和 Linux 的 sed -i 差异
echo "--- 处理 SKILL.md 路径占位符 ---"
for skill_file in "$ROOT"/skills/*/SKILL.md; do
  if [ -f "$skill_file" ]; then
    sed -i.bak "s|{{CHEAT_PROJECT_ROOT}}|$ROOT|g" "$skill_file"
    rm -f "$skill_file.bak"
    echo "  processed: $(basename "$(dirname "$skill_file")")"
  fi
done

# 3. 软链 skill
echo "--- 安装 skill 到 Claude ---"
mkdir -p "$DEST"
for d in "$ROOT"/skills/*/; do
  name="$(basename "$d")"
  rm -f "$DEST/$name" 2>/dev/null || true
  ln -sfn "$d" "$DEST/$name"
  echo "  linked: $name"
done

echo ""
echo "=== 安装完成 ==="
echo "现在可以在 Claude Code 里说「我想搞钱」触发 money-init。"
echo ""
echo "快速验证:"
echo "  node $ROOT/dist/cli.js --help"
echo "  node $ROOT/dist/cli.js state status"
echo "  node $ROOT/dist/cli.js chrome check"
