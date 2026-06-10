import { describe, it, expect } from 'vitest';
import {
  MoneyStateSchema,
  isV1State,
  migrateV1ToV2,
  CURRENT_SCHEMA_VERSION,
  ProfileSchema,
  OpportunitySchema,
} from '../src/schema.js';

describe('MoneyStateSchema', () => {
  it('应该校验合法的状态对象', () => {
    const valid = {
      schema_version: 2,
      created_at: '2026-06-10',
      profile: {
        tier: 'T1',
        tier_reason: '有基础技能',
        skills: ['写作', 'Python'],
        weekly_hours: 10,
        startup_capital: 0,
        region: '中国大陆',
        can_show_face: false,
        language: ['中文'],
        notes: '',
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
    expect(() => MoneyStateSchema.parse(valid)).not.toThrow();
  });

  it('应该拒绝非法的 tier 值', () => {
    const invalid = {
      schema_version: 2,
      created_at: '2026-06-10',
      profile: {
        tier: 'T5', // 非法值
        tier_reason: '',
        skills: [],
        weekly_hours: null,
        startup_capital: 0,
        region: '',
        can_show_face: null,
        language: ['中文'],
        notes: '',
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
    expect(() => MoneyStateSchema.parse(invalid)).toThrow();
  });

  it('应该拒绝非法的 schema_version', () => {
    const invalid = {
      schema_version: 1, // 不是 2
      created_at: '2026-06-10',
      profile: {
        tier: 'T0',
        tier_reason: '',
        skills: [],
        weekly_hours: null,
        startup_capital: 0,
        region: '',
        can_show_face: null,
        language: ['中文'],
        notes: '',
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
    expect(() => MoneyStateSchema.parse(invalid)).toThrow();
  });
});

describe('isV1State', () => {
  it('应该正确识别 v1 状态对象', () => {
    const v1 = {
      profile: { tier: 'T0', skills: [] },
      opportunities: [],
    };
    expect(isV1State(v1)).toBe(true);
  });

  it('应该不把 v2 状态对象误判为 v1', () => {
    const v2 = {
      schema_version: 2,
      profile: { tier: 'T0', skills: [] },
    };
    expect(isV1State(v2)).toBe(false);
  });
});

describe('migrateV1ToV2', () => {
  it('应该正确迁移 v1 到 v2', () => {
    const v1 = {
      created_at: '2026-01-01',
      profile: {
        tier: 'T2',
        skills: ['编程'],
        startup_capital: 5000,
      },
      opportunities: [
        {
          id: 'opp-1',
          name: '测试机会',
          category: '开发',
          for_tier: 'T2',
          money_source: '接单',
          verdict: '可行',
          red_flags: [],
          suspect_flags: [],
          freshness: '2026',
          verify_first_step: '注册平台',
          income_expectation: '5000-10000/月',
          status: 'candidate',
          found_at: '2026-01-01',
        },
      ],
    };

    const result = migrateV1ToV2(v1);
    expect(result.schema_version).toBe(CURRENT_SCHEMA_VERSION);
    expect(result.profile.tier).toBe('T2');
    expect(result.profile.skills).toEqual(['编程']);
    expect(result.opportunities).toHaveLength(1);
    expect(result.opportunities[0].name).toBe('测试机会');
    expect(result.active.chosen_id).toBeNull();
    expect(result.retro_log).toEqual([]);
  });
});
