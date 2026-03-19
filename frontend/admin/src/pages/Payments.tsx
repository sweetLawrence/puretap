// import { useEffect, useState } from 'react'
// import {
//   Paper, Title, Text, Select, Button, Badge, Modal,
//   Table, Group, Stack, Alert, Skeleton, Tabs
// } from '@mantine/core'
// import api from '../utils/api'

// interface Payment {
//   id: number
//   invoice_id: number
//   customer_id: number
//   amount: number
//   method: string
//   status: string
//   mpesa_ref: string
//   mpesa_phone: string
//   bank_ref: string
//   payment_date: string
//   customers: { full_name: string; account_no: string }
//   invoices: { invoice_no: string; total_amount: number }
// }

// const STATUS_COLORS: Record<string, string> = {
//   pending: 'yellow', completed: 'green',
//   failed: 'red', reversed: 'gray'
// }

// const METHOD_COLORS: Record<string, string> = {
//   mpesa: 'teal', bank_transfer: 'blue', cash: 'violet'
// }

// export default function Payments() {
//   const [payments, setPayments] = useState<Payment[]>([])
//   const [filtered, setFiltered] = useState<Payment[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [methodFilter, setMethodFilter] = useState<string | null>(null)
//   const [statusFilter, setStatusFilter] = useState<string | null>(null)

//   // manual payment modal
//   const [manualModal, setManualModal] = useState(false)
//   const [manualForm, setManualForm] = useState({
//     invoice_id: '', amount: '', method: 'cash', bank_ref: ''
//   })
//   const [manualSaving, setManualSaving] = useState(false)
//   const [manualError, setManualError] = useState('')

//   // mpesa modal
//   const [mpesaModal, setMpesaModal] = useState(false)
//   const [mpesaForm, setMpesaForm] = useState({ invoice_id: '', phone: '' })
//   const [mpesaSending, setMpesaSending] = useState(false)
//   const [mpesaError, setMpesaError] = useState('')

//   const load = async () => {
//     try {
//       const res = await api.get('/payments')
//       setPayments(res.data.data)
//       setFiltered(res.data.data)
//     } catch {
//       setError('Failed to load payments')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => { load() }, [])

//   useEffect(() => {
//     let data = [...payments]
//     if (methodFilter) data = data.filter(p => p.method === methodFilter)
//     if (statusFilter) data = data.filter(p => p.status === statusFilter)
//     setFiltered(data)
//   }, [methodFilter, statusFilter, payments])

//   const handleManual = async () => {
//     if (!manualForm.invoice_id || !manualForm.amount) {
//       setManualError('Invoice ID and amount are required')
//       return
//     }
//     setManualSaving(true)
//     setManualError('')
//     try {
//       await api.post('/payments/manual', {
//         invoice_id: Number(manualForm.invoice_id),
//         amount: Number(manualForm.amount),
//         method: manualForm.method,
//         bank_ref: manualForm.bank_ref || undefined
//       })
//       setManualModal(false)
//       setManualForm({ invoice_id: '', amount: '', method: 'cash', bank_ref: '' })
//       load()
//     } catch (err: any) {
//       setManualError(err.response?.data?.message || 'Failed to record payment')
//     } finally {
//       setManualSaving(false)
//     }
//   }

//   const handleMpesa = async () => {
//     if (!mpesaForm.invoice_id || !mpesaForm.phone) {
//       setMpesaError('Invoice ID and phone are required')
//       return
//     }
//     setMpesaSending(true)
//     setMpesaError('')
//     try {
//       await api.post('/payments/mpesa/initiate', {
//         invoice_id: Number(mpesaForm.invoice_id),
//         phone: mpesaForm.phone
//       })
//       setMpesaModal(false)
//       setMpesaForm({ invoice_id: '', phone: '' })
//       alert('STK push sent to customer phone')
//     } catch (err: any) {
//       setMpesaError(err.response?.data?.message || 'Failed to initiate payment')
//     } finally {
//       setMpesaSending(false)
//     }
//   }

//   return (
//     <div className="p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <Title order={3} className="text-text-700 font-bold">Payments</Title>
//           <Text size="sm" className="text-text-300 mt-1">Track and record payments</Text>
//         </div>
//         <Group gap="sm">
//           <Button radius="md" variant="outline"
//             onClick={() => { setMpesaError(''); setMpesaModal(true) }}
//             className="border-primary-500 text-primary-600">
//             M-Pesa STK Push
//           </Button>
//           <Button radius="md"
//             onClick={() => { setManualError(''); setManualModal(true) }}
//             className="bg-primary-500 hover:bg-primary-600">
//             + Record Payment
//           </Button>
//         </Group>
//       </div>

//       <Paper shadow="xs" radius="lg" p="md" className="bg-white mb-4">
//         <Group gap="md" wrap="wrap">
//           <Select placeholder="Method" value={methodFilter}
//             onChange={setMethodFilter} clearable radius="md" w={160}
//             data={[
//               { value: 'mpesa', label: 'M-Pesa' },
//               { value: 'bank_transfer', label: 'Bank Transfer' },
//               { value: 'cash', label: 'Cash' }
//             ]} />
//           <Select placeholder="Status" value={statusFilter}
//             onChange={setStatusFilter} clearable radius="md" w={160}
//             data={[
//               { value: 'pending', label: 'Pending' },
//               { value: 'completed', label: 'Completed' },
//               { value: 'failed', label: 'Failed' },
//               { value: 'reversed', label: 'Reversed' }
//             ]} />
//         </Group>
//       </Paper>

//       <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
//         {loading ? (
//           <Stack p="md" gap="sm">
//             {[...Array(5)].map((_, i) => <Skeleton key={i} height={40} radius="md" />)}
//           </Stack>
//         ) : error ? (
//           <Alert color="red" m="md" radius="md" variant="light">{error}</Alert>
//         ) : (
//           <div className="table-responsive">
//             <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
//               <Table.Thead>
//                 <Table.Tr className="bg-gray-50">
//                   <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Customer</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Invoice</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Amount</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Method</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Reference</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
//                 </Table.Tr>
//               </Table.Thead>
//               <Table.Tbody>
//                 {filtered.length === 0 ? (
//                   <Table.Tr>
//                     <Table.Td colSpan={7} className="text-center text-text-300 py-8">
//                       No payments found
//                     </Table.Td>
//                   </Table.Tr>
//                 ) : filtered.map(p => (
//                   <Table.Tr key={p.id}>
//                     <Table.Td className="text-text-400 text-sm">
//                       {new Date(p.payment_date).toLocaleDateString()}
//                     </Table.Td>
//                     <Table.Td>
//                       <Text size="sm" className="text-text-500">{p.customers?.full_name}</Text>
//                       <Text size="xs" className="text-text-300">{p.customers?.account_no}</Text>
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
//                         color={STATUS_COLORS[p.status] || 'gray'}>
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

//       {/* Manual Payment Modal */}
//       <Modal opened={manualModal} onClose={() => setManualModal(false)}
//         title={<Text fw={600} className="text-text-600">Record Manual Payment</Text>}
//         radius="lg" size="sm">
//         <Stack gap="sm">
//           {manualError && <Alert color="red" radius="md" variant="light">{manualError}</Alert>}
//           <TextInput label="Invoice ID" placeholder="e.g. 4" value={manualForm.invoice_id}
//             onChange={e => setManualForm({ ...manualForm, invoice_id: e.target.value })} />
//           <TextInput label="Amount (KES)" placeholder="e.g. 420" value={manualForm.amount}
//             onChange={e => setManualForm({ ...manualForm, amount: e.target.value })} />
//           <Select label="Method" radius="md" value={manualForm.method}
//             onChange={val => setManualForm({ ...manualForm, method: val || 'cash' })}
//             data={[
//               { value: 'cash', label: 'Cash' },
//               { value: 'bank_transfer', label: 'Bank Transfer' }
//             ]} />
//           {manualForm.method === 'bank_transfer' && (
//             <TextInput label="Bank Reference" placeholder="BTR-2026-001" value={manualForm.bank_ref}
//               onChange={e => setManualForm({ ...manualForm, bank_ref: e.target.value })} />
//           )}
//           <Button fullWidth radius="md" loading={manualSaving} onClick={handleManual}
//             className="bg-primary-500 hover:bg-primary-600 mt-2">
//             Record Payment
//           </Button>
//         </Stack>
//       </Modal>

//       {/* M-Pesa Modal */}
//       <Modal opened={mpesaModal} onClose={() => setMpesaModal(false)}
//         title={<Text fw={600} className="text-text-600">Send M-Pesa STK Push</Text>}
//         radius="lg" size="sm">
//         <Stack gap="sm">
//           {mpesaError && <Alert color="red" radius="md" variant="light">{mpesaError}</Alert>}
//           <Text size="sm" className="text-text-400">
//             The customer will receive a payment prompt on their phone.
//           </Text>
//           <TextInput label="Invoice ID" placeholder="e.g. 9" value={mpesaForm.invoice_id}
//             onChange={e => setMpesaForm({ ...mpesaForm, invoice_id: e.target.value })} />
//           <TextInput label="Phone Number" placeholder="+254700000000" value={mpesaForm.phone}
//             onChange={e => setMpesaForm({ ...mpesaForm, phone: e.target.value })} />
//           <Button fullWidth radius="md" loading={mpesaSending} onClick={handleMpesa}
//             className="bg-primary-500 hover:bg-primary-600 mt-2">
//             Send STK Push
//           </Button>
//         </Stack>
//       </Modal>
//     </div>
//   )
// }

// function TextInput({ label, placeholder, value, onChange }: any) {
//   return (
//     <div>
//       <label className="block text-sm font-medium text-text-500 mb-1">{label}</label>
//       <input type="text" placeholder={placeholder} value={value} onChange={onChange}
//         className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300" />
//     </div>
//   )
// }
























import { useEffect, useState } from 'react'
import {
  Paper, Title, Text, Select, Button, Badge, Modal,
  Table, Group, Stack, Alert, Skeleton
} from '@mantine/core'
import api from '../utils/api'

interface Payment {
  id: number
  invoice_id: number
  customer_id: number
  amount: number
  method: string
  status: string
  mpesa_ref: string
  mpesa_phone: string
  bank_ref: string
  payment_date: string
  customers: { full_name: string; account_no: string }
  invoices: { invoice_no: string; total_amount: number }
}

interface ManualFormData {
  invoice_id: string
  amount: string
  method: string
  bank_ref: string
}

interface MpesaFormData {
  invoice_id: string
  phone: string
}

// Props interface for custom TextInput
interface TextInputProps {
  label: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}

// Custom TextInput component
const CustomTextInput = ({ label, placeholder, value, onChange }: TextInputProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-text-500 mb-1">{label}</label>
      <input 
        type="text" 
        placeholder={placeholder} 
        value={value} 
        onChange={onChange}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300" 
      />
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow', 
  completed: 'green',
  failed: 'red', 
  reversed: 'gray'
}

const METHOD_COLORS: Record<string, string> = {
  mpesa: 'teal', 
  bank_transfer: 'blue', 
  cash: 'violet'
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filtered, setFiltered] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [methodFilter, setMethodFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // manual payment modal
  const [manualModal, setManualModal] = useState(false)
  const [manualForm, setManualForm] = useState<ManualFormData>({
    invoice_id: '', 
    amount: '', 
    method: 'cash', 
    bank_ref: ''
  })
  const [manualSaving, setManualSaving] = useState(false)
  const [manualError, setManualError] = useState('')

  // mpesa modal
  const [mpesaModal, setMpesaModal] = useState(false)
  const [mpesaForm, setMpesaForm] = useState<MpesaFormData>({ 
    invoice_id: '', 
    phone: '' 
  })
  const [mpesaSending, setMpesaSending] = useState(false)
  const [mpesaError, setMpesaError] = useState('')

  const load = async () => {
    try {
      const res = await api.get('/payments')
      setPayments(res.data.data)
      setFiltered(res.data.data)
    } catch {
      setError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = [...payments]
    if (methodFilter) data = data.filter(p => p.method === methodFilter)
    if (statusFilter) data = data.filter(p => p.status === statusFilter)
    setFiltered(data)
  }, [methodFilter, statusFilter, payments])

  const handleManual = async () => {
    if (!manualForm.invoice_id || !manualForm.amount) {
      setManualError('Invoice ID and amount are required')
      return
    }
    setManualSaving(true)
    setManualError('')
    try {
      await api.post('/payments/manual', {
        invoice_id: Number(manualForm.invoice_id),
        amount: Number(manualForm.amount),
        method: manualForm.method,
        bank_ref: manualForm.bank_ref || undefined
      })
      setManualModal(false)
      setManualForm({ invoice_id: '', amount: '', method: 'cash', bank_ref: '' })
      load()
    } catch (err: any) {
      setManualError(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setManualSaving(false)
    }
  }

  const handleMpesa = async () => {
    if (!mpesaForm.invoice_id || !mpesaForm.phone) {
      setMpesaError('Invoice ID and phone are required')
      return
    }
    setMpesaSending(true)
    setMpesaError('')
    try {
      await api.post('/payments/mpesa/initiate', {
        invoice_id: Number(mpesaForm.invoice_id),
        phone: mpesaForm.phone
      })
      setMpesaModal(false)
      setMpesaForm({ invoice_id: '', phone: '' })
      alert('STK push sent to customer phone')
    } catch (err: any) {
      setMpesaError(err.response?.data?.message || 'Failed to initiate payment')
    } finally {
      setMpesaSending(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title order={3} className="text-text-700 font-bold">Payments</Title>
          <Text size="sm" className="text-text-300 mt-1">Track and record payments</Text>
        </div>
        <Group gap="sm">
          <Button radius="md" variant="outline"
            onClick={() => { setMpesaError(''); setMpesaModal(true) }}
            className="border-primary-500 text-primary-600">
            M-Pesa STK Push
          </Button>
          <Button radius="md"
            onClick={() => { setManualError(''); setManualModal(true) }}
            className="bg-primary-500 hover:bg-primary-600">
            + Record Payment
          </Button>
        </Group>
      </div>

      <Paper shadow="xs" radius="lg" p="md" className="bg-white mb-4">
        <Group gap="md" wrap="wrap">
          <Select 
            placeholder="Method" 
            value={methodFilter}
            onChange={setMethodFilter} 
            clearable 
            radius="md" 
            w={160}
            data={[
              { value: 'mpesa', label: 'M-Pesa' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'cash', label: 'Cash' }
            ]} 
          />
          <Select 
            placeholder="Status" 
            value={statusFilter}
            onChange={setStatusFilter} 
            clearable 
            radius="md" 
            w={160}
            data={[
              { value: 'pending', label: 'Pending' },
              { value: 'completed', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
              { value: 'reversed', label: 'Reversed' }
            ]} 
          />
        </Group>
      </Paper>

      <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
        {loading ? (
          <Stack p="md" gap="sm">
            {[...Array(5)].map((_, i) => <Skeleton key={i} height={40} radius="md" />)}
          </Stack>
        ) : error ? (
          <Alert color="red" m="md" radius="md" variant="light">{error}</Alert>
        ) : (
          <div className="table-responsive">
            <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
              <Table.Thead>
                <Table.Tr className="bg-gray-50">
                  <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Customer</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Invoice</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Amount</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Method</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Reference</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7} className="text-center text-text-300 py-8">
                      No payments found
                    </Table.Td>
                  </Table.Tr>
                ) : filtered.map(p => (
                  <Table.Tr key={p.id}>
                    <Table.Td className="text-text-400 text-sm">
                      {new Date(p.payment_date).toLocaleDateString()}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" className="text-text-500">{p.customers?.full_name}</Text>
                      <Text size="xs" className="text-text-300">{p.customers?.account_no}</Text>
                    </Table.Td>
                    <Table.Td className="text-text-400 text-sm">{p.invoices?.invoice_no}</Table.Td>
                    <Table.Td className="text-text-600 font-semibold text-sm">
                      KES {Number(p.amount).toLocaleString()}
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" radius="sm" variant="light"
                        color={METHOD_COLORS[p.method] || 'gray'}>
                        {p.method.replace('_', ' ')}
                      </Badge>
                    </Table.Td>
                    <Table.Td className="text-text-300 text-sm">
                      {p.mpesa_ref || p.bank_ref || '—'}
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" radius="sm" variant="light"
                        color={STATUS_COLORS[p.status] || 'gray'}>
                        {p.status}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Paper>

      {/* Manual Payment Modal */}
      <Modal 
        opened={manualModal} 
        onClose={() => setManualModal(false)}
        title={<Text fw={600} className="text-text-600">Record Manual Payment</Text>}
        radius="lg" 
        size="sm"
      >
        <Stack gap="sm">
          {manualError && <Alert color="red" radius="md" variant="light">{manualError}</Alert>}
          
          <CustomTextInput 
            label="Invoice ID" 
            placeholder="e.g. 4" 
            value={manualForm.invoice_id}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setManualForm({ ...manualForm, invoice_id: e.target.value })
            } 
          />
          
          <CustomTextInput 
            label="Amount (KES)" 
            placeholder="e.g. 420" 
            value={manualForm.amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setManualForm({ ...manualForm, amount: e.target.value })
            } 
          />
          
          <Select 
            label="Method" 
            radius="md" 
            value={manualForm.method}
            onChange={(val) => setManualForm({ ...manualForm, method: val || 'cash' })}
            data={[
              { value: 'cash', label: 'Cash' },
              { value: 'bank_transfer', label: 'Bank Transfer' }
            ]} 
          />
          
          {manualForm.method === 'bank_transfer' && (
            <CustomTextInput 
              label="Bank Reference" 
              placeholder="BTR-2026-001" 
              value={manualForm.bank_ref}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                setManualForm({ ...manualForm, bank_ref: e.target.value })
              } 
            />
          )}
          
          <Button 
            fullWidth 
            radius="md" 
            loading={manualSaving} 
            onClick={handleManual}
            className="bg-primary-500 hover:bg-primary-600 mt-2"
          >
            Record Payment
          </Button>
        </Stack>
      </Modal>

      {/* M-Pesa Modal */}
      <Modal 
        opened={mpesaModal} 
        onClose={() => setMpesaModal(false)}
        title={<Text fw={600} className="text-text-600">Send M-Pesa STK Push</Text>}
        radius="lg" 
        size="sm"
      >
        <Stack gap="sm">
          {mpesaError && <Alert color="red" radius="md" variant="light">{mpesaError}</Alert>}
          
          <Text size="sm" className="text-text-400">
            The customer will receive a payment prompt on their phone.
          </Text>
          
          <CustomTextInput 
            label="Invoice ID" 
            placeholder="e.g. 9" 
            value={mpesaForm.invoice_id}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setMpesaForm({ ...mpesaForm, invoice_id: e.target.value })
            } 
          />
          
          <CustomTextInput 
            label="Phone Number" 
            placeholder="+254700000000" 
            value={mpesaForm.phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
              setMpesaForm({ ...mpesaForm, phone: e.target.value })
            } 
          />
          
          <Button 
            fullWidth 
            radius="md" 
            loading={mpesaSending} 
            onClick={handleMpesa}
            className="bg-primary-500 hover:bg-primary-600 mt-2"
          >
            Send STK Push
          </Button>
        </Stack>
      </Modal>
    </div>
  )
}