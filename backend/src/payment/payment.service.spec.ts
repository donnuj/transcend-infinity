import { UnauthorizedException } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';

function makeSignature(paymentId: string, requestId: string, secret: string, ts?: string): string {
  const timestamp = ts ?? String(Date.now());
  const manifest = `id:${paymentId};request-id:${requestId};ts:${timestamp};`;
  const hmac = createHmac('sha256', secret).update(manifest).digest('hex');
  return `ts=${timestamp},v1=${hmac}`;
}

describe('PaymentService.handleWebhook', () => {
  const purchaseCreate = jest.fn();
  const playerFindUnique = jest.fn();
  const saveDataUpdate = jest.fn();

  const prisma = {
    player: { findUnique: playerFindUnique },
    saveData: { update: saveDataUpdate },
    purchase: { create: purchaseCreate },
  } as unknown as PrismaService;

  const service = new PaymentService(prisma);

  const mpGetMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Silencia o construtor do MercadoPago
    jest.spyOn(service as never, 'verifyWebhookSignature').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('ignora eventos que não sejam "payment"', async () => {
    const result = await service.handleWebhook({ type: 'merchant_order' }, undefined, undefined);
    expect(result).toEqual({ ok: true });
    expect(playerFindUnique).not.toHaveBeenCalled();
  });

  it('ignora webhook sem paymentId', async () => {
    const result = await service.handleWebhook({ type: 'payment', data: {} }, undefined, undefined);
    expect(result).toEqual({ ok: true });
    expect(playerFindUnique).not.toHaveBeenCalled();
  });

  it('ignora pagamento não aprovado', async () => {
    const Payment = jest.fn().mockImplementation(() => ({
      get: mpGetMock,
    }));
    jest.spyOn(require('mercadopago'), 'Payment').mockImplementation(Payment);
    mpGetMock.mockResolvedValue({ status: 'pending', external_reference: '1:monthly' });

    const result = await service.handleWebhook(
      { type: 'payment', data: { id: '999' } },
      undefined,
      undefined,
    );

    expect(result).toEqual({ ok: true });
    expect(playerFindUnique).not.toHaveBeenCalled();
  });
});

describe('PaymentService.verifyWebhookSignature', () => {
  const prisma = {} as unknown as PrismaService;
  const service = new PaymentService(prisma);
  const secret = 'meu-segredo-de-webhook-32-chars!!';

  const originalEnv = process.env.MP_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.MP_WEBHOOK_SECRET = secret;
  });

  afterEach(() => {
    process.env.MP_WEBHOOK_SECRET = originalEnv;
  });

  it('não lança quando a assinatura é válida', () => {
    const sig = makeSignature('42', 'req-abc', secret);
    expect(() =>
      (service as never)['verifyWebhookSignature']('42', 'req-abc', sig),
    ).not.toThrow();
  });

  it('lança UnauthorizedException quando a assinatura está ausente', () => {
    expect(() =>
      (service as never)['verifyWebhookSignature']('42', 'req-abc', undefined),
    ).toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException quando o HMAC não confere', () => {
    const sig = makeSignature('42', 'req-abc', 'outro-segredo-totalmente-diferente!!');
    expect(() =>
      (service as never)['verifyWebhookSignature']('42', 'req-abc', sig),
    ).toThrow(UnauthorizedException);
  });

  it('lança UnauthorizedException quando o formato da assinatura é inválido', () => {
    expect(() =>
      (service as never)['verifyWebhookSignature']('42', 'req-abc', 'malformed'),
    ).toThrow(UnauthorizedException);
  });

  it('não valida quando MP_WEBHOOK_SECRET não está configurado', () => {
    delete process.env.MP_WEBHOOK_SECRET;
    expect(() =>
      (service as never)['verifyWebhookSignature']('42', 'req-abc', undefined),
    ).not.toThrow();
  });
});
