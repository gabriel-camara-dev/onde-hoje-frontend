import { Link } from 'react-router-dom'
import styles from './styles.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <h2 className={styles.logo}>Template</h2>
      <nav>
        <ul className={styles.navList}>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/">Example</Link></li>
        </ul>
      </nav>
    </header>
  )
}