import { useEffect, useState } from 'react'
import { Paper, Title, Text, Table, Stack, Skeleton, Alert, Badge } from '@mantine/core'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'
import { getCustomer } from '../utils/auth'

export default function Consumption() {
  const customer = getCustomer()
  const [readings, setReadings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const meterRes = await api.get(`/meters/customer/${customer.id}`)
        if (meterRes.data.data.length > 0) {
          const meter = meterRes.data.data[0]
          const readRes = await api.get(`/readings/meter/${meter.id}`)
          setReadings(readRes.data.data)
        }
      } catch {
        setError('Failed to load consumption data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const chartData = readings
    .slice(0, 6)
    .reverse()
    .map(r => ({
      date: r.reading_date,
      units: Number(r.units_consumed)
    }))

  const totalConsumed = readings.reduce((sum, r) => sum + Number(r.units_consumed || 0), 0)
  const avgConsumed = readings.length > 0
    ? (totalConsumed / readings.length).toFixed(2)
    : 0

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title order={3} className="text-text-700 font-bold">Consumption History</Title>
        <Text size="sm" className="text-text-300 mt-1">Your water usage over time</Text>
      </div>

      {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

      {loading ? (
        <Stack gap="md">
          <Skeleton height={200} radius="lg" />
          <Skeleton height={200} radius="lg" />
        </Stack>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
              <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Total Readings</Text>
              <Text size="xl" fw={700} className="text-text-700">{readings.length}</Text>
            </Paper>
            <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
              <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Avg per Month</Text>
              <Text size="xl" fw={700} className="text-text-700">{avgConsumed} m³</Text>
            </Paper>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <Paper shadow="xs" radius="lg" p="lg" className="bg-white mb-4">
              <Text size="sm" fw={600} className="text-text-600 mb-4">
                Last {chartData.length} readings
              </Text>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `${v} m³`} />
                  <Bar dataKey="units" fill="#71b4c8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          )}

          {/* Readings table */}
          <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
            {readings.length === 0 ? (
              <div className="text-center py-12">
                <Text size="sm" className="text-text-300">No readings yet</Text>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
                  <Table.Thead>
                    <Table.Tr className="bg-gray-50">
                      <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
                      <Table.Th className="text-text-400 text-xs uppercase">Previous</Table.Th>
                      <Table.Th className="text-text-400 text-xs uppercase">Current</Table.Th>
                      <Table.Th className="text-text-400 text-xs uppercase">Consumed</Table.Th>
                      <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {readings.map(r => (
                      <Table.Tr key={r.id}>
                        <Table.Td className="text-text-400 text-sm">{r.reading_date}</Table.Td>
                        <Table.Td className="text-text-400 text-sm">{r.previous_reading} m³</Table.Td>
                        <Table.Td className="text-text-600 font-semibold text-sm">{r.current_reading} m³</Table.Td>
                        <Table.Td className="text-primary-600 font-semibold text-sm">{r.units_consumed} m³</Table.Td>
                        <Table.Td>
                          <Badge size="sm" radius="sm" variant="light"
                            color={r.status === 'verified' ? 'green' : 'orange'}>
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
        </>
      )}
    </div>
  )
}