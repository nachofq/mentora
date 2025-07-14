import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import '@rainbow-me/rainbowkit/styles.css';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import { Providers } from '@/lib/providers';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: {
    default: 'Mentora | Group-based mentorship and knowledge monetization',
    template: '%s',
  },
  description: 'Mentora is a platform for group-based mentorship and knowledge monetization.',

  openGraph: {
    url: 'https://meet.livekit.io',
    images: [
      {
        url: 'https://meet.livekit.io/images/livekit-meet-open-graph.png',
        width: 2000,
        height: 1000,
        type: 'image/png',
      },
    ],
    siteName: 'LiveKit Meet',
  },
  icons: {
    icon: {
      rel: 'icon',
      url: '/favicon.png',
    },
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/images/livekit-apple-touch.png',
        sizes: '180x180',
      },
      { rel: 'mask-icon', url: '/images/livekit-safari-pinned-tab.svg', color: '#070707' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#070707',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body data-lk-theme="default">
        <Providers>
          <Navbar />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
