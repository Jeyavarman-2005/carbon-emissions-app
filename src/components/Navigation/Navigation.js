import { Link } from 'react-router-dom';
import styles from './Navigation.module.css';

const Navigation = () => {
  return (
    <nav className={styles.nav}>
      <Link to="/input" className={styles.navLink}>
        Input Data
      </Link>
      <Link to="/dashboard" className={styles.navLink}>
        View Dashboard
      </Link>
    </nav>
  );
};

export default Navigation;