import { Injectable } from '@nestjs/common';
import { LivekitClient } from './clients/livekit.client';
import { CreateTokenDto } from './dto/create-token.dto';

@Injectable()
export class LivekitService {
  constructor(private readonly livekitClient: LivekitClient) {}

  async createRoom() {
    // random name
    const name = Math.random().toString(36).substring(2, 15);
    const room = await this.livekitClient.createRoom(name);
    return room;
  }

  async listRooms() {
    const rooms = await this.livekitClient.listRooms();
    return rooms;
  }

  async deleteAllRooms() {
    const rooms = await this.listRooms();
    for (const room of rooms) {
      await this.livekitClient.deleteRoom(room.name);
    }
  }

  async deleteRoom(name: string) {
    await this.livekitClient.deleteRoom(name);
  }

  async createToken(createTokenDto: CreateTokenDto) {
    const token = await this.livekitClient.createToken(createTokenDto);
    return token;
  }
}
