// import { useEffect, useState } from 'react'
// import { Paper, Title, Text, Badge, Skeleton, Alert } from '@mantine/core'
// import api from '../utils/api'
// import { getCustomer } from '../utils/auth'

// export default function Dashboard() {
//   const customer = getCustomer()
//   const [invoices, setInvoices] = useState<any[]>([])
//   const [payments, setPayments] = useState<any[]>([])
//   const [readings, setReadings] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const [invRes, payRes, meterRes] = await Promise.all([
//           api.get(`/invoices/customer/${customer.id}`),
//           api.get(`/payments/customer/${customer.id}`),
//           api.get(`/meters/customer/${customer.id}`)
//         ])
//         setInvoices(invRes.data.data)
//         setPayments(payRes.data.data)

//         // get readings for first meter
//         if (meterRes.data.data.length > 0) {
//           const meter = meterRes.data.data[0]
//           const readRes = await api.get(`/readings/meter/${meter.id}`)
//           setReadings(readRes.data.data)
//         }
//       } catch {
//         setError('Failed to load account data')
//       } finally {
//         setLoading(false)
//       }
//     }
//     load()
//   }, [])

//   const unpaidInvoices = invoices.filter(i => ['unpaid', 'overdue'].includes(i.status))
//   const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0)
//   const lastPayment = payments[0]
//   const lastReading = readings[0]

//   if (loading) return (
//     <div className="p-6">
//       <Skeleton height={28} width={200} mb="md" radius="md" />
//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//         {[...Array(4)].map((_, i) => <Skeleton key={i} height={100} radius="lg" />)}
//       </div>
//     </div>
//   )

//   return (
//     <div className="p-6">
//       <div className="mb-6">
//         <Title order={3} className="text-text-700 font-bold">
//           Welcome, {customer?.full_name?.split(' ')[0]}
//         </Title>
//         <Text size="sm" className="text-text-300 mt-1">Account {customer?.account_no}</Text>
//       </div>

//       {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

//       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//           <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Outstanding Balance</Text>
//           <Text size="xl" fw={700} className={totalOutstanding > 0 ? 'text-red-500' : 'text-secondary-400'}>
//             KES {totalOutstanding.toLocaleString()}
//           </Text>
//           <Text size="xs" className="text-text-300 mt-1">
//             {unpaidInvoices.length} unpaid invoice{unpaidInvoices.length !== 1 ? 's' : ''}
//           </Text>
//         </Paper>

//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//           <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Last Payment</Text>
//           {lastPayment ? (
//             <>
//               <Text size="xl" fw={700} className="text-text-700">
//                 KES {Number(lastPayment.amount).toLocaleString()}
//               </Text>
//               <Text size="xs" className="text-text-300 mt-1">
//                 {new Date(lastPayment.payment_date).toLocaleDateString()}
//               </Text>
//             </>
//           ) : (
//             <Text size="sm" className="text-text-300 mt-2">No payments yet</Text>
//           )}
//         </Paper>

//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//           <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Last Reading</Text>
//           {lastReading ? (
//             <>
//               <Text size="xl" fw={700} className="text-text-700">
//                 {lastReading.current_reading} m³
//               </Text>
//               <Text size="xs" className="text-text-300 mt-1">{lastReading.reading_date}</Text>
//             </>
//           ) : (
//             <Text size="sm" className="text-text-300 mt-2">No readings yet</Text>
//           )}
//         </Paper>

//         <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
//           <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Account Type</Text>
//           <Text size="xl" fw={700} className="text-text-700 capitalize">{customer?.customer_type}</Text>
//           <Badge size="sm" radius="sm" variant="light" color="green" mt="xs">Active</Badge>
//         </Paper>
//       </div>

//       {/* Unpaid invoices quick list */}
//       {unpaidInvoices.length > 0 && (
//         <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
//           <div className="p-4 border-b border-gray-100">
//             <Text size="sm" fw={600} className="text-text-600">Unpaid Invoices</Text>
//           </div>
//           {unpaidInvoices.slice(0, 3).map(inv => (
//             <div key={inv.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
//               <div>
//                 <Text size="sm" fw={600} className="text-text-600">{inv.invoice_no}</Text>
//                 <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
//               </div>
//               <div className="text-right">
//                 <Text size="sm" fw={700} className="text-primary-600">
//                   KES {Number(inv.total_amount).toLocaleString()}
//                 </Text>
//                 <Badge size="xs" radius="sm" variant="light"
//                   color={inv.status === 'overdue' ? 'red' : 'yellow'}>
//                   {inv.status}
//                 </Badge>
//               </div>
//             </div>
//           ))}
//         </Paper>
//       )}
//     </div>
//   )
// }







import { useEffect, useState } from 'react'
import { Paper, Title, Text, Badge, Skeleton, Alert } from '@mantine/core'
import api from '../utils/api'
import { getCustomer } from '../utils/auth'

export default function Dashboard() {
  const customer = getCustomer()
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [readings, setReadings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, payRes, meterRes] = await Promise.all([
          api.get(`/invoices/customer/${customer.id}`),
          api.get(`/payments/customer/${customer.id}`),
          api.get(`/meters/customer/${customer.id}`)
        ])
        setInvoices(invRes.data.data)
        setPayments(payRes.data.data)
        if (meterRes.data.data.length > 0) {
          const meter = meterRes.data.data[0]
          const readRes = await api.get(`/readings/meter/${meter.id}`)
          setReadings(readRes.data.data)
        }
      } catch {
        setError('Failed to load account data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const unpaidInvoices = invoices.filter(i => ['unpaid', 'overdue'].includes(i.status))
  const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0)
  const lastPayment = payments[0]
  const lastReading = readings[0]

  if (loading) return (
    <div className="p-4">
      <Skeleton height={24} width={160} mb="sm" radius="md" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} height={90} radius="lg" />)}
      </div>
    </div>
  )

  return (
    <div className="p-4 pb-8">
      {/* greeting */}
      <div className="mb-5">
        <Title order={3} className="text-text-700 font-bold text-lg">
          Hi, {customer?.full_name?.split(' ')[0]}
        </Title>
        <Text size="xs" className="text-text-300 mt-0.5">Account {customer?.account_no}</Text>
      </div>

      {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

      {/* stat cards — 2 col grid on all screens */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
            Outstanding
          </Text>
          <Text fw={700} className={`text-lg leading-tight ${totalOutstanding > 0 ? 'text-red-500' : 'text-secondary-400'}`}>
            KES {totalOutstanding.toLocaleString()}
          </Text>
          <Text size="xs" className="text-text-200 mt-1">
            {unpaidInvoices.length} unpaid
          </Text>
        </Paper>

        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
            Last Payment
          </Text>
          {lastPayment ? (
            <>
              <Text fw={700} className="text-lg text-text-700 leading-tight">
                KES {Number(lastPayment.amount).toLocaleString()}
              </Text>
              <Text size="xs" className="text-text-200 mt-1">
                {new Date(lastPayment.payment_date).toLocaleDateString()}
              </Text>
            </>
          ) : (
            <Text size="xs" className="text-text-300 mt-2">No payments yet</Text>
          )}
        </Paper>

        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
            Last Reading
          </Text>
          {lastReading ? (
            <>
              <Text fw={700} className="text-lg text-text-700 leading-tight">
                {lastReading.current_reading} m³
              </Text>
              <Text size="xs" className="text-text-200 mt-1">{lastReading.reading_date}</Text>
            </>
          ) : (
            <Text size="xs" className="text-text-300 mt-2">No readings yet</Text>
          )}
        </Paper>

        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
            Account Type
          </Text>
          <Text fw={700} className="text-lg text-text-700 leading-tight capitalize">
            {customer?.customer_type}
          </Text>
          <Badge size="xs" radius="sm" variant="light" color="green" mt={4}>Active</Badge>
        </Paper>
      </div>

      {/* unpaid invoices */}
      {unpaidInvoices.length > 0 && (
        <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <Text size="sm" fw={600} className="text-text-600">Unpaid Invoices</Text>
          </div>
          {unpaidInvoices.slice(0, 5).map(inv => (
            <div key={inv.id}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="min-w-0 mr-3">
                <Text size="sm" fw={600} className="text-text-600 truncate">{inv.invoice_no}</Text>
                <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
              </div>
              <div className="text-right flex-shrink-0">
                <Text size="sm" fw={700} className="text-primary-600">
                  KES {Number(inv.total_amount).toLocaleString()}
                </Text>
                <Badge size="xs" radius="sm" variant="light"
                  color={inv.status === 'overdue' ? 'red' : 'yellow'}>
                  {inv.status}
                </Badge>
              </div>
            </div>
          ))}
        </Paper>
      )}
    </div>
  )
}
