import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readState, writeState, stateExists, initState } from '../src/state-manager.js';
import type { MoneyState } from '../src/schema.js';

function tempDir(): string {
  return mkdtempSync(join(tmpdir(), 'money-test-'));
}

describe('state-manager', () => {
  it('stateExists 应该对不存在文件返回 false', async () => {
    const dir = tempDir();
    const exists = await stateExists({ cwd: dir });
    expect(exists).toBe(false);
  });

  it('initState 应该创建合法的状态文件', async () => {
    const dir = tempDir();
    const state = await initState(
      { tier: 'T1', skills: ['写作'], weekly_hours: 15 },
      { cwd: dir },
    );
    expect(state.schema_version).toBe(2);
    expect(state.profile.tier).toBe('T1');
    expect(state.profile.skills).toEqual(['写作']);
    expect(state.profile.weekly_hours).toBe(15);
    await expect(stateExists({ cwd: dir })).resolves.toBe(true);
  });

  it('readState 应该读出已写入的状态', async () => {
    const dir = tempDir();
    await initState({ tier: 'T0' }, { cwd: dir });
    const state = await readState({ cwd: dir });
    expect(state.profile.tier).toBe('T0');
    expect(state.schema_version).toBe(2);
  });

  it('writeState 应该拒绝非法状态', async () => {
    const dir = tempDir();
    const bad = {
      schema_version: 2,
      created_at: '2026-01-01',
      profile: { tier: 'T99' },
      opportunities: [],
      active: {},
      retro_log: [],
    } as unknown as MoneyState;
    await expect(writeState(bad, { cwd: dir })).rejects.toThrow();
  });
});
