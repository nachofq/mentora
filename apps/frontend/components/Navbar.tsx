'use client';
import Link from 'next/link';
import { WalletConnector } from '@/lib/WalletConnector';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES, MENTORS_ABI } from '@/lib/contracts';
import { arbitrumSepolia } from 'wagmi/chains';
import styles from '../styles/Navbar.module.css';

export function Navbar() {
  const { address } = useAccount();

  // Check if user is owner of any contract (for owner section visibility)
  const { data: mentorsOwner } = useReadContract({
    address: CONTRACT_ADDRESSES.MENTORS,
    abi: MENTORS_ABI,
    functionName: 'owner',
    chainId: arbitrumSepolia.id,
    query: {
      enabled: !!address,
    },
  });

  const isOwner = address && mentorsOwner && address.toLowerCase() === mentorsOwner.toLowerCase();

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div className={styles.logo}>
          <Link href="/">
            <h2>MENTORA</h2>
          </Link>
        </div>
        <div className={styles.navLinks}>
          <Link href="/mentors" className={styles.navLink}>
            Mentors
          </Link>
          <Link href="/sessions" className={styles.navLink}>
            Sessions
          </Link>
          {isOwner && (
            <Link href="/owner" className={styles.navLink}>
              Owner
            </Link>
          )}
        </div>
        <div className={styles.walletSection}>
          <WalletConnector />
        </div>
      </div>
    </nav>
  );
}
