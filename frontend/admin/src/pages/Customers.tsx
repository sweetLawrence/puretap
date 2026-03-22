// import { useEffect, useState } from 'react'
// import {
//   Paper, Title, Text, TextInput, Select, Button, Badge, Modal,
//   Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip
// } from '@mantine/core'
// import api from '../utils/api'

// interface Customer {
//   id: number
//   full_name: string
//   phone: string  // Allow both string and number
//   email: string
//   address: string
//   account_no: string
//   customer_type: string
//   is_active: boolean
//   created_at: string
// }

// const emptyForm = {
//   full_name: '', phone: '', email: '',
//   address: '', account_no: '', customer_type: 'domestic'
// }

// const normalizePhone = (phone: string): string => {
//   const digits = phone.replace(/\D/g, '')
//   if (digits.startsWith('254')) return `+${digits}`
//   if (digits.startsWith('0')) return `+254${digits.slice(1)}`
//   if (digits.startsWith('7') || digits.startsWith('1')) return `+254${digits}`
//   return `+${digits}`
// }

// export default function Customers() {
//   const [customers, setCustomers] = useState<Customer[]>([])
//   const [filtered, setFiltered] = useState<Customer[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [search, setSearch] = useState('')
//   const [typeFilter, setTypeFilter] = useState<string | null>(null)
//   const [statusFilter, setStatusFilter] = useState<string | null>(null)
//   const [modalOpen, setModalOpen] = useState(false)
//   const [editTarget, setEditTarget] = useState<Customer | null>(null)
//   const [form, setForm] = useState(emptyForm)
//   const [saving, setSaving] = useState(false)
//   const [formError, setFormError] = useState('')

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

//   // useEffect(() => {
//   //   let data = [...customers]
//   //   if (search) {
//   //     const q = search.toLowerCase()
//   //     data = data.filter(c =>
//   //       c.full_name.toLowerCase().includes(q) ||
//   //       // c.phone.includes(q) ||
//   //       c.phone?.toString().includes(q) || // Convert to string if it exists
//   //       c.account_no.toLowerCase().includes(q)
//   //     )
//   //   }
//   //   if (typeFilter) data = data.filter(c => c.customer_type === typeFilter)
//   //   if (statusFilter) data = data.filter(c =>
//   //     statusFilter === 'active' ? c.is_active : !c.is_active
//   //   )
//   //   setFiltered(data)
//   // }, [search, typeFilter, statusFilter, customers])

//   useEffect(() => {
//   let data = [...customers]
//   if (search) {
//     const q = search.toLowerCase()
//     const qDigits = search.replace(/\D/g, '')
//     data = data.filter(c =>
//       c.full_name.toLowerCase().includes(q) ||
//       String(c.phone).replace(/\D/g, '').includes(qDigits) ||
//       c.account_no.toLowerCase().includes(q)
//     )
//   }
//   if (typeFilter) data = data.filter(c => c.customer_type === typeFilter)
//   if (statusFilter) data = data.filter(c =>
//     statusFilter === 'active' ? c.is_active : !c.is_active
//   )
//   setFiltered(data)
// }, [search, typeFilter, statusFilter, customers])

//   const openCreate = () => {
//     setEditTarget(null)
//     setForm(emptyForm)
//     setFormError('')
//     setModalOpen(true)
//   }

//   const openEdit = (c: Customer) => {
//     setEditTarget(c)
//     setForm({
//       full_name: c.full_name, phone: c.phone,
//       email: c.email || '', address: c.address || '',
//       account_no: c.account_no, customer_type: c.customer_type
//     })
//     setFormError('')
//     setModalOpen(true)
//   }

//   // const handleSave = async () => {
//   //   if (!form.full_name || !form.phone || !form.account_no) {
//   //     setFormError('Full name, phone and account number are required')
//   //     return
//   //   }
//   //   setSaving(true)
//   //   setFormError('')
//   //   try {
//   //     if (editTarget) {
//   //       await api.patch(`/customers/${editTarget.id}`, form)
//   //     } else {
//   //       await api.post('/customers', form)
//   //     }
//   //     setModalOpen(false)
//   //     load()
//   //   } catch (err: any) {
//   //     setFormError(err.response?.data?.message || 'Failed to save customer')
//   //   } finally {
//   //     setSaving(false)
//   //   }
//   // }

//   const handleSave = async () => {
//   if (!form.full_name || !form.phone || !form.account_no) {
//     setFormError('Full name, phone and account number are required')
//     return
//   }
//   setSaving(true)
//   setFormError('')
//   try {
//     const payload = {
//       ...form,
//       phone: normalizePhone(form.phone),
//       account_no: form.account_no.trim().toUpperCase()
//     }
//     if (editTarget) {
//       await api.patch(`/customers/${editTarget.id}`, payload)
//     } else {
//       await api.post('/customers', payload)
//     }
//     setModalOpen(false)
//     load()
//   } catch (err: any) {
//     setFormError(err.response?.data?.message || 'Failed to save customer')
//   } finally {
//     setSaving(false)
//   }
// }

//   const handleDeactivate = async (id: number) => {
//     if (!confirm('Deactivate this customer?')) return
//     try {
//       await api.patch(`/customers/${id}/deactivate`)
//       load()
//     } catch {
//       alert('Failed to deactivate customer')
//     }
//   }

//   return (
//     <div className="p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <Title order={3} className="text-text-700 font-bold">Customers</Title>
//           <Text size="sm" className="text-text-300 mt-1">
//             Manage all customer accounts
//           </Text>
//         </div>
//         <Button radius="md" onClick={openCreate} className="bg-primary-500 hover:bg-primary-600">
//           + Add Customer
//         </Button>
//       </div>

//       {/* Filters */}
//       <Paper shadow="xs" radius="lg" p="md" className="bg-white mb-4">
//         <Group gap="md" wrap="wrap">
//           <TextInput
//             placeholder="Search name, phone, account..."
//             value={search}
//             onChange={e => setSearch(e.currentTarget.value)}
//             radius="md"
//             className="flex-1 min-w-[200px]"
//           />

//           <Select
//             placeholder="Type"
//             value={typeFilter}
//             onChange={setTypeFilter}
//             data={[
//               { value: 'domestic', label: 'Domestic' },
//               { value: 'commercial', label: 'Commercial' }
//             ]}
//             clearable
//             radius="md"
//             w={140}
//           />
//           <Select
//             placeholder="Status"
//             value={statusFilter}
//             onChange={setStatusFilter}
//             data={[
//               { value: 'active', label: 'Active' },
//               { value: 'inactive', label: 'Inactive' }
//             ]}
//             clearable
//             radius="md"
//             w={140}
//           />
//         </Group>

//         <TextInput
//   label="Phone" placeholder="e.g. 0712345678" radius="md"
//   value={form.phone} onChange={e => setForm({ ...form, phone: e.currentTarget.value })}
// />
// <Text size="xs" className="text-text-200 -mt-2">
//   Enter in any format — 0712..., 254712..., or +254712...
// </Text>
//       </Paper>

//       {/* Table */}
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
//                   <Table.Th className="text-text-400 text-xs uppercase">Account No</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Name</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Phone</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Type</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
//                   <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
//                 </Table.Tr>
//               </Table.Thead>
//               <Table.Tbody>
//                 {filtered.length === 0 ? (
//                   <Table.Tr>
//                     <Table.Td colSpan={6} className="text-center text-text-300 py-8">
//                       No customers found
//                     </Table.Td>
//                   </Table.Tr>
//                 ) : filtered.map(c => (
//                   <Table.Tr key={c.id}>
//                     <Table.Td className="text-text-600 font-semibold text-sm">{c.account_no}</Table.Td>
//                     <Table.Td className="text-text-500 text-sm">{c.full_name}</Table.Td>
//                     <Table.Td className="text-text-400 text-sm">{c.phone}</Table.Td>
//                     <Table.Td>
//                       <Badge
//                         size="sm" radius="sm" variant="light"
//                         color={c.customer_type === 'commercial' ? 'blue' : 'teal'}
//                       >
//                         {c.customer_type}
//                       </Badge>
//                     </Table.Td>
//                     <Table.Td>
//                       <Badge
//                         size="sm" radius="sm" variant="light"
//                         color={c.is_active ? 'green' : 'gray'}
//                       >
//                         {c.is_active ? 'Active' : 'Inactive'}
//                       </Badge>
//                     </Table.Td>
//                     <Table.Td>
//                       <Group gap="xs">
//                         <Tooltip label="Edit">
//                           <ActionIcon
//                             variant="light" color="blue" radius="md" size="sm"
//                             onClick={() => openEdit(c)}
//                           >
//                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                               <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
//                               <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
//                             </svg>
//                           </ActionIcon>
//                         </Tooltip>
//                         {c.is_active && (
//                           <Tooltip label="Deactivate">
//                             <ActionIcon
//                               variant="light" color="red" radius="md" size="sm"
//                               onClick={() => handleDeactivate(c.id)}
//                             >
//                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                 <circle cx="12" cy="12" r="10" />
//                                 <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
//                               </svg>
//                             </ActionIcon>
//                           </Tooltip>
//                         )}
//                       </Group>
//                     </Table.Td>
//                   </Table.Tr>
//                 ))}
//               </Table.Tbody>
//             </Table>
//           </div>
//         )}
//       </Paper>

//       {/* Create / Edit Modal */}
//       <Modal
//         opened={modalOpen}
//         onClose={() => setModalOpen(false)}
//         title={<Text fw={600} className="text-text-600">{editTarget ? 'Edit Customer' : 'Add Customer'}</Text>}
//         radius="lg"
//         size="md"
//       >
//         <Stack gap="sm">
//           {formError && <Alert color="red" radius="md" variant="light">{formError}</Alert>}
//           <TextInput
//             label="Full Name" placeholder="John Doe" radius="md"
//             value={form.full_name} onChange={e => setForm({ ...form, full_name: e.currentTarget.value })}
//           />
//           <TextInput
//             label="Phone" placeholder="+254700000000" radius="md"
//             value={form.phone} onChange={e => setForm({ ...form, phone: e.currentTarget.value })}
//           />
//           <TextInput
//             label="Email" placeholder="john@gmail.com" radius="md"
//             value={form.email} onChange={e => setForm({ ...form, email: e.currentTarget.value })}
//           />
//           <TextInput
//             label="Address" placeholder="Plot 1 Gitaru Town" radius="md"
//             value={form.address} onChange={e => setForm({ ...form, address: e.currentTarget.value })}
//           />
//           <TextInput
//             label="Account No" placeholder="GT-0016" radius="md"
//             value={form.account_no} onChange={e => setForm({ ...form, account_no: e.currentTarget.value })}
//             disabled={!!editTarget}
//           />
//           <Select
//             label="Customer Type" radius="md"
//             value={form.customer_type}
//             onChange={val => setForm({ ...form, customer_type: val || 'domestic' })}
//             data={[
//               { value: 'domestic', label: 'Domestic' },
//               { value: 'commercial', label: 'Commercial' }
//             ]}
//           />
//           <Button
//             fullWidth radius="md" loading={saving}
//             onClick={handleSave} className="bg-primary-500 hover:bg-primary-600 mt-2"
//           >
//             {editTarget ? 'Save Changes' : 'Create Customer'}
//           </Button>
//         </Stack>
//       </Modal>
//     </div>
//   )
// }







// import { useEffect, useState } from 'react'
// import {
//   Paper,
//   Title,
//   Text,
//   TextInput,
//   Select,
//   Button,
//   Badge,
//   Modal,
//   Table,
//   ActionIcon,
//   Group,
//   Stack,
//   Alert,
//   Skeleton,
//   Tooltip
// } from '@mantine/core'
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

// const emptyForm = {
//   full_name: '',
//   phone: '',
//   email: '',
//   address: '',
//   // account_no: '',
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

// export default function Customers () {
//   const [customers, setCustomers] = useState<Customer[]>([])
//   const [filtered, setFiltered] = useState<Customer[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState('')
//   const [search, setSearch] = useState('')
//   const [typeFilter, setTypeFilter] = useState<string | null>(null)
//   const [statusFilter, setStatusFilter] = useState<string | null>(null)
//   const [modalOpen, setModalOpen] = useState(false)
//   const [editTarget, setEditTarget] = useState<Customer | null>(null)
//   const [form, setForm] = useState(emptyForm)
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

//   useEffect(() => {
//     load()
//   }, [])

//   // useEffect(() => {
//   //   let data = [...customers]
//   //   if (search) {
//   //     const q = search.toLowerCase()
//   //     const qDigits = search.replace(/\D/g, '')
//   //     data = data.filter(c =>
//   //       c.full_name.toLowerCase().includes(q) ||
//   //       String(c.phone).replace(/\D/g, '').includes(qDigits) ||
//   //       c.account_no.toLowerCase().includes(q)
//   //     )
//   //   }
//   //   if (typeFilter) data = data.filter(c => c.customer_type === typeFilter)
//   //   if (statusFilter) data = data.filter(c =>
//   //     statusFilter === 'active' ? c.is_active : !c.is_active
//   //   )
//   //   setFiltered(data)
//   // }, [search, typeFilter, statusFilter, customers])

//   useEffect(() => {
//     let data = [...customers]
//     if (search) {
//       const q = search.toLowerCase().trim()
//       const qDigits = search.replace(/\D/g, '')

//       data = data.filter(c => {
//         const nameMatch = c.full_name.toLowerCase().includes(q)
//         const accountMatch = c.account_no.toLowerCase().includes(q)
//         const phoneMatch =
//           qDigits.length > 0
//             ? String(c.phone).replace(/\D/g, '').includes(qDigits)
//             : false

//         return nameMatch || accountMatch || phoneMatch
//       })
//     }
//     if (typeFilter) data = data.filter(c => c.customer_type === typeFilter)
//     if (statusFilter)
//       data = data.filter(c =>
//         statusFilter === 'active' ? c.is_active : !c.is_active
//       )
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
//       // account_no: c.account_no,
//       customer_type: c.customer_type
//     })
//     setPhonePreview(normalizePhone(phone))
//     setFormError('')
//     setModalOpen(true)
//   }

//   const handlePhoneChange = (value: string) => {
//     setForm({ ...form, phone: value })
//     if (value.length >= 9) {
//       setPhonePreview(normalizePhone(value))
//     } else {
//       setPhonePreview('')
//     }
//   }

//   const handleSave = async () => {
//     if (!form.full_name || !form.phone
//       //  !form.account_no
//       ) {
//       setFormError('Full name, phone and account number are required')
//       return
//     }
//     setSaving(true)
//     setFormError('')
//     try {
//       const payload = {
//         ...form,
//         phone: normalizePhone(form.phone),
//         // account_no: form.account_no.trim().toUpperCase()
//       }
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

//   return (
//     <div className='p-4 md:p-6'>
//       {/* header */}
//       <div className='flex items-center justify-between mb-5'>
//         <div>
//           <Title
//             order={3}
//             className='text-text-700 font-bold text-lg md:text-xl'
//           >
//             Customers
//           </Title>
//           <Text size='sm' className='text-text-300 mt-0.5 hidden sm:block'>
//             Manage all customer accounts
//           </Text>
//         </div>
//         <Button
//           radius='md'
//           size='sm'
//           onClick={openCreate}
//           className='bg-primary-500 hover:bg-primary-600'
//         >
//           + Add Customer
//         </Button>
//       </div>

//       {/* filters */}
//       <Paper shadow='xs' radius='lg' p='sm' className='bg-white mb-4'>
//         <Stack gap='sm'>
//           <TextInput
//             placeholder="Search by Customer's Name or Account Number"
//             value={search}
//             onChange={e => setSearch(e.currentTarget.value)}
//             radius='md'
//           />
//           <Group gap='sm' grow>
//             <Select
//               placeholder='Type'
//               value={typeFilter}
//               onChange={setTypeFilter}
//               data={[
//                 { value: 'domestic', label: 'Domestic' },
//                 { value: 'commercial', label: 'Commercial' }
//               ]}
//               clearable
//               radius='md'
//             />
//             <Select
//               placeholder='Status'
//               value={statusFilter}
//               onChange={setStatusFilter}
//               data={[
//                 { value: 'active', label: 'Active' },
//                 { value: 'inactive', label: 'Inactive' }
//               ]}
//               clearable
//               radius='md'
//             />
//           </Group>
//         </Stack>
//       </Paper>

//       {/* desktop table / mobile cards */}
//       {loading ? (
//         <Stack gap='sm'>
//           {[...Array(5)].map((_, i) => (
//             <Skeleton key={i} height={60} radius='lg' />
//           ))}
//         </Stack>
//       ) : error ? (
//         <Alert color='red' radius='md' variant='light'>
//           {error}
//         </Alert>
//       ) : (
//         <>
//           {/* desktop table — hidden on mobile */}
//           <Paper
//             shadow='xs'
//             radius='lg'
//             className='bg-white overflow-hidden hidden md:block'
//           >
//             <div className='table-responsive'>
//               <Table
//                 striped
//                 highlightOnHover
//                 verticalSpacing='sm'
//                 horizontalSpacing='md'
//               >
//                 <Table.Thead>
//                   <Table.Tr className='bg-gray-50'>
//                     <Table.Th className='text-text-400 text-xs uppercase'>
//                       Account No
//                     </Table.Th>
//                     <Table.Th className='text-text-400 text-xs uppercase'>
//                       Name
//                     </Table.Th>
//                     <Table.Th className='text-text-400 text-xs uppercase'>
//                       Phone
//                     </Table.Th>
//                     <Table.Th className='text-text-400 text-xs uppercase'>
//                       Type
//                     </Table.Th>
//                     <Table.Th className='text-text-400 text-xs uppercase'>
//                       Status
//                     </Table.Th>
//                     <Table.Th className='text-text-400 text-xs uppercase'>
//                       Actions
//                     </Table.Th>
//                   </Table.Tr>
//                 </Table.Thead>
//                 <Table.Tbody>
//                   {filtered.length === 0 ? (
//                     <Table.Tr>
//                       <Table.Td
//                         colSpan={6}
//                         className='text-center text-text-300 py-8'
//                       >
//                         No customers found
//                       </Table.Td>
//                     </Table.Tr>
//                   ) : (
//                     filtered.map(c => (
//                       <Table.Tr key={c.id}>
//                         <Table.Td className='text-text-600 font-semibold text-sm'>
//                           {c.account_no}
//                         </Table.Td>
//                         <Table.Td className='text-text-500 text-sm'>
//                           {c.full_name}
//                         </Table.Td>
//                         <Table.Td className='text-text-400 text-sm'>
//                           {String(c.phone)}
//                         </Table.Td>
//                         <Table.Td>
//                           <Badge
//                             size='sm'
//                             radius='sm'
//                             variant='light'
//                             color={
//                               c.customer_type === 'commercial' ? 'blue' : 'teal'
//                             }
//                           >
//                             {c.customer_type}
//                           </Badge>
//                         </Table.Td>
//                         <Table.Td>
//                           <Badge
//                             size='sm'
//                             radius='sm'
//                             variant='light'
//                             color={c.is_active ? 'green' : 'gray'}
//                           >
//                             {c.is_active ? 'Active' : 'Inactive'}
//                           </Badge>
//                         </Table.Td>
//                         <Table.Td>
//                           <Group gap='xs'>
//                             <Tooltip label='Edit'>
//                               <ActionIcon
//                                 variant='light'
//                                 color='blue'
//                                 radius='md'
//                                 size='sm'
//                                 onClick={() => openEdit(c)}
//                               >
//                                 <svg
//                                   width='14'
//                                   height='14'
//                                   viewBox='0 0 24 24'
//                                   fill='none'
//                                   stroke='currentColor'
//                                   strokeWidth='2'
//                                 >
//                                   <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
//                                   <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
//                                 </svg>
//                               </ActionIcon>
//                             </Tooltip>
//                             {c.is_active && (
//                               <Tooltip label='Deactivate'>
//                                 <ActionIcon
//                                   variant='light'
//                                   color='red'
//                                   radius='md'
//                                   size='sm'
//                                   onClick={() => handleDeactivate(c.id)}
//                                 >
//                                   <svg
//                                     width='14'
//                                     height='14'
//                                     viewBox='0 0 24 24'
//                                     fill='none'
//                                     stroke='currentColor'
//                                     strokeWidth='2'
//                                   >
//                                     <circle cx='12' cy='12' r='10' />
//                                     <line
//                                       x1='4.93'
//                                       y1='4.93'
//                                       x2='19.07'
//                                       y2='19.07'
//                                     />
//                                   </svg>
//                                 </ActionIcon>
//                               </Tooltip>
//                             )}
//                           </Group>
//                         </Table.Td>
//                       </Table.Tr>
//                     ))
//                   )}
//                 </Table.Tbody>
//               </Table>
//             </div>
//           </Paper>

//           {/* mobile cards — hidden on desktop */}
//           <div className='md:hidden'>
//             {filtered.length === 0 ? (
//               <div className='bg-white rounded-2xl p-8 text-center shadow-sm'>
//                 <Text size='sm' className='text-text-300'>
//                   No customers found
//                 </Text>
//               </div>
//             ) : (
//               <Stack gap='sm'>
//                 {filtered.map(c => (
//                   <div
//                     key={c.id}
//                     className='bg-white rounded-2xl shadow-sm overflow-hidden'
//                   >
//                     <div className='flex items-start justify-between px-4 py-3 border-b border-gray-50'>
//                       <div className='min-w-0 mr-3'>
//                         <Text fw={700} size='sm' className='text-text-700'>
//                           {c.full_name}
//                         </Text>
//                         <Text size='xs' className='text-text-400 mt-0.5'>
//                           {String(c.phone)}
//                         </Text>
//                       </div>
//                       <div className='text-right flex-shrink-0'>
//                         <Text size='xs' fw={600} className='text-text-500'>
//                           {c.account_no}
//                         </Text>
//                         <div className='flex gap-1 justify-end mt-1'>
//                           <Badge
//                             size='xs'
//                             radius='sm'
//                             variant='light'
//                             color={
//                               c.customer_type === 'commercial' ? 'blue' : 'teal'
//                             }
//                           >
//                             {c.customer_type}
//                           </Badge>
//                           <Badge
//                             size='xs'
//                             radius='sm'
//                             variant='light'
//                             color={c.is_active ? 'green' : 'gray'}
//                           >
//                             {c.is_active ? 'Active' : 'Inactive'}
//                           </Badge>
//                         </div>
//                       </div>
//                     </div>
//                     <div className='flex px-4 py-2.5 gap-3'>
//                       <button
//                         onClick={() => openEdit(c)}
//                         className='text-xs text-primary-500 font-medium'
//                       >
//                         Edit
//                       </button>
//                       {c.is_active && (
//                         <button
//                           onClick={() => handleDeactivate(c.id)}
//                           className='text-xs text-red-400 font-medium'
//                         >
//                           Deactivate
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </Stack>
//             )}
//           </div>
//         </>
//       )}

//       {/* create / edit modal */}
//       <Modal
//         opened={modalOpen}
//         onClose={() => setModalOpen(false)}
//         title={
//           <Text fw={600} className='text-text-600'>
//             {editTarget ? 'Edit Customer' : 'Add Customer'}
//           </Text>
//         }
//         radius='lg'
//         size='md'
//         fullScreen={false}
//       >
//         <Stack gap='sm'>
//           {formError && (
//             <Alert color='red' radius='md' variant='light'>
//               {formError}
//             </Alert>
//           )}

//           <TextInput
//             label='Full Name'
//             placeholder='John Doe'
//             radius='md'
//             value={form.full_name}
//             onChange={e =>
//               setForm({ ...form, full_name: e.currentTarget.value })
//             }
//           />

//           {/* phone with live preview */}
//           <div>
//             <label className='block text-sm font-medium text-text-500 mb-1'>
//               Phone Number
//             </label>
//             <input
//               type='tel'
//               placeholder='e.g. 0712345678'
//               value={form.phone}
//               onChange={e => handlePhoneChange(e.target.value)}
//               className='w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300'
//             />
//             {phonePreview && form.phone && (
//               <div className='flex items-center gap-1.5 mt-1.5'>
//                 <div className='w-3 h-3 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0'>
//                   <svg
//                     width='8'
//                     height='8'
//                     viewBox='0 0 24 24'
//                     fill='none'
//                     stroke='#22c55e'
//                     strokeWidth='3'
//                   >
//                     <polyline points='20 6 9 17 4 12' />
//                   </svg>
//                 </div>
//                 <Text size='xs' className='text-green-600'>
//                   Will be saved as{' '}
//                   <span className='font-semibold'>{phonePreview}</span>
//                 </Text>
//               </div>
//             )}
//             <Text size='xs' className='text-text-200 mt-1'>
//               Any format — 0712..., 254712..., or +254712...
//             </Text>
//           </div>

//           <TextInput
//             label='Email'
//             placeholder='john@gmail.com'
//             radius='md'
//             value={form.email}
//             onChange={e => setForm({ ...form, email: e.currentTarget.value })}
//           />

//           <TextInput
//             label='Address'
//             placeholder='Plot 1 Gitaru Town'
//             radius='md'
//             value={form.address}
//             onChange={e => setForm({ ...form, address: e.currentTarget.value })}
//           />

//           {/* <div>
//             <label className="block text-sm font-medium text-text-500 mb-1">Account No</label>
//             <input
//               type="text"
//               placeholder="GT-0016"
//               value={form.account_no}
//               onChange={e => setForm({ ...form, account_no: e.currentTarget.value.toUpperCase() })}
//               disabled={!!editTarget}
//               className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:bg-gray-50 disabled:text-text-300"
//             />
//             {!editTarget && (
//               <Text size="xs" className="text-text-200 mt-1">
//                 Auto-uppercased — e.g. gt-0016 becomes GT-0016
//               </Text>
//             )}
//           </div> */}

//           {/* only show account no on edit — auto-generated on create */}
//           {editTarget && (
//             <div>
//               <label className='block text-sm font-medium text-text-500 mb-1'>
//                 Account No
//               </label>
//               <input
//                 type='text'
//                 // value={form.account_no}
//                 disabled
//                 className='w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-300 bg-gray-50'
//               />
//               <Text size='xs' className='text-text-200 mt-1'>
//                 Account number cannot be changed
//               </Text>
//             </div>
//           )}

//           <Select
//             label='Customer Type'
//             radius='md'
//             value={form.customer_type}
//             onChange={val =>
//               setForm({ ...form, customer_type: val || 'domestic' })
//             }
//             data={[
//               { value: 'domestic', label: 'Domestic' },
//               { value: 'commercial', label: 'Commercial' }
//             ]}
//           />

//           <Button
//             fullWidth
//             radius='md'
//             size='md'
//             loading={saving}
//             onClick={handleSave}
//             className='bg-primary-500 hover:bg-primary-600 mt-2'
//           >
//             {editTarget ? 'Save Changes' : 'Create Customer'}
//           </Button>
//         </Stack>
//       </Modal>
//     </div>
//   )
// }

















import { useEffect, useState } from 'react'
import {
  Paper, Title, Text, TextInput, Select, Button, Badge, Modal,
  Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip
} from '@mantine/core'
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
      const payload = {
        ...form,
        phone: normalizePhone(form.phone)
      }
      if (editTarget) {
        await api.patch(`/customers/${editTarget.id}`, payload)
      } else {
        // account_no is auto-generated by backend
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

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this customer?')) return
    try {
      await api.patch(`/customers/${id}/deactivate`)
      load()
    } catch {
      alert('Failed to deactivate customer')
    }
  }

  return (
    <div className="p-4 md:p-6">
      {/* header */}
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

      {/* filters */}
      <Paper shadow="xs" radius="lg" p="sm" className="bg-white mb-4">
        <Stack gap="sm">
          <TextInput
            placeholder="Search name, phone or account..."
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
            radius="md"
          />
          <Group gap="sm" grow>
            <Select
              placeholder="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              data={[
                { value: 'domestic', label: 'Domestic' },
                { value: 'commercial', label: 'Commercial' }
              ]}
              clearable radius="md"
            />
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              data={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
              clearable radius="md"
            />
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
      ) : (
        <>
          {/* desktop table */}
          <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden hidden md:block">
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
                          {c.is_active && (
                            <Tooltip label="Deactivate">
                              <ActionIcon variant="light" color="red" radius="md" size="sm"
                                onClick={() => handleDeactivate(c.id)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                  stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
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
          </Paper>

          {/* mobile cards */}
          <div className="md:hidden">
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
                      {c.is_active && (
                        <button onClick={() => handleDeactivate(c.id)}
                          className="text-xs text-red-400 font-medium">
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </Stack>
            )}
          </div>
        </>
      )}

      {/* create / edit modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <Text fw={600} className="text-text-600">
            {editTarget ? 'Edit Customer' : 'Add Customer'}
          </Text>
        }
        radius="lg"
        size="md"
      >
        <Stack gap="md">
          {formError && (
            <Alert color="red" radius="md" variant="light">{formError}</Alert>
          )}

          {/* account no — read only on edit, auto on create */}
          {editTarget && (
            <div>
              <label className="block text-sm font-medium text-text-500 mb-1">
                Account No
              </label>
              <input
                type="text"
                value={editTarget.account_no}
                disabled
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

          <TextInput
            label="Full Name"
            placeholder="John Doe"
            radius="md"
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.currentTarget.value })}
          />

          {/* phone with live preview */}
          <div>
            <label className="block text-sm font-medium text-text-500 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="e.g. 0712345678"
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
                  Will be saved as{' '}
                  <span className="font-semibold">{phonePreview}</span>
                </Text>
              </div>
            )}
            <Text size="xs" className="text-text-200 mt-1">
              Any format — 0712..., 254712..., or +254712...
            </Text>
          </div>

          <TextInput
            label="Email"
            placeholder="john@gmail.com"
            radius="md"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.currentTarget.value })}
          />

          <TextInput
            label="Address"
            placeholder="Plot 1 Gitaru Town"
            radius="md"
            value={form.address}
            onChange={e => setForm({ ...form, address: e.currentTarget.value })}
          />

          <Select
            label="Customer Type"
            radius="md"
            value={form.customer_type}
            onChange={val => setForm({ ...form, customer_type: val || 'domestic' })}
            data={[
              { value: 'domestic', label: 'Domestic' },
              { value: 'commercial', label: 'Commercial' }
            ]}
          />

          <Button
            fullWidth radius="md" size="md" loading={saving}
            onClick={handleSave}
            className="bg-primary-500 hover:bg-primary-600"
          >
            {editTarget ? 'Save Changes' : 'Create Customer'}
          </Button>
        </Stack>
      </Modal>
    </div>
  )
}
