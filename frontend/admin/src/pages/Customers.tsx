// import { useEffect, useState } from 'react'
// import {
//   Paper, Title, Text, TextInput, Select, Button, Badge, Modal,
//   Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip
// } from '@mantine/core'
// import { useMediaQuery } from '@mantine/hooks'
// import api from '../utils/api'

// interface Customer {
//   id: number
//   full_name: string
//   phone: string | number
//   email: string
//   address: string
//   account_no: string
//   customer_type: string
//   is_active: boolean
//   created_at: string
// }

// interface CustomerForm {
//   full_name: string
//   phone: string
//   email: string
//   address: string
//   customer_type: string
// }

// const emptyForm: CustomerForm = {
//   full_name: '',
//   phone: '',
//   email: '',
//   address: '',
//   customer_type: 'domestic'
// }

// const normalizePhone = (phone: string): string => {
//   const digits = phone.replace(/\D/g, '')
//   if (!digits) return phone
//   if (digits.startsWith('254')) return `+${digits}`
//   if (digits.startsWith('0')) return `+254${digits.slice(1)}`
//   if (digits.startsWith('7') || digits.startsWith('1')) return `+254${digits}`
//   return `+${digits}`
// }

// export default function Customers() {
//   const isMobile = useMediaQuery('(max-width: 768px)')

//   const [customers, setCustomers] = useState<Customer[]>([])
//   const [filtered, setFiltered] = useState<Customer[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [search, setSearch] = useState('')
//   const [typeFilter, setTypeFilter] = useState<string | null>(null)
//   const [statusFilter, setStatusFilter] = useState<string | null>(null)
//   const [modalOpen, setModalOpen] = useState(false)
//   const [editTarget, setEditTarget] = useState<Customer | null>(null)
//   const [form, setForm] = useState<CustomerForm>(emptyForm)
//   const [saving, setSaving] = useState(false)
//   const [formError, setFormError] = useState('')
//   const [phonePreview, setPhonePreview] = useState('')

//   const load = async () => {
//     try {
//       const res = await api.get('/customers')
//       setCustomers(res.data.data)
//       setFiltered(res.data.data)
//     } catch {
//       setError('Failed to load customers')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => { load() }, [])

//   useEffect(() => {
//     let data = [...customers]
//     if (search) {
//       const q = search.toLowerCase().trim()
//       const qDigits = search.replace(/\D/g, '')
//       data = data.filter(c => {
//         const nameMatch = c.full_name.toLowerCase().includes(q)
//         const accountMatch = c.account_no.toLowerCase().includes(q)
//         const phoneMatch = qDigits.length > 0
//           ? String(c.phone).replace(/\D/g, '').includes(qDigits)
//           : false
//         return nameMatch || accountMatch || phoneMatch
//       })
//     }
//     if (typeFilter) data = data.filter(c => c.customer_type === typeFilter)
//     if (statusFilter) data = data.filter(c =>
//       statusFilter === 'active' ? c.is_active : !c.is_active
//     )
//     setFiltered(data)
//   }, [search, typeFilter, statusFilter, customers])

//   const openCreate = () => {
//     setEditTarget(null)
//     setForm(emptyForm)
//     setPhonePreview('')
//     setFormError('')
//     setModalOpen(true)
//   }

//   const openEdit = (c: Customer) => {
//     setEditTarget(c)
//     const phone = String(c.phone)
//     setForm({
//       full_name: c.full_name,
//       phone,
//       email: c.email || '',
//       address: c.address || '',
//       customer_type: c.customer_type
//     })
//     setPhonePreview(normalizePhone(phone))
//     setFormError('')
//     setModalOpen(true)
//   }

//   const handlePhoneChange = (value: string) => {
//     setForm({ ...form, phone: value })
//     if (value.replace(/\D/g, '').length >= 9) {
//       setPhonePreview(normalizePhone(value))
//     } else {
//       setPhonePreview('')
//     }
//   }

//   const handleSave = async () => {
//     if (!form.full_name || !form.phone) {
//       setFormError('Full name and phone number are required')
//       return
//     }
//     if (form.phone.replace(/\D/g, '').length < 9) {
//       setFormError('Please enter a valid phone number')
//       return
//     }
//     setSaving(true)
//     setFormError('')
//     try {
//       const payload = { ...form, phone: normalizePhone(form.phone) }
//       if (editTarget) {
//         await api.patch(`/customers/${editTarget.id}`, payload)
//       } else {
//         await api.post('/customers', payload)
//       }
//       setModalOpen(false)
//       load()
//     } catch (err: any) {
//       setFormError(err.response?.data?.message || 'Failed to save customer')
//     } finally {
//       setSaving(false)
//     }
//   }

//   const handleDeactivate = async (id: number) => {
//     if (!confirm('Deactivate this customer?')) return
//     try {
//       await api.patch(`/customers/${id}/deactivate`)
//       load()
//     } catch {
//       alert('Failed to deactivate customer')
//     }
//   }

//   const CustomersTable = () => (
//     <div className="table-responsive">
//       <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
//         <Table.Thead>
//           <Table.Tr className="bg-gray-50">
//             <Table.Th className="text-text-400 text-xs uppercase">Account No</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Name</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Phone</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Type</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
//           </Table.Tr>
//         </Table.Thead>
//         <Table.Tbody>
//           {filtered.length === 0 ? (
//             <Table.Tr>
//               <Table.Td colSpan={6} className="text-center text-text-300 py-8">
//                 No customers found
//               </Table.Td>
//             </Table.Tr>
//           ) : filtered.map(c => (
//             <Table.Tr key={c.id}>
//               <Table.Td className="text-text-600 font-semibold text-sm">{c.account_no}</Table.Td>
//               <Table.Td className="text-text-500 text-sm">{c.full_name}</Table.Td>
//               <Table.Td className="text-text-400 text-sm">{String(c.phone)}</Table.Td>
//               <Table.Td>
//                 <Badge size="sm" radius="sm" variant="light"
//                   color={c.customer_type === 'commercial' ? 'blue' : 'teal'}>
//                   {c.customer_type}
//                 </Badge>
//               </Table.Td>
//               <Table.Td>
//                 <Badge size="sm" radius="sm" variant="light"
//                   color={c.is_active ? 'green' : 'gray'}>
//                   {c.is_active ? 'Active' : 'Inactive'}
//                 </Badge>
//               </Table.Td>
//               <Table.Td>
//                 <Group gap="xs">
//                   <Tooltip label="Edit">
//                     <ActionIcon variant="light" color="blue" radius="md" size="sm"
//                       onClick={() => openEdit(c)}>
//                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//                         stroke="currentColor" strokeWidth="2">
//                         <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
//                         <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
//                       </svg>
//                     </ActionIcon>
//                   </Tooltip>
//                   {c.is_active && (
//                     <Tooltip label="Deactivate">
//                       <ActionIcon variant="light" color="red" radius="md" size="sm"
//                         onClick={() => handleDeactivate(c.id)}>
//                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//                           stroke="currentColor" strokeWidth="2">
//                           <circle cx="12" cy="12" r="10" />
//                           <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
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

//   const CustomerCards = () => (
//     <>
//       {filtered.length === 0 ? (
//         <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
//           <Text size="sm" className="text-text-300">No customers found</Text>
//         </div>
//       ) : (
//         <Stack gap="sm">
//           {filtered.map(c => (
//             <div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
//               <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50">
//                 <div className="min-w-0 mr-3">
//                   <Text fw={700} size="sm" className="text-text-700">{c.full_name}</Text>
//                   <Text size="xs" className="text-text-400 mt-0.5">{String(c.phone)}</Text>
//                   {c.email && (
//                     <Text size="xs" className="text-text-300 truncate">{c.email}</Text>
//                   )}
//                 </div>
//                 <div className="text-right flex-shrink-0">
//                   <Text size="xs" fw={700} className="text-text-600">{c.account_no}</Text>
//                   <div className="flex gap-1 justify-end mt-1 flex-wrap">
//                     <Badge size="xs" radius="sm" variant="light"
//                       color={c.customer_type === 'commercial' ? 'blue' : 'teal'}>
//                       {c.customer_type}
//                     </Badge>
//                     <Badge size="xs" radius="sm" variant="light"
//                       color={c.is_active ? 'green' : 'gray'}>
//                       {c.is_active ? 'Active' : 'Inactive'}
//                     </Badge>
//                   </div>
//                 </div>
//               </div>
//               <div className="flex px-4 py-2.5 gap-4">
//                 <button onClick={() => openEdit(c)}
//                   className="text-xs text-primary-500 font-medium">
//                   Edit
//                 </button>
//                 {c.is_active && (
//                   <button onClick={() => handleDeactivate(c.id)}
//                     className="text-xs text-red-400 font-medium">
//                     Deactivate
//                   </button>
//                 )}
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
//           <Title order={3} className="text-text-700 font-bold text-lg md:text-xl">
//             Customers
//           </Title>
//           <Text size="sm" className="text-text-300 mt-0.5 hidden sm:block">
//             Manage all customer accounts
//           </Text>
//         </div>
//         <Button radius="md" size="sm" onClick={openCreate}
//           className="bg-primary-500 hover:bg-primary-600">
//           + Add Customer
//         </Button>
//       </div>

//       <Paper shadow="xs" radius="lg" p="sm" className="bg-white mb-4">
//         <Stack gap="sm">
//           <TextInput
//             placeholder="Search name, phone or account..."
//             value={search}
//             onChange={e => setSearch(e.currentTarget.value)}
//             radius="md"
//           />
//           <Group gap="sm" grow>
//             <Select placeholder="Type" value={typeFilter} onChange={setTypeFilter}
//               data={[
//                 { value: 'domestic', label: 'Domestic' },
//                 { value: 'commercial', label: 'Commercial' }
//               ]}
//               clearable radius="md"
//             />
//             <Select placeholder="Status" value={statusFilter} onChange={setStatusFilter}
//               data={[
//                 { value: 'active', label: 'Active' },
//                 { value: 'inactive', label: 'Inactive' }
//               ]}
//               clearable radius="md"
//             />
//           </Group>
//         </Stack>
//       </Paper>

//       {loading ? (
//         <Stack gap="sm">
//           {[...Array(5)].map((_, i) => <Skeleton key={i} height={60} radius="lg" />)}
//         </Stack>
//       ) : error ? (
//         <Alert color="red" radius="md" variant="light">{error}</Alert>
//       ) : isMobile ? (
//         <CustomerCards />
//       ) : (
//         <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
//           <CustomersTable />
//         </Paper>
//       )}

//       <Modal
//         opened={modalOpen}
//         onClose={() => setModalOpen(false)}
//         title={
//           <Text fw={600} className="text-text-600">
//             {editTarget ? 'Edit Customer' : 'Add Customer'}
//           </Text>
//         }
//         radius="lg" size="md"
//       >
//         <Stack gap="md">
//           {formError && (
//             <Alert color="red" radius="md" variant="light">{formError}</Alert>
//           )}

//           {editTarget && (
//             <div>
//               <label className="block text-sm font-medium text-text-500 mb-1">Account No</label>
//               <input type="text" value={editTarget.account_no} disabled
//                 className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm text-text-300 bg-gray-50"
//               />
//             </div>
//           )}

//           {!editTarget && (
//             <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2.5">
//               <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//                 stroke="#185FA5" strokeWidth="2">
//                 <circle cx="12" cy="12" r="10" />
//                 <line x1="12" y1="8" x2="12" y2="12" />
//                 <line x1="12" y1="16" x2="12.01" y2="16" />
//               </svg>
//               <Text size="xs" className="text-primary-700">
//                 Account number will be auto-generated (e.g. GT-00016)
//               </Text>
//             </div>
//           )}

//           <TextInput label="Full Name" placeholder="John Doe" radius="md"
//             value={form.full_name}
//             onChange={e => setForm({ ...form, full_name: e.currentTarget.value })}
//           />

//           <div>
//             <label className="block text-sm font-medium text-text-500 mb-1">Phone Number</label>
//             <input type="tel" placeholder="e.g. 0712345678"
//               value={form.phone}
//               onChange={e => handlePhoneChange(e.target.value)}
//               className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//             />
//             {phonePreview && form.phone && (
//               <div className="flex items-center gap-1.5 mt-1.5">
//                 <div className="w-3 h-3 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
//                   <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
//                     stroke="#22c55e" strokeWidth="3">
//                     <polyline points="20 6 9 17 4 12" />
//                   </svg>
//                 </div>
//                 <Text size="xs" className="text-green-600">
//                   Will be saved as <span className="font-semibold">{phonePreview}</span>
//                 </Text>
//               </div>
//             )}
//             <Text size="xs" className="text-text-200 mt-1">
//               Any format — 0712..., 254712..., or +254712...
//             </Text>
//           </div>

//           <TextInput label="Email" placeholder="john@gmail.com" radius="md"
//             value={form.email}
//             onChange={e => setForm({ ...form, email: e.currentTarget.value })}
//           />

//           <TextInput label="Address" placeholder="Plot 1 Gitaru Town" radius="md"
//             value={form.address}
//             onChange={e => setForm({ ...form, address: e.currentTarget.value })}
//           />

//           <Select label="Customer Type" radius="md"
//             value={form.customer_type}
//             onChange={val => setForm({ ...form, customer_type: val || 'domestic' })}
//             data={[
//               { value: 'domestic', label: 'Domestic' },
//               { value: 'commercial', label: 'Commercial' }
//             ]}
//           />

//           <Button fullWidth radius="md" size="md" loading={saving}
//             onClick={handleSave}
//             className="bg-primary-500 hover:bg-primary-600">
//             {editTarget ? 'Save Changes' : 'Create Customer'}
//           </Button>
//         </Stack>
//       </Modal>
//     </div>
//   )
// }


































































// NEW CODE
// import { useEffect, useState } from 'react'
// import {
//   Paper, Title, Text, TextInput, Select, Button, Badge, Modal,
//   Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip
// } from '@mantine/core'
// import { useMediaQuery } from '@mantine/hooks'
// import api from '../utils/api'

// interface Customer {
//   id: number
//   full_name: string
//   phone: string | number
//   email: string
//   address: string
//   account_no: string
//   customer_type: string
//   is_active: boolean
//   created_at: string
// }

// interface CustomerForm {
//   full_name: string
//   phone: string
//   email: string
//   address: string
//   customer_type: string
// }

// const emptyForm: CustomerForm = {
//   full_name: '',
//   phone: '',
//   email: '',
//   address: '',
//   customer_type: 'domestic'
// }

// const normalizePhone = (phone: string): string => {
//   const digits = phone.replace(/\D/g, '')
//   if (!digits) return phone
//   if (digits.startsWith('254')) return `+${digits}`
//   if (digits.startsWith('0')) return `+254${digits.slice(1)}`
//   if (digits.startsWith('7') || digits.startsWith('1')) return `+254${digits}`
//   return `+${digits}`
// }

// export default function Customers() {
//   const isMobile = useMediaQuery('(max-width: 768px)')

//   const [customers, setCustomers] = useState<Customer[]>([])
//   const [filtered, setFiltered] = useState<Customer[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [search, setSearch] = useState('')
//   const [typeFilter, setTypeFilter] = useState<string | null>(null)
//   const [statusFilter, setStatusFilter] = useState<string | null>(null)
//   const [modalOpen, setModalOpen] = useState(false)
//   const [editTarget, setEditTarget] = useState<Customer | null>(null)
//   const [form, setForm] = useState<CustomerForm>(emptyForm)
//   const [saving, setSaving] = useState(false)
//   const [formError, setFormError] = useState('')
//   const [phonePreview, setPhonePreview] = useState('')

//   const load = async () => {
//     try {
//       const res = await api.get('/customers')
//       setCustomers(res.data.data)
//       setFiltered(res.data.data)
//     } catch {
//       setError('Failed to load customers')
//     } finally {
//       setLoading(false)
//     }
//   }

//   useEffect(() => { load() }, [])

//   useEffect(() => {
//     let data = [...customers]
//     if (search) {
//       const q = search.toLowerCase().trim()
//       const qDigits = search.replace(/\D/g, '')
//       data = data.filter(c => {
//         const nameMatch = c.full_name.toLowerCase().includes(q)
//         const accountMatch = c.account_no.toLowerCase().includes(q)
//         const phoneMatch = qDigits.length > 0
//           ? String(c.phone).replace(/\D/g, '').includes(qDigits)
//           : false
//         return nameMatch || accountMatch || phoneMatch
//       })
//     }
//     if (typeFilter) data = data.filter(c => c.customer_type === typeFilter)
//     if (statusFilter) data = data.filter(c =>
//       statusFilter === 'active' ? c.is_active : !c.is_active
//     )
//     setFiltered(data)
//   }, [search, typeFilter, statusFilter, customers])

//   const openCreate = () => {
//     setEditTarget(null)
//     setForm(emptyForm)
//     setPhonePreview('')
//     setFormError('')
//     setModalOpen(true)
//   }

//   const openEdit = (c: Customer) => {
//     setEditTarget(c)
//     const phone = String(c.phone)
//     setForm({
//       full_name: c.full_name,
//       phone,
//       email: c.email || '',
//       address: c.address || '',
//       customer_type: c.customer_type
//     })
//     setPhonePreview(normalizePhone(phone))
//     setFormError('')
//     setModalOpen(true)
//   }

//   const handlePhoneChange = (value: string) => {
//     setForm({ ...form, phone: value })
//     if (value.replace(/\D/g, '').length >= 9) {
//       setPhonePreview(normalizePhone(value))
//     } else {
//       setPhonePreview('')
//     }
//   }

//   const handleSave = async () => {
//     if (!form.full_name || !form.phone) {
//       setFormError('Full name and phone number are required')
//       return
//     }
//     if (form.phone.replace(/\D/g, '').length < 9) {
//       setFormError('Please enter a valid phone number')
//       return
//     }
//     setSaving(true)
//     setFormError('')
//     try {
//       const payload = { ...form, phone: normalizePhone(form.phone) }
//       if (editTarget) {
//         await api.patch(`/customers/${editTarget.id}`, payload)
//       } else {
//         await api.post('/customers', payload)
//       }
//       setModalOpen(false)
//       load()
//     } catch (err: any) {
//       setFormError(err.response?.data?.message || 'Failed to save customer')
//     } finally {
//       setSaving(false)
//     }
//   }

//   // toggle modal state
//   const [toggleModal, setToggleModal] = useState(false)
//   const [toggleTarget, setToggleTarget] = useState<Customer | null>(null)
//   const [toggleDeactivateMeters, setToggleDeactivateMeters] = useState(false)
//   const [toggling, setToggling] = useState(false)

//   const openToggle = (c: Customer) => {
//     setToggleTarget(c)
//     setToggleDeactivateMeters(false)
//     setToggleModal(true)
//   }

//   const handleToggle = async () => {
//     if (!toggleTarget) return
//     setToggling(true)
//     try {
//       if (toggleTarget.is_active) {
//         // deactivate customer
//         await api.patch(`/customers/${toggleTarget.id}/deactivate`)
//         // optionally deactivate meters too
//         if (toggleDeactivateMeters) {
//           const meterRes = await api.get(`/meters/customer/${toggleTarget.id}`)
//           const meters = meterRes.data.data
//           await Promise.all(
//             meters.map((m: any) => api.patch(`/meters/${m.id}/deactivate`))
//           )
//         }
//       } else {
//         // reactivate customer
//         await api.patch(`/customers/${toggleTarget.id}/activate`)
//       }
//       setToggleModal(false)
//       load()
//     } catch {
//       alert(`Failed to ${toggleTarget.is_active ? 'deactivate' : 'activate'} customer`)
//     } finally {
//       setToggling(false)
//     }
//   }

//   const CustomersTable = () => (
//     <div className="table-responsive">
//       <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
//         <Table.Thead>
//           <Table.Tr className="bg-gray-50">
//             <Table.Th className="text-text-400 text-xs uppercase">Account No</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Name</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Phone</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Type</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
//           </Table.Tr>
//         </Table.Thead>
//         <Table.Tbody>
//           {filtered.length === 0 ? (
//             <Table.Tr>
//               <Table.Td colSpan={6} className="text-center text-text-300 py-8">
//                 No customers found
//               </Table.Td>
//             </Table.Tr>
//           ) : filtered.map(c => (
//             <Table.Tr key={c.id}>
//               <Table.Td className="text-text-600 font-semibold text-sm">{c.account_no}</Table.Td>
//               <Table.Td className="text-text-500 text-sm">{c.full_name}</Table.Td>
//               <Table.Td className="text-text-400 text-sm">{String(c.phone)}</Table.Td>
//               <Table.Td>
//                 <Badge size="sm" radius="sm" variant="light"
//                   color={c.customer_type === 'commercial' ? 'blue' : 'teal'}>
//                   {c.customer_type}
//                 </Badge>
//               </Table.Td>
//               <Table.Td>
//                 <Badge size="sm" radius="sm" variant="light"
//                   color={c.is_active ? 'green' : 'gray'}>
//                   {c.is_active ? 'Active' : 'Inactive'}
//                 </Badge>
//               </Table.Td>
//               <Table.Td>
//                 <Group gap="xs">
//                   <Tooltip label="Edit">
//                     <ActionIcon variant="light" color="blue" radius="md" size="sm"
//                       onClick={() => openEdit(c)}>
//                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//                         stroke="currentColor" strokeWidth="2">
//                         <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
//                         <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
//                       </svg>
//                     </ActionIcon>
//                   </Tooltip>
//                   {c.is_active && (
//                     <Tooltip label="Deactivate">
//                       <ActionIcon variant="light" color="red" radius="md" size="sm"
//                         onClick={() => handleToggle()}>
//                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//                           stroke="currentColor" strokeWidth="2">
//                           <circle cx="12" cy="12" r="10" />
//                           <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
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

//   const CustomerCards = () => (
//     <>
//       {filtered.length === 0 ? (
//         <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
//           <Text size="sm" className="text-text-300">No customers found</Text>
//         </div>
//       ) : (
//         <Stack gap="sm">
//           {filtered.map(c => (
//             <div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
//               <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50">
//                 <div className="min-w-0 mr-3">
//                   <Text fw={700} size="sm" className="text-text-700">{c.full_name}</Text>
//                   <Text size="xs" className="text-text-400 mt-0.5">{String(c.phone)}</Text>
//                   {c.email && (
//                     <Text size="xs" className="text-text-300 truncate">{c.email}</Text>
//                   )}
//                 </div>
//                 <div className="text-right flex-shrink-0">
//                   <Text size="xs" fw={700} className="text-text-600">{c.account_no}</Text>
//                   <div className="flex gap-1 justify-end mt-1 flex-wrap">
//                     <Badge size="xs" radius="sm" variant="light"
//                       color={c.customer_type === 'commercial' ? 'blue' : 'teal'}>
//                       {c.customer_type}
//                     </Badge>
//                     <Badge size="xs" radius="sm" variant="light"
//                       color={c.is_active ? 'green' : 'gray'}>
//                       {c.is_active ? 'Active' : 'Inactive'}
//                     </Badge>
//                   </div>
//                 </div>
//               </div>
//               <div className="flex px-4 py-2.5 gap-4">
//                 <button onClick={() => openEdit(c)}
//                   className="text-xs text-primary-500 font-medium">
//                   Edit
//                 </button>
//                 {c.is_active ? (
//                   <button onClick={() => openToggle(c)}
//                     className="text-xs text-red-400 font-medium">
//                     Deactivate
//                   </button>
//                 ) : (
//                   <button onClick={() => openToggle(c)}
//                     className="text-xs text-green-500 font-medium">
//                     Activate
//                   </button>
//                 )}
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
//           <Title order={3} className="text-text-700 font-bold text-lg md:text-xl">
//             Customers
//           </Title>
//           <Text size="sm" className="text-text-300 mt-0.5 hidden sm:block">
//             Manage all customer accounts
//           </Text>
//         </div>
//         <Button radius="md" size="sm" onClick={openCreate}
//           className="bg-primary-500 hover:bg-primary-600">
//           + Add Customer
//         </Button>
//       </div>

//       <Paper shadow="xs" radius="lg" p="sm" className="bg-white mb-4">
//         <Stack gap="sm">
//           <TextInput
//             placeholder="Search name, phone or account..."
//             value={search}
//             onChange={e => setSearch(e.currentTarget.value)}
//             radius="md"
//           />
//           <Group gap="sm" grow>
//             <Select placeholder="Type" value={typeFilter} onChange={setTypeFilter}
//               data={[
//                 { value: 'domestic', label: 'Domestic' },
//                 { value: 'commercial', label: 'Commercial' }
//               ]}
//               clearable radius="md"
//             />
//             <Select placeholder="Status" value={statusFilter} onChange={setStatusFilter}
//               data={[
//                 { value: 'active', label: 'Active' },
//                 { value: 'inactive', label: 'Inactive' }
//               ]}
//               clearable radius="md"
//             />
//           </Group>
//         </Stack>
//       </Paper>

//       {loading ? (
//         <Stack gap="sm">
//           {[...Array(5)].map((_, i) => <Skeleton key={i} height={60} radius="lg" />)}
//         </Stack>
//       ) : error ? (
//         <Alert color="red" radius="md" variant="light">{error}</Alert>
//       ) : isMobile ? (
//         <CustomerCards />
//       ) : (
//         <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
//           <CustomersTable />
//         </Paper>
//       )}

//       <Modal
//         opened={modalOpen}
//         onClose={() => setModalOpen(false)}
//         title={
//           <Text fw={600} className="text-text-600">
//             {editTarget ? 'Edit Customer' : 'Add Customer'}
//           </Text>
//         }
//         radius="lg" size="md"
//       >
//         <Stack gap="md">
//           {formError && (
//             <Alert color="red" radius="md" variant="light" >{formError}</Alert>
//           )}

//           {editTarget && (
//             <div>
//               <label className="block text-sm font-medium text-text-500 mb-1">Account No</label>
//               <input type="text" value={editTarget.account_no} disabled
//                 className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm text-text-300 bg-gray-50"
//               />
//             </div>
//           )}

//           {!editTarget && (
//             <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2.5">
//               <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//                 stroke="#185FA5" strokeWidth="2">
//                 <circle cx="12" cy="12" r="10" />
//                 <line x1="12" y1="8" x2="12" y2="12" />
//                 <line x1="12" y1="16" x2="12.01" y2="16" />
//               </svg>
//               <Text size="xs" className="text-primary-700">
//                 Account number will be auto-generated (e.g. GT-00016)
//               </Text>
//             </div>
//           )}

//           <TextInput label="Full Name" placeholder="John Doe" radius="md"
//             value={form.full_name}
//             onChange={e => setForm({ ...form, full_name: e.currentTarget.value })}
//           />

//           <div>
//             <label className="block text-sm font-medium text-text-500 mb-1">Phone Number</label>
//             <input type="tel" placeholder="e.g. 0712345678"
//               value={form.phone}
//               onChange={e => handlePhoneChange(e.target.value)}
//               className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//             />
//             {phonePreview && form.phone && (
//               <div className="flex items-center gap-1.5 mt-1.5">
//                 <div className="w-3 h-3 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
//                   <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
//                     stroke="#22c55e" strokeWidth="3">
//                     <polyline points="20 6 9 17 4 12" />
//                   </svg>
//                 </div>
//                 <Text size="xs" className="text-green-600">
//                   Will be saved as <span className="font-semibold">{phonePreview}</span>
//                 </Text>
//               </div>
//             )}
//             <Text size="xs" className="text-text-200 mt-1">
//               Any format — 0712..., 254712..., or +254712...
//             </Text>
//           </div>

//           <TextInput label="Email" placeholder="john@gmail.com" radius="md"
//             value={form.email}
//             onChange={e => setForm({ ...form, email: e.currentTarget.value })}
//           />

//           <TextInput label="Address" placeholder="Plot 1 Gitaru Town" radius="md"
//             value={form.address}
//             onChange={e => setForm({ ...form, address: e.currentTarget.value })}
//           />

//           <Select label="Customer Type" radius="md"
//             value={form.customer_type}
//             onChange={val => setForm({ ...form, customer_type: val || 'domestic' })}
//             data={[
//               { value: 'domestic', label: 'Domestic' },
//               { value: 'commercial', label: 'Commercial' }
//             ]}
//           />

//           <Button fullWidth radius="md" size="md" loading={saving}
//             onClick={handleSave}
//             className="bg-primary-500 hover:bg-primary-600">
//             {editTarget ? 'Save Changes' : 'Create Customer'}
//           </Button>
//         </Stack>
//       </Modal>

//       {/* Activate / Deactivate Modal */}
//       <Modal
//         opened={toggleModal}
//         onClose={() => setToggleModal(false)}
//         title={
//           <Text fw={600} className="text-text-600">
//             {toggleTarget?.is_active ? 'Deactivate Customer' : 'Activate Customer'}
//           </Text>
//         }
//         radius="lg" size="sm">
//         {toggleTarget && (
//           <Stack gap="md">
//             <div className="bg-gray-50 rounded-xl p-4">
//               <Text fw={600} size="sm" className="text-text-700">{toggleTarget.full_name}</Text>
//               <Text size="xs" className="text-text-300">{toggleTarget.account_no}</Text>
//             </div>

//             {toggleTarget.is_active ? (
//               <>
//                 <Text size="sm" className="text-text-400">
//                   Deactivating this customer will prevent them from using the portal.
//                   Their data and invoices will remain intact.
//                 </Text>
//                 <div
//                   onClick={() => setToggleDeactivateMeters(!toggleDeactivateMeters)}
//                   className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
//                     toggleDeactivateMeters
//                       ? 'border-red-400 bg-red-50'
//                       : 'border-gray-200 hover:border-gray-300'
//                   }`}>
//                   <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
//                     toggleDeactivateMeters ? 'bg-red-400' : 'bg-gray-200'
//                   }`}>
//                     {toggleDeactivateMeters && (
//                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
//                         stroke="white" strokeWidth="3">
//                         <polyline points="20 6 9 17 4 12" />
//                       </svg>
//                     )}
//                   </div>
//                   <div>
//                     <Text size="sm" fw={500} className="text-text-600">
//                       Also deactivate their meter(s)
//                     </Text>
//                     <Text size="xs" className="text-text-300 mt-0.5">
//                       Meter readings cannot be submitted for deactivated meters
//                     </Text>
//                   </div>
//                 </div>
//                 <Button fullWidth radius="md" loading={toggling}
//                   color="red" onClick={handleToggle}>
//                   Deactivate Customer{toggleDeactivateMeters ? ' + Meter(s)' : ''}
//                 </Button>
//               </>
//             ) : (
//               <>
//                 <Text size="sm" className="text-text-400">
//                   Reactivating this customer will restore their portal access.
//                   Their previous data remains unchanged.
//                 </Text>
//                 <Button fullWidth radius="md" loading={toggling}
//                   color="green" onClick={handleToggle}>
//                   Activate Customer
//                 </Button>
//               </>
//             )}

//             <Button fullWidth radius="md" variant="subtle"
//               onClick={() => setToggleModal(false)}>
//               Cancel
//             </Button>
//           </Stack>
//         )}
//       </Modal>
//     </div>
//   )
// }












































// NEW CODE FINALL



import { useEffect, useState } from 'react'
import {
  Paper, Title, Text, TextInput, Select, Button, Badge, Modal,
  Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import api from '../utils/api'

interface Customer {
  id: number
  full_name: string
  phone: string | number
  email: string
  address: string
  account_no: string
  customer_type: string
  is_active: boolean
  created_at: string
}

interface CustomerForm {
  full_name: string
  phone: string
  email: string
  address: string
  customer_type: string
}

const emptyForm: CustomerForm = {
  full_name: '',
  phone: '',
  email: '',
  address: '',
  customer_type: 'domestic'
}

const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return phone
  if (digits.startsWith('254')) return `+${digits}`
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`
  if (digits.startsWith('7') || digits.startsWith('1')) return `+254${digits}`
  return `+${digits}`
}

export default function Customers() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [customers, setCustomers] = useState<Customer[]>([])
  const [filtered, setFiltered] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [phonePreview, setPhonePreview] = useState('')

  const load = async () => {
    try {
      const res = await api.get('/customers')
      setCustomers(res.data.data)
      setFiltered(res.data.data)
    } catch {
      setError('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = [...customers]
    if (search) {
      const q = search.toLowerCase().trim()
      const qDigits = search.replace(/\D/g, '')
      data = data.filter(c => {
        const nameMatch = c.full_name.toLowerCase().includes(q)
        const accountMatch = c.account_no.toLowerCase().includes(q)
        const phoneMatch = qDigits.length > 0
          ? String(c.phone).replace(/\D/g, '').includes(qDigits)
          : false
        return nameMatch || accountMatch || phoneMatch
      })
    }
    if (typeFilter) data = data.filter(c => c.customer_type === typeFilter)
    if (statusFilter) data = data.filter(c =>
      statusFilter === 'active' ? c.is_active : !c.is_active
    )
    setFiltered(data)
  }, [search, typeFilter, statusFilter, customers])

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setPhonePreview('')
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (c: Customer) => {
    setEditTarget(c)
    const phone = String(c.phone)
    setForm({
      full_name: c.full_name,
      phone,
      email: c.email || '',
      address: c.address || '',
      customer_type: c.customer_type
    })
    setPhonePreview(normalizePhone(phone))
    setFormError('')
    setModalOpen(true)
  }

  const handlePhoneChange = (value: string) => {
    setForm({ ...form, phone: value })
    if (value.replace(/\D/g, '').length >= 9) {
      setPhonePreview(normalizePhone(value))
    } else {
      setPhonePreview('')
    }
  }

  const handleSave = async () => {
    if (!form.full_name || !form.phone) {
      setFormError('Full name and phone number are required')
      return
    }
    if (form.phone.replace(/\D/g, '').length < 9) {
      setFormError('Please enter a valid phone number')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = { ...form, phone: normalizePhone(form.phone) }
      if (editTarget) {
        await api.patch(`/customers/${editTarget.id}`, payload)
      } else {
        await api.post('/customers', payload)
      }
      setModalOpen(false)
      load()
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save customer')
    } finally {
      setSaving(false)
    }
  }

  // toggle modal state
  const [toggleModal, setToggleModal] = useState(false)
  const [toggleTarget, setToggleTarget] = useState<Customer | null>(null)
  const [toggleDeactivateMeters, setToggleDeactivateMeters] = useState(false)
  const [toggling, setToggling] = useState(false)

  const openToggle = (c: Customer) => {
    setToggleTarget(c)
    setToggleDeactivateMeters(false)
    setToggleModal(true)
  }

  const handleToggle = async () => {
    if (!toggleTarget) return
    setToggling(true)
    try {
      if (toggleTarget.is_active) {
        // deactivate customer
        await api.patch(`/customers/${toggleTarget.id}/deactivate`)
        // optionally deactivate meters too
        if (toggleDeactivateMeters) {
          const meterRes = await api.get(`/meters/customer/${toggleTarget.id}`)
          const meters = meterRes.data.data
          await Promise.all(
            meters.map((m: any) => api.patch(`/meters/${m.id}/deactivate`))
          )
        }
      } else {
        // reactivate customer
        await api.patch(`/customers/${toggleTarget.id}/activate`)
      }
      setToggleModal(false)
      load()
    } catch {
      alert(`Failed to ${toggleTarget.is_active ? 'deactivate' : 'activate'} customer`)
    } finally {
      setToggling(false)
    }
  }

  const CustomersTable = () => (
    <div className="table-responsive">
      <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr className="bg-gray-50">
            <Table.Th className="text-text-400 text-xs uppercase">Account No</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Name</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Phone</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Type</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={6} className="text-center text-text-300 py-8">
                No customers found
              </Table.Td>
            </Table.Tr>
          ) : filtered.map(c => (
            <Table.Tr key={c.id}>
              <Table.Td className="text-text-600 font-semibold text-sm">{c.account_no}</Table.Td>
              <Table.Td className="text-text-500 text-sm">{c.full_name}</Table.Td>
              <Table.Td className="text-text-400 text-sm">{String(c.phone)}</Table.Td>
              <Table.Td>
                <Badge size="sm" radius="sm" variant="light"
                  color={c.customer_type === 'commercial' ? 'blue' : 'teal'}>
                  {c.customer_type}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Badge size="sm" radius="sm" variant="light"
                  color={c.is_active ? 'green' : 'gray'}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <Tooltip label="Edit">
                    <ActionIcon variant="light" color="blue" radius="md" size="sm"
                      onClick={() => openEdit(c)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </ActionIcon>
                  </Tooltip>
                  {c.is_active ? (
                    <Tooltip label="Deactivate">
                      <ActionIcon variant="light" color="red" radius="md" size="sm"
                        onClick={() => openToggle(c)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                      </ActionIcon>
                    </Tooltip>
                  ) : (
                    <Tooltip label="Activate">
                      <ActionIcon variant="light" color="green" radius="md" size="sm"
                        onClick={() => openToggle(c)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  )

  const CustomerCards = () => (
    <>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <Text size="sm" className="text-text-300">No customers found</Text>
        </div>
      ) : (
        <Stack gap="sm">
          {filtered.map(c => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50">
                <div className="min-w-0 mr-3">
                  <Text fw={700} size="sm" className="text-text-700">{c.full_name}</Text>
                  <Text size="xs" className="text-text-400 mt-0.5">{String(c.phone)}</Text>
                  {c.email && (
                    <Text size="xs" className="text-text-300 truncate">{c.email}</Text>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <Text size="xs" fw={700} className="text-text-600">{c.account_no}</Text>
                  <div className="flex gap-1 justify-end mt-1 flex-wrap">
                    <Badge size="xs" radius="sm" variant="light"
                      color={c.customer_type === 'commercial' ? 'blue' : 'teal'}>
                      {c.customer_type}
                    </Badge>
                    <Badge size="xs" radius="sm" variant="light"
                      color={c.is_active ? 'green' : 'gray'}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex px-4 py-2.5 gap-4">
                <button onClick={() => openEdit(c)}
                  className="text-xs text-primary-500 font-medium">
                  Edit
                </button>
                {c.is_active ? (
                  <button onClick={() => openToggle(c)}
                    className="text-xs text-red-400 font-medium">
                    Deactivate
                  </button>
                ) : (
                  <button onClick={() => openToggle(c)}
                    className="text-xs text-green-500 font-medium">
                    Activate
                  </button>
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
      <div className="flex items-center justify-between mb-5">
        <div>
          <Title order={3} className="text-text-700 font-bold text-lg md:text-xl">
            Customers
          </Title>
          <Text size="sm" className="text-text-300 mt-0.5 hidden sm:block">
            Manage all customer accounts
          </Text>
        </div>
        <Button radius="md" size="sm" onClick={openCreate}
          className="bg-primary-500 hover:bg-primary-600">
          + Add Customer
        </Button>
      </div>

      <Paper shadow="xs" radius="lg" p="sm" className="bg-white mb-4">
        <Stack gap="sm">
          <TextInput
            placeholder="Search name, phone or account..."
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
            radius="md"
          />
          <Group gap="sm" grow>
            <Select placeholder="Type" value={typeFilter} onChange={setTypeFilter}
              data={[
                { value: 'domestic', label: 'Domestic' },
                { value: 'commercial', label: 'Commercial' }
              ]}
              clearable radius="md"
            />
            <Select placeholder="Status" value={statusFilter} onChange={setStatusFilter}
              data={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
              clearable radius="md"
            />
          </Group>
        </Stack>
      </Paper>

      {loading ? (
        <Stack gap="sm">
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={60} radius="lg" />)}
        </Stack>
      ) : error ? (
        <Alert color="red" radius="md" variant="light">{error}</Alert>
      ) : isMobile ? (
        <CustomerCards />
      ) : (
        <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
          <CustomersTable />
        </Paper>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <Text fw={600} className="text-text-600">
            {editTarget ? 'Edit Customer' : 'Add Customer'}
          </Text>
        }
        radius="lg" size="md"
      >
        <Stack gap="md">
          {formError && (
            <Alert color="red" radius="md" variant="light">{formError}</Alert>
          )}

          {editTarget && (
            <div>
              <label className="block text-sm font-medium text-text-500 mb-1">Account No</label>
              <input type="text" value={editTarget.account_no} disabled
                className="w-full border border-gray-100 rounded-lg px-3 py-2.5 text-sm text-text-300 bg-gray-50"
              />
            </div>
          )}

          {!editTarget && (
            <div className="flex items-center gap-2 bg-primary-50 rounded-lg px-3 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#185FA5" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <Text size="xs" className="text-primary-700">
                Account number will be auto-generated (e.g. GT-00016)
              </Text>
            </div>
          )}

          <TextInput label="Full Name" placeholder="John Doe" radius="md"
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.currentTarget.value })}
          />

          <div>
            <label className="block text-sm font-medium text-text-500 mb-1">Phone Number</label>
            <input type="tel" placeholder="e.g. 0712345678"
              value={form.phone}
              onChange={e => handlePhoneChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            {phonePreview && form.phone && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-3 h-3 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none"
                    stroke="#22c55e" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <Text size="xs" className="text-green-600">
                  Will be saved as <span className="font-semibold">{phonePreview}</span>
                </Text>
              </div>
            )}
            <Text size="xs" className="text-text-200 mt-1">
              Any format — 0712..., 254712..., or +254712...
            </Text>
          </div>

          <TextInput label="Email" placeholder="john@gmail.com" radius="md"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.currentTarget.value })}
          />

          <TextInput label="Address" placeholder="Plot 1 Gitaru Town" radius="md"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.currentTarget.value })}
          />

          <Select label="Customer Type" radius="md"
            value={form.customer_type}
            onChange={val => setForm({ ...form, customer_type: val || 'domestic' })}
            data={[
              { value: 'domestic', label: 'Domestic' },
              { value: 'commercial', label: 'Commercial' }
            ]}
          />

          <Button fullWidth radius="md" size="md" loading={saving}
            onClick={handleSave}
            className="bg-primary-500 hover:bg-primary-600">
            {editTarget ? 'Save Changes' : 'Create Customer'}
          </Button>
        </Stack>
      </Modal>

      {/* Activate / Deactivate Modal */}
      <Modal
        opened={toggleModal}
        onClose={() => setToggleModal(false)}
        title={
          <Text fw={600} className="text-text-600">
            {toggleTarget?.is_active ? 'Deactivate Customer' : 'Activate Customer'}
          </Text>
        }
        radius="lg" size="sm">
        {toggleTarget && (
          <Stack gap="md">
            <div className="bg-gray-50 rounded-xl p-4">
              <Text fw={600} size="sm" className="text-text-700">{toggleTarget.full_name}</Text>
              <Text size="xs" className="text-text-300">{toggleTarget.account_no}</Text>
            </div>

            {toggleTarget.is_active ? (
              <>
                <Text size="sm" className="text-text-400">
                  Deactivating this customer will prevent them from using the portal.
                  Their data and invoices will remain intact.
                </Text>
                <div
                  onClick={() => setToggleDeactivateMeters(!toggleDeactivateMeters)}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    toggleDeactivateMeters
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    toggleDeactivateMeters ? 'bg-red-400' : 'bg-gray-200'
                  }`}>
                    {toggleDeactivateMeters && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <Text size="sm" fw={500} className="text-text-600">
                      Also deactivate their meter(s)
                    </Text>
                    <Text size="xs" className="text-text-300 mt-0.5">
                      Meter readings cannot be submitted for deactivated meters
                    </Text>
                  </div>
                </div>
                <Button fullWidth radius="md" loading={toggling}
                  color="red" onClick={handleToggle}>
                  Deactivate Customer{toggleDeactivateMeters ? ' + Meter(s)' : ''}
                </Button>
              </>
            ) : (
              <>
                <Text size="sm" className="text-text-400">
                  Reactivating this customer will restore their portal access.
                  Their previous data remains unchanged.
                </Text>
                <Button fullWidth radius="md" loading={toggling}
                  color="green" onClick={handleToggle}>
                  Activate Customer
                </Button>
              </>
            )}

            <Button fullWidth radius="md" variant="subtle"
              onClick={() => setToggleModal(false)}>
              Cancel
            </Button>
          </Stack>
        )}
      </Modal>
    </div>
  )
}





