import { Injectable } from '@nestjs/common';
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LivekitClient {
  private readonly roomService = new RoomServiceClient(
    process.env.LIVEKIT_URL || '',
    process.env.LIVEKIT_API_KEY || '',
    process.env.LIVEKIT_API_SECRET || '',
  );

  async createRoom(name: string) {
    const room = await this.roomService.createRoom({
      name,
    });
    return room;
  }

  async listRooms() {
    const rooms = await this.roomService.listRooms();
    return rooms;
  }

  async deleteRoom(name: string) {
    await this.roomService.deleteRoom(name);
  }

  async createToken() {
    // If this room doesn't exist, it'll be automatically created when the first
    // participant joins
    const roomName = 'quickstart-room';
    // Identifier to be used for participant.
    // It's available as LocalParticipant.identity with livekit-client SDK

    const participantName = Math.random().toString(36).substring(2, 15);

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: participantName,
        // Token to expire after 10 minutes
        ttl: '10m',
      },
    );
    at.addGrant({ roomJoin: true, room: roomName });

    return await at.toJwt();
  }
}
