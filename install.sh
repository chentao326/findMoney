#!/usr/bin/env bash
# cheat-on-money v2 安装脚本
#
# 安装到所有支持的 AI 平台：
#   - Claude Code    → ~/.claude/skills/
#   - Codex CLI      → ~/.codex/skills/
#   - Hermes         → ~/.hermes/skills/
#
# 1. 安装 npm 依赖 & 构建 TypeScript
# 2. 在 SKILL.md 中替换 {{CHEAT_PROJECT_ROOT}} 为实际项目路径
# 3. 把各子 skill 软链到各平台的 skill 目录
# 4. 创建 CHEAT_PROJECT_ROOT 标记文件
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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
echo "--- 处理 SKILL.md 路径占位符 ---"
for skill_file in "$ROOT"/skills/*/SKILL.md; do
  if [ -f "$skill_file" ]; then
    sed -i.bak "s|{{CHEAT_PROJECT_ROOT}}|$ROOT|g" "$skill_file"
    rm -f "$skill_file.bak"
    echo "  processed: $(basename "$(dirname "$skill_file")")"
  fi
done

# 3. 安装 skill 到各平台
install_to_platform() {
  local platform_name="$1"
  local dest_dir="$2"

  echo "--- 安装 skill 到 $platform_name ($dest_dir) ---"
  mkdir -p "$dest_dir"
  for d in "$ROOT"/skills/*/; do
    name="$(basename "$d")"
    rm -f "$dest_dir/$name" 2>/dev/null || true
    ln -sfn "$d" "$dest_dir/$name"
    echo "  linked: $name → $dest_dir/$name"
  done
}

install_to_platform "Claude Code" "$HOME/.claude/skills"
install_to_platform "Codex CLI" "$HOME/.codex/skills"

# Hermes 的 skill 目录可能不同，检测一下
if [ -d "$HOME/.hermes/skills" ]; then
  install_to_platform "Hermes" "$HOME/.hermes/skills"
elif [ -d "$HOME/.hermes" ]; then
  # Hermes 存在但没有 skills 子目录
  mkdir -p "$HOME/.hermes/skills"
  install_to_platform "Hermes" "$HOME/.hermes/skills"
else
  echo "  ⚠️  ~/.hermes/ 不存在，跳过 Hermes 安装"
fi

echo ""
echo "=== 安装完成 ==="
echo "现在可以在以下平台使用 cheat-on-money skill："
echo "  • Claude Code → 说「我想搞钱」触发 money-init"
echo "  • Codex CLI   → 系统会自动发现 money-* skill"
echo "  • Hermes      → 系统会自动发现 money-* skill"
echo ""
echo "快速验证:"
echo "  node $ROOT/dist/cli.js --help"
echo "  node $ROOT/dist/cli.js state status"
echo "  node $ROOT/dist/cli.js chrome check"
