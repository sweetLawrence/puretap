// import { useEffect, useState } from 'react'
// import { Paper, Title, Text, Table, Stack, Skeleton, Alert, Badge } from '@mantine/core'
// import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
// import api from '../utils/api'
// import { getCustomer } from '../utils/auth'

// export default function Consumption() {
//   const customer = getCustomer()
//   const [readings, setReadings] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const meterRes = await api.get(`/meters/customer/${customer.id}`)
//         if (meterRes.data.data.length > 0) {
//           const meter = meterRes.data.data[0]
//           const readRes = await api.get(`/readings/meter/${meter.id}`)
//           setReadings(readRes.data.data)
//         }
//       } catch {
//         setError('Failed to load consumption data')
//       } finally {
//         setLoading(false)
//       }
//     }
//     load()
//   }, [])

//   const chartData = readings
//     .slice(0, 6)
//     .reverse()
//     .map(r => ({
//       date: r.reading_date,
//       units: Number(r.units_consumed)
//     }))

//   const totalConsumed = readings.reduce((sum, r) => sum + Number(r.units_consumed || 0), 0)
//   const avgConsumed = readings.length > 0
//     ? (totalConsumed / readings.length).toFixed(2)
//     : 0

//   return (
//     <div className="p-6">
//       <div className="mb-6">
//         <Title order={3} className="text-text-700 font-bold">Consumption History</Title>
//         <Text size="sm" className="text-text-300 mt-1">Your water usage over time</Text>
//       </div>

//       {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

//       {loading ? (
//         <Stack gap="md">
//           <Skeleton height={200} radius="lg" />
//           <Skeleton height={200} radius="lg" />
//         </Stack>
//       ) : (
//         <>
//           {/* Stats */}
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//               <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Total Readings</Text>
//               <Text size="xl" fw={700} className="text-text-700">{readings.length}</Text>
//             </Paper>
//             <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//               <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Avg per Month</Text>
//               <Text size="xl" fw={700} className="text-text-700">{avgConsumed} m³</Text>
//             </Paper>
//           </div>

//           {/* Chart */}
//           {chartData.length > 0 && (
//             <Paper shadow="xs" radius="lg" p="lg" className="bg-white mb-4">
//               <Text size="sm" fw={600} className="text-text-600 mb-4">
//                 Last {chartData.length} readings
//               </Text>
//               <ResponsiveContainer width="100%" height={200}>
//                 <BarChart data={chartData}>
//                   <XAxis dataKey="date" tick={{ fontSize: 11 }} />
//                   <YAxis tick={{ fontSize: 11 }} />
//                   <Tooltip formatter={(v: any) => `${v} m³`} />
//                   <Bar dataKey="units" fill="#71b4c8" radius={[4, 4, 0, 0]} />
//                 </BarChart>
//               </ResponsiveContainer>
//             </Paper>
//           )}

//           {/* Readings table */}
//           <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
//             {readings.length === 0 ? (
//               <div className="text-center py-12">
//                 <Text size="sm" className="text-text-300">No readings yet</Text>
//               </div>
//             ) : (
//               <div className="table-responsive">
//                 <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
//                   <Table.Thead>
//                     <Table.Tr className="bg-gray-50">
//                       <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
//                       <Table.Th className="text-text-400 text-xs uppercase">Previous</Table.Th>
//                       <Table.Th className="text-text-400 text-xs uppercase">Current</Table.Th>
//                       <Table.Th className="text-text-400 text-xs uppercase">Consumed</Table.Th>
//                       <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
//                     </Table.Tr>
//                   </Table.Thead>
//                   <Table.Tbody>
//                     {readings.map(r => (
//                       <Table.Tr key={r.id}>
//                         <Table.Td className="text-text-400 text-sm">{r.reading_date}</Table.Td>
//                         <Table.Td className="text-text-400 text-sm">{r.previous_reading} m³</Table.Td>
//                         <Table.Td className="text-text-600 font-semibold text-sm">{r.current_reading} m³</Table.Td>
//                         <Table.Td className="text-primary-600 font-semibold text-sm">{r.units_consumed} m³</Table.Td>
//                         <Table.Td>
//                           <Badge size="sm" radius="sm" variant="light"
//                             color={r.status === 'verified' ? 'green' : 'orange'}>
//                             {r.status.replace(/_/g, ' ')}
//                           </Badge>
//                         </Table.Td>
//                       </Table.Tr>
//                     ))}
//                   </Table.Tbody>
//                 </Table>
//               </div>
//             )}
//           </Paper>
//         </>
//       )}
//     </div>
//   )
// }











import { useEffect, useState } from 'react'
import { Paper, Title, Text, Badge, Stack, Skeleton, Alert } from '@mantine/core'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
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
      date: r.reading_date?.slice(5),  // show MM-DD only
      units: Number(r.units_consumed)
    }))

  const totalConsumed = readings.reduce((sum, r) => sum + Number(r.units_consumed || 0), 0)
  const avgConsumed = readings.length > 0
    ? (totalConsumed / readings.length).toFixed(1)
    : '0'
  const lastReading = readings[0]

  if (loading) return (
    <div className="p-4">
      <Skeleton height={24} width={180} mb="sm" radius="md" />
      <Stack gap="sm">
        <Skeleton height={160} radius="lg" />
        <Skeleton height={200} radius="lg" />
      </Stack>
    </div>
  )

  return (
    <div className="p-4 pb-8">
      <div className="mb-5">
        <Title order={3} className="text-text-700 font-bold text-lg">Consumption</Title>
        <Text size="xs" className="text-text-300 mt-0.5">Your water usage history</Text>
      </div>

      {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Paper shadow="xs" radius="lg" p="sm" className="bg-white">
          <Text size="xs" className="text-text-300 leading-tight mb-1">Readings</Text>
          <Text fw={700} className="text-text-700 text-base">{readings.length}</Text>
        </Paper>
        <Paper shadow="xs" radius="lg" p="sm" className="bg-white">
          <Text size="xs" className="text-text-300 leading-tight mb-1">Avg/month</Text>
          <Text fw={700} className="text-text-700 text-base">{avgConsumed} m³</Text>
        </Paper>
        <Paper shadow="xs" radius="lg" p="sm" className="bg-white">
          <Text size="xs" className="text-text-300 leading-tight mb-1">Last</Text>
          <Text fw={700} className="text-text-700 text-base">
            {lastReading ? `${lastReading.units_consumed} m³` : '—'}
          </Text>
        </Paper>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Paper shadow="xs" radius="lg" p="md" className="bg-white mb-4">
          <Text size="sm" fw={600} className="text-text-600 mb-3">
            Last {chartData.length} readings
          </Text>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v: any) => [`${v} m³`, 'Consumed']}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="units" fill="#71b4c8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {/* Readings list — cards instead of table on mobile */}
      {readings.length === 0 ? (
        <Paper shadow="xs" radius="lg" p="xl" className="bg-white text-center">
          <Text size="sm" className="text-text-300">No readings yet</Text>
        </Paper>
      ) : (
        <Stack gap="sm">
          {readings.map(r => (
            <Paper key={r.id} shadow="xs" radius="lg" p="md" className="bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <Text size="xs" className="text-text-300 mb-1">{r.reading_date}</Text>
                  <div className="flex items-center gap-3">
                    <div>
                      <Text size="xs" className="text-text-200">Previous</Text>
                      <Text size="sm" className="text-text-500">{r.previous_reading} m³</Text>
                    </div>
                    <div className="text-text-300">→</div>
                    <div>
                      <Text size="xs" className="text-text-200">Current</Text>
                      <Text size="sm" fw={600} className="text-text-600">{r.current_reading} m³</Text>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Text size="xs" className="text-text-200 mb-1">Consumed</Text>
                  <Text size="lg" fw={700} className="text-primary-600 leading-tight">
                    {r.units_consumed}
                    <span className="text-xs font-normal text-text-300 ml-1">m³</span>
                  </Text>
                  <Badge size="xs" radius="sm" variant="light" mt={4}
                    color={r.status === 'verified' ? 'green' : 'orange'}>
                    {r.status === 'verified' ? 'verified' : 'review'}
                  </Badge>
                </div>
              </div>
            </Paper>
          ))}
        </Stack>
      )}
    </div>
  )
}
