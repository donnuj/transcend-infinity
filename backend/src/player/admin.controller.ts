import { Body, Controller, Headers, Post } from '@nestjs/common';
import { PlayerService } from './player.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly playerService: PlayerService) {}

  @Post('patch-save')
  patchSave(
    @Headers('x-admin-secret') secret: string,
    @Body() body: { email: string; patches: Record<string, unknown> },
  ) {
    return this.playerService.adminPatchSave(secret ?? '', body.email, body.patches);
  }
}
