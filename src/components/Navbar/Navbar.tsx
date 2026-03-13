import Link from 'next/link';
import styles from './Navbar.module.css';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navContainer}`}>
        <Link href="/" className={styles.logo}>
          Jason<span className="text-gradient">.</span>
        </Link>
        <ul className={styles.navLinks}>
          <li><Link href="/" className={styles.navItem}>首頁</Link></li>
          <li><Link href="/projects" className={styles.navItem}>作品</Link></li>
          <li><Link href="/blog" className={styles.navItem}>部落格</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
