import Link from 'next/link';
import { WalletConnector } from '@/lib/WalletConnector';
import styles from '../styles/Navbar.module.css';

export function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div className={styles.logo}>
          <Link href="/">
            <h2>MENTORA</h2>
          </Link>
        </div>
        <div className={styles.navLinks}>
          <Link href="/connection" className={styles.navLink}>
            Connection
          </Link>
          <Link href="/lobbies" className={styles.navLink}>
            Lobbies
          </Link>
        </div>
        <div className={styles.walletSection}>
          <WalletConnector />
        </div>
      </div>
    </nav>
  );
}
