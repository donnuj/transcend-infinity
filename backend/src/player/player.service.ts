import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import {
  MONOTONIC_PATHS,
  playerProfileSchema,
  saveDownloadSchema,
  saveUploadResponseSchema,
  type SaveUpload,
} from './player.schemas';

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

        await transaction.saveAudit.create({
          data: {
            playerId: player.id,
            revision: nextRevision,
            checksum,
          },
        });
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

  async adminListPlayers() {
    const accounts = await this.prisma.account.findMany({
      include: {
        player: { include: { saveData: true } },
        purchases: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastLogin: 'desc' },
    });

    return accounts.map((account) => {
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
        lastPurchase: (account.purchases as { type: string; amount: number; createdAt: Date }[])[0] ?? null,
      };
    });
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
    if (grants.ouro) wallet['ouro'] = ((wallet['ouro'] as number) || 0) + grants.ouro;
    if (grants.cristaisAstra) wallet['cristaisAstra'] = ((wallet['cristaisAstra'] as number) || 0) + grants.cristaisAstra;
    if (grants.selosDeInvocacao) wallet['selosDeInvocacao'] = ((wallet['selosDeInvocacao'] as number) || 0) + grants.selosDeInvocacao;
    if (grants.selosLivres) wallet['selosLivres'] = ((wallet['selosLivres'] as number) || 0) + grants.selosLivres;
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
    return this.prisma.account.update({
      where: { email },
      data: { isBanned, banReason: isBanned ? (banReason ?? '') : null },
      select: { id: true, email: true, isBanned: true, banReason: true },
    });
  }

  async adminPatchSave(secret: string, email: string, patches: Record<string, unknown>) {
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      throw new UnauthorizedException('Acesso negado.');
    }

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

  async adminRevokePremiumAll(secret: string, exceptEmail: string) {
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      throw new UnauthorizedException('Acesso negado.');
    }

    const players = await this.prisma.player.findMany({
      include: { saveData: true, account: true },
    });

    let patched = 0;
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

      await this.prisma.saveData.update({
        where: { playerId: p.id },
        data: { data, checksum, revision: p.saveData.revision + 1 },
      });
      patched++;
    }

    return { success: true, patched };
  }

  async getArenaOpponents(
    accountId: number,
    rating: number,
  ): Promise<{ username: string; characterName: string; rating: number; defenderHeroId: string }[]> {
    const players = await this.prisma.player.findMany({
      include: { saveData: true, account: true },
    });

    const results: { username: string; characterName: string; rating: number; defenderHeroId: string; diff: number }[] = [];

    for (const p of players) {
      if (p.accountId === accountId) continue;
      if (!p.saveData) continue;

      let parsed: Record<string, unknown>;
      try { parsed = JSON.parse(p.saveData.data) as Record<string, unknown>; }
      catch { continue; }

      const arena = parsed['arena'] as Record<string, unknown> | undefined;
      if (!arena) continue;

      const opponentRating = typeof arena['rating'] === 'number' ? arena['rating'] : null;
      const defenderHeroId = typeof arena['defenderHeroId'] === 'string' ? arena['defenderHeroId'] : null;
      if (opponentRating === null || defenderHeroId === null) continue;

      const diff = Math.abs(opponentRating - rating);
      if (diff > 2000) continue;

      results.push({
        username: p.account.username,
        characterName: p.characterName,
        rating: opponentRating,
        defenderHeroId,
        diff,
      });
    }

    results.sort((a, b) => a.diff - b.diff);
    const pool = results.slice(0, 20);
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
