/**
 * @file BOSS直聘「半自动读取」adapter — B 档（read-only，用你已登录的有界面浏览器）
 *
 * 机制：挂到已登录的真浏览器，搜词、只读 DOM。
 *   用原始 CDP 协议（HTTP 建标签 + WebSocket 发 Runtime.evaluate）直驱。
 *   零外部依赖（Node 22+ 自带 WebSocket）。
 *
 * 关键边界：只读【搜索结果列表页】— 列表卡片只有公开的岗位名/薪资/公司/标签，
 *   不进详情页、不点"立即沟通"、不碰 HR 个人信息/聊天。
 *   所以不触反诈 rubric A6（爬个人信息）。
 *
 * 前提：先启动 Chrome（调试模式）并登录 BOSS直聘。
 *   BOSS 频控比闲鱼凶，可能弹滑块 → 手动过一下再跑。
 */

import { CdpClient } from '../cdp-client.js';

/** BOSS 直聘搜索结果项 */
export interface BossItem {
  title: string;
  salary: string;
  company: string;
  tags: string[];
  link: string;
}

export interface BossResult {
  url: string;
  title: string;
  items: BossItem[];
  diagnostics: Record<string, unknown>;
}

/**
 * 在目标页面上执行的 JS 提取器（作为字符串传给 CDP Runtime.evaluate）。
 * 这个函数在浏览器上下文中执行，不能有外部引用。
 */
function pageExtractorCode(): any {
  const out: any = { url: location.href, title: document.title, items: [], diagnostics: {} };
  const bodyText = (document.body.innerText || '');

  // 反爬/登录/验证拦截探测
  if (/请完成.*验证|安全验证|滑块验证|请输入验证码|验证后继续访问|拖动.*完成验证/.test(bodyText))
    out.diagnostics.blocked = '被安全验证拦截 → 在浏览器窗口里手动过验证后重跑';
  if (/登录后查看|立即登录|扫码登录|未登录/.test(bodyText) && bodyText.length < 1500)
    out.diagnostics.maybeNeedLogin = '疑似未登录/结果未加载（页面提示登录）';

  const txt = (n: any) => (n ? (n.textContent || '').trim().replace(/\s+/g, ' ') : '');

  // BOSS 搜索结果是结构化 DOM：li.job-card-box 一卡一岗。带兜底选择器以防改版。
  let cardEls = [...document.querySelectorAll('li.job-card-box')];
  if (!cardEls.length) cardEls = [...document.querySelectorAll('[class*="job-card-box"], [class*="job-card-wrap"]')];

  const seen = new Set<string>();
  let obfCount = 0;
  for (const el of cardEls) {
    const nameA = el.querySelector('a.job-name, [class*="job-name"]');
    const title = txt(nameA) || txt(el.querySelector('[class*="job-title"] a, [class*="job-title"]'));
    if (!title) continue;

    // 薪资：BOSS 用自定义字体（kanzhun-mix）把数字渲染成私有区码点
    const salRaw = txt(el.querySelector('[class*="job-salary"], [class*="salary"]'));
    const salObfuscated = [...salRaw].some(c => c.codePointAt(0)! >= 0xE000 && c.codePointAt(0)! <= 0xF8FF);
    const salary = [...salRaw].map(c =>
      (c.codePointAt(0)! >= 0xE000 && c.codePointAt(0)! <= 0xF8FF) ? '\u25AF' : c
    ).join('');
    if (salObfuscated) obfCount++;

    // 标签：经验/学历/技能
    const tags = [...el.querySelectorAll('ul.tag-list li, [class*="tag-list"] li, [class*="tag"] li')]
      .map(t => txt(t)).filter(Boolean);

    // 公司
    const company = txt(el.querySelector('a[href*="gongsi"], [class*="company-name"], [class*="company"] a, [class*="company"]'));
    const href = (nameA && nameA.getAttribute('href')) || '';
    const link = href ? (href.startsWith('http') ? href : location.origin + href) : '';

    const key = link || title + '|' + salary;
    if (seen.has(key)) continue;
    seen.add(key);
    out.items.push({ title, salary, company, tags: tags.slice(0, 8), link });
  }

  out.items = out.items.slice(0, 60);
  out.diagnostics.cardCount = cardEls.length;
  if (obfCount) out.diagnostics.salaryObfuscated =
    `${obfCount} 条薪资数字被 BOSS 字体混淆（▯ 占位），单位明文可见`;

  if (!out.items.length) {
    out.diagnostics.sampleRawText = bodyText.slice(0, 400);
    out.diagnostics.salaryNodeProbe = document.querySelectorAll('[class*="salary"]').length;
  }
  return out;
}

/**
 * 运行 BOSS 直聘 adapter。
 *
 * @param keyword 搜索关键词
 * @param city    城市码（默认 100010000 = 全国）
 * @param port    Chrome 调试端口（默认 9222）
 */
export async function runBossAdapter(
  keyword: string,
  city: string = '100010000',
  port: number = 9222,
): Promise<BossResult> {
  const cdp = new CdpClient({ port });

  // 获取页面目标
  const target = await cdp.getPageTarget();
  if (!target) {
    return {
      url: '',
      title: '',
      items: [],
      diagnostics: {
        error: `连不上 Chrome 调试端口 ${port}。先运行 "cheat-on-money chrome launch" 启动 Chrome 并登录 BOSS直聘。`,
      },
    };
  }

  // 导航到 BOSS 搜索页
  const searchUrl = `https://www.zhipin.com/web/geek/job?query=${encodeURIComponent(keyword)}&city=${city}`;
  await cdp.navigate(searchUrl, target);

  // 等待页面加载
  await cdp.sleep(4000, target);

  // 执行提取器
  const code = `(${pageExtractorCode.toString()})()`;
  const result = await cdp.evaluate(code, target);

  if (result.error) {
    return {
      url: '',
      title: '',
      items: [],
      diagnostics: { error: result.error },
    };
  }

  return result.result as BossResult;
}
