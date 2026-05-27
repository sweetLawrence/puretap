// import { useEffect, useState } from 'react'
// import {
//   Paper, Title, Text, Select, Button, Badge, Modal,
//   Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip
// } from '@mantine/core'
// import { useMediaQuery } from '@mantine/hooks'
// import api from '../utils/api'

// interface Customer {
//   id: number
//   full_name: string
//   account_no: string
// }

// interface Invoice {
//   id: number
//   invoice_no: string
//   customer_id: number
//   reading_id: number
//   units_consumed: number
//   amount_due: number
//   tax_amount: number
//   total_amount: number
//   status: string
//   due_date: string
//   billing_period_start: string
//   billing_period_end: string
//   created_at: string
//   customers: Customer
// }

// interface Reading {
//   id: number
//   reading_date: string
//   current_reading: number
//   previous_reading: number
//   units_consumed: number
//   status: string
//   meters: { serial_no: string }
// }

// const STATUS_COLORS: Record<string, string> = {
//   unpaid: 'yellow', paid: 'green',
//   overdue: 'red', disputed: 'orange', cancelled: 'gray'
// }

// export default function Invoices() {
//   const isMobile = useMediaQuery('(max-width: 768px)')

//   const [invoices, setInvoices] = useState<Invoice[]>([])
//   const [filtered, setFiltered] = useState<Invoice[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [search, setSearch] = useState('')
//   const [statusFilter, setStatusFilter] = useState<string | null>(null)
//   const [notifyLoading, setNotifyLoading] = useState<number | null>(null)

//   const [generateModal, setGenerateModal] = useState(false)
//   const [customerSearch, setCustomerSearch] = useState('')
//   const [customerResults, setCustomerResults] = useState<Customer[]>([])
//   const [customerLoading, setCustomerLoading] = useState(false)
//   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
//   const [readings, setReadings] = useState<Reading[]>([])
//   const [readingsLoading, setReadingsLoading] = useState(false)
//   const [selectedReading, setSelectedReading] = useState<Reading | null>(null)
//   const [generating, setGenerating] = useState(false)
//   const [generateError, setGenerateError] = useState('')
//   const [generateSuccess, setGenerateSuccess] = useState(false)

//   const load = async () => {
//     try {
//       const res = await api.get('/invoices')
//       setInvoices(res.data.data)
//       setFiltered(res.data.data)
//     } catch {
//       setError('Failed to load invoices')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => { load() }, [])

//   useEffect(() => {
//     let data = [...invoices]
//     if (search) {
//       const q = search.toLowerCase()
//       data = data.filter(i =>
//         i.invoice_no.toLowerCase().includes(q) ||
//         i.customers?.full_name?.toLowerCase().includes(q) ||
//         i.customers?.account_no?.toLowerCase().includes(q)
//       )
//     }
//     if (statusFilter) data = data.filter(i => i.status === statusFilter)
//     setFiltered(data)
//   }, [search, statusFilter, invoices])

//   useEffect(() => {
//     if (customerSearch.length < 2) { setCustomerResults([]); return }
//     const timeout = setTimeout(async () => {
//       setCustomerLoading(true)
//       try {
//         const res = await api.get(`/customers/search?q=${customerSearch}`)
//         setCustomerResults(res.data.data)
//       } catch { setCustomerResults([]) }
//       finally { setCustomerLoading(false) }
//     }, 400)
//     return () => clearTimeout(timeout)
//   }, [customerSearch])

//   const selectCustomer = async (customer: Customer) => {
//     setSelectedCustomer(customer)
//     setCustomerSearch(customer.full_name)
//     setCustomerResults([])
//     setSelectedReading(null)
//     setReadingsLoading(true)
//     try {
//       const meterRes = await api.get(`/meters/customer/${customer.id}`)
//       const meters = meterRes.data.data
//       if (meters.length === 0) { setReadings([]); setReadingsLoading(false); return }
//       const readingRes = await api.get(`/readings/meter/${meters[0].id}`)
//       const allReadings: Reading[] = readingRes.data.data
//       const invoicedIds = invoices.filter(inv => inv.customer_id === customer.id).map(inv => inv.reading_id)
//       setReadings(allReadings.filter(r => r.status === 'verified' && !invoicedIds.includes(r.id)))
//     } catch { setReadings([]) }
//     finally { setReadingsLoading(false) }
//   }

//   const handleGenerate = async () => {
//     if (!selectedReading) { setGenerateError('Please select a reading'); return }
//     setGenerating(true)
//     setGenerateError('')
//     try {
//       await api.post('/invoices/generate', { reading_id: selectedReading.id })
//       setGenerateSuccess(true)
//       load()
//     } catch (err: any) {
//       setGenerateError(err.response?.data?.message || 'Failed to generate invoice')
//     } finally { setGenerating(false) }
//   }

//   const resetModal = () => {
//     setGenerateModal(false)
//     setCustomerSearch('')
//     setCustomerResults([])
//     setSelectedCustomer(null)
//     setReadings([])
//     setSelectedReading(null)
//     setGenerateError('')
//     setGenerateSuccess(false)
//   }

//   const handleStatusUpdate = async (id: number, status: string) => {
//     try { await api.patch(`/invoices/${id}/status`, { status }); load() }
//     catch { alert('Failed to update status') }
//   }

//   const handleNotify = async (id: number) => {
//     setNotifyLoading(id)
//     try { await api.post(`/notifications/invoice/${id}`); alert('Notification sent') }
//     catch { alert('Failed to send notification') }
//     finally { setNotifyLoading(null) }
//   }

//   const InvoicesTable = () => (
//     <div className="table-responsive">
//       <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
//         <Table.Thead>
//           <Table.Tr className="bg-gray-50">
//             <Table.Th className="text-text-400 text-xs uppercase">Invoice No</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Customer</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Units</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Amount</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Due Date</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
//           </Table.Tr>
//         </Table.Thead>
//         <Table.Tbody>
//           {filtered.length === 0 ? (
//             <Table.Tr>
//               <Table.Td colSpan={7} className="text-center text-text-300 py-8">No invoices found</Table.Td>
//             </Table.Tr>
//           ) : filtered.map(inv => (
//             <Table.Tr key={inv.id}>
//               <Table.Td className="text-text-600 font-semibold text-sm">{inv.invoice_no}</Table.Td>
//               <Table.Td>
//                 <Text size="sm" className="text-text-500">{inv.customers?.full_name}</Text>
//                 <Text size="xs" className="text-text-300">{inv.customers?.account_no}</Text>
//               </Table.Td>
//               <Table.Td className="text-text-400 text-sm">{inv.units_consumed} m³</Table.Td>
//               <Table.Td className="text-text-600 font-semibold text-sm">
//                 KES {Number(inv.total_amount).toLocaleString()}
//               </Table.Td>
//               <Table.Td className="text-text-400 text-sm">{inv.due_date}</Table.Td>
//               <Table.Td>
//                 <Badge size="sm" radius="sm" variant="light" color={STATUS_COLORS[inv.status] || 'gray'}>
//                   {inv.status}
//                 </Badge>
//               </Table.Td>
//               <Table.Td>
//                 <Group gap="xs">
//                   <Tooltip label="Send notification">
//                     <ActionIcon variant="light" color="blue" radius="md" size="sm"
//                       loading={notifyLoading === inv.id} onClick={() => handleNotify(inv.id)}>
//                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
//                         <path d="M13.73 21a2 2 0 0 1-3.46 0" />
//                       </svg>
//                     </ActionIcon>
//                   </Tooltip>
//                   {inv.status === 'unpaid' && (
//                     <Tooltip label="Mark overdue">
//                       <ActionIcon variant="light" color="orange" radius="md" size="sm"
//                         onClick={() => handleStatusUpdate(inv.id, 'overdue')}>
//                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                           <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
//                           <line x1="12" y1="16" x2="12.01" y2="16" />
//                         </svg>
//                       </ActionIcon>
//                     </Tooltip>
//                   )}
//                   {['unpaid', 'overdue'].includes(inv.status) && (
//                     <Tooltip label="Cancel">
//                       <ActionIcon variant="light" color="red" radius="md" size="sm"
//                         onClick={() => handleStatusUpdate(inv.id, 'cancelled')}>
//                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                           <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
//                         </svg>
//                       </ActionIcon>
//                     </Tooltip>
//                   )}
//                 </Group>
//               </Table.Td>
//             </Table.Tr>
//           ))}
//         </Table.Tbody>
//       </Table>
//     </div>
//   )

//   const [statusUpdating, setStatusUpdating] = useState<number | null>(null)

//   const handleStatusUpdateWithFeedback = async (id: number, status: string) => {
//     setStatusUpdating(id)
//     try {
//       await api.patch(`/invoices/${id}/status`, { status })
//       load()
//     } catch {
//       alert('Failed to update status')
//     } finally {
//       setStatusUpdating(null)
//     }
//   }

//   const Spinner = () => (
//     <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
//   )

//   const InvoiceCards = () => (
//     <>
//       {filtered.length === 0 ? (
//         <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
//           <Text size="sm" className="text-text-300">No invoices found</Text>
//         </div>
//       ) : (
//         <Stack gap="sm">
//           {filtered.map(inv => (
//             <div key={inv.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
//               <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50">
//                 <div className="min-w-0 mr-3">
//                   <Text fw={700} size="sm" className="text-text-700">{inv.invoice_no}</Text>
//                   <Text size="xs" className="text-text-500 mt-0.5">{inv.customers?.full_name}</Text>
//                   <Text size="xs" className="text-text-300">{inv.customers?.account_no}</Text>
//                 </div>
//                 <div className="text-right flex-shrink-0">
//                   <Text fw={700} size="sm" className="text-primary-600">
//                     KES {Number(inv.total_amount).toLocaleString()}
//                   </Text>
//                   <Text size="xs" className="text-text-300 mt-0.5">{inv.units_consumed} m³</Text>
//                   <Badge size="xs" radius="sm" variant="light" mt={4}
//                     color={STATUS_COLORS[inv.status] || 'gray'}>
//                     {inv.status}
//                   </Badge>
//                 </div>
//               </div>
//               <div className="flex items-center justify-between px-4 py-2.5">
//                 <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
//                 <Group gap="sm">
//                   {/* notify */}
//                   <button
//                     disabled={notifyLoading === inv.id}
//                     onClick={() => handleNotify(inv.id)}
//                     className="flex items-center gap-1 text-xs text-primary-500 font-medium disabled:opacity-50 transition-opacity">
//                     {notifyLoading === inv.id
//                       ? <><Spinner /> Sending...</>
//                       : 'Notify'
//                     }
//                   </button>

//                   {/* mark overdue */}
//                   {inv.status === 'unpaid' && (
//                     <button
//                       disabled={statusUpdating === inv.id}
//                       onClick={() => handleStatusUpdateWithFeedback(inv.id, 'overdue')}
//                       className="flex items-center gap-1 text-xs text-orange-400 font-medium disabled:opacity-50 transition-opacity">
//                       {statusUpdating === inv.id
//                         ? <><Spinner /> Updating...</>
//                         : 'Overdue'
//                       }
//                     </button>
//                   )}

//                   {/* cancel */}
//                   {['unpaid', 'overdue'].includes(inv.status) && (
//                     <button
//                       disabled={statusUpdating === inv.id}
//                       onClick={() => handleStatusUpdateWithFeedback(inv.id, 'cancelled')}
//                       className="flex items-center gap-1 text-xs text-red-400 font-medium disabled:opacity-50 transition-opacity">
//                       {statusUpdating === inv.id
//                         ? <><Spinner /> Updating...</>
//                         : 'Cancel'
//                       }
//                     </button>
//                   )}
//                 </Group>
//               </div>
//             </div>
//           ))}
//         </Stack>
//       )}
//     </>
//   )

//   return (
//     <div className="p-4 md:p-6">
//       <div className="flex items-center justify-between mb-5">
//         <div>
//           <Title order={3} className="text-text-700 font-bold text-lg md:text-xl">Invoices</Title>
//           <Text size="sm" className="text-text-300 mt-0.5 hidden sm:block">Manage billing invoices</Text>
//         </div>
//         <Button radius="md" size="sm"
//           onClick={() => { setGenerateError(''); setGenerateModal(true) }}
//           className="bg-primary-500 hover:bg-primary-600">
//           + Generate Invoice
//         </Button>
//       </div>

//       <Paper shadow="xs" radius="lg" p="sm" className="bg-white mb-4">
//         <Stack gap="sm">
//           <input type="text" placeholder="Search invoice no, customer, account..."
//             value={search} onChange={e => setSearch(e.target.value)}
//             className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//           />
//           <Select placeholder="Filter by status" value={statusFilter}
//             onChange={setStatusFilter} clearable radius="md"
//             data={[
//               { value: 'unpaid', label: 'Unpaid' },
//               { value: 'paid', label: 'Paid' },
//               { value: 'overdue', label: 'Overdue' },
//               { value: 'disputed', label: 'Disputed' },
//               { value: 'cancelled', label: 'Cancelled' },
//             ]}
//           />
//         </Stack>
//       </Paper>

//       {loading ? (
//         <Stack gap="sm">
//           {[...Array(5)].map((_, i) => <Skeleton key={i} height={60} radius="lg" />)}
//         </Stack>
//       ) : error ? (
//         <Alert color="red" radius="md" variant="light">{error}</Alert>
//       ) : isMobile ? (
//         <InvoiceCards />
//       ) : (
//         <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
//           <InvoicesTable />
//         </Paper>
//       )}

//       {/* Generate Invoice Modal */}
//       <Modal opened={generateModal} onClose={resetModal}
//         title={<Text fw={600} className="text-text-600">Generate Invoice</Text>}
//         radius="lg" size="md">
//         {generateSuccess ? (
//           <Stack align="center" gap="md" py="md">
//             <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
//               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
//                 <polyline points="20 6 9 17 4 12" />
//               </svg>
//             </div>
//             <Text fw={600} className="text-text-700">Invoice Generated</Text>
//             <Text size="sm" className="text-text-400 text-center">
//               Invoice created successfully for {selectedCustomer?.full_name}.
//             </Text>
//             <Button fullWidth radius="md" onClick={resetModal}
//               className="bg-primary-500 hover:bg-primary-600">Done</Button>
//           </Stack>
//         ) : (
//           <Stack gap="md">
//             {generateError && (
//               <Alert color="red" radius="md" variant="light">{generateError}</Alert>
//             )}
//             <div>
//               <Text size="sm" fw={500} className="text-text-500 mb-1">Search Customer</Text>
//               <input type="text" placeholder="Type name, phone or account no..."
//                 value={customerSearch}
//                 onChange={e => {
//                   setCustomerSearch(e.target.value)
//                   setSelectedCustomer(null)
//                   setSelectedReading(null)
//                   setReadings([])
//                 }}
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//               />
//               {customerLoading && <Text size="xs" className="text-text-300 mt-1">Searching...</Text>}
//               {customerResults.length > 0 && (
//                 <div className="border border-gray-100 rounded-lg mt-1 overflow-hidden shadow-sm">
//                   {customerResults.map(c => (
//                     <button key={c.id} onClick={() => selectCustomer(c)}
//                       className="w-full text-left px-3 py-2.5 hover:bg-primary-50 border-b border-gray-50 last:border-0 transition-colors">
//                       <Text size="sm" fw={500} className="text-text-600">{c.full_name}</Text>
//                       <Text size="xs" className="text-text-300">{c.account_no}</Text>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {selectedCustomer && (
//               <div>
//                 <Text size="sm" fw={500} className="text-text-500 mb-2">
//                   Select Reading — {selectedCustomer.full_name}
//                 </Text>
//                 {readingsLoading ? (
//                   <Skeleton height={60} radius="md" />
//                 ) : readings.length === 0 ? (
//                   <Alert color="blue" radius="md" variant="light">
//                     No uninvoiced verified readings found for this customer
//                   </Alert>
//                 ) : (
//                   <Stack gap="xs">
//                     {readings.map(r => (
//                       <button key={r.id} onClick={() => setSelectedReading(r)}
//                         className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
//                           selectedReading?.id === r.id
//                             ? 'border-primary-500 bg-primary-50'
//                             : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
//                         }`}>
//                         <div className="flex justify-between items-start">
//                           <div>
//                             <Text size="sm" fw={600} className="text-text-600">{r.meters?.serial_no}</Text>
//                             <Text size="xs" className="text-text-300 mt-0.5">{r.reading_date}</Text>
//                           </div>
//                           <div className="text-right">
//                             <Text size="sm" fw={700} className="text-primary-600">{r.units_consumed} m³</Text>
//                             <Text size="xs" className="text-text-300">{r.previous_reading} → {r.current_reading}</Text>
//                           </div>
//                         </div>
//                       </button>
//                     ))}
//                   </Stack>
//                 )}
//               </div>
//             )}

//             {selectedReading && selectedCustomer && (
//               <div className="bg-gray-50 rounded-xl p-4">
//                 <div className="flex justify-between mb-1">
//                   <Text size="xs" className="text-text-300">Customer</Text>
//                   <Text size="xs" fw={600} className="text-text-600">{selectedCustomer.full_name}</Text>
//                 </div>
//                 <div className="flex justify-between mb-1">
//                   <Text size="xs" className="text-text-300">Reading date</Text>
//                   <Text size="xs" fw={600} className="text-text-600">{selectedReading.reading_date}</Text>
//                 </div>
//                 <div className="flex justify-between">
//                   <Text size="xs" className="text-text-300">Units consumed</Text>
//                   <Text size="xs" fw={700} className="text-primary-600">{selectedReading.units_consumed} m³</Text>
//                 </div>
//               </div>
//             )}

//             <Button fullWidth radius="md" disabled={!selectedReading}
//               loading={generating} onClick={handleGenerate}
//               className="bg-primary-500 hover:bg-primary-600">
//               Generate Invoice
//             </Button>
//           </Stack>
//         )}
//       </Modal>
//     </div>
//   )
// }

























import { useEffect, useState } from 'react'
import {
  Paper, Title, Text, Select, Button, Badge, Modal,
  Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import api from '../utils/api'

interface Customer {
  id: number
  full_name: string
  account_no: string
}

interface Invoice {
  id: number
  invoice_no: string
  customer_id: number
  reading_id: number
  units_consumed: number
  amount_due: number
  tax_amount: number
  total_amount: number
  status: string
  due_date: string
  billing_period_start: string
  billing_period_end: string
  created_at: string
  customers: Customer
}

interface Reading {
  id: number
  reading_date: string
  current_reading: number
  previous_reading: number
  units_consumed: number
  status: string
  meters: { serial_no: string }
}

const STATUS_COLORS: Record<string, string> = {
  unpaid: 'yellow', paid: 'green',
  overdue: 'red', disputed: 'orange', cancelled: 'gray'
}

function groupByMonth<T>(items: T[], dateKey: keyof T): { label: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  items.forEach(item => {
    const raw = item[dateKey] as unknown as string
    if (!raw) return
    const d = new Date(raw)
    const label = d.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(item)
  })
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

const MonthDivider = ({ label, count, suffix }: { label: string; count: number; suffix?: string }) => (
  <div className="flex items-center gap-3 mt-2 mb-1">
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-primary-400" />
      <Text size="xs" fw={700} className="text-text-400 uppercase tracking-widest">{label}</Text>
    </div>
    <div className="flex-1 h-px bg-gray-100" />
    <Text size="xs" className="text-text-200">{count} {suffix || 'item'}{count !== 1 ? 's' : ''}</Text>
  </div>
)

export default function Invoices() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [filtered, setFiltered] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [notifyLoading, setNotifyLoading] = useState<number | null>(null)

  const [generateModal, setGenerateModal] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [readings, setReadings] = useState<Reading[]>([])
  const [readingsLoading, setReadingsLoading] = useState(false)
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState('')
  const [generateSuccess, setGenerateSuccess] = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)


  // new code
  const [downloadModal, setDownloadModal] = useState(false)
const [downloadFrom, setDownloadFrom] = useState('')
const [downloadTo, setDownloadTo] = useState('')
const [downloadStatus, setDownloadStatus] = useState<string | null>(null)
 // new code


  const load = async () => {
    try {
      const res = await api.get('/invoices')
      setInvoices(res.data.data)
      setFiltered(res.data.data)
    } catch {
      setError('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = [...invoices]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(i =>
        i.invoice_no.toLowerCase().includes(q) ||
        i.customers?.full_name?.toLowerCase().includes(q) ||
        i.customers?.account_no?.toLowerCase().includes(q)
      )
    }
    if (statusFilter) data = data.filter(i => i.status === statusFilter)
    setFiltered(data)
  }, [search, statusFilter, invoices])

  useEffect(() => {
    if (customerSearch.length < 2) { setCustomerResults([]); return }
    const timeout = setTimeout(async () => {
      setCustomerLoading(true)
      try {
        const res = await api.get(`/customers/search?q=${customerSearch}`)
        setCustomerResults(res.data.data)
      } catch { setCustomerResults([]) }
      finally { setCustomerLoading(false) }
    }, 400)
    return () => clearTimeout(timeout)
  }, [customerSearch])

// const handleDownloadAll = async () => {
//   setDownloading(-1)  // use -1 as sentinel for "all"
//   try {
//     const res = await api.get('/invoices/download/all', {
//       responseType: 'blob'
//     })
//     const url = window.URL.createObjectURL(new Blob([res.data]))
//     const link = document.createElement('a')
//     link.href = url
//     const date = new Date().toISOString().split('T')[0]
//     link.setAttribute('download', `PureTap_Invoices_${date}.pdf`)
//     document.body.appendChild(link)
//     link.click()
//     link.remove()
//     window.URL.revokeObjectURL(url)
//   } catch {
//     alert('Failed to download invoices')
//   } finally {
//     setDownloading(null)
//   }
// }





























const handleDownloadAll = async () => {
  setDownloading(-1)
  try {
    const params = new URLSearchParams()
    if (downloadFrom) params.append('from', downloadFrom)
    if (downloadTo) params.append('to', downloadTo)
    if (downloadStatus) params.append('status', downloadStatus)

    const res = await api.get(`/invoices/download/all?${params.toString()}`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    const date = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `PureTap_Invoices_${date}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
    setDownloadModal(false)
  } catch {
    alert('Failed to download invoices')
  } finally {
    setDownloading(null)
  }
}





















  const selectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setCustomerSearch(customer.full_name)
    setCustomerResults([])
    setSelectedReading(null)
    setReadingsLoading(true)
    try {
      const meterRes = await api.get(`/meters/customer/${customer.id}`)
      const meters = meterRes.data.data
      if (meters.length === 0) { setReadings([]); setReadingsLoading(false); return }
      const readingRes = await api.get(`/readings/meter/${meters[0].id}`)
      const allReadings: Reading[] = readingRes.data.data
      const invoicedIds = invoices.filter(inv => inv.customer_id === customer.id).map(inv => inv.reading_id)
      setReadings(allReadings.filter(r => r.status === 'verified' && !invoicedIds.includes(r.id)))
    } catch { setReadings([]) }
    finally { setReadingsLoading(false) }
  }

  const handleGenerate = async () => {
    if (!selectedReading) { setGenerateError('Please select a reading'); return }
    setGenerating(true)
    setGenerateError('')
    try {
      await api.post('/invoices/generate', { reading_id: selectedReading.id })
      setGenerateSuccess(true)
      load()
    } catch (err: any) {
      setGenerateError(err.response?.data?.message || 'Failed to generate invoice')
    } finally { setGenerating(false) }
  }

  const resetModal = () => {
    setGenerateModal(false)
    setCustomerSearch('')
    setCustomerResults([])
    setSelectedCustomer(null)
    setReadings([])
    setSelectedReading(null)
    setGenerateError('')
    setGenerateSuccess(false)
  }

  // const handleStatusUpdate = async (id: number, status: string) => {
  //   try { await api.patch(`/invoices/${id}/status`, { status }); load() }
  //   catch { alert('Failed to update status') }
  // }

  // const handleNotify = async (id: number) => {
  //   setNotifyLoading(id)
  //   try { await api.post(`/notifications/invoice/${id}`); alert('Notification sent') }
  //   catch { alert('Failed to send notification') }
  //   finally { setNotifyLoading(null) }
  // }

  const handleNotify = async (id: number) => {
  setNotifyLoading(id)

  try {
    const res = await api.post(`/notifications/invoice/${id}`)

    if (res.status !== 200 && res.status !== 207) {
      throw new Error('Notification failed')
    }

    alert(res.data?.message || 'Notification sent')
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to send notification')
  } finally {
    setNotifyLoading(null)
  }
}

  // const InvoicesTable = () => (
  //   <div className="table-responsive">
  //     <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
  //       <Table.Thead>
  //         <Table.Tr className="bg-gray-50">
  //           <Table.Th className="text-text-400 text-xs uppercase">Invoice No</Table.Th>
  //           <Table.Th className="text-text-400 text-xs uppercase">Customer</Table.Th>
  //           <Table.Th className="text-text-400 text-xs uppercase">Units</Table.Th>
  //           <Table.Th className="text-text-400 text-xs uppercase">Amount</Table.Th>
  //           <Table.Th className="text-text-400 text-xs uppercase">Due Date</Table.Th>
  //           <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
  //           <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
  //         </Table.Tr>
  //       </Table.Thead>
  //       <Table.Tbody>
  //         {filtered.length === 0 ? (
  //           <Table.Tr>
  //             <Table.Td colSpan={7} className="text-center text-text-300 py-8">No invoices found</Table.Td>
  //           </Table.Tr>
  //         ) : filtered.map(inv => (
  //           <Table.Tr key={inv.id}>
  //             <Table.Td className="text-text-600 font-semibold text-sm">{inv.invoice_no}</Table.Td>
  //             <Table.Td>
  //               <Text size="sm" className="text-text-500">{inv.customers?.full_name}</Text>
  //               <Text size="xs" className="text-text-300">{inv.customers?.account_no}</Text>
  //             </Table.Td>
  //             <Table.Td className="text-text-400 text-sm">{inv.units_consumed} m³</Table.Td>
  //             <Table.Td className="text-text-600 font-semibold text-sm">
  //               KES {Number(inv.total_amount).toLocaleString()}
  //             </Table.Td>
  //             <Table.Td className="text-text-400 text-sm">{inv.due_date}</Table.Td>
  //             <Table.Td>
  //               <Badge size="sm" radius="sm" variant="light" color={STATUS_COLORS[inv.status] || 'gray'}>
  //                 {inv.status}
  //               </Badge>
  //             </Table.Td>
  //             <Table.Td>
  //               <Group gap="xs">
  //                 <Tooltip label="Send notification">
  //                   <ActionIcon variant="light" color="blue" radius="md" size="sm"
  //                     loading={notifyLoading === inv.id} onClick={() => handleNotify(inv.id)}>
  //                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  //                       <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
  //                       <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  //                     </svg>
  //                   </ActionIcon>
  //                 </Tooltip>
  //                 {inv.status === 'unpaid' && (
  //                   <Tooltip label="Mark overdue">
  //                     <ActionIcon variant="light" color="orange" radius="md" size="sm"
  //                       onClick={() => handleStatusUpdate(inv.id, 'overdue')}>
  //                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  //                         <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
  //                         <line x1="12" y1="16" x2="12.01" y2="16" />
  //                       </svg>
  //                     </ActionIcon>
  //                   </Tooltip>
  //                 )}
  //                 {['unpaid', 'overdue'].includes(inv.status) && (
  //                   <Tooltip label="Cancel">
  //                     <ActionIcon variant="light" color="red" radius="md" size="sm"
  //                       onClick={() => handleStatusUpdate(inv.id, 'cancelled')}>
  //                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
  //                         <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  //                       </svg>
  //                     </ActionIcon>
  //                   </Tooltip>
  //                 )}
  //               </Group>
  //             </Table.Td>
  //           </Table.Tr>
  //         ))}
  //       </Table.Tbody>
  //     </Table>
  //   </div>
  // )

  const [statusUpdating, setStatusUpdating] = useState<number | null>(null)

  const handleStatusUpdateWithFeedback = async (id: number, status: string) => {
    setStatusUpdating(id)
    try {
      await api.patch(`/invoices/${id}/status`, { status })
      load()
    } catch {
      alert('Failed to update status')
    } finally {
      setStatusUpdating(null)
    }
  }

  const Spinner = () => (
    <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
  )

  // const InvoiceCards = () => (
  //   <>
  //     {filtered.length === 0 ? (
  //       <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
  //         <Text size="sm" className="text-text-300">No invoices found</Text>
  //       </div>
  //     ) : (
  //       <Stack gap="sm">
  //         {filtered.map(inv => (
  //           <div key={inv.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
  //             <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50">
  //               <div className="min-w-0 mr-3">
  //                 <Text fw={700} size="sm" className="text-text-700">{inv.invoice_no}</Text>
  //                 <Text size="xs" className="text-text-500 mt-0.5">{inv.customers?.full_name}</Text>
  //                 <Text size="xs" className="text-text-300">{inv.customers?.account_no}</Text>
  //               </div>
  //               <div className="text-right flex-shrink-0">
  //                 <Text fw={700} size="sm" className="text-primary-600">
  //                   KES {Number(inv.total_amount).toLocaleString()}
  //                 </Text>
  //                 <Text size="xs" className="text-text-300 mt-0.5">{inv.units_consumed} m³</Text>
  //                 <Badge size="xs" radius="sm" variant="light" mt={4}
  //                   color={STATUS_COLORS[inv.status] || 'gray'}>
  //                   {inv.status}
  //                 </Badge>
  //               </div>
  //             </div>
  //             <div className="flex items-center justify-between px-4 py-2.5">
  //               <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
  //               <Group gap="sm">
  //                 {/* notify */}
  //                 <button
  //                   disabled={notifyLoading === inv.id}
  //                   onClick={() => handleNotify(inv.id)}
  //                   className="flex items-center gap-1 text-xs text-primary-500 font-medium disabled:opacity-50 transition-opacity">
  //                   {notifyLoading === inv.id
  //                     ? <><Spinner /> Sending...</>
  //                     : 'Notify'
  //                   }
  //                 </button>

  //                 {/* mark overdue */}
  //                 {inv.status === 'unpaid' && (
  //                   <button
  //                     disabled={statusUpdating === inv.id}
  //                     onClick={() => handleStatusUpdateWithFeedback(inv.id, 'overdue')}
  //                     className="flex items-center gap-1 text-xs text-orange-400 font-medium disabled:opacity-50 transition-opacity">
  //                     {statusUpdating === inv.id
  //                       ? <><Spinner /> Updating...</>
  //                       : 'Overdue'
  //                     }
  //                   </button>
  //                 )}

  //                 {/* cancel */}
  //                 {['unpaid', 'overdue'].includes(inv.status) && (
  //                   <button
  //                     disabled={statusUpdating === inv.id}
  //                     onClick={() => handleStatusUpdateWithFeedback(inv.id, 'cancelled')}
  //                     className="flex items-center gap-1 text-xs text-red-400 font-medium disabled:opacity-50 transition-opacity">
  //                     {statusUpdating === inv.id
  //                       ? <><Spinner /> Updating...</>
  //                       : 'Cancel'
  //                     }
  //                   </button>
  //                 )}
  //               </Group>
  //             </div>
  //           </div>
  //         ))}
  //       </Stack>
  //     )}
  //   </>
  // )

  const InvoiceCard = ({ inv }: { inv: Invoice }) => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50">
        <div className="min-w-0 mr-3">
          <Text fw={700} size="sm" className="text-text-700">{inv.invoice_no}</Text>
          <Text size="xs" className="text-text-500 mt-0.5">{inv.customers?.full_name}</Text>
          <Text size="xs" className="text-text-300">{inv.customers?.account_no}</Text>
        </div>
        <div className="text-right flex-shrink-0">
          <Text fw={700} size="sm" className="text-primary-600">
            KES {Number(inv.total_amount).toLocaleString()}
          </Text>
          <Text size="xs" className="text-text-300 mt-0.5">{inv.units_consumed} m³</Text>
          <Badge size="xs" radius="sm" variant="light" mt={4}
            color={STATUS_COLORS[inv.status] || 'gray'}>
            {inv.status}
          </Badge>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-2.5">
        <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
        <Group gap="sm">
          <button disabled={notifyLoading === inv.id}
            onClick={() => handleNotify(inv.id)}
            className="flex items-center gap-1 text-xs text-primary-500 font-medium disabled:opacity-50">
            {notifyLoading === inv.id ? <><Spinner /> Sending...</> : 'Notify'}
          </button>
          {inv.status === 'unpaid' && (
            <button disabled={statusUpdating === inv.id}
              onClick={() => handleStatusUpdateWithFeedback(inv.id, 'overdue')}
              className="flex items-center gap-1 text-xs text-orange-400 font-medium disabled:opacity-50">
              {statusUpdating === inv.id ? <><Spinner /> Updating...</> : 'Overdue'}
            </button>
          )}
          {['unpaid', 'overdue'].includes(inv.status) && (
            <button disabled={statusUpdating === inv.id}
              onClick={() => handleStatusUpdateWithFeedback(inv.id, 'cancelled')}
              className="flex items-center gap-1 text-xs text-red-400 font-medium disabled:opacity-50">
              {statusUpdating === inv.id ? <><Spinner /> Updating...</> : 'Cancel'}
            </button>
          )}
        </Group>
      </div>
    </div>
  )

  const GroupedInvoiceCards = () => {
    const groups = groupByMonth(filtered, 'due_date')
    if (filtered.length === 0) return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <Text size="sm" className="text-text-300">No invoices found</Text>
      </div>
    )
    return (
      <Stack gap="xs">
        {groups.map(group => (
          <div key={group.label}>
            <MonthDivider label={group.label} count={group.items.length} suffix="invoice" />
            <Stack gap="sm">
              {group.items.map(inv => <InvoiceCard key={inv.id} inv={inv} />)}
            </Stack>
          </div>
        ))}
      </Stack>
    )
  }

  const GroupedInvoicesTable = () => {
    const groups = groupByMonth(filtered, 'due_date')
    if (filtered.length === 0) return (
      <div className="text-center text-text-300 py-8">No invoices found</div>
    )
    return (
      <div className="table-responsive">
  
        <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead>
            <Table.Tr className="bg-gray-50">
              <Table.Th className="text-text-400 text-xs uppercase">Invoice No</Table.Th>
              <Table.Th className="text-text-400 text-xs uppercase">Customer</Table.Th>
              <Table.Th className="text-text-400 text-xs uppercase">Units</Table.Th>
              <Table.Th className="text-text-400 text-xs uppercase">Amount</Table.Th>
              <Table.Th className="text-text-400 text-xs uppercase">Due Date</Table.Th>
              <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
              <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {groups.map(group => (
              <>
                <Table.Tr key={group.label + '-divider'}>
                  <Table.Td colSpan={7} className="bg-gray-50 py-2 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary-400" />
                      <Text size="xs" fw={700} className="text-text-400 uppercase tracking-widest">
                        {group.label}
                      </Text>
                      <div className="flex-1 h-px bg-gray-200 ml-1" />
                      <Text size="xs" className="text-text-200">
                        {group.items.length} invoice{group.items.length !== 1 ? 's' : ''}
                      </Text>
                    </div>
                  </Table.Td>
                </Table.Tr>
                {group.items.map(inv => (
                  <Table.Tr key={inv.id}>
                    <Table.Td className="text-text-600 font-semibold text-sm">{inv.invoice_no}</Table.Td>
                    <Table.Td>
                      <Text size="sm" className="text-text-500">{inv.customers?.full_name}</Text>
                      <Text size="xs" className="text-text-300">{inv.customers?.account_no}</Text>
                    </Table.Td>
                    <Table.Td className="text-text-400 text-sm">{inv.units_consumed} m³</Table.Td>
                    <Table.Td className="text-text-600 font-semibold text-sm">
                      KES {Number(inv.total_amount).toLocaleString()}
                    </Table.Td>
                    <Table.Td className="text-text-400 text-sm">{inv.due_date}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" radius="sm" variant="light" color={STATUS_COLORS[inv.status] || 'gray'}>
                        {inv.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Send notification">
                          <ActionIcon variant="light" color="blue" radius="md" size="sm"
                            loading={notifyLoading === inv.id} onClick={() => handleNotify(inv.id)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                          </ActionIcon>
                        </Tooltip>
                        
                        {inv.status === 'unpaid' && (
                          <Tooltip label="Mark overdue">
                            <ActionIcon variant="light" color="orange" radius="md" size="sm"
                              onClick={() => handleStatusUpdateWithFeedback(inv.id, 'overdue')}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                              </svg>
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {['unpaid', 'overdue'].includes(inv.status) && (
                          <Tooltip label="Cancel">
                            <ActionIcon variant="light" color="red" radius="md" size="sm"
                              onClick={() => handleStatusUpdateWithFeedback(inv.id, 'cancelled')}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </>
            ))}
          </Table.Tbody>
        </Table>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* <div className="flex items-center justify-between mb-5">
        <div>
          <Title order={3} className="text-text-700 font-bold text-lg md:text-xl">Invoices</Title>
          <Text size="sm" className="text-text-300 mt-0.5 hidden sm:block">Manage billing invoices</Text>
        </div>
        <Button radius="md" size="sm"
          onClick={() => { setGenerateError(''); setGenerateModal(true) }}
          className="bg-primary-500 hover:bg-primary-600">
          + Generate Invoice
        </Button>
      </div> */}



      <div className="flex items-center justify-between mb-5">
  <div>
    <Title order={3} className="text-text-700 font-bold text-lg md:text-xl">Invoices</Title>
    <Text size="sm" className="text-text-300 mt-0.5 hidden sm:block">Manage billing invoices</Text>
  </div>
  <Group gap="xs">
    {/* <Button radius="md" size="sm" variant="outline"
      loading={downloading === -1}
      onClick={handleDownloadAll}
      className="border-primary-500 text-primary-600">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" className="mr-1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      {isMobile ? 'PDF' : 'Download All'}
    </Button> */}


    <Button radius="md" size="sm" variant="outline"
  onClick={() => setDownloadModal(true)}
  className="border-primary-500 text-primary-600">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" className="mr-1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
  {isMobile ? 'PDF' : 'Download PDF'}
</Button>





    <Button radius="md" size="sm"
      onClick={() => { setGenerateError(''); setGenerateModal(true) }}
      className="bg-primary-500 hover:bg-primary-600">
      + Generate Invoice
    </Button>
  </Group>
</div>



      <Paper shadow="xs" radius="lg" p="sm" className="bg-white mb-4">
        <Stack gap="sm">
          <input type="text" placeholder="Search invoice no, customer, account..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
          <Select placeholder="Filter by status" value={statusFilter}
            onChange={setStatusFilter} clearable radius="md"
            data={[
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'paid', label: 'Paid' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'disputed', label: 'Disputed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </Stack>
      </Paper>

      {loading ? (
        <Stack gap="sm">
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={60} radius="lg" />)}
        </Stack>
      ) : error ? (
        <Alert color="red" radius="md" variant="light">{error}</Alert>
      ) : isMobile ? (
        <GroupedInvoiceCards />
      ) : (
        <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
          <GroupedInvoicesTable />
        </Paper>
      )}

      {/* Generate Invoice Modal */}
      <Modal opened={generateModal} onClose={resetModal}
        title={<Text fw={600} className="text-text-600">Generate Invoice</Text>}
        radius="lg" size="md">
        {generateSuccess ? (
          <Stack align="center" gap="md" py="md">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <Text fw={600} className="text-text-700">Invoice Generated</Text>
            <Text size="sm" className="text-text-400 text-center">
              Invoice created successfully for {selectedCustomer?.full_name}.
            </Text>
            <Button fullWidth radius="md" onClick={resetModal}
              className="bg-primary-500 hover:bg-primary-600">Done</Button>
          </Stack>
        ) : (
          <Stack gap="md">
            {generateError && (
              <Alert color="red" radius="md" variant="light" >{generateError}</Alert>
            )}
            <div>
              <Text size="sm" fw={500} className="text-text-500 mb-1">Search Customer</Text>
              <input type="text" placeholder="Type name, phone or account no..."
                value={customerSearch}
                onChange={e => {
                  setCustomerSearch(e.target.value)
                  setSelectedCustomer(null)
                  setSelectedReading(null)
                  setReadings([])
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              {customerLoading && <Text size="xs" className="text-text-300 mt-1">Searching...</Text>}
              {customerResults.length > 0 && (
                <div className="border border-gray-100 rounded-lg mt-1 overflow-hidden shadow-sm">
                  {customerResults.map(c => (
                    <button key={c.id} onClick={() => selectCustomer(c)}
                      className="w-full text-left px-3 py-2.5 hover:bg-primary-50 border-b border-gray-50 last:border-0 transition-colors">
                      <Text size="sm" fw={500} className="text-text-600">{c.full_name}</Text>
                      <Text size="xs" className="text-text-300">{c.account_no}</Text>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <div>
                <Text size="sm" fw={500} className="text-text-500 mb-2">
                  Select Reading — {selectedCustomer.full_name}
                </Text>
                {readingsLoading ? (
                  <Skeleton height={60} radius="md" />
                ) : readings.length === 0 ? (
                  <Alert color="blue" radius="md" variant="light" >
                    No uninvoiced verified readings found for this customer
                  </Alert>
                ) : (
                  <Stack gap="xs">
                    {readings.map(r => (
                      <button key={r.id} onClick={() => setSelectedReading(r)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                          selectedReading?.id === r.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                        }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <Text size="sm" fw={600} className="text-text-600">{r.meters?.serial_no}</Text>
                            <Text size="xs" className="text-text-300 mt-0.5">{r.reading_date}</Text>
                          </div>
                          <div className="text-right">
                            <Text size="sm" fw={700} className="text-primary-600">{r.units_consumed} m³</Text>
                            <Text size="xs" className="text-text-300">{r.previous_reading} → {r.current_reading}</Text>
                          </div>
                        </div>
                      </button>
                    ))}
                  </Stack>
                )}
              </div>
            )}

            {selectedReading && selectedCustomer && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between mb-1">
                  <Text size="xs" className="text-text-300">Customer</Text>
                  <Text size="xs" fw={600} className="text-text-600">{selectedCustomer.full_name}</Text>
                </div>
                <div className="flex justify-between mb-1">
                  <Text size="xs" className="text-text-300">Reading date</Text>
                  <Text size="xs" fw={600} className="text-text-600">{selectedReading.reading_date}</Text>
                </div>
                <div className="flex justify-between">
                  <Text size="xs" className="text-text-300">Units consumed</Text>
                  <Text size="xs" fw={700} className="text-primary-600">{selectedReading.units_consumed} m³</Text>
                </div>
              </div>
            )}

            <Button fullWidth radius="md" disabled={!selectedReading}
              loading={generating} onClick={handleGenerate}
              className="bg-primary-500 hover:bg-primary-600">
              Generate Invoice
            </Button>
          </Stack>
        )}
      </Modal>

      {/* Download Modal */}
<Modal opened={downloadModal} onClose={() => setDownloadModal(false)}
  title={<Text fw={600} className="text-text-600">Download Invoices PDF</Text>}
  radius="lg" size="sm">
  <Stack gap="md">
    <Text size="sm" className="text-text-400">
      Filter invoices before downloading. Leave fields empty to download all.
    </Text>

    <div>
      <Text size="xs" fw={500} className="text-text-500 mb-1">Status</Text>
      <Select
        placeholder="All statuses"
        value={downloadStatus}
        onChange={setDownloadStatus}
        clearable radius="md"
        data={[
          { value: 'unpaid', label: 'Unpaid' },
          { value: 'paid', label: 'Paid' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'disputed', label: 'Disputed' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
      />
    </div>

    <div>
      <Text size="xs" fw={500} className="text-text-500 mb-1">Due Date From</Text>
      <input type="date" value={downloadFrom}
        onChange={e => setDownloadFrom(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
    </div>

    <div>
      <Text size="xs" fw={500} className="text-text-500 mb-1">Due Date To</Text>
      <input type="date" value={downloadTo}
        onChange={e => setDownloadTo(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
    </div>

    {/* preview of what will be included */}
    <div className="bg-gray-50 rounded-xl p-3">
      <Text size="xs" className="text-text-300">
        Will include:{' '}
        <span className="font-semibold text-text-500">
          {downloadStatus ? downloadStatus : 'all statuses'}
        </span>
        {downloadFrom && ` · from ${downloadFrom}`}
        {downloadTo && ` · to ${downloadTo}`}
      </Text>
    </div>

    <Button fullWidth radius="md"
      loading={downloading === -1}
      onClick={handleDownloadAll}
      className="bg-primary-500 hover:bg-primary-600">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="white" strokeWidth="2" className="mr-2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Download PDF
    </Button>
  </Stack>
</Modal>



    </div>
  )
}






