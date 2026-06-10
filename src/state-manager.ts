/**
 * @file 状态文件管理器
 * @description 封装 .money-state.json 的读写操作，
 *   自动校验 schema、支持版本迁移、提供类型安全的访问接口。
 *   设计约束：单用户单进程假设（与 Skill 工作方式一致）。
 */

import { readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { type MoneyState, MoneyStateSchema, isV1State, migrateV1ToV2 } from './schema.js';

export interface StateManagerOptions {
  /** 状态文件路径，默认 ./money-state.json 或 cwd + .money-state.json */
  filePath?: string;
  /** 工作目录（当 filePath 为相对路径时使用），默认 process.cwd() */
  cwd?: string;
}

function resolvePath(options?: StateManagerOptions): string {
  if (options?.filePath) {
    if (options.filePath.startsWith('/')) return options.filePath;
    const base = options.cwd ?? process.cwd();
    return join(base, options.filePath);
  }
  const base = options?.cwd ?? process.cwd();
  return join(base, '.money-state.json');
}

/** 读取并校验状态文件 */
export async function readState(options?: StateManagerOptions): Promise<MoneyState> {
  const path = resolvePath(options);
  const raw = await readFile(path, 'utf-8');
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`状态文件 ${path} 已损坏（非合法 JSON），请手动修复或删除后重新 init`);
  }

  // 版本迁移
  if (isV1State(parsed)) {
    console.error(`⚠️ 检测到旧版 schema v1，自动迁移到 v2...`);
    const migrated = migrateV1ToV2(parsed);
    await writeState(migrated, options);
    return migrated;
  }

  return MoneyStateSchema.parse(parsed);
}

/** 写入状态文件（写入前自动校验） */
export async function writeState(state: MoneyState, options?: StateManagerOptions): Promise<void> {
  const path = resolvePath(options);
  MoneyStateSchema.parse(state); // 校验
  const json = JSON.stringify(state, null, 2);
  await writeFile(path, json, 'utf-8');
}

/** 初始化状态文件（从模板创建） */
export async function initState(
  partialProfile: Partial<MoneyState['profile']>,
  options?: StateManagerOptions,
): Promise<MoneyState> {
  const state: MoneyState = {
    schema_version: 2,
    created_at: new Date().toISOString().slice(0, 10),
    profile: {
      tier: partialProfile.tier ?? 'T0',
      tier_reason: partialProfile.tier_reason ?? '',
      skills: partialProfile.skills ?? [],
      weekly_hours: partialProfile.weekly_hours ?? null,
      startup_capital: partialProfile.startup_capital ?? 0,
      region: partialProfile.region ?? '中国大陆',
      can_show_face: partialProfile.can_show_face ?? null,
      language: partialProfile.language ?? ['中文'],
      notes: partialProfile.notes ?? '',
    },
    opportunities: [],
    active: {
      chosen_id: null,
      started_at: null,
      plan: null,
      prediction: {
        expected_hours: null,
        expected_first_income_days: null,
        expected_income_range: null,
        recorded_at: null,
      },
    },
    retro_log: [],
  };

  await writeState(state, options);
  return state;
}

/** 更新状态文件中的部分字段（合并更新） */
export async function updateState(
  partial: Partial<MoneyState>,
  options?: StateManagerOptions,
): Promise<MoneyState> {
  const current = await readState(options);
  const updated: MoneyState = {
    ...current,
    ...partial,
    profile: partial.profile ? { ...current.profile, ...partial.profile } : current.profile,
    opportunities: partial.opportunities ?? current.opportunities,
    active: partial.active
      ? {
          ...current.active,
          ...partial.active,
          prediction: partial.active.prediction
            ? { ...current.active.prediction, ...partial.active.prediction }
            : current.active.prediction,
        }
      : current.active,
    retro_log: partial.retro_log ?? current.retro_log,
  };

  await writeState(updated, options);
  return updated;
}

/** 检查状态文件是否存在 */
export async function stateExists(options?: StateManagerOptions): Promise<boolean> {
  const path = resolvePath(options);
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
