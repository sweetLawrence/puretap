// import { useEffect, useState } from 'react'
// import {
//   Paper, Title, Text, TextInput, Select, Button, Badge, Modal,
//   Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip, Tabs, Textarea
// } from '@mantine/core'
// import api from '../utils/api'

// interface Reading {
//   id: number
//   meter_id: number
//   previous_reading: number
//   current_reading: number
//   units_consumed: number
//   manual_value: number
//   ocr_value: number
//   ocr_difference: number
//   photo_url: string
//   status: string
//   reviewer_notes: string
//   reading_date: string
//   created_at: string
//   meters: { serial_no: string; installation_address: string }
//   users: { full_name: string }
// }

// const STATUS_COLORS: Record<string, string> = {
//   verified: 'green',
//   flagged_ocr_mismatch: 'orange',
//   flagged_anomaly: 'red',
//   flagged_both: 'red',
//   pending_review: 'yellow'
// }

// export default function Readings() {
//   const [readings, setReadings] = useState<Reading[]>([])
//   const [flagged, setFlagged] = useState<Reading[]>([])
//   const [filteredReadings, setFilteredReadings] = useState<Reading[]>([])
//   const [filteredFlagged, setFilteredFlagged] = useState<Reading[]>([])
//   const [loading, setLoading] = useState(true)
//   const [flaggedLoading, setFlaggedLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [search, setSearch] = useState('')
//   const [statusFilter, setStatusFilter] = useState<string | null>(null)
//   const [reviewModal, setReviewModal] = useState(false)
//   const [reviewTarget, setReviewTarget] = useState<Reading | null>(null)
//   const [reviewForm, setReviewForm] = useState({ status: 'verified', reviewer_notes: '' })
//   const [reviewing, setReviewing] = useState(false)
//   const [reviewError, setReviewError] = useState('')

//   const load = async () => {
//     try {
//       const res = await api.get('/readings')
//       setReadings(res.data.data)
//       setFilteredReadings(res.data.data)
//     } catch {
//       setError('Failed to load readings')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const loadFlagged = async () => {
//     setFlaggedLoading(true)
//     try {
//       const res = await api.get('/readings/flagged')
//       setFlagged(res.data.data)
//       setFilteredFlagged(res.data.data)
//     } catch {
//       setError('Failed to load flagged readings')
//     } finally {
//       setFlaggedLoading(false)
//     }
//   }

//   useEffect(() => { load() }, [])

//   useEffect(() => {
//     let data = [...readings]
//     if (search) {
//       const q = search.toLowerCase()
//       data = data.filter(r => r.meters?.serial_no?.toLowerCase().includes(q))
//     }
//     if (statusFilter) data = data.filter(r => r.status === statusFilter)
//     setFilteredReadings(data)
//   }, [search, statusFilter, readings])

//   useEffect(() => {
//     let data = [...flagged]
//     if (search) {
//       const q = search.toLowerCase()
//       data = data.filter(r => r.meters?.serial_no?.toLowerCase().includes(q))
//     }
//     setFilteredFlagged(data)
//   }, [search, flagged])

//   const openReview = (r: Reading) => {
//     setReviewTarget(r)
//     setReviewForm({ status: 'verified', reviewer_notes: '' })
//     setReviewError('')
//     setReviewModal(true)
//   }

//   const handleReview = async () => {
//     if (!reviewForm.reviewer_notes) {
//       setReviewError('Reviewer notes are required')
//       return
//     }
//     setReviewing(true)
//     setReviewError('')
//     try {
//       await api.patch(`/readings/${reviewTarget?.id}/review`, reviewForm)
//       setReviewModal(false)
//       load()
//       loadFlagged()
//     } catch (err: any) {
//       setReviewError(err.response?.data?.message || 'Failed to submit review')
//     } finally {
//       setReviewing(false)
//     }
//   }

//   const ReadingsTable = ({ data }: { data: Reading[] }) => (
//     <div className="table-responsive">
//       <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
//         <Table.Thead>
//           <Table.Tr className="bg-gray-50">
//             <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Meter</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Previous</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Current</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Units</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">OCR Diff</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">By</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
//           </Table.Tr>
//         </Table.Thead>
//         <Table.Tbody>
//           {data.length === 0 ? (
//             <Table.Tr>
//               <Table.Td colSpan={9} className="text-center text-text-300 py-8">No readings found</Table.Td>
//             </Table.Tr>
//           ) : data.map(r => (
//             <Table.Tr key={r.id}>
//               <Table.Td className="text-text-400 text-sm">{r.reading_date}</Table.Td>
//               <Table.Td className="text-text-600 font-semibold text-sm">{r.meters?.serial_no}</Table.Td>
//               <Table.Td className="text-text-400 text-sm">{r.previous_reading}</Table.Td>
//               <Table.Td className="text-text-600 text-sm">{r.current_reading}</Table.Td>
//               <Table.Td className="text-text-500 text-sm font-semibold">{r.units_consumed}</Table.Td>
//               <Table.Td className="text-sm">
//                 {r.ocr_difference != null
//                   ? <span className={Number(r.ocr_difference) > 5 ? 'text-red-500 font-semibold' : 'text-text-400'}>
//                       {r.ocr_difference}
//                     </span>
//                   : <span className="text-text-200">—</span>
//                 }
//               </Table.Td>
//               <Table.Td className="text-text-400 text-sm">{r.users?.full_name}</Table.Td>
//               <Table.Td>
//                 <Badge size="sm" radius="sm" variant="light"
//                   color={STATUS_COLORS[r.status] || 'gray'}>
//                   {r.status.replace(/_/g, ' ')}
//                 </Badge>
//               </Table.Td>
//               <Table.Td>
//                 {['flagged_ocr_mismatch', 'flagged_anomaly', 'flagged_both', 'pending_review'].includes(r.status) && (
//                   <Tooltip label="Review">
//                     <ActionIcon variant="light" color="orange" radius="md" size="sm"
//                       onClick={() => openReview(r)}>
//                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
//                         <circle cx="12" cy="12" r="3" />
//                       </svg>
//                     </ActionIcon>
//                   </Tooltip>
//                 )}
//               </Table.Td>
//             </Table.Tr>
//           ))}
//         </Table.Tbody>
//       </Table>
//     </div>
//   )

//   return (
//     <div className="p-6">
//       <div className="mb-6">
//         <Title order={3} className="text-text-700 font-bold">Readings</Title>
//         <Text size="sm" className="text-text-300 mt-1">All meter readings and flagged items</Text>
//       </div>

//       <Tabs defaultValue="all" radius="md">
//         <Tabs.List mb="md">
//           <Tabs.Tab value="all">All Readings</Tabs.Tab>
//           <Tabs.Tab value="flagged" onClick={loadFlagged}>
//             Flagged
//             {flagged.length > 0 && (
//               <Badge size="xs" color="red" variant="filled" ml="xs" radius="xl">
//                 {flagged.length}
//               </Badge>
//             )}
//           </Tabs.Tab>
//         </Tabs.List>

//         {/* Filters */}
//         <Paper shadow="xs" radius="lg" p="md" className="bg-white mb-4">
//           <Group gap="md" wrap="wrap">
//             <TextInput
//               placeholder="Search by meter serial..."
//               value={search}
//               onChange={e => setSearch(e.currentTarget.value)}
//               radius="md" className="flex-1 min-w-[200px]"
//             />
//             <Select
//               placeholder="Status" value={statusFilter}
//               onChange={setStatusFilter} clearable radius="md" w={200}
//               data={[
//                 { value: 'verified', label: 'Verified' },
//                 { value: 'flagged_ocr_mismatch', label: 'OCR Mismatch' },
//                 { value: 'flagged_anomaly', label: 'Anomaly' },
//                 { value: 'flagged_both', label: 'Flagged Both' },
//                 { value: 'pending_review', label: 'Pending Review' },
//               ]}
//             />
//           </Group>
//         </Paper>

//         <Tabs.Panel value="all">
//           <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
//             {loading ? (
//               <Stack p="md" gap="sm">
//                 {[...Array(5)].map((_, i) => <Skeleton key={i} height={40} radius="md" />)}
//               </Stack>
//             ) : error ? (
//               <Alert color="red" m="md" radius="md" variant="light">{error}</Alert>
//             ) : (
//               <ReadingsTable data={filteredReadings} />
//             )}
//           </Paper>
//         </Tabs.Panel>

//         <Tabs.Panel value="flagged">
//           <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
//             {flaggedLoading ? (
//               <Stack p="md" gap="sm">
//                 {[...Array(5)].map((_, i) => <Skeleton key={i} height={40} radius="md" />)}
//               </Stack>
//             ) : (
//               <ReadingsTable data={filteredFlagged} />
//             )}
//           </Paper>
//         </Tabs.Panel>
//       </Tabs>

//       {/* Review Modal */}
//       <Modal opened={reviewModal} onClose={() => setReviewModal(false)}
//         title={<Text fw={600} className="text-text-600">Review Reading</Text>}
//         radius="lg" size="md">
//         {reviewTarget && (
//           <Stack gap="sm">
//             {reviewError && <Alert color="red" radius="md" variant="light">{reviewError}</Alert>}

//             <Paper radius="md" p="sm" className="bg-gray-50">
//               <Group gap="xl">
//                 <div>
//                   <Text size="xs" className="text-text-300">Meter</Text>
//                   <Text size="sm" fw={600} className="text-text-600">{reviewTarget.meters?.serial_no}</Text>
//                 </div>
//                 <div>
//                   <Text size="xs" className="text-text-300">Manual</Text>
//                   <Text size="sm" fw={600} className="text-text-600">{reviewTarget.manual_value}</Text>
//                 </div>
//                 <div>
//                   <Text size="xs" className="text-text-300">OCR</Text>
//                   <Text size="sm" fw={600} className="text-red-500">{reviewTarget.ocr_value ?? '—'}</Text>
//                 </div>
//                 <div>
//                   <Text size="xs" className="text-text-300">Difference</Text>
//                   <Text size="sm" fw={600} className="text-red-500">{reviewTarget.ocr_difference ?? '—'}</Text>
//                 </div>
//               </Group>
//               {reviewTarget.photo_url && (
//                 <img src={reviewTarget.photo_url} alt="Meter photo"
//                   className="w-full rounded-lg mt-3 max-h-40 object-cover" />
//               )}
//             </Paper>

//             <Select label="Resolution Status" radius="md"
//               value={reviewForm.status}
//               onChange={val => setReviewForm({ ...reviewForm, status: val || 'verified' })}
//               data={[
//                 { value: 'verified', label: 'Mark as Verified' },
//                 { value: 'pending_review', label: 'Keep Pending' },
//               ]} />

//             <Textarea label="Reviewer Notes" placeholder="Describe your findings..."
//               radius="md" minRows={3}
//               value={reviewForm.reviewer_notes}
//               onChange={e => setReviewForm({ ...reviewForm, reviewer_notes: e.currentTarget.value })} />

//             <Button fullWidth radius="md" loading={reviewing} onClick={handleReview}
//               className="bg-primary-500 hover:bg-primary-600 mt-2">
//               Submit Review
//             </Button>
//           </Stack>
//         )}
//       </Modal>
//     </div>
//   )
// }


















// import { useEffect, useState } from 'react'
// import { useMediaQuery } from '@mantine/hooks'
// import {
//   Paper, Title, Text, Select, Button, Badge, Modal,
//   Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip, Tabs, Textarea
// } from '@mantine/core'
// import api from '../utils/api'

// interface Reading {
//   id: number
//   meter_id: number
//   previous_reading: number
//   current_reading: number
//   units_consumed: number
//   manual_value: number
//   ocr_value: number
//   ocr_difference: number
//   photo_url: string
//   status: string
//   reviewer_notes: string
//   reading_date: string
//   created_at: string
//   meters: { serial_no: string; installation_address: string }
//   users: { full_name: string }
//   has_invoice?: boolean
// }

// const STATUS_COLORS: Record<string, string> = {
//   verified: 'green',
//   flagged_ocr_mismatch: 'orange',
//   flagged_anomaly: 'red',
//   flagged_both: 'red',
//   pending_review: 'yellow'
// }

// export default function Readings() {
//   const [readings, setReadings] = useState<Reading[]>([])
//   const [flagged, setFlagged] = useState<Reading[]>([])
//   const [filteredReadings, setFilteredReadings] = useState<Reading[]>([])
//   const [filteredFlagged, setFilteredFlagged] = useState<Reading[]>([])
//   const [invoicedReadingIds, setInvoicedReadingIds] = useState<number[]>([])
//   const [loading, setLoading] = useState(true)
//   const [flaggedLoading, setFlaggedLoading] = useState(false)
//   const [error, setError] = useState('')
//   const [search, setSearch] = useState('')
//   const [statusFilter, setStatusFilter] = useState<string | null>(null)

//   // review modal
//   const [reviewModal, setReviewModal] = useState(false)
//   const [reviewTarget, setReviewTarget] = useState<Reading | null>(null)
//   const [reviewForm, setReviewForm] = useState({ status: 'verified', reviewer_notes: '' })
//   const [reviewing, setReviewing] = useState(false)
//   const [reviewError, setReviewError] = useState('')

//   // invoice generation
//   const [generatingId, setGeneratingId] = useState<number | null>(null)
//   const [generateError, setGenerateError] = useState<Record<number, string>>({})
//   const [generateSuccess, setGenerateSuccess] = useState<Record<number, boolean>>({})

//   const isMobile = useMediaQuery('(max-width: 768px)')

//   const load = async () => {
//     try {
//       const [readingsRes, invoicesRes] = await Promise.all([
//         api.get('/readings'),
//         api.get('/invoices')
//       ])
//       const allReadings: Reading[] = readingsRes.data.data
//       const allInvoices = invoicesRes.data.data

//       // track which reading IDs already have invoices
//       const ids: number[] = allInvoices.map((inv: any) => inv.reading_id)
//       setInvoicedReadingIds(ids)
//       setReadings(allReadings)
//       setFilteredReadings(allReadings)
//     } catch {
//       setError('Failed to load readings')
//     } finally {
//       setLoading(false)
//     }
//   }

//   const loadFlagged = async () => {
//     setFlaggedLoading(true)
//     try {
//       const res = await api.get('/readings/flagged')
//       setFlagged(res.data.data)
//       setFilteredFlagged(res.data.data)
//     } catch {
//       setError('Failed to load flagged readings')
//     } finally {
//       setFlaggedLoading(false)
//     }
//   }

//   useEffect(() => { load() }, [])

//   useEffect(() => {
//     let data = [...readings]
//     if (search) {
//       const q = search.toLowerCase()
//       data = data.filter(r => r.meters?.serial_no?.toLowerCase().includes(q))
//     }
//     if (statusFilter) data = data.filter(r => r.status === statusFilter)
//     setFilteredReadings(data)
//   }, [search, statusFilter, readings])

//   useEffect(() => {
//     let data = [...flagged]
//     if (search) {
//       const q = search.toLowerCase()
//       data = data.filter(r => r.meters?.serial_no?.toLowerCase().includes(q))
//     }
//     setFilteredFlagged(data)
//   }, [search, flagged])

//   const openReview = (r: Reading) => {
//     setReviewTarget(r)
//     setReviewForm({ status: 'verified', reviewer_notes: '' })
//     setReviewError('')
//     setReviewModal(true)
//   }

//   const handleReview = async () => {
//     if (!reviewForm.reviewer_notes) {
//       setReviewError('Reviewer notes are required')
//       return
//     }
//     setReviewing(true)
//     setReviewError('')
//     try {
//       await api.patch(`/readings/${reviewTarget?.id}/review`, reviewForm)
//       setReviewModal(false)
//       load()
//       loadFlagged()
//     } catch (err: any) {
//       setReviewError(err.response?.data?.message || 'Failed to submit review')
//     } finally {
//       setReviewing(false)
//     }
//   }

//   const handleGenerateInvoice = async (readingId: number) => {
//     setGeneratingId(readingId)
//     setGenerateError(prev => ({ ...prev, [readingId]: '' }))
//     try {
//       await api.post('/invoices/generate', { reading_id: readingId })
//       setGenerateSuccess(prev => ({ ...prev, [readingId]: true }))
//       setInvoicedReadingIds(prev => [...prev, readingId])
//     } catch (err: any) {
//       setGenerateError(prev => ({
//         ...prev,
//         [readingId]: err.response?.data?.message || 'Failed to generate invoice'
//       }))
//     } finally {
//       setGeneratingId(null)
//     }
//   }

//   const isInvoiced = (readingId: number) =>
//     invoicedReadingIds.includes(readingId) || generateSuccess[readingId]

//   // const canGenerateInvoice = (r: Reading) =>
//   //   r.status === 'verified' && !isInvoiced(r.id)

//   // ── Desktop Table ──
//   const ReadingsTable = ({ data }: { data: Reading[] }) => (
//     <div className="table-responsive">
//       <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
//         <Table.Thead>
//           <Table.Tr className="bg-gray-50">
//             <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Meter</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Prev</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Current</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Units</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">By</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
//             <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
//           </Table.Tr>
//         </Table.Thead>
//         <Table.Tbody>
//           {data.length === 0 ? (
//             <Table.Tr>
//               <Table.Td colSpan={8} className="text-center text-text-300 py-8">
//                 No readings found
//               </Table.Td>
//             </Table.Tr>
//           ) : data.map(r => (
//             <Table.Tr key={r.id}>
//               <Table.Td className="text-text-400 text-sm">{r.reading_date}</Table.Td>
//               <Table.Td className="text-text-600 font-semibold text-sm">
//                 {r.meters?.serial_no}
//               </Table.Td>
//               <Table.Td className="text-text-400 text-sm">{r.previous_reading}</Table.Td>
//               <Table.Td className="text-text-600 text-sm">{r.current_reading}</Table.Td>
//               <Table.Td className="text-text-500 text-sm font-semibold">
//                 {r.units_consumed} m³
//               </Table.Td>
//               <Table.Td className="text-text-400 text-sm">{r.users?.full_name}</Table.Td>
//               <Table.Td>
//                 <Badge size="sm" radius="sm" variant="light"
//                   color={STATUS_COLORS[r.status] || 'gray'}>
//                   {r.status.replace(/_/g, ' ')}
//                 </Badge>
//               </Table.Td>
//               <Table.Td>
//                 <Group gap="xs">
//                   {/* review button — flagged only */}
//                   {['flagged_ocr_mismatch', 'flagged_anomaly', 'flagged_both', 'pending_review']
//                     .includes(r.status) && (
//                     <Tooltip label="Review reading">
//                       <ActionIcon variant="light" color="orange" radius="md" size="sm"
//                         onClick={() => openReview(r)}>
//                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//                           stroke="currentColor" strokeWidth="2">
//                           <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
//                           <circle cx="12" cy="12" r="3" />
//                         </svg>
//                       </ActionIcon>
//                     </Tooltip>
//                   )}

//                   {/* generate invoice — verified only, not already invoiced */}
//                   {r.status === 'verified' && (
//                     isInvoiced(r.id) ? (
//                       <Tooltip label="Invoice already generated">
//                         <ActionIcon variant="light" color="green" radius="md" size="sm"
//                           disabled>
//                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//                             stroke="currentColor" strokeWidth="2">
//                             <polyline points="20 6 9 17 4 12" />
//                           </svg>
//                         </ActionIcon>
//                       </Tooltip>
//                     ) : (
//                       <Tooltip label={generateError[r.id] || 'Generate invoice'}>
//                         <ActionIcon
//                           variant="light"
//                           color={generateError[r.id] ? 'red' : 'blue'}
//                           radius="md" size="sm"
//                           loading={generatingId === r.id}
//                           onClick={() => handleGenerateInvoice(r.id)}>
//                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//                             stroke="currentColor" strokeWidth="2">
//                             <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//                             <polyline points="14 2 14 8 20 8" />
//                             <line x1="12" y1="18" x2="12" y2="12" />
//                             <line x1="9" y1="15" x2="15" y2="15" />
//                           </svg>
//                         </ActionIcon>
//                       </Tooltip>
//                     )
//                   )}
//                 </Group>
//               </Table.Td>
//             </Table.Tr>
//           ))}
//         </Table.Tbody>
//       </Table>
//     </div>
//   )

//   // ── Mobile Cards ──
//   const ReadingCards = ({ data }: { data: Reading[] }) => (
//     <>
//       {data.length === 0 ? (
//         <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
//           <Text size="sm" className="text-text-300">No readings found</Text>
//         </div>
//       ) : (
//         <Stack gap="sm">
//           {data.map(r => (
//             <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
//               {/* card header */}
//               <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50">
//                 <div className="min-w-0 mr-3">
//                   <Text fw={700} size="sm" className="text-text-700">
//                     {r.meters?.serial_no}
//                   </Text>
//                   <Text size="xs" className="text-text-300 mt-0.5">{r.reading_date}</Text>
//                   {r.users?.full_name && (
//                     <Text size="xs" className="text-text-200">by {r.users.full_name}</Text>
//                   )}
//                 </div>
//                 <Badge size="sm" radius="md" variant="light"
//                   color={STATUS_COLORS[r.status] || 'gray'}>
//                   {r.status.replace(/_/g, ' ')}
//                 </Badge>
//               </div>

//               {/* reading values */}
//               <div className="flex items-center px-4 py-3 gap-0">
//                 <div className="flex-1 text-center">
//                   <Text size="xs" className="text-text-200 mb-0.5">Previous</Text>
//                   <Text fw={600} size="sm" className="text-text-500">
//                     {r.previous_reading}
//                     <span className="text-xs font-normal text-text-300 ml-0.5">m³</span>
//                   </Text>
//                 </div>
//                 <div className="flex-shrink-0 px-2">
//                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
//                     stroke="#D1D5DB" strokeWidth="2">
//                     <line x1="5" y1="12" x2="19" y2="12" />
//                     <polyline points="12 5 19 12 12 19" />
//                   </svg>
//                 </div>
//                 <div className="flex-1 text-center">
//                   <Text size="xs" className="text-text-200 mb-0.5">Current</Text>
//                   <Text fw={700} size="sm" className="text-text-700">
//                     {r.current_reading}
//                     <span className="text-xs font-normal text-text-300 ml-0.5">m³</span>
//                   </Text>
//                 </div>
//                 <div className="flex-shrink-0 px-2">
//                   <div className="w-px h-8 bg-gray-100" />
//                 </div>
//                 <div className="flex-1 text-center">
//                   <Text size="xs" className="text-text-200 mb-0.5">Consumed</Text>
//                   <Text fw={700} size="sm" className="text-primary-500">
//                     {r.units_consumed}
//                     <span className="text-xs font-normal text-primary-400 ml-0.5">m³</span>
//                   </Text>
//                 </div>
//               </div>

//               {/* error message if invoice generation failed */}
//               {generateError[r.id] && (
//                 <div className="px-4 pb-2">
//                   <Text size="xs" className="text-red-500">{generateError[r.id]}</Text>
//                 </div>
//               )}

//               {/* actions */}
//               <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-50">
//                 {['flagged_ocr_mismatch', 'flagged_anomaly', 'flagged_both', 'pending_review']
//                   .includes(r.status) && (
//                   <button onClick={() => openReview(r)}
//                     className="text-xs text-orange-400 font-medium">
//                     Review
//                   </button>
//                 )}

//                 {r.status === 'verified' && (
//                   isInvoiced(r.id) ? (
//                     <div className="flex items-center gap-1">
//                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
//                         stroke="#22c55e" strokeWidth="2.5">
//                         <polyline points="20 6 9 17 4 12" />
//                       </svg>
//                       <Text size="xs" className="text-green-600 font-medium">
//                         Invoice generated
//                       </Text>
//                     </div>
//                   ) : (
//                     <button
//                       disabled={generatingId === r.id}
//                       onClick={() => handleGenerateInvoice(r.id)}
//                       className="flex items-center gap-1 text-xs text-primary-500 font-medium disabled:opacity-50">
//                       {generatingId === r.id ? (
//                         <>
//                           <div className="w-3 h-3 border border-primary-400 border-t-transparent rounded-full animate-spin" />
//                           Generating...
//                         </>
//                       ) : (
//                         <>
//                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
//                             stroke="currentColor" strokeWidth="2">
//                             <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
//                             <polyline points="14 2 14 8 20 8" />
//                             <line x1="12" y1="18" x2="12" y2="12" />
//                             <line x1="9" y1="15" x2="15" y2="15" />
//                           </svg>
//                           Generate Invoice
//                         </>
//                       )}
//                     </button>
//                   )
//                 )}

//                 {/* photo evidence */}
//                 {r.photo_url && (
//                   <a href={r.photo_url} target="_blank" rel="noreferrer"
//                     className="text-xs text-text-300 font-medium ml-auto">
//                     View photo
//                   </a>
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
//       <div className="mb-5">
//         <Title order={3} className="text-text-700 font-bold text-lg md:text-xl">
//           Readings
//         </Title>
//         <Text size="sm" className="text-text-300 mt-0.5 hidden sm:block">
//           All meter readings and flagged items
//         </Text>
//       </div>

//       <Tabs defaultValue="all" radius="md">
//         <Tabs.List mb="md">
//           <Tabs.Tab value="all">All Readings</Tabs.Tab>
//           <Tabs.Tab value="flagged" onClick={loadFlagged}>
//             Flagged
//             {flagged.length > 0 && (
//               <Badge size="xs" color="red" variant="filled" ml="xs" radius="xl">
//                 {flagged.length}
//               </Badge>
//             )}
//           </Tabs.Tab>
//         </Tabs.List>

//         {/* filters */}
//         <Paper shadow="xs" radius="lg" p="sm" className="bg-white mb-4">
//           <Stack gap="sm">
//             <input
//               type="text"
//               placeholder="Search by meter serial..."
//               value={search}
//               onChange={e => setSearch(e.target.value)}
//               className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
//             />
//             <Select
//               placeholder="Filter by status"
//               value={statusFilter}
//               onChange={setStatusFilter}
//               clearable radius="md"
//               data={[
//                 { value: 'verified', label: 'Verified' },
//                 { value: 'flagged_ocr_mismatch', label: 'OCR Mismatch' },
//                 { value: 'flagged_anomaly', label: 'Anomaly' },
//                 { value: 'flagged_both', label: 'Flagged Both' },
//                 { value: 'pending_review', label: 'Pending Review' },
//               ]}
//             />
//           </Stack>
//         </Paper>

//         {/* all readings tab */}
//         <Tabs.Panel value="all">
//           {loading ? (
//             <Stack gap="sm">
//               {[...Array(5)].map((_, i) => <Skeleton key={i} height={60} radius="lg" />)}
//             </Stack>
//           ) : error ? (
//             <Alert color="red" radius="md" variant="light">{error}</Alert>
//           ) : (
//             <>
//               {/* desktop */}
//               <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden hidden md:block">
//                 <ReadingsTable data={filteredReadings} />
//               </Paper>
//               {/* mobile */}
//               <div className="md:hidden">
//                 <ReadingCards data={filteredReadings} />
//               </div>
//             </>
//           )}
//         </Tabs.Panel>

//         {/* flagged tab */}
//         <Tabs.Panel value="flagged">
//           {flaggedLoading ? (
//             <Stack gap="sm">
//               {[...Array(4)].map((_, i) => <Skeleton key={i} height={60} radius="lg" />)}
//             </Stack>
//           ) : (
//             <>
//               {/* desktop */}
//               <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden hidden md:block">
//                 <ReadingsTable data={filteredFlagged} />
//               </Paper>
//               {/* mobile */}
//               <div className="md:hidden">
//                 <ReadingCards data={filteredFlagged} />
//               </div>
//             </>
//           )}
//         </Tabs.Panel>
//       </Tabs>

//       {/* review modal */}
//       <Modal opened={reviewModal} onClose={() => setReviewModal(false)}
//         title={<Text fw={600} className="text-text-600">Review Reading</Text>}
//         radius="lg" size="md">
//         {reviewTarget && (
//           <Stack gap="sm">
//             {reviewError && (
//               <Alert color="red" radius="md" variant="light">{reviewError}</Alert>
//             )}

//             <div className="bg-gray-50 rounded-xl p-4">
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <Text size="xs" className="text-text-300">Meter</Text>
//                   <Text size="sm" fw={600} className="text-text-600">
//                     {reviewTarget.meters?.serial_no}
//                   </Text>
//                 </div>
//                 <div>
//                   <Text size="xs" className="text-text-300">Date</Text>
//                   <Text size="sm" fw={600} className="text-text-600">
//                     {reviewTarget.reading_date}
//                   </Text>
//                 </div>
//                 <div>
//                   <Text size="xs" className="text-text-300">Manual value</Text>
//                   <Text size="sm" fw={600} className="text-text-600">
//                     {reviewTarget.manual_value} m³
//                   </Text>
//                 </div>
//                 <div>
//                   <Text size="xs" className="text-text-300">OCR value</Text>
//                   <Text size="sm" fw={600} className="text-red-500">
//                     {reviewTarget.ocr_value ?? '—'} {reviewTarget.ocr_value ? 'm³' : ''}
//                   </Text>
//                 </div>
//               </div>
//               {reviewTarget.photo_url && (
//                 <img src={reviewTarget.photo_url} alt="Meter photo"
//                   className="w-full rounded-lg mt-3 max-h-48 object-cover" />
//               )}
//             </div>

//             <Select
//               label="Resolution" radius="md"
//               value={reviewForm.status}
//               onChange={val => setReviewForm({ ...reviewForm, status: val || 'verified' })}
//               data={[
//                 { value: 'verified', label: 'Mark as Verified' },
//                 { value: 'pending_review', label: 'Keep Pending' },
//               ]}
//             />

//             <Textarea
//               label="Reviewer Notes"
//               placeholder="Describe your findings..."
//               radius="md" minRows={3}
//               value={reviewForm.reviewer_notes}
//               onChange={e => setReviewForm({ ...reviewForm, reviewer_notes: e.currentTarget.value })}
//             />

//             <Button fullWidth radius="md" loading={reviewing} onClick={handleReview}
//               className="bg-primary-500 hover:bg-primary-600">
//               Submit Review
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
  Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip, Tabs, Textarea
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import api from '../utils/api'

interface Reading {
  id: number
  meter_id: number
  previous_reading: number
  current_reading: number
  units_consumed: number
  manual_value: number
  ocr_value: number
  ocr_difference: number
  photo_url: string
  status: string
  reviewer_notes: string
  reading_date: string
  created_at: string
  meters: { serial_no: string; installation_address: string }
  users: { full_name: string }
}

const STATUS_COLORS: Record<string, string> = {
  verified: 'green',
  flagged_ocr_mismatch: 'orange',
  flagged_anomaly: 'red',
  flagged_both: 'red',
  pending_review: 'yellow'
}

const FLAGGED_STATUSES = [
  'flagged_ocr_mismatch', 'flagged_anomaly', 'flagged_both', 'pending_review'
]

export default function Readings() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [readings, setReadings] = useState<Reading[]>([])
  const [flagged, setFlagged] = useState<Reading[]>([])
  const [filteredReadings, setFilteredReadings] = useState<Reading[]>([])
  const [filteredFlagged, setFilteredFlagged] = useState<Reading[]>([])
  const [invoicedReadingIds, setInvoicedReadingIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [flaggedLoading, setFlaggedLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const [reviewModal, setReviewModal] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<Reading | null>(null)
  const [reviewForm, setReviewForm] = useState({ status: 'verified', reviewer_notes: '' })
  const [reviewing, setReviewing] = useState(false)
  const [reviewError, setReviewError] = useState('')

  const [generatingId, setGeneratingId] = useState<number | null>(null)
  const [generateError, setGenerateError] = useState<Record<number, string>>({})
  const [generateSuccess, setGenerateSuccess] = useState<Record<number, boolean>>({})

  const load = async () => {
    try {
      const [readingsRes, invoicesRes] = await Promise.all([
        api.get('/readings'),
        api.get('/invoices')
      ])
      const allReadings: Reading[] = readingsRes.data.data
      const allInvoices = invoicesRes.data.data
      const ids: number[] = allInvoices.map((inv: any) => inv.reading_id)
      setInvoicedReadingIds(ids)
      setReadings(allReadings)
      setFilteredReadings(allReadings)
    } catch {
      setError('Failed to load readings')
    } finally {
      setLoading(false)
    }
  }

  const loadFlagged = async () => {
    setFlaggedLoading(true)
    try {
      const res = await api.get('/readings/flagged')
      setFlagged(res.data.data)
      setFilteredFlagged(res.data.data)
    } catch {
      setError('Failed to load flagged readings')
    } finally {
      setFlaggedLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = [...readings]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(r => r.meters?.serial_no?.toLowerCase().includes(q))
    }
    if (statusFilter) data = data.filter(r => r.status === statusFilter)
    setFilteredReadings(data)
  }, [search, statusFilter, readings])

  useEffect(() => {
    let data = [...flagged]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(r => r.meters?.serial_no?.toLowerCase().includes(q))
    }
    setFilteredFlagged(data)
  }, [search, flagged])

  const openReview = (r: Reading) => {
    setReviewTarget(r)
    setReviewForm({ status: 'verified', reviewer_notes: '' })
    setReviewError('')
    setReviewModal(true)
  }

  const handleReview = async () => {
    if (!reviewForm.reviewer_notes) {
      setReviewError('Reviewer notes are required')
      return
    }
    setReviewing(true)
    setReviewError('')
    try {
      await api.patch(`/readings/${reviewTarget?.id}/review`, reviewForm)
      setReviewModal(false)
      load()
      loadFlagged()
    } catch (err: any) {
      setReviewError(err.response?.data?.message || 'Failed to submit review')
    } finally {
      setReviewing(false)
    }
  }

  const handleGenerateInvoice = async (readingId: number) => {
    setGeneratingId(readingId)
    setGenerateError(prev => ({ ...prev, [readingId]: '' }))
    try {
      await api.post('/invoices/generate', { reading_id: readingId })
      setGenerateSuccess(prev => ({ ...prev, [readingId]: true }))
      setInvoicedReadingIds(prev => [...prev, readingId])
    } catch (err: any) {
      setGenerateError(prev => ({
        ...prev,
        [readingId]: err.response?.data?.message || 'Failed to generate invoice'
      }))
    } finally {
      setGeneratingId(null)
    }
  }

  const isInvoiced = (readingId: number) =>
    invoicedReadingIds.includes(readingId) || generateSuccess[readingId]

  // ── Desktop Table ──
  const ReadingsTable = ({ data }: { data: Reading[] }) => (
    <div className="table-responsive">
      <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr className="bg-gray-50">
            <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Meter</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Prev</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Current</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Units</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">By</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={8} className="text-center text-text-300 py-8">
                No readings found
              </Table.Td>
            </Table.Tr>
          ) : data.map(r => (
            <Table.Tr key={r.id}>
              <Table.Td className="text-text-400 text-sm">{r.reading_date}</Table.Td>
              <Table.Td className="text-text-600 font-semibold text-sm">{r.meters?.serial_no}</Table.Td>
              <Table.Td className="text-text-400 text-sm">{r.previous_reading}</Table.Td>
              <Table.Td className="text-text-600 text-sm">{r.current_reading}</Table.Td>
              <Table.Td className="text-text-500 text-sm font-semibold">{r.units_consumed} m³</Table.Td>
              <Table.Td className="text-text-400 text-sm">{r.users?.full_name}</Table.Td>
              <Table.Td>
                <Badge size="sm" radius="sm" variant="light"
                  color={STATUS_COLORS[r.status] || 'gray'}>
                  {r.status.replace(/_/g, ' ')}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  {FLAGGED_STATUSES.includes(r.status) && (
                    <Tooltip label="Review reading">
                      <ActionIcon variant="light" color="orange" radius="md" size="sm"
                        onClick={() => openReview(r)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </ActionIcon>
                    </Tooltip>
                  )}
                  {r.status === 'verified' && (
                    isInvoiced(r.id) ? (
                      <Tooltip label="Invoice already generated">
                        <ActionIcon variant="light" color="green" radius="md" size="sm" disabled>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </ActionIcon>
                      </Tooltip>
                    ) : (
                      <Tooltip label={generateError[r.id] || 'Generate invoice'}>
                        <ActionIcon variant="light"
                          color={generateError[r.id] ? 'red' : 'blue'}
                          radius="md" size="sm"
                          loading={generatingId === r.id}
                          onClick={() => handleGenerateInvoice(r.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                          </svg>
                        </ActionIcon>
                      </Tooltip>
                    )
                  )}
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  )

  // ── Mobile Cards ──
  const ReadingCards = ({ data }: { data: Reading[] }) => (
    <>
      {data.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <Text size="sm" className="text-text-300">No readings found</Text>
        </div>
      ) : (
        <Stack gap="sm">
          {data.map(r => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50">
                <div className="min-w-0 mr-3">
                  <Text fw={700} size="sm" className="text-text-700">{r.meters?.serial_no}</Text>
                  <Text size="xs" className="text-text-300 mt-0.5">{r.reading_date}</Text>
                  {r.users?.full_name && (
                    <Text size="xs" className="text-text-200">by {r.users.full_name}</Text>
                  )}
                </div>
                <Badge size="sm" radius="md" variant="light"
                  color={STATUS_COLORS[r.status] || 'gray'}>
                  {r.status.replace(/_/g, ' ')}
                </Badge>
              </div>

              <div className="flex items-center px-4 py-3">
                <div className="flex-1 text-center">
                  <Text size="xs" className="text-text-200 mb-0.5">Previous</Text>
                  <Text fw={600} size="sm" className="text-text-500">
                    {r.previous_reading}
                    <span className="text-xs font-normal text-text-300 ml-0.5">m³</span>
                  </Text>
                </div>
                <div className="flex-shrink-0 px-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#D1D5DB" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
                <div className="flex-1 text-center">
                  <Text size="xs" className="text-text-200 mb-0.5">Current</Text>
                  <Text fw={700} size="sm" className="text-text-700">
                    {r.current_reading}
                    <span className="text-xs font-normal text-text-300 ml-0.5">m³</span>
                  </Text>
                </div>
                <div className="flex-shrink-0 px-2">
                  <div className="w-px h-8 bg-gray-100" />
                </div>
                <div className="flex-1 text-center">
                  <Text size="xs" className="text-text-200 mb-0.5">Consumed</Text>
                  <Text fw={700} size="sm" className="text-primary-500">
                    {r.units_consumed}
                    <span className="text-xs font-normal text-primary-400 ml-0.5">m³</span>
                  </Text>
                </div>
              </div>

              {generateError[r.id] && (
                <div className="px-4 pb-2">
                  <Text size="xs" className="text-red-500">{generateError[r.id]}</Text>
                </div>
              )}

              <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-50">
                {FLAGGED_STATUSES.includes(r.status) && (
                  <button onClick={() => openReview(r)}
                    className="text-xs text-orange-400 font-medium">
                    Review
                  </button>
                )}
                {r.status === 'verified' && (
                  isInvoiced(r.id) ? (
                    <div className="flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="#22c55e" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <Text size="xs" className="text-green-600 font-medium">Invoice generated</Text>
                    </div>
                  ) : (
                    <button
                      disabled={generatingId === r.id}
                      onClick={() => handleGenerateInvoice(r.id)}
                      className="flex items-center gap-1 text-xs text-primary-500 font-medium disabled:opacity-50">
                      {generatingId === r.id ? (
                        <>
                          <div className="w-3 h-3 border border-primary-400 border-t-transparent rounded-full animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="12" y1="18" x2="12" y2="12" />
                            <line x1="9" y1="15" x2="15" y2="15" />
                          </svg>
                          Generate Invoice
                        </>
                      )}
                    </button>
                  )
                )}
                {r.photo_url && (
                  <a href={r.photo_url} target="_blank" rel="noreferrer"
                    className="text-xs text-text-300 font-medium ml-auto">
                    View photo
                  </a>
                )}
              </div>
            </div>
          ))}
        </Stack>
      )}
    </>
  )

  const TabContent = ({ data, isLoading }: { data: Reading[], isLoading: boolean }) => {
    if (isLoading) return (
      <Stack gap="sm">
        {[...Array(4)].map((_, i) => <Skeleton key={i} height={60} radius="lg" />)}
      </Stack>
    )
    if (isMobile) return <ReadingCards data={data} />
    return (
      <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
        <ReadingsTable data={data} />
      </Paper>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <Title order={3} className="text-text-700 font-bold text-lg md:text-xl">Readings</Title>
        <Text size="sm" className="text-text-300 mt-0.5 hidden sm:block">
          All meter readings and flagged items
        </Text>
      </div>

      <Tabs defaultValue="all" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="all">All Readings</Tabs.Tab>
          <Tabs.Tab value="flagged" onClick={loadFlagged}>
            Flagged
            {flagged.length > 0 && (
              <Badge size="xs" color="red" variant="filled" ml="xs" radius="xl">
                {flagged.length}
              </Badge>
            )}
          </Tabs.Tab>
        </Tabs.List>

        <Paper shadow="xs" radius="lg" p="sm" className="bg-white mb-4">
          <Stack gap="sm">
            <input
              type="text"
              placeholder="Search by meter serial..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <Select
              placeholder="Filter by status"
              value={statusFilter}
              onChange={setStatusFilter}
              clearable radius="md"
              data={[
                { value: 'verified', label: 'Verified' },
                { value: 'flagged_ocr_mismatch', label: 'OCR Mismatch' },
                { value: 'flagged_anomaly', label: 'Anomaly' },
                { value: 'flagged_both', label: 'Flagged Both' },
                { value: 'pending_review', label: 'Pending Review' },
              ]}
            />
          </Stack>
        </Paper>

        <Tabs.Panel value="all">
          {error ? (
            <Alert color="red" radius="md" variant="light">{error}</Alert>
          ) : (
            <TabContent data={filteredReadings} isLoading={loading} />
          )}
        </Tabs.Panel>

        <Tabs.Panel value="flagged">
          <TabContent data={filteredFlagged} isLoading={flaggedLoading} />
        </Tabs.Panel>
      </Tabs>

      <Modal opened={reviewModal} onClose={() => setReviewModal(false)}
        title={<Text fw={600} className="text-text-600">Review Reading</Text>}
        radius="lg" size="md">
        {reviewTarget && (
          <Stack gap="sm">
            {reviewError && (
              <Alert color="red" radius="md" variant="light">{reviewError}</Alert>
            )}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Text size="xs" className="text-text-300">Meter</Text>
                  <Text size="sm" fw={600} className="text-text-600">{reviewTarget.meters?.serial_no}</Text>
                </div>
                <div>
                  <Text size="xs" className="text-text-300">Date</Text>
                  <Text size="sm" fw={600} className="text-text-600">{reviewTarget.reading_date}</Text>
                </div>
                <div>
                  <Text size="xs" className="text-text-300">Manual value</Text>
                  <Text size="sm" fw={600} className="text-text-600">{reviewTarget.manual_value} m³</Text>
                </div>
                <div>
                  <Text size="xs" className="text-text-300">OCR value</Text>
                  <Text size="sm" fw={600} className="text-red-500">
                    {reviewTarget.ocr_value ?? '—'}{reviewTarget.ocr_value ? ' m³' : ''}
                  </Text>
                </div>
              </div>
              {reviewTarget.photo_url && (
                <img src={reviewTarget.photo_url} alt="Meter photo"
                  className="w-full rounded-lg mt-3 max-h-48 object-cover" />
              )}
            </div>
            <Select label="Resolution" radius="md"
              value={reviewForm.status}
              onChange={val => setReviewForm({ ...reviewForm, status: val || 'verified' })}
              data={[
                { value: 'verified', label: 'Mark as Verified' },
                { value: 'pending_review', label: 'Keep Pending' },
              ]}
            />
            <Textarea label="Reviewer Notes" placeholder="Describe your findings..."
              radius="md" minRows={3}
              value={reviewForm.reviewer_notes}
              onChange={e => setReviewForm({ ...reviewForm, reviewer_notes: e.currentTarget.value })}
            />
            <Button fullWidth radius="md" loading={reviewing} onClick={handleReview}
              className="bg-primary-500 hover:bg-primary-600">
              Submit Review
            </Button>
          </Stack>
        )}
      </Modal>
    </div>
  )
}
