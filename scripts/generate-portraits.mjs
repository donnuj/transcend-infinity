/**
 * Gera portraits dos heróis via Replicate (FLUX Schnell).
 * Uso: REPLICATE_API_TOKEN=r8_xxx node scripts/generate-portraits.mjs
 *
 * Flags opcionais:
 *   --only=heroId1,heroId2   gera só esses heróis
 *   --start=50               começa a partir do índice 50
 *   --limit=10               gera no máximo N heróis
 *   --dry-run                mostra prompts sem chamar a API
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const HEROES_TS = path.join(ROOT, "lib", "game", "data", "heroes.ts");
const OUT_DIR = path.join(ROOT, "public", "heroes");

const DRY_RUN = process.argv.includes("--dry-run");

// ── parse CLI flags ──────────────────────────────────────────────────────────
const onlyFlag = process.argv.find((a) => a.startsWith("--only="));
const onlyIds = onlyFlag ? onlyFlag.split("=")[1].split(",") : null;

const startFlag = process.argv.find((a) => a.startsWith("--start="));
const startIdx = startFlag ? parseInt(startFlag.split("=")[1], 10) : 0;

const limitFlag = process.argv.find((a) => a.startsWith("--limit="));
const limitN = limitFlag ? parseInt(limitFlag.split("=")[1], 10) : Infinity;

// ── extract heroes from heroes.ts ────────────────────────────────────────────
// Split by heroId: occurrences and extract fields from each chunk
function parseHeroes(src) {
  const heroes = [];

  // Each hero entry starts with heroId: — split on that marker
  const parts = src.split(/(?=heroId:\s*["'])/);

  for (const chunk of parts) {
    const heroId    = (chunk.match(/^heroId:\s*["']([^"']+)["']/) || [])[1];
    if (!heroId) continue;

    // Look ahead up to 1200 chars for the other fields
    const window = chunk.slice(0, 1200);
    const name      = (window.match(/name:\s*["']([^"']+)["']/)      || [])[1];
    const rarity    = (window.match(/rarity:\s*["']([^"']+)["']/)    || [])[1];
    const heroClass = (window.match(/heroClass:\s*["']([^"']+)["']/) || [])[1];
    const element   = (window.match(/element:\s*["']([^"']+)["']/)   || [])[1];

    if (name && rarity && heroClass && element) {
      heroes.push({ heroId, name, rarity, heroClass, element });
    }
  }
  return heroes;
}

// ── prompt builders ──────────────────────────────────────────────────────────
const CLASS_DESC = {
  Espadachim: "swordsman warrior, elegant blade",
  Guarda:     "armored guardian, tower shield, paladin",
  Gladiador:  "gladiator berserker, heavy armor, battle scars",
  Arqueiro:   "archer ranger, longbow, quiver",
  Caçador:    "hunter rogue, daggers, cloak",
  Curandeiro: "healer cleric, glowing staff, holy symbols",
  Mago:       "mage wizard, magical robes, arcane staff",
  Bruxo:      "warlock witch, dark magic, cursed tome",
  Alquimista: "alchemist, potions, goggles, lab coat",
  Ferreiro:   "blacksmith artificer, hammer, forge-stained apron",
};

const ELEMENT_DESC = {
  Fire:      "fire flames ember aura, warm orange glow",
  Water:     "water frost ice crystals, cool blue aura",
  Wind:      "wind air swirling leaves, green-white aura",
  Earth:     "earth stone roots, brown-green aura",
  Light:     "holy golden light, radiant divine aura",
  Dark:      "shadow darkness void, purple-black aura",
  Lightning: "lightning thunder electric sparks, yellow-blue aura",
  None:      "neutral balanced energy",
};

const RARITY_DESC = {
  Comum:    "simple portrait, straightforward",
  Incomum:  "skilled adventurer, modest gear",
  Raro:     "experienced hero, detailed armor",
  Épico:    "epic warrior, ornate equipment, dramatic lighting",
  Lendário: "legendary champion, majestic aura, intricate armor",
  Mítico:   "mythic being, awe-inspiring presence, supernatural power",
  Divino:   "divine celestial entity, otherworldly radiance, transcendent form",
};

function buildPrompt(hero) {
  const cls = CLASS_DESC[hero.heroClass] || hero.heroClass;
  const elem = ELEMENT_DESC[hero.element] || "";
  const rar = RARITY_DESC[hero.rarity] || "";

  return (
    `Fantasy RPG character portrait bust, ${hero.name}, ${cls}, ${elem}, ${rar}. ` +
    `High quality digital illustration, dramatic lighting, detailed face, ` +
    `square format, dark atmospheric background, game card art style. ` +
    `No text, no watermark.`
  );
}

// ── Pollinations.ai helper (grátis, sem API key) ─────────────────────────────
// GET https://image.pollinations.ai/prompt/{encoded_prompt}?params
// Retorna a imagem diretamente (PNG/JPEG).
function getPollinationsUrl(prompt, seed) {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&model=flux&nologo=true&seed=${seed}&enhance=false`;
}

function downloadImage(url, dest, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const cleanup = (e) => {
      file.close();
      try { fs.unlinkSync(dest); } catch {}
      reject(e);
    };

    const req = https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(dest); } catch {}
        return downloadImage(res.headers.location, dest, timeoutMs).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return cleanup(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", cleanup);
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Timeout após ${timeoutMs / 1000}s`));
    });
    req.on("error", cleanup);
  });
}

async function downloadWithRetry(url, dest, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await downloadImage(url, dest);
      return;
    } catch (e) {
      if (attempt === retries) throw e;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const src = fs.readFileSync(HEROES_TS, "utf8");
  let heroes = parseHeroes(src);

  if (onlyIds) {
    heroes = heroes.filter((h) => onlyIds.includes(h.heroId));
  } else {
    heroes = heroes.slice(startIdx, startIdx + limitN);
  }

  console.log(`\nHeróis a processar: ${heroes.length}\n`);

  let done = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < heroes.length; i++) {
    const hero = heroes[i];
    const dest = path.join(OUT_DIR, `${hero.heroId}.png`);

    if (fs.existsSync(dest)) {
      console.log(`[skip] ${hero.heroId}`);
      skipped++;
      continue;
    }

    const prompt = buildPrompt(hero);

    if (DRY_RUN) {
      console.log(`[dry]  ${hero.heroId}\n       ${prompt}\n`);
      done++;
      continue;
    }

    process.stdout.write(`[${i + 1}/200] ${hero.heroId} ... `);

    try {
      const seed = Math.floor(Math.random() * 999999);
      const url = getPollinationsUrl(prompt, seed);
      await downloadWithRetry(url, dest);
      console.log("ok");
      done++;
    } catch (e) {
      console.log(`ERRO: ${e.message}`);
      errors++;
    }

    // pausa para não sobrecarregar o serviço gratuito
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`\nConcluído: ${done} gerados, ${skipped} pulados, ${errors} erros.`);
}

main();
