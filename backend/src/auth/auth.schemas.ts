import { z } from 'zod';
import { playerProfileSchema } from '../player/player.schemas';

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z
  .string()
  .min(14, 'Mínimo 14 caracteres')
  .max(128)
  .refine((p) => /[a-z]/.test(p), 'Deve conter ao menos uma letra minúscula')
  .refine((p) => /[A-Z]/.test(p), 'Deve conter ao menos uma letra maiúscula')
  .refine((p) => /[0-9]/.test(p), 'Deve conter ao menos um número')
  .refine((p) => /[^a-zA-Z0-9]/.test(p), 'Deve conter ao menos um símbolo');
const loginPasswordSchema = z.string().min(1).max(128);
const usernameSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[\p{L}\p{N}_-]+$/u);

export const loginSchema = z
  .object({
    email: emailSchema,
    password: loginPasswordSchema,
  })
  .strict();

export const registerSchema = z
  .object({
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema,
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z
      .string()
      .min(64)
      .max(128)
      .regex(/^[A-Za-z0-9_-]+$/),
  })
  .strict();

export const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  profile: playerProfileSchema,
});

// Usado internamente para validar o token antes de gravar no cookie
export const refreshTokenSchema = z
  .string()
  .min(64)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/);

export const authActionResponseSchema = z.object({
  success: z.literal(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
