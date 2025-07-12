'use client';

import { useState, useEffect } from 'react';
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
  const { data: tokenAllowance } = useReadContract({
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
    functionName: '_sessionCounter',
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
      enabled: !!sessionCounter && sessionCounter >= 1n,
    },
  });

  const session2 = useReadContract({
    address: CONTRACT_ADDRESSES.SESSIONS,
    abi: SESSIONS_ABI,
    functionName: 'getSessionInfo',
    args: [BigInt(2)],
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!sessionCounter && sessionCounter >= 2n,
    },
  });

  const session3 = useReadContract({
    address: CONTRACT_ADDRESSES.SESSIONS,
    abi: SESSIONS_ABI,
    functionName: 'getSessionInfo',
    args: [BigInt(3)],
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!sessionCounter && sessionCounter >= 3n,
    },
  });

  // Load sessions from contract
  const loadSessions = async () => {
    console.log('loadSessions called, sessionCounter:', sessionCounter);

    if (!sessionCounter || sessionCounter === 0n) {
      console.log('No sessions to load');
      setSessions([]);
      return;
    }

    setLoadingSessions(true);

    const sessionsData: SessionDisplay[] = [];

    // Process each session query
    const sessionQueries = [session1, session2, session3];

    sessionQueries.forEach((query, index) => {
      console.log(`Session ${index + 1} query:`, query.data, query.isLoading, query.error);
      if (query.data) {
        const sessionInfo = query.data;
        sessionsData.push({
          id: index + 1,
          creator: sessionInfo[0],
          mentor: sessionInfo[1],
          startTime: sessionInfo[2],
          endTime: sessionInfo[3],
          amountPerParticipant: sessionInfo[4],
          maxParticipants: sessionInfo[5],
          participants: [...sessionInfo[6]],
          state: sessionInfo[7],
          sessionDeposit: sessionInfo[8],
          isPrivateSession: sessionInfo[9],
          marketplace: sessionInfo[10],
        });
      }
    });

    setSessions(sessionsData);
    setLoadingSessions(false);

    console.log(`Loaded ${sessionsData.length} out of ${sessionCounter} sessions`, sessionsData);
  };

  // Load sessions when sessionCounter changes or session queries complete
  useEffect(() => {
    if (sessionCounter !== undefined) {
      loadSessions();
    }
  }, [sessionCounter, session1.data, session2.data, session3.data]);

  // Filter sessions for different tabs
  const allSessions = sessions; // Show all sessions in Browse section

  const mySessions = sessions.filter(
    (session) =>
      address &&
      (session.creator.toLowerCase() === address.toLowerCase() ||
        session.mentor.toLowerCase() === address.toLowerCase() ||
        session.participants.some((p: string) => p.toLowerCase() === address.toLowerCase())),
  );

  const handleJoinSessionById = async () => {
    if (!joinSessionId) {
      toast.error('Please enter a session ID');
      return;
    }

    // TODO: Implement join session logic
    toast.success(`Joining session ${joinSessionId} - functionality to be implemented`);
    setJoinSessionId('');
  };

  const handleViewSession = (session: SessionDisplay) => {
    setViewSession(session);
  };

  const closeViewSession = () => {
    setViewSession(null);
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
    }
  }, [approveConfirmed]);

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
    }
  }, [createConfirmed, refetchTokenBalance]);

  // Handle create session errors
  useEffect(() => {
    if (createError) {
      toast.error('Session creation failed', { id: 'create-session' });
    }
  }, [createError]);

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sessions Dashboard</h1>
          <p className="text-gray-600">
            Create and manage mentoring sessions with token-based payments.
          </p>
        </div>

        {/* Join Session by ID */}
        <Card className="mb-6">
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

        {/* Session Details View */}
        {viewSession && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Session #{viewSession.id} Details
                <Button variant="outline" size="sm" onClick={closeViewSession}>
                  Close
                </Button>
              </CardTitle>
              <CardDescription>Complete session information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Creator</Label>
                  <p className="text-sm font-mono">{viewSession.creator}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Mentor</Label>
                  <p className="text-sm font-mono">{viewSession.mentor}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Start Time</Label>
                  <p className="text-sm">{formatTimestamp(viewSession.startTime)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Participants</Label>
                  <p className="text-sm">{Number(viewSession.maxParticipants)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount per Participant</Label>
                  <p className="text-sm">{formatEther(viewSession.amountPerParticipant)} ETH</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Deposit</Label>
                  <p className="text-sm">{formatEther(viewSession.sessionDeposit)} ETH</p>
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

          <TabsContent value="create" className="space-y-6">
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
                    <Label htmlFor="total-amount">Total Amount (ETH)</Label>
                    <Input
                      id="total-amount"
                      type="number"
                      step="0.00001"
                      value={sessionFormData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="private-session">Private Session</Label>
                      <p className="text-sm text-gray-600">
                        Private sessions require you to pay for all participants upfront
                      </p>
                    </div>
                    <Switch
                      id="private-session"
                      checked={sessionFormData.isPrivate}
                      onCheckedChange={(checked) => handleInputChange('isPrivate', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketplace">Marketplace Visibility</Label>
                      <p className="text-sm text-gray-600">
                        Make this session visible in the marketplace
                      </p>
                    </div>
                    <Switch
                      id="marketplace"
                      checked={sessionFormData.marketplace}
                      onCheckedChange={(checked) => handleInputChange('marketplace', checked)}
                    />
                  </div>
                </div>

                <Separator />

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

          <TabsContent value="browse" className="space-y-6">
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session ID</TableHead>
                          <TableHead>Mentor</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>Participants</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allSessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>#{session.id}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {session.mentor.slice(0, 6)}...{session.mentor.slice(-4)}
                            </TableCell>
                            <TableCell>{formatTimestamp(session.startTime)}</TableCell>
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
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={
                                    session.state !== 0 ||
                                    session.participants.length >= Number(session.maxParticipants)
                                  }
                                >
                                  Join
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

          <TabsContent value="manage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Sessions</CardTitle>
                <CardDescription>
                  Manage your created sessions and track participation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Loading your sessions...</p>
                  </div>
                ) : mySessions.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      You have {mySessions.length} session{mySessions.length === 1 ? '' : 's'}
                    </p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session ID</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Mentor</TableHead>
                          <TableHead>Start Time</TableHead>
                          <TableHead>Participants</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
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
                              <TableCell>#{session.id}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {roleText}
                                  </Badge>
                                  {session.isPrivateSession && (
                                    <Badge variant="secondary" className="text-xs">
                                      Private
                                    </Badge>
                                  )}
                                  {session.marketplace && (
                                    <Badge variant="default" className="text-xs">
                                      Marketplace
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {session.mentor.slice(0, 6)}...{session.mentor.slice(-4)}
                              </TableCell>
                              <TableCell>{formatTimestamp(session.startTime)}</TableCell>
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
                                <div className="flex gap-2">
                                  {isMentor && session.state === SessionState.Accepted && (
                                    <Button size="sm" variant="outline">
                                      Complete
                                    </Button>
                                  )}
                                  {(isCreator || isMentor) && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleViewSession(session)}
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
