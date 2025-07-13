// Sessions contract ABI extracted from artifacts
export const SESSIONS_ABI = [
  {
    inputs: [
      {
        internalType: 'contract Mentors',
        name: '_mentors',
        type: 'address',
      },
      {
        internalType: 'contract IERC20',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_fee',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_sender',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_MentorAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_startTime',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_sessionId',
        type: 'uint256',
      },
    ],
    name: 'LogCreateSession',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_sessionId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_mentor',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'totalPayment',
        type: 'uint256',
      },
    ],
    name: 'LogSessionCompleted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: '_sessionId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: '_newParticipant',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_currentParticipants',
        type: 'uint256',
      },
    ],
    name: 'ParticipantJoined',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_sender',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: '_mentoraFees',
        type: 'uint256',
      },
    ],
    name: 'LogWithdraw',
    type: 'event',
  },
  // Main functions
  {
    inputs: [
      {
        internalType: 'address',
        name: '_mentorAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_maxParticipants',
        type: 'uint256',
      },
      {
        internalType: 'address[]',
        name: 'participants',
        type: 'address[]',
      },
      {
        internalType: 'uint256',
        name: '_sessionStartTime',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_minAmountPerParticipant',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: '_isPrivate',
        type: 'bool',
      },
      {
        internalType: 'bool',
        name: '_marketplace',
        type: 'bool',
      },
    ],
    name: 'createSession',
    outputs: [
      {
        internalType: 'uint256',
        name: 'sessionId',
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
        name: '_sessionId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
    ],
    name: 'joinSession',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_sessionId',
        type: 'uint256',
      },
    ],
    name: 'completeSession',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_sessionId',
        type: 'uint256',
      },
    ],
    name: 'getSessionInfo',
    outputs: [
      {
        internalType: 'address',
        name: 'creator',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'mentor',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'startTime',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'endTime',
        type: 'uint256',
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
        internalType: 'address[]',
        name: 'participants',
        type: 'address[]',
      },
      {
        internalType: 'uint8',
        name: 'state',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: 'sessionDeposit',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'isPrivateSession',
        type: 'bool',
      },
      {
        internalType: 'bool',
        name: 'marketplace',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_sessionId',
        type: 'uint256',
      },
    ],
    name: 'getSessionParticipants',
    outputs: [
      {
        internalType: 'address[]',
        name: '',
        type: 'address[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_sessionId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'participant',
        type: 'address',
      },
    ],
    name: 'getParticipantDeposit',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Contract info
  {
    inputs: [],
    name: '_sessionCounter',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'fee',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [
      {
        internalType: 'contract IERC20',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IERC20',
        name: '_token',
        type: 'address',
      },
    ],
    name: 'getContractBalance',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Owner functions
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'contract IERC20',
        name: '_token',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
