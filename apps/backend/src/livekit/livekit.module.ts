import { Module } from '@nestjs/common';
import { LivekitService } from './livekit.service';
import { LivekitClient } from './clients/livekit.client';

@Module({
  providers: [LivekitService, LivekitClient],
  exports: [LivekitService],
})
export class LivekitModule {}
