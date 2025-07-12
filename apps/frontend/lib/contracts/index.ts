// Main contracts configuration
export { CONTRACT_ADDRESSES, LEGACY_CONTRACT_ADDRESS } from './addresses';
export { MENTORS_ABI } from './abis/mentors';
export { SESSIONS_ABI } from './abis/sessions';
export { MOCK_ERC20_ABI } from './abis/mockERC20';

// Contract types and enums
export enum SessionState {
  Created = 0,
  Accepted = 1,
  Cancelled = 2,
  Completed = 3,
}

// Type definitions for contract data structures
export type MentorData = {
  registered: boolean;
  active: boolean;
  sessions: number;
  score: number;
};

export type SessionInfo = {
  creator: string;
  mentor: string;
  startTime: bigint;
  endTime: bigint;
  amountPerParticipant: bigint;
  maxParticipants: bigint;
  participants: string[];
  state: SessionState;
  sessionDeposit: bigint;
  isPrivateSession: boolean;
  marketplace: boolean;
};

// Helper type for form data
export type CreateSessionFormData = {
  mentorAddress: string;
  maxParticipants: number;
  participants: string[];
  sessionStartTime: number;
  minAmountPerParticipant: string;
  amount: string;
  isPrivate: boolean;
  marketplace: boolean;
};

// Helper function to convert form data to contract parameters
export function sessionFormToContractParams(
  data: CreateSessionFormData,
): [string, bigint, string[], bigint, bigint, bigint, boolean, boolean] {
  return [
    data.mentorAddress,
    BigInt(data.maxParticipants),
    data.participants,
    BigInt(data.sessionStartTime),
    BigInt(data.minAmountPerParticipant),
    BigInt(data.amount),
    data.isPrivate,
    data.marketplace,
  ];
}
