import React from 'react'
import styles from './SelectableTag.module.css'

interface SelectableTagProps {
  label: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
}

const SelectableTag: React.FC<SelectableTagProps> = ({
  label,
  selected,
  onClick,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      className={`${styles.tag} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${selected ? 'Selected' : 'Select'} ${label}`}
    >
      {label}
      {selected && (
        <svg
          className={styles.checkIcon}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      )}
    </button>
  )
}

export default SelectableTag


