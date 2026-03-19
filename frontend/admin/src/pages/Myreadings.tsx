import { useEffect, useState } from 'react'
import { Paper, Title, Text, Badge, Table, Stack, Alert, Skeleton } from '@mantine/core'
import api from '../utils/api'
import { getUser } from '../utils/auth'

interface Reading {
  id: number
  meter_id: number
  previous_reading: number
  current_reading: number
  units_consumed: number
  manual_value: number
  ocr_value: number
  status: string
  reading_date: string
  created_at: string
  meters: { serial_no: string; installation_address: string }
}

const STATUS_COLORS: Record<string, string> = {
  verified: 'green', flagged_ocr_mismatch: 'orange',
  flagged_anomaly: 'red', flagged_both: 'red', pending_review: 'yellow'
}

export default function MyReadings() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [filtered, setFiltered] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const user = getUser()

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/readings')
        // filter to only show this user's readings
        const mine = res.data.data.filter((r: any) => r.submitted_by === user?.id)
        setReadings(mine)
        setFiltered(mine)
      } catch {
        setError('Failed to load readings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let data = [...readings]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(r => r.meters?.serial_no?.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') data = data.filter(r => r.status === statusFilter)
    setFiltered(data)
  }, [search, statusFilter, readings])

  const todayCount = readings.filter(r =>
    r.reading_date === new Date().toISOString().split('T')[0]
  ).length

  return (
    <div className="p-4">
      <div className="mb-6">
        <Title order={3} className="text-text-700 font-bold">My Readings</Title>
        <Text size="sm" className="text-text-300 mt-1">Readings you have submitted</Text>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Today</Text>
          <Text size="xl" fw={700} className="text-text-700">{todayCount}</Text>
        </Paper>
        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Total</Text>
          <Text size="xl" fw={700} className="text-text-700">{readings.length}</Text>
        </Paper>
      </div>

      {/* Filters */}
      <Paper shadow="xs" radius="lg" p="md" className="bg-white mb-4">
        <Stack gap="sm">
          <input type="text" placeholder="Search by meter serial..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          <div className="flex gap-2 flex-wrap">
            {['all', 'verified', 'flagged_ocr_mismatch', 'flagged_anomaly', 'pending_review'].map(s => (
              <button key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-text-400 hover:bg-gray-200'
                }`}>
                {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </Stack>
      </Paper>

      <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
        {loading ? (
          <Stack p="md" gap="sm">
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={60} radius="md" />)}
          </Stack>
        ) : error ? (
          <Alert color="red" m="md" radius="md" variant="light">{error}</Alert>
        ) : filtered.length === 0 ? (
          <div className="text-center text-text-300 py-10">
            <Text size="sm">No readings found</Text>
          </div>
        ) : (
          <div className="table-responsive">
            <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr className="bg-gray-50">
                  <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Meter</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Previous</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Current</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Units</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map(r => (
                  <Table.Tr key={r.id}>
                    <Table.Td className="text-text-400 text-sm">{r.reading_date}</Table.Td>
                    <Table.Td className="text-text-600 font-semibold text-sm">{r.meters?.serial_no}</Table.Td>
                    <Table.Td className="text-text-400 text-sm">{r.previous_reading}</Table.Td>
                    <Table.Td className="text-text-600 text-sm">{r.current_reading}</Table.Td>
                    <Table.Td className="text-primary-600 font-semibold text-sm">{r.units_consumed}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" radius="sm" variant="light"
                        color={STATUS_COLORS[r.status] || 'gray'}>
                        {r.status.replace(/_/g, ' ')}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Paper>
    </div>
  )
}
