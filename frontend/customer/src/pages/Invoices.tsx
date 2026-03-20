// import { useEffect, useState } from 'react'
// import { Paper, Title, Text, Badge, Table, Stack, Skeleton, Alert, Button, Modal } from '@mantine/core'
// import api from '../utils/api'
// import { getCustomer } from '../utils/auth'

// const STATUS_COLORS: Record<string, string> = {
//   unpaid: 'yellow', paid: 'green', overdue: 'red',
//   disputed: 'orange', cancelled: 'gray'
// }

// export default function Invoices() {
//   const customer = getCustomer()
//   const [invoices, setInvoices] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [selected, setSelected] = useState<any>(null)
//   const [downloading, setDownloading] = useState<number | null>(null)

//   useEffect(() => {
//     const load = async () => {
//       try {
//         const res = await api.get(`/invoices/customer/${customer.id}`)
//         setInvoices(res.data.data)
//       } catch {
//         setError('Failed to load invoices')
//       } finally {
//         setLoading(false)
//       }
//     }
//     load()
//   }, [])

//   const handleDownload = async (invoiceId: number, invoiceNo: string) => {
//     setDownloading(invoiceId)
//     try {
//       const res = await api.get(`/invoices/${invoiceId}/download`, {
//         responseType: 'blob'
//       })
//       const url = window.URL.createObjectURL(new Blob([res.data]))
//       const link = document.createElement('a')
//       link.href = url
//       link.setAttribute('download', `${invoiceNo}.pdf`)
//       document.body.appendChild(link)
//       link.click()
//       link.remove()
//       window.URL.revokeObjectURL(url)
//     } catch {
//       alert('Failed to download invoice')
//     } finally {
//       setDownloading(null)
//     }
//   }

//   return (
//     <div className="p-6">
//       <div className="mb-6">
//         <Title order={3} className="text-text-700 font-bold">My Invoices</Title>
//         <Text size="sm" className="text-text-300 mt-1">Your billing history</Text>
//       </div>

//       {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

//       <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
//         {loading ? (
//           <Stack p="md" gap="sm">
//             {[...Array(5)].map((_, i) => <Skeleton key={i} height={50} radius="md" />)}
//           </Stack>
//         ) : invoices.length === 0 ? (
//           <div className="text-center py-12">
//             <Text size="sm" className="text-text-300">No invoices found</Text>
//           </div>
//         ) : (
//           <div className="table-responsive">
//             <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
//               <Table.Thead>
//                 <Table.Tr className="bg-gray-50">
//                   <Table.Th className="text-text-400 text-xs uppercase">Invoice No</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Units</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Amount</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Due Date</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
//                 </Table.Tr>
//               </Table.Thead>
//               <Table.Tbody>
//                 {invoices.map(inv => (
//                   <Table.Tr key={inv.id}>
//                     <Table.Td className="text-text-600 font-semibold text-sm">{inv.invoice_no}</Table.Td>
//                     <Table.Td className="text-text-400 text-sm">{inv.units_consumed} m³</Table.Td>
//                     <Table.Td className="text-text-600 font-semibold text-sm">
//                       KES {Number(inv.total_amount).toLocaleString()}
//                     </Table.Td>
//                     <Table.Td className="text-text-400 text-sm">{inv.due_date}</Table.Td>
//                     <Table.Td>
//                       <Badge size="sm" radius="sm" variant="light"
//                         color={STATUS_COLORS[inv.status] || 'gray'}>
//                         {inv.status}
//                       </Badge>
//                     </Table.Td>
//                     <Table.Td>
//                       <div className="flex gap-2">
//                         <button onClick={() => setSelected(inv)}
//                           className="text-xs text-primary-500 underline">
//                           View
//                         </button>
//                         <button
//                           onClick={() => handleDownload(inv.id, inv.invoice_no)}
//                           disabled={downloading === inv.id}
//                           className="text-xs text-secondary-400 underline disabled:opacity-50">
//                           {downloading === inv.id ? 'Downloading...' : 'PDF'}
//                         </button>
//                       </div>
//                     </Table.Td>
//                   </Table.Tr>
//                 ))}
//               </Table.Tbody>
//             </Table>
//           </div>
//         )}
//       </Paper>

//       {/* Invoice detail modal */}
//       <Modal opened={!!selected} onClose={() => setSelected(null)}
//         title={<Text fw={600} className="text-text-600">{selected?.invoice_no}</Text>}
//         radius="lg" size="sm">
//         {selected && (
//           <Stack gap="sm">
//             <div className="bg-gray-50 rounded-xl p-4">
//               {[
//                 ['Billing Period', `${selected.billing_period_start} — ${selected.billing_period_end}`],
//                 ['Units Consumed', `${selected.units_consumed} m³`],
//                 ['Amount Due', `KES ${Number(selected.amount_due).toLocaleString()}`],
//                 ['Tax', `KES ${Number(selected.tax_amount).toLocaleString()}`],
//                 ['Total Amount', `KES ${Number(selected.total_amount).toLocaleString()}`],
//                 ['Due Date', selected.due_date],
//               ].map(([label, value]) => (
//                 <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0">
//                   <Text size="sm" className="text-text-300">{label}</Text>
//                   <Text size="sm" fw={600} className="text-text-600">{value}</Text>
//                 </div>
//               ))}
//             </div>
//             <Badge size="md" radius="md" variant="light"
//               color={STATUS_COLORS[selected.status] || 'gray'} className="self-start">
//               {selected.status}
//             </Badge>
//             <Button radius="md" loading={downloading === selected.id}
//               onClick={() => handleDownload(selected.id, selected.invoice_no)}
//               className="bg-primary-500 hover:bg-primary-600">
//               Download PDF
//             </Button>
//           </Stack>
//         )}
//       </Modal>
//     </div>
//   )
// }

















import { useEffect, useState } from 'react'
import { Paper, Title, Text, Badge, Stack, Skeleton, Alert, Button, Modal } from '@mantine/core'
import api from '../utils/api'
import { getCustomer } from '../utils/auth'

const STATUS_COLORS: Record<string, string> = {
  unpaid: 'yellow', paid: 'green', overdue: 'red',
  disputed: 'orange', cancelled: 'gray'
}

export default function Invoices() {
  const customer = getCustomer()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [downloading, setDownloading] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/invoices/customer/${customer.id}`)
        setInvoices(res.data.data)
      } catch {
        setError('Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDownload = async (invoiceId: number, invoiceNo: string) => {
    setDownloading(invoiceId)
    try {
      const res = await api.get(`/invoices/${invoiceId}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${invoiceNo}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Failed to download invoice')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="p-4 pb-8">
      <div className="mb-5">
        <Title order={3} className="text-text-700 font-bold text-lg">My Invoices</Title>
        <Text size="xs" className="text-text-300 mt-0.5">Your billing history</Text>
      </div>

      {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

      {loading ? (
        <Stack gap="sm">
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={80} radius="lg" />)}
        </Stack>
      ) : invoices.length === 0 ? (
        <Paper shadow="xs" radius="lg" p="xl" className="bg-white text-center">
          <Text size="sm" className="text-text-300">No invoices found</Text>
        </Paper>
      ) : (
        <Stack gap="sm">
          {invoices.map(inv => (
            <Paper key={inv.id} shadow="xs" radius="lg" p="md" className="bg-white"
              onClick={() => setSelected(inv)}
              style={{ cursor: 'pointer' }}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 mr-3">
                  <Text size="sm" fw={700} className="text-text-700">{inv.invoice_no}</Text>
                  <Text size="xs" className="text-text-300 mt-0.5">
                    {inv.units_consumed} m³ · Due {inv.due_date}
                  </Text>
                </div>
                <div className="text-right flex-shrink-0">
                  <Text size="sm" fw={700} className="text-primary-600">
                    KES {Number(inv.total_amount).toLocaleString()}
                  </Text>
                  <Badge size="xs" radius="sm" variant="light"
                    color={STATUS_COLORS[inv.status] || 'gray'} mt={4}>
                    {inv.status}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-3 border-t border-gray-50">
                <button
                  onClick={e => { e.stopPropagation(); setSelected(inv) }}
                  className="text-xs text-primary-500 font-medium">
                  View Details
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleDownload(inv.id, inv.invoice_no)
                  }}
                  disabled={downloading === inv.id}
                  className="text-xs text-secondary-400 font-medium disabled:opacity-50">
                  {downloading === inv.id ? 'Downloading...' : 'Download PDF'}
                </button>
              </div>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Invoice detail modal */}
      <Modal opened={!!selected} onClose={() => setSelected(null)}
        title={<Text fw={600} size="sm" className="text-text-600">{selected?.invoice_no}</Text>}
        radius="lg" size="sm" fullScreen={false}>
        {selected && (
          <Stack gap="sm">
            <div className="bg-gray-50 rounded-xl p-4">
              {[
                ['Billing Period', `${selected.billing_period_start} — ${selected.billing_period_end}`],
                ['Units Consumed', `${selected.units_consumed} m³`],
                ['Amount Due', `KES ${Number(selected.amount_due).toLocaleString()}`],
                ['Tax', `KES ${Number(selected.tax_amount).toLocaleString()}`],
                ['Total Amount', `KES ${Number(selected.total_amount).toLocaleString()}`],
                ['Due Date', selected.due_date],
              ].map(([label, value]) => (
                <div key={label}
                  className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <Text size="xs" className="text-text-300">{label}</Text>
                  <Text size="xs" fw={600} className="text-text-600 text-right ml-4">{value}</Text>
                </div>
              ))}
            </div>
            <Badge size="sm" radius="md" variant="light"
              color={STATUS_COLORS[selected.status] || 'gray'} className="self-start">
              {selected.status}
            </Badge>
            <Button fullWidth radius="md" loading={downloading === selected.id}
              onClick={() => handleDownload(selected.id, selected.invoice_no)}
              className="bg-primary-500 hover:bg-primary-600">
              Download PDF
            </Button>
          </Stack>
        )}
      </Modal>
    </div>
  )
}
