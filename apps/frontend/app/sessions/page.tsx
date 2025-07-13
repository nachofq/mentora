'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'react-hot-toast';
import {
  CONTRACT_ADDRESSES,
  SESSIONS_ABI,
  MOCK_ERC20_ABI,
  MENTORS_ABI,
  SessionState,
  type CreateSessionFormData,
  type SessionInfo,
  sessionFormToContractParams,
} from '@/lib/contracts';
import { formatEther, parseEther } from 'viem';

export default function SessionsPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Extended session type for UI display
  type SessionDisplay = SessionInfo & {
    id: number;
  };

  const [sessionFormData, setSessionFormData] = useState<CreateSessionFormData>({
    mentorAddress: '',
    maxParticipants: 1,
    participants: [],
    sessionStartTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    minAmountPerParticipant: '0.0001',
    amount: '0.0001',
    isPrivate: false,
    marketplace: false,
  });

  const [sessions, setSessions] = useState<SessionDisplay[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState('');
  const [viewSession, setViewSession] = useState<SessionDisplay | null>(null);

  // Join dialog state
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionDisplay | null>(null);
  const [joinAmount, setJoinAmount] = useState('');
  const [attendingSession, setAttendingSession] = useState<number | null>(null);

  // Read token balance
  const { data: tokenBalance, refetch: refetchTokenBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_ERC20,
    abi: MOCK_ERC20_ABI,
    functionName: 'balanceOf',
    args: [address!],
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!address,
    },
  });

  // Read token allowance
  const { data: tokenAllowance, refetch: refetchTokenAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.MOCK_ERC20,
    abi: MOCK_ERC20_ABI,
    functionName: 'allowance',
    args: [address!, CONTRACT_ADDRESSES.SESSIONS],
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!address,
    },
  });

  // Read session counter
  const { data: sessionCounter } = useReadContract({
    address: CONTRACT_ADDRESSES.SESSIONS,
    abi: SESSIONS_ABI,
    functionName: 'sessionCounter',
    chainId: arbitrumSepolia.id,
  });

  // Check if user is a valid mentor
  const { data: isValidMentor } = useReadContract({
    address: CONTRACT_ADDRESSES.MENTORS,
    abi: MENTORS_ABI,
    functionName: 'isValidMentor',
    args: [address!],
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!address,
    },
  });

  // Read first few sessions individually (up to 5 sessions for now)
  const session1 = useReadContract({
    address: CONTRACT_ADDRESSES.SESSIONS,
    abi: SESSIONS_ABI,
    functionName: 'getSessionInfo',
    args: [BigInt(1)],
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!sessionCounter && BigInt(sessionCounter) >= 1n,
    },
  });

  const session2 = useReadContract({
    address: CONTRACT_ADDRESSES.SESSIONS,
    abi: SESSIONS_ABI,
    functionName: 'getSessionInfo',
    args: [BigInt(2)],
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!sessionCounter && BigInt(sessionCounter) >= 2n,
    },
  });

  const session3 = useReadContract({
    address: CONTRACT_ADDRESSES.SESSIONS,
    abi: SESSIONS_ABI,
    functionName: 'getSessionInfo',
    args: [BigInt(3)],
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!sessionCounter && BigInt(sessionCounter) >= 3n,
    },
  });

  // Force refetch all session data
  const refetchSessions = () => {
    session1.refetch();
    session2.refetch();
    session3.refetch();
  };

  // Load sessions from contract
  const loadSessions = useCallback(async () => {
    console.log(
      'loadSessions called, sessionCounter:',
      sessionCounter,
      'type:',
      typeof sessionCounter,
    );

    if (!sessionCounter || Number(sessionCounter) === 0) {
      console.log('No sessions to load - sessionCounter is 0 or undefined');
      setSessions([]);
      return;
    }

    setLoadingSessions(true);
    console.log('Starting to load sessions...');

    const sessionsData: SessionDisplay[] = [];

    // Process each session query
    const sessionQueries = [session1, session2, session3];

    sessionQueries.forEach((query, index) => {
      console.log(`Session ${index + 1} query:`, {
        data: query.data,
        isLoading: query.isLoading,
        error: query.error?.message || query.error,
        isEnabled: !!sessionCounter && BigInt(sessionCounter) >= BigInt(index + 1),
      });
      if (query.data) {
        const sessionInfo = query.data;
        console.log(`Session ${index + 1} raw data:`, sessionInfo);

        // Validate that the session has valid data
        // Check if creator is not the zero address and has valid start time
        const creator = sessionInfo[0];
        const mentor = sessionInfo[1];
        const startTime = sessionInfo[2];

        if (
          creator !== '0x0000000000000000000000000000000000000000' &&
          mentor !== '0x0000000000000000000000000000000000000000' &&
          Number(startTime) > 0
        ) {
          sessionsData.push({
            id: index + 1,
            creator: sessionInfo[0],
            mentor: sessionInfo[1],
            startTime: sessionInfo[2],
            endTime: sessionInfo[3],
            amountPerParticipant: sessionInfo[4],
            maxParticipants: sessionInfo[5],
            participants: [...(sessionInfo[6] || [])],
            state: sessionInfo[7],
            sessionDeposit: sessionInfo[8],
            isPrivateSession: sessionInfo[9],
            marketplace: sessionInfo[10],
          });
          console.log(`Session ${index + 1} added to sessionsData`);
        } else {
          console.log(`Session ${index + 1} failed validation, skipping`);
        }
      } else {
        console.log(`Session ${index + 1} has no data`);
      }
    });

    setSessions(sessionsData);
    setLoadingSessions(false);

    console.log(
      `Final result: Loaded ${sessionsData.length} out of ${sessionCounter} sessions`,
      sessionsData,
    );
  }, [sessionCounter, session1.data, session2.data, session3.data]);

  // Load sessions when sessionCounter changes or session queries complete
  useEffect(() => {
    if (sessionCounter !== undefined) {
      loadSessions();
    }
  }, [sessionCounter, session1.data, session2.data, session3.data, loadSessions]);

  // Filter sessions for different tabs
  const allSessions = sessions; // Show all sessions in Browse section
  console.log('All sessions for Browse tab:', allSessions);

  const mySessions = sessions.filter((session) => {
    const isCreator = address && session.creator.toLowerCase() === address.toLowerCase();
    const isMentor = address && session.mentor.toLowerCase() === address.toLowerCase();
    const isParticipant =
      address &&
      session.participants.some((p: string) => p.toLowerCase() === address.toLowerCase());

    const isMySession = address && (isCreator || isMentor || isParticipant);

    console.log(`Session ${session.id} filter check:`, {
      address,
      sessionCreator: session.creator,
      sessionMentor: session.mentor,
      sessionParticipants: session.participants,
      isCreator,
      isMentor,
      isParticipant,
      isMySession,
    });

    return isMySession;
  });
  console.log('My sessions after filtering:', mySessions);

  const handleJoinClick = (session: SessionDisplay) => {
    setSelectedSession(session);
    setJoinAmount(formatEther(session.amountPerParticipant));
    setIsJoinDialogOpen(true);
  };

  const handleApproveForJoin = async () => {
    if (!selectedSession || !joinAmount) return;

    try {
      const amount = parseEther(joinAmount);

      console.log('Approving tokens for join:', {
        amount: amount.toString(),
        amountInEther: formatEther(amount),
        sessionId: selectedSession.id,
      });

      approveToken({
        address: CONTRACT_ADDRESSES.MOCK_ERC20,
        abi: MOCK_ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.SESSIONS, amount],
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error approving tokens for join:', error);
      toast.error('Failed to approve tokens');
    }
  };

  const handleJoinSession = async () => {
    if (!selectedSession || !joinAmount || !address) return;

    try {
      const amount = parseEther(joinAmount);

      // Validate session state
      if (selectedSession.state !== 0) {
        toast.error('This session is no longer available for joining');
        return;
      }

      // Check if session is full
      if (selectedSession.participants.length >= Number(selectedSession.maxParticipants)) {
        toast.error('This session is already full');
        return;
      }

      // Check if user is already a participant
      if (selectedSession.participants.some((p) => p.toLowerCase() === address.toLowerCase())) {
        toast.error('You have already joined this session');
        return;
      }

      // Validate amount is at least the minimum required
      if (amount < selectedSession.amountPerParticipant) {
        toast.error(
          `Amount must be at least ${formatEther(selectedSession.amountPerParticipant)} tokens`,
        );
        return;
      }

      // Check token balance
      if (tokenBalance && tokenBalance < amount) {
        toast.error(
          `Insufficient token balance. Required: ${joinAmount}, Available: ${formatEther(tokenBalance)}`,
        );
        return;
      }

      // Check token allowance
      if (tokenAllowance && tokenAllowance < amount) {
        toast.error(
          `Insufficient token allowance. Please approve tokens first. Required: ${joinAmount}, Approved: ${formatEther(tokenAllowance)}`,
        );
        return;
      }

      console.log('Joining session with params:', {
        sessionId: selectedSession.id,
        amount: amount.toString(),
        amountInEther: formatEther(amount),
      });

      joinSession({
        address: CONTRACT_ADDRESSES.SESSIONS,
        abi: SESSIONS_ABI,
        functionName: 'joinSession',
        args: [BigInt(selectedSession.id), amount],
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
    }
  };

  const handleJoinSessionById = async () => {
    if (!joinSessionId) {
      toast.error('Please enter a session ID');
      return;
    }

    // Find the session by ID
    const sessionToJoin = sessions.find((s) => s.id === parseInt(joinSessionId));
    if (!sessionToJoin) {
      toast.error('Session not found');
      return;
    }

    handleJoinClick(sessionToJoin);
    setJoinSessionId('');
  };

  const handleViewSession = (session: SessionDisplay) => {
    setViewSession(session);
  };

  const closeViewSession = () => {
    setViewSession(null);
  };

  const handleAttendSession = async (sessionId: number) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setAttendingSession(sessionId);

    try {
      // Make API call to create LiveKit token
      const response = await fetch('http://localhost:3000/livekit/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: address,
          sessionId: sessionId.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create LiveKit token');
      }

      const data = await response.json();
      const token = data.token;

      if (!token) {
        throw new Error('No token received from server');
      }
      console.log(token);
      // Navigate to the custom video session page
      const serverUrl = 'wss://mentora-1oy3c9l5.livekit.cloud';
      router.push(`/custom/?liveKitUrl=${serverUrl}&token=${token}`);
    } catch (error) {
      console.error('Error attending session:', error);
      toast.error('Failed to join video session. Please try again.');
    } finally {
      setAttendingSession(null);
    }
  };

  const handleAbandonSession = async (sessionId: number) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      console.log('Abandoning session:', sessionId);
      abandonSession({
        address: CONTRACT_ADDRESSES.SESSIONS,
        abi: SESSIONS_ABI,
        functionName: 'abandonSession',
        args: [BigInt(sessionId)],
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error abandoning session:', error);
      toast.error('Failed to abandon session');
    }
  };

  // Token approve transaction
  const {
    writeContract: approveToken,
    data: approveHash,
    isPending: approvePending,
    error: approveError,
  } = useWriteContract();

  const { isLoading: approveConfirming, isSuccess: approveConfirmed } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  // Create session transaction
  const {
    writeContract: createSession,
    data: createHash,
    isPending: createPending,
    error: createError,
  } = useWriteContract();

  const { isLoading: createConfirming, isSuccess: createConfirmed } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  // Join session transaction
  const {
    writeContract: joinSession,
    data: joinHash,
    isPending: joinPending,
    error: joinError,
  } = useWriteContract();

  const { isLoading: joinConfirming, isSuccess: joinConfirmed } = useWaitForTransactionReceipt({
    hash: joinHash,
  });

  // Abandon session transaction
  const {
    writeContract: abandonSession,
    data: abandonHash,
    isPending: abandonPending,
    error: abandonError,
  } = useWriteContract();

  const { isLoading: abandonConfirming, isSuccess: abandonConfirmed } =
    useWaitForTransactionReceipt({
      hash: abandonHash,
    });

  // Handle transaction states
  useEffect(() => {
    if (approvePending) {
      toast.loading('Approving tokens...', { id: 'approve-token' });
    }
  }, [approvePending]);

  useEffect(() => {
    if (approveConfirming) {
      toast.loading('Waiting for approval confirmation...', { id: 'approve-token' });
    }
  }, [approveConfirming]);

  useEffect(() => {
    if (approveConfirmed) {
      toast.success('Tokens approved successfully!', { id: 'approve-token' });
      // Refetch token allowance to update the UI
      refetchTokenAllowance();
    }
  }, [approveConfirmed, refetchTokenAllowance]);

  // Handle approve errors
  useEffect(() => {
    if (approveError) {
      toast.error('Token approval failed', { id: 'approve-token' });
    }
  }, [approveError]);

  useEffect(() => {
    if (createPending) {
      toast.loading('Creating session...', { id: 'create-session' });
    }
  }, [createPending]);

  useEffect(() => {
    if (createConfirming) {
      toast.loading('Waiting for session creation confirmation...', { id: 'create-session' });
    }
  }, [createConfirming]);

  useEffect(() => {
    if (createConfirmed) {
      toast.success('Session created successfully!', { id: 'create-session' });
      // Reset form
      setSessionFormData({
        mentorAddress: '',
        maxParticipants: 1,
        participants: [],
        sessionStartTime: Math.floor(Date.now() / 1000) + 3600,
        minAmountPerParticipant: '0.0001',
        amount: '0.0001',
        isPrivate: false,
        marketplace: false,
      });
      refetchTokenBalance();
      // Force refetch sessions as if first time
      refetchSessions();
    }
  }, [createConfirmed, refetchTokenBalance]);

  // Handle create session errors
  useEffect(() => {
    if (createError) {
      toast.error('Session creation failed', { id: 'create-session' });
    }
  }, [createError]);

  // Handle join transaction states
  useEffect(() => {
    if (joinPending) {
      toast.loading('Joining session...', { id: 'join-session' });
    }
  }, [joinPending]);

  useEffect(() => {
    if (joinConfirming) {
      toast.loading('Waiting for join confirmation...', { id: 'join-session' });
    }
  }, [joinConfirming]);

  useEffect(() => {
    if (joinConfirmed) {
      toast.success('Successfully joined session!', { id: 'join-session' });
      setIsJoinDialogOpen(false);
      setSelectedSession(null);
      setJoinAmount('');
      refetchTokenBalance();
      refetchTokenAllowance();
      // Force refetch sessions as if first time
      refetchSessions();
    }
  }, [joinConfirmed, refetchTokenBalance, refetchTokenAllowance]);

  // Handle join errors with more specific messages
  useEffect(() => {
    if (joinError) {
      console.error('Join transaction error:', joinError);

      // Try to decode common error messages
      const errorMessage = joinError.message || joinError.toString();

      if (errorMessage.includes('insufficient')) {
        toast.error('Insufficient tokens or allowance for joining session', { id: 'join-session' });
      } else if (errorMessage.includes('SessionNotFound') || errorMessage.includes('session')) {
        toast.error('Session not found or invalid', { id: 'join-session' });
      } else if (errorMessage.includes('SessionFull') || errorMessage.includes('full')) {
        toast.error('Session is already full', { id: 'join-session' });
      } else if (
        errorMessage.includes('AlreadyParticipant') ||
        errorMessage.includes('participant')
      ) {
        toast.error('You are already a participant in this session', { id: 'join-session' });
      } else if (errorMessage.includes('SessionNotActive') || errorMessage.includes('state')) {
        toast.error('Session is not available for joining', { id: 'join-session' });
      } else {
        toast.error('Failed to join session. Please check the console for details.', {
          id: 'join-session',
        });
      }
    }
  }, [joinError]);

  // Handle abandon session transaction states
  useEffect(() => {
    if (abandonPending) {
      toast.loading('Abandoning session...', { id: 'abandon-session' });
    }
  }, [abandonPending]);

  useEffect(() => {
    if (abandonConfirming) {
      toast.loading('Waiting for abandon confirmation...', { id: 'abandon-session' });
    }
  }, [abandonConfirming]);

  useEffect(() => {
    if (abandonConfirmed) {
      toast.success('Successfully abandoned session! Your deposit has been refunded.', {
        id: 'abandon-session',
      });
      // Force refetch sessions as if first time
      refetchSessions();
    }
  }, [abandonConfirmed]);

  useEffect(() => {
    if (abandonError) {
      toast.error('Failed to abandon session', { id: 'abandon-session' });
    }
  }, [abandonError]);

  const handleApproveTokens = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const amount = parseEther(sessionFormData.amount);
      approveToken({
        address: CONTRACT_ADDRESSES.MOCK_ERC20,
        abi: MOCK_ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.SESSIONS, amount],
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error approving tokens:', error);
      toast.error('Failed to approve tokens');
    }
  };

  const handleCreateSession = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!sessionFormData.mentorAddress) {
      toast.error('Please enter a mentor address');
      return;
    }

    // Validate mentor address format
    if (
      !sessionFormData.mentorAddress.startsWith('0x') ||
      sessionFormData.mentorAddress.length !== 42
    ) {
      toast.error('Please enter a valid mentor address');
      return;
    }

    // Validate session time is in the future
    const currentTime = Math.floor(Date.now() / 1000);
    if (sessionFormData.sessionStartTime <= currentTime) {
      toast.error('Session start time must be in the future');
      return;
    }

    // Validate amounts
    try {
      const minAmount = parseFloat(sessionFormData.minAmountPerParticipant);
      const totalAmount = parseFloat(sessionFormData.amount);

      if (minAmount <= 0 || totalAmount <= 0) {
        toast.error('Amounts must be greater than 0');
        return;
      }

      if (totalAmount > 10) {
        toast.error('Amount seems too large. Please use smaller amounts for testing.');
        return;
      }

      // Check token balance
      const requiredAmount = parseEther(sessionFormData.amount);
      if (tokenBalance && tokenBalance < requiredAmount) {
        toast.error(
          `Insufficient token balance. Required: ${sessionFormData.amount}, Available: ${formatEther(tokenBalance)}`,
        );
        return;
      }

      // Check token allowance
      if (tokenAllowance && tokenAllowance < requiredAmount) {
        toast.error(
          `Insufficient token allowance. Please approve tokens first. Required: ${sessionFormData.amount}, Approved: ${formatEther(tokenAllowance)}`,
        );
        return;
      }
    } catch (error) {
      toast.error('Invalid amount format');
      return;
    }

    try {
      const params = sessionFormToContractParams(sessionFormData);

      // Debug logging
      console.log('Creating session with params:', {
        mentorAddress: params[0],
        maxParticipants: params[1].toString(),
        participants: params[2],
        sessionStartTime: params[3].toString(),
        minAmountPerParticipant: params[4].toString(),
        amount: params[5].toString(),
        isPrivate: params[6],
        marketplace: params[7],
      });

      createSession({
        address: CONTRACT_ADDRESSES.SESSIONS,
        abi: SESSIONS_ABI,
        functionName: 'createSession',
        args: params,
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    }
  };

  const handleInputChange = (field: keyof CreateSessionFormData, value: any) => {
    setSessionFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const useMyAddressAsMentor = () => {
    if (address) {
      setSessionFormData((prev) => ({
        ...prev,
        mentorAddress: address,
      }));
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const getSessionStateText = (state: number) => {
    switch (state) {
      case 0:
        return 'Created';
      case 1:
        return 'Accepted';
      case 2:
        return 'Cancelled';
      case 3:
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getSessionStateVariant = (state: number) => {
    switch (state) {
      case 0:
        return 'default';
      case 1:
        return 'secondary';
      case 2:
        return 'destructive';
      case 3:
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please connect your wallet to access the sessions dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-h-screen overflow-hidden">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        <div className="mb-8 flex-shrink-0">
          <h1 className="text-3xl font-bold mb-2">Sessions Dashboard</h1>
          <p className="text-gray-600">
            Create and manage mentoring sessions with token-based payments.
          </p>
        </div>

        {/* Join Session by ID */}
        <Card className="mb-6 flex-shrink-0">
          <CardHeader>
            <CardTitle>Join Session by ID</CardTitle>
            <CardDescription>Enter a session ID to join directly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter session ID (e.g., 1, 2, 3...)"
                value={joinSessionId}
                onChange={(e) => setJoinSessionId(e.target.value)}
                type="number"
                min="1"
              />
              <Button onClick={handleJoinSessionById} disabled={!joinSessionId}>
                Join Session
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Join Session Dialog */}
        <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Join Session</DialogTitle>
              <DialogDescription>
                Join session #{selectedSession?.id} with the specified amount.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="session-id">Session ID</Label>
                <Input
                  id="session-id"
                  value={selectedSession?.id || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="join-amount">Amount (Tokens)</Label>
                <Input
                  id="join-amount"
                  type="number"
                  step="0.00001"
                  value={joinAmount}
                  onChange={(e) => setJoinAmount(e.target.value)}
                  placeholder="0.0001"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Minimum required:{' '}
                  {selectedSession ? formatEther(selectedSession.amountPerParticipant) : '0'} tokens
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Your Token Balance</Label>
                  <p className="text-sm text-gray-600">
                    {tokenBalance ? formatEther(tokenBalance) : '0'} tokens available
                  </p>
                </div>
                <Badge variant="outline">
                  {tokenBalance ? formatEther(tokenBalance) : '0'} MOCK
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Token Allowance</Label>
                  <p className="text-sm text-gray-600">
                    {tokenAllowance ? formatEther(tokenAllowance) : '0'} tokens approved
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {tokenAllowance ? formatEther(tokenAllowance) : '0'} MOCK
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => refetchTokenAllowance()}
                    className="h-6 w-6 p-0"
                  >
                    🔄
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleApproveForJoin}
                  disabled={approvePending || approveConfirming}
                  variant="outline"
                  className="flex-1"
                >
                  {approvePending || approveConfirming ? 'Approving...' : 'Approve Tokens'}
                </Button>
                <Button
                  onClick={handleJoinSession}
                  disabled={joinPending || joinConfirming || !joinAmount}
                  className="flex-1"
                >
                  {joinPending || joinConfirming ? 'Joining...' : 'Join Session'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Session Details View */}
        {viewSession && (
          <Card className="mb-6 flex-shrink-0">
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={closeViewSession} className="ml-auto">
                ✕
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Session ID</Label>
                  <p className="text-sm text-gray-600">#{viewSession.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Creator</Label>
                  <p className="text-sm text-gray-600 font-mono">
                    {viewSession.creator.slice(0, 6)}...{viewSession.creator.slice(-4)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Mentor</Label>
                  <p className="text-sm text-gray-600 font-mono">
                    {viewSession.mentor.slice(0, 6)}...{viewSession.mentor.slice(-4)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Start Time</Label>
                  <p className="text-sm text-gray-600">{formatTimestamp(viewSession.startTime)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount per Participant</Label>
                  <p className="text-sm text-gray-600">
                    {formatEther(viewSession.amountPerParticipant)} ETH
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Participants</Label>
                  <p className="text-sm text-gray-600">{Number(viewSession.maxParticipants)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getSessionStateVariant(viewSession.state)}>
                    {getSessionStateText(viewSession.state)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="flex gap-2">
                    {viewSession.isPrivateSession && <Badge variant="secondary">Private</Badge>}
                    {viewSession.marketplace && <Badge variant="default">Marketplace</Badge>}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <Label className="text-sm font-medium">
                  Participants ({viewSession.participants.length})
                </Label>
                <div className="mt-2 space-y-1">
                  {viewSession.participants.length > 0 ? (
                    viewSession.participants.map((participant, index) => (
                      <p key={index} className="text-sm font-mono">
                        {participant}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No participants yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create">Create Session</TabsTrigger>
            <TabsTrigger value="browse">Browse Sessions</TabsTrigger>
            <TabsTrigger value="manage">My Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="flex-1 min-h-0">
            <Card>
              <CardHeader>
                <CardTitle>Create New Session</CardTitle>
                <CardDescription>
                  Set up a new mentoring session. For private sessions, you pay for all participants
                  upfront.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mentor-address">Mentor Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="mentor-address"
                        placeholder="0x..."
                        value={sessionFormData.mentorAddress}
                        onChange={(e) => handleInputChange('mentorAddress', e.target.value)}
                      />
                      <Button
                        variant="outline"
                        onClick={useMyAddressAsMentor}
                        disabled={!isValidMentor}
                      >
                        Use My Address
                      </Button>
                    </div>
                    {!isValidMentor && address && (
                      <p className="text-sm text-amber-600">
                        You need to register as a mentor first to use your address.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-participants">Max Participants</Label>
                    <Input
                      id="max-participants"
                      type="number"
                      min="1"
                      value={sessionFormData.maxParticipants}
                      onChange={(e) =>
                        handleInputChange('maxParticipants', parseInt(e.target.value))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Input
                      id="start-time"
                      type="datetime-local"
                      value={new Date(sessionFormData.sessionStartTime * 1000)
                        .toISOString()
                        .slice(0, 16)}
                      onChange={(e) =>
                        handleInputChange(
                          'sessionStartTime',
                          Math.floor(new Date(e.target.value).getTime() / 1000),
                        )
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount-per-participant">Amount per Participant (ETH)</Label>
                    <Input
                      id="amount-per-participant"
                      type="number"
                      step="0.00001"
                      value={sessionFormData.minAmountPerParticipant}
                      onChange={(e) => handleInputChange('minAmountPerParticipant', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total-amount">Total Amount to Pay (ETH)</Label>
                    <Input
                      id="total-amount"
                      type="number"
                      step="0.00001"
                      value={sessionFormData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      For private sessions, this is the total amount you pay upfront
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="private-session">Private Session</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="private-session"
                        checked={sessionFormData.isPrivate}
                        onCheckedChange={(checked) => handleInputChange('isPrivate', checked)}
                      />
                      <span className="text-sm text-gray-600">
                        {sessionFormData.isPrivate ? 'Private' : 'Public'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marketplace">Marketplace Visibility</Label>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="marketplace"
                        checked={sessionFormData.marketplace}
                        onCheckedChange={(checked) => handleInputChange('marketplace', checked)}
                      />
                      <span className="text-sm text-gray-600">
                        {sessionFormData.marketplace ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Your Token Balance</Label>
                      <p className="text-sm text-gray-600">
                        {tokenBalance ? formatEther(tokenBalance) : '0'} tokens available
                      </p>
                      <p className="text-xs text-gray-500">
                        Need tokens? Contact the contract owner or use the faucet.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {tokenBalance ? formatEther(tokenBalance) : '0'} MOCK
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleApproveTokens}
                      disabled={approvePending || approveConfirming}
                      variant="outline"
                    >
                      {approvePending || approveConfirming ? 'Approving...' : 'Approve Tokens'}
                    </Button>
                    <Button
                      onClick={handleCreateSession}
                      disabled={createPending || createConfirming}
                    >
                      {createPending || createConfirming ? 'Creating...' : 'Create Session'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="browse" className="flex-1 min-h-0">
            <Card>
              <CardHeader>
                <CardTitle>Browse Sessions</CardTitle>
                <CardDescription>
                  Discover and join all available mentoring sessions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading sessions...</p>
                  </div>
                ) : allSessions.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {allSessions.length} session{allSessions.length === 1 ? '' : 's'} available
                    </p>
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[80px]">Session ID</TableHead>
                            <TableHead className="min-w-[120px]">Mentor</TableHead>
                            <TableHead className="min-w-[140px]">Start Time</TableHead>
                            <TableHead className="min-w-[100px]">Participants</TableHead>
                            <TableHead className="min-w-[100px]">Amount</TableHead>
                            <TableHead className="min-w-[80px]">Status</TableHead>
                            <TableHead className="min-w-[140px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {allSessions.map((session) => (
                            <TableRow key={session.id}>
                              <TableCell className="font-medium">#{session.id}</TableCell>
                              <TableCell className="font-mono text-sm">
                                {session.mentor.slice(0, 6)}...{session.mentor.slice(-4)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatTimestamp(session.startTime)}
                              </TableCell>
                              <TableCell>
                                {session.participants.length}/{Number(session.maxParticipants)}
                              </TableCell>
                              <TableCell>{formatEther(session.amountPerParticipant)} ETH</TableCell>
                              <TableCell>
                                <Badge variant={getSessionStateVariant(session.state)}>
                                  {getSessionStateText(session.state)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleJoinClick(session)}
                                    disabled={
                                      session.state !== 0 ||
                                      session.participants.length >=
                                        Number(session.maxParticipants) ||
                                      (address &&
                                        session.participants.some(
                                          (p) => p.toLowerCase() === address.toLowerCase(),
                                        ))
                                    }
                                  >
                                    {address &&
                                    session.participants.some(
                                      (p) => p.toLowerCase() === address.toLowerCase(),
                                    )
                                      ? 'Joined'
                                      : 'Join'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewSession(session)}
                                  >
                                    View
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No sessions available right now.</p>
                    <p className="text-sm text-gray-500">
                      Total Sessions Created: {sessionCounter ? sessionCounter.toString() : '0'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Create your first session using the "Create Session" tab above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manage" className="flex-1 min-h-0">
            <Card>
              <CardHeader>
                <CardTitle>My Sessions</CardTitle>
                <CardDescription>
                  Sessions you've created, joined, or are mentoring.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mySessions.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {mySessions.length} session{mySessions.length === 1 ? '' : 's'} found
                    </p>
                    <div className="border rounded-lg overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="min-w-[80px]">Session ID</TableHead>
                            <TableHead className="min-w-[80px]">Role</TableHead>
                            <TableHead className="min-w-[120px]">Mentor</TableHead>
                            <TableHead className="min-w-[140px]">Start Time</TableHead>
                            <TableHead className="min-w-[100px]">Participants</TableHead>
                            <TableHead className="min-w-[100px]">Amount</TableHead>
                            <TableHead className="min-w-[80px]">Status</TableHead>
                            <TableHead className="min-w-[160px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mySessions.map((session) => {
                            const isCreator =
                              address && session.creator.toLowerCase() === address.toLowerCase();
                            const isMentor =
                              address && session.mentor.toLowerCase() === address.toLowerCase();
                            const isParticipant =
                              address &&
                              session.participants.some(
                                (p: string) => p.toLowerCase() === address.toLowerCase(),
                              );

                            let roleText = '';
                            if (isCreator) roleText = 'Creator';
                            else if (isMentor) roleText = 'Mentor';
                            else if (isParticipant) roleText = 'Participant';

                            return (
                              <TableRow key={session.id}>
                                <TableCell className="font-medium">#{session.id}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {roleText}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                  {session.mentor.slice(0, 6)}...{session.mentor.slice(-4)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {formatTimestamp(session.startTime)}
                                </TableCell>
                                <TableCell>
                                  {session.participants.length}/{Number(session.maxParticipants)}
                                </TableCell>
                                <TableCell>
                                  {formatEther(session.amountPerParticipant)} ETH
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getSessionStateVariant(session.state)}>
                                    {getSessionStateText(session.state)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1 flex-wrap">
                                    {isParticipant &&
                                      session.state === SessionState.Accepted && ( // TODO: add
                                        <Button
                                          size="sm"
                                          onClick={() => handleAttendSession(session.id)}
                                          disabled={attendingSession === session.id}
                                          className="mb-1"
                                        >
                                          {attendingSession === session.id
                                            ? 'Joining...'
                                            : 'Attend'}
                                        </Button>
                                      )}

                                    {/* Abandon button for participants when session is created */}
                                    {isParticipant && session.state === SessionState.Created && (
                                      <Button
                                        size="sm"
                                        onClick={() => handleAbandonSession(session.id)}
                                        disabled={abandonPending || abandonConfirming}
                                        variant="destructive"
                                        className="mb-1"
                                      >
                                        {abandonPending || abandonConfirming
                                          ? 'Abandoning...'
                                          : 'Abandon'}
                                      </Button>
                                    )}

                                    {isMentor && session.state === SessionState.Accepted && (
                                      <Button size="sm" variant="outline" className="mb-1">
                                        Complete
                                      </Button>
                                    )}
                                    {(isCreator || isMentor) && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleViewSession(session)}
                                        className="mb-1"
                                      >
                                        View
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      You haven't created, joined, or mentored any sessions yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      Create your first session using the "Create Session" tab above.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
