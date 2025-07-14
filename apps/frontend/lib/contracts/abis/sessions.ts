// Auto-generated ABI from compiled contract
export const SESSIONS_ABI = [
  {
    "inputs": [
      {
        "internalType": "contract Mentors",
        "name": "_mentors",
        "type": "address"
      },
      {
        "internalType": "contract IERC20",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_fee",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "AddressIsParticipant",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "CannotAbandonedSession",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "EnforcedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ExpectedPause",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectAmount",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectDeposit",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectMaxParticipants",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectParticipantsLength",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IncorrectStartTime",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IsPrivateSession",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MentorNotValid",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MissingCretorAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NoFundsAvailable",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotEnoughParticipants",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OnlyMentor",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "OwnableInvalidOwner",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "OwnableUnauthorizedAccount",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "SafeERC20FailedOperation",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SenderIsNotParticipant",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SessionCanNotBeAccepted",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SessionCantBeCancelled",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SessionDoesNotExists",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SessionError",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SessionIsFull",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SessionNotOpen",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SesssionMustBeAccepted",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "WithdrawError",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "_sender",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "_MentorAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_startTime",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      }
    ],
    "name": "LogCreateSession",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "_participant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_depositAmount",
        "type": "uint256"
      }
    ],
    "name": "LogFundsRefunded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "_mentor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_totalRefunded",
        "type": "uint256"
      }
    ],
    "name": "LogLobbyCancelled",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "_participant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_refundAmount",
        "type": "uint256"
      }
    ],
    "name": "LogParticipantAbandoned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "_newParticipant",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_currentParticipants",
        "type": "uint256"
      }
    ],
    "name": "LogParticipantJoined",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "_mentor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_sessionDeposited",
        "type": "uint256"
      }
    ],
    "name": "LogSessionAccepted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "_mentor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalPayment",
        "type": "uint256"
      }
    ],
    "name": "LogSessionCompleted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "_sender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "_mentoraFees",
        "type": "uint256"
      }
    ],
    "name": "LogWithdraw",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "previousOwner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "OwnershipTransferred",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Paused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "Unpaused",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      }
    ],
    "name": "abandonSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      }
    ],
    "name": "acceptSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      }
    ],
    "name": "cancelSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      }
    ],
    "name": "completeSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_mentorAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_maxParticipants",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "participants",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "_sessionStartTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_minAmountPerParticipant",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "_isPrivate",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "_marketplace",
        "type": "bool"
      }
    ],
    "name": "createSession",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "sessionId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "_token",
        "type": "address"
      }
    ],
    "name": "getContractBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "participant",
        "type": "address"
      }
    ],
    "name": "getParticipantDeposit",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      }
    ],
    "name": "getSessionInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "mentor",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amountPerParticipant",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxParticipants",
        "type": "uint256"
      },
      {
        "internalType": "address[]",
        "name": "paparticipants",
        "type": "address[]"
      },
      {
        "internalType": "enum ISessions.SessionState",
        "name": "state",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "sessionDeposit",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isPrivateSession",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "marketplace",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      }
    ],
    "name": "getSessionParticipants",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_sessionId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "joinSession",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "sessionCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "sessions",
    "outputs": [
      {
        "internalType": "address",
        "name": "creator",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "mentor",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "startTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amountPerParticipant",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "maxParticipants",
        "type": "uint256"
      },
      {
        "internalType": "enum ISessions.SessionState",
        "name": "state",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "sessionDeposited",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isPrivateSession",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "marketplace",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "token",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalDeposited",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newOwner",
        "type": "address"
      }
    ],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IERC20",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
