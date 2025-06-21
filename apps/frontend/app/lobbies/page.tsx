'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useAccount,
  useReadContract,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { MENTORA_CONTRACT_ADDRESS, MENTORA_ABI, LobbyState } from '@/lib/contract';
import { formatEther, parseEther } from 'viem';
import { arbitrumSepolia } from 'wagmi/chains';
import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

// Helper function to convert contract return tuple to LobbyInfo object
function tupleToLobbyInfo(
  tuple: readonly [bigint, string, string, string, bigint, bigint, bigint, bigint, bigint],
) {
  return {
    id: tuple[0],
    creator: tuple[1],
    master: tuple[2],
    description: tuple[3],
    amountPerParticipant: tuple[4],
    maxParticipants: tuple[5],
    currentParticipants: tuple[6],
    state: tuple[7],
    totalDeposited: tuple[8],
  };
}

// Separate component for a single lobby info query
function LobbyInfoQuery({ lobbyId, address }: { lobbyId: bigint; address: string }) {
  const { data, isLoading, error } = useReadContract({
    address: MENTORA_CONTRACT_ADDRESS,
    abi: MENTORA_ABI,
    functionName: 'getLobbyInfo',
    args: [lobbyId],
    account: address as `0x${string}`,
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!address && !!lobbyId,
    },
  });

  console.log(`Lobby ${lobbyId.toString()} query:`, { data, isLoading, error: error?.message });

  return { data, isLoading, error };
}

// Component to manage multiple lobby queries
function LobbiesData({ lobbyIds, address }: { lobbyIds: bigint[]; address: string }) {
  const [lobbiesData, setLobbiesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!lobbyIds.length) {
      setLobbiesData([]);
      setIsLoading(false);
      return;
    }

    const fetchLobbies = async () => {
      const promises = lobbyIds.map(async (lobbyId) => {
        try {
          // For now, let's return the lobby IDs and we'll fetch details differently
          return { id: lobbyId, data: null };
        } catch (error) {
          console.error(`Error fetching lobby ${lobbyId}:`, error);
          return { id: lobbyId, data: null, error };
        }
      });

      const results = await Promise.all(promises);
      setLobbiesData(results);
      setIsLoading(false);
    };

    fetchLobbies();
  }, [lobbyIds, address]);

  return { lobbiesData, isLoading };
}

// Component for displaying a single lobby row with detailed information
function LobbyRow({ lobbyId, address }: { lobbyId: bigint; address: string }) {
  const {
    data: lobbyData,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: MENTORA_CONTRACT_ADDRESS,
    abi: MENTORA_ABI,
    functionName: 'getLobbyInfo',
    args: [lobbyId],
    account: address as `0x${string}`,
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!address && !!lobbyId,
    },
  });

  // Accept lobby transaction
  const {
    writeContract: acceptLobby,
    data: acceptHash,
    isPending: acceptPending,
  } = useWriteContract();
  const { isLoading: acceptConfirming, isSuccess: acceptConfirmed } = useWaitForTransactionReceipt({
    hash: acceptHash,
  });

  // Cancel lobby transaction
  const {
    writeContract: cancelLobby,
    data: cancelHash,
    isPending: cancelPending,
  } = useWriteContract();
  const { isLoading: cancelConfirming, isSuccess: cancelConfirmed } = useWaitForTransactionReceipt({
    hash: cancelHash,
  });

  // Complete lobby transaction
  const {
    writeContract: completeLobby,
    data: completeHash,
    isPending: completePending,
  } = useWriteContract();
  const { isLoading: completeConfirming, isSuccess: completeConfirmed } =
    useWaitForTransactionReceipt({
      hash: completeHash,
    });

  // Handle accept transaction states
  useEffect(() => {
    if (acceptPending) {
      toast.loading(`Accepting lobby #${lobbyId.toString()}...`, {
        id: `accept-${lobbyId.toString()}`,
      });
    }
  }, [acceptPending, lobbyId]);

  useEffect(() => {
    if (acceptConfirming) {
      toast.loading('Waiting for confirmation...', { id: `accept-${lobbyId.toString()}` });
    }
  }, [acceptConfirming, lobbyId]);

  useEffect(() => {
    if (acceptConfirmed) {
      toast.success('Lobby accepted successfully!', { id: `accept-${lobbyId.toString()}` });
      refetch();
    }
  }, [acceptConfirmed, lobbyId, refetch]);

  // Handle cancel transaction states
  useEffect(() => {
    if (cancelPending) {
      toast.loading(`Cancelling lobby #${lobbyId.toString()}...`, {
        id: `cancel-${lobbyId.toString()}`,
      });
    }
  }, [cancelPending, lobbyId]);

  useEffect(() => {
    if (cancelConfirming) {
      toast.loading('Waiting for confirmation...', { id: `cancel-${lobbyId.toString()}` });
    }
  }, [cancelConfirming, lobbyId]);

  useEffect(() => {
    if (cancelConfirmed) {
      toast.success('Lobby cancelled successfully! All participants have been refunded.', {
        id: `cancel-${lobbyId.toString()}`,
      });
      refetch();
    }
  }, [cancelConfirmed, lobbyId, refetch]);

  // Handle complete transaction states
  useEffect(() => {
    if (completePending) {
      toast.loading(`Completing lobby #${lobbyId.toString()}...`, {
        id: `complete-${lobbyId.toString()}`,
      });
    }
  }, [completePending, lobbyId]);

  useEffect(() => {
    if (completeConfirming) {
      toast.loading('Waiting for confirmation...', { id: `complete-${lobbyId.toString()}` });
    }
  }, [completeConfirming, lobbyId]);

  useEffect(() => {
    if (completeConfirmed) {
      toast.success(
        'Lobby completed successfully! All funds have been transferred to the master.',
        {
          id: `complete-${lobbyId.toString()}`,
        },
      );
      refetch();
    }
  }, [completeConfirmed, lobbyId, refetch]);

  const handleAcceptLobby = async () => {
    try {
      acceptLobby({
        address: MENTORA_CONTRACT_ADDRESS,
        abi: MENTORA_ABI,
        functionName: 'acceptLobby',
        args: [lobbyId],
      });
    } catch (err: any) {
      console.error('Error accepting lobby:', err);
      if (err?.message?.includes('User rejected') || err?.message?.includes('User denied')) {
        toast.error('Transaction cancelled by user');
      } else {
        toast.error('Failed to accept lobby');
      }
    }
  };

  const handleCancelLobby = async () => {
    try {
      cancelLobby({
        address: MENTORA_CONTRACT_ADDRESS,
        abi: MENTORA_ABI,
        functionName: 'cancelLobby',
        args: [lobbyId],
      });
    } catch (err: any) {
      console.error('Error cancelling lobby:', err);
      if (err?.message?.includes('User rejected') || err?.message?.includes('User denied')) {
        toast.error('Transaction cancelled by user');
      } else {
        toast.error('Failed to cancel lobby');
      }
    }
  };

  const handleCompleteLobby = async () => {
    try {
      completeLobby({
        address: MENTORA_CONTRACT_ADDRESS,
        abi: MENTORA_ABI,
        functionName: 'completeLobby',
        args: [lobbyId],
      });
    } catch (err: any) {
      console.error('Error completing lobby:', err);
      if (err?.message?.includes('User rejected') || err?.message?.includes('User denied')) {
        toast.error('Transaction cancelled by user');
      } else {
        toast.error('Failed to complete lobby');
      }
    }
  };

  const getStateLabel = (state: bigint) => {
    switch (Number(state)) {
      case LobbyState.Created:
        return 'Created';
      case LobbyState.Accepted:
        return 'Accepted';
      case LobbyState.Cancelled:
        return 'Cancelled';
      case LobbyState.Completed:
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getStateColor = (state: bigint) => {
    switch (Number(state)) {
      case LobbyState.Created:
        return 'text-blue-600';
      case LobbyState.Accepted:
        return 'text-green-600';
      case LobbyState.Cancelled:
        return 'text-red-600';
      case LobbyState.Completed:
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <TableRow>
        <TableCell className="font-medium">#{lobbyId.toString()}</TableCell>
        <TableCell className="text-muted-foreground">Loading...</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
      </TableRow>
    );
  }

  if (error || !lobbyData) {
    return (
      <TableRow>
        <TableCell className="font-medium">#{lobbyId.toString()}</TableCell>
        <TableCell className="text-red-600">Error loading</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
      </TableRow>
    );
  }

  const lobby = {
    id: lobbyData[0],
    creator: lobbyData[1],
    master: lobbyData[2],
    description: lobbyData[3],
    amountPerParticipant: lobbyData[4],
    maxParticipants: lobbyData[5],
    currentParticipants: lobbyData[6],
    state: BigInt(lobbyData[7]),
    totalDeposited: lobbyData[8],
  };

  const canAccept = Number(lobby.state) === LobbyState.Created;
  const canCancel =
    Number(lobby.state) === LobbyState.Created || Number(lobby.state) === LobbyState.Accepted;
  const canComplete = Number(lobby.state) === LobbyState.Accepted;
  const isAcceptProcessing = acceptPending || acceptConfirming;
  const isCancelProcessing = cancelPending || cancelConfirming;
  const isCompleteProcessing = completePending || completeConfirming;
  const isAnyProcessing = isAcceptProcessing || isCancelProcessing || isCompleteProcessing;

  return (
    <TableRow>
      <TableCell className="font-medium">#{lobby.id.toString()}</TableCell>
      <TableCell className="max-w-xs truncate" title={lobby.description}>
        {lobby.description}
      </TableCell>
      <TableCell>
        {lobby.currentParticipants.toString()}/{lobby.maxParticipants.toString()}
      </TableCell>
      <TableCell>{formatEther(lobby.amountPerParticipant)} ETH</TableCell>
      <TableCell>{formatEther(lobby.totalDeposited)} ETH</TableCell>
      <TableCell>
        <span className={`font-medium ${getStateColor(lobby.state)}`}>
          {getStateLabel(lobby.state)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex gap-2 flex-wrap">
          {canAccept && (
            <Button
              onClick={handleAcceptLobby}
              disabled={isAnyProcessing}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {isAcceptProcessing ? 'Accepting...' : 'Accept'}
            </Button>
          )}
          {canComplete && (
            <Button
              onClick={handleCompleteLobby}
              disabled={isAnyProcessing}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isCompleteProcessing ? 'Completing...' : 'Complete'}
            </Button>
          )}
          {canCancel && (
            <Button
              onClick={handleCancelLobby}
              disabled={isAnyProcessing}
              size="sm"
              variant="destructive"
            >
              {isCancelProcessing ? 'Cancelling...' : 'Cancel'}
            </Button>
          )}
          {!canAccept && !canCancel && !canComplete && (
            <span className="text-sm text-muted-foreground">
              {Number(lobby.state) === LobbyState.Cancelled
                ? 'Cancelled'
                : Number(lobby.state) === LobbyState.Completed
                  ? 'Completed'
                  : 'No actions'}
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function JoinLobbiesList({
  refreshRef,
}: {
  refreshRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Fetch lobby IDs where user is participant
  const {
    data: lobbyIds,
    isLoading: isLoadingIds,
    error: lobbyIdsError,
    refetch: refetchParticipantLobbies,
  } = useReadContract({
    address: MENTORA_CONTRACT_ADDRESS,
    abi: MENTORA_ABI,
    functionName: 'getMyLobbiesAsParticipant',
    account: address,
    chainId: arbitrumSepolia.id,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Expose the refetch function via ref
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = refetchParticipantLobbies;
    }
  }, [refetchParticipantLobbies, refreshRef]);

  if (!isConnected) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">My Joined Lobbies</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Please connect your wallet to view joined lobbies</p>
        </div>
      </div>
    );
  }

  if (chainId !== arbitrumSepolia.id) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">My Joined Lobbies</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Please switch to Arbitrum Sepolia network</p>
        </div>
      </div>
    );
  }

  if (lobbyIdsError) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">My Joined Lobbies</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-red-600">Error loading joined lobbies: {lobbyIdsError.message}</p>
        </div>
      </div>
    );
  }

  if (isLoadingIds) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">My Joined Lobbies</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Loading joined lobbies...</p>
        </div>
      </div>
    );
  }

  if (!lobbyIds || lobbyIds.length === 0) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">My Joined Lobbies</h2>
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <p className="text-muted-foreground">You haven't joined any lobbies yet</p>
          <p className="text-sm text-muted-foreground">Use the form on the right to join a lobby</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg border">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">My Joined Lobbies</h2>
        <p className="text-muted-foreground mt-1">Lobbies where you are a participant</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>My Deposit</TableHead>
            <TableHead>Total Deposited</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lobbyIds.map((lobbyId) => (
            <ParticipantLobbyRow
              key={lobbyId.toString()}
              lobbyId={lobbyId}
              address={address || ''}
              onAbandonSuccess={refetchParticipantLobbies}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Component for displaying a single lobby row where user is participant
function ParticipantLobbyRow({
  lobbyId,
  address,
  onAbandonSuccess,
}: {
  lobbyId: bigint;
  address: string;
  onAbandonSuccess: () => void;
}) {
  const {
    data: lobbyData,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    address: MENTORA_CONTRACT_ADDRESS,
    abi: MENTORA_ABI,
    functionName: 'getLobbyInfo',
    args: [lobbyId],
    account: address as `0x${string}`,
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!address && !!lobbyId,
    },
  });

  // Abandon lobby transaction
  const {
    writeContract: abandonLobby,
    data: abandonHash,
    isPending: abandonPending,
  } = useWriteContract();
  const { isLoading: abandonConfirming, isSuccess: abandonConfirmed } =
    useWaitForTransactionReceipt({
      hash: abandonHash,
    });

  // Handle abandon transaction states
  useEffect(() => {
    if (abandonPending) {
      toast.loading(`Abandoning lobby #${lobbyId.toString()}...`, {
        id: `abandon-${lobbyId.toString()}`,
      });
    }
  }, [abandonPending, lobbyId]);

  useEffect(() => {
    if (abandonConfirming) {
      toast.loading('Waiting for confirmation...', { id: `abandon-${lobbyId.toString()}` });
    }
  }, [abandonConfirming, lobbyId]);

  useEffect(() => {
    if (abandonConfirmed) {
      toast.success('Successfully abandoned lobby! Your deposit has been refunded.', {
        id: `abandon-${lobbyId.toString()}`,
      });
      // Refresh the participant lobbies list
      onAbandonSuccess();
      // Also refetch this specific lobby data
      refetch();
    }
  }, [abandonConfirmed, lobbyId, onAbandonSuccess, refetch]);

  const handleAbandonLobby = async () => {
    try {
      abandonLobby({
        address: MENTORA_CONTRACT_ADDRESS,
        abi: MENTORA_ABI,
        functionName: 'abandonLobby',
        args: [lobbyId],
      });
    } catch (err: any) {
      console.error('Error abandoning lobby:', err);
      if (err?.message?.includes('User rejected') || err?.message?.includes('User denied')) {
        toast.error('Transaction cancelled by user');
      } else {
        toast.error('Failed to abandon lobby');
      }
    }
  };

  const getStateLabel = (state: bigint) => {
    switch (Number(state)) {
      case LobbyState.Created:
        return 'Open';
      case LobbyState.Accepted:
        return 'Accepted';
      case LobbyState.Cancelled:
        return 'Cancelled';
      case LobbyState.Completed:
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getStateColor = (state: bigint) => {
    switch (Number(state)) {
      case LobbyState.Created:
        return 'text-blue-600';
      case LobbyState.Accepted:
        return 'text-green-600';
      case LobbyState.Cancelled:
        return 'text-red-600';
      case LobbyState.Completed:
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <TableRow>
        <TableCell className="font-medium">#{lobbyId.toString()}</TableCell>
        <TableCell className="text-muted-foreground">Loading...</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
      </TableRow>
    );
  }

  if (error || !lobbyData) {
    return (
      <TableRow>
        <TableCell className="font-medium">#{lobbyId.toString()}</TableCell>
        <TableCell className="text-red-600">Error loading</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
        <TableCell className="text-muted-foreground">-</TableCell>
      </TableRow>
    );
  }

  const lobby = {
    id: lobbyData[0],
    creator: lobbyData[1],
    master: lobbyData[2],
    description: lobbyData[3],
    amountPerParticipant: lobbyData[4],
    maxParticipants: lobbyData[5],
    currentParticipants: lobbyData[6],
    state: BigInt(lobbyData[7]),
    totalDeposited: lobbyData[8],
  };

  // Can only abandon lobbies in "Created" state (before they're accepted)
  const canAbandon = Number(lobby.state) === LobbyState.Created;
  const isProcessing = abandonPending || abandonConfirming;

  return (
    <TableRow>
      <TableCell className="font-medium">#{lobby.id.toString()}</TableCell>
      <TableCell className="max-w-xs truncate" title={lobby.description}>
        {lobby.description}
      </TableCell>
      <TableCell>
        {lobby.currentParticipants.toString()}/{lobby.maxParticipants.toString()}
      </TableCell>
      <TableCell>
        <span className={`font-medium ${getStateColor(lobby.state)}`}>
          {getStateLabel(lobby.state)}
        </span>
      </TableCell>
      <TableCell>{formatEther(lobby.amountPerParticipant)} ETH</TableCell>
      <TableCell>{formatEther(lobby.totalDeposited)} ETH</TableCell>
      <TableCell>
        {canAbandon ? (
          <Button
            onClick={handleAbandonLobby}
            disabled={isProcessing}
            size="sm"
            variant="destructive"
          >
            {isProcessing ? 'Abandoning...' : 'Abandon'}
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">
            {Number(lobby.state) === LobbyState.Accepted
              ? 'Cannot abandon (accepted)'
              : Number(lobby.state) === LobbyState.Cancelled
                ? 'Cancelled'
                : Number(lobby.state) === LobbyState.Completed
                  ? 'Completed'
                  : 'Cannot abandon'}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

function JoinLobby({ onJoinSuccess }: { onJoinSuccess?: () => void }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [lobbyId, setLobbyId] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  // Fetch lobby info when lobbyId changes
  const {
    data: lobbyData,
    isLoading: isLoadingLobby,
    error: lobbyError,
    refetch: refetchLobby,
  } = useReadContract({
    address: MENTORA_CONTRACT_ADDRESS,
    abi: MENTORA_ABI,
    functionName: 'getLobbyInfo',
    args: [BigInt(lobbyId || '0')],
    account: address as `0x${string}`,
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!lobbyId && !!address && parseInt(lobbyId) > 0,
    },
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle transaction states
  useEffect(() => {
    if (isPending) {
      toast.loading('Joining lobby...', { id: 'join-lobby' });
    }
  }, [isPending]);

  useEffect(() => {
    if (isConfirming) {
      toast.loading('Waiting for confirmation...', { id: 'join-lobby' });
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success('Successfully joined the lobby!', { id: 'join-lobby' });
      setIsJoining(false);
      setLobbyId('');
      // Refetch lobby data to show updated participant count
      refetchLobby();
      // Call the callback to refresh participant lobbies list
      if (onJoinSuccess) {
        onJoinSuccess();
      }
    }
  }, [isConfirmed, refetchLobby, onJoinSuccess]);

  useEffect(() => {
    if (error) {
      // Check if it's a user rejection error
      if (error.message.includes('User rejected') || error.message.includes('User denied')) {
        toast.error('Transaction cancelled by user', { id: 'join-lobby' });
      } else {
        // Show a simplified error message for other errors
        const errorMessage = error.message.split('\n')[0] || 'Failed to join lobby';
        toast.error(`Error: ${errorMessage}`, { id: 'join-lobby' });
      }
      setIsJoining(false);
    }
  }, [error]);

  const handleJoinLobby = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (chainId !== arbitrumSepolia.id) {
      toast.error('Please switch to Arbitrum Sepolia network');
      return;
    }

    if (!lobbyId || parseInt(lobbyId) <= 0) {
      toast.error('Please enter a valid lobby ID');
      return;
    }

    if (!lobbyData) {
      toast.error('Lobby not found or failed to load');
      return;
    }

    const lobby = {
      id: lobbyData[0],
      creator: lobbyData[1],
      master: lobbyData[2],
      description: lobbyData[3],
      amountPerParticipant: lobbyData[4],
      maxParticipants: lobbyData[5],
      currentParticipants: lobbyData[6],
      state: BigInt(lobbyData[7]),
      totalDeposited: lobbyData[8],
    };

    // Validation
    if (Number(lobby.state) !== LobbyState.Created) {
      toast.error('This lobby is not accepting new participants');
      return;
    }

    if (lobby.currentParticipants >= lobby.maxParticipants) {
      toast.error('This lobby is full');
      return;
    }

    if (lobby.master.toLowerCase() === address.toLowerCase()) {
      toast.error('You cannot join your own lobby as master');
      return;
    }

    try {
      setIsJoining(true);

      writeContract({
        address: MENTORA_CONTRACT_ADDRESS,
        abi: MENTORA_ABI,
        functionName: 'joinLobby',
        args: [BigInt(lobbyId)],
        value: lobby.amountPerParticipant,
      });
    } catch (err) {
      console.error('Error joining lobby:', err);
      toast.error('Failed to join lobby');
      setIsJoining(false);
    }
  };

  const getStateLabel = (state: bigint) => {
    switch (Number(state)) {
      case LobbyState.Created:
        return 'Open for joining';
      case LobbyState.Accepted:
        return 'Accepted (closed)';
      case LobbyState.Cancelled:
        return 'Cancelled';
      case LobbyState.Completed:
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getStateColor = (state: bigint) => {
    switch (Number(state)) {
      case LobbyState.Created:
        return 'text-green-600';
      case LobbyState.Accepted:
        return 'text-blue-600';
      case LobbyState.Cancelled:
        return 'text-red-600';
      case LobbyState.Completed:
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Please connect your wallet to join a lobby</p>
      </div>
    );
  }

  if (chainId !== arbitrumSepolia.id) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Please switch to Arbitrum Sepolia network</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-card p-6 rounded-lg border">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Join a Lobby</h2>
          <p className="text-muted-foreground mt-2">Enter the lobby ID to view details and join</p>
        </div>

        <form onSubmit={handleJoinLobby} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lobbyId">Lobby ID</Label>
            <Input
              id="lobbyId"
              type="number"
              min="1"
              placeholder="Enter lobby ID (e.g., 1, 2, 3...)"
              value={lobbyId}
              onChange={(e) => setLobbyId(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">Ask the lobby creator for the lobby ID</p>
          </div>

          {lobbyId && parseInt(lobbyId) > 0 && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">Lobby Details</h3>

              {isLoadingLobby ? (
                <p className="text-muted-foreground">Loading lobby details...</p>
              ) : !!lobbyError || !lobbyData ? (
                <p className="text-red-600">Lobby not found or failed to load</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {(() => {
                    const lobby = {
                      id: lobbyData[0],
                      creator: lobbyData[1],
                      master: lobbyData[2],
                      description: lobbyData[3],
                      amountPerParticipant: lobbyData[4],
                      maxParticipants: lobbyData[5],
                      currentParticipants: lobbyData[6],
                      state: BigInt(lobbyData[7]),
                      totalDeposited: lobbyData[8],
                    };

                    return (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">ID:</span> #{lobby.id.toString()}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>{' '}
                            <span className={`font-medium ${getStateColor(lobby.state)}`}>
                              {getStateLabel(lobby.state)}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Participants:</span>{' '}
                            {lobby.currentParticipants.toString()}/
                            {lobby.maxParticipants.toString()}
                          </div>
                          <div>
                            <span className="font-medium">Cost to Join:</span>{' '}
                            {formatEther(lobby.amountPerParticipant)} ETH
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className="font-medium">Description:</span>
                          <p className="mt-1 text-muted-foreground">{lobby.description}</p>
                        </div>
                        <div className="mt-3">
                          <span className="font-medium">Master:</span>{' '}
                          <span className="font-mono text-xs">{lobby.master}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              isJoining ||
              isPending ||
              isConfirming ||
              !lobbyId ||
              parseInt(lobbyId) <= 0 ||
              isLoadingLobby ||
              !!lobbyError ||
              !lobbyData
            }
          >
            {isJoining || isPending || isConfirming
              ? 'Joining Lobby...'
              : lobbyData && Number(lobbyData[7]) === LobbyState.Created
                ? `Join Lobby (${formatEther(lobbyData[4])} ETH)`
                : 'Join Lobby'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function JoinedLobbies() {
  const refreshParticipantLobbiesRef = useRef<(() => void) | null>(null);

  const handleJoinSuccess = () => {
    if (refreshParticipantLobbiesRef.current) {
      refreshParticipantLobbiesRef.current();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3">
        <JoinLobbiesList refreshRef={refreshParticipantLobbiesRef} />
      </div>
      <div className="lg:col-span-2">
        <JoinLobby onJoinSuccess={handleJoinSuccess} />
      </div>
    </div>
  );
}

function CreateLobby({ onCreateSuccess }: { onCreateSuccess?: () => void }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    master: '',
    maxParticipants: '',
    amountPerParticipant: '',
    description: '',
  });

  const { writeContract, data: hash, error, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle transaction states with useEffect
  useEffect(() => {
    if (isPending) {
      toast.loading('Creating lobby...', { id: 'create-lobby' });
    }
  }, [isPending]);

  useEffect(() => {
    if (isConfirming) {
      toast.loading('Waiting for confirmation...', { id: 'create-lobby' });
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isConfirmed) {
      toast.success('Lobby created successfully!', { id: 'create-lobby' });
      setIsSubmitting(false);
      // Reset form
      setFormData({
        master: '',
        maxParticipants: '',
        amountPerParticipant: '',
        description: '',
      });
      // Call the callback to refresh my lobbies list
      if (onCreateSuccess) {
        onCreateSuccess();
      }
    }
  }, [isConfirmed, onCreateSuccess]);

  useEffect(() => {
    if (error) {
      // Check if it's a user rejection error
      if (error.message.includes('User rejected') || error.message.includes('User denied')) {
        toast.error('Transaction cancelled by user', { id: 'create-lobby' });
      } else {
        // Show a simplified error message for other errors
        const errorMessage = error.message.split('\n')[0] || 'Failed to create lobby';
        toast.error(`Error: ${errorMessage}`, { id: 'create-lobby' });
      }
      setIsSubmitting(false);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (chainId !== arbitrumSepolia.id) {
      toast.error('Please switch to Arbitrum Sepolia network');
      return;
    }

    // Validation
    if (
      !formData.master ||
      !formData.maxParticipants ||
      !formData.amountPerParticipant ||
      !formData.description
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!formData.master.startsWith('0x') || formData.master.length !== 42) {
      toast.error('Please enter a valid Ethereum address for master');
      return;
    }

    const maxParticipants = parseInt(formData.maxParticipants);
    if (maxParticipants <= 0 || maxParticipants > 1000) {
      toast.error('Max participants must be between 1 and 1000');
      return;
    }

    const amountPerParticipant = parseFloat(formData.amountPerParticipant);
    if (amountPerParticipant <= 0) {
      toast.error('Amount per participant must be greater than 0');
      return;
    }

    try {
      setIsSubmitting(true);

      writeContract({
        address: MENTORA_CONTRACT_ADDRESS,
        abi: MENTORA_ABI,
        functionName: 'createLobby',
        args: [
          formData.master as `0x${string}`,
          BigInt(maxParticipants),
          parseEther(formData.amountPerParticipant),
          formData.description,
        ],
      });
    } catch (err) {
      console.error('Error creating lobby:', err);
      toast.error('Failed to create lobby');
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const useMyAddress = () => {
    if (address) {
      setFormData((prev) => ({ ...prev, master: address }));
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Please connect your wallet to create a lobby</p>
      </div>
    );
  }

  if (chainId !== arbitrumSepolia.id) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Please switch to Arbitrum Sepolia network</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card p-6 rounded-lg border">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Create New Lobby</h2>
          <p className="text-muted-foreground mt-2">
            Create a new lobby where participants can join by paying the specified amount
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="master">Master Address</Label>
            <div className="flex gap-2">
              <input
                id="master"
                type="text"
                placeholder="0x..."
                value={formData.master}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('master', e.target.value)
                }
                className="flex-1 px-3 py-2 border border-input rounded-md bg-background font-mono"
              />
              <Button type="button" variant="outline" onClick={useMyAddress} className="shrink-0">
                Use My Address
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Maximum Participants</Label>
            <input
              id="maxParticipants"
              type="number"
              min="1"
              max="1000"
              placeholder="10"
              value={formData.maxParticipants}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange('maxParticipants', e.target.value)
              }
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            />
            <p className="text-sm text-muted-foreground">
              Maximum number of participants allowed to join this lobby
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amountPerParticipant">Amount per Participant (ETH)</Label>
            <input
              id="amountPerParticipant"
              type="number"
              step="0.00000000001"
              placeholder="0.001"
              value={formData.amountPerParticipant}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange('amountPerParticipant', e.target.value)
              }
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            />
            <p className="text-sm text-muted-foreground">
              Amount in ETH that each participant must pay to join
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Describe the purpose of this lobby..."
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleInputChange('description', e.target.value)
              }
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-md bg-background resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Explain what this lobby is for and what participants should expect
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isPending || isConfirming}
          >
            {isSubmitting || isPending || isConfirming ? 'Creating Lobby...' : 'Create Lobby'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function MyLobbiesAndCreate() {
  const refreshMyLobbiesRef = useRef<(() => void) | null>(null);

  const handleCreateSuccess = () => {
    if (refreshMyLobbiesRef.current) {
      refreshMyLobbiesRef.current();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3">
        <MyLobbiesList refreshRef={refreshMyLobbiesRef} />
      </div>
      <div className="lg:col-span-2">
        <CreateLobby onCreateSuccess={handleCreateSuccess} />
      </div>
    </div>
  );
}

function MyLobbiesList({
  refreshRef,
}: {
  refreshRef?: React.MutableRefObject<(() => void) | null>;
}) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Debug logging for contract parameters
  console.log('Contract call parameters:', {
    contractAddress: MENTORA_CONTRACT_ADDRESS,
    chainId,
    expectedChainId: arbitrumSepolia.id,
    address,
    isConnected,
  });

  // Fetch lobby IDs where user is master
  const {
    data: lobbyIds,
    isLoading: isLoadingIds,
    error: lobbyIdsError,
    refetch: refetchMyLobbies,
  } = useReadContract({
    address: MENTORA_CONTRACT_ADDRESS,
    abi: MENTORA_ABI,
    functionName: 'getMyLobbiesAsMaster',
    account: address, // Explicitly set the account for msg.sender
    chainId: arbitrumSepolia.id,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Expose the refetch function via ref
  useEffect(() => {
    if (refreshRef) {
      refreshRef.current = refetchMyLobbies;
    }
  }, [refetchMyLobbies, refreshRef]);

  // Debug logging
  console.log('MyLobbies Debug:', {
    address,
    isConnected,
    chainId,
    expectedChainId: arbitrumSepolia.id,
    contractAddress: MENTORA_CONTRACT_ADDRESS,
    lobbyIds,
    lobbyIdsType: typeof lobbyIds,
    lobbyIdsLength: lobbyIds?.length,
    isLoadingIds,
    lobbyIdsError: lobbyIdsError?.message || lobbyIdsError,
    rawLobbyIds: lobbyIds,
  });

  if (!isConnected) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">My Lobbies</h2>
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">Please connect your wallet to view your lobbies</p>
        </div>
      </div>
    );
  }

  if (chainId !== arbitrumSepolia.id) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">My Lobbies</h2>
        <div className="flex items-center justify-center h-32">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Please switch to Arbitrum Sepolia network</p>
            <p className="text-sm text-gray-500">
              Current: {chainId}, Expected: {arbitrumSepolia.id}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (lobbyIdsError) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">My Lobbies</h2>
        <div className="flex items-center justify-center h-32">
          <div className="text-center space-y-2">
            <p className="text-red-600">Error loading lobbies: {lobbyIdsError.message}</p>
            <p className="text-sm text-gray-500">Check console for details</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoadingIds) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">My Lobbies</h2>
        <div className="flex items-center justify-center h-32">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">Loading your lobbies...</p>
            <p className="text-sm text-gray-500">Loading lobby IDs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lobbyIds || lobbyIds.length === 0) {
    return (
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">My Lobbies</h2>
        <div className="flex flex-col items-center justify-center h-32 space-y-2">
          <p className="text-muted-foreground">You don't have any lobbies as master yet</p>
          <p className="text-sm text-muted-foreground">
            Use the form on the right to create a lobby
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg border">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">My Lobbies</h2>
          <p className="text-muted-foreground mt-1">Lobbies where you are the master</p>
        </div>
        <p className="text-sm text-muted-foreground">Connected as: {address}</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead>Amount per Participant</TableHead>
            <TableHead>Total Deposited</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lobbyIds.map((lobbyId) => (
            <LobbyRow key={lobbyId.toString()} lobbyId={lobbyId} address={address || ''} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function LobbiesPage() {
  return (
    <div>
      <Tabs defaultValue="my-lobbies" className="mt-10 w-[80%] mx-auto">
        <TabsList>
          <TabsTrigger value="my-lobbies">My Lobbies</TabsTrigger>
          <TabsTrigger value="joined-lobbies">Joined Lobbies</TabsTrigger>
        </TabsList>
        <TabsContent value="my-lobbies">
          <MyLobbiesAndCreate />
        </TabsContent>
        <TabsContent value="joined-lobbies">
          <JoinedLobbies />
        </TabsContent>
      </Tabs>
    </div>
  );
}
