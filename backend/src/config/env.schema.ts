import { z } from 'zod';

const durationSchema = z
  .string()
  .regex(/^[1-9]\d*(?:ms|s|m|h|d|w|y)$/, 'duração inválida');

const secretSchema = z
  .string()
  .min(32, 'deve ter no mínimo 32 caracteres')
  .refine(
    (secret) => new Set(secret).size >= 12,
    'deve ter diversidade suficiente de caracteres',
  )
  .refine((secret) => {
    const normalized = secret.toLowerCase();
    return (
      !normalized.includes('troque-por') &&
      !normalized.includes('gere-um-segredo')
    );
  }, 'não pode usar valor de exemplo');

const corsOriginsSchema = z
  .string()
  .min(1)
  .transform((value, context) => {
    const origins = value.split(',').map((origin) => origin.trim());
    const originsSchema = z.array(z.url()).min(1);
    const result = originsSchema.safeParse(origins);

    if (!result.success) {
      context.addIssue({
        code: 'custom',
        message: 'CORS_ORIGINS contém uma origem inválida',
      });
      return z.NEVER;
    }

    return result.data;
  });

export const environmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z
    .string()
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'PostgreSQL é obrigatório',
    )
    .refine(
      (url) =>
        !['troque-por', 'senha-forte', 'user:password'].some((placeholder) =>
          url.toLowerCase().includes(placeholder),
        ),
      'não pode usar credenciais de exemplo',
    ),
  DIRECT_URL: z
    .string()
    .refine(
      (url) => url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'PostgreSQL é obrigatório',
    )
    .optional(),
  JWT_SECRET: secretSchema,
  JWT_EXPIRES_IN: durationSchema.default('1h'),
  JWT_REFRESH_EXPIRES_IN: durationSchema.default('7d'),
  JWT_ISSUER: z.string().min(1),
  JWT_AUDIENCE: z.string().min(1),
  CORS_ORIGINS: corsOriginsSchema,
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
});

export type Environment = z.infer<typeof environmentSchema>;

export function validateEnvironment(
  config: Record<string, unknown>,
): Environment {
  const result = environmentSchema.safeParse(config);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Configuração de ambiente inválida: ${details}`);
  }

  return result.data;
}
