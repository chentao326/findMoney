/**
 * @file 共享 CDP 客户端
 * @description 基于 Chrome DevTools Protocol 的极简客户端。
 *   使用 Node 原生 http + WebSocket（Node 22+ 内置），零外部依赖。
 *
 * 关键设计：
 *   - wsSend 校验 CDP 响应的 id 字段，避免被协议推送事件误匹配
 *   - 使用 settled guard 防止 promise 双重解决
 *   - 每次调用创建短连接，避免状态管理复杂性
 *
 * 用法：
 *   const cdp = new CdpClient({ port: 9222 });
 *   const result = await cdp.evaluate('document.title');
 *   await cdp.close();
 */

import http from 'node:http';

// ─── Types ──────────────────────────────────────────

export interface CdpTarget {
  id: string;
  type: string;
  url: string;
  title: string;
  webSocketDebuggerUrl: string;
}

export interface CdpClientOptions {
  port: number;
  host?: string;
}

// ─── HTTP helper ────────────────────────────────────

function httpJson(host: string, port: number, path: string, method = 'GET'): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host, port, path, method, timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => (data += chunk.toString()));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`HTTP 请求超时: ${path}`));
    });
    req.end();
  });
}

// ─── WebSocket helper (Node 22+ built-in) ───────────

export interface WsSendOptions {
  /** 命令消息 id，校验响应匹配时必须设置 */
  commandId?: number;
}

/**
 * 通过 WebSocket 发送 CDP 命令并等待匹配的响应。
 *
 * CDP WebSocket 传输两种消息：
 *   - 响应: {id: N, result: {...}} — 与请求的 id 匹配
 *   - 事件: {method: "Page.frameStartedLoading", params: {...}} — 无 id，协议推送
 *
 * 必须校验 id 匹配，避免被事件消息误匹配后 resolve。
 */
function wsSend(wsUrl: string, message: Record<string, unknown>): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const cmdId = message.id as number | undefined;
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      ws.close();
      reject(new Error(`CDP 命令超时 (${message.method})`));
    }, 15000);

    ws.onopen = () => {
      ws.send(JSON.stringify(message));
    };

    ws.onmessage = (event) => {
      if (settled) return;
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(event.data as string);
      } catch {
        return; // 非 JSON 消息忽略
      }

      // 事件通知（无 id）— 忽略，继续等待响应
      if (data.id === undefined) return;

      // 有 id 但命令没有设置 id — 做最佳匹配
      if (cmdId !== undefined && data.id !== cmdId) return;

      settled = true;
      clearTimeout(timeout);
      ws.close();
      resolve(data);
    };

    ws.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      ws.close();
      reject(new Error('WebSocket 连接错误'));
    };

    ws.onclose = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error('WebSocket 连接意外关闭'));
    };
  });
}

// ─── CDP Client ─────────────────────────────────────

let nextMessageId = 1;

export class CdpClient {
  private host: string;
  private port: number;

  constructor(options: CdpClientOptions) {
    this.host = options.host ?? 'localhost';
    this.port = options.port;
  }

  /** 获取所有可调试的页面目标 */
  async listTargets(): Promise<CdpTarget[]> {
    const result = await httpJson(this.host, this.port, '/json');
    return Array.isArray(result) ? (result as CdpTarget[]) : [];
  }

  /** 打开新的空白标签页 */
  async createBlankTab(): Promise<CdpTarget | null> {
    const result = await httpJson(this.host, this.port, '/json/new', 'PUT');
    if (result && typeof result === 'object' && 'webSocketDebuggerUrl' in result) {
      return result as CdpTarget;
    }
    return null;
  }

  /** 获取一个可用的 page 目标（优先复用已有，否则新建） */
  async getPageTarget(): Promise<CdpTarget | null> {
    const targets = await this.listTargets();
    const existing = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    if (existing) return existing;
    return this.createBlankTab();
  }

  /** 在目标页面中执行 JavaScript，返回执行结果 */
  async evaluate(
    jsCode: string,
    target?: CdpTarget,
  ): Promise<{ result?: unknown; error?: string }> {
    const t = target ?? (await this.getPageTarget());
    if (!t) return { error: '无法获取页面目标，请确认 Chrome 调试端口已打开' };

    const wsUrl = t.webSocketDebuggerUrl;
    if (!wsUrl) return { error: '目标没有 WebSocket 调试 URL' };

    const id = nextMessageId++;
    const msg = {
      id,
      method: 'Runtime.evaluate',
      params: {
        expression: jsCode,
        returnByValue: true,
        awaitPromise: true,
        timeout: 15000,
      },
    };

    try {
      const raw = (await wsSend(wsUrl, msg)) as Record<string, unknown>;
      if (raw.error) {
        return {
          error:
            ((raw.error as Record<string, unknown>)?.message as string) ??
            JSON.stringify(raw.error),
        };
      }
      const result = raw.result as Record<string, unknown> | undefined;
      if (result?.exceptionDetails) {
        const detail = result.exceptionDetails as Record<string, unknown>;
        return { error: (detail.text as string) ?? 'JS 执行异常' };
      }
      return { result: (result?.result as Record<string, unknown>)?.value };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }

  /** 导航到 URL */
  async navigate(url: string, target?: CdpTarget): Promise<{ success: boolean; error?: string }> {
    const t = target ?? (await this.getPageTarget());
    if (!t) return { success: false, error: '无法获取页面目标' };

    const wsUrl = t.webSocketDebuggerUrl;
    if (!wsUrl) return { success: false, error: '目标没有 WebSocket 调试 URL' };

    const id = nextMessageId++;
    const msg = {
      id,
      method: 'Page.navigate',
      params: { url },
    };

    try {
      const raw = (await wsSend(wsUrl, msg)) as Record<string, unknown>;
      if (raw.error) {
        return {
          success: false,
          error: ((raw.error as Record<string, unknown>)?.message as string) ?? '导航失败',
        };
      }
      // Page.navigate 成功返回 {frameId, loaderId} 等
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }

  /** 等待指定毫秒（CDP 无内置 sleep，用 JS setTimeout 模拟） */
  async sleep(ms: number, target?: CdpTarget): Promise<void> {
    const t = target ?? (await this.getPageTarget());
    if (!t) return;
    await this.evaluate(`new Promise(r => setTimeout(r, ${ms}))`, t);
  }

  /** 关闭所有连接 */
  close(): void {
    // WebSocket 和 HTTP 连接都是短连接的，每次调用自建自毁
  }
}
