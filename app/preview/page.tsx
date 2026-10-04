"use client";

import { BattleScene } from "@/src/components/game/battle/BattleScene";
import { CaravanScene } from "@/src/components/game/travel/CaravanScene";
import { NpcScene } from "@/src/components/game/npc/NpcScene";
import { ForgeScene } from "@/src/components/game/scenes/ForgeScene";
import { ConstructionScene } from "@/src/components/game/scenes/ConstructionScene";
import { ExplorationScene } from "@/src/components/game/scenes/ExplorationScene";

export default function PreviewPage() {
  return (
    <div style={{ background: "rgb(6,7,15)", minHeight: "100vh", padding: 20, display: "flex", flexDirection: "column", gap: 16, maxWidth: 380, margin: "0 auto" }}>
      <p style={{ color: "rgba(180,160,220,0.5)", fontSize: 10, letterSpacing: "0.2em", fontWeight: 700 }}>BATTLE — DUNGEON</p>
      <BattleScene variant="dungeon" heroCount={2} enemyName="Goblin Rei" progressPct={0.45} timeLabel="12min 30s" diffColor="rgb(200,155,60)" />

      <p style={{ color: "rgba(180,160,220,0.5)", fontSize: 10, letterSpacing: "0.2em", fontWeight: 700 }}>BATTLE — TOWER</p>
      <BattleScene variant="tower" heroCount={3} enemyName="Andar 42" progressPct={0.7} timeLabel="4min 10s" diffColor="rgb(90,150,255)" />

      <p style={{ color: "rgba(180,160,220,0.5)", fontSize: 10, letterSpacing: "0.2em", fontWeight: 700 }}>BATTLE — BOSS</p>
      <BattleScene variant="boss" heroCount={3} enemyName="Semideus Corrompido" progressPct={0.3} timeLabel="22min" diffColor="rgb(255,80,80)" />

      <p style={{ color: "rgba(180,160,220,0.5)", fontSize: 10, letterSpacing: "0.2em", fontWeight: 700 }}>CARAVANA</p>
      <CaravanScene from="Valdris" to="Picos Eternos" progressPct={0.55} timeLabel="1h 20min" />

      <p style={{ color: "rgba(180,160,220,0.5)", fontSize: 10, letterSpacing: "0.2em", fontWeight: 700 }}>FORJA</p>
      <ForgeScene itemName="Espada de Aço" progressPct={0.65} timeLabel="8min 20s" />

      <p style={{ color: "rgba(180,160,220,0.5)", fontSize: 10, letterSpacing: "0.2em", fontWeight: 700 }}>CONSTRUCAO</p>
      <ConstructionScene buildingName="Torre de Vigia" progressPct={0.4} timeLabel="45min" />

      <p style={{ color: "rgba(180,160,220,0.5)", fontSize: 10, letterSpacing: "0.2em", fontWeight: 700 }}>EXPLORACAO</p>
      <ExplorationScene regionName="Picos Eternos" progressPct={0.3} timeLabel="2h 10min" />

      <p style={{ color: "rgba(180,160,220,0.5)", fontSize: 10, letterSpacing: "0.2em", fontWeight: 700 }}>NPC DIALOGUE</p>
      <NpcScene npcName="Lyra" />
    </div>
  );
}
