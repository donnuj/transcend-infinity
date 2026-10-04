import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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
  listPlayers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.playerService.adminListPlayers(
      Math.max(1, parseInt(page ?? '1', 10) || 1),
      Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50)),
    );
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

  // ── Legacy endpoints (now protected by AdminGuard) ───────────────────────

  @UseGuards(AdminGuard)
  @Post('patch-save')
  patchSave(
    @Body() body: { email: string; patches: Record<string, unknown> },
  ) {
    return this.playerService.adminPatchSave(body.email, body.patches);
  }

  @UseGuards(AdminGuard)
  @Post('revoke-premium-all')
  revokePremiumAll(
    @Body() body: { exceptEmail: string },
  ) {
    return this.playerService.adminRevokePremiumAll(body.exceptEmail);
  }
}
