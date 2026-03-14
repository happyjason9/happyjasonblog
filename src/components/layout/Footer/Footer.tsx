import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerContainer}`}>
        <p>&copy; {new Date().getFullYear()} Jason. All rights reserved.</p>
        <div className={styles.socials}>
          <a href="https://github.com/happyjason9" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://www.linkedin.com/in/%E6%89%BF%E5%B1%95-%E6%9D%8E-13066638a/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
