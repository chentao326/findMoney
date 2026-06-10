/**
 * @file 共享 Chrome 启动器
 * @description 用「带远程调试端口 + 独立 profile」的方式启动 Chrome。
 *   自动检测系统 Chrome 路径（macOS / Linux / Windows）。
 *   两个 adapter 共享同一个 profile（一个浏览器里两个站点都登录，省事）。
 *
 * 机制：human-in-the-loop — Chrome 以有界面模式启动，
 *   用户在窗口中手动登录、过滑块/安全验证，adapter 只读当前页。
 */

import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';

export interface ChromeLauncherOptions {
  port?: number;
  profileDir?: string;
  url?: string;
}

const DEFAULT_PORT = 9222;
const DEFAULT_PROFILE = join(homedir(), '.money-chrome-profile');

/** 检测系统 Chrome 可执行文件路径 */
function detectChromePath(): string {
  const os = platform();
  const candidates: string[] = [];

  if (os === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    );
  } else if (os === 'linux') {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
    );
  } else if (os === 'win32') {
    candidates.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      join(process.env.LOCALAPPDATA ?? '', 'Google\\Chrome\\Application\\chrome.exe'),
    );
  }

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }

  // 兜底：PATH 里的 chrome
  return 'google-chrome';
}

/** 启动 Chrome 并返回子进程引用 */
export function launchChrome(options: ChromeLauncherOptions = {}): ChildProcess {
  const port = options.port ?? DEFAULT_PORT;
  const profileDir = options.profileDir ?? DEFAULT_PROFILE;
  const chromePath = detectChromePath();

  // 确保 profile 目录存在（spawn 不自动创建）
  mkdirSync(profileDir, { recursive: true });

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profileDir}`,
    '--no-first-run',
  ];

  const url = options.url ?? 'about:blank';
  args.push(url);

  console.error(`启动 Chrome（调试端口 ${port}，profile=${profileDir}）`);
  console.error(`  → Chrome: ${chromePath}`);
  console.error(`  → 在打开的窗口里登录对应平台（扫码/账号）`);
  console.error(`  → 若弹滑块/安全验证，手动过一下（human-in-the-loop）`);
  console.error(`  → 保持窗口开着，然后在另一个终端运行 cheat-on-money`);

  const proc = spawn(chromePath, args, {
    stdio: 'inherit',
    detached: false,
  });

  proc.on('error', (err) => {
    console.error(`❌ 启动 Chrome 失败: ${err.message}`);
    console.error(`   尝试手动启动: ${chromePath} ${args.join(' ')}`);
  });

  return proc;
}

/** 检查 Chrome 调试端口是否已打开 */
export async function checkChrome(port: number = DEFAULT_PORT): Promise<boolean> {
  try {
    const http = await import('node:http');
    return new Promise((resolve) => {
      const req = http.request(
        { host: 'localhost', port, path: '/json/version', method: 'GET', timeout: 3000 },
        (res) => {
          resolve(res.statusCode === 200);
        },
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    });
  } catch {
    return false;
  }
}
