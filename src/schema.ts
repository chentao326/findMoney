/**
 * @file .money-state.json 的 Zod schema 定义
 * @description 提供运行时类型校验和 TypeScript 类型推导。
 *   版本控制：schema_version 字段用于向前兼容迁移。
 */

import { z } from 'zod';

// ─── 基础类型 ───────────────────────────────────────

export const TierEnum = z.enum(['T0', 'T1', 'T2', 'T3']);
export type Tier = z.infer<typeof TierEnum>;

export const VerdictEnum = z.enum(['高危', '存疑', '可行']);
export type Verdict = z.infer<typeof VerdictEnum>;

export const OpportunityStatusEnum = z.enum([
  'candidate',
  'verifying',
  'chosen',
  'running',
  'dropped',
  'done',
]);
export type OpportunityStatus = z.infer<typeof OpportunityStatusEnum>;

// ─── Profile ────────────────────────────────────────

export const ProfileSchema = z.object({
  tier: TierEnum,
  tier_reason: z.string(),
  skills: z.array(z.string()),
  weekly_hours: z.number().nullable(),
  startup_capital: z.number().min(0),
  region: z.string(),
  can_show_face: z.boolean().nullable(),
  language: z.array(z.string()),
  notes: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

// ─── Opportunity ────────────────────────────────────

export const OpportunitySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  for_tier: TierEnum,
  money_source: z.string(),
  verdict: VerdictEnum,
  red_flags: z.array(z.string()),
  suspect_flags: z.array(z.string()),
  freshness: z.string(),
  verify_first_step: z.string(),
  income_expectation: z.string(),
  status: OpportunityStatusEnum,
  found_at: z.string(),
});
export type Opportunity = z.infer<typeof OpportunitySchema>;

// ─── Active / Prediction / Retro ────────────────────

export const PredictionSchema = z.object({
  expected_hours: z.number().nullable(),
  expected_first_income_days: z.number().nullable(),
  expected_income_range: z.string().nullable(),
  recorded_at: z.string().nullable(),
});
export type Prediction = z.infer<typeof PredictionSchema>;

export const ActiveSchema = z.object({
  chosen_id: z.string().nullable(),
  started_at: z.string().nullable(),
  plan: z.string().nullable(),
  prediction: PredictionSchema,
});
export type Active = z.infer<typeof ActiveSchema>;

export const RetroLogEntrySchema = z.object({
  opp_id: z.string(),
  actual_hours: z.number().nullable(),
  actual_first_income_days: z.number().nullable(),
  actual_income: z.string().nullable(),
  lessons: z.string(),
  recorded_at: z.string(),
});
export type RetroLogEntry = z.infer<typeof RetroLogEntrySchema>;

// ─── Root State ─────────────────────────────────────

export const CURRENT_SCHEMA_VERSION = 2;

export const MoneyStateSchema = z.object({
  schema_version: z.literal(CURRENT_SCHEMA_VERSION),
  created_at: z.string(),
  profile: ProfileSchema,
  opportunities: z.array(OpportunitySchema),
  active: ActiveSchema,
  retro_log: z.array(RetroLogEntrySchema),
});
export type MoneyState = z.infer<typeof MoneyStateSchema>;

// ─── 前向兼容：旧版 schema v1 检测 ─────────────────

/**
 * 检测一个未校验的对象是否属于旧版 schema v1。
 * v1 没有 schema_version 字段，也没有 active/retro_log 等。
 */
export function isV1State(raw: Record<string, unknown>): boolean {
  return (
    raw.schema_version === undefined && typeof raw.profile === 'object' && raw.profile !== null
  );
}

/**
 * 将 v1 状态迁移到 v2。
 */
export function migrateV1ToV2(v1: Record<string, unknown>): MoneyState {
  const profile = (v1.profile as Record<string, unknown>) ?? {};
  const opportunities = Array.isArray(v1.opportunities) ? v1.opportunities : [];

  return {
    schema_version: CURRENT_SCHEMA_VERSION,
    created_at: (v1.created_at as string) || new Date().toISOString().slice(0, 10),
    profile: {
      tier: (profile.tier as Tier) ?? 'T0',
      tier_reason: (profile.tier_reason as string) ?? '',
      skills: Array.isArray(profile.skills) ? (profile.skills as string[]) : [],
      weekly_hours: (profile.weekly_hours as number | null) ?? null,
      startup_capital: (profile.startup_capital as number) ?? 0,
      region: (profile.region as string) ?? '中国大陆',
      can_show_face: (profile.can_show_face as boolean | null) ?? null,
      language: Array.isArray(profile.language) ? (profile.language as string[]) : ['中文'],
      notes: (profile.notes as string) ?? '',
    },
    opportunities: opportunities.map((opp: Record<string, unknown>) => ({
      id: (opp.id as string) ?? '',
      name: (opp.name as string) ?? '',
      category: (opp.category as string) ?? '',
      for_tier: (opp.for_tier as Tier) ?? 'T0',
      money_source: (opp.money_source as string) ?? '',
      verdict: (opp.verdict as Verdict) ?? '存疑',
      red_flags: Array.isArray(opp.red_flags) ? (opp.red_flags as string[]) : [],
      suspect_flags: Array.isArray(opp.suspect_flags) ? (opp.suspect_flags as string[]) : [],
      freshness: (opp.freshness as string) ?? '',
      verify_first_step: (opp.verify_first_step as string) ?? '',
      income_expectation: (opp.income_expectation as string) ?? '',
      status: (opp.status as OpportunityStatus) ?? 'candidate',
      found_at: (opp.found_at as string) ?? '',
    })),
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
}
