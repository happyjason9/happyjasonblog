"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "./Navbar.module.css";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className={`${styles.navbar} ${scrolled ? styles.scrolled : ""}`}>
      <div className={`container ${styles.navContainer}`}>
        <Link href="/" className={styles.logo} onClick={closeMenu}>
          Jason<span className="text-gradient">.</span>
        </Link>

        <button
          className={`${styles.hamburger} ${menuOpen ? styles.open : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="切換選單"
        >
          <span />
          <span />
          <span />
        </button>

        <ul className={`${styles.navLinks} ${menuOpen ? styles.menuOpen : ""}`}>
          <li><Link href="/" className={styles.navItem} onClick={closeMenu}>首頁</Link></li>
          <li><Link href="/projects" className={styles.navItem} onClick={closeMenu}>作品</Link></li>
          <li><Link href="/blog" className={styles.navItem} onClick={closeMenu}>部落格</Link></li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
