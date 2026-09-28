import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlayerService } from './player.service';
import type { Request as ExpressRequest } from 'express';
import { saveUploadSchema, type SaveUpload } from './player.schemas';
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe';

interface AuthenticatedRequest extends ExpressRequest {
  user: {
    accountId: number;
    email: string;
  };
}

@Controller('player')
@UseGuards(JwtAuthGuard)
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return this.playerService.getProfile(req.user.accountId);
  }

  @Post('save')
  uploadSave(
    @Request() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(saveUploadSchema)) body: SaveUpload,
  ) {
    return this.playerService.uploadSave(req.user.accountId, body);
  }

  @Get('save')
  downloadSave(@Request() req: AuthenticatedRequest) {
    return this.playerService.downloadSave(req.user.accountId);
  }
}
