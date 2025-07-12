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
import { CONTRACT_ADDRESSES, MENTORS_ABI, type MentorData } from '@/lib/contracts';

export default function MentorsPage() {
  const { address, isConnected } = useAccount();
  const [mentorData, setMentorData] = useState<MentorData | null>(null);

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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mentor Dashboard</h1>
          <p className="text-gray-600">
            Manage your mentor profile and track your mentoring sessions.
          </p>
        </div>

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
          </div>
        )}
      </div>
    </div>
  );
}
