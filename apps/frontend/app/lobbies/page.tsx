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
import { useState, useEffect } from 'react';
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

function MyLobbies() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Fetch lobby IDs where user is master
  const { data: lobbyIds, isLoading: isLoadingIds } = useReadContract({
    address: MENTORA_CONTRACT_ADDRESS,
    abi: MENTORA_ABI,
    functionName: 'getMyLobbiesAsMaster',
    chainId: arbitrumSepolia.id,
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Fetch detailed info for each lobby
  const lobbyInfoQueries = (lobbyIds || []).map((lobbyId: bigint) =>
    useReadContract({
      address: MENTORA_CONTRACT_ADDRESS,
      abi: MENTORA_ABI,
      functionName: 'getLobbyInfo',
      args: [lobbyId],
      chainId: arbitrumSepolia.id,
      query: {
        enabled: isConnected && !!address && !!lobbyIds,
      },
    }),
  );

  const lobbies = lobbyInfoQueries
    .map((query) => query.data)
    .filter((data): data is NonNullable<typeof data> => data !== undefined)
    .map((data) => ({
      id: data[0],
      creator: data[1],
      master: data[2],
      description: data[3],
      amountPerParticipant: data[4],
      maxParticipants: data[5],
      currentParticipants: data[6],
      state: BigInt(data[7]),
      totalDeposited: data[8],
    }));

  const isLoading = isLoadingIds || lobbyInfoQueries.some((query) => query.isLoading);

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

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Please connect your wallet to view your lobbies</p>
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Loading your lobbies...</p>
      </div>
    );
  }

  if (!lobbies.length) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">You don't have any lobbies as master yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">My Lobbies</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead>Amount per Participant</TableHead>
            <TableHead>Total Deposited</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lobbies.map((lobby) => (
            <TableRow key={lobby.id.toString()}>
              <TableCell className="font-medium">#{lobby.id.toString()}</TableCell>
              <TableCell className="max-w-xs truncate">{lobby.description}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function JoinedLobbies() {
  return <div>Joined Lobbies</div>;
}

function CreateLobby() {
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
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error.message}`, { id: 'create-lobby' });
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
            <input
              id="master"
              type="text"
              placeholder="0x..."
              value={formData.master}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange('master', e.target.value)
              }
              className="w-full px-3 py-2 border border-input rounded-md bg-background font-mono"
            />
            <p className="text-sm text-muted-foreground">
              The address that will receive payments when the lobby is completed
            </p>
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
              step="0.001"
              min="0.001"
              placeholder="0.01"
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

export default function LobbiesPage() {
  return (
    <div>
      <Tabs defaultValue="my-lobbies" className="mt-10 w-[80%] mx-auto">
        <TabsList>
          <TabsTrigger value="my-lobbies">My Lobbies</TabsTrigger>
          <TabsTrigger value="joined-lobbies">Joined Lobbies</TabsTrigger>
          <TabsTrigger value="create-lobby">Create Lobby</TabsTrigger>
        </TabsList>
        <TabsContent value="my-lobbies">
          <MyLobbies />
        </TabsContent>
        <TabsContent value="joined-lobbies">
          <JoinedLobbies />
        </TabsContent>
        <TabsContent value="create-lobby">
          <CreateLobby />
        </TabsContent>
      </Tabs>
    </div>
  );
}
