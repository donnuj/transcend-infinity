"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { ExplorationScene } from "@/src/components/game/scenes/ExplorationScene";
import { scheduleSave } from "@/lib/game/save";
import { REGIONS, REGION_MAP } from "@/lib/game/data/world";
import { HERO_MAP } from "@/lib/game/data/heroes";

const ease = [0.23, 1, 0.32, 1] as const;

const HOUR = 60 * 60 * 1000;

const BIOME_ICONS: Record<string, string> = {
  Planície: "🌾",
  Floresta: "🌲",
  Neve:     "❄",
  Deserto:  "🏜",
  Mar:      "🌊",
  Vulcão:   "🌋",
};

const POI_ICONS: Record<string, string> = {
  dungeon: "⚔",
  npc:     "💬",
  market:  "🛒",
  boss:    "☠",
  event:   "✦",
};

const POI_COLORS: Record<string, string> = {
  dungeon: "rgb(255,100,100)",
  npc:     "rgb(100,180,255)",
  market:  "rgb(200,155,60)",
  boss:    "rgb(200,80,255)",
  event:   "rgb(100,220,140)",
};

function getExplorationDuration(regionLevel: number): number {
  if (regionLevel <= 5)  return 2 * HOUR;
  if (regionLevel <= 15) return 4 * HOUR;
  if (regionLevel <= 25) return 8 * HOUR;
  if (regionLevel <= 35) return 12 * HOUR;
  if (regionLevel <= 50) return 18 * HOUR;
  return 24 * HOUR;
}

function getInjuryChance(regionLevel: number, heroLevel: number): number {
  const difficulty = Math.max(0, regionLevel - heroLevel);
  if (difficulty <= 0) return 0.05;
  if (difficulty <= 5)  return 0.15;
  if (difficulty <= 10) return 0.30;
  if (difficulty <= 20) return 0.50;
  return 0.70;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Pronto!";
  const totalSec = Math.ceil(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatHealTime(ms: number): string {
  const h = Math.floor(ms / 3600000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h`;
}

type Screen = "map" | "detail" | "select-hero";

export default function WorldMapModal({ onClose }: { onClose: () => void }) {
  const { save, discoverPoi } = useGameStore();
  const [selectedRegionId, setSelectedRegionId] = useState<string>(
    save.worldMap.currentRegionId ?? "reg_valdris"
  );
  const [screen, setScreen] = useState<Screen>("map");
  const [now, setNow] = useState(() => Date.now());

  const exploration = save.worldMap.exploration;
  const injuredHeroes = save.worldMap.injuredHeroes ?? [];

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const playerLevel = save.playerLevel?.level ?? save.invocador?.level ?? 1;
  const discoveredRegions = save.worldMap.discoveredRegions;
  const discoveredPois = save.worldMap.discoveredPois;

  const selectedRegion = REGION_MAP[selectedRegionId];
  const isDiscovered = discoveredRegions.includes(selectedRegionId);
  const canEnter = playerLevel >= (selectedRegion?.level ?? 0);
  const isCurrentRegion = save.worldMap.currentRegionId === selectedRegionId;

  const explorationEndMs = exploration?.endTime ? new Date(exploration.endTime).getTime() : 0;
  const explorationLeft = Math.max(0, explorationEndMs - now);
  const explorationRegion = exploration ? REGION_MAP[exploration.regionId] : null;
  const explorationHero = exploration ? HERO_MAP[exploration.heroId] : null;
  const isExploring = !!exploration && explorationLeft > 0;
  const explorationReady = !!exploration && explorationLeft <= 0;

  const store = useGameStore.getState();
  const collected = Array.from(new Set(save.collectedHeroIds.map((k) => k.split("|")[1])))
    .map((id) => HERO_MAP[id]).filter(Boolean);

  function isHeroInjured(heroId: string): boolean {
    const entry = injuredHeroes.find((h) => h.heroId === heroId);
    if (!entry) return false;
    return new Date(entry.healTime).getTime() > now;
  }

  function heroHealTimeLeft(heroId: string): number {
    const entry = injuredHeroes.find((h) => h.heroId === heroId);
    if (!entry) return 0;
    return Math.max(0, new Date(entry.healTime).getTime() - now);
  }

  function startExploration(heroId: string) {
    if (!selectedRegion) return;
    const duration = getExplorationDuration(selectedRegion.level);
    // eslint-disable-next-line react-hooks/purity
    const endTime = new Date(Date.now() + duration).toISOString();
    useGameStore.setState((s) => {
      s.save.worldMap.exploration = { heroId, regionId: selectedRegionId, endTime };
    });
    scheduleSave();
    setScreen("map");
  }

  function collectExploration() {
    if (!exploration || explorationLeft > 0) return;
    const region = REGION_MAP[exploration.regionId];
    if (!region) return;

    const heroLvl = store.getHeroLevel(exploration.heroId).level;
    const injuryChance = getInjuryChance(region.level, heroLvl);
    const injured = Math.random() < injuryChance;

    useGameStore.setState((s) => {
      // Discover region
      if (!s.save.worldMap.discoveredRegions.includes(exploration.regionId)) {
        s.save.worldMap.discoveredRegions.push(exploration.regionId);
      }
      s.save.worldMap.currentRegionId = exploration.regionId;

      // Injury
      if (injured) {
        const healDuration = 4 * HOUR * Math.max(1, Math.floor(region.level / 10));
        const healTime = new Date(Date.now() + healDuration).toISOString();
        const existing = s.save.worldMap.injuredHeroes.find((h) => h.heroId === exploration.heroId);
        if (existing) {
          existing.healTime = healTime;
        } else {
          s.save.worldMap.injuredHeroes.push({ heroId: exploration.heroId, healTime });
        }
      }
      s.save.worldMap.exploration = null;
    });

    const ouroBonus = region.level * 20 + Math.floor(Math.random() * region.level * 10);
    store.addCurrency("ouro", ouroBonus);
    if (injured) {
      // Show injury result
    }
    scheduleSave();
  }

  function discoverPoiAction(poiId: string) {
    if (discoveredPois.includes(poiId)) return;
    discoverPoi(poiId);
    scheduleSave();
  }

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(10,10,22,0.99)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease }}
    >
      <div className="flex items-center justify-between border-b border-amber/12 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={screen !== "map" ? () => setScreen("map") : onClose}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08 }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {screen !== "map" ? "Voltar" : "Fechar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">MAPA MUNDIAL</span>
        </div>
        <span className="text-[10px] text-violet/60">
          {discoveredRegions.length}/{REGIONS.length} regiões
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Main map */}
        {screen === "map" && (
          <motion.div
            key="map"
            className="flex flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Active exploration banner */}
            {exploration && (
              <div
                className="mx-4 mt-3 rounded-xl border px-4 py-3"
                style={{
                  borderColor: explorationReady ? "rgba(100,220,140,0.4)" : "rgba(200,155,60,0.25)",
                  background: explorationReady ? "rgba(100,220,140,0.06)" : "rgba(200,155,60,0.06)",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{explorationHero?.portrait ?? "⚔"}</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-cream/80">
                      {explorationHero?.name.split(",")[0]} explorando {explorationRegion?.name}
                    </p>
                    {explorationReady ? (
                      <p className="text-[10px] text-green-400 font-bold">Exploração completa!</p>
                    ) : (
                      <p className="text-[10px] text-violet/55">Retorna em {formatCountdown(explorationLeft)}</p>
                    )}
                  </div>
                  {explorationReady && (
                    <motion.button
                      onClick={collectExploration}
                      whileTap={{ scale: 0.95 }}
                      transition={{ duration: 0.08 }}
                      className="rounded-xl border border-green-400/30 px-3 py-1.5 text-[10px] font-bold text-green-400"
                      style={{ background: "rgba(100,220,140,0.08)" }}
                    >
                      RESGATAR
                    </motion.button>
                  )}
                </div>
                {!explorationReady && (
                  <>
                  <div className="mb-2">
                    <ExplorationScene
                      regionName={explorationRegion?.name ?? "Região"}
                      progressPct={Math.min(1, 1 - explorationLeft / getExplorationDuration(explorationRegion?.level ?? 1))}
                      timeLabel={formatCountdown(explorationLeft)}
                    />
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-violet/10">
                    <div
                      className="h-full rounded-full bg-amber"
                      style={{
                        width: `${Math.min(100, ((explorationEndMs - now) <= 0 ? 100 : (1 - explorationLeft / getExplorationDuration(explorationRegion?.level ?? 1)) * 100))}%`,
                        transition: "width 1s linear",
                      }}
                    />
                  </div>
                  </>
                )}
              </div>
            )}

            {/* Injured heroes */}
            {injuredHeroes.filter((h) => heroHealTimeLeft(h.heroId) > 0).length > 0 && (
              <div className="mx-4 mt-2 rounded-xl border border-red-400/20 px-4 py-2.5" style={{ background: "rgba(255,100,100,0.04)" }}>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-red-400/70">Heróis feridos</p>
                <div className="flex flex-wrap gap-2">
                  {injuredHeroes.filter((h) => heroHealTimeLeft(h.heroId) > 0).map((h) => {
                    const hero = HERO_MAP[h.heroId];
                    return hero ? (
                      <div key={h.heroId} className="flex items-center gap-1.5 rounded-lg border border-red-400/15 px-2 py-1" style={{ background: "rgba(255,100,100,0.05)" }}>
                        <span className="text-base opacity-50">{hero.portrait}</span>
                        <div>
                          <p className="text-[9px] font-bold text-red-400/70">{hero.name.split(",")[0]}</p>
                          <p className="text-[9px] text-violet/40">Cura em {formatHealTime(heroHealTimeLeft(h.heroId))}</p>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Region grid */}
            <div className="flex gap-2 overflow-x-auto border-b border-violet/10 px-4 py-3">
              {REGIONS.map((region) => {
                const discovered = discoveredRegions.includes(region.regionId);
                const canReach = playerLevel >= region.level;
                const isCurrent = save.worldMap.currentRegionId === region.regionId;
                const isSelected = selectedRegionId === region.regionId;
                const biomeIcon = BIOME_ICONS[region.biome] ?? "◎";
                return (
                  <motion.button
                    key={region.regionId}
                    onClick={() => { setSelectedRegionId(region.regionId); setScreen("detail"); }}
                    whileTap={{ scale: 0.93 }}
                    transition={{ duration: 0.08 }}
                    className="flex flex-shrink-0 flex-col items-center rounded-xl border px-3 py-2"
                    style={{
                      borderColor: isSelected ? "rgba(200,155,60,0.5)" : isCurrent ? "rgba(100,220,140,0.3)" : discovered ? "rgba(122,111,160,0.2)" : "rgba(122,111,160,0.08)",
                      background: isSelected ? "rgba(200,155,60,0.1)" : "rgba(122,111,160,0.03)",
                      opacity: canReach ? 1 : 0.4,
                    }}
                  >
                    <span className="text-lg">{biomeIcon}</span>
                    <span className="mt-0.5 max-w-[60px] text-center text-[7px] font-bold leading-tight text-cream/70">
                      {region.name.split(" ").slice(0, 2).join(" ")}
                    </span>
                    <span className="text-[7px] text-violet/60">Nv.{region.level}</span>
                    {isCurrent && <span className="mt-0.5 text-[6px] font-bold text-green-400">AQUI</span>}
                  </motion.button>
                );
              })}
            </div>

            {/* Region list quick view */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-violet/60">Regiões</p>
              <div className="flex flex-col gap-2">
                {REGIONS.map((region) => {
                  const discovered = discoveredRegions.includes(region.regionId);
                  const canReach = playerLevel >= region.level;
                  const isCurrent = save.worldMap.currentRegionId === region.regionId;
                  const biomeIcon = BIOME_ICONS[region.biome] ?? "◎";
                  return (
                    <motion.button
                      key={region.regionId}
                      onClick={() => { setSelectedRegionId(region.regionId); setScreen("detail"); }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.08 }}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3 text-left"
                      style={{
                        borderColor: isCurrent ? "rgba(100,220,140,0.25)" : discovered ? "rgba(122,111,160,0.15)" : "rgba(122,111,160,0.07)",
                        background: isCurrent ? "rgba(100,220,140,0.04)" : "rgba(122,111,160,0.03)",
                        opacity: canReach ? 1 : 0.5,
                      }}
                    >
                      <span className="text-2xl">{biomeIcon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] font-bold text-cream/80">{region.name}</p>
                          {isCurrent && <span className="rounded-full border border-green-400/30 px-1.5 py-0.5 text-[7px] font-bold text-green-400">AQUI</span>}
                          {!canReach && <span className="text-[9px] text-violet/35">Nv.{region.level} req.</span>}
                        </div>
                        <p className="text-[10px] text-violet/50">{region.biome} · {discovered ? `${region.pois.length} pontos` : "Não explorado"}</p>
                      </div>
                      <span className="text-[11px] text-violet/30">→</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Region detail */}
        {screen === "detail" && selectedRegion && (
          <motion.div
            key="detail"
            className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease }}
          >
            {/* Region banner */}
            <div
              className="mb-4 rounded-xl border px-5 py-4"
              style={{
                borderColor: isCurrentRegion ? "rgba(100,220,140,0.25)" : isDiscovered ? "rgba(122,111,160,0.2)" : "rgba(122,111,160,0.1)",
                background: isCurrentRegion
                  ? "rgba(100,220,140,0.04)"
                  : "linear-gradient(135deg, rgba(122,111,160,0.06) 0%, rgba(10,10,22,0.97) 80%)",
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{BIOME_ICONS[selectedRegion.biome] ?? "◎"}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-black tracking-[0.1em] text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
                      {selectedRegion.name.toUpperCase()}
                    </h2>
                    {isCurrentRegion && (
                      <span className="rounded-full border border-green-400/30 px-1.5 py-0.5 text-[7px] font-bold text-green-400">AQUI</span>
                    )}
                  </div>
                  <p className="text-[10px] text-violet/60">{selectedRegion.biome} · Nv.{selectedRegion.level}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-violet/55">{selectedRegion.description}</p>
                </div>
              </div>

              {/* Exploration info */}
              <div className="mb-3 rounded-lg border border-violet/10 px-3 py-2.5" style={{ background: "rgba(122,111,160,0.04)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet/50">Explorar a pé</span>
                  <span className="text-[10px] text-violet/40">{formatHealTime(getExplorationDuration(selectedRegion.level))}</span>
                </div>
                {(() => {
                  const injuryBase = getInjuryChance(selectedRegion.level, playerLevel);
                  const color = injuryBase < 0.15 ? "rgb(100,220,140)" : injuryBase < 0.40 ? "rgb(200,155,60)" : "rgb(255,100,100)";
                  return (
                    <p className="text-[10px]" style={{ color }}>
                      Risco de ferimento: ~{Math.round(injuryBase * 100)}% (baseado no seu nível)
                    </p>
                  );
                })()}
                <p className="mt-0.5 text-[9px] text-violet/35">Heróis feridos não podem ir em missões até se curar.</p>
              </div>

              {/* Action button */}
              {!isCurrentRegion && (
                isDiscovered ? (
                  <motion.button
                    onClick={() => {
                      useGameStore.setState((s) => { s.save.worldMap.currentRegionId = selectedRegionId; });
                      scheduleSave();
                      setScreen("map");
                    }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.08 }}
                    className="w-full rounded-lg border py-2.5 text-[11px] font-bold tracking-wider"
                    style={{ borderColor: "rgba(100,220,140,0.3)", background: "rgba(100,220,140,0.06)", color: "rgb(100,220,140)" }}
                  >
                    IR PARA ESTA REGIÃO
                  </motion.button>
                ) : canEnter && !isExploring ? (
                  <motion.button
                    onClick={() => setScreen("select-hero")}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.08 }}
                    className="w-full rounded-lg border py-2.5 text-[11px] font-bold tracking-wider"
                    style={{ borderColor: "rgba(200,155,60,0.4)", background: "rgba(200,155,60,0.1)", color: "rgb(200,155,60)" }}
                  >
                    ENVIAR HERÓI PARA EXPLORAR
                  </motion.button>
                ) : isExploring ? (
                  <p className="text-center text-[11px] text-violet/40">Herói já em exploração — aguarde o retorno.</p>
                ) : (
                  <p className="text-center text-[11px] text-violet/35">Requer nível {selectedRegion.level}</p>
                )
              )}
            </div>

            {/* POIs — only if discovered */}
            {isDiscovered && (
              <>
                <p className="mb-2.5 text-[11px] uppercase tracking-[0.2em] text-violet/60">Pontos de Interesse</p>
                <div className="flex flex-col gap-2">
                  {selectedRegion.pois.map((poi) => {
                    const poiDiscovered = discoveredPois.includes(poi.poiId);
                    const poiColor = POI_COLORS[poi.type] ?? "rgba(122,111,160,0.6)";
                    const poiIcon = POI_ICONS[poi.type] ?? "◎";
                    return (
                      <div
                        key={poi.poiId}
                        className="flex items-center justify-between rounded-xl border px-4 py-3"
                        style={{
                          borderColor: poiDiscovered ? `${poiColor}30` : "rgba(122,111,160,0.1)",
                          background: poiDiscovered ? `${poiColor}06` : "rgba(122,111,160,0.03)",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm"
                            style={{ borderColor: `${poiColor}25`, background: `${poiColor}10`, color: poiColor }}
                          >
                            {poiIcon}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-cream/80">{poi.name}</p>
                            <p className="text-[10px] font-bold capitalize" style={{ color: poiColor, opacity: 0.75 }}>{poi.type}</p>
                          </div>
                        </div>
                        {poiDiscovered ? (
                          <span className="text-[10px] text-green-400">✓</span>
                        ) : (
                          <motion.button
                            onClick={() => discoverPoiAction(poi.poiId)}
                            whileTap={{ scale: 0.93 }}
                            transition={{ duration: 0.08 }}
                            className="rounded-lg border border-violet/20 px-2.5 py-1 text-[10px] font-bold text-violet/55"
                            style={{ background: "rgba(122,111,160,0.06)" }}
                          >
                            EXPLORAR
                          </motion.button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {!isDiscovered && (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <p className="text-3xl">🔒</p>
                <p className="text-[12px] font-bold text-cream/50">Região não explorada</p>
                <p className="text-[11px] text-violet/40">
                  Envie um herói para explorar e revelar os pontos de interesse desta região.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Hero selection for exploration */}
        {screen === "select-hero" && selectedRegion && (
          <motion.div
            key="select-hero"
            className="flex flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease }}
          >
            <div className="border-b border-violet/10 px-4 py-3">
              <p className="text-[11px] font-bold text-cream/70">Explorar {selectedRegion.name}</p>
              <p className="text-[10px] text-violet/50">
                {formatHealTime(getExplorationDuration(selectedRegion.level))} de viagem · Nv.{selectedRegion.level}
              </p>
            </div>

            <div className="px-4 pt-4 pb-2">
              <p className="text-[11px] uppercase tracking-[0.2em] text-violet/60">Escolha um herói</p>
              <p className="mt-1 text-[10px] text-violet/40">
                Heróis feridos não podem ser enviados. Heróis mais fortes têm menor chance de ferimento.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {collected.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-[11px] text-violet/40">Nenhum herói coletado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {collected.map((hero) => {
                    if (!hero) return null;
                    const injured = isHeroInjured(hero.heroId);
                    const busy = exploration?.heroId === hero.heroId;
                    const lvl = store.getHeroLevel(hero.heroId);
                    const injuryChance = getInjuryChance(selectedRegion.level, lvl.level);
                    const injChColor = injuryChance < 0.15 ? "rgb(100,220,140)" : injuryChance < 0.40 ? "rgb(200,155,60)" : "rgb(255,100,100)";
                    const disabled = injured || busy;
                    return (
                      <motion.button
                        key={hero.heroId}
                        onClick={disabled ? undefined : () => startExploration(hero.heroId)}
                        whileTap={disabled ? undefined : { scale: 0.94 }}
                        transition={{ duration: 0.08 }}
                        className="flex flex-col items-center rounded-xl border pb-3 pt-3 px-2"
                        style={{
                          borderColor: disabled ? "rgba(122,111,160,0.08)" : "rgba(122,111,160,0.18)",
                          background: disabled ? "transparent" : "rgba(122,111,160,0.04)",
                          opacity: disabled ? 0.4 : 1,
                        }}
                      >
                        <span className="mb-1 text-2xl">{hero.portrait}</span>
                        <p className="text-[11px] font-bold text-cream/70">{hero.name.split(",")[0]}</p>
                        <p className="text-[9px] text-violet/45">Nv.{lvl.level}</p>
                        {injured && <p className="mt-1 text-[9px] font-bold text-red-400">FERIDO</p>}
                        {busy && <p className="mt-1 text-[9px] font-bold text-amber/70">EM MISSÃO</p>}
                        {!disabled && (
                          <p className="mt-1 text-[9px]" style={{ color: injChColor }}>
                            {Math.round(injuryChance * 100)}% risco
                          </p>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
