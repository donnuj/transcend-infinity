import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore, newSave } from "../game/store";

beforeEach(() => {
  useGameStore.setState({ save: newSave(), cloudSynced: false, lastSyncAt: null });
});

describe("newSave", () => {
  it("returns a wallet with starter gold", () => {
    const s = newSave();
    expect(s.wallet.ouro).toBe(500);
    expect(s.wallet.selosDeInvocacao).toBe(10);
  });

  it("returns an empty collectedHeroIds list", () => {
    expect(newSave().collectedHeroIds).toEqual([]);
  });

  it("returns invocador at level 1", () => {
    expect(newSave().invocador.level).toBe(1);
  });
});

describe("spendCurrency", () => {
  it("deducts the amount from the wallet", () => {
    useGameStore.getState().spendCurrency("ouro", 100);
    expect(useGameStore.getState().save.wallet.ouro).toBe(400);
  });

  it("returns false and does not deduct when insufficient", () => {
    const result = useGameStore.getState().spendCurrency("selosDeInvocacao", 999);
    expect(result).toBe(false);
    expect(useGameStore.getState().save.wallet.selosDeInvocacao).toBe(10);
  });
});

describe("gacha store operations", () => {
  const BANNER_ID = "ascensao_celestial";
  const HERO_ID = "aurora_celestial";

  it("addCollectedHero marks hero as collected", () => {
    const store = useGameStore.getState();
    expect(store.hasHero(BANNER_ID, HERO_ID)).toBe(false);
    store.addCollectedHero(BANNER_ID, HERO_ID);
    expect(store.hasHero(BANNER_ID, HERO_ID)).toBe(true);
  });

  it("addCollectedHero is idempotent", () => {
    const store = useGameStore.getState();
    store.addCollectedHero(BANNER_ID, HERO_ID);
    store.addCollectedHero(BANNER_ID, HERO_ID);
    const count = useGameStore.getState().save.collectedHeroIds.filter(
      (k) => k === `${BANNER_ID}|${HERO_ID}`
    ).length;
    expect(count).toBe(1);
  });

  it("addFragmento accumulates correctly", () => {
    const store = useGameStore.getState();
    store.addFragmento(HERO_ID, 3);
    store.addFragmento(HERO_ID, 2);
    const frag = useGameStore.getState().save.fragmentos.find((f) => f.heroId === HERO_ID);
    expect(frag?.count).toBe(5);
  });

  it("setPity and getPity round-trip", () => {
    const store = useGameStore.getState();
    store.setPity(BANNER_ID, 42);
    expect(store.getPity(BANNER_ID)).toBe(42);
  });

  it("registerPull increments totalPulls and experience", () => {
    const store = useGameStore.getState();
    store.registerPull();
    const inv = useGameStore.getState().save.invocador;
    expect(inv.totalPulls).toBe(1);
    expect(inv.experience).toBe(10);
  });

  it("registerPull levels up invocador at threshold", () => {
    const store = useGameStore.getState();
    for (let i = 0; i < 10; i++) store.registerPull();
    const inv = useGameStore.getState().save.invocador;
    expect(inv.level).toBe(2);
    expect(inv.experience).toBe(0);
  });
});
