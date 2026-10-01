import { Module } from '@nestjs/common';
import { PlayerController } from './player.controller';
import { AdminController } from './admin.controller';
import { PlayerService } from './player.service';

@Module({
  controllers: [PlayerController, AdminController],
  providers: [PlayerService],
})
export class PlayerModule {}
