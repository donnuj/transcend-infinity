"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/game/store";
import { HERO_MAP } from "@/lib/game/data/heroes";
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
  riskLevel: "Baixo" | "Médio" | "Alto" | "Extremo";
  icon: string;
  description: string;
  quest: string;
  minHeroes: number;
  baseSuccessChance: number;
};

const HOUR = 60 * 60 * 1000;

const ROUTES: Route[] = [
  {
    id: "route_valdris_picos",
    name: "Rota das Montanhas",
    from: "Valdris",
    to: "Picos Eternos",
    durationMs: 4 * HOUR,
    minInvest: 200,
    maxInvest: 3000,
    returnMultiplier: 1.4,
    riskLevel: "Baixo",
    icon: "🏔",
    description: "Minérios e pedras preciosas atravessando os picos nevados.",
    quest: "Missão: Entregar 500 ouro em suprimentos para o forte dos Picos.",
    minHeroes: 1,
    baseSuccessChance: 0.90,
  },
  {
    id: "route_floresta",
    name: "Rota da Floresta Sombria",
    from: "Valdris",
    to: "Floresta Eterna",
    durationMs: 8 * HOUR,
    minInvest: 400,
    maxInvest: 6000,
    returnMultiplier: 1.65,
    riskLevel: "Médio",
    icon: "🌲",
    description: "Madeiras raras e ervas mágicas. Criaturas rondam o caminho.",
    quest: "Missão: Escortar um estudioso de botânica até o coração da floresta.",
    minHeroes: 2,
    baseSuccessChance: 0.75,
  },
  {
    id: "route_mar_costa",
    name: "Rota Costeira",
    from: "Porto de Lyra",
    to: "Ilhas Dispersas",
    durationMs: 16 * HOUR,
    minInvest: 800,
    maxInvest: 12000,
    returnMultiplier: 2.0,
    riskLevel: "Médio",
    icon: "⛵",
    description: "Especiarias e runas do arquipélago. Piratas frequentes.",
    quest: "Missão: Resgatar náufragos e recuperar carga perdida.",
    minHeroes: 2,
    baseSuccessChance: 0.70,
  },
  {
    id: "route_deserto",
    name: "Rota do Deserto Cinza",
    from: "Valdris",
    to: "Deserto Cinza",
    durationMs: 24 * HOUR,
    minInvest: 1000,
    maxInvest: 20000,
    returnMultiplier: 2.5,
    riskLevel: "Alto",
    icon: "🐫",
    description: "Artefatos antigos e relíquias de civilizações perdidas. Saqueadores organizados.",
    quest: "Missão: Recuperar o Códex Perdido das Areias para o Círculo dos Druidas.",
    minHeroes: 3,
    baseSuccessChance: 0.55,
  },
  {
    id: "route_vulcao",
    name: "Rota do Vulcão",
    from: "Valdris",
    to: "Núcleo Vulcânico",
    durationMs: 36 * HOUR,
    minInvest: 2000,
    maxInvest: 40000,
    returnMultiplier: 3.2,
    riskLevel: "Extremo",
    icon: "🌋",
    description: "Cristais de magma e metais raros. Criaturas de fogo e cultistas.",
    quest: "Missão: Roubar o Coração de Chama dos cultistas do Wyrm.",
    minHeroes: 3,
    baseSuccessChance: 0.40,
  },
  {
    id: "route_celestial",
    name: "Rota Celestial",
    from: "Planície do Céu",
    to: "Valdris",
    durationMs: 48 * HOUR,
    minInvest: 5000,
    maxInvest: 80000,
    returnMultiplier: 4.0,
    riskLevel: "Extremo",
    icon: "✦",
    description: "Cristais Astra e artefatos dos Arcontes. Guardiões divinos patrulham o caminho.",
    quest: "Missão: Transportar uma Semente do Vazio para o Santuário dos Arcontes.",
    minHeroes: 3,
    baseSuccessChance: 0.30,
  },
];

const RISK_COLORS: Record<string, string> = {
  Baixo:   "rgb(100,220,140)",
  Médio:   "rgb(200,155,60)",
  Alto:    "rgb(255,100,100)",
  Extremo: "rgb(220,80,255)",
};

function formatDuration(ms: number): string {
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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

function calcSuccessChance(route: Route, heroCount: number, heroAvgLevel: number): number {
  const heroPower = Math.min(heroCount / route.minHeroes, 1.5) * (1 + heroAvgLevel / 100);
  const chance = Math.min(0.98, route.baseSuccessChance * heroPower);
  return chance;
}

type Screen = "list" | "select-heroes" | "active";

export default function CaravanaModal({ onClose }: { onClose: () => void }) {
  const { save, incrementDailyProgress } = useGameStore();
  const caravan = save.caravan;
  const [screen, setScreen] = useState<Screen>(caravan.inTransit ? "active" : "list");
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [assignedHeroes, setAssignedHeroes] = useState<string[]>([]);
  const [investAmount, setInvestAmount] = useState(500);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!caravan.inTransit) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [caravan.inTransit]);

  const arrivalMs = caravan.arrivalTime ? new Date(caravan.arrivalTime).getTime() : 0;
  const timeLeft = Math.max(0, arrivalMs - now);
  const activeRoute = ROUTES.find((r) => r.id === caravan.activeRouteId);
  const store = useGameStore.getState();

  const collected = Array.from(new Set(save.collectedHeroIds.map((k) => k.split("|")[1])))
    .map((id) => HERO_MAP[id]).filter(Boolean);

  const successChancePreview = selectedRoute
    ? calcSuccessChance(
        selectedRoute,
        assignedHeroes.length,
        assignedHeroes.reduce((s, id) => s + store.getHeroLevel(id).level, 0) / Math.max(1, assignedHeroes.length),
      )
    : 0;

  function dispatch() {
    if (!selectedRoute || caravan.inTransit) return;
    if (save.wallet.ouro < investAmount) return;
    if (assignedHeroes.length < selectedRoute.minHeroes) return;
    const avgLevel = assignedHeroes.reduce((s, id) => s + store.getHeroLevel(id).level, 0) / assignedHeroes.length;
    const chance = calcSuccessChance(selectedRoute, assignedHeroes.length, avgLevel);
    const arrival = new Date(Date.now() + selectedRoute.durationMs).toISOString();
    useGameStore.setState((s) => {
      s.save.wallet.ouro -= investAmount;
      s.save.caravan.activeRouteId = selectedRoute.id;
      s.save.caravan.investedGold = investAmount;
      s.save.caravan.inTransit = true;
      s.save.caravan.arrivalTime = arrival;
      s.save.caravan.assignedHeroIds = assignedHeroes;
      s.save.caravan.successChance = chance;
    });
    setScreen("active");
    scheduleSave();
  }

  function collect() {
    if (!caravan.inTransit || timeLeft > 0 || !activeRoute) return;
    const roll = Math.random();
    const success = roll <= (caravan.successChance ?? 0.7);
    if (success) {
      const profit = Math.floor(caravan.investedGold * activeRoute.returnMultiplier);
      useGameStore.getState().addCurrency("ouro", profit);
      incrementDailyProgress("caravan_today");
    } else {
      // Partial return on failure
      const partial = Math.floor(caravan.investedGold * 0.3);
      if (partial > 0) useGameStore.getState().addCurrency("ouro", partial);
    }
    useGameStore.setState((s) => {
      s.save.caravan.inTransit = false;
      s.save.caravan.activeRouteId = "";
      s.save.caravan.investedGold = 0;
      s.save.caravan.arrivalTime = "";
      s.save.caravan.assignedHeroIds = [];
      s.save.caravan.successChance = 1;
    });
    scheduleSave();
    setScreen("list");
  }

  const activeElapsed = activeRoute ? activeRoute.durationMs - timeLeft : 0;
  const activeProgress = activeRoute ? Math.min(1, activeElapsed / activeRoute.durationMs) : 0;

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
            onClick={screen === "list" || screen === "active" ? onClose : () => setScreen("list")}
            whileTap={{ scale: 0.94 }}
            transition={{ duration: 0.08 }}
            className="text-[10px] font-bold tracking-widest text-violet/60"
          >
            ← {screen === "select-heroes" ? "Voltar" : "Fechar"}
          </motion.button>
          <span className="h-4 w-[1px] bg-violet/20" />
          <span className="text-[11px] font-bold tracking-widest text-cream/70">CARAVANA</span>
        </div>
        <span className="text-[10px] font-bold" style={{ color: caravan.inTransit ? "rgb(100,220,140)" : "rgba(122,111,160,0.5)" }}>
          {caravan.inTransit ? "EM TRÂNSITO" : "DISPONÍVEL"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* Active transit screen */}
        {screen === "active" && caravan.inTransit && activeRoute && (
          <motion.div
            key="active"
            className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <div
              className="rounded-xl border border-amber/25 px-5 py-5 mb-4"
              style={{ background: "linear-gradient(135deg, rgba(200,155,60,0.08) 0%, rgba(10,10,22,0.97) 70%)" }}
            >
              <p className="mb-2 text-[11px] uppercase tracking-[0.2em] text-violet/60">Caravana em rota</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{activeRoute.icon}</span>
                <div>
                  <p className="text-[14px] font-black tracking-wide text-cream">{activeRoute.name}</p>
                  <p className="text-[11px] text-violet/65">{activeRoute.from} → {activeRoute.to}</p>
                </div>
              </div>

              <div className="mb-3 rounded-lg border border-violet/10 px-3 py-2 text-[10px] text-violet/55" style={{ background: "rgba(122,111,160,0.04)" }}>
                {activeRoute.quest}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 text-[10px]">
                <div className="rounded-lg border border-amber/15 px-2 py-2 text-center" style={{ background: "rgba(200,155,60,0.06)" }}>
                  <p className="text-violet/50">Investido</p>
                  <p className="font-black text-amber-400">{caravan.investedGold.toLocaleString("pt-BR")}</p>
                </div>
                <div className="rounded-lg border border-green-400/15 px-2 py-2 text-center" style={{ background: "rgba(100,220,140,0.04)" }}>
                  <p className="text-violet/50">Retorno</p>
                  <p className="font-black text-green-400">{Math.floor(caravan.investedGold * activeRoute.returnMultiplier).toLocaleString("pt-BR")}</p>
                </div>
                <div className="rounded-lg border border-violet/10 px-2 py-2 text-center" style={{ background: "rgba(122,111,160,0.04)" }}>
                  <p className="text-violet/50">Sucesso</p>
                  <p className="font-black text-cream/70">{Math.round((caravan.successChance ?? 0.7) * 100)}%</p>
                </div>
              </div>

              {/* Assigned heroes */}
              {(caravan.assignedHeroIds?.length ?? 0) > 0 && (
                <div className="mb-4">
                  <p className="mb-1.5 text-[10px] text-violet/50">Heróis na missão</p>
                  <div className="flex gap-2">
                    {(caravan.assignedHeroIds ?? []).map((heroId) => {
                      const hero = HERO_MAP[heroId];
                      return hero ? (
                        <div key={heroId} className="flex items-center gap-1.5 rounded-lg border border-violet/15 px-2 py-1" style={{ background: "rgba(122,111,160,0.05)" }}>
                          <span className="text-base">{hero.portrait}</span>
                          <span className="text-[10px] text-cream/60">{hero.name.split(",")[0]}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {timeLeft > 0 ? (
                <>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] text-violet/60">Retorno em</span>
                    <span className="text-[13px] font-black text-cream/80">{formatCountdown(timeLeft)}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-violet/10">
                    <div
                      className="h-full rounded-full bg-amber"
                      style={{ width: `${activeProgress * 100}%`, boxShadow: "0 0 8px rgba(200,155,60,0.5)", transition: "width 1s linear" }}
                    />
                  </div>
                </>
              ) : (
                <motion.button
                  onClick={collect}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.08 }}
                  className="w-full rounded-xl border py-3 text-[12px] font-bold tracking-[0.15em]"
                  style={{ borderColor: "rgba(100,220,140,0.4)", background: "rgba(100,220,140,0.1)", color: "rgb(100,220,140)" }}
                >
                  RESGATAR RESULTADO
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Route list */}
        {screen === "list" && !caravan.inTransit && (
          <motion.div
            key="list"
            className="flex flex-1 flex-col overflow-y-auto px-4 py-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-violet/60">Rotas disponíveis</p>
            <p className="mb-4 text-[10px] text-violet/40">
              Caravanas exigem heróis alocados. Mais heróis de alto nível aumentam a chance de sucesso. O tempo de viagem é realista — planeje bem.
            </p>

            <div className="flex flex-col gap-2.5 mb-5">
              {ROUTES.map((route) => {
                const riskColor = RISK_COLORS[route.riskLevel];
                const canAfford = save.wallet.ouro >= route.minInvest;
                return (
                  <motion.button
                    key={route.id}
                    onClick={canAfford ? () => {
                      setSelectedRoute(route);
                      setAssignedHeroes([]);
                      setInvestAmount(Math.min(route.maxInvest, Math.max(route.minInvest, Math.floor(save.wallet.ouro * 0.3))));
                      setScreen("select-heroes");
                    } : undefined}
                    whileTap={canAfford ? { scale: 0.97 } : undefined}
                    transition={{ duration: 0.08 }}
                    className="rounded-xl border px-4 py-3.5 text-left"
                    style={{
                      borderColor: canAfford ? "rgba(122,111,160,0.18)" : "rgba(122,111,160,0.07)",
                      background: canAfford ? "rgba(122,111,160,0.04)" : "rgba(122,111,160,0.01)",
                      opacity: canAfford ? 1 : 0.5,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-2xl">{route.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] font-bold text-cream/85">{route.name}</span>
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[8px] font-bold border"
                            style={{ color: riskColor, borderColor: `${riskColor}35`, background: `${riskColor}10` }}
                          >
                            {route.riskLevel}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-violet/60">{route.from} → {route.to}</p>
                        <p className="mt-0.5 text-[10px] text-violet/40">{route.description}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-[10px]">
                          <span className="text-violet/50">⏱ {formatDuration(route.durationMs)}</span>
                          <span className="text-green-400">×{route.returnMultiplier} retorno</span>
                          <span className="text-violet/50">Min. {route.minHeroes} herói{route.minHeroes > 1 ? "s" : ""}</span>
                          <span style={{ color: riskColor }}>{Math.round(route.baseSuccessChance * 100)}% base</span>
                        </div>
                      </div>
                      <div className="text-right text-[10px]">
                        <p className="text-violet/50">Min.</p>
                        <p className="font-bold text-amber-400">{route.minInvest.toLocaleString()}</p>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <p className="text-center text-[11px] text-violet/30">
              Ouro: <span className="font-bold text-amber-400">{save.wallet.ouro.toLocaleString("pt-BR")}</span>
            </p>
          </motion.div>
        )}

        {/* Hero selection + invest */}
        {screen === "select-heroes" && selectedRoute && (
          <motion.div
            key="select-heroes"
            className="flex flex-1 flex-col overflow-hidden"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15, ease }}
          >
            <div className="border-b border-violet/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedRoute.icon}</span>
                <div>
                  <p className="text-[12px] font-bold text-cream/80">{selectedRoute.name}</p>
                  <p className="text-[10px] text-violet/50">{formatDuration(selectedRoute.durationMs)} · {selectedRoute.riskLevel}</p>
                </div>
              </div>
              <p className="mt-2 text-[10px] text-violet/50 leading-relaxed">{selectedRoute.quest}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* Hero picker */}
              <div className="mb-4">
                <p className="mb-1.5 text-[11px] uppercase tracking-[0.2em] text-violet/60">
                  Alocar heróis — mín. {selectedRoute.minHeroes} ({assignedHeroes.length} selecionados)
                </p>
                {collected.length === 0 ? (
                  <p className="text-[11px] text-violet/40">Nenhum herói coletado.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {collected.map((hero) => {
                      if (!hero) return null;
                      const sel = assignedHeroes.includes(hero.heroId);
                      const lvl = store.getHeroLevel(hero.heroId);
                      return (
                        <motion.button
                          key={hero.heroId}
                          onClick={() => setAssignedHeroes(sel
                            ? assignedHeroes.filter((id) => id !== hero.heroId)
                            : [...assignedHeroes, hero.heroId]
                          )}
                          whileTap={{ scale: 0.94 }}
                          transition={{ duration: 0.08 }}
                          className="flex flex-col items-center rounded-xl border pb-2 pt-3"
                          style={{
                            borderColor: sel ? "rgba(200,155,60,0.5)" : "rgba(122,111,160,0.15)",
                            background: sel ? "rgba(200,155,60,0.08)" : "rgba(122,111,160,0.04)",
                          }}
                        >
                          <span className="mb-1 text-2xl">{hero.portrait}</span>
                          <p className="text-[10px] font-bold text-cream/70">{hero.name.split(",")[0]}</p>
                          <p className="text-[9px] text-violet/45">Nv.{lvl.level}</p>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Success chance preview */}
              {assignedHeroes.length > 0 && (
                <div className="mb-4 rounded-xl border border-violet/15 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-violet/60">Chance de sucesso</span>
                    <span
                      className="text-[13px] font-black"
                      style={{ color: successChancePreview >= 0.7 ? "rgb(100,220,140)" : successChancePreview >= 0.5 ? "rgb(200,155,60)" : "rgb(255,100,100)" }}
                    >
                      {Math.round(successChancePreview * 100)}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-violet/10">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${successChancePreview * 100}%`,
                        background: successChancePreview >= 0.7 ? "rgb(100,220,140)" : successChancePreview >= 0.5 ? "rgb(200,155,60)" : "rgb(255,100,100)",
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[9px] text-violet/35">
                    Falha retorna apenas 30% do investimento. Heróis nunca morrem em caravanas.
                  </p>
                </div>
              )}

              {/* Invest slider */}
              <div className="mb-4 rounded-xl border border-violet/15 px-4 py-3" style={{ background: "rgba(122,111,160,0.04)" }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] text-violet/60">Investimento</span>
                  <span className="text-[11px] font-bold text-cream/70">{investAmount.toLocaleString("pt-BR")} ouro</span>
                </div>
                <input
                  type="range"
                  min={selectedRoute.minInvest}
                  max={Math.min(selectedRoute.maxInvest, save.wallet.ouro)}
                  step={100}
                  value={Math.min(investAmount, Math.min(selectedRoute.maxInvest, save.wallet.ouro))}
                  onChange={(e) => setInvestAmount(Number(e.target.value))}
                  className="mb-2 w-full accent-amber-400"
                />
                <div className="flex justify-between text-[9px] text-violet/35">
                  <span>Min: {selectedRoute.minInvest.toLocaleString()}</span>
                  <span style={{ color: "rgb(100,220,140)" }}>→ ~{Math.floor(investAmount * selectedRoute.returnMultiplier).toLocaleString()} se sucesso</span>
                  <span>Max: {selectedRoute.maxInvest.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-violet/10 px-4 py-3">
              <motion.button
                onClick={assignedHeroes.length >= selectedRoute.minHeroes && save.wallet.ouro >= investAmount ? dispatch : undefined}
                whileTap={assignedHeroes.length >= selectedRoute.minHeroes ? { scale: 0.97 } : undefined}
                transition={{ duration: 0.08 }}
                className="w-full rounded-xl border py-3.5 text-[11px] font-bold tracking-widest"
                style={{
                  borderColor: assignedHeroes.length >= selectedRoute.minHeroes && save.wallet.ouro >= investAmount
                    ? "rgba(200,155,60,0.45)"
                    : "rgba(122,111,160,0.1)",
                  background: assignedHeroes.length >= selectedRoute.minHeroes && save.wallet.ouro >= investAmount
                    ? "rgba(200,155,60,0.12)"
                    : "transparent",
                  color: assignedHeroes.length >= selectedRoute.minHeroes && save.wallet.ouro >= investAmount
                    ? "rgb(200,155,60)"
                    : "rgba(122,111,160,0.3)",
                }}
              >
                {assignedHeroes.length < selectedRoute.minHeroes
                  ? `SELECIONE ${selectedRoute.minHeroes - assignedHeroes.length} HERÓI${selectedRoute.minHeroes - assignedHeroes.length > 1 ? "S" : ""} MAIS`
                  : save.wallet.ouro < investAmount
                  ? "OURO INSUFICIENTE"
                  : "ENVIAR CARAVANA"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
