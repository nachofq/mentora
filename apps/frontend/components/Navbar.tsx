import { WalletConnector } from '@/lib/WalletConnector';
import styles from '../styles/Navbar.module.css';

export function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <div className={styles.logo}>
          <h2>MENTORA</h2>
        </div>
        <div className={styles.walletSection}>
          <WalletConnector />
        </div>
      </div>
    </nav>
  );
}
