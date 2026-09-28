import { validateEnvironment } from './env.schema';

const validEnvironment = {
  NODE_ENV: 'production',
  PORT: '3000',
  DATABASE_URL:
    'postgresql://gacha_user:strong-password@postgres:5432/gacha_infinite?schema=public',
  JWT_SECRET: 'P9s$7xQ2!mL8@vR4#kT6&nW1*zC5+gH3',
  JWT_EXPIRES_IN: '1h',
  JWT_REFRESH_EXPIRES_IN: '7d',
  JWT_ISSUER: 'gacha-infinite-api',
  JWT_AUDIENCE: 'gacha-infinite-client',
  CORS_ORIGINS: 'https://game.example.com,https://admin.example.com',
};

describe('validateEnvironment', () => {
  it('normaliza uma configuração válida', () => {
    expect(validateEnvironment(validEnvironment)).toEqual({
      NODE_ENV: 'production',
      PORT: 3000,
      DATABASE_URL: validEnvironment.DATABASE_URL,
      JWT_SECRET: validEnvironment.JWT_SECRET,
      JWT_EXPIRES_IN: '1h',
      JWT_REFRESH_EXPIRES_IN: '7d',
      JWT_ISSUER: 'gacha-infinite-api',
      JWT_AUDIENCE: 'gacha-infinite-client',
      CORS_ORIGINS: ['https://game.example.com', 'https://admin.example.com'],
    });
  });

  it.each([
    ['JWT_SECRET ausente', { JWT_SECRET: undefined }],
    ['JWT_SECRET curto', { JWT_SECRET: 'segredo-curto' }],
    ['JWT_SECRET sem entropia', { JWT_SECRET: 'a'.repeat(48) }],
    [
      'JWT_SECRET de exemplo',
      { JWT_SECRET: 'troque-por-segredo-minimo-32-chars' },
    ],
    [
      'JWT_SECRET instrucional',
      { JWT_SECRET: 'gere-um-segredo-com-openssl-rand-base64-48' },
    ],
    ['DATABASE_URL inválida', { DATABASE_URL: 'not-a-url' }],
    [
      'DATABASE_URL de exemplo',
      {
        DATABASE_URL:
          'postgresql://gacha_user:senha-forte@postgres:5432/gacha_infinite',
      },
    ],
    ['JWT_EXPIRES_IN inválido', { JWT_EXPIRES_IN: 'amanhã' }],
    ['porta inválida', { PORT: '70000' }],
  ])('rejeita %s', (_scenario, override) => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, ...override }),
    ).toThrow('Configuração de ambiente inválida');
  });

  it('exige PostgreSQL em todos os ambientes', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        DATABASE_URL: 'file:./dev.db',
      }),
    ).toThrow('PostgreSQL');
  });
});
