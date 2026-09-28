import { saveUploadSchema } from './player.schemas';

describe('contrato de save remoto', () => {
  it('aceita um save JSON limitado', () => {
    expect(
      saveUploadSchema.safeParse({
        schemaVersion: 1,
        revision: 0,
        data: { Audio: { MasterVolume: 0.8 } },
      }).success,
    ).toBe(true);
  });

  it('rejeita arrays e valores primitivos na raiz', () => {
    expect(saveUploadSchema.safeParse([]).success).toBe(false);
    expect(saveUploadSchema.safeParse('save').success).toBe(false);
  });

  it('rejeita profundidade excessiva', () => {
    let payload: Record<string, unknown> = {};
    const root = payload;
    for (let depth = 0; depth < 21; depth += 1) {
      const child: Record<string, unknown> = {};
      payload.child = child;
      payload = child;
    }

    expect(
      saveUploadSchema.safeParse({
        schemaVersion: 1,
        revision: 0,
        data: root,
      }).success,
    ).toBe(false);
  });

  it('rejeita payload acima de 200 KiB', () => {
    expect(
      saveUploadSchema.safeParse({
        schemaVersion: 1,
        revision: 0,
        data: { value: 'x'.repeat(201 * 1024) },
      }).success,
    ).toBe(false);
  });

  it.each(['Wallet', 'gold', 'premiumCurrency', 'Inventory', 'BannerPity'])(
    'rejeita escrita no campo protegido %s',
    (protectedField) => {
      expect(
        saveUploadSchema.safeParse({
          schemaVersion: 1,
          revision: 0,
          data: { [protectedField]: 999999 },
        }).success,
      ).toBe(false);
    },
  );
});
