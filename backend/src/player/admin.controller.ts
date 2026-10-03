import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { PlayerService } from './player.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly playerService: PlayerService) {}

  // ── JWT-protected admin endpoints (email = antony.jasper@gmail.com) ──────

  @UseGuards(AdminGuard)
  @Get('players')
  listPlayers() {
    return this.playerService.adminListPlayers();
  }

  @UseGuards(AdminGuard)
  @Get('player/:email')
  getPlayer(@Param('email') email: string) {
    return this.playerService.adminGetPlayerDetail(email);
  }

  @UseGuards(AdminGuard)
  @Post('grant')
  grantResources(
    @Body()
    body: {
      email: string;
      grants: {
        ouro?: number;
        cristaisAstra?: number;
        selosDeInvocacao?: number;
        selosLivres?: number;
        premium?: 'monthly' | 'season' | null;
      };
    },
  ) {
    return this.playerService.adminGrantResources(body.email, body.grants);
  }

  @UseGuards(AdminGuard)
  @Get('purchases')
  listPurchases() {
    return this.playerService.adminListPurchases();
  }

  @UseGuards(AdminGuard)
  @Post('ban')
  banAccount(
    @Body() body: { email: string; isBanned: boolean; banReason?: string },
  ) {
    return this.playerService.adminBanAccount(body.email, body.isBanned, body.banReason);
  }

  // ── Legacy secret-based endpoints ────────────────────────────────────────

  @Post('patch-save')
  patchSave(
    @Headers('x-admin-secret') secret: string,
    @Body() body: { email: string; patches: Record<string, unknown> },
  ) {
    return this.playerService.adminPatchSave(secret ?? '', body.email, body.patches);
  }

  @Post('revoke-premium-all')
  revokePremiumAll(
    @Headers('x-admin-secret') secret: string,
    @Body() body: { exceptEmail: string },
  ) {
    return this.playerService.adminRevokePremiumAll(secret ?? '', body.exceptEmail);
  }
}
