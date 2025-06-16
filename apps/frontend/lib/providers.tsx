'use client';

import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { mainnet, polygon, optimism, arbitrum, base, sepolia } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'Mentora',
  projectId: 'c57a43280e06a97432b13d83e9794586',
  chains: [mainnet, polygon, optimism, arbitrum, base, sepolia],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
