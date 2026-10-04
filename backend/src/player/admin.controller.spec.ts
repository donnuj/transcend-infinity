import { AdminController } from './admin.controller';
import { PlayerService } from './player.service';

describe('AdminController', () => {
  const adminListPlayers = jest.fn();
  const adminGetPlayerDetail = jest.fn();
  const adminGrantResources = jest.fn();
  const adminListPurchases = jest.fn();
  const adminBanAccount = jest.fn();
  const adminPatchSave = jest.fn();
  const adminRevokePremiumAll = jest.fn();

  const playerService = {
    adminListPlayers,
    adminGetPlayerDetail,
    adminGrantResources,
    adminListPurchases,
    adminBanAccount,
    adminPatchSave,
    adminRevokePremiumAll,
  } as unknown as PlayerService;

  const controller = new AdminController(playerService);

  beforeEach(() => jest.clearAllMocks());

  describe('listPlayers', () => {
    it('delega para o service com paginação padrão quando sem query params', () => {
      controller.listPlayers(undefined, undefined);
      expect(adminListPlayers).toHaveBeenCalledWith(1, 50);
    });

    it('parseia page e limit corretamente', () => {
      controller.listPlayers('3', '20');
      expect(adminListPlayers).toHaveBeenCalledWith(3, 20);
    });

    it('garante page mínimo 1 para valores inválidos', () => {
      controller.listPlayers('0', '50');
      expect(adminListPlayers).toHaveBeenCalledWith(1, 50);
    });

    it('garante limit máximo 100', () => {
      controller.listPlayers('1', '999');
      expect(adminListPlayers).toHaveBeenCalledWith(1, 100);
    });

    it('cai no default 50 quando limit é 0 (inválido)', () => {
      controller.listPlayers('1', '0');
      expect(adminListPlayers).toHaveBeenCalledWith(1, 50);
    });
  });

  describe('getPlayer', () => {
    it('repassa o email para o service', () => {
      controller.getPlayer('test@example.com');
      expect(adminGetPlayerDetail).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('grantResources', () => {
    it('repassa email e grants para o service', () => {
      const grants = { cristaisAstra: 100 };
      controller.grantResources({ email: 'test@example.com', grants });
      expect(adminGrantResources).toHaveBeenCalledWith('test@example.com', grants);
    });
  });

  describe('banAccount', () => {
    it('repassa ban com razão para o service', () => {
      controller.banAccount({ email: 'bad@example.com', isBanned: true, banReason: 'cheating' });
      expect(adminBanAccount).toHaveBeenCalledWith('bad@example.com', true, 'cheating');
    });

    it('repassa unban para o service', () => {
      controller.banAccount({ email: 'bad@example.com', isBanned: false });
      expect(adminBanAccount).toHaveBeenCalledWith('bad@example.com', false, undefined);
    });
  });

  describe('patchSave (legacy)', () => {
    it('repassa email e patches para o service sem secret', () => {
      const patches = { 'wallet.ouro': 1000 };
      controller.patchSave({ email: 'test@example.com', patches });
      expect(adminPatchSave).toHaveBeenCalledWith('test@example.com', patches);
    });
  });

  describe('revokePremiumAll (legacy)', () => {
    it('repassa exceptEmail para o service sem secret', () => {
      controller.revokePremiumAll({ exceptEmail: 'admin@example.com' });
      expect(adminRevokePremiumAll).toHaveBeenCalledWith('admin@example.com');
    });
  });
});
