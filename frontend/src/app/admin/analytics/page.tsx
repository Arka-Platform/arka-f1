'use client'

import { AdminRoute } from '../../../components/RouteGuards/RouteGuards'
import Analytics from '../../../screens/Analytics/Analytics'

export default function AdminAnalyticsPage() {
  return (
    <AdminRoute>
      <Analytics />
    </AdminRoute>
  )
}
