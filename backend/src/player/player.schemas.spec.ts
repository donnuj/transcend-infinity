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

  it('aceita campos de save completos do cliente (wallet, inventory, etc.)', () => {
    expect(
      saveUploadSchema.safeParse({
        schemaVersion: 1,
        revision: 0,
        data: {
          wallet: { ouro: 500, cristaisAstra: 10, selosDeInvocacao: 10, selosLivres: 0, moedasDeEvento: 0, loginStreak: 1, lastLoginDate: '' },
          inventory: [{ itemId: 'pocao_cura_p', qty: 5 }],
          heroProgression: [],
        },
      }).success,
    ).toBe(true);
  });

  it('rejeita wallet.ouro acima do cap', () => {
    expect(
      saveUploadSchema.safeParse({
        schemaVersion: 1,
        revision: 0,
        data: { wallet: { ouro: 10_000_001 } },
      }).success,
    ).toBe(false);
  });

  it('rejeita wallet.cristaisAstra acima do cap', () => {
    expect(
      saveUploadSchema.safeParse({
        schemaVersion: 1,
        revision: 0,
        data: { wallet: { cristaisAstra: 500_001 } },
      }).success,
    ).toBe(false);
  });

  it('rejeita tower.bestFloor acima do máximo', () => {
    expect(
      saveUploadSchema.safeParse({
        schemaVersion: 1,
        revision: 0,
        data: { tower: { bestFloor: 201 } },
      }).success,
    ).toBe(false);
  });
});
