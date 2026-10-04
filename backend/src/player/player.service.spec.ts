import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PlayerService } from './player.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PlayerService save integrity', () => {
  const saveCreate = jest.fn();
  const saveUpdateMany = jest.fn();
  const auditCreate = jest.fn();
  const auditFindMany = jest.fn().mockResolvedValue([]);
  const auditDeleteMany = jest.fn().mockResolvedValue({ count: 0 });
  const playerUpdate = jest.fn().mockResolvedValue({});
  const transactionClient = {
    saveData: {
      create: saveCreate,
      updateMany: saveUpdateMany,
    },
    saveAudit: {
      create: auditCreate,
      findMany: auditFindMany,
      deleteMany: auditDeleteMany,
    },
    player: {
      update: playerUpdate,
    },
  };
  const playerFindUnique = jest.fn();
  const saveDataFindUnique = jest.fn();
  const prisma = {
    player: {
      findUnique: playerFindUnique,
    },
    saveData: {
      findUnique: saveDataFindUnique,
    },
    $transaction: jest.fn(
      async (
        callback: (client: typeof transactionClient) => Promise<boolean>,
      ) => callback(transactionClient),
    ),
  } as unknown as PrismaService;
  const service = new PlayerService(prisma);

  beforeEach(() => {
    jest.clearAllMocks();
    playerFindUnique.mockResolvedValue({ id: 10, accountId: 1 });
    // Por padrão, nenhum save existente (novo jogador)
    saveDataFindUnique.mockResolvedValue(null);
  });

  it('cria a primeira revisão com checksum e auditoria', async () => {
    saveCreate.mockResolvedValue({});
    auditCreate.mockResolvedValue({});

    const result = await service.uploadSave(1, {
      schemaVersion: 1,
      revision: 0,
      data: { Audio: { MasterVolume: 0.8 } },
    });

    expect(result.revision).toBe(1);
    expect(result.checksum).toHaveLength(64);
    expect(JSON.stringify(saveCreate.mock.calls[0] as unknown)).toContain(
      '"playerId":10',
    );
    expect(JSON.stringify(auditCreate.mock.calls[0] as unknown)).toContain(
      '"revision":1',
    );
  });

  it('retorna conflito quando a revisão esperada está desatualizada', async () => {
    saveUpdateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.uploadSave(1, {
        schemaVersion: 1,
        revision: 3,
        data: { Audio: {} },
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(auditCreate).not.toHaveBeenCalled();
  });

  it('atualiza o save quando a revisão esperada confere', async () => {
    saveUpdateMany.mockResolvedValue({ count: 1 });
    auditCreate.mockResolvedValue({});

    const result = await service.uploadSave(1, {
      schemaVersion: 1,
      revision: 3,
      data: { Audio: { MusicVolume: 0.5 } },
    });

    expect(result.revision).toBe(4);
    expect(JSON.stringify(saveUpdateMany.mock.calls[0] as unknown)).toContain(
      '"revision":3',
    );
    expect(JSON.stringify(auditCreate.mock.calls[0] as unknown)).toContain(
      '"revision":4',
    );
  });

  it('retorna envelope íntegro no download', async () => {
    const data = JSON.stringify({ Audio: { MasterVolume: 0.8 } });
    const checksum = createHash('sha256').update(data, 'utf8').digest('hex');
    playerFindUnique.mockResolvedValue({
      id: 10,
      accountId: 1,
      saveData: {
        schemaVersion: 1,
        revision: 2,
        checksum,
        data,
        updatedAt: new Date(Date.now() - 5000),
      },
    });

    const result = await service.downloadSave(1);
    expect(result).toMatchObject({
      schemaVersion: 1,
      revision: 2,
      checksum,
      data: { Audio: { MasterVolume: 0.8 } },
    });
  });

  it('bloqueia download quando o conteúdo não corresponde ao checksum', async () => {
    playerFindUnique.mockResolvedValue({
      id: 10,
      accountId: 1,
      saveData: {
        schemaVersion: 1,
        revision: 2,
        checksum: 'a'.repeat(64),
        data: JSON.stringify({ Audio: { MasterVolume: 0.8 } }),
        updatedAt: new Date(),
      },
    });

    await expect(service.downloadSave(1)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it('sempre resolve o player pelo accountId autenticado', async () => {
    saveCreate.mockResolvedValue({});
    auditCreate.mockResolvedValue({});

    await service.uploadSave(77, {
      schemaVersion: 1,
      revision: 0,
      data: { Audio: {} },
    });

    expect(playerFindUnique).toHaveBeenCalledWith({
      where: { accountId: 77 },
    });
  });

  it('retorna conflito quando revision=0 mas save já existe no DB', async () => {
    saveDataFindUnique.mockResolvedValue({
      id: 1, playerId: 10, data: '{}', checksum: 'x'.repeat(64),
      schemaVersion: 1, revision: 3,
    });

    await expect(
      service.uploadSave(1, { schemaVersion: 1, revision: 0, data: { Audio: {} } }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejeita upload quando o jogador não existe', async () => {
    playerFindUnique.mockResolvedValue(null);

    await expect(
      service.uploadSave(404, {
        schemaVersion: 1,
        revision: 0,
        data: { Audio: {} },
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('lança NotFoundException quando o jogador ainda não possui save', async () => {
    playerFindUnique.mockResolvedValue({
      id: 10,
      accountId: 1,
      saveData: null,
    });

    await expect(service.downloadSave(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejeita download quando o jogador não existe', async () => {
    playerFindUnique.mockResolvedValue(null);

    await expect(service.downloadSave(404)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
