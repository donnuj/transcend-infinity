import { Controller, Get } from '@nestjs/common';
import { z } from 'zod';

const healthResponseSchema = z.object({
  status: z.literal('ok'),
});

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return healthResponseSchema.parse({ status: 'ok' });
  }
}
