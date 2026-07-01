import styles from './styles.module.css'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
  error?: string
}

export default function Input({ error, className, ...props }: InputProps) {
  return (
    <div className={styles.wrapper}>
      <input
        {...props}
        className={`${styles.input} ${className} ${error ? styles.inputError : ''}`}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
