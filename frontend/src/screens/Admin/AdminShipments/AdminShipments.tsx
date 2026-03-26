import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useToast } from '../../../contexts/ToastContext'
import Button from '../../../components/shared/Button/Button'
import Input from '../../../components/shared/Input/Input'
import {
  ShipmentResponse,
  ShipmentStatus,
  manualLogisticsApi,
} from '../../../utils/api'
import styles from './AdminShipments.module.css'

const statusOptions: ShipmentStatus[] = [
  'pending_manual_dispatch',
  'dispatched',
  'in_transit',
  'delivered',
]

const defaultProviderChoices = ['india_post', 'rapido', 'porter', 'custom']

const AdminShipments: React.FC = () => {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const { success, error: showError } = useToast()

  const [shipments, setShipments] = useState<ShipmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('pending_manual_dispatch')
  const [createOrderId, setCreateOrderId] = useState('')
  const [createPreference, setCreatePreference] = useState<'cheapest' | 'fastest' | 'balanced' | 'manual'>('manual')
  const [createProvider, setCreateProvider] = useState('india_post')
  const [savingById, setSavingById] = useState<Record<string, boolean>>({})
  const [draftById, setDraftById] = useState<
    Record<string, { provider_name: string; tracking_id: string; status: ShipmentStatus }>
  >({})

  const isDraftDirty = useMemo(
    () => (shipment: ShipmentResponse) => {
      const draft = draftById[shipment.id]
      if (!draft) return false
      return (
        (draft.provider_name || '') !== (shipment.provider_name || '') ||
        (draft.tracking_id || '') !== (shipment.tracking_id || '') ||
        draft.status !== shipment.status
      )
    },
    [draftById]
  )

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace('/admin/login')
      return
    }
    if (!user?.isAdmin) {
      showError('Admin access denied')
      router.replace('/home')
      return
    }
    void loadShipments(activeStatusFilter)
  }, [activeStatusFilter, isAuthenticated, isLoading, router, showError, user?.isAdmin])

  const hydrateDrafts = (rows: ShipmentResponse[]) => {
    const map: Record<string, { provider_name: string; tracking_id: string; status: ShipmentStatus }> = {}
    rows.forEach((row) => {
      map[row.id] = {
        provider_name: row.provider_name ?? '',
        tracking_id: row.tracking_id ?? '',
        status: row.status,
      }
    })
    setDraftById(map)
  }

  const loadShipments = async (status?: string) => {
    try {
      setLoading(true)
      const rows = await manualLogisticsApi.getShipments({
        status: status && status !== 'all' ? (status as ShipmentStatus) : undefined,
        limit: 100,
        offset: 0,
      })
      setShipments(rows)
      hydrateDrafts(rows)
    } catch (err: any) {
      showError(err?.message || 'Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createOrderId.trim()) {
      showError('Order ID is required')
      return
    }
    if (createPreference === 'manual' && !createProvider.trim()) {
      showError('Provider is required for manual preference')
      return
    }
    try {
      await manualLogisticsApi.createShipment({
        order_id: createOrderId.trim(),
        preference: createPreference,
        provider_name: createPreference === 'manual' ? createProvider.trim() : undefined,
      })
      success('Shipment created')
      setCreateOrderId('')
      if (activeStatusFilter !== 'pending_manual_dispatch') {
        setActiveStatusFilter('pending_manual_dispatch')
      } else {
        await loadShipments(activeStatusFilter)
      }
    } catch (err: any) {
      showError(err?.message || 'Failed to create shipment')
    }
  }

  const updateDraft = (
    id: string,
    patch: Partial<{ provider_name: string; tracking_id: string; status: ShipmentStatus }>
  ) => {
    setDraftById((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      },
    }))
  }

  const handleSaveShipment = async (shipment: ShipmentResponse) => {
    const draft = draftById[shipment.id]
    if (!draft) return

    const payload: {
      id: string
      provider_name?: string
      tracking_id?: string
      status?: ShipmentStatus
    } = { id: shipment.id }

    if ((draft.provider_name || '') !== (shipment.provider_name || '')) {
      payload.provider_name = draft.provider_name.trim()
    }
    if ((draft.tracking_id || '') !== (shipment.tracking_id || '')) {
      payload.tracking_id = draft.tracking_id.trim()
    }
    if (draft.status !== shipment.status) {
      payload.status = draft.status
    }

    if (Object.keys(payload).length <= 1) {
      return
    }

    try {
      setSavingById((prev) => ({ ...prev, [shipment.id]: true }))
      const updated = await manualLogisticsApi.updateShipment(payload)
      setShipments((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
      setDraftById((prev) => ({
        ...prev,
        [shipment.id]: {
          provider_name: updated.provider_name ?? '',
          tracking_id: updated.tracking_id ?? '',
          status: updated.status,
        },
      }))
      success('Shipment updated')
    } catch (err: any) {
      showError(err?.message || 'Failed to update shipment')
    } finally {
      setSavingById((prev) => ({ ...prev, [shipment.id]: false }))
    }
  }

  return (
    <div className={styles.adminShipments}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Manual Logistics</h1>
          <p className={styles.subtitle}>Create and manage shipments manually</p>
        </div>
        <Button variant="secondary" onClick={() => router.push('/admin/ngos')}>
          Back to Admin
        </Button>
      </div>

      <form className={styles.createForm} onSubmit={handleCreateShipment}>
        <h2 className={styles.sectionTitle}>Create Shipment</h2>
        <div className={styles.row}>
          <Input
            label="Order ID"
            value={createOrderId}
            onChange={(e) => setCreateOrderId(e.target.value)}
            fullWidth
            required
          />
          <div className={styles.field}>
            <label className={styles.label}>Preference</label>
            <select
              className={styles.select}
              value={createPreference}
              onChange={(e) => setCreatePreference(e.target.value as any)}
            >
              <option value="cheapest">cheapest</option>
              <option value="fastest">fastest</option>
              <option value="balanced">balanced</option>
              <option value="manual">manual</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Provider</label>
            <input
              className={styles.input}
              value={createProvider}
              onChange={(e) => setCreateProvider(e.target.value)}
              list="provider-options"
              placeholder="india_post"
              disabled={createPreference !== 'manual'}
            />
            <datalist id="provider-options">
              {defaultProviderChoices.map((choice) => (
                <option key={choice} value={choice} />
              ))}
            </datalist>
          </div>
          <div className={styles.createAction}>
            <Button type="submit" variant="primary" fullWidth>
              Create
            </Button>
          </div>
        </div>
      </form>

      <div className={styles.filters}>
        <Button
          variant={activeStatusFilter === 'all' ? 'primary' : 'secondary'}
          onClick={() => setActiveStatusFilter('all')}
        >
          All
        </Button>
        {statusOptions.map((status) => (
          <Button
            key={status}
            variant={activeStatusFilter === status ? 'primary' : 'secondary'}
            onClick={() => setActiveStatusFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Loading shipments...</div>
      ) : shipments.length === 0 ? (
        <div className={styles.empty}>No shipments found for this filter.</div>
      ) : (
        <div className={styles.list}>
          {shipments.map((shipment) => {
            const draft = draftById[shipment.id]
            const dirty = isDraftDirty(shipment)
            const saving = Boolean(savingById[shipment.id])
            return (
              <div className={styles.card} key={shipment.id}>
                <div className={styles.cardTop}>
                  <div>
                    <div className={styles.idLabel}>Shipment ID</div>
                    <div className={styles.idValue}>{shipment.id}</div>
                  </div>
                  <span className={styles.badge}>{shipment.status}</span>
                </div>
                <div className={styles.meta}>
                  <span>Order: {shipment.order_id}</span>
                  <span>Preference: {shipment.preference}</span>
                </div>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Provider</label>
                    <input
                      className={styles.input}
                      value={draft?.provider_name ?? ''}
                      onChange={(e) => updateDraft(shipment.id, { provider_name: e.target.value })}
                      list="provider-options"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Tracking ID</label>
                    <input
                      className={styles.input}
                      value={draft?.tracking_id ?? ''}
                      onChange={(e) => updateDraft(shipment.id, { tracking_id: e.target.value })}
                      placeholder="INDP123456789"
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Status</label>
                    <select
                      className={styles.select}
                      value={draft?.status ?? shipment.status}
                      onChange={(e) => updateDraft(shipment.id, { status: e.target.value as ShipmentStatus })}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.cardAction}>
                    <Button
                      variant="primary"
                      onClick={() => void handleSaveShipment(shipment)}
                      disabled={!dirty || saving}
                      fullWidth
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminShipments
