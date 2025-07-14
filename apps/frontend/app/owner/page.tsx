'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';
import { CONTRACT_ADDRESSES, MENTORS_ABI, SESSIONS_ABI, MOCK_ERC20_ABI } from '@/lib/contracts';
import { formatEther, parseEther } from 'viem';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function OwnerPage() {
  const { address, isConnected } = useAccount();
  const [blacklistAddress, setBlacklistAddress] = useState('');
  const [blacklistFlag, setBlacklistFlag] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawRecipient, setWithdrawRecipient] = useState('');

  // Check if user is owner of contracts
  const { data: mentorsOwner } = useReadContract({
    address: CONTRACT_ADDRESSES.MENTORS,
    abi: MENTORS_ABI,
    functionName: 'owner',
    chainId: arbitrumSepolia.id,
  });

  const { data: sessionsOwner } = useReadContract({
    address: CONTRACT_ADDRESSES.SESSIONS,
    abi: SESSIONS_ABI,
    functionName: 'owner',
    chainId: arbitrumSepolia.id,
  });

  // Check if contracts are paused
  const { data: mentorsPaused, refetch: refetchMentorsPaused } = useReadContract({
    address: CONTRACT_ADDRESSES.MENTORS,
    abi: MENTORS_ABI,
    functionName: 'paused',
    chainId: arbitrumSepolia.id,
  });

  // Read contract fee
  const { data: sessionsFee } = useReadContract({
    address: CONTRACT_ADDRESSES.SESSIONS,
    abi: SESSIONS_ABI,
    functionName: 'fee',
    chainId: arbitrumSepolia.id,
  });

  // Read contract balance
  const { data: sessionsBalance, refetch: refetchSessionsBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.SESSIONS,
    abi: SESSIONS_ABI,
    functionName: 'getContractBalance',
    args: [CONTRACT_ADDRESSES.MOCK_ERC20],
    chainId: arbitrumSepolia.id,
  });

  // Blacklist transaction
  const {
    writeContract: setBlacklist,
    data: blacklistHash,
    isPending: blacklistPending,
    error: blacklistError,
  } = useWriteContract();

  const { isLoading: blacklistConfirming, isSuccess: blacklistConfirmed } =
    useWaitForTransactionReceipt({
      hash: blacklistHash,
    });

  // Pause/unpause mentors transaction
  const {
    writeContract: toggleMentorsPause,
    data: mentorsPauseHash,
    isPending: mentorsPausePending,
    error: mentorsPauseError,
  } = useWriteContract();

  const { isLoading: mentorsPauseConfirming, isSuccess: mentorsPauseConfirmed } =
    useWaitForTransactionReceipt({
      hash: mentorsPauseHash,
    });

  // Withdraw transaction
  const {
    writeContract: withdraw,
    data: withdrawHash,
    isPending: withdrawPending,
    error: withdrawError,
  } = useWriteContract();

  const { isLoading: withdrawConfirming, isSuccess: withdrawConfirmed } =
    useWaitForTransactionReceipt({
      hash: withdrawHash,
    });

  // Mint tokens transaction
  const {
    writeContract: mintTokens,
    data: mintHash,
    isPending: mintPending,
    error: mintError,
  } = useWriteContract();

  const { isLoading: mintConfirming, isSuccess: mintConfirmed } = useWaitForTransactionReceipt({
    hash: mintHash,
  });

  // Handle transaction states
  useEffect(() => {
    if (blacklistPending) {
      toast.loading('Updating blacklist...', { id: 'blacklist' });
    }
  }, [blacklistPending]);

  useEffect(() => {
    if (blacklistConfirming) {
      toast.loading('Waiting for confirmation...', { id: 'blacklist' });
    }
  }, [blacklistConfirming]);

  useEffect(() => {
    if (blacklistConfirmed) {
      toast.success('Blacklist updated successfully!', { id: 'blacklist' });
      setBlacklistAddress('');
      setBlacklistFlag(false);
    }
  }, [blacklistConfirmed]);

  // Handle blacklist errors
  useEffect(() => {
    if (blacklistError) {
      toast.error('Blacklist update failed', { id: 'blacklist' });
    }
  }, [blacklistError]);

  useEffect(() => {
    if (mentorsPausePending) {
      toast.loading('Updating pause status...', { id: 'pause' });
    }
  }, [mentorsPausePending]);

  useEffect(() => {
    if (mentorsPauseConfirming) {
      toast.loading('Waiting for confirmation...', { id: 'pause' });
    }
  }, [mentorsPauseConfirming]);

  useEffect(() => {
    if (mentorsPauseConfirmed) {
      toast.success('Pause status updated successfully!', { id: 'pause' });
      refetchMentorsPaused();
    }
  }, [mentorsPauseConfirmed, refetchMentorsPaused]);

  // Handle pause errors
  useEffect(() => {
    if (mentorsPauseError) {
      toast.error('Pause status update failed', { id: 'pause' });
    }
  }, [mentorsPauseError]);

  useEffect(() => {
    if (withdrawPending) {
      toast.loading('Withdrawing funds...', { id: 'withdraw' });
    }
  }, [withdrawPending]);

  useEffect(() => {
    if (withdrawConfirming) {
      toast.loading('Waiting for confirmation...', { id: 'withdraw' });
    }
  }, [withdrawConfirming]);

  useEffect(() => {
    if (withdrawConfirmed) {
      toast.success('Funds withdrawn successfully!', { id: 'withdraw' });
      setWithdrawAmount('');
      setWithdrawRecipient('');
      refetchSessionsBalance();
    }
  }, [withdrawConfirmed, refetchSessionsBalance]);

  // Handle withdraw errors
  useEffect(() => {
    if (withdrawError) {
      toast.error('Withdrawal failed', { id: 'withdraw' });
    }
  }, [withdrawError]);

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
    }
  }, [mintConfirmed]);

  // Handle mint errors
  useEffect(() => {
    if (mintError) {
      toast.error('Token minting failed', { id: 'mint-tokens' });
    }
  }, [mintError]);

  const isOwner =
    address &&
    ((mentorsOwner && address.toLowerCase() === mentorsOwner.toLowerCase()) ||
      (sessionsOwner && address.toLowerCase() === sessionsOwner.toLowerCase()));

  const handleSetBlacklist = async () => {
    if (!address || !blacklistAddress) {
      toast.error('Please enter an address to blacklist');
      return;
    }

    try {
      setBlacklist({
        address: CONTRACT_ADDRESSES.MENTORS,
        abi: MENTORS_ABI,
        functionName: 'setBlacklist',
        args: [blacklistAddress as `0x${string}`, blacklistFlag],
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error setting blacklist:', error);
      toast.error('Failed to update blacklist');
    }
  };

  const handleTogglePause = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const isPaused = mentorsPaused;
      const functionName = isPaused ? 'unpause' : 'pause';

      toggleMentorsPause({
        address: CONTRACT_ADDRESSES.MENTORS,
        abi: MENTORS_ABI,
        functionName,
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error toggling pause:', error);
      toast.error('Failed to toggle pause status');
    }
  };

  const handleWithdraw = async () => {
    if (!address || !withdrawAmount || !withdrawRecipient) {
      toast.error('Please enter amount and recipient address');
      return;
    }

    try {
      const amount = parseEther(withdrawAmount);
      withdraw({
        address: CONTRACT_ADDRESSES.SESSIONS,
        abi: SESSIONS_ABI,
        functionName: 'withdraw',
        args: [CONTRACT_ADDRESSES.MOCK_ERC20, withdrawRecipient as `0x${string}`, amount],
        chainId: arbitrumSepolia.id,
      });
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      toast.error('Failed to withdraw funds');
    }
  };

  const handleMintTokens = async () => {
    if (!address) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      const mintAmount = parseEther('100'); // Mint 100 tokens for testing
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

  if (!isConnected) {
    return (
      <div className="scrollable-page">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Please connect your wallet to access the owner dashboard.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="scrollable-page">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You are not the owner of any contracts. Only contract owners can access this page.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="scrollable-page">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Owner Dashboard</h1>
            <p className="text-gray-600">Manage contract settings and monitor system activity.</p>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-6 pr-4">
              {/* Contract Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Contract Status</CardTitle>
                  <CardDescription>View and manage the status of your contracts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Mentors Contract</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={mentorsPaused ? 'destructive' : 'default'}>
                          {mentorsPaused ? 'Paused' : 'Active'}
                        </Badge>
                        <Button
                          onClick={handleTogglePause}
                          disabled={mentorsPausePending || mentorsPauseConfirming}
                          variant="outline"
                          size="sm"
                        >
                          {mentorsPaused ? 'Unpause' : 'Pause'}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Sessions Contract</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default">Always Active</Badge>
                        <p className="text-xs text-gray-500">No pause functionality</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Blacklist Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Blacklist Management</CardTitle>
                  <CardDescription>Manage mentor blacklist status.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="blacklist-address">Mentor Address</Label>
                      <Input
                        id="blacklist-address"
                        placeholder="0x..."
                        value={blacklistAddress}
                        onChange={(e) => setBlacklistAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Blacklist Status</Label>
                      <div className="flex items-center gap-2">
                        <Switch checked={blacklistFlag} onCheckedChange={setBlacklistFlag} />
                        <span className="text-sm">
                          {blacklistFlag ? 'Blacklisted' : 'Not Blacklisted'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleSetBlacklist}
                    disabled={!blacklistAddress || blacklistPending || blacklistConfirming}
                  >
                    {blacklistPending || blacklistConfirming ? 'Updating...' : 'Update Blacklist'}
                  </Button>
                </CardContent>
              </Card>

              {/* Fee Withdrawal */}
              <Card>
                <CardHeader>
                  <CardTitle>Fee Withdrawal</CardTitle>
                  <CardDescription>
                    Withdraw accumulated fees from the Sessions contract.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Contract Balance</Label>
                      <p className="text-lg font-mono">
                        {sessionsBalance ? formatEther(sessionsBalance) : '0'} MOCK
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Fee Rate</Label>
                      <p className="text-lg">
                        {sessionsFee ? `${sessionsFee.toString()}%` : 'Loading...'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        step="0.00001"
                        placeholder="0.0"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-recipient">Recipient Address</Label>
                      <Input
                        id="withdraw-recipient"
                        placeholder="0x... (leave empty for owner)"
                        value={withdrawRecipient}
                        onChange={(e) => setWithdrawRecipient(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleWithdraw}
                    disabled={
                      !withdrawAmount ||
                      parseFloat(withdrawAmount) <= 0 ||
                      withdrawPending ||
                      withdrawConfirming
                    }
                  >
                    {withdrawPending || withdrawConfirming ? 'Withdrawing...' : 'Withdraw Fees'}
                  </Button>
                </CardContent>
              </Card>

              {/* Token Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Token Management</CardTitle>
                  <CardDescription>Mint tokens for testing and development.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleMintTokens}
                    disabled={mintPending || mintConfirming}
                    variant="outline"
                  >
                    {mintPending || mintConfirming ? 'Minting...' : 'Mint 1000 MOCK Tokens'}
                  </Button>
                  <p className="text-sm text-gray-600">
                    This will mint 1000 MOCK tokens to your wallet for testing purposes.
                  </p>
                </CardContent>
              </Card>

              {/* Contract Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contract Information</CardTitle>
                  <CardDescription>View deployed contract addresses and details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Mentors Contract</Label>
                      <p className="text-xs text-gray-600 font-mono">
                        {CONTRACT_ADDRESSES.MENTORS}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Sessions Contract</Label>
                      <p className="text-xs text-gray-600 font-mono">
                        {CONTRACT_ADDRESSES.SESSIONS}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Participants Contract</Label>
                      <p className="text-xs text-gray-600 font-mono">
                        {CONTRACT_ADDRESSES.PARTICIPANTS}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">MockERC20 Contract</Label>
                      <p className="text-xs text-gray-600 font-mono">
                        {CONTRACT_ADDRESSES.MOCK_ERC20}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
