import styles from './styles.module.css'
import { LoginForm } from './LoginForm'

export function Login() {
  return (
    <div className={styles.page}>
      <section className={styles.wrapper}>
        <h1 className={styles.title}>Login</h1>
        <LoginForm />
      </section>
    </div>
  )
}
