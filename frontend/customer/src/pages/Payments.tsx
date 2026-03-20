// import { useEffect, useState } from 'react'
// import { Paper, Title, Text, Badge, Table, Stack, Skeleton, Alert, Button, Modal } from '@mantine/core'
// import api from '../utils/api'
// import { getCustomer } from '../utils/auth'

// export default function Payments() {
//   const customer = getCustomer()
//   const [payments, setPayments] = useState<any[]>([])
//   const [invoices, setInvoices] = useState<any[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [payModal, setPayModal] = useState(false)
//   const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
//   const [phone, setPhone] = useState(customer?.phone || '')
//   const [sending, setSending] = useState(false)
//   const [payError, setPayError] = useState('')
//   const [paySuccess, setPaySuccess] = useState(false)

//   const load = async () => {
//     try {
//       const [payRes, invRes] = await Promise.all([
//         api.get(`/payments/customer/${customer.id}`),
//         api.get(`/invoices/customer/${customer.id}`)
//       ])
//       setPayments(payRes.data.data)
//       setInvoices(invRes.data.data.filter((i: any) =>
//         ['unpaid', 'overdue'].includes(i.status)
//       ))
//     } catch {
//       setError('Failed to load payments')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => { load() }, [])

//   const handlePay = async () => {
//     if (!selectedInvoice || !phone) {
//       setPayError('Please select an invoice and confirm your phone number')
//       return
//     }
//     setSending(true)
//     setPayError('')
//     try {
//       await api.post('/payments/mpesa/initiate', {
//         invoice_id: selectedInvoice.id,
//         phone: String(phone).replace(/\D/g, '').replace(/^0/, '254')
//       })
//       setPaySuccess(true)
//       load()
//     } catch (err: any) {
//       setPayError(err.response?.data?.message || 'Failed to send payment prompt')
//     } finally {
//       setSending(false)
//     }
//   }

//   const resetModal = () => {
//     setPayModal(false)
//     setSelectedInvoice(null)
//     setPhone(customer?.phone || '')
//     setPayError('')
//     setPaySuccess(false)
//   }

//   const METHOD_COLORS: Record<string, string> = {
//     mpesa: 'teal', bank_transfer: 'blue', cash: 'violet'
//   }

//   return (
//     <div className="p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <Title order={3} className="text-text-700 font-bold">Payments</Title>
//           <Text size="sm" className="text-text-300 mt-1">Your payment history</Text>
//         </div>
//         {invoices.length > 0 && (
//           <Button radius="md" onClick={() => setPayModal(true)}
//             className="bg-primary-500 hover:bg-primary-600">
//             Pay Now
//           </Button>
//         )}
//       </div>

//       {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

//       <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
//         {loading ? (
//           <Stack p="md" gap="sm">
//             {[...Array(4)].map((_, i) => <Skeleton key={i} height={50} radius="md" />)}
//           </Stack>
//         ) : payments.length === 0 ? (
//           <div className="text-center py-12">
//             <Text size="sm" className="text-text-300">No payments yet</Text>
//           </div>
//         ) : (
//           <div className="table-responsive">
//             <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
//               <Table.Thead>
//                 <Table.Tr className="bg-gray-50">
//                   <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Invoice</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Amount</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Method</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Reference</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
//                 </Table.Tr>
//               </Table.Thead>
//               <Table.Tbody>
//                 {payments.map(p => (
//                   <Table.Tr key={p.id}>
//                     <Table.Td className="text-text-400 text-sm">
//                       {new Date(p.payment_date).toLocaleDateString()}
//                     </Table.Td>
//                     <Table.Td className="text-text-400 text-sm">{p.invoices?.invoice_no}</Table.Td>
//                     <Table.Td className="text-text-600 font-semibold text-sm">
//                       KES {Number(p.amount).toLocaleString()}
//                     </Table.Td>
//                     <Table.Td>
//                       <Badge size="sm" radius="sm" variant="light"
//                         color={METHOD_COLORS[p.method] || 'gray'}>
//                         {p.method.replace('_', ' ')}
//                       </Badge>
//                     </Table.Td>
//                     <Table.Td className="text-text-300 text-sm">
//                       {p.mpesa_ref || p.bank_ref || '—'}
//                     </Table.Td>
//                     <Table.Td>
//                       <Badge size="sm" radius="sm" variant="light"
//                         color={p.status === 'completed' ? 'green' : p.status === 'failed' ? 'red' : 'yellow'}>
//                         {p.status}
//                       </Badge>
//                     </Table.Td>
//                   </Table.Tr>
//                 ))}
//               </Table.Tbody>
//             </Table>
//           </div>
//         )}
//       </Paper>

//       {/* Pay Now Modal */}
//       <Modal opened={payModal} onClose={resetModal}
//         title={<Text fw={600} className="text-text-600">Pay with M-Pesa</Text>}
//         radius="lg" size="sm">

//         {paySuccess ? (
//           <Stack align="center" gap="md" py="md">
//             <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
//               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
//                 <polyline points="20 6 9 17 4 12" />
//               </svg>
//             </div>
//             <Text fw={600} className="text-text-700">Payment Prompt Sent</Text>
//             <Text size="sm" className="text-text-400 text-center">
//               Check your phone {phone} for the M-Pesa payment prompt.
//             </Text>
//             <Button fullWidth radius="md" onClick={resetModal}
//               className="bg-primary-500 hover:bg-primary-600">Done</Button>
//           </Stack>
//         ) : (
//           <Stack gap="md">
//             {payError && <Alert color="red" radius="md" variant="light">{payError}</Alert>}

//             <div>
//               <Text size="sm" fw={500} className="text-text-500 mb-2">Select Invoice to Pay</Text>
//               <Stack gap="xs">
//                 {invoices.map(inv => (
//                   <button key={inv.id} onClick={() => setSelectedInvoice(inv)}
//                     className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
//                       selectedInvoice?.id === inv.id
//                         ? 'border-primary-500 bg-primary-50'
//                         : 'border-gray-200 hover:border-primary-300'
//                     }`}>
//                     <div className="flex justify-between items-center">
//                       <div>
//                         <Text size="sm" fw={600} className="text-text-600">{inv.invoice_no}</Text>
//                         <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
//                       </div>
//                       <Text size="sm" fw={700} className="text-primary-600">
//                         KES {Number(inv.total_amount).toLocaleString()}
//                       </Text>
//                     </div>
//                   </button>
//                 ))}
//               </Stack>
//             </div>

//             {selectedInvoice && (
//               <div>
//                 <label className="block text-sm font-medium text-text-500 mb-1">
//                   M-Pesa Phone Number
//                 </label>
//                 <input type="text" value={phone}
//                   onChange={e => setPhone(e.target.value)}
//                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//                 />
//                 <Text size="xs" className="text-text-300 mt-1">
//                   Pre-filled from your account. Change if needed.
//                 </Text>
//               </div>
//             )}

//             <Button fullWidth radius="md" loading={sending}
//               disabled={!selectedInvoice || !phone}
//               onClick={handlePay}
//               className="bg-primary-500 hover:bg-primary-600">
//               Send M-Pesa Prompt
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

export default function Payments() {
  const customer = getCustomer()
  const [payments, setPayments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payModal, setPayModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [phone, setPhone] = useState(customer?.phone || '')
  const [sending, setSending] = useState(false)
  const [payError, setPayError] = useState('')
  const [paySuccess, setPaySuccess] = useState(false)

  const load = async () => {
    try {
      const [payRes, invRes] = await Promise.all([
        api.get(`/payments/customer/${customer.id}`),
        api.get(`/invoices/customer/${customer.id}`)
      ])
      setPayments(payRes.data.data)
      setInvoices(invRes.data.data.filter((i: any) =>
        ['unpaid', 'overdue'].includes(i.status)
      ))
    } catch {
      setError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handlePay = async () => {
    if (!selectedInvoice || !phone) {
      setPayError('Please select an invoice and confirm your phone number')
      return
    }
    setSending(true)
    setPayError('')
    try {
      const cleaned = String(phone).replace(/\D/g, '')
      const formatted = cleaned.startsWith('254')
        ? cleaned
        : cleaned.startsWith('0')
          ? `254${cleaned.slice(1)}`
          : `254${cleaned}`

      await api.post('/payments/mpesa/initiate', {
        invoice_id: selectedInvoice.id,
        phone: formatted
      })
      setPaySuccess(true)
      load()
    } catch (err: any) {
      setPayError(err.response?.data?.message || 'Failed to send payment prompt')
    } finally {
      setSending(false)
    }
  }

  const resetModal = () => {
    setPayModal(false)
    setSelectedInvoice(null)
    setPhone(customer?.phone || '')
    setPayError('')
    setPaySuccess(false)
  }

  const METHOD_COLORS: Record<string, string> = {
    mpesa: 'teal', bank_transfer: 'blue', cash: 'violet'
  }

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <Title order={3} className="text-text-700 font-bold text-lg">Payments</Title>
          <Text size="xs" className="text-text-300 mt-0.5">Your payment history</Text>
        </div>
        {invoices.length > 0 && (
          <Button radius="md" size="sm" onClick={() => setPayModal(true)}
            className="bg-primary-500 hover:bg-primary-600">
            Pay Now
          </Button>
        )}
      </div>

      {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

      {loading ? (
        <Stack gap="sm">
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={80} radius="lg" />)}
        </Stack>
      ) : payments.length === 0 ? (
        <Paper shadow="xs" radius="lg" p="xl" className="bg-white text-center">
          <Text size="sm" className="text-text-300">No payments yet</Text>
          {invoices.length > 0 && (
            <Button size="sm" radius="md" mt="md" onClick={() => setPayModal(true)}
              className="bg-primary-500 hover:bg-primary-600">
              Make a Payment
            </Button>
          )}
        </Paper>
      ) : (
        <Stack gap="sm">
          {payments.map(p => (
            <Paper key={p.id} shadow="xs" radius="lg" p="md" className="bg-white">
              <div className="flex items-start justify-between">
                <div className="min-w-0 mr-3">
                  <Text size="sm" fw={700} className="text-text-700">
                    {p.invoices?.invoice_no || '—'}
                  </Text>
                  <Text size="xs" className="text-text-300 mt-0.5">
                    {new Date(p.payment_date).toLocaleDateString()}
                  </Text>
                  {(p.mpesa_ref || p.bank_ref) && (
                    <Text size="xs" className="text-text-200 mt-0.5 font-mono">
                      Ref: {p.mpesa_ref || p.bank_ref}
                    </Text>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <Text size="sm" fw={700} className="text-text-700">
                    KES {Number(p.amount).toLocaleString()}
                  </Text>
                  <div className="flex gap-1 justify-end mt-1 flex-wrap">
                    <Badge size="xs" radius="sm" variant="light"
                      color={METHOD_COLORS[p.method] || 'gray'}>
                      {p.method.replace('_', ' ')}
                    </Badge>
                    <Badge size="xs" radius="sm" variant="light"
                      color={p.status === 'completed' ? 'green' : p.status === 'failed' ? 'red' : 'yellow'}>
                      {p.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Pay Modal */}
      <Modal opened={payModal} onClose={resetModal}
        title={<Text fw={600} size="sm" className="text-text-600">Pay with M-Pesa</Text>}
        radius="lg" size="sm">

        {paySuccess ? (
          <Stack align="center" gap="md" py="md">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <Text fw={600} className="text-text-700">Payment Prompt Sent</Text>
            <Text size="sm" className="text-text-400 text-center">
              Check your phone for the M-Pesa payment prompt.
            </Text>
            <Button fullWidth radius="md" onClick={resetModal}
              className="bg-primary-500 hover:bg-primary-600">Done</Button>
          </Stack>
        ) : (
          <Stack gap="md">
            {payError && (
              <Alert color="red" radius="md" variant="light">{payError}</Alert>
            )}

            <div>
              <Text size="sm" fw={500} className="text-text-500 mb-2">Select Invoice</Text>
              <Stack gap="xs">
                {invoices.map(inv => (
                  <button key={inv.id} onClick={() => setSelectedInvoice(inv)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                      selectedInvoice?.id === inv.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <Text size="sm" fw={600} className="text-text-600">{inv.invoice_no}</Text>
                        <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
                      </div>
                      <Text size="sm" fw={700} className="text-primary-600">
                        KES {Number(inv.total_amount).toLocaleString()}
                      </Text>
                    </div>
                  </button>
                ))}
              </Stack>
            </div>

            {selectedInvoice && (
              <div>
                <label className="block text-sm font-medium text-text-500 mb-1">
                  M-Pesa Phone Number
                </label>
                <input type="tel" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
                <Text size="xs" className="text-text-300 mt-1">
                  Pre-filled from your account. Change if needed.
                </Text>
              </div>
            )}

            {selectedInvoice && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex justify-between">
                  <Text size="xs" className="text-text-300">Invoice</Text>
                  <Text size="xs" fw={600} className="text-text-600">{selectedInvoice.invoice_no}</Text>
                </div>
                <div className="flex justify-between mt-1">
                  <Text size="xs" className="text-text-300">Amount</Text>
                  <Text size="xs" fw={700} className="text-primary-600">
                    KES {Number(selectedInvoice.total_amount).toLocaleString()}
                  </Text>
                </div>
              </div>
            )}

            <Button fullWidth radius="md" size="md" loading={sending}
              disabled={!selectedInvoice || !phone}
              onClick={handlePay}
              className="bg-primary-500 hover:bg-primary-600">
              Send M-Pesa Prompt
            </Button>
          </Stack>
        )}
      </Modal>
    </div>
  )
}
