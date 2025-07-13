'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import {
  CONTRACT_ADDRESSES,
  MENTORS_ABI,
  SESSIONS_ABI,
  type MentorData,
  type SessionInfo,
} from '@/lib/contracts';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatEther } from 'viem';

export default function MentorsPage() {
  const { address, isConnected } = useAccount();
  const [mentorData, setMentorData] = useState<MentorData | null>(null);
  const [mentorSessions, setMentorSessions] = useState<Array<SessionInfo & { id: number }>>([]);
  const [loadingMentorSessions, setLoadingMentorSessions] = useState(false);

  // Read mentor data
  const {
    data: mentorDataResult,
    isLoading: loadingMentorData,
    error: mentorDataError,
    refetch: refetchMentorData,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.MENTORS,
    abi: MENTORS_ABI,
    functionName: 'getMentorData',
    args: [address!],
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!address,
    },
  });

  // Create mentor transaction
  const {
    writeContract: createMentor,
    data: createHash,
    isPending: createPending,
    error: createError,
  } = useWriteContract();

  const { isLoading: createConfirming, isSuccess: createConfirmed } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  // Set active status transaction
  const {
    writeContract: setActiveStatus,
    data: setActiveHash,
    isPending: setActivePending,
    error: setActiveError,
  } = useWriteContract();

  const { isLoading: setActiveConfirming, isSuccess: setActiveConfirmed } =
    useWaitForTransactionReceipt({
      hash: setActiveHash,
    });

  // Read session counter for mentor sessions
  const { data: sessionCounter } = useReadContract({
    address: CONTRACT_ADDRESSES.SESSIONS,
    abi: SESSIONS_ABI,
    functionName: 'sessionCounter',
    chainId: arbitrumSepolia.id,
  });

  // Read sessions where user is mentor
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

  // Complete session transaction
  const {
    writeContract: completeSession,
    data: completeHash,
    isPending: completePending,
    error: completeError,
  } = useWriteContract();

  const { isLoading: completeConfirming, isSuccess: completeConfirmed } =
    useWaitForTransactionReceipt({
      hash: completeHash,
    });

  // Update mentor data when contract data changes
  useEffect(() => {
    if (mentorDataResult) {
      setMentorData({
        registered: mentorDataResult[0],
        active: mentorDataResult[1],
        sessions: Number(mentorDataResult[2]),
        score: Number(mentorDataResult[3]),
      });
    }
  }, [mentorDataResult]);

  // Load mentor sessions
  const loadMentorSessions = async () => {
    if (!sessionCounter || sessionCounter === 0n || !address) {
      setMentorSessions([]);
      return;
    }

    setLoadingMentorSessions(true);
    const sessionsData: Array<SessionInfo & { id: number }> = [];

    // Process each session query
    const sessionQueries = [session1, session2, session3];

    sessionQueries.forEach((query, index) => {
      if (query.data) {
        const sessionInfo = query.data;
        const mentorAddress = sessionInfo[1];

        // Only include sessions where current user is the mentor
        if (mentorAddress.toLowerCase() === address.toLowerCase()) {
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
      }
    });

    setMentorSessions(sessionsData);
    setLoadingMentorSessions(false);
  };

  // Load mentor sessions when data changes
  useEffect(() => {
    if (sessionCounter !== undefined && address && mentorData?.registered) {
      loadMentorSessions();
    }
  }, [
    sessionCounter,
    session1.data,
    session2.data,
    session3.data,
    address,
    mentorData?.registered,
  ]);

  // Handle create mentor transaction states
  useEffect(() => {
    if (createPending) {
      toast.loading('Creating mentor profile...', { id: 'create-mentor' });
    }
  }, [createPending]);

  useEffect(() => {
    if (createConfirming) {
      toast.loading('Waiting for confirmation...', { id: 'create-mentor' });
    }
  }, [createConfirming]);

  useEffect(() => {
    if (createConfirmed) {
      toast.success('Mentor profile created successfully!', { id: 'create-mentor' });
      refetchMentorData();
    }
  }, [createConfirmed, refetchMentorData]);

  // Handle create mentor errors
  useEffect(() => {
    if (createError) {
      toast.error('Mentor profile creation failed', { id: 'create-mentor' });
    }
  }, [createError]);

  // Handle set active status transaction states
  useEffect(() => {
    if (setActivePending) {
      toast.loading('Updating mentor status...', { id: 'set-active' });
    }
  }, [setActivePending]);

  useEffect(() => {
    if (setActiveConfirming) {
      toast.loading('Waiting for confirmation...', { id: 'set-active' });
    }
  }, [setActiveConfirming]);

  useEffect(() => {
    if (setActiveConfirmed) {
      toast.success('Mentor status updated successfully!', { id: 'set-active' });
      refetchMentorData();
    }
  }, [setActiveConfirmed, refetchMentorData]);

  // Handle set active status errors
  useEffect(() => {
    if (setActiveError) {
      toast.error('Mentor status update failed', { id: 'set-active' });
    }
  }, [setActiveError]);

  // Handle complete session transaction states
  useEffect(() => {
    if (completePending) {
      toast.loading('Completing session...', { id: 'complete-session' });
    }
  }, [completePending]);

  useEffect(() => {
    if (completeConfirming) {
      toast.loading('Waiting for confirmation...', { id: 'complete-session' });
    }
  }, [completeConfirming]);

  useEffect(() => {
    if (completeConfirmed) {
      toast.success('Session completed successfully!', { id: 'complete-session' });
      loadMentorSessions();
    }
  }, [completeConfirmed]);

  // Handle complete session errors
  useEffect(() => {
    if (completeError) {
      toast.error('Failed to complete session', { id: 'complete-session' });
    }
  }, [completeError]);

  const handleCreateMentor = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      createMentor({
        address: CONTRACT_ADDRESSES.MENTORS,
        abi: MENTORS_ABI,
        functionName: 'createMentor',
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error creating mentor:', error);
      toast.error('Failed to create mentor profile');
    }
  };

  const handleToggleActive = async (isActive: boolean) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      setActiveStatus({
        address: CONTRACT_ADDRESSES.MENTORS,
        abi: MENTORS_ABI,
        functionName: 'MentorSetActive',
        args: [isActive],
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error updating mentor status:', error);
      toast.error('Failed to update mentor status');
    }
  };

  const handleCompleteSession = async (sessionId: number) => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      completeSession({
        address: CONTRACT_ADDRESSES.SESSIONS,
        abi: SESSIONS_ABI,
        functionName: 'completeSession',
        args: [BigInt(sessionId)],
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error completing session:', error);
      toast.error('Failed to complete session');
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
              Please connect your wallet to access the mentor dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loadingMentorData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Loading mentor data...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (mentorDataError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to load mentor data. Please try refreshing the page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-h-screen overflow-hidden">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <div className="mb-8 flex-shrink-0">
          <h1 className="text-3xl font-bold mb-2">Mentor Dashboard</h1>
          <p className="text-gray-600">
            Manage your mentor profile and track your mentoring sessions.
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6 pr-4">
            {!mentorData?.registered ? (
              <Card>
                <CardHeader>
                  <CardTitle>Become a Mentor</CardTitle>
                  <CardDescription>
                    Register as a mentor to start offering mentoring sessions and earning tokens.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleCreateMentor}
                    disabled={createPending || createConfirming}
                    size="lg"
                  >
                    {createPending || createConfirming ? 'Creating...' : 'Register as Mentor'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Mentor Profile Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Mentor Profile
                      <Badge variant={mentorData.active ? 'default' : 'secondary'}>
                        {mentorData.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>Your mentor profile information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <p className="text-sm text-gray-600">
                          {mentorData.registered ? 'Registered' : 'Not Registered'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Sessions Conducted</Label>
                        <p className="text-sm text-gray-600">{mentorData.sessions}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Score</Label>
                        <p className="text-sm text-gray-600">{mentorData.score}/255</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Wallet Address</Label>
                        <p className="text-sm text-gray-600 font-mono">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="active-toggle" className="text-sm font-medium">
                          Active Status
                        </Label>
                        <p className="text-sm text-gray-600">
                          {mentorData.active
                            ? 'You are currently accepting new sessions'
                            : 'You are not accepting new sessions'}
                        </p>
                      </div>
                      <Switch
                        id="active-toggle"
                        checked={mentorData.active}
                        onCheckedChange={handleToggleActive}
                        disabled={setActivePending || setActiveConfirming}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Statistics Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Statistics</CardTitle>
                    <CardDescription>Your mentoring activity overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{mentorData.sessions}</p>
                        <p className="text-sm text-gray-600">Sessions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{mentorData.score}</p>
                        <p className="text-sm text-gray-600">Score</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-600">
                          {mentorData.active ? 'Active' : 'Inactive'}
                        </p>
                        <p className="text-sm text-gray-600">Status</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* My Mentoring Sessions Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>My Mentoring Sessions</CardTitle>
                    <CardDescription>Sessions where you are the mentor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingMentorSessions ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">Loading sessions...</p>
                      </div>
                    ) : mentorSessions.length > 0 ? (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          {mentorSessions.length} session{mentorSessions.length === 1 ? '' : 's'}{' '}
                          found
                        </p>
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Session ID</TableHead>
                                <TableHead>Start Time</TableHead>
                                <TableHead>Participants</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {mentorSessions.map((session) => (
                                <TableRow key={session.id}>
                                  <TableCell>#{session.id}</TableCell>
                                  <TableCell>{formatTimestamp(session.startTime)}</TableCell>
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
                                    <div className="flex items-center gap-2">
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
                                  <TableCell>
                                    <div className="flex gap-2">
                                      {session.state === 1 && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleCompleteSession(session.id)}
                                          disabled={completePending || completeConfirming}
                                        >
                                          Complete
                                        </Button>
                                      )}
                                      {session.state === 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                          Waiting for participants
                                        </Badge>
                                      )}
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
                        <p className="text-gray-600 mb-4">
                          No sessions found where you are the mentor.
                        </p>
                        <p className="text-sm text-gray-500">
                          Sessions will appear here when someone creates a session with you as the
                          mentor.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
