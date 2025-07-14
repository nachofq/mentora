import { Address } from 'viem';

// Contract addresses on Sepolia
export const CONTRACT_ADDRESSES = {
  MENTORS: '0x3eA2Aba955389A4095fdAB4Aafc56aB3dCCd185A' as Address,
  SESSIONS: '0xDaBE0B560810Ae110Fc0a20AF3393C56B610B94c' as Address,
  PARTICIPANTS: '0xE58ff2f51c07B830c5f9e22000319cEC3b616ea8' as Address,
  MOCK_ERC20: '0x062Bd36A8ca54b41f0ed97e342b16c48a6bebb80' as Address,
} as const;

// Legacy contract (for reference)
export const LEGACY_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MENTORA_ADDRESS! as Address;

// Debug logging
console.log('Contract addresses:', CONTRACT_ADDRESSES);
