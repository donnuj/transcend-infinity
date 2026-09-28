import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
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
      let storedData: Record<string, unknown>;
      try { storedData = JSON.parse(existing.data) as Record<string, unknown>; }
      catch { storedData = {}; }

      const newData = saveJson.data as Record<string, unknown>;
      for (const { path } of MONOTONIC_PATHS) {
        const oldVal = this.getNestedValue(storedData, path);
        const newVal = this.getNestedValue(newData, path);
        if (typeof oldVal === 'number' && typeof newVal === 'number' && newVal < oldVal) {
          throw new BadRequestException(
            `${path.join('.')} não pode retrocedar (${oldVal} → ${newVal}).`,
          );
        }
      }
    }

    const data = JSON.stringify(saveJson.data);
    const checksum = createHash('sha256').update(data, 'utf8').digest('hex');
    const nextRevision = saveJson.revision + 1;

    try {
      const saved = await this.prisma.$transaction(async (transaction) => {
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
        error instanceof Prisma.PrismaClientKnownRequestError &&
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

  async downloadSave(accountId: number) {
    const player = await this.prisma.player.findUnique({
      where: { accountId },
      include: { saveData: true },
    });
    if (!player) throw new NotFoundException('Jogador não encontrado.');
    const save = player.saveData;
    if (!save) return null;

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
