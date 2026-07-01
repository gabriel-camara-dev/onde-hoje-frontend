import React from 'react'
import styles from './styles.module.css'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export default function Button(props: ButtonProps) {
  return (
    <button {...props} className={`${styles.button} ${props.className}`}>
      {props.children}
    </button>
  )
}
