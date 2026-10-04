import { Body, Controller, Headers, Post, Request, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

interface AuthRequest extends ExpressRequest {
  user: { accountId: number; email: string };
}

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('create-preference')
  @UseGuards(JwtAuthGuard)
  createPreference(
    @Request() req: AuthRequest,
    @Body() body: { type: 'monthly' | 'season' },
  ) {
    return this.paymentService.createPreference(req.user.accountId, body.type);
  }

  @Post('webhook')
  handleWebhook(
    @Body() body: Record<string, unknown>,
    @Headers('x-signature') signature: string | undefined,
    @Headers('x-request-id') requestId: string | undefined,
  ) {
    return this.paymentService.handleWebhook(body, signature, requestId);
  }
}
