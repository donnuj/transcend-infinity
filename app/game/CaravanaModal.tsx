"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { scheduleSave } from "@/lib/game/save";

const ease = [0.23, 1, 0.32, 1] as const;

type Route = {
  id: string;
  name: string;
  from: string;
  to: string;
  durationMs: number;
  minInvest: number;
  maxInvest: number;
  returnMultiplier: number;
  riskLevel: "Baixo" | "Médio" | "Alto";
  icon: string;
  description: string;
};

const ROUTES: Route[] = [
  {
    id: "route_valdris_picos",
    name: "Rota das Montanhas",
    from: "Valdris",
    to: "Picos Eternos",
    durationMs: 2 * 60 * 1000,
    minInvest: 100,
    maxInvest: 2000,
    returnMultiplier: 1.3,
    riskLevel: "Baixo",
    icon: "🏔",
    description: "Rota segura carregando minérios e pedras preciosas.",
  },
  {
    id: "route_mar_floresta",
    name: "Rota Costeira",
    from: "Porto de Lyra",
    to: "Floresta Eterna",
    durationMs: 4 * 60 * 1000,
    minInvest: 300,
    maxInvest: 5000,
    returnMultiplier: 1.55,
    riskLevel: "Médio",
    icon: "⛵",
    description: "Madeiras raras e ervas mágicas da floresta.",
  },
  {
    id: "route_deserto",
    name: "Rota do Deserto",
    from: "Valdris",
    to: "Deserto Cinza",
    durationMs: 8 * 60 * 1000,
    minInvest: 500,
    maxInvest: 10000,
    returnMultiplier: 2.0,
    riskLevel: "Alto",
    icon: "🐫",
    description: "Artefatos antigos e relíquias da civilização perdida.",
  },
  {
    id: "route_celestial",
    name: "Rota Celestial",
    from: "Planície do Céu",
    to: "Valdris",
    durationMs: 12 * 60 * 1000,
    minInvest: 1000,
    maxInvest: 20000,
    returnMultiplier: 2.8,
    riskLevel: "Alto",
    icon: "✦",
    description: "Cristais Astra e artefatos dos Arcontes.",
  },
];

const RISK_COLORS: Record<string, string> = {
  Baixo: "rgb(100,220,140)",
  Médio: "rgb(200,155,60)",
  Alto:  "rgb(255,100,100)",
};

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s > 0 ? `${s}s` : ""}`.trim();
}

export default function CaravanaModal({ onClose }: { onClose: () => void }) {
  const { save, incrementDailyProgress } = useGameStore();
  const caravan = save.caravan;
  const [selected, setSelected] = useState<Route | null>(null);
  const [investAmount, setInvestAmount] = useState(500);
  const [now, setNow] = useState(Date.now());

  // Live countdown
  useEffect(() => {
    if (!caravan.inTransit) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [caravan.inTransit]);

  const arrivalMs = caravan.arrivalTime ? new Date(caravan.arrivalTime).getTime() : 0;
  const timeLeft = Math.max(0, arrivalMs - now);
  const activeRoute = ROUTES.find((r) => r.id === caravan.activeRouteId);

  function getRouteDuration(route: Route): number {
    const isSea = route.icon === "⛵";
    if (isSea && save.travel.hasShip) return route.durationMs * 0.5;
    if (!isSea && save.travel.hasHorse) return route.durationMs * 0.4;
    return route.durationMs;
  }

  function dispatch(route: Route) {
    if (caravan.inTransit) return;
    if (save.wallet.ouro < investAmount) return;
    const duration = getRouteDuration(route);
    const arrival = new Date(Date.now() + duration).toISOString();
    useGameStore.setState((s) => {
      s.save.wallet.ouro -= investAmount;
      s.save.caravan.activeRouteId = route.id;
      s.save.caravan.investedGold = investAmount;
      s.save.caravan.inTransit = true;
      s.save.caravan.arrivalTime = arrival;
    });
    setSelected(null);
    scheduleSave();
  }

  function collect() {
    if (!caravan.inTransit || timeLeft > 0) return;
    const route = ROUTES.find((r) => r.id === caravan.activeRouteId);
    if (!route) return;
    const profit = Math.floor(caravan.investedGold * route.returnMultiplier);
    useGameStore.getState().addCurrency("ouro", profit);
    useGameStore.setState((s) => {
      s.save.caravan.inTransit = false;
      s.save.caravan.activeRouteId = "";
      s.save.caravan.investedGold = 0;
      s.save.caravan.arrivalTime = "";
    });
    incrementDailyProgress("caravan_today");
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
          <span className="text-[11px] font-bold tracking-widest text-cream/70">CARAVANA</span>
        </div>
        <span className="text-[10px] font-bold" style={{ color: caravan.inTransit ? "rgb(100,220,140)" : "rgba(122,111,160,0.5)" }}>
          {caravan.inTransit ? "EM TRÂNSITO" : "DISPONÍVEL"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Active transit */}
        {caravan.inTransit && activeRoute && (
          <div
            className="mb-5 mt-4 rounded-xl border border-amber/25 px-5 py-5"
            style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.08) 0%, rgba(10,10,22,0.97) 70%)" }}
          >
            <p className="mb-2 text-[9px] uppercase tracking-[0.2em] text-violet/40">Caravana em rota</p>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{activeRoute.icon}</span>
              <div>
                <p className="text-[14px] font-black tracking-wide text-cream">{activeRoute.name}</p>
                <p className="text-[9px] text-violet/45">{activeRoute.from} → {activeRoute.to}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg border border-amber/15 px-3 py-2" style={{ background: "rgba(200,155,60,0.06)" }}>
                <p className="text-[8px] text-violet/40">Investido</p>
                <p className="text-[13px] font-black text-amber-400">{caravan.investedGold.toLocaleString("pt-BR")} ouro</p>
              </div>
              <div className="rounded-lg border border-amber/15 px-3 py-2" style={{ background: "rgba(200,155,60,0.06)" }}>
                <p className="text-[8px] text-violet/40">Retorno esperado</p>
                <p className="text-[13px] font-black text-green-400">
                  {Math.floor(caravan.investedGold * activeRoute.returnMultiplier).toLocaleString("pt-BR")} ouro
                </p>
              </div>
            </div>
            {timeLeft > 0 ? (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[9px] text-violet/40">Chegada em</span>
                  <span className="text-[11px] font-bold text-cream/70">{formatTime(timeLeft)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-violet/10">
                  <motion.div
                    className="h-full rounded-full bg-amber"
                    style={{
                      width: `${Math.max(0, 100 - (timeLeft / activeRoute.durationMs) * 100)}%`,
                      boxShadow: "0 0 8px rgba(200,155,60,0.5)",
                    }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              </div>
            ) : (
              <motion.button
                onClick={collect}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                className="w-full rounded-xl border border-green-400/30 py-3 text-[12px] font-bold tracking-[0.15em] text-green-400"
                style={{ background: "rgba(100,220,140,0.08)" }}
              >
                RESGATAR LUCRO
              </motion.button>
            )}
          </div>
        )}

        {/* Route selection */}
        {!caravan.inTransit && (
          <>
            <p className="mb-3 mt-4 text-[9px] uppercase tracking-[0.2em] text-violet/40">Rotas disponíveis</p>
            <div className="flex flex-col gap-2.5 mb-5">
              {ROUTES.map((route) => {
                const riskColor = RISK_COLORS[route.riskLevel];
                const isSelected = selected?.id === route.id;
                return (
                  <motion.button
                    key={route.id}
                    onClick={() => setSelected(isSelected ? null : route)}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                    className="rounded-xl border px-4 py-3 text-left"
                    style={{
                      borderColor: isSelected ? "rgba(200,155,60,0.4)" : "rgba(122,111,160,0.12)",
                      background: isSelected ? "rgba(200,155,60,0.07)" : "rgba(122,111,160,0.03)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{route.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-cream/85">{route.name}</span>
                          <span className="text-[7px] font-bold rounded-full px-1.5 py-0.5 border"
                            style={{ color: riskColor, borderColor: `${riskColor}35`, background: `${riskColor}10` }}>
                            {route.riskLevel}
                          </span>
                        </div>
                        <p className="text-[8px] text-violet/45">{route.from} → {route.to}</p>
                        <p className="mt-0.5 text-[8px] text-violet/35">{route.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-green-400">×{route.returnMultiplier}</p>
                        <p className="text-[7px] text-violet/35">{formatTime(route.durationMs)}</p>
                      </div>
                    </div>

                    {/* Invest controls */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease }}
                          className="mt-3 overflow-hidden"
                        >
                          <div className="border-t border-amber/12 pt-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-[9px] text-violet/50">Investimento</span>
                              <span className="text-[10px] font-bold text-cream/70">
                                {investAmount.toLocaleString("pt-BR")} ouro
                              </span>
                            </div>
                            <input
                              type="range"
                              min={route.minInvest}
                              max={Math.min(route.maxInvest, save.wallet.ouro)}
                              step={100}
                              value={Math.min(investAmount, save.wallet.ouro)}
                              onChange={(e) => setInvestAmount(Number(e.target.value))}
                              className="mb-2 w-full accent-amber-400"
                            />
                            <div className="mb-3 flex justify-between text-[7px] text-violet/35">
                              <span>{route.minInvest.toLocaleString()} min</span>
                              <span>→ {Math.floor(investAmount * route.returnMultiplier).toLocaleString()} ouro</span>
                            </div>
                            <motion.button
                              onClick={(e) => { e.stopPropagation(); dispatch(route); }}
                              whileTap={{ scale: 0.95 }}
                              transition={{ duration: 0.08, ease: [0.23, 1, 0.32, 1] }}
                              className="w-full rounded-lg border py-2.5 text-[11px] font-bold tracking-[0.15em]"
                              style={{
                                borderColor: save.wallet.ouro >= route.minInvest ? "rgba(200,155,60,0.45)" : "rgba(122,111,160,0.15)",
                                background: save.wallet.ouro >= route.minInvest ? "rgba(200,155,60,0.12)" : "transparent",
                                color: save.wallet.ouro >= route.minInvest ? "rgb(200,155,60)" : "rgba(122,111,160,0.35)",
                              }}
                            >
                              ENVIAR CARAVANA
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </>
        )}

        <p className="text-center text-[9px] text-violet/30">
          Ouro disponível: <span className="font-bold text-amber-400">{save.wallet.ouro.toLocaleString("pt-BR")}</span>
        </p>
      </div>
    </motion.div>
  );
}
