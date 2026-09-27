"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { getUser, isAuthenticated, clearSession } from "@/lib/auth";
import type { StoredUser } from "@/lib/auth";
import { useGameStore } from "@/lib/game/store";
import { loadCloudSave } from "@/lib/game/save";
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

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "mundo",   label: "Mundo",   icon: "◎" },
  { id: "cartas",  label: "Cartas",  icon: "▣" },
  { id: "invocar", label: "Invocar", icon: "✦" },
  { id: "guilda",  label: "Guilda",  icon: "⚜" },
  { id: "perfil",  label: "Perfil",  icon: "◉" },
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

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/login"); return; }
    setUser(getUser());
    api.get<Profile>("/player/profile").then((p) => setProfile(p)).catch(() => null);
    loadCloudSave();
  }, [router]);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  if (!user) {
    return (
      <div className="flex h-full items-center justify-center bg-void">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber/30 border-t-amber" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-void">
      {/* Top bar */}
      <header
        className="flex items-center justify-between border-b border-amber/12 px-4 py-2.5"
        style={{ backgroundColor: "rgba(10,10,22,0.97)" }}
      >
        <span
          className="text-[11px] font-black tracking-[0.22em] text-cream/85"
          style={{ fontFamily: "var(--font-cinzel)" }}
        >
          {(profile?.characterName ?? user.username).toUpperCase()}
        </span>
        <div className="flex items-center gap-2">
          <Chip icon="✦" value={wallet.cristaisAstra} color="rgb(170,130,255)" />
          <Chip icon="◆" value={wallet.ouro} color="rgb(200,155,60)" />
        </div>
      </header>

      {/* Content */}
      <main className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {tab === "mundo"   && <WorldTab   key="mundo"   profile={profile} onInvocar={() => setTab("invocar")} onDungeon={() => setShowDungeon(true)} onArena={() => setShowArena(true)} onMercado={() => setShowMercado(true)} onBattlePass={() => setShowBattlePass(true)} onTorre={() => setShowTorre(true)} onDailyChallenges={() => setShowDailyChallenges(true)} onBossHunt={() => setShowBossHunt(true)} />}
          {tab === "cartas"  && <CartasTab  key="cartas" />}
          {tab === "invocar" && <InvocarTab key="invocar" />}
          {tab === "guilda"  && <GuildaTab  key="guilda" onFortress={() => setShowFortress(true)} />}
          {tab === "perfil"  && <PerfilTab  key="perfil" profile={profile} onLogout={handleLogout} onAchievements={() => setShowAchievements(true)} onCodex={() => setShowCodex(true)} onSeason={() => setShowSeason(true)} onHousing={() => setShowHousing(true)} />}
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
      </AnimatePresence>

      {/* Bottom nav */}
      <nav
        className="flex border-t border-amber/12"
        style={{ backgroundColor: "rgba(10,10,22,0.97)" }}
      >
        {TABS.map(({ id, label, icon }) => {
          const active = tab === id;
          return (
            <motion.button
              key={id}
              onClick={() => setTab(id)}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.08, ease }}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-3"
              style={{
                color: active ? "rgb(200,155,60)" : "rgba(122,111,160,0.55)",
                transition: "color 150ms cubic-bezier(0.23,1,0.32,1)",
              }}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute top-0 h-[2px] w-10 rounded-full bg-amber"
                  transition={{ duration: 0.25, ease }}
                />
              )}
              <span className="text-[15px] leading-none">{icon}</span>
              <span className="text-[8px] font-bold tracking-[0.12em]">{label.toUpperCase()}</span>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}

function Chip({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold"
      style={{ borderColor: `${color}33`, color, backgroundColor: `${color}10` }}
    >
      <span>{icon}</span>
      <span>{value.toLocaleString("pt-BR")}</span>
    </div>
  );
}
