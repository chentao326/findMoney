/**
 * @file 闲鱼「半自动读取」adapter — B 档（read-only，用你已登录的有界面浏览器）
 *
 * 机制：挂到已登录的真浏览器，搜词、只读 DOM。
 *   用原始 CDP 协议（HTTP + WebSocket）直驱，零外部依赖。
 *   （原 playwright-core 版因 Chrome 148+ 不兼容已废弃）
 *
 * 已验证：
 *   - 无头 Chrome 会被闲鱼反爬挡 → 必须用有界面的正常浏览器
 *   - 匿名看不到搜索结果 → 必须先登录
 *
 * 前提：先启动 Chrome（调试模式）并登录闲鱼。
 *   只读 search result 页：不下单、不私聊、不批量翻页。
 */

import { CdpClient } from '../cdp-client.js';

/** 闲鱼搜索结果项 */
export interface XianyuItem {
  title: string;
  price: string;
  want: string | null;
  link: string;
}

export interface XianyuResult {
  url: string;
  title: string;
  items: XianyuItem[];
  diagnostics: Record<string, unknown>;
}

/**
 * 在目标页面上执行的 JS 提取器。
 * 启发式：找含单个 ¥ 价格的文本节点，归并卡片，去重。
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
function pageExtractorCode(): any {
  const out: any = { url: location.href, title: document.title, items: [], diagnostics: {} };
  const bodyText = (document.body.innerText || '');

  // 反爬/登录拦截探测
  if (/非法访问|请使用正常浏览器/.test(bodyText))
    out.diagnostics.blocked = '被反爬拦截（非法访问）';
  if (/加载中/.test(bodyText) && bodyText.length < 600)
    out.diagnostics.maybeNeedLogin = '疑似未登录/结果未加载（页面停在"加载中"）';

  const priceReG = /[¥￥]\s?\d[\d,.]*/g;
  const wantRe = /(\d[\d,.]*)\s*人?想要/;
  const priceCount = (s: string) => (s.match(priceReG) || []).length;
  const seen = new Set<string>();
  const cards: any[] = [];

  for (const el of Array.from(document.querySelectorAll('a, div, li'))) {
    const t = (el as HTMLElement).innerText?.trim();
    if (!t || t.length > 300) continue;
    if (priceCount(t) !== 1) continue; // 只认含单个价格的卡片种子
    let card: HTMLElement = el as HTMLElement;
    for (let i = 0; i < 4 && card.parentElement; i++) {
      const pt = (card.parentElement.innerText || '').trim();
      if (pt.length > 400 || priceCount(pt) > 1) break;
      card = card.parentElement;
    }
    const ct = (card.innerText || '').trim();
    if (seen.has(ct)) continue;
    seen.add(ct);

    // 价格重组：闲鱼把 ¥ / 整数 / .小数 拆成多节点
    const pm = ct.match(/[¥￥]\s*(\d+)\s*(\.\s*\d+)?/);
    const price = pm ? ('¥' + pm[1] + (pm[2] ? pm[2].replace(/\s+/g, '') : '')) : '';
    const want = (ct.match(wantRe) || [null, null])[1];
    const title = ct.split('\n').map(s => s.trim())
      .filter(s => s && !/想要/.test(s) && !/^[\d.,%¥￥]+$/.test(s) && s.length >= 4)
      .sort((a, b) => b.length - a.length)[0] || '';
    const link = (card.querySelector('a') || el.closest('a'))?.getAttribute('href') || '';

    cards.push({ title, price, want, link: link.startsWith('http') ? link : 'https://www.goofish.com' + link });
  }

  // 同一商品的价格碎片 -> 按链接 id 归并
  const byId = new Map<string, any>();
  for (const c of cards) {
    const id = (c.link.match(/[?&]id=(\d+)/) || [null, c.link])[1] || c.link || c.title;
    const prev = byId.get(id);
    if (!prev) { byId.set(id, c); continue; }
    byId.set(id, {
      title: (c.title.length > prev.title.length ? c.title : prev.title),
      price: prev.price || c.price,
      want: prev.want || c.want,
      link: prev.link || c.link,
    });
  }

  out.items = [...byId.values()].filter((c: any) => c.title && c.price).slice(0, 60);
  out.diagnostics.rawCandidateCount = cards.length;
  out.diagnostics.mergedCount = out.items.length;
  out.diagnostics.sampleRawText = bodyText.slice(0, 300);
  return out;
}

/**
 * 运行闲鱼 adapter。
 *
 * @param keyword 搜索关键词
 * @param port    Chrome 调试端口（默认 9222）
 */
export async function runXianyuAdapter(
  keyword: string,
  port: number = 9222,
): Promise<XianyuResult> {
  const cdp = new CdpClient({ port });

  // 获取页面目标
  const target = await cdp.getPageTarget();
  if (!target) {
    return {
      url: '',
      title: '',
      items: [],
      diagnostics: {
        error: `连不上 Chrome 调试端口 ${port}。先运行 "cheat-on-money chrome launch" 启动 Chrome 并登录闲鱼。`,
      },
    };
  }

  // 导航到闲鱼搜索结果页
  const searchUrl = `https://www.goofish.com/search?q=${encodeURIComponent(keyword)}`;
  await cdp.navigate(searchUrl, target);

  // 等待页面加载 + 轻滚动触发懒加载
  await cdp.sleep(4000, target);
  await cdp.evaluate('window.scrollBy(0, 600)', target);
  await cdp.sleep(2000, target);

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

  return result.result as XianyuResult;
}
