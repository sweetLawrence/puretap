import { useEffect, useState } from 'react'
import { Paper, Text, Title, SimpleGrid, Skeleton, Alert } from '@mantine/core'
import api from '../utils/api'

interface Summary {
  total_customers: number
  total_meters: number
  revenue_this_month: number
  unpaid_invoices: number
  overdue_invoices: number
  flagged_readings: number
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color: string
}

const StatCard = ({ label, value, sub, color }: StatCardProps) => (
  <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      <div className="w-4 h-4 rounded-sm bg-white opacity-80" />
    </div>
    <Text size="xs" className="text-text-300 uppercase tracking-wide font-semibold mb-1">
      {label}
    </Text>
    <Title order={3} className="text-text-700 font-bold">
      {value}
    </Title>
    {sub && (
      <Text size="xs" className="text-text-200 mt-1">
        {sub}
      </Text>
    )}
  </Paper>
)

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/reports/summary')
        setSummary(res.data.data)
      } catch {
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton height={28} width={200} mb="md" radius="md" />
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} height={120} radius="lg" />
          ))}
        </SimpleGrid>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert color="red" radius="md" variant="light">
          {error}
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title order={3} className="text-text-700 font-bold">
          Dashboard
        </Title>
        <Text size="sm" className="text-text-300 mt-1">
          Overview of PureTap operations
        </Text>
      </div>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <StatCard
          label="Total Customers"
          value={summary?.total_customers ?? 0}
          sub="Active accounts"
          color="bg-primary-500"
        />
        <StatCard
          label="Total Meters"
          value={summary?.total_meters ?? 0}
          sub="Active meters"
          color="bg-primary-400"
        />
        <StatCard
          label="Revenue This Month"
          value={`KES ${(summary?.revenue_this_month ?? 0).toLocaleString()}`}
          sub="Completed payments"
          color="bg-secondary-300"
        />
        <StatCard
          label="Unpaid Invoices"
          value={summary?.unpaid_invoices ?? 0}
          sub="Awaiting payment"
          color="bg-accent-500"
        />
        <StatCard
          label="Overdue Invoices"
          value={summary?.overdue_invoices ?? 0}
          sub="Past due date"
          color="bg-red-400"
        />
        <StatCard
          label="Flagged Readings"
          value={summary?.flagged_readings ?? 0}
          sub="Requires review"
          color="bg-accent-600"
        />
      </SimpleGrid>
    </div>
  )
}