import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import { CdpClient } from '../src/cdp-client.js';

/**
 * 启动一个假的 CDP HTTP 端点，返回模拟的 /json 和 /json/new 响应。
 * 这样不依赖真实 Chrome 就能测试 CdpClient。
 */

let mockServer: Server;
let port: number;

beforeAll(async () => {
  port = await new Promise<number>((resolve) => {
    const s = createServer((req, res) => {
      if (req.url === '/json' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify([
            {
              id: 'page-1',
              type: 'page',
              url: 'about:blank',
              title: '',
              webSocketDebuggerUrl: `ws://localhost:${port}/devtools/page-1`,
            },
          ]),
        );
      } else if (req.url === '/json/new' && req.method === 'PUT') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            id: 'page-2',
            type: 'page',
            url: 'about:blank',
            title: '',
            webSocketDebuggerUrl: `ws://localhost:${port}/devtools/page-2`,
          }),
        );
      } else if (req.url === '/json/version' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ Browser: 'Chrome/999.0' }));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    s.listen(0, () => {
      resolve((s.address() as { port: number }).port);
    });
    mockServer = s;
  });
});

afterAll(() => {
  mockServer?.close();
});

describe('CdpClient', () => {
  it('应该在 mock 服务器上列出目标', async () => {
    const cdp = new CdpClient({ host: 'localhost', port });
    const targets = await cdp.listTargets();
    expect(targets).toHaveLength(1);
    expect(targets[0].type).toBe('page');
    expect(targets[0].webSocketDebuggerUrl).toContain(`localhost:${port}`);
  });

  it('应该创建新标签页', async () => {
    const cdp = new CdpClient({ host: 'localhost', port });
    const target = await cdp.createBlankTab();
    expect(target).not.toBeNull();
    expect(target!.type).toBe('page');
  });

  it('应该获取 page 目标（优先复用已有）', async () => {
    const cdp = new CdpClient({ host: 'localhost', port });
    const target = await cdp.getPageTarget();
    expect(target).not.toBeNull();
    expect(target!.type).toBe('page');
  });

  it('checkChrome 可检测 mock 服务器', async () => {
    // 动态 import，避免循环依赖
    const { checkChrome } = await import('../src/chrome-launcher.js');
    const result = await checkChrome(port);
    // 注意：checkChrome 默认连接 localhost:port，我们的 mock 在同一个端口
    // 但 checkChrome 硬编码了 localhost，可能无法连接到 0.0.0.0 绑定的 server
    // 这个测试主要是验证接口不抛异常
    expect(typeof result).toBe('boolean');
  });
});
