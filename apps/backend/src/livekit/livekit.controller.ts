import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { LivekitService } from './livekit.service';
import { CreateTokenDto } from './dto/create-token.dto';

@Controller('livekit')
export class LivekitController {
  constructor(private readonly livekitService: LivekitService) {}

  @Post('rooms')
  createRoom() {
    return this.livekitService.createRoom();
  }

  @Get('rooms')
  listRooms() {
    return this.livekitService.listRooms();
  }

  @Delete('rooms')
  deleteAllRooms() {
    return this.livekitService.deleteAllRooms();
  }

  @Delete('rooms/:name')
  deleteRoom(@Param('name') name: string) {
    return this.livekitService.deleteRoom(name);
  }

  @Post('tokens')
  createToken(@Body() createTokenDto: CreateTokenDto) {
    return this.livekitService.createToken(createTokenDto);
  }
}
