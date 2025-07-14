import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { LivekitController } from './livekit/livekit.controller';
import { LivekitModule } from './livekit/livekit.module';

@Module({
  imports: [LivekitModule],
  controllers: [LivekitController, AppController],
  providers: [],
})
export class AppModule {}
