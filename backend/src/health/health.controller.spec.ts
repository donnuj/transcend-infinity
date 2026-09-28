import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('confirma que o processo está pronto para receber tráfego', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({ status: 'ok' });
  });
});
