import { Address } from 'viem';

// Contract addresses on Sepolia
export const CONTRACT_ADDRESSES = {
  MENTORS: '0x8AC38e5221854712079932D935D35F0c09DcA028' as Address,
  SESSIONS: '0x90ca4d6C799E79aFb0442c9205f7b70cf0a8ad4c' as Address,
  PARTICIPANTS: '0x31cAE516D26a9e856E4F6F0fa658638691C73d26' as Address,
  MOCK_ERC20: '0x9f0e39900B1dae5B0bEa7cfEc26Bae4A59bf2134' as Address,
} as const;

// Legacy contract (for reference)
export const LEGACY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MENTORA_ADDRESS! as Address;

// Debug logging
console.log('Contract addresses:', CONTRACT_ADDRESSES);
