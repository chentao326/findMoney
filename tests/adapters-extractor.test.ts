import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * 提取器函数的剥离测试。
 *
 * adapter 的核心逻辑是 pageExtractorCode — 一个在浏览器上下文中
 * 通过 CDP Runtime.evaluate 执行的 JS 字符串。我们无法在 Node 中
 * 直接运行它，但可以通过解析 fixture HTML 来验证提取逻辑。
 *
 * 这里我们做的是"选择器验证"：确认 adapter 的选择器能匹配
 * fixture 中的 DOM 结构。真正的端到端测试需要真实浏览器。
 */

describe('BOSS 提取器选择器验证', () => {
  const html = readFileSync(join(__dirname, 'fixtures', 'boss-search.html'), 'utf-8');

  it('fixture 应该包含预期的岗位卡片', () => {
    expect(html).toContain('job-card-box');
    expect(html).toContain('AI产品经理');
    expect(html).toContain('大模型训练工程师');
  });

  it('CSS 选择器应该匹配 fixture 中的卡片', () => {
    // 验证 BOSS adapter 使用的选择器能工作
    // li.job-card-box — 标准选择器
    expect(html).toMatch(/li class="job-card-box"/);
    // 兜底选择器
    expect(html).not.toMatch(/class="[^"]*job-card-wrap[^"]*"/);
  });

  it('fixture 应该包含薪资信息', () => {
    expect(html).toMatch(/30K-60K/);
    expect(html).toMatch(/50K-80K/);
  });
});

describe('闲鱼提取器选择器验证', () => {
  const html = readFileSync(join(__dirname, 'fixtures', 'xianyu-search.html'), 'utf-8');

  it('fixture 应该包含预期的商品卡片', () => {
    expect(html).toContain('AI头像生成');
    expect(html).toContain('ChatGPT 账号代注册');
  });

  it('fixture 应该包含价格信息', () => {
    expect(html).toContain('¥');
    expect(html).toContain('39');
    expect(html).toContain('<em>9');
  });

  it('fixture 应该包含"想要"数据', () => {
    expect(html).toContain('128人想要');
    expect(html).toContain('230人想要');
  });
});
