'use client'

import React, { useEffect, useState } from 'react'
import Button from '../../shared/Button/Button'
import Input from '../../shared/Input/Input'
import {
  CIRCLE_DESCRIPTION_MAX_LENGTH,
  CIRCLE_HOST_DISPLAY_MAX_LENGTH,
  CIRCLE_NAME_MAX_LENGTH,
} from '../../../utils/communityCircleConstants'
import styles from './CreateCircleModal.module.css'

export type CreateCircleFormPayload = {
  name: string
  description: string
  hostDisplayName: string
}

type Props = {
  open: boolean
  submitting: boolean
  formError: string | null
  onClose: () => void
  onSubmit: (payload: CreateCircleFormPayload) => Promise<void>
}

const CreateCircleModal: React.FC<Props> = ({ open, submitting, formError, onClose, onSubmit }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [hostDisplayName, setHostDisplayName] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
    setHostDisplayName('')
  }, [open])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    await onSubmit({
      name: trimmed,
      description: description.trim(),
      hostDisplayName: hostDisplayName.trim(),
    })
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={submitting ? undefined : onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-circle-title"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3 id="create-circle-title" className={styles.modalTitle}>
          Create a reading circle
        </h3>
        <p className={styles.modalHint}>You will be the host. Others can discover and join your circle.</p>
        <form onSubmit={handleSubmit} className={styles.createForm}>
          <Input
            label="Circle name"
            name="circleName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekend fiction swap"
            fullWidth
            required
            autoComplete="off"
            maxLength={CIRCLE_NAME_MAX_LENGTH}
          />
          <div className={styles.field}>
            <label className={styles.textareaLabel} htmlFor="circle-description">
              Description
            </label>
            <textarea
              id="circle-description"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this circle about?"
              rows={4}
              maxLength={CIRCLE_DESCRIPTION_MAX_LENGTH}
            />
          </div>
          <Input
            label="Host name (optional)"
            name="hostDisplay"
            value={hostDisplayName}
            onChange={(e) => setHostDisplayName(e.target.value)}
            placeholder="Shown as “Hosted by …”"
            fullWidth
            autoComplete="off"
            maxLength={CIRCLE_HOST_DISPLAY_MAX_LENGTH}
          />
          <p className={styles.fieldHint}>If empty, we use your profile name.</p>
          {formError ? (
            <p className={styles.formError} role="alert">
              {formError}
            </p>
          ) : null}
          <div className={styles.modalActions}>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create circle
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCircleModal
