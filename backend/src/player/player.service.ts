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
