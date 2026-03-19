import { useEffect, useState } from 'react'
import {
  Paper, Title, Text, TextInput, Select, Button, Badge, Modal,
  Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip, Tabs, Textarea
} from '@mantine/core'
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

export default function Readings() {
  const [readings, setReadings] = useState<Reading[]>([])
  const [flagged, setFlagged] = useState<Reading[]>([])
  const [filteredReadings, setFilteredReadings] = useState<Reading[]>([])
  const [filteredFlagged, setFilteredFlagged] = useState<Reading[]>([])
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

  const load = async () => {
    try {
      const res = await api.get('/readings')
      setReadings(res.data.data)
      setFilteredReadings(res.data.data)
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

  const ReadingsTable = ({ data }: { data: Reading[] }) => (
    <div className="table-responsive">
      <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr className="bg-gray-50">
            <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Meter</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Previous</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Current</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Units</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">OCR Diff</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">By</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={9} className="text-center text-text-300 py-8">No readings found</Table.Td>
            </Table.Tr>
          ) : data.map(r => (
            <Table.Tr key={r.id}>
              <Table.Td className="text-text-400 text-sm">{r.reading_date}</Table.Td>
              <Table.Td className="text-text-600 font-semibold text-sm">{r.meters?.serial_no}</Table.Td>
              <Table.Td className="text-text-400 text-sm">{r.previous_reading}</Table.Td>
              <Table.Td className="text-text-600 text-sm">{r.current_reading}</Table.Td>
              <Table.Td className="text-text-500 text-sm font-semibold">{r.units_consumed}</Table.Td>
              <Table.Td className="text-sm">
                {r.ocr_difference != null
                  ? <span className={Number(r.ocr_difference) > 5 ? 'text-red-500 font-semibold' : 'text-text-400'}>
                      {r.ocr_difference}
                    </span>
                  : <span className="text-text-200">—</span>
                }
              </Table.Td>
              <Table.Td className="text-text-400 text-sm">{r.users?.full_name}</Table.Td>
              <Table.Td>
                <Badge size="sm" radius="sm" variant="light"
                  color={STATUS_COLORS[r.status] || 'gray'}>
                  {r.status.replace(/_/g, ' ')}
                </Badge>
              </Table.Td>
              <Table.Td>
                {['flagged_ocr_mismatch', 'flagged_anomaly', 'flagged_both', 'pending_review'].includes(r.status) && (
                  <Tooltip label="Review">
                    <ActionIcon variant="light" color="orange" radius="md" size="sm"
                      onClick={() => openReview(r)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </ActionIcon>
                  </Tooltip>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </div>
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title order={3} className="text-text-700 font-bold">Readings</Title>
        <Text size="sm" className="text-text-300 mt-1">All meter readings and flagged items</Text>
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

        {/* Filters */}
        <Paper shadow="xs" radius="lg" p="md" className="bg-white mb-4">
          <Group gap="md" wrap="wrap">
            <TextInput
              placeholder="Search by meter serial..."
              value={search}
              onChange={e => setSearch(e.currentTarget.value)}
              radius="md" className="flex-1 min-w-[200px]"
            />
            <Select
              placeholder="Status" value={statusFilter}
              onChange={setStatusFilter} clearable radius="md" w={200}
              data={[
                { value: 'verified', label: 'Verified' },
                { value: 'flagged_ocr_mismatch', label: 'OCR Mismatch' },
                { value: 'flagged_anomaly', label: 'Anomaly' },
                { value: 'flagged_both', label: 'Flagged Both' },
                { value: 'pending_review', label: 'Pending Review' },
              ]}
            />
          </Group>
        </Paper>

        <Tabs.Panel value="all">
          <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
            {loading ? (
              <Stack p="md" gap="sm">
                {[...Array(5)].map((_, i) => <Skeleton key={i} height={40} radius="md" />)}
              </Stack>
            ) : error ? (
              <Alert color="red" m="md" radius="md" variant="light">{error}</Alert>
            ) : (
              <ReadingsTable data={filteredReadings} />
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="flagged">
          <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
            {flaggedLoading ? (
              <Stack p="md" gap="sm">
                {[...Array(5)].map((_, i) => <Skeleton key={i} height={40} radius="md" />)}
              </Stack>
            ) : (
              <ReadingsTable data={filteredFlagged} />
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Review Modal */}
      <Modal opened={reviewModal} onClose={() => setReviewModal(false)}
        title={<Text fw={600} className="text-text-600">Review Reading</Text>}
        radius="lg" size="md">
        {reviewTarget && (
          <Stack gap="sm">
            {reviewError && <Alert color="red" radius="md" variant="light">{reviewError}</Alert>}

            <Paper radius="md" p="sm" className="bg-gray-50">
              <Group gap="xl">
                <div>
                  <Text size="xs" className="text-text-300">Meter</Text>
                  <Text size="sm" fw={600} className="text-text-600">{reviewTarget.meters?.serial_no}</Text>
                </div>
                <div>
                  <Text size="xs" className="text-text-300">Manual</Text>
                  <Text size="sm" fw={600} className="text-text-600">{reviewTarget.manual_value}</Text>
                </div>
                <div>
                  <Text size="xs" className="text-text-300">OCR</Text>
                  <Text size="sm" fw={600} className="text-red-500">{reviewTarget.ocr_value ?? '—'}</Text>
                </div>
                <div>
                  <Text size="xs" className="text-text-300">Difference</Text>
                  <Text size="sm" fw={600} className="text-red-500">{reviewTarget.ocr_difference ?? '—'}</Text>
                </div>
              </Group>
              {reviewTarget.photo_url && (
                <img src={reviewTarget.photo_url} alt="Meter photo"
                  className="w-full rounded-lg mt-3 max-h-40 object-cover" />
              )}
            </Paper>

            <Select label="Resolution Status" radius="md"
              value={reviewForm.status}
              onChange={val => setReviewForm({ ...reviewForm, status: val || 'verified' })}
              data={[
                { value: 'verified', label: 'Mark as Verified' },
                { value: 'pending_review', label: 'Keep Pending' },
              ]} />

            <Textarea label="Reviewer Notes" placeholder="Describe your findings..."
              radius="md" minRows={3}
              value={reviewForm.reviewer_notes}
              onChange={e => setReviewForm({ ...reviewForm, reviewer_notes: e.currentTarget.value })} />

            <Button fullWidth radius="md" loading={reviewing} onClick={handleReview}
              className="bg-primary-500 hover:bg-primary-600 mt-2">
              Submit Review
            </Button>
          </Stack>
        )}
      </Modal>
    </div>
  )
}
