import type { Request } from 'express';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';

interface AuthenticatedRequest extends Request {
  user: {
    accountId: number;
    email: string;
  };
}

describe('PlayerController', () => {
  const getProfile = jest.fn();
  const uploadSave = jest.fn();
  const downloadSave = jest.fn();
  const playerService = {
    getProfile,
    uploadSave,
    downloadSave,
  } as unknown as PlayerService;
  const controller = new PlayerController(playerService);
  const request = {
    user: { accountId: 77, email: 'player@example.com' },
  } as AuthenticatedRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isola todas as leituras pelo accountId autenticado', async () => {
    await controller.getProfile(request);
    await controller.downloadSave(request);

    expect(getProfile).toHaveBeenCalledWith(77);
    expect(downloadSave).toHaveBeenCalledWith(77);
  });

  it('não aceita accountId do payload ao enviar o save', async () => {
    const save = {
      schemaVersion: 1 as const,
      revision: 0,
      data: { Audio: { MasterVolume: 0.8 } },
    };

    await controller.uploadSave(request, save);

    expect(uploadSave).toHaveBeenCalledWith(77, save);
  });
});
