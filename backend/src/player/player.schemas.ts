import { z } from 'zod';

const MAX_SAVE_BYTES = 200 * 1024;
const MAX_SAVE_DEPTH = 20;

// Hard caps: prevent absurd values regardless of progression
const SAVE_CAPS: Record<string, number> = {
  ouro:              10_000_000,
  cristaisAstra:     500_000,
  selosDeInvocacao:  10_000,
  selosLivres:       1_000,
  moedasDeEvento:    100_000,
  loginStreak:       3_650,     // 10 years max
};

// Monotonic fields: path → max legal value (extracted from save root)
// These are validated against the stored save in uploadSave()
export const MONOTONIC_PATHS: Array<{ path: string[]; max: number }> = [
  { path: ['tower', 'bestFloor'],    max: 200 },
  { path: ['tower', 'weeklyBest'],   max: 200 },
  { path: ['playerLevel', 'level'],  max: 500 },
  // playerLevel.xp is intentionally excluded: it resets on each level-up,
  // so newXp < oldXp is valid and must not trigger a conflict.
];

const PROTECTED_SAVE_FIELDS = new Set<string>([]);

function getDepth(value: unknown, currentDepth = 0): number {
  if (currentDepth > MAX_SAVE_DEPTH) return currentDepth;
  let maximumDepth = currentDepth;

  if (Array.isArray(value)) {
    for (const item of value) {
      maximumDepth = Math.max(maximumDepth, getDepth(item, currentDepth + 1));
    }
    return maximumDepth;
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const item of Object.values(record)) {
      maximumDepth = Math.max(maximumDepth, getDepth(item, currentDepth + 1));
    }
  }

  return maximumDepth;
}

function containsProtectedField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsProtectedField);
  if (value === null || typeof value !== 'object') return false;

  const record = value as Record<string, unknown>;
  return Object.entries(record).some(
    ([key, child]) =>
      PROTECTED_SAVE_FIELDS.has(key.toLowerCase()) ||
      containsProtectedField(child),
  );
}

function getNestedValue(obj: Record<string, unknown>, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function capsValid(save: Record<string, unknown>): string | null {
  const wallet = save['wallet'] as Record<string, unknown> | undefined;
  if (wallet && typeof wallet === 'object') {
    for (const [key, cap] of Object.entries(SAVE_CAPS)) {
      const val = wallet[key];
      if (typeof val === 'number' && val > cap) {
        return `wallet.${key} excede o limite máximo de ${cap}`;
      }
    }
  }
  return null;
}

function monotonicValid(save: Record<string, unknown>): string | null {
  for (const { path, max } of MONOTONIC_PATHS) {
    const val = getNestedValue(save, path);
    if (typeof val === 'number' && val > max) {
      return `${path.join('.')} excede o limite máximo de ${max}`;
    }
  }
  return null;
}

const saveDataSchema = z
  .record(z.string(), z.unknown())
  .refine((save) => getDepth(save) <= MAX_SAVE_DEPTH, 'Save muito profundo.')
  .refine(
    (save) => !containsProtectedField(save),
    'Save contém campo controlado pelo servidor.',
  )
  .superRefine((save, ctx) => {
    const capsError = capsValid(save);
    if (capsError) ctx.addIssue({ code: z.ZodIssueCode.custom, message: capsError });
    const monotonicError = monotonicValid(save);
    if (monotonicError) ctx.addIssue({ code: z.ZodIssueCode.custom, message: monotonicError });
  });

export const saveUploadSchema = z
  .object({
    schemaVersion: z.literal(1),
    revision: z.number().int().nonnegative(),
    data: saveDataSchema,
  })
  .strict()
  .refine(
    (save) => Buffer.byteLength(JSON.stringify(save), 'utf8') <= MAX_SAVE_BYTES,
    'Save excede 200 KiB.',
  );

export const playerProfileSchema = z.object({
  id: z.number().int().nonnegative(),
  username: z.string(),
  email: z.email(),
  level: z.number().int().positive(),
  experience: z.number().int().nonnegative(),
  gold: z.number().int().nonnegative(),
  premiumCurrency: z.number().int().nonnegative(),
  characterName: z.string(),
  registeredAt: z.iso.datetime(),
  lastLogin: z.iso.datetime(),
});

export const saveUploadResponseSchema = z.object({
  success: z.literal(true),
  revision: z.number().int().positive(),
  checksum: z.string().length(64),
});

export const saveDownloadSchema = saveUploadSchema.extend({
  checksum: z.string().length(64),
  serverOfflineMs: z.number().int().nonnegative(),
});

export type SaveUpload = z.infer<typeof saveUploadSchema>;
