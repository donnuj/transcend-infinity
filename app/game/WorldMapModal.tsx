"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";
import { REGIONS, REGION_MAP } from "@/lib/game/data/world";

const ease = [0.23, 1, 0.32, 1] as const;

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

export default function WorldMapModal({ onClose }: { onClose: () => void }) {
  const { save, discoverRegion, discoverPoi } = useGameStore();
  const [selectedRegionId, setSelectedRegionId] = useState<string>(
    save.worldMap.currentRegionId ?? "reg_valdris"
  );

  const playerLevel = save.playerLevel.level;
  const discoveredRegions = save.worldMap.discoveredRegions;
  const discoveredPois = save.worldMap.discoveredPois;
  const currentRegionId = save.worldMap.currentRegionId;

  function travelTo(regionId: string) {
    const region = REGION_MAP[regionId];
    if (!region || playerLevel < region.level) return;
    useGameStore.setState((s) => {
      s.save.worldMap.currentRegionId = regionId;
    });
    if (!discoveredRegions.includes(regionId)) {
      discoverRegion(regionId);
    }
    scheduleSave();
  }

  function explorePoi(poiId: string) {
    if (discoveredPois.includes(poiId)) return;
    discoverPoi(poiId);
    scheduleSave();
  }

  const selectedRegion = REGION_MAP[selectedRegionId];
  const isCurrentRegion = currentRegionId === selectedRegionId;
  const isDiscovered = discoveredRegions.includes(selectedRegionId);
  const canTravel = playerLevel >= (selectedRegion?.level ?? 0);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(10,10,22,0.99)" }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.25, ease }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber/12 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={onClose}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← Fechar
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">MAPA MUNDIAL</span>
        </div>
        <span className="text-[10px] text-violet/60">
          {discoveredRegions.length} / {REGIONS.length} regiões
        </span>
      </div>

      <div className="flex h-full flex-col overflow-hidden">
        {/* Region selector — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto border-b border-violet/10 px-4 py-3 pb-3">
          {REGIONS.map((region) => {
            const discovered = discoveredRegions.includes(region.regionId);
            const canReach = playerLevel >= region.level;
            const isCurrent = currentRegionId === region.regionId;
            const isSelected = selectedRegionId === region.regionId;
            const biomeIcon = BIOME_ICONS[region.biome] ?? "◎";
            return (
              <motion.button
                key={region.regionId}
                onClick={() => setSelectedRegionId(region.regionId)}
                whileTap={{ scale: 0.93 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="flex flex-shrink-0 flex-col items-center rounded-xl border px-3 py-2"
                style={{
                  borderColor: isSelected
                    ? "rgba(200,155,60,0.5)"
                    : isCurrent
                    ? "rgba(100,220,140,0.3)"
                    : discovered
                    ? "rgba(122,111,160,0.2)"
                    : "rgba(122,111,160,0.08)",
                  background: isSelected
                    ? "rgba(200,155,60,0.1)"
                    : "rgba(122,111,160,0.03)",
                  opacity: canReach ? 1 : 0.4,
                }}
              >
                <span className="text-lg">{biomeIcon}</span>
                <span className="mt-0.5 max-w-[60px] text-center text-[7px] font-bold leading-tight text-cream/70">
                  {region.name.split(" ").slice(0, 2).join(" ")}
                </span>
                <span className="text-[7px] text-violet/60">Nv.{region.level}</span>
                {isCurrent && <span className="mt-0.5 text-[6px] font-bold text-green-400">ATUAL</span>}
              </motion.button>
            );
          })}
        </div>

        {/* Selected region detail */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedRegionId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease }}
            >
              {selectedRegion && (
                <>
                  {/* Region banner */}
                  <div
                    className="mb-4 rounded-xl border px-5 py-4"
                    style={{
                      borderColor: isCurrentRegion ? "rgba(100,220,140,0.25)" : "rgba(122,111,160,0.15)",
                      background: isCurrentRegion
                        ? "rgba(100,220,140,0.04)"
                        : "linear-gradient(135deg, rgba(122,111,160,0.06) 0%, rgba(10,10,22,0.97) 80%)",
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{BIOME_ICONS[selectedRegion.biome] ?? "◎"}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-[15px] font-black tracking-[0.1em] text-cream" style={{ fontFamily: "var(--font-cinzel)" }}>
                            {selectedRegion.name.toUpperCase()}
                          </h2>
                          {isCurrentRegion && (
                            <span className="rounded-full border border-green-400/30 px-1.5 py-0.5 text-[7px] font-bold text-green-400">
                              AQUI
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-violet/60">{selectedRegion.biome} · Nv.{selectedRegion.level}</p>
                        <p className="mt-1 text-[11px] leading-relaxed text-violet/55">{selectedRegion.description}</p>
                      </div>
                    </div>

                    {!isCurrentRegion && (
                      <motion.button
                        onClick={canTravel ? () => travelTo(selectedRegion.regionId) : undefined}
                        whileTap={canTravel ? { scale: 0.95 } : undefined}
                        transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                        className="mt-4 w-full rounded-lg border py-2.5 text-[11px] font-bold tracking-[0.15em]"
                        style={{
                          borderColor: canTravel ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.15)",
                          background: canTravel ? "rgba(200,155,60,0.1)" : "transparent",
                          color: canTravel ? "rgb(200,155,60)" : "rgba(122,111,160,0.35)",
                        }}
                      >
                        {canTravel ? "VIAJAR PARA ESTA REGIÃO" : `REQUER NÍVEL ${selectedRegion.level}`}
                      </motion.button>
                    )}
                  </div>

                  {/* POIs */}
                  <p className="mb-2.5 text-[11px] uppercase tracking-[0.2em] text-violet/60">
                    Pontos de Interesse
                  </p>
                  <div className="flex flex-col gap-2">
                    {selectedRegion.pois.map((poi) => {
                      const poiDiscovered = discoveredPois.includes(poi.poiId);
                      const poiColor = POI_COLORS[poi.type] ?? "rgba(122,111,160,0.6)";
                      const poiIcon = POI_ICONS[poi.type] ?? "◎";
                      const canExplore = isDiscovered && !poiDiscovered;
                      return (
                        <div
                          key={poi.poiId}
                          className="flex items-center justify-between rounded-xl border px-4 py-3"
                          style={{
                            borderColor: poiDiscovered ? `${poiColor}30` : "rgba(122,111,160,0.1)",
                            background: poiDiscovered ? `${poiColor}06` : "rgba(122,111,160,0.03)",
                            opacity: isDiscovered ? 1 : 0.4,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm"
                              style={{
                                borderColor: `${poiColor}25`,
                                background: `${poiColor}10`,
                                color: poiColor,
                              }}
                            >
                              {poiIcon}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-cream/80">{poi.name}</p>
                              <p className="text-[10px] font-bold capitalize" style={{ color: poiColor, opacity: 0.75 }}>
                                {poi.type}
                              </p>
                            </div>
                          </div>
                          {poiDiscovered ? (
                            <span className="text-[10px] text-green-400">✓</span>
                          ) : canExplore ? (
                            <motion.button
                              onClick={() => explorePoi(poi.poiId)}
                              whileTap={{ scale: 0.93 }}
                              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                              className="rounded-lg border border-violet/20 px-2.5 py-1 text-[10px] font-bold text-violet/55"
                              style={{ background: "rgba(122,111,160,0.06)" }}
                            >
                              EXPLORAR
                            </motion.button>
                          ) : (
                            <span className="text-[10px] text-violet/25">?</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Discover all button */}
                  {isDiscovered && selectedRegion.pois.some((p) => !discoveredPois.includes(p.poiId)) && (
                    <motion.button
                      onClick={() => {
                        for (const poi of selectedRegion.pois)
                          if (!discoveredPois.includes(poi.poiId)) discoverPoi(poi.poiId);
                        scheduleSave();
                      }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                      className="mt-3 w-full rounded-xl border border-violet/12 py-2.5 text-[11px] font-bold tracking-wider text-violet/60"
                      style={{ background: "rgba(122,111,160,0.03)" }}
                    >
                      REVELAR TODOS OS POIs
                    </motion.button>
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
