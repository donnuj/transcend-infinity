import { Injectable, UnauthorizedException } from '@nestjs/common';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

@Injectable()
export class PaymentService {
  private readonly mpClient: MercadoPagoConfig;

  constructor(private readonly prisma: PrismaService) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN ?? '',
    });
  }

  async createPreference(accountId: number, type: 'monthly' | 'season') {
    const isMonthly = type === 'monthly';
    const price = isMonthly ? 14.99 : 29.99;
    const title = isMonthly
      ? 'Battle Pass Premium — Mensal'
      : 'Battle Pass Premium — Temporada';
    const baseUrl =
      process.env.FRONTEND_URL ?? 'https://transcend-infinity.pages.dev';

    const preference = new Preference(this.mpClient);
    const result = await preference.create({
      body: {
        items: [
          {
            id: `premium_${type}`,
            title,
            quantity: 1,
            unit_price: price,
            currency_id: 'BRL',
          },
        ],
        external_reference: `${accountId}:${type}`,
        back_urls: {
          success: `${baseUrl}/game?payment=success`,
          failure: `${baseUrl}/game?payment=failure`,
          pending: `${baseUrl}/game?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${
          process.env.BACKEND_URL ?? 'https://api.transcendinfinity.com.br'
        }/api/v1/payment/webhook`,
      },
    });

    return { init_point: result.init_point, preference_id: result.id };
  }

  private verifyWebhookSignature(
    paymentId: string,
    requestId: string | undefined,
    signature: string | undefined,
  ): void {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) return; // sem secret configurado: não valida (dev/staging sem webhook secret)

    if (!signature) throw new UnauthorizedException('Assinatura ausente.');

    // x-signature formato: ts=TIMESTAMP,v1=HMAC
    const tsMatch = signature.match(/ts=(\d+)/);
    const v1Match = signature.match(/v1=([0-9a-f]+)/);
    if (!tsMatch || !v1Match) throw new UnauthorizedException('Assinatura inválida.');

    const ts = tsMatch[1] as string;
    const receivedHmac = v1Match[1] as string;

    const manifest = `id:${paymentId};request-id:${requestId ?? ''};ts:${ts};`;
    const expected = createHmac('sha256', secret).update(manifest).digest('hex');

    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(receivedHmac, 'hex');
    if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
      throw new UnauthorizedException('Assinatura inválida.');
    }
  }

  async handleWebhook(
    body: Record<string, unknown>,
    signature: string | undefined,
    requestId: string | undefined,
  ) {
    if (body['type'] !== 'payment') return { ok: true };

    const paymentId = (body['data'] as Record<string, unknown>)?.['id'];
    if (!paymentId) return { ok: true };

    this.verifyWebhookSignature(String(paymentId), requestId, signature);

    const paymentApi = new Payment(this.mpClient);
    let paymentData: Awaited<ReturnType<typeof paymentApi.get>>;
    try {
      paymentData = await paymentApi.get({ id: String(paymentId) });
    } catch {
      return { ok: true };
    }

    if (paymentData.status !== 'approved') return { ok: true };

    const externalRef = paymentData.external_reference;
    if (!externalRef) return { ok: true };

    const [accountIdStr, type] = externalRef.split(':');
    const accountId = parseInt(accountIdStr ?? '', 10);
    if (isNaN(accountId)) return { ok: true };

    const premiumType = (type as 'monthly' | 'season') ?? 'season';
    await this.activatePremium(accountId, premiumType);

    try {
      await this.prisma.purchase.create({
        data: {
          accountId,
          type: premiumType,
          paymentId: String(paymentId),
          amount: premiumType === 'monthly' ? 14.99 : 29.99,
          status: 'approved',
        },
      });
    } catch { /* idempotência: ignora duplicate se webhook for repetido */ }

    return { ok: true };
  }

  private async activatePremium(
    accountId: number,
    type: 'monthly' | 'season',
  ) {
    const player = await this.prisma.player.findUnique({
      where: { accountId },
      include: { saveData: true },
    });
    if (!player?.saveData) return;

    let saveData: Record<string, unknown>;
    try {
      saveData = JSON.parse(player.saveData.data) as Record<string, unknown>;
    } catch {
      return;
    }

    const bp = (saveData['battlePass'] as Record<string, unknown>) ?? {};
    bp['isPremium'] = true;
    bp['premiumType'] = type;

    const now = new Date();
    if (type === 'monthly') {
      const exp = new Date(now);
      exp.setDate(exp.getDate() + 30);
      bp['premiumExpiresAt'] = exp.toISOString();
    } else {
      bp['premiumExpiresAt'] = new Date(
        now.getFullYear(),
        11,
        31,
        23,
        59,
        59,
      ).toISOString();
    }
    saveData['battlePass'] = bp;

    const data = JSON.stringify(saveData);
    const checksum = createHash('sha256').update(data, 'utf8').digest('hex');

    await this.prisma.saveData.update({
      where: { playerId: player.id },
      data: { data, checksum, revision: player.saveData.revision + 1 },
    });
  }
}
