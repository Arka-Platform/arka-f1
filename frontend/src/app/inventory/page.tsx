'use client'

import { Suspense } from 'react'
import SellerInventory from '../../screens/SellerInventory/SellerInventory'

export default function InventoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading inventory…</div>}>
      <SellerInventory />
    </Suspense>
  )
}

