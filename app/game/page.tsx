"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GlobeSimple, Cards, Sparkle, Shield, User } from "@phosphor-icons/react";
import { api } from "@/lib/api";
import { getUser, isAuthenticated, clearSession } from "@/lib/auth";
import type { StoredUser } from "@/lib/auth";
import { useGameStore } from "@/lib/game/store";
import { loadCloudSave, uploadCloudSave } from "@/lib/game/save";
import WorldTab from "./WorldTab";
import CartasTab from "./CartasTab";
import InvocarTab from "./InvocarTab";
import GuildaTab from "./GuildaTab";
import PerfilTab from "./PerfilTab";
import DungeonModal from "./DungeonModal";
import ArenaModal from "./ArenaModal";
import MercadoModal from "./MercadoModal";
import BattlePassModal from "./BattlePassModal";
import TorreModal from "./TorreModal";
import AchievementsModal from "./AchievementsModal";
import DailyChallengesModal from "./DailyChallengesModal";
import CodexModal from "./CodexModal";
import FortressModal from "./FortressModal";
import BossHuntModal from "./BossHuntModal";
import SeasonModal from "./SeasonModal";
import HousingModal from "./HousingModal";
import CompanionsModal from "./CompanionsModal";
import AlchemyModal from "./AlchemyModal";
import WorldMapModal from "./WorldMapModal";
import NpcDialogueModal from "./NpcDialogueModal";
import CaravanaModal from "./CaravanaModal";
import SettingsModal from "./SettingsModal";
import ProfessionModal from "./ProfessionModal";
import ForgeModal from "./ForgeModal";
import WikiModal from "./WikiModal";

export type Profile = {
  id: number;
  username: string;
  email: string;
  level: number;
  experience: number;
  gold: number;
  premiumCurrency: number;
  characterName: string;
  registeredAt: string;
};

type Tab = "mundo" | "cartas" | "invocar" | "guilda" | "perfil";

type PhosphorIcon = React.ComponentType<{ weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; size?: number; color?: string }>;

const TABS: { id: Tab; label: string; Icon: PhosphorIcon; color: string }[] = [
  { id: "mundo",   label: "Mundo",   Icon: GlobeSimple, color: "rgb(90,160,255)"   },
  { id: "cartas",  label: "Cartas",  Icon: Cards,       color: "rgb(180,110,255)"  },
  { id: "invocar", label: "Invocar", Icon: Sparkle,     color: "rgb(200,155,60)"   },
  { id: "guilda",  label: "Guilda",  Icon: Shield,      color: "rgb(100,210,130)"  },
  { id: "perfil",  label: "Perfil",  Icon: User,        color: "rgb(232,217,160)"  },
];

const ease = [0.23, 1, 0.32, 1] as const;

export default function GamePage() {
  const router = useRouter();
  const wallet = useGameStore((s) => s.save.wallet);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<Tab>("mundo");
  const [showDungeon, setShowDungeon] = useState(false);
  const [showArena, setShowArena] = useState(false);
  const [showMercado, setShowMercado] = useState(false);
  const [showBattlePass, setShowBattlePass] = useState(false);
  const [showTorre, setShowTorre] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showDailyChallenges, setShowDailyChallenges] = useState(false);
  const [showCodex, setShowCodex] = useState(false);
  const [showFortress, setShowFortress] = useState(false);
  const [showBossHunt, setShowBossHunt] = useState(false);
  const [showSeason, setShowSeason] = useState(false);
  const [showHousing, setShowHousing] = useState(false);
  const [showCompanions, setShowCompanions] = useState(false);
  const [showAlchemy, setShowAlchemy] = useState(false);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [showNpcDialogue, setShowNpcDialogue] = useState(false);
  const [showCaravana, setShowCaravana] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfession, setShowProfession] = useState(false);
  const [showForge, setShowForge] = useState(false);
  const [showWiki, setShowWiki] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    const u = getUser();
    api.get<Profile>("/player/profile").then((p) => setProfile(p)).catch(() => null);
    // Limpa save local para evitar que novo usuário herde dados de sessão anterior
    localStorage.removeItem("ti_game_save");
    useGameStore.getState().resetSave();
    loadCloudSave().then((found) => {
      if (!found) uploadCloudSave();
    }).finally(() => setUser(u));
  }, [router]);

  // Keep-alive: mantém o backend no Render acordado enquanto o jogador está na sessão
  useEffect(() => {
    const ping = () => api.get("/health").catch(() => null);
    const id = setInterval(ping, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center bg-atmosphere">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber/20 border-t-amber" />
          <span className="text-[9px] tracking-[0.3em] text-violet/40">CARREGANDO</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-atmosphere flex h-full">
    <div className="relative flex h-full w-full flex-col">
      {/* Top bar */}
      <header
        className="relative"
        style={{
          background: "linear-gradient(180deg, rgba(6,7,15,0.98) 0%, rgba(10,10,22,0.92) 100%)",
          borderBottom: "1px solid rgba(200,155,60,0.1)",
          boxShadow: "0 1px 0 rgba(200,155,60,0.04), 0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-black"
            style={{
              background: "linear-gradient(135deg, rgba(200,155,60,0.25) 0%, rgba(200,155,60,0.08) 100%)",
              border: "1px solid rgba(200,155,60,0.3)",
              color: "rgb(200,155,60)",
              fontFamily: "var(--font-cinzel)",
            }}
          >
            {(profile?.characterName ?? user.username)[0].toUpperCase()}
          </div>
          <span
            className="text-[11px] font-black tracking-[0.2em] text-cream/90"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            {(profile?.characterName ?? user.username).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Chip icon="✦" value={wallet.cristaisAstra} color="rgb(170,130,255)" />
          <Chip icon="◆" value={wallet.ouro} color="rgb(200,155,60)" />
        </div>
      </div>
      </header>

      {/* Content */}
      <main className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {tab === "mundo"   && <WorldTab   key="mundo"   profile={profile} onInvocar={() => setTab("invocar")} onDungeon={() => setShowDungeon(true)} onArena={() => setShowArena(true)} onMercado={() => setShowMercado(true)} onBattlePass={() => setShowBattlePass(true)} onTorre={() => setShowTorre(true)} onDailyChallenges={() => setShowDailyChallenges(true)} onBossHunt={() => setShowBossHunt(true)} onWorldMap={() => setShowWorldMap(true)} onNpcDialogue={() => setShowNpcDialogue(true)} onCaravana={() => setShowCaravana(true)} />}
          {tab === "cartas"  && <CartasTab  key="cartas" />}
          {tab === "invocar" && <InvocarTab key="invocar" />}
          {tab === "guilda"  && <GuildaTab  key="guilda" onFortress={() => setShowFortress(true)} />}
          {tab === "perfil"  && <PerfilTab  key="perfil" profile={profile} onLogout={handleLogout} onAchievements={() => setShowAchievements(true)} onCodex={() => setShowCodex(true)} onSeason={() => setShowSeason(true)} onHousing={() => setShowHousing(true)} onCompanions={() => setShowCompanions(true)} onAlchemy={() => setShowAlchemy(true)} onSettings={() => setShowSettings(true)} onProfession={() => setShowProfession(true)} onForge={() => setShowForge(true)} onWiki={() => setShowWiki(true)} />}
        </AnimatePresence>
      </main>

      {/* Dungeon overlay */}
      <AnimatePresence>
        {showDungeon && <DungeonModal key="dungeon" onClose={() => setShowDungeon(false)} />}
        {showArena && <ArenaModal key="arena" onClose={() => setShowArena(false)} />}
        {showMercado && <MercadoModal key="mercado" onClose={() => setShowMercado(false)} />}
        {showBattlePass && <BattlePassModal key="battlepass" onClose={() => setShowBattlePass(false)} />}
        {showTorre && <TorreModal key="torre" onClose={() => setShowTorre(false)} />}
        {showAchievements && <AchievementsModal key="achievements" onClose={() => setShowAchievements(false)} />}
        {showDailyChallenges && <DailyChallengesModal key="daily" onClose={() => setShowDailyChallenges(false)} />}
        {showCodex && <CodexModal key="codex" onClose={() => setShowCodex(false)} />}
        {showFortress && <FortressModal key="fortress" onClose={() => setShowFortress(false)} />}
        {showBossHunt && <BossHuntModal key="bosshunt" onClose={() => setShowBossHunt(false)} />}
        {showSeason && <SeasonModal key="season" onClose={() => setShowSeason(false)} />}
        {showHousing && <HousingModal key="housing" onClose={() => setShowHousing(false)} />}
        {showCompanions && <CompanionsModal key="companions" onClose={() => setShowCompanions(false)} />}
        {showAlchemy && <AlchemyModal key="alchemy" onClose={() => setShowAlchemy(false)} />}
        {showWorldMap && <WorldMapModal key="worldmap" onClose={() => setShowWorldMap(false)} />}
        {showNpcDialogue && <NpcDialogueModal key="npcdialogue" onClose={() => setShowNpcDialogue(false)} />}
        {showCaravana && <CaravanaModal key="caravana" onClose={() => setShowCaravana(false)} />}
        {showSettings && <SettingsModal key="settings" onClose={() => setShowSettings(false)} />}
        {showProfession && <ProfessionModal key="profession" onClose={() => setShowProfession(false)} />}
        {showForge && <ForgeModal key="forge" onClose={() => setShowForge(false)} />}
        {showWiki && <WikiModal key="wiki" onClose={() => setShowWiki(false)} />}
      </AnimatePresence>

      {/* Bottom nav */}
      <nav
        className="relative"
        style={{
          background: "linear-gradient(0deg, rgba(6,7,15,0.99) 0%, rgba(10,10,22,0.96) 100%)",
          borderTop: "1px solid rgba(200,155,60,0.08)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.5), 0 -1px 0 rgba(200,155,60,0.05)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
      <div className="mx-auto flex max-w-5xl">
        {TABS.map(({ id, label, Icon, color }) => {
          const active = tab === id;
          return (
            <motion.button
              key={id}
              onClick={() => setTab(id)}
              whileTap={{ scale: 0.88 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-3.5"
            >
              {active && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 rounded-t-2xl"
                  style={{ background: `radial-gradient(ellipse at 50% 100%, ${color}15 0%, transparent 70%)` }}
                  transition={{ duration: 0.3, ease }}
                />
              )}
              {active && (
                <motion.div
                  layoutId="nav-line"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-7 rounded-full"
                  style={{ background: color, boxShadow: `0 0 8px ${color}cc` }}
                  transition={{ duration: 0.25, ease }}
                />
              )}
              <motion.div
                className="relative z-10"
                animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                style={{ filter: active ? `drop-shadow(0 0 5px ${color}90)` : "none" }}
              >
                <Icon
                  weight={active ? "fill" : "light"}
                  size={20}
                  color={active ? color : "rgba(180,170,210,0.65)"}
                />
              </motion.div>
              <span
                className="relative z-10 text-[7.5px] font-bold tracking-[0.14em]"
                style={{
                  color: active ? color : "rgba(180,170,210,0.55)",
                  transition: "color 220ms cubic-bezier(0.23,1,0.32,1)",
                }}
              >
                {label.toUpperCase()}
              </span>
            </motion.button>
          );
        })}
      </div>
      </nav>
    </div>
    </div>
  );
}

function Chip({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold"
      style={{
        background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
        border: `1px solid ${color}28`,
        color,
        boxShadow: `0 1px 6px ${color}10, 0 0 0 0.5px ${color}15 inset`,
      }}
    >
      <span className="text-[10px]">{icon}</span>
      <span>{value.toLocaleString("pt-BR")}</span>
    </div>
  );
}
