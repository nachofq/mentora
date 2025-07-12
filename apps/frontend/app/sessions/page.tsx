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
import { toast } from 'react-hot-toast';
import {
  CONTRACT_ADDRESSES,
  SESSIONS_ABI,
  MOCK_ERC20_ABI,
  MENTORS_ABI,
  SessionState,
  type CreateSessionFormData,
  sessionFormToContractParams,
} from '@/lib/contracts';
import { formatEther, parseEther } from 'viem';

export default function SessionsPage() {
  const { address, isConnected } = useAccount();
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

  // Token approve transaction
  const {
    writeContract: approveToken,
    data: approveHash,
    isPending: approvePending,
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
  } = useWriteContract();

  const { isLoading: createConfirming, isSuccess: createConfirmed } = useWaitForTransactionReceipt({
    hash: createHash,
  });

  // Mint tokens transaction
  const { writeContract: mintTokens, data: mintHash, isPending: mintPending } = useWriteContract();

  const { isLoading: mintConfirming, isSuccess: mintConfirmed } = useWaitForTransactionReceipt({
    hash: mintHash,
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

  // Handle mint transaction states
  useEffect(() => {
    if (mintPending) {
      toast.loading('Minting tokens...', { id: 'mint-tokens' });
    }
  }, [mintPending]);

  useEffect(() => {
    if (mintConfirming) {
      toast.loading('Waiting for mint confirmation...', { id: 'mint-tokens' });
    }
  }, [mintConfirming]);

  useEffect(() => {
    if (mintConfirmed) {
      toast.success('Tokens minted successfully!', { id: 'mint-tokens' });
      refetchTokenBalance();
    }
  }, [mintConfirmed, refetchTokenBalance]);

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

  const handleMintTokens = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const mintAmount = parseEther('10'); // Mint 10 tokens
      mintTokens({
        address: CONTRACT_ADDRESSES.MOCK_ERC20,
        abi: MOCK_ERC20_ABI,
        functionName: 'mint',
        args: [address, mintAmount],
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error minting tokens:', error);
      toast.error('Failed to mint tokens');
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
                        {tokenBalance ? formatEther(tokenBalance) : '0'} tokens
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {tokenBalance ? formatEther(tokenBalance) : '0'} MOCK
                      </Badge>
                      <Button
                        onClick={handleMintTokens}
                        disabled={mintPending || mintConfirming}
                        variant="outline"
                        size="sm"
                      >
                        {mintPending || mintConfirming ? 'Minting...' : 'Mint 10 Tokens'}
                      </Button>
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
                <CardDescription>Discover and join available mentoring sessions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Total Sessions Created: {sessionCounter ? sessionCounter.toString() : '0'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Session browsing functionality coming soon...
                  </p>
                </div>
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
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    Session management functionality coming soon...
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
