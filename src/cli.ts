#!/usr/bin/env node
/**
 * @file 统一 CLI 入口
 * @description 提供 cheat-on-money 命令行工具。
 *   子命令：xianyu / boss / state / chrome
 *
 *   用法：
 *     cheat-on-money xianyu <关键词> [端口]
 *     cheat-on-money boss <关键词> [城市码] [端口]
 *     cheat-on-money state [read|init|status]
 *     cheat-on-money chrome [launch|check]
 *
 *   原生 process.argv 解析，不引入重框架。
 */

import { cwd, argv, exit } from 'node:process';
import { runXianyuAdapter } from './adapters/xianyu.js';
import { runBossAdapter } from './adapters/boss.js';
import { readState, stateExists, initState as doInitState } from './state-manager.js';
import { launchChrome, checkChrome } from './chrome-launcher.js';

function safePort(val: string | undefined, defaultPort: number): number {
  const raw = parseInt(val || String(defaultPort), 10);
  if (isNaN(raw) || raw < 1 || raw > 65535) {
    console.error(`❌ 无效端口: "\${val || ''}"，使用默认端口 \${defaultPort}`);
    return defaultPort;
  }
  return raw;
}

function printHelp(): void {
  console.log(`
cheat-on-money v2 — AI 时代靠谱兼职发现 + 反诈验证

用法:
  cheat-on-money xianyu <关键词> [端口]         闲鱼成交侧搜索
  cheat-on-money boss <关键词> [城市码] [端口]   BOSS直聘招聘侧搜索
  cheat-on-money state read                    查看当前状态
  cheat-on-money state init                    初始化状态文件
  cheat-on-money state status                  检查状态文件是否存在
  cheat-on-money chrome launch [端口] [URL]     启动 Chrome（调试模式）
  cheat-on-money chrome check [端口]            检查 Chrome 调试端口
  cheat-on-money help                          显示此帮助
`);
}

async function main(): Promise<void> {
  const args = argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === 'help' || cmd === '--help') {
    printHelp();
    return;
  }

  switch (cmd) {
    case 'xianyu': {
      const keyword = args[1];
      const port = safePort(args[2], 9222);
      if (!keyword) {
        console.error('❌ 用法: cheat-on-money xianyu <关键词> [端口]');
        exit(1);
      }
      const result = await runXianyuAdapter(keyword, port);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'boss': {
      const keyword = args[1];
      const city = args[2] || '100010000';
      const port = safePort(args[3], 9222);
      if (!keyword) {
        console.error('❌ 用法: cheat-on-money boss <关键词> [城市码] [端口]');
        exit(1);
      }
      const result = await runBossAdapter(keyword, city, port);
      console.log(JSON.stringify(result, null, 2));
      break;
    }

    case 'state': {
      const sub = args[1] || 'status';
      const opts = { cwd: cwd() };

      switch (sub) {
        case 'read': {
          const exists = await stateExists(opts);
          if (!exists) {
            console.error('⚠️ 状态文件不存在，请先运行 cheat-on-money state init');
            exit(1);
          }
          const state = await readState(opts);
          console.log(JSON.stringify(state, null, 2));
          break;
        }
        case 'init': {
          const exists = await stateExists(opts);
          if (exists) {
            console.error('⚠️ 状态文件已存在，如需重新初始化请手动删除 .money-state.json');
            exit(1);
          }
          // 交互式初始化由 Skill 引导，这里仅做最简单的模板初始化
          const state = await doInitState({}, opts);
          console.log(`✅ 状态文件已初始化: ${JSON.stringify(state, null, 2)}`);
          break;
        }
        case 'status': {
          const exists = await stateExists(opts);
          console.log(exists ? '✅ 状态文件存在' : '⚠️ 状态文件不存在');
          break;
        }
        default:
          console.error(`❌ 未知子命令: ${sub}`);
          exit(1);
      }
      break;
    }

    case 'chrome': {
      const sub = args[1] || 'check';
      switch (sub) {
        case 'launch': {
          const port = safePort(args[2], 9222);
          const url = args[3];
          launchChrome({ port, url });
          break;
        }
        case 'check': {
          const port = safePort(args[2], 9222);
          const ok = await checkChrome(port);
          console.log(ok ? '✅ Chrome 调试端口已打开' : '❌ Chrome 调试端口未打开');
          break;
        }
        default:
          console.error(`❌ 未知子命令: ${sub}`);
          exit(1);
      }
      break;
    }

    default:
      console.error(`❌ 未知命令: ${cmd}`);
      printHelp();
      exit(1);
  }
}

main().catch((err) => {
  console.error('❌ 运行出错:', err.message);
  exit(1);
});
