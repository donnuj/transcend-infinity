"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { DamageNumber } from "@/src/components/game/effects/DamageNumber";
import { ParticleEffect } from "@/src/components/game/effects/ParticleEffect";
import { SpellEffect, SpellType } from "@/src/components/game/effects/SpellEffect";
import { LevelUpEffect } from "@/src/components/game/effects/LevelUpEffect";
import { ScreenShake } from "@/src/components/game/effects/ScreenShake";
import { FloatingIcon, PulseGlow, SelectionRing } from "@/src/components/game/effects/FloatingIcon";
import { StatusBar } from "@/src/components/game/ui/StatusBar";
import { IdleBreathing, HitFlash } from "@/src/components/game/ui/IdleBreathing";
import { CharacterSprite } from "@/src/components/game/sprites/CharacterSprite";

const RPG_META = { frameWidth: 64, frameHeight: 64, columns: 4, rows: 4, scale: 2 };
const RPG_ANIMS = {
  idle:       { row: 0, frames: 1, fps: 1,  loop: true as const },
  walk:       { row: 0, frames: 4, fps: 8,  loop: true as const },
  walk_left:  { row: 1, frames: 4, fps: 8,  loop: true as const },
  walk_right: { row: 2, frames: 4, fps: 8,  loop: true as const },
  walk_up:    { row: 3, frames: 4, fps: 8,  loop: true as const },
};

type DmgEntry = { id: number; value: number | string; type: "physical" | "magic" | "heal" | "critical" | "miss" | "poison" | "fire" | "ice"; x: number; y: number };
type ParticleEntry = { id: number; type: "slash" | "fire" | "magic" | "star" | "heal" | "ice" | "smoke" | "spark"; x: number; y: number };

const SPELL_TYPES: SpellType[] = ["fire", "ice", "lightning", "poison", "holy", "dark", "magic", "levelup", "buff", "debuff"];

export default function DemoPage() {
  const [dmgNums, setDmgNums] = useState<DmgEntry[]>([]);
  const [particles, setParticles] = useState<ParticleEntry[]>([]);
  const [spellIdx, setSpellIdx] = useState(0);
  const [showSpell, setShowSpell] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [shake, setShake] = useState(false);
  const [hitFlash, setHitFlash] = useState(false);
  const [hp, setHp] = useState(80);
  const [mp, setMp] = useState(60);
  const [xp, setXp] = useState(45);
  const [charDir, setCharDir] = useState<"walk" | "walk_left" | "walk_right" | "walk_up">("walk");

  const spawnDmg = useCallback((type: DmgEntry["type"]) => {
    const value = type === "miss" ? "MISS" : type === "heal" ? Math.round(Math.random() * 300 + 50) : Math.round(Math.random() * 999 + 100);
    setDmgNums(p => [...p, { id: Date.now() + Math.random(), value, type, x: 80 + Math.random() * 80, y: 40 + Math.random() * 40 }]);
  }, []);

  const spawnParticle = useCallback((type: ParticleEntry["type"]) => {
    setParticles(p => [...p, { id: Date.now() + Math.random(), type, x: 60 + Math.random() * 120, y: 60 + Math.random() * 80 }]);
  }, []);

  const fireSpell = useCallback(() => {
    setShowSpell(false);
    setTimeout(() => { setShowSpell(true); setSpellIdx(i => (i + 1) % SPELL_TYPES.length); }, 50);
  }, []);

  // Auto-rotate character direction
  const dirs: Array<"walk" | "walk_left" | "walk_right" | "walk_up"> = ["walk", "walk_right", "walk_up", "walk_left"];
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % dirs.length; setCharDir(dirs[i]); }, 1200);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "rgb(6,7,15)", color: "rgb(220,210,240)", fontFamily: "sans-serif", padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "0.2em", marginBottom: 24, color: "rgb(200,155,60)" }}>
        SHOWCASE DE EFEITOS — TRANSCEND INFINITY
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>

        {/* Character Sprite */}
        <Card title="CharacterSprite (walk animado)">
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            {(["walk", "walk_right", "walk_up", "walk_left"] as const).map(dir => (
              <div key={dir} style={{ textAlign: "center" }}>
                <CharacterSprite src="/assets/game/characters/rpg-walk/rpg_sprite_walk.png" meta={RPG_META} animations={RPG_ANIMS} state={dir} />
                <p style={{ fontSize: 9, color: "rgba(200,180,240,0.5)", marginTop: 4 }}>{dir}</p>
              </div>
            ))}
            <div style={{ textAlign: "center" }}>
              <FloatingIcon amplitude={5} period={2.5}>
                <PulseGlow color="rgba(200,155,60,0.4)" scale={1.08} duration={2}>
                  <CharacterSprite src="/assets/game/characters/rpg-walk/rpg_sprite_walk.png" meta={RPG_META} animations={RPG_ANIMS} state={charDir} />
                </PulseGlow>
              </FloatingIcon>
              <p style={{ fontSize: 9, color: "rgb(200,155,60)", marginTop: 4 }}>FloatingIcon + PulseGlow</p>
            </div>
          </div>
        </Card>

        {/* Damage Numbers */}
        <Card title="DamageNumber (8 tipos)">
          <div style={{ position: "relative", height: 160 }}>
            {dmgNums.map(d => (
              <DamageNumber key={d.id} value={d.value} type={d.type} x={d.x} y={d.y} onDone={() => setDmgNums(p => p.filter(n => n.id !== d.id))} />
            ))}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(["physical","magic","heal","critical","miss","poison","fire","ice"] as const).map(t => (
                <Btn key={t} onClick={() => spawnDmg(t)} color={t === "heal" ? "rgb(100,220,140)" : t === "critical" ? "rgb(255,200,40)" : t === "fire" ? "rgb(255,140,50)" : t === "ice" ? "rgb(140,220,255)" : t === "magic" ? "rgb(170,130,255)" : t === "poison" ? "rgb(140,230,100)" : "rgb(200,180,220)"}>{t}</Btn>
              ))}
            </div>
          </div>
        </Card>

        {/* Particle Effects */}
        <Card title="ParticleEffect (CC0 Kenney)">
          <div style={{ position: "relative", height: 160 }}>
            {particles.map(p => (
              <ParticleEffect key={p.id} type={p.type} x={p.x} y={p.y} onDone={() => setParticles(prev => prev.filter(n => n.id !== p.id))} style={{ position: "absolute" }} />
            ))}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {(["slash","fire","magic","star","heal","ice","smoke","spark"] as const).map(t => (
                <Btn key={t} onClick={() => spawnParticle(t)}>{t}</Btn>
              ))}
            </div>
          </div>
        </Card>

        {/* Spell Effects */}
        <Card title={`SpellEffect — ${SPELL_TYPES[spellIdx]}`}>
          <div style={{ position: "relative", height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SpellEffect type={SPELL_TYPES[spellIdx]} show={showSpell} size={90} />
            <Btn onClick={fireSpell} color="rgb(170,130,255)">Próximo Feitiço →</Btn>
          </div>
        </Card>

        {/* Level Up */}
        <Card title="LevelUpEffect">
          <div style={{ position: "relative", height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LevelUpEffect show={showLevelUp} onDone={() => setShowLevelUp(false)} />
            <Btn onClick={() => setShowLevelUp(true)} color="rgb(255,230,80)">LEVEL UP!</Btn>
          </div>
        </Card>

        {/* Screen Shake + HitFlash */}
        <Card title="ScreenShake + HitFlash">
          <ScreenShake active={shake}>
            <HitFlash active={hitFlash}>
              <div style={{
                width: "100%", height: 80, borderRadius: 12, background: "rgba(200,155,60,0.12)",
                border: "1px solid rgba(200,155,60,0.3)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 14, fontWeight: 700, color: "rgb(200,155,60)",
                marginBottom: 10,
              }}>
                ALVO
              </div>
            </HitFlash>
          </ScreenShake>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => { setShake(true); setTimeout(() => setShake(false), 400); }} color="rgb(255,100,100)">Shake</Btn>
            <Btn onClick={() => { setHitFlash(true); setTimeout(() => setHitFlash(false), 350); }} color="rgb(255,140,50)">HitFlash</Btn>
          </div>
        </Card>

        {/* Status Bars */}
        <Card title="StatusBar (HP / MP / XP)">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <StatusBar type="hp" value={hp} max={100} showLabel showValue />
            <StatusBar type="mp" value={mp} max={100} showLabel showValue />
            <StatusBar type="xp" value={xp} max={100} showLabel showValue />
            <StatusBar type="rage" value={70} max={100} showLabel />
            <StatusBar type="shield" value={40} max={100} showLabel />
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              <Btn onClick={() => setHp(h => Math.max(0, h - 20))} color="rgb(255,100,100)">Dano HP</Btn>
              <Btn onClick={() => setMp(m => Math.max(0, m - 15))} color="rgb(90,130,255)">Usar MP</Btn>
              <Btn onClick={() => setXp(x => Math.min(100, x + 10))} color="rgb(200,155,60)">+XP</Btn>
            </div>
          </div>
        </Card>

        {/* IdleBreathing + FloatingIcon + SelectionRing */}
        <Card title="IdleBreathing + SelectionRing + PulseGlow">
          <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "center", paddingTop: 16 }}>
            <IdleBreathing intensity={0.04} period={2.5}>
              <div style={{
                width: 70, height: 90, borderRadius: 10, background: "linear-gradient(160deg, rgba(180,110,255,0.2), rgba(10,10,22,0.95))",
                border: "1.5px solid rgba(180,110,255,0.45)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 28,
              }}>
                ⚔
              </div>
            </IdleBreathing>

            <FloatingIcon amplitude={6} period={2}>
              <PulseGlow color="rgba(200,155,60,0.4)" scale={1.06} duration={2}>
                <div style={{
                  width: 70, height: 90, borderRadius: 10,
                  background: "linear-gradient(160deg, rgba(200,155,60,0.2), rgba(10,10,22,0.95))",
                  border: "1.5px solid rgba(200,155,60,0.55)", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: 28,
                }}>
                  ✦
                </div>
              </PulseGlow>
            </FloatingIcon>

            <div style={{ position: "relative", width: 70, height: 90 }}>
              <SelectionRing color="rgba(90,150,255,0.8)" size={80} />
              <div style={{
                width: 70, height: 90, borderRadius: 10,
                background: "linear-gradient(160deg, rgba(90,150,255,0.2), rgba(10,10,22,0.95))",
                border: "1.5px solid rgba(90,150,255,0.4)", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 28,
              }}>
                🛡
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(122,111,160,0.06)",
        border: "1px solid rgba(122,111,160,0.15)",
        borderRadius: 14, padding: 18,
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.2em", color: "rgba(180,160,220,0.55)", marginBottom: 14, textTransform: "uppercase" }}>{title}</p>
      {children}
    </motion.div>
  );
}

function Btn({ onClick, color = "rgba(122,111,160,0.7)", children }: { onClick: () => void; color?: string; children: React.ReactNode }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      style={{
        padding: "5px 10px", borderRadius: 8, border: `1px solid ${color}50`,
        background: `${color}15`, color, fontSize: 11, fontWeight: 700,
        cursor: "pointer", letterSpacing: "0.05em",
      }}
    >
      {children}
    </motion.button>
  );
}
