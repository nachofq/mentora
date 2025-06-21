import { Address } from 'viem';

export const MENTORA_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MENTORA_ADDRESS! as Address;

// Debug logging to see what address is being used
console.log('Contract configuration:', {
  NEXT_PUBLIC_MENTORA_ADDRESS: process.env.NEXT_PUBLIC_MENTORA_ADDRESS,
  MENTORA_CONTRACT_ADDRESS,
  expectedAddress: '0xf16Bf5Dc5Be24a29F551dB022D53df6884AAc39D',
});

// LobbyState enum (values from contract)
export enum LobbyState {
  Created = 0,
  Accepted = 1,
  Cancelled = 2,
  Completed = 3,
}

// Helper type for lobby info with proper typing
export type LobbyInfo = {
  id: bigint;
  creator: string;
  master: string;
  description: string;
  amountPerParticipant: bigint;
  maxParticipants: bigint;
  currentParticipants: bigint;
  state: bigint;
  totalDeposited: bigint;
};

// ABI for the functions we need
export const MENTORA_ABI = [
  {
    inputs: [],
    name: 'getMyLobbiesAsMaster',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'lobbyId',
        type: 'uint256',
      },
    ],
    name: 'getLobbyInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'id',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'master',
        type: 'address',
      },
      {
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'amountPerParticipant',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxParticipants',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'currentParticipants',
        type: 'uint256',
      },
      {
        internalType: 'enum LobbyState',
        name: 'state',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: 'totalDeposited',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'master',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'maxParticipants',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amountPerParticipant',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'description',
        type: 'string',
      },
    ],
    name: 'createLobby',
    outputs: [
      {
        internalType: 'uint256',
        name: 'lobbyId',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'lobbyId',
        type: 'uint256',
      },
    ],
    name: 'acceptLobby',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'lobbyId',
        type: 'uint256',
      },
    ],
    name: 'cancelLobby',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'lobbyId',
        type: 'uint256',
      },
    ],
    name: 'completeLobby',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
