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
























// import { useEffect, useState } from 'react'
// import {
//   Paper, Title, Text, Select, Button, Badge, Modal,
//   Table, Group, Stack, Alert, Skeleton
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

// interface ManualFormData {
//   invoice_id: string
//   amount: string
//   method: string
//   bank_ref: string
// }

// interface MpesaFormData {
//   invoice_id: string
//   phone: string
// }

// // Props interface for custom TextInput
// interface TextInputProps {
//   label: string
//   placeholder?: string
//   value: string
//   onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
//   disabled?: boolean
// }

// // Custom TextInput component
// const CustomTextInput = ({ label, placeholder, value, onChange }: TextInputProps) => {
//   return (
//     <div>
//       <label className="block text-sm font-medium text-text-500 mb-1">{label}</label>
//       <input 
//         type="text" 
//         placeholder={placeholder} 
//         value={value} 
//         onChange={onChange}
//         className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300" 
//       />
//     </div>
//   )
// }

// const STATUS_COLORS: Record<string, string> = {
//   pending: 'yellow', 
//   completed: 'green',
//   failed: 'red', 
//   reversed: 'gray'
// }

// const METHOD_COLORS: Record<string, string> = {
//   mpesa: 'teal', 
//   bank_transfer: 'blue', 
//   cash: 'violet'
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
//   const [manualForm, setManualForm] = useState<ManualFormData>({
//     invoice_id: '', 
//     amount: '', 
//     method: 'cash', 
//     bank_ref: ''
//   })
//   const [manualSaving, setManualSaving] = useState(false)
//   const [manualError, setManualError] = useState('')

//   // mpesa modal
//   const [mpesaModal, setMpesaModal] = useState(false)
//   const [mpesaForm, setMpesaForm] = useState<MpesaFormData>({ 
//     invoice_id: '', 
//     phone: '' 
//   })
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
//           <Select 
//             placeholder="Method" 
//             value={methodFilter}
//             onChange={setMethodFilter} 
//             clearable 
//             radius="md" 
//             w={160}
//             data={[
//               { value: 'mpesa', label: 'M-Pesa' },
//               { value: 'bank_transfer', label: 'Bank Transfer' },
//               { value: 'cash', label: 'Cash' }
//             ]} 
//           />
//           <Select 
//             placeholder="Status" 
//             value={statusFilter}
//             onChange={setStatusFilter} 
//             clearable 
//             radius="md" 
//             w={160}
//             data={[
//               { value: 'pending', label: 'Pending' },
//               { value: 'completed', label: 'Completed' },
//               { value: 'failed', label: 'Failed' },
//               { value: 'reversed', label: 'Reversed' }
//             ]} 
//           />
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
//       <Modal 
//         opened={manualModal} 
//         onClose={() => setManualModal(false)}
//         title={<Text fw={600} className="text-text-600">Record Manual Payment</Text>}
//         radius="lg" 
//         size="sm"
//       >
//         <Stack gap="sm">
//           {manualError && <Alert color="red" radius="md" variant="light">{manualError}</Alert>}
          
//           <CustomTextInput 
//             label="Invoice ID" 
//             placeholder="e.g. 4" 
//             value={manualForm.invoice_id}
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
//               setManualForm({ ...manualForm, invoice_id: e.target.value })
//             } 
//           />
          
//           <CustomTextInput 
//             label="Amount (KES)" 
//             placeholder="e.g. 420" 
//             value={manualForm.amount}
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
//               setManualForm({ ...manualForm, amount: e.target.value })
//             } 
//           />
          
//           <Select 
//             label="Method" 
//             radius="md" 
//             value={manualForm.method}
//             onChange={(val) => setManualForm({ ...manualForm, method: val || 'cash' })}
//             data={[
//               { value: 'cash', label: 'Cash' },
//               { value: 'bank_transfer', label: 'Bank Transfer' }
//             ]} 
//           />
          
//           {manualForm.method === 'bank_transfer' && (
//             <CustomTextInput 
//               label="Bank Reference" 
//               placeholder="BTR-2026-001" 
//               value={manualForm.bank_ref}
//               onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
//                 setManualForm({ ...manualForm, bank_ref: e.target.value })
//               } 
//             />
//           )}
          
//           <Button 
//             fullWidth 
//             radius="md" 
//             loading={manualSaving} 
//             onClick={handleManual}
//             className="bg-primary-500 hover:bg-primary-600 mt-2"
//           >
//             Record Payment
//           </Button>
//         </Stack>
//       </Modal>

//       {/* M-Pesa Modal */}
//       <Modal 
//         opened={mpesaModal} 
//         onClose={() => setMpesaModal(false)}
//         title={<Text fw={600} className="text-text-600">Send M-Pesa STK Push</Text>}
//         radius="lg" 
//         size="sm"
//       >
//         <Stack gap="sm">
//           {mpesaError && <Alert color="red" radius="md" variant="light">{mpesaError}</Alert>}
          
//           <Text size="sm" className="text-text-400">
//             The customer will receive a payment prompt on their phone.
//           </Text>
          
//           <CustomTextInput 
//             label="Invoice ID" 
//             placeholder="e.g. 9" 
//             value={mpesaForm.invoice_id}
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
//               setMpesaForm({ ...mpesaForm, invoice_id: e.target.value })
//             } 
//           />
          
//           <CustomTextInput 
//             label="Phone Number" 
//             placeholder="+254700000000" 
//             value={mpesaForm.phone}
//             onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
//               setMpesaForm({ ...mpesaForm, phone: e.target.value })
//             } 
//           />
          
//           <Button 
//             fullWidth 
//             radius="md" 
//             loading={mpesaSending} 
//             onClick={handleMpesa}
//             className="bg-primary-500 hover:bg-primary-600 mt-2"
//           >
//             Send STK Push
//           </Button>
//         </Stack>
//       </Modal>
//     </div>
//   )
// }

























// import { useEffect, useState } from 'react'
// import {
//   Paper, Title, Text, Select, Button, Badge, Modal,
//   Table, Group, Stack, Alert, Skeleton,
// } from '@mantine/core'
// import api from '../utils/api'

// interface Customer {
//   id: number
//   full_name: string
//   phone: string
//   account_no: string
// }

// interface Invoice {
//   id: number
//   invoice_no: string
//   total_amount: number
//   status: string
//   due_date: string
// }

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

//   // mpesa modal state
//   const [mpesaModal, setMpesaModal] = useState(false)
//   const [customerSearch, setCustomerSearch] = useState('')
//   const [customers, setCustomers] = useState<Customer[]>([])
//   const [customerLoading, setCustomerLoading] = useState(false)
//   const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
//   const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([])
//   const [invoicesLoading, setInvoicesLoading] = useState(false)
//   const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
//   const [paymentPhone, setPaymentPhone] = useState('')
//   const [mpesaSending, setMpesaSending] = useState(false)
//   const [mpesaError, setMpesaError] = useState('')
//   const [mpesaSuccess, setMpesaSuccess] = useState(false)

//   // manual modal state
//   const [manualModal, setManualModal] = useState(false)
//   const [manualCustomerSearch, setManualCustomerSearch] = useState('')
//   const [manualCustomers, setManualCustomers] = useState<Customer[]>([])
//   const [manualCustomerLoading, setManualCustomerLoading] = useState(false)
//   const [manualSelectedCustomer, setManualSelectedCustomer] = useState<Customer | null>(null)
//   const [manualInvoices, setManualInvoices] = useState<Invoice[]>([])
//   const [manualInvoicesLoading, setManualInvoicesLoading] = useState(false)
//   const [manualSelectedInvoice, setManualSelectedInvoice] = useState<Invoice | null>(null)
//   const [manualForm, setManualForm] = useState({ amount: '', method: 'cash', bank_ref: '' })
//   const [manualSaving, setManualSaving] = useState(false)
//   const [manualError, setManualError] = useState('')

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

//   // search customers for mpesa modal
//   useEffect(() => {
//     if (customerSearch.length < 2) { setCustomers([]); return }
//     const timeout = setTimeout(async () => {
//       setCustomerLoading(true)
//       try {
//         const res = await api.get(`/customers/search?q=${customerSearch}`)
//         setCustomers(res.data.data)
//       } catch { setCustomers([]) }
//       finally { setCustomerLoading(false) }
//     }, 400)
//     return () => clearTimeout(timeout)
//   }, [customerSearch])

//   // search customers for manual modal
//   useEffect(() => {
//     if (manualCustomerSearch.length < 2) { setManualCustomers([]); return }
//     const timeout = setTimeout(async () => {
//       setManualCustomerLoading(true)
//       try {
//         const res = await api.get(`/customers/search?q=${manualCustomerSearch}`)
//         setManualCustomers(res.data.data)
//       } catch { setManualCustomers([]) }
//       finally { setManualCustomerLoading(false) }
//     }, 400)
//     return () => clearTimeout(timeout)
//   }, [manualCustomerSearch])

//   const selectCustomer = async (customer: Customer) => {
//     setSelectedCustomer(customer)
//     setPaymentPhone(customer.phone)
//     setCustomers([])
//     setCustomerSearch(customer.full_name)
//     setSelectedInvoice(null)
//     setInvoicesLoading(true)
//     try {
//       const res = await api.get(`/invoices/customer/${customer.id}`)
//       const unpaid = res.data.data.filter((inv: Invoice) =>
//         ['unpaid', 'overdue'].includes(inv.status)
//       )
//       setUnpaidInvoices(unpaid)
//     } catch { setUnpaidInvoices([]) }
//     finally { setInvoicesLoading(false) }
//   }

//   const selectManualCustomer = async (customer: Customer) => {
//     setManualSelectedCustomer(customer)
//     setManualCustomers([])
//     setManualCustomerSearch(customer.full_name)
//     setManualSelectedInvoice(null)
//     setManualInvoicesLoading(true)
//     try {
//       const res = await api.get(`/invoices/customer/${customer.id}`)
//       const unpaid = res.data.data.filter((inv: Invoice) =>
//         ['unpaid', 'overdue'].includes(inv.status)
//       )
//       setManualInvoices(unpaid)
//     } catch { setManualInvoices([]) }
//     finally { setManualInvoicesLoading(false) }
//   }

// //   const handleMpesa = async () => {
// //     if (!selectedInvoice || !paymentPhone) {
// //       setMpesaError('Please select an invoice and confirm the phone number')
// //       return
// //     }
// //     setMpesaSending(true)
// //     setMpesaError('')
// //     try {
// //         console.log(selectedInvoice.id,typeof paymentPhone)
// //       await api.post('/payments/mpesa/initiate', {
// //         invoice_id: selectedInvoice.id,
        
// //         phone: paymentPhone.startsWith('+')
// //           ? String(paymentPhone.replace('+', ''))
// //           : String(paymentPhone)
// const handleMpesa = async () => {
// //      console.log('selectedInvoice:', selectedInvoice)
// //   console.log('paymentPhone:', paymentPhone)
// //   console.log('phone type:', typeof paymentPhone)
// //   console.log('phone value:', String(paymentPhone).trim())
//   if (!selectedInvoice || !paymentPhone) {
//     setMpesaError('Please select an invoice and confirm the phone number')
//     return
//   }
//   setMpesaSending(true)
//   setMpesaError('')
//   try {
//     await api.post('/payments/mpesa/initiate', {
//       invoice_id: selectedInvoice.id,
//       phone: String(paymentPhone).trim()
//     })
//     //   })
//       setMpesaSuccess(true)
//       load()
//     } catch (err: any) {
//       setMpesaError(err.response?.data?.message || 'Failed to send STK push')
//     } finally {
//       setMpesaSending(false)
//     }
//   }

//   const handleManual = async () => {
//     if (!manualSelectedInvoice || !manualForm.amount) {
//       setManualError('Please select an invoice and enter amount')
//       return
//     }
//     setManualSaving(true)
//     setManualError('')
//     try {
//       await api.post('/payments/manual', {
//         invoice_id: manualSelectedInvoice.id,
//         amount: Number(manualForm.amount),
//         method: manualForm.method,
//         bank_ref: manualForm.bank_ref || undefined
//       })
//       setManualModal(false)
//       resetManualModal()
//       load()
//     } catch (err: any) {
//       setManualError(err.response?.data?.message || 'Failed to record payment')
//     } finally {
//       setManualSaving(false)
//     }
//   }

//   const resetMpesaModal = () => {
//     setCustomerSearch('')
//     setCustomers([])
//     setSelectedCustomer(null)
//     setUnpaidInvoices([])
//     setSelectedInvoice(null)
//     setPaymentPhone('')
//     setMpesaError('')
//     setMpesaSuccess(false)
//   }

//   const resetManualModal = () => {
//     setManualCustomerSearch('')
//     setManualCustomers([])
//     setManualSelectedCustomer(null)
//     setManualInvoices([])
//     setManualSelectedInvoice(null)
//     setManualForm({ amount: '', method: 'cash', bank_ref: '' })
//     setManualError('')
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
//             onClick={() => { resetMpesaModal(); setMpesaModal(true) }}
//             className="border-primary-500 text-primary-600">
//             M-Pesa STK Push
//           </Button>
//           <Button radius="md"
//             onClick={() => { resetManualModal(); setManualModal(true) }}
//             className="bg-primary-500 hover:bg-primary-600">
//             + Record Payment
//           </Button>
//         </Group>
//       </div>

//       {/* Filters */}
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

//       {/* Payments Table */}
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

//       {/* M-Pesa Modal */}
//       <Modal opened={mpesaModal}
//         onClose={() => { setMpesaModal(false); resetMpesaModal() }}
//         title={<Text fw={600} className="text-text-600">Send M-Pesa STK Push</Text>}
//         radius="lg" size="md">

//         {mpesaSuccess ? (
//           <Stack align="center" gap="md" py="md">
//             <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
//               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
//                 <polyline points="20 6 9 17 4 12" />
//               </svg>
//             </div>
//             <Text fw={600} className="text-text-700">STK Push Sent</Text>
//             <Text size="sm" className="text-text-400 text-center">
//               Payment prompt sent to {paymentPhone}. Customer should receive it shortly.
//             </Text>
//             <Button fullWidth radius="md"
//               onClick={() => { setMpesaModal(false); resetMpesaModal() }}
//               className="bg-primary-500 hover:bg-primary-600">
//               Done
//             </Button>
//           </Stack>
//         ) : (
//           <Stack gap="md">
//             {mpesaError && <Alert color="red" radius="md" variant="light">{mpesaError}</Alert>}

//             {/* Step 1 — Search customer */}
//             <div>
//               <Text size="sm" fw={500} className="text-text-500 mb-1">Search Customer</Text>
//               <input
//                 type="text"
//                 placeholder="Type name, phone or account no..."
//                 value={customerSearch}
//                 onChange={e => {
//                   setCustomerSearch(e.target.value)
//                   setSelectedCustomer(null)
//                   setSelectedInvoice(null)
//                   setUnpaidInvoices([])
//                 }}
//                 className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//               />
//               {customerLoading && (
//                 <Text size="xs" className="text-text-300 mt-1">Searching...</Text>
//               )}
//               {customers.length > 0 && (
//                 <div className="border border-gray-100 rounded-lg mt-1 overflow-hidden shadow-sm">
//                   {customers.map(c => (
//                     <button key={c.id}
//                       onClick={() => selectCustomer(c)}
//                       className="w-full text-left px-3 py-2.5 hover:bg-primary-50 border-b border-gray-50 last:border-0 transition-colors">
//                       <Text size="sm" fw={500} className="text-text-600">{c.full_name}</Text>
//                       <Text size="xs" className="text-text-300">{c.account_no} · {c.phone}</Text>
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Step 2 — Select invoice */}
//             {selectedCustomer && (
//               <div>
//                 <Text size="sm" fw={500} className="text-text-500 mb-2">
//                   Unpaid Invoices for {selectedCustomer.full_name}
//                 </Text>
//                 {invoicesLoading ? (
//                   <Skeleton height={60} radius="md" />
//                 ) : unpaidInvoices.length === 0 ? (
//                   <Alert color="blue" radius="md" variant="light">
//                     No unpaid invoices for this customer
//                   </Alert>
//                 ) : (
//                   <Stack gap="xs">
//                     {unpaidInvoices.map(inv => (
//                       <button key={inv.id}
//                         onClick={() => setSelectedInvoice(inv)}
//                         className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
//                           selectedInvoice?.id === inv.id
//                             ? 'border-primary-500 bg-primary-50'
//                             : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
//                         }`}>
//                         <div className="flex justify-between items-center">
//                           <div>
//                             <Text size="sm" fw={600} className="text-text-600">{inv.invoice_no}</Text>
//                             <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
//                           </div>
//                           <div className="text-right">
//                             <Text size="sm" fw={700} className="text-primary-600">
//                               KES {Number(inv.total_amount).toLocaleString()}
//                             </Text>
//                             <Badge size="xs" radius="sm" variant="light"
//                               color={inv.status === 'overdue' ? 'red' : 'yellow'}>
//                               {inv.status}
//                             </Badge>
//                           </div>
//                         </div>
//                       </button>
//                     ))}
//                   </Stack>
//                 )}
//               </div>
//             )}

//             {/* Step 3 — Confirm phone */}
//             {selectedInvoice && (
//               <div>
//                 <Text size="sm" fw={500} className="text-text-500 mb-1">
//                   Phone Number to receive prompt
//                 </Text>
//                 <input
//                   type="text"
//                   value={paymentPhone}
//                   onChange={e => setPaymentPhone(e.target.value)}
//                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//                 />
//                 <Text size="xs" className="text-text-300 mt-1">
//                   Pre-filled from customer record. Change if needed.
//                 </Text>
//               </div>
//             )}

//             {/* Summary */}
//             {selectedInvoice && selectedCustomer && (
//               <div className="bg-gray-50 rounded-xl p-4">
//                 <div className="flex justify-between mb-1">
//                   <Text size="xs" className="text-text-300">Customer</Text>
//                   <Text size="xs" fw={600} className="text-text-600">{selectedCustomer.full_name}</Text>
//                 </div>
//                 <div className="flex justify-between mb-1">
//                   <Text size="xs" className="text-text-300">Invoice</Text>
//                   <Text size="xs" fw={600} className="text-text-600">{selectedInvoice.invoice_no}</Text>
//                 </div>
//                 <div className="flex justify-between">
//                   <Text size="xs" className="text-text-300">Amount</Text>
//                   <Text size="xs" fw={700} className="text-primary-600">
//                     KES {Number(selectedInvoice.total_amount).toLocaleString()}
//                   </Text>
//                 </div>
//               </div>
//             )}

//             <Button fullWidth radius="md"
//               disabled={!selectedInvoice || !paymentPhone}
//               loading={mpesaSending}
//               onClick={handleMpesa}
//               className="bg-primary-500 hover:bg-primary-600">
//               Send STK Push
//             </Button>
//           </Stack>
//         )}
//       </Modal>

//       {/* Manual Payment Modal */}
//       <Modal opened={manualModal}
//         onClose={() => { setManualModal(false); resetManualModal() }}
//         title={<Text fw={600} className="text-text-600">Record Manual Payment</Text>}
//         radius="lg" size="md">
//         <Stack gap="md">
//           {manualError && <Alert color="red" radius="md" variant="light">{manualError}</Alert>}

//           {/* Search customer */}
//           <div>
//             <Text size="sm" fw={500} className="text-text-500 mb-1">Search Customer</Text>
//             <input type="text"
//               placeholder="Type name, phone or account no..."
//               value={manualCustomerSearch}
//               onChange={e => {
//                 setManualCustomerSearch(e.target.value)
//                 setManualSelectedCustomer(null)
//                 setManualSelectedInvoice(null)
//                 setManualInvoices([])
//               }}
//               className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//             />
//             {manualCustomerLoading && (
//               <Text size="xs" className="text-text-300 mt-1">Searching...</Text>
//             )}
//             {manualCustomers.length > 0 && (
//               <div className="border border-gray-100 rounded-lg mt-1 overflow-hidden shadow-sm">
//                 {manualCustomers.map(c => (
//                   <button key={c.id}
//                     onClick={() => selectManualCustomer(c)}
//                     className="w-full text-left px-3 py-2.5 hover:bg-primary-50 border-b border-gray-50 last:border-0 transition-colors">
//                     <Text size="sm" fw={500} className="text-text-600">{c.full_name}</Text>
//                     <Text size="xs" className="text-text-300">{c.account_no} · {c.phone}</Text>
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Select invoice */}
//           {manualSelectedCustomer && (
//             <div>
//               <Text size="sm" fw={500} className="text-text-500 mb-2">
//                 Unpaid Invoices
//               </Text>
//               {manualInvoicesLoading ? (
//                 <Skeleton height={60} radius="md" />
//               ) : manualInvoices.length === 0 ? (
//                 <Alert color="blue" radius="md" variant="light">
//                   No unpaid invoices for this customer
//                 </Alert>
//               ) : (
//                 <Stack gap="xs">
//                   {manualInvoices.map(inv => (
//                     <button key={inv.id}
//                       onClick={() => {
//                         setManualSelectedInvoice(inv)
//                         setManualForm(f => ({
//                           ...f, amount: String(inv.total_amount)
//                         }))
//                       }}
//                       className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
//                         manualSelectedInvoice?.id === inv.id
//                           ? 'border-primary-500 bg-primary-50'
//                           : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
//                       }`}>
//                       <div className="flex justify-between items-center">
//                         <div>
//                           <Text size="sm" fw={600} className="text-text-600">{inv.invoice_no}</Text>
//                           <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
//                         </div>
//                         <Text size="sm" fw={700} className="text-primary-600">
//                           KES {Number(inv.total_amount).toLocaleString()}
//                         </Text>
//                       </div>
//                     </button>
//                   ))}
//                 </Stack>
//               )}
//             </div>
//           )}

//           {/* Payment details */}
//           {manualSelectedInvoice && (
//             <>
//               <div>
//                 <label className="block text-sm font-medium text-text-500 mb-1">
//                   Amount (KES)
//                 </label>
//                 <input type="number"
//                   value={manualForm.amount}
//                   onChange={e => setManualForm({ ...manualForm, amount: e.target.value })}
//                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//                 />
//               </div>
//               <Select label="Method" radius="md" value={manualForm.method}
//                 onChange={val => setManualForm({ ...manualForm, method: val || 'cash' })}
//                 data={[
//                   { value: 'cash', label: 'Cash' },
//                   { value: 'bank_transfer', label: 'Bank Transfer' }
//                 ]} />
//               {manualForm.method === 'bank_transfer' && (
//                 <div>
//                   <label className="block text-sm font-medium text-text-500 mb-1">
//                     Bank Reference
//                   </label>
//                   <input type="text" placeholder="BTR-2026-001"
//                     value={manualForm.bank_ref}
//                     onChange={e => setManualForm({ ...manualForm, bank_ref: e.target.value })}
//                     className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//                   />
//                 </div>
//               )}
//               <Button fullWidth radius="md" loading={manualSaving}
//                 onClick={handleManual}
//                 className="bg-primary-500 hover:bg-primary-600">
//                 Record Payment
//               </Button>
//             </>
//           )}
//         </Stack>
//       </Modal>
//     </div>
//   )
// }













































import { useEffect, useState } from 'react'
import {
  Paper, Title, Text, Select, Button, Badge, Modal,
  Table, Group, Stack, Alert, Skeleton,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import api from '../utils/api'

interface Customer {
  id: number
  full_name: string
  phone: string
  account_no: string
}

interface Invoice {
  id: number
  invoice_no: string
  total_amount: number
  status: string
  due_date: string
}

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

const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow', completed: 'green',
  failed: 'red', reversed: 'gray'
}

const METHOD_COLORS: Record<string, string> = {
  mpesa: 'teal', bank_transfer: 'blue', cash: 'violet'
}

export default function Payments() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [payments, setPayments] = useState<Payment[]>([])
  const [filtered, setFiltered] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [methodFilter, setMethodFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // mpesa modal
  const [mpesaModal, setMpesaModal] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [paymentPhone, setPaymentPhone] = useState('')
  const [mpesaSending, setMpesaSending] = useState(false)
  const [mpesaError, setMpesaError] = useState('')
  const [mpesaSuccess, setMpesaSuccess] = useState(false)

  // manual modal
  const [manualModal, setManualModal] = useState(false)
  const [manualCustomerSearch, setManualCustomerSearch] = useState('')
  const [manualCustomers, setManualCustomers] = useState<Customer[]>([])
  const [manualCustomerLoading, setManualCustomerLoading] = useState(false)
  const [manualSelectedCustomer, setManualSelectedCustomer] = useState<Customer | null>(null)
  const [manualInvoices, setManualInvoices] = useState<Invoice[]>([])
  const [manualInvoicesLoading, setManualInvoicesLoading] = useState(false)
  const [manualSelectedInvoice, setManualSelectedInvoice] = useState<Invoice | null>(null)
  const [manualForm, setManualForm] = useState({ amount: '', method: 'cash', bank_ref: '' })
  const [manualSaving, setManualSaving] = useState(false)
  const [manualError, setManualError] = useState('')

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

  useEffect(() => {
    if (customerSearch.length < 2) { setCustomers([]); return }
    const timeout = setTimeout(async () => {
      setCustomerLoading(true)
      try {
        const res = await api.get(`/customers/search?q=${customerSearch}`)
        setCustomers(res.data.data)
      } catch { setCustomers([]) }
      finally { setCustomerLoading(false) }
    }, 400)
    return () => clearTimeout(timeout)
  }, [customerSearch])

  useEffect(() => {
    if (manualCustomerSearch.length < 2) { setManualCustomers([]); return }
    const timeout = setTimeout(async () => {
      setManualCustomerLoading(true)
      try {
        const res = await api.get(`/customers/search?q=${manualCustomerSearch}`)
        setManualCustomers(res.data.data)
      } catch { setManualCustomers([]) }
      finally { setManualCustomerLoading(false) }
    }, 400)
    return () => clearTimeout(timeout)
  }, [manualCustomerSearch])

  const selectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setPaymentPhone(customer.phone)
    setCustomers([])
    setCustomerSearch(customer.full_name)
    setSelectedInvoice(null)
    setInvoicesLoading(true)
    try {
      const res = await api.get(`/invoices/customer/${customer.id}`)
      setUnpaidInvoices(res.data.data.filter((inv: Invoice) =>
        ['unpaid', 'overdue'].includes(inv.status)
      ))
    } catch { setUnpaidInvoices([]) }
    finally { setInvoicesLoading(false) }
  }

  const selectManualCustomer = async (customer: Customer) => {
    setManualSelectedCustomer(customer)
    setManualCustomers([])
    setManualCustomerSearch(customer.full_name)
    setManualSelectedInvoice(null)
    setManualInvoicesLoading(true)
    try {
      const res = await api.get(`/invoices/customer/${customer.id}`)
      setManualInvoices(res.data.data.filter((inv: Invoice) =>
        ['unpaid', 'overdue'].includes(inv.status)
      ))
    } catch { setManualInvoices([]) }
    finally { setManualInvoicesLoading(false) }
  }

  const handleMpesa = async () => {
    if (!selectedInvoice || !paymentPhone) {
      setMpesaError('Please select an invoice and confirm the phone number')
      return
    }
    setMpesaSending(true)
    setMpesaError('')
    try {
      await api.post('/payments/mpesa/initiate', {
        invoice_id: selectedInvoice.id,
        phone: String(paymentPhone).trim()
      })
      setMpesaSuccess(true)
      load()
    } catch (err: any) {
      setMpesaError(err.response?.data?.message || 'Failed to send STK push')
    } finally {
      setMpesaSending(false)
    }
  }

  const handleManual = async () => {
    if (!manualSelectedInvoice || !manualForm.amount) {
      setManualError('Please select an invoice and enter amount')
      return
    }
    setManualSaving(true)
    setManualError('')
    try {
      await api.post('/payments/manual', {
        invoice_id: manualSelectedInvoice.id,
        amount: Number(manualForm.amount),
        method: manualForm.method,
        bank_ref: manualForm.bank_ref || undefined
      })
      setManualModal(false)
      resetManualModal()
      load()
    } catch (err: any) {
      setManualError(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setManualSaving(false)
    }
  }

  const resetMpesaModal = () => {
    setCustomerSearch('')
    setCustomers([])
    setSelectedCustomer(null)
    setUnpaidInvoices([])
    setSelectedInvoice(null)
    setPaymentPhone('')
    setMpesaError('')
    setMpesaSuccess(false)
  }

  const resetManualModal = () => {
    setManualCustomerSearch('')
    setManualCustomers([])
    setManualSelectedCustomer(null)
    setManualInvoices([])
    setManualSelectedInvoice(null)
    setManualForm({ amount: '', method: 'cash', bank_ref: '' })
    setManualError('')
  }

  // ── Customer search dropdown (reusable UI block) ──
  const CustomerSearchBlock = ({
    value, onChange, results, loadingResults, onSelect, label
  }: {
    value: string
    onChange: (v: string) => void
    results: Customer[]
    loadingResults: boolean
    onSelect: (c: Customer) => void
    label?: string
  }) => (
    <div>
      <Text size="sm" fw={500} className="text-text-500 mb-1">{label || 'Search Customer'}</Text>
      <input type="text" placeholder="Type name, phone or account no..."
        value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
      {loadingResults && <Text size="xs" className="text-text-300 mt-1">Searching...</Text>}
      {results.length > 0 && (
        <div className="border border-gray-100 rounded-lg mt-1 overflow-hidden shadow-sm">
          {results.map(c => (
            <button key={c.id} onClick={() => onSelect(c)}
              className="w-full text-left px-3 py-2.5 hover:bg-primary-50 border-b border-gray-50 last:border-0 transition-colors">
              <Text size="sm" fw={500} className="text-text-600">{c.full_name}</Text>
              <Text size="xs" className="text-text-300">{c.account_no} · {c.phone}</Text>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  // ── Invoice picker (reusable UI block) ──
  const InvoicePicker = ({
    invoices, loadingInvoices, selected, onSelect, customerName
  }: {
    invoices: Invoice[]
    loadingInvoices: boolean
    selected: Invoice | null
    onSelect: (inv: Invoice) => void
    customerName: string
  }) => (
    <div>
      <Text size="sm" fw={500} className="text-text-500 mb-2">
        Unpaid Invoices{customerName ? ` for ${customerName}` : ''}
      </Text>
      {loadingInvoices ? (
        <Skeleton height={60} radius="md" />
      ) : invoices.length === 0 ? (
        <Alert color="blue" radius="md" variant="light">
          No unpaid invoices for this customer
        </Alert>
      ) : (
        <Stack gap="xs">
          {invoices.map(inv => (
            <button key={inv.id} onClick={() => onSelect(inv)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                selected?.id === inv.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              }`}>
              <div className="flex justify-between items-center">
                <div>
                  <Text size="sm" fw={600} className="text-text-600">{inv.invoice_no}</Text>
                  <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
                </div>
                <div className="text-right">
                  <Text size="sm" fw={700} className="text-primary-600">
                    KES {Number(inv.total_amount).toLocaleString()}
                  </Text>
                  <Badge size="xs" radius="sm" variant="light"
                    color={inv.status === 'overdue' ? 'red' : 'yellow'}>
                    {inv.status}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </Stack>
      )}
    </div>
  )

  // ── Desktop Table ──
  const PaymentsTable = () => (
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
  )

  // ── Mobile Cards ──
  const PaymentCards = () => (
    <>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <Text size="sm" className="text-text-300">No payments found</Text>
        </div>
      ) : (
        <Stack gap="sm">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50">
                <div className="min-w-0 mr-3">
                  <Text fw={700} size="sm" className="text-text-700">
                    {p.customers?.full_name}
                  </Text>
                  <Text size="xs" className="text-text-300 mt-0.5">
                    {p.customers?.account_no}
                  </Text>
                  <Text size="xs" className="text-text-200 mt-0.5">
                    {p.invoices?.invoice_no}
                  </Text>
                </div>
                <div className="text-right flex-shrink-0">
                  <Text fw={700} size="sm" className="text-text-700">
                    KES {Number(p.amount).toLocaleString()}
                  </Text>
                  <div className="flex gap-1 justify-end mt-1 flex-wrap">
                    <Badge size="xs" radius="sm" variant="light"
                      color={METHOD_COLORS[p.method] || 'gray'}>
                      {p.method.replace('_', ' ')}
                    </Badge>
                    <Badge size="xs" radius="sm" variant="light"
                      color={STATUS_COLORS[p.status] || 'gray'}>
                      {p.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <Text size="xs" className="text-text-300">
                  {new Date(p.payment_date).toLocaleDateString()}
                </Text>
                {(p.mpesa_ref || p.bank_ref) && (
                  <Text size="xs" className="text-text-200 font-mono">
                    {p.mpesa_ref || p.bank_ref}
                  </Text>
                )}
              </div>
            </div>
          ))}
        </Stack>
      )}
    </>
  )

  return (
    <div className="p-4 md:p-6">
      {/* header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <Title order={3} className="text-text-700 font-bold text-lg md:text-xl">Payments</Title>
          <Text size="sm" className="text-text-300 mt-0.5 hidden sm:block">
            Track and record payments
          </Text>
        </div>
        <Group gap="xs">
          <Button radius="md" size="sm" variant="outline"
            onClick={() => { resetMpesaModal(); setMpesaModal(true) }}
            className="border-primary-500 text-primary-600">
            {isMobile ? 'M-Pesa' : 'M-Pesa STK Push'}
          </Button>
          <Button radius="md" size="sm"
            onClick={() => { resetManualModal(); setManualModal(true) }}
            className="bg-primary-500 hover:bg-primary-600">
            {isMobile ? '+ Record' : '+ Record Payment'}
          </Button>
        </Group>
      </div>

      {/* filters */}
      <Paper shadow="xs" radius="lg" p="sm" className="bg-white mb-4">
        <Stack gap="sm">
          <Group gap="sm" grow>
            <Select placeholder="Method" value={methodFilter}
              onChange={setMethodFilter} clearable radius="md"
              data={[
                { value: 'mpesa', label: 'M-Pesa' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
                { value: 'cash', label: 'Cash' }
              ]} />
            <Select placeholder="Status" value={statusFilter}
              onChange={setStatusFilter} clearable radius="md"
              data={[
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
                { value: 'reversed', label: 'Reversed' }
              ]} />
          </Group>
        </Stack>
      </Paper>

      {/* content */}
      {loading ? (
        <Stack gap="sm">
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={60} radius="lg" />)}
        </Stack>
      ) : error ? (
        <Alert color="red" radius="md" variant="light">{error}</Alert>
      ) : isMobile ? (
        <PaymentCards />
      ) : (
        <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
          <PaymentsTable />
        </Paper>
      )}

      {/* M-Pesa Modal */}
      <Modal opened={mpesaModal}
        onClose={() => { setMpesaModal(false); resetMpesaModal() }}
        title={<Text fw={600} className="text-text-600">Send M-Pesa STK Push</Text>}
        radius="lg" size="md">
        {mpesaSuccess ? (
          <Stack align="center" gap="md" py="md">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="#22c55e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <Text fw={600} className="text-text-700">STK Push Sent</Text>
            <Text size="sm" className="text-text-400 text-center">
              Payment prompt sent to {paymentPhone}.
            </Text>
            <Button fullWidth radius="md"
              onClick={() => { setMpesaModal(false); resetMpesaModal() }}
              className="bg-primary-500 hover:bg-primary-600">
              Done
            </Button>
          </Stack>
        ) : (
          <Stack gap="md">
            {mpesaError && (
              <Alert color="red" radius="md" variant="light">{mpesaError}</Alert>
            )}

            <CustomerSearchBlock
              value={customerSearch}
              onChange={v => {
                setCustomerSearch(v)
                setSelectedCustomer(null)
                setSelectedInvoice(null)
                setUnpaidInvoices([])
              }}
              results={customers}
              loadingResults={customerLoading}
              onSelect={selectCustomer}
            />

            {selectedCustomer && (
              <InvoicePicker
                invoices={unpaidInvoices}
                loadingInvoices={invoicesLoading}
                selected={selectedInvoice}
                onSelect={setSelectedInvoice}
                customerName={selectedCustomer.full_name}
              />
            )}

            {selectedInvoice && (
              <div>
                <Text size="sm" fw={500} className="text-text-500 mb-1">
                  Phone Number to receive prompt
                </Text>
                <input type="tel" value={paymentPhone}
                  onChange={e => setPaymentPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
                <Text size="xs" className="text-text-300 mt-1">
                  Pre-filled from customer record. Change if needed.
                </Text>
              </div>
            )}

            {selectedInvoice && selectedCustomer && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between mb-1">
                  <Text size="xs" className="text-text-300">Customer</Text>
                  <Text size="xs" fw={600} className="text-text-600">{selectedCustomer.full_name}</Text>
                </div>
                <div className="flex justify-between mb-1">
                  <Text size="xs" className="text-text-300">Invoice</Text>
                  <Text size="xs" fw={600} className="text-text-600">{selectedInvoice.invoice_no}</Text>
                </div>
                <div className="flex justify-between">
                  <Text size="xs" className="text-text-300">Amount</Text>
                  <Text size="xs" fw={700} className="text-primary-600">
                    KES {Number(selectedInvoice.total_amount).toLocaleString()}
                  </Text>
                </div>
              </div>
            )}

            <Button fullWidth radius="md"
              disabled={!selectedInvoice || !paymentPhone}
              loading={mpesaSending}
              onClick={handleMpesa}
              className="bg-primary-500 hover:bg-primary-600">
              Send STK Push
            </Button>
          </Stack>
        )}
      </Modal>

      {/* Manual Payment Modal */}
      <Modal opened={manualModal}
        onClose={() => { setManualModal(false); resetManualModal() }}
        title={<Text fw={600} className="text-text-600">Record Manual Payment</Text>}
        radius="lg" size="md">
        <Stack gap="md">
          {manualError && (
            <Alert color="red" radius="md" variant="light">{manualError}</Alert>
          )}

          <CustomerSearchBlock
            value={manualCustomerSearch}
            onChange={v => {
              setManualCustomerSearch(v)
              setManualSelectedCustomer(null)
              setManualSelectedInvoice(null)
              setManualInvoices([])
            }}
            results={manualCustomers}
            loadingResults={manualCustomerLoading}
            onSelect={selectManualCustomer}
          />

          {manualSelectedCustomer && (
            <InvoicePicker
              invoices={manualInvoices}
              loadingInvoices={manualInvoicesLoading}
              selected={manualSelectedInvoice}
              onSelect={inv => {
                setManualSelectedInvoice(inv)
                setManualForm(f => ({ ...f, amount: String(inv.total_amount) }))
              }}
              customerName={manualSelectedCustomer.full_name}
            />
          )}

          {manualSelectedInvoice && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-500 mb-1">
                  Amount (KES)
                </label>
                <input type="number" value={manualForm.amount}
                  onChange={e => setManualForm({ ...manualForm, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>

              <Select label="Method" radius="md" value={manualForm.method}
                onChange={val => setManualForm({ ...manualForm, method: val || 'cash' })}
                data={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'bank_transfer', label: 'Bank Transfer' }
                ]}
              />

              {manualForm.method === 'bank_transfer' && (
                <div>
                  <label className="block text-sm font-medium text-text-500 mb-1">
                    Bank Reference
                  </label>
                  <input type="text" placeholder="BTR-2026-001"
                    value={manualForm.bank_ref}
                    onChange={e => setManualForm({ ...manualForm, bank_ref: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              )}

              <Button fullWidth radius="md" loading={manualSaving}
                onClick={handleManual}
                className="bg-primary-500 hover:bg-primary-600">
                Record Payment
              </Button>
            </>
          )}
        </Stack>
      </Modal>
    </div>
  )
}
