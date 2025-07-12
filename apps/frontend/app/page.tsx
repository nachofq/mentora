'use client';

import { useRouter } from 'next/navigation';
import { useAccount, useReadContract } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CONTRACT_ADDRESSES, MENTORS_ABI, SESSIONS_ABI } from '@/lib/contracts';

export default function HomePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  // Read mentor data if connected
  const { data: mentorData } = useReadContract({
    address: CONTRACT_ADDRESSES.MENTORS,
    abi: MENTORS_ABI,
    functionName: 'getMentorData',
    args: [address!],
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

  // Check if user is owner
  const { data: mentorsOwner } = useReadContract({
    address: CONTRACT_ADDRESSES.MENTORS,
    abi: MENTORS_ABI,
    functionName: 'owner',
    chainId: arbitrumSepolia.id,
  });

  const isOwner = address && mentorsOwner && address.toLowerCase() === mentorsOwner.toLowerCase();
  const isRegisteredMentor = mentorData && mentorData[0]; // registered boolean

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to Mentora</h1>
          <p className="text-xl text-gray-600 mb-2">
            The decentralized mentorship platform powered by blockchain technology
          </p>
          <p className="text-gray-500 mb-8">
            Connect mentors and participants through token-based sessions with LiveKit integration
          </p>

          {/* Quick Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {sessionCounter ? sessionCounter.toString() : '0'}
              </p>
              <p className="text-sm text-gray-600">Sessions Created</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">ERC20</p>
              <p className="text-sm text-gray-600">Token Payments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">Live</p>
              <p className="text-sm text-gray-600">Video Sessions</p>
            </div>
          </div>
        </div>

        {/* User Status */}
        {isConnected && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Status</CardTitle>
              <CardDescription>Overview of your account on Mentora</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <Badge variant={isRegisteredMentor ? 'default' : 'secondary'}>
                    {isRegisteredMentor ? 'Registered Mentor' : 'Not a Mentor'}
                  </Badge>
                  {isOwner && (
                    <Badge variant="outline" className="ml-2">
                      Contract Owner
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">👨‍🏫 Mentors</CardTitle>
              <CardDescription>Register as a mentor and manage your profile</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Register as a mentor</li>
                <li>• Toggle active/inactive status</li>
                <li>• Track session statistics</li>
                <li>• View your mentor score</li>
              </ul>
              <Button onClick={() => router.push('/mentors')} className="w-full">
                {isRegisteredMentor ? 'Manage Profile' : 'Become a Mentor'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🎯 Sessions</CardTitle>
              <CardDescription>Create and manage mentoring sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Create public/private sessions</li>
                <li>• ERC20 token payments</li>
                <li>• Join existing sessions</li>
                <li>• LiveKit video integration</li>
              </ul>
              <Button onClick={() => router.push('/sessions')} className="w-full">
                Go to Sessions
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">🎥 Connection</CardTitle>
              <CardDescription>Test LiveKit video functionality</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• Test video connection</li>
                <li>• Join live sessions</li>
                <li>• Screen sharing</li>
                <li>• Real-time communication</li>
              </ul>
              <Button
                onClick={() => router.push('/connection')}
                className="w-full"
                variant="outline"
              >
                Test Connection
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How Mentora Works</CardTitle>
            <CardDescription>
              A simple 3-step process to get started with decentralized mentorship
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h3 className="font-semibold mb-2">Register</h3>
                <p className="text-sm text-gray-600">
                  Connect your wallet and register as a mentor or participant
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-green-600">2</span>
                </div>
                <h3 className="font-semibold mb-2">Create/Join</h3>
                <p className="text-sm text-gray-600">
                  Create mentoring sessions or join existing ones with token payments
                </p>
              </div>
              <div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-purple-600">3</span>
                </div>
                <h3 className="font-semibold mb-2">Connect</h3>
                <p className="text-sm text-gray-600">
                  Join live video sessions and start your mentoring journey
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Section */}
        {isOwner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">⚙️ Admin Access</CardTitle>
              <CardDescription>Manage contracts and administrative functions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    You have owner access to the Mentora contracts
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Manage mentor blacklist</li>
                    <li>• Pause/unpause contracts</li>
                    <li>• Withdraw platform fees</li>
                    <li>• View contract statistics</li>
                  </ul>
                </div>
                <Button onClick={() => router.push('/owner')} variant="outline">
                  Admin Panel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        {!isConnected && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Get Started</CardTitle>
              <CardDescription>Connect your wallet to start using Mentora</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 mb-4">
                Connect your wallet to access all features of the Mentora platform
              </p>
              <p className="text-center text-sm text-gray-500">
                Make sure you're connected to Arbitrum Sepolia testnet
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
