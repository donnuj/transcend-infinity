import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import {
  MONOTONIC_PATHS,
  SAVE_CAPS,
  playerProfileSchema,
  saveDownloadSchema,
  saveUploadResponseSchema,
  type SaveUpload,
  type SummonInput,
} from './player.schemas';
import { BANNER_MAP } from './banners.data';
import { rollBanner } from './gacha.engine';

@Injectable()
export class PlayerService {
  constructor(private readonly prisma: PrismaService) {}

  private getNestedValue(obj: Record<string, unknown>, path: string[]): unknown {
    let cur: unknown = obj;
    for (const key of path) {
      if (cur === null || typeof cur !== 'object') return undefined;
      cur = (cur as Record<string, unknown>)[key];
    }
    return cur;
  }

  async getProfile(accountId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { player: true },
    });
    if (!account?.player)
      throw new NotFoundException('Jogador não encontrado.');

    const p = account.player;
    return playerProfileSchema.parse({
      id: p.id,
      username: account.username,
      email: account.email,
      level: p.level,
      experience: p.experience,
      gold: p.gold,
      premiumCurrency: p.premiumCurrency,
      characterName: p.characterName,
      registeredAt: account.createdAt.toISOString(),
      lastLogin: account.lastLogin.toISOString(),
    });
  }

  async uploadSave(accountId: number, saveJson: SaveUpload) {
    const player = await this.prisma.player.findUnique({
      where: { accountId },
    });
    if (!player) throw new NotFoundException('Jogador não encontrado.');

    // Validate monotonic progression against the stored save
    const existing = await this.prisma.saveData.findUnique({ where: { playerId: player.id } });
    if (existing) {
      // Client sent revision 0 (first-ever upload) but a save already exists →
      // force them to download first so they don't overwrite with stale defaults.
      if (saveJson.revision === 0) {
        throw new ConflictException('Save já existe. Baixe o save atual antes de sobrescrever.');
      }

      let storedData: Record<string, unknown>;
      try { storedData = JSON.parse(existing.data) as Record<string, unknown>; }
      catch { storedData = {}; }

      const newData = saveJson.data as Record<string, unknown>;
      for (const { path } of MONOTONIC_PATHS) {
        const oldVal = this.getNestedValue(storedData, path);
        const newVal = this.getNestedValue(newData, path);
        if (typeof oldVal === 'number' && typeof newVal === 'number' && newVal < oldVal) {
          throw new ConflictException(
            `${path.join('.')} não pode retrocedar (${oldVal} → ${newVal}).`,
          );
        }
      }
    }

    const data = JSON.stringify(saveJson.data);
    const checksum = createHash('sha256').update(data, 'utf8').digest('hex');
    const nextRevision = saveJson.revision + 1;

    const saveData = saveJson.data as Record<string, unknown>;

    const arena = saveData['arena'] as Record<string, unknown> | undefined;
    const arenaRating = typeof arena?.['rating'] === 'number' ? (arena['rating'] as number) : undefined;
    const arenaDefenderHeroId = typeof arena?.['defenderHeroId'] === 'string' ? (arena['defenderHeroId'] as string) : undefined;

    // Sync denormalized columns so profile queries don't depend on parsing the JSON blob
    const playerLevel = saveData['playerLevel'] as Record<string, unknown> | undefined;
    const wallet = saveData['wallet'] as Record<string, unknown> | undefined;
    const syncedLevel = typeof playerLevel?.['level'] === 'number' ? (playerLevel['level'] as number) : undefined;
    const syncedXp    = typeof playerLevel?.['xp'] === 'number'    ? (playerLevel['xp'] as number)    : undefined;
    const syncedGold  = typeof wallet?.['ouro'] === 'number'        ? (wallet['ouro'] as number)        : undefined;
    const syncedPrem  = typeof wallet?.['cristaisAstra'] === 'number' ? (wallet['cristaisAstra'] as number) : undefined;

    try {
      const saved = await this.prisma.$transaction(async (transaction: import('@prisma/client').Prisma.TransactionClient) => {
        if (saveJson.revision === 0) {
          await transaction.saveData.create({
            data: {
              playerId: player.id,
              schemaVersion: saveJson.schemaVersion,
              revision: nextRevision,
              checksum,
              data,
            },
          });
        } else {
          const updated = await transaction.saveData.updateMany({
            where: {
              playerId: player.id,
              revision: saveJson.revision,
            },
            data: {
              schemaVersion: saveJson.schemaVersion,
              revision: nextRevision,
              checksum,
              data,
            },
          });
          if (updated.count !== 1) return false;
        }

        const playerSync = {
          ...(arenaRating !== undefined        && { arenaRating }),
          ...(arenaDefenderHeroId !== undefined && { arenaDefenderHeroId }),
          ...(syncedLevel !== undefined         && { level: syncedLevel }),
          ...(syncedXp    !== undefined         && { experience: syncedXp }),
          ...(syncedGold  !== undefined         && { gold: syncedGold }),
          ...(syncedPrem  !== undefined         && { premiumCurrency: syncedPrem }),
        };
        if (Object.keys(playerSync).length > 0) {
          await transaction.player.update({ where: { id: player.id }, data: playerSync });
        }

        await transaction.saveAudit.create({
          data: { playerId: player.id, revision: nextRevision, checksum },
        });

        // Keep at most the 20 most recent audit entries per player
        const oldest = await transaction.saveAudit.findMany({
          where: { playerId: player.id },
          orderBy: { revision: 'desc' },
          skip: 20,
          select: { id: true },
        });
        if (oldest.length > 0) {
          await transaction.saveAudit.deleteMany({
            where: { id: { in: oldest.map((r) => r.id) } },
          });
        }

        return true;
      });

      if (!saved) throw new ConflictException('Versão do save desatualizada.');
    } catch (error: unknown) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Versão do save desatualizada.');
      }
      throw error;
    }

    return saveUploadResponseSchema.parse({
      success: true,
      revision: nextRevision,
      checksum,
    });
  }

  async adminListPlayers(page = 1, limit = 50) {
    const [total, accounts] = await this.prisma.$transaction([
      this.prisma.account.count(),
      this.prisma.account.findMany({
        include: {
          player: { include: { saveData: true } },
          purchases: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { lastLogin: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    const rows = accounts.map((account) => {
      let saveStats: Record<string, unknown> | null = null;
      if (account.player?.saveData) {
        try {
          const save = JSON.parse(account.player.saveData.data) as Record<string, unknown>;
          const wallet = save['wallet'] as Record<string, unknown> | undefined;
          const bp = save['battlePass'] as Record<string, unknown> | undefined;
          const pl = save['playerLevel'] as Record<string, unknown> | undefined;
          const heroIds = save['collectedHeroIds'] as string[] | undefined;
          const arena = save['arena'] as Record<string, unknown> | undefined;
          const tower = save['tower'] as Record<string, unknown> | undefined;
          saveStats = {
            ouro: wallet?.['ouro'] ?? 0,
            cristaisAstra: wallet?.['cristaisAstra'] ?? 0,
            selosDeInvocacao: wallet?.['selosDeInvocacao'] ?? 0,
            selosLivres: wallet?.['selosLivres'] ?? 0,
            isPremium: bp?.['isPremium'] ?? false,
            premiumType: bp?.['premiumType'] ?? '',
            premiumExpiresAt: bp?.['premiumExpiresAt'] ?? '',
            playerLevel: pl?.['level'] ?? 1,
            heroCount: heroIds?.length ?? 0,
            arenaRating: arena?.['rating'] ?? 0,
            towerBestFloor: tower?.['bestFloor'] ?? 0,
          };
        } catch { /* save corrompido — retorna null */ }
      }
      return {
        id: account.id,
        email: account.email,
        username: account.username,
        isBanned: account.isBanned,
        createdAt: account.createdAt,
        lastLogin: account.lastLogin,
        hasSave: !!account.player?.saveData,
        saveStats,
        lastPurchase: account.purchases[0] ?? null,
      };
    });

    return { data: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async adminGetPlayerDetail(email: string) {
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: {
        player: {
          include: {
            saveData: true,
            saveAudits: { orderBy: { createdAt: 'desc' }, take: 5 },
          },
        },
        purchases: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!account) throw new NotFoundException('Conta não encontrada.');

    let saveData: Record<string, unknown> | null = null;
    if (account.player?.saveData) {
      try { saveData = JSON.parse(account.player.saveData.data) as Record<string, unknown>; }
      catch { saveData = null; }
    }

    return {
      id: account.id,
      email: account.email,
      username: account.username,
      isBanned: account.isBanned,
      banReason: account.banReason,
      createdAt: account.createdAt,
      lastLogin: account.lastLogin,
      player: account.player
        ? {
            level: account.player.level,
            experience: account.player.experience,
            gold: account.player.gold,
            premiumCurrency: account.player.premiumCurrency,
            characterName: account.player.characterName,
          }
        : null,
      saveData,
      saveRevision: account.player?.saveData?.revision ?? 0,
      saveAudits: account.player?.saveAudits ?? [],
      purchases: account.purchases,
    };
  }

  async adminGrantResources(
    email: string,
    grants: {
      ouro?: number;
      cristaisAstra?: number;
      selosDeInvocacao?: number;
      selosLivres?: number;
      premium?: 'monthly' | 'season' | null;
    },
  ) {
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: { player: { include: { saveData: true } } },
    });
    if (!account?.player) throw new NotFoundException('Jogador não encontrado.');
    if (!account.player.saveData) throw new NotFoundException('Save não encontrado.');

    let saveData: Record<string, unknown>;
    try { saveData = JSON.parse(account.player.saveData.data) as Record<string, unknown>; }
    catch { throw new InternalServerErrorException('Save corrompido.'); }

    const wallet = (saveData['wallet'] as Record<string, unknown>) ?? {};
    const addCapped = (key: string, amount: number) => {
      const current = typeof wallet[key] === 'number' ? (wallet[key] as number) : 0;
      wallet[key] = Math.min(current + amount, SAVE_CAPS[key] ?? Infinity);
    };
    if (grants.ouro)             addCapped('ouro', grants.ouro);
    if (grants.cristaisAstra)    addCapped('cristaisAstra', grants.cristaisAstra);
    if (grants.selosDeInvocacao) addCapped('selosDeInvocacao', grants.selosDeInvocacao);
    if (grants.selosLivres)      addCapped('selosLivres', grants.selosLivres);
    saveData['wallet'] = wallet;

    if (grants.premium) {
      const bp = (saveData['battlePass'] as Record<string, unknown>) ?? {};
      bp['isPremium'] = true;
      bp['premiumType'] = grants.premium;
      const now = new Date();
      if (grants.premium === 'monthly') {
        const exp = new Date(now);
        exp.setDate(exp.getDate() + 30);
        bp['premiumExpiresAt'] = exp.toISOString();
      } else {
        bp['premiumExpiresAt'] = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
      }
      saveData['battlePass'] = bp;
    }

    const data = JSON.stringify(saveData);
    const checksum = createHash('sha256').update(data, 'utf8').digest('hex');
    const nextRevision = account.player.saveData.revision + 1;

    await this.prisma.saveData.update({
      where: { playerId: account.player.id },
      data: { data, checksum, revision: nextRevision },
    });

    return { success: true, revision: nextRevision };
  }

  async adminListPurchases() {
    return this.prisma.purchase.findMany({
      include: { account: { select: { email: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async adminBanAccount(email: string, isBanned: boolean, banReason?: string) {
    const account = await this.prisma.account.findUnique({ where: { email } });
    if (!account) throw new NotFoundException('Conta não encontrada.');
    return this.prisma.$transaction(async (tx) => {
      if (isBanned) {
        await tx.refreshToken.updateMany({
          where: { accountId: account.id },
          data: { revokedAt: new Date() },
        });
      }
      return tx.account.update({
        where: { email },
        data: { isBanned, banReason: isBanned ? (banReason ?? '') : null },
        select: { id: true, email: true, isBanned: true, banReason: true },
      });
    });
  }

  async adminPatchSave(email: string, patches: Record<string, unknown>) {
    const account = await this.prisma.account.findUnique({
      where: { email },
      include: { player: { include: { saveData: true } } },
    });
    if (!account?.player) throw new NotFoundException('Jogador não encontrado.');
    if (!account.player.saveData) throw new NotFoundException('Save não encontrado.');

    let saveData: Record<string, unknown>;
    try { saveData = JSON.parse(account.player.saveData.data) as Record<string, unknown>; }
    catch { throw new InternalServerErrorException('Save corrompido.'); }

    for (const [dotPath, value] of Object.entries(patches)) {
      const keys = dotPath.split('.');
      let cur: Record<string, unknown> = saveData;
      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i] as string;
        if (cur[k] === undefined || cur[k] === null || typeof cur[k] !== 'object') {
          cur[k] = {};
        }
        cur = cur[k] as Record<string, unknown>;
      }
      const lastKey = keys[keys.length - 1] as string;
      cur[lastKey] = value;
    }

    const data = JSON.stringify(saveData);
    const checksum = createHash('sha256').update(data, 'utf8').digest('hex');
    const nextRevision = account.player.saveData.revision + 1;

    await this.prisma.saveData.update({
      where: { playerId: account.player.id },
      data: { data, checksum, revision: nextRevision },
    });

    return { success: true, revision: nextRevision };
  }

  async adminRevokePremiumAll(exceptEmail: string) {
    const players = await this.prisma.player.findMany({
      include: { saveData: true, account: true },
    });

    type SaveUpdate = { playerId: number; data: string; checksum: string; revision: number };
    const updates: SaveUpdate[] = [];

    for (const p of players) {
      if (!p.saveData || p.account?.email === exceptEmail) continue;

      let saveData: Record<string, unknown>;
      try { saveData = JSON.parse(p.saveData.data) as Record<string, unknown>; }
      catch { continue; }

      const bp = saveData['battlePass'] as Record<string, unknown> | undefined;
      if (!bp || !bp['isPremium']) continue;

      bp['isPremium'] = false;
      bp['premiumType'] = '';
      bp['premiumExpiresAt'] = '';

      const data = JSON.stringify(saveData);
      const checksum = createHash('sha256').update(data, 'utf8').digest('hex');
      updates.push({ playerId: p.id, data, checksum, revision: p.saveData.revision + 1 });
    }

    if (updates.length > 0) {
      await this.prisma.$transaction(
        updates.map(({ playerId, data, checksum, revision }) =>
          this.prisma.saveData.update({
            where: { playerId },
            data: { data, checksum, revision },
          }),
        ),
      );
    }

    return { success: true, patched: updates.length };
  }

  async getArenaOpponents(
    accountId: number,
    rating: number,
  ): Promise<{ username: string; characterName: string; rating: number; defenderHeroId: string }[]> {
    const MARGIN = 2000;
    const candidates = await this.prisma.player.findMany({
      where: {
        accountId: { not: accountId },
        arenaDefenderHeroId: { not: null },
        arenaRating: { gte: rating - MARGIN, lte: rating + MARGIN },
      },
      select: {
        arenaRating: true,
        arenaDefenderHeroId: true,
        characterName: true,
        account: { select: { username: true } },
      },
      take: 100,
    });

    const pool = candidates
      .map((p) => ({
        username: p.account.username,
        characterName: p.characterName,
        rating: p.arenaRating,
        defenderHeroId: p.arenaDefenderHeroId as string,
        diff: Math.abs(p.arenaRating - rating),
      }))
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 20);

    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = pool[i]!;
      pool[i] = pool[j]!;
      pool[j] = tmp;
    }

    return pool.slice(0, 5).map(({ username, characterName, rating: r, defenderHeroId }) => ({
      username,
      characterName,
      rating: r,
      defenderHeroId,
    }));
  }

  async summon(accountId: number, input: SummonInput) {
    const banner = BANNER_MAP[input.bannerId];
    if (!banner) throw new NotFoundException('Banner não encontrado.');

    const player = await this.prisma.player.findUnique({
      where: { accountId },
      include: { saveData: true },
    });
    if (!player) throw new NotFoundException('Jogador não encontrado.');
    if (!player.saveData) throw new NotFoundException('Save não encontrado.');

    let save: Record<string, unknown>;
    try {
      save = JSON.parse(player.saveData.data) as Record<string, unknown>;
    } catch {
      throw new InternalServerErrorException('Save corrompido.');
    }

    const wallet = (save['wallet'] ?? {}) as Record<string, number>;
    const selosLivres = (wallet['selosLivres'] as number) ?? 0;
    const selosDeInvocacao = (wallet['selosDeInvocacao'] as number) ?? 0;
    const totalSeals = selosLivres + selosDeInvocacao;
    if (totalSeals < input.count)
      throw new ConflictException('Selos insuficientes.');

    const bannerPity = (save['bannerPity'] as Array<{ bannerId: string; pullCount: number }>) ?? [];
    const collectedHeroIds = (save['collectedHeroIds'] as string[]) ?? [];
    const fragmentos = (save['fragmentos'] as Array<{ heroId: string; count: number }>) ?? [];
    const invocador = (save['invocador'] as { level: number; experience: number; totalPulls: number }) ?? { level: 1, experience: 0, totalPulls: 0 };

    const pityEntry = bannerPity.find((p) => p.bannerId === input.bannerId);
    let currentPity = pityEntry?.pullCount ?? 0;

    let selosLivresSpent = 0;
    let selosDeInvocacaoSpent = 0;
    const results: Array<{ heroId: string; rarity: string; isNew: boolean; wasPity: boolean; fragmentsAwarded: number }> = [];
    const newHeroKeys: string[] = [];
    const fragMap = new Map<string, number>();

    for (let i = 0; i < input.count; i++) {
      const { heroId, rarity, wasPity } = rollBanner(banner, currentPity);
      const isLegend = rarity === 'Lendário' || rarity === 'Mítico' || rarity === 'Divino';
      const key = `${input.bannerId}|${heroId}`;
      const isNew = !collectedHeroIds.includes(key) && !newHeroKeys.includes(key);

      if (isLegend) currentPity = 0;
      else currentPity++;

      const fragmentsAwarded = isNew ? 0 : 1;
      results.push({ heroId, rarity, isNew, wasPity, fragmentsAwarded });

      if (isNew) {
        newHeroKeys.push(key);
      } else {
        fragMap.set(heroId, (fragMap.get(heroId) ?? 0) + 1);
      }

      // spend seals: free first
      const remainingFree = selosLivres - selosLivresSpent;
      if (remainingFree > 0) selosLivresSpent++;
      else selosDeInvocacaoSpent++;

      // invocador XP
      invocador.totalPulls++;
      invocador.experience += 10;
      const threshold = 100 * invocador.level;
      while (invocador.experience >= threshold) {
        invocador.experience -= threshold;
        invocador.level++;
      }
    }

    // Apply changes to save
    wallet['selosLivres'] = selosLivres - selosLivresSpent;
    wallet['selosDeInvocacao'] = selosDeInvocacao - selosDeInvocacaoSpent;
    save['wallet'] = wallet;

    if (pityEntry) pityEntry.pullCount = currentPity;
    else bannerPity.push({ bannerId: input.bannerId, pullCount: currentPity });
    save['bannerPity'] = bannerPity;

    const mergedCollected = [...collectedHeroIds, ...newHeroKeys];
    save['collectedHeroIds'] = mergedCollected;

    const mergedFrags = [...fragmentos];
    for (const [heroId, count] of fragMap) {
      const idx = mergedFrags.findIndex((f) => f.heroId === heroId);
      if (idx >= 0) mergedFrags[idx]!.count += count;
      else mergedFrags.push({ heroId, count });
    }
    save['fragmentos'] = mergedFrags;
    save['invocador'] = invocador;

    const newData = JSON.stringify(save);
    const newChecksum = createHash('sha256').update(newData, 'utf8').digest('hex');
    const newRevision = player.saveData.revision + 1;

    await this.prisma.saveData.update({
      where: { playerId: player.id },
      data: { data: newData, checksum: newChecksum, revision: newRevision, schemaVersion: player.saveData.schemaVersion },
    });

    return {
      results,
      revision: newRevision,
      newPity: currentPity,
      selosLivresSpent,
      selosDeInvocacaoSpent,
      newHeroKeys,
      fragmentosAdded: Array.from(fragMap.entries()).map(([heroId, count]) => ({ heroId, count })),
      invocador,
    };
  }

  async downloadSave(accountId: number) {
    const player = await this.prisma.player.findUnique({
      where: { accountId },
      include: { saveData: true },
    });
    if (!player) throw new NotFoundException('Jogador não encontrado.');
    const save = player.saveData;
    if (!save) throw new NotFoundException('Save não encontrado.');

    const calculatedChecksum = createHash('sha256')
      .update(save.data, 'utf8')
      .digest('hex');
    if (calculatedChecksum !== save.checksum) {
      throw new InternalServerErrorException(
        'Não foi possível carregar o save com segurança.',
      );
    }

    const MAX_OFFLINE_MS = 8 * 60 * 60 * 1000;
    const serverOfflineMs = Math.min(
      Date.now() - save.updatedAt.getTime(),
      MAX_OFFLINE_MS,
    );

    let parsedData: unknown;
    try {
      parsedData = JSON.parse(save.data);
    } catch {
      throw new InternalServerErrorException('Save data is corrupted');
    }

    return saveDownloadSchema.parse({
      schemaVersion: save.schemaVersion,
      revision: save.revision,
      checksum: save.checksum,
      data: parsedData,
      serverOfflineMs,
    });
  }
}
