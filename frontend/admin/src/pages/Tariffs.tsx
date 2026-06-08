import { useEffect, useState } from 'react'
import {
  Paper,
  Title,
  Text,
  Select,
  Button,
  Badge,
  Modal,
  Table,
  ActionIcon,
  Group,
  Stack,
  Alert,
  Skeleton,
  Tooltip,
  NumberInput
} from '@mantine/core'
import api from '../utils/api'

interface Tariff {
  id: number
  name: string
  customer_type: string
  min_units: number
  max_units: number | null
  rate_per_unit: number
  fixed_charge: number
  is_active: boolean
  effective_from: string
}

const emptyForm = {
  name: '',
  customer_type: 'domestic',
  min_units: 0,
  max_units: '' as number | '',
  rate_per_unit: 0,
  fixed_charge: 0,
  effective_from: new Date().toISOString().split('T')[0]
}

export default function Tariffs () {
  const [tariffs, setTariffs] = useState<Tariff[]>([])
  const [filtered, setFiltered] = useState<Tariff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Tariff | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  
  // Delete confirmation states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [tariffToDelete, setTariffToDelete] = useState<Tariff | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/tariffs')
      setTariffs(res.data.data)
      setFiltered(res.data.data)
    } catch {
      setError('Failed to load tariffs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    let data = [...tariffs]
    if (typeFilter) data = data.filter(t => t.customer_type === typeFilter)
    if (statusFilter)
      data = data.filter(t =>
        statusFilter === 'active' ? t.is_active : !t.is_active
      )
    setFiltered(data)
  }, [typeFilter, statusFilter, tariffs])

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (t: Tariff) => {
    setEditTarget(t)
    setForm({
      name: t.name,
      customer_type: t.customer_type,
      min_units: t.min_units,
      max_units: t.max_units ?? '',
      rate_per_unit: t.rate_per_unit,
      fixed_charge: t.fixed_charge,
      effective_from: t.effective_from.split('T')[0]
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || form.rate_per_unit === undefined) {
      setFormError('Name and rate per unit are required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: form.name,
        customer_type: form.customer_type,
        min_units: String(form.min_units),
        max_units: form.max_units === '' ? null : String(form.max_units),
        rate_per_unit: String(form.rate_per_unit),
        fixed_charge: String(form.fixed_charge),
        effective_from: form.effective_from
      }

      if (editTarget) {
        await api.patch(`/tariffs/${editTarget.id}`, payload)
      } else {
        await api.post('/tariffs', payload)
      }
      setModalOpen(false)
      load()
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save tariff')
    } finally {
      setSaving(false)
    }
  }

  // NEW: Activate tariff
  const handleActivate = async (id: number) => {
    try {
      await api.patch(`/tariffs/${id}/activate`)
      load()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to activate tariff')
    }
  }

  // Deactivate tariff
  const handleDeactivate = async (id: number) => {
    try {
      await api.patch(`/tariffs/${id}/deactivate`)
      load()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to deactivate tariff')
    }
  }

  // Delete confirmation
  const confirmDelete = (tariff: Tariff) => {
    setTariffToDelete(tariff)
    setDeleteModalOpen(true)
  }

  // Execute delete
  const handleDelete = async () => {
    if (!tariffToDelete) return
    
    setDeleting(true)
    try {
      await api.delete(`/tariffs/${tariffToDelete.id}`)
      setDeleteModalOpen(false)
      setTariffToDelete(null)
      load()
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete tariff')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className='p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <Title order={3} className='text-text-700 font-bold'>
            Tariffs
          </Title>
          <Text size='sm' className='text-text-300 mt-1'>
            Manage billing rate slabs
          </Text>
        </div>
        <Button
          radius='md'
          onClick={openCreate}
          className='bg-primary-500 hover:bg-primary-600'
        >
          + Add Tariff
        </Button>
      </div>

      <Paper shadow='xs' radius='lg' p='md' className='bg-white mb-4'>
        <Group gap='md' wrap='wrap'>
          <Select
            placeholder='Customer Type'
            value={typeFilter}
            onChange={setTypeFilter}
            clearable
            radius='md'
            w={180}
            data={[
              { value: 'domestic', label: 'Domestic' },
              { value: 'commercial', label: 'Commercial' }
            ]}
          />
          <Select
            placeholder='Status'
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            radius='md'
            w={140}
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]}
          />
        </Group>
      </Paper>

      <Paper shadow='xs' radius='lg' className='bg-white overflow-hidden'>
        {loading ? (
          <Stack p='md' gap='sm'>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={40} radius='md' />
            ))}
          </Stack>
        ) : error ? (
          <Alert color='red' m='md' radius='md' variant='light'>
            {error}
          </Alert>
        ) : (
          <div className='table-responsive'>
            <Table
              striped
              highlightOnHover
              verticalSpacing='sm'
              horizontalSpacing='md'
            >
              <Table.Thead>
                <Table.Tr className='bg-gray-50'>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Name
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Type
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Units Range
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Rate / Unit
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Fixed Charge
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Effective
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Status
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Actions
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.length === 0 ? (
                  <Table.Tr>
                    <Table.Td
                      colSpan={8}
                      className='text-center text-text-300 py-8'
                    >
                      No tariffs found
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filtered.map(t => (
                    <Table.Tr key={t.id}>
                      <Table.Td className='text-text-600 font-semibold text-sm'>
                        {t.name}
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size='sm'
                          radius='sm'
                          variant='light'
                          color={
                            t.customer_type === 'commercial' ? 'blue' : 'teal'
                          }
                        >
                          {t.customer_type}
                        </Badge>
                      </Table.Td>
                      <Table.Td className='text-text-400 text-sm'>
                        {t.min_units} — {t.max_units ?? '∞'} m³
                      </Table.Td>
                      <Table.Td className='text-text-500 text-sm'>
                        KES {t.rate_per_unit}
                      </Table.Td>
                      <Table.Td className='text-text-500 text-sm'>
                        KES {t.fixed_charge}
                      </Table.Td>
                      <Table.Td className='text-text-400 text-sm'>
                        {t.effective_from}
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size='sm'
                          radius='sm'
                          variant='light'
                          color={t.is_active ? 'green' : 'gray'}
                        >
                          {t.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap='xs'>
                          <Tooltip label='Edit'>
                            <ActionIcon
                              variant='light'
                              color='blue'
                              radius='md'
                              size='sm'
                              onClick={() => openEdit(t)}
                            >
                              <svg
                                width='14'
                                height='14'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                              >
                                <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                                <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
                              </svg>
                            </ActionIcon>
                          </Tooltip>
                          
                          {/* NEW: Activate button - only show for inactive tariffs */}
                          {!t.is_active && (
                            <Tooltip label='Activate'>
                              <ActionIcon
                                variant='light'
                                color='green'
                                radius='md'
                                size='sm'
                                onClick={() => handleActivate(t.id)}
                              >
                                <svg
                                  width='14'
                                  height='14'
                                  viewBox='0 0 24 24'
                                  fill='none'
                                  stroke='currentColor'
                                  strokeWidth='2'
                                >
                                  <path d='M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34' />
                                  <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
                                </svg>
                              </ActionIcon>
                            </Tooltip>
                          )}

                          {/* Deactivate button - only show for active tariffs */}
                          {t.is_active && (
                            <Tooltip label='Deactivate'>
                              <ActionIcon
                                variant='light'
                                color='orange'
                                radius='md'
                                size='sm'
                                onClick={() => handleDeactivate(t.id)}
                              >
                                <svg
                                  width='14'
                                  height='14'
                                  viewBox='0 0 24 24'
                                  fill='none'
                                  stroke='currentColor'
                                  strokeWidth='2'
                                >
                                  <circle cx='12' cy='12' r='10' />
                                  <line x1='4.93' y1='4.93' x2='19.07' y2='19.07' />
                                </svg>
                              </ActionIcon>
                            </Tooltip>
                          )}

                          {/* Delete button - always visible */}
                          <Tooltip label='Delete Permanently'>
                            <ActionIcon
                              variant='light'
                              color='red'
                              radius='md'
                              size='sm'
                              onClick={() => confirmDelete(t)}
                            >
                              <svg
                                width='14'
                                height='14'
                                viewBox='0 0 24 24'
                                fill='none'
                                stroke='currentColor'
                                strokeWidth='2'
                              >
                                <path d='M3 6h18' />
                                <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                                <line x1='10' y1='11' x2='10' y2='17' />
                                <line x1='14' y1='11' x2='14' y2='17' />
                              </svg>
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Paper>

      {/* Add/Edit Modal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <Text fw={600} className='text-text-600'>
            {editTarget ? 'Edit Tariff' : 'Add Tariff'}
          </Text>
        }
        radius='lg'
        size='md'
      >
        <Stack gap='sm'>
          {formError && (
            <Alert color='red' radius='md' variant='light'>
              {formError}
            </Alert>
          )}
          <TextInput
            label='Name'
            placeholder='Domestic block 1'
            value={form.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, name: e.currentTarget.value })
            }
          />
          <Select
            label='Customer Type'
            radius='md'
            value={form.customer_type}
            onChange={val =>
              setForm({ ...form, customer_type: val || 'domestic' })
            }
            data={[
              { value: 'domestic', label: 'Domestic' },
              { value: 'commercial', label: 'Commercial' }
            ]}
          />
          <Group grow>
            <NumberInput
              label='Min Units (m³)'
              radius='md'
              min={0}
              value={form.min_units}
              onChange={val => setForm({ ...form, min_units: Number(val) })}
            />
            <NumberInput
              label='Max Units (m³)'
              radius='md'
              min={0}
              placeholder='Leave empty for unlimited'
              value={form.max_units === '' ? undefined : form.max_units}
              onChange={val =>
                setForm({
                  ...form,
                  max_units: val === undefined ? '' : Number(val)
                })
              }
            />
          </Group>
          <Group grow>
            <NumberInput
              label='Rate per Unit (KES)'
              radius='md'
              min={0}
              decimalScale={2}
              value={form.rate_per_unit}
              onChange={val => setForm({ ...form, rate_per_unit: Number(val) })}
            />
            <NumberInput
              label='Fixed Charge (KES)'
              radius='md'
              min={0}
              decimalScale={2}
              value={form.fixed_charge}
              onChange={val => setForm({ ...form, fixed_charge: Number(val) })}
            />
          </Group>
          <div>
            <label className="block text-sm font-medium text-text-500 mb-1">
              Effective From
            </label>
            <input
              type="date"
              value={form.effective_from}
              onChange={e => setForm({ ...form, effective_from: e.currentTarget.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
          <Button
            fullWidth
            radius='md'
            loading={saving}
            onClick={handleSave}
            className='bg-primary-500 hover:bg-primary-600 mt-2'
          >
            {editTarget ? 'Save Changes' : 'Create Tariff'}
          </Button>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title={
          <Text fw={600} className='text-text-600'>
            Delete Tariff
          </Text>
        }
        radius='lg'
        size='sm'
      >
        <Stack gap='md'>
          <Alert color='red' variant='light' radius='md'>
            <Text size='sm' fw={600}>⚠️ Warning: This action cannot be undone!</Text>
            <Text size='xs' className='mt-1'>
              Deleting this tariff will permanently remove it from the system.
            </Text>
          </Alert>
          
          {tariffToDelete && (
            <div className='bg-gray-50 rounded-lg p-3'>
              <Text size='sm' className='text-text-500'>Tariff Details:</Text>
              <Text size='sm' fw={600} className='text-text-700'>{tariffToDelete.name}</Text>
              <Text size='xs' className='text-text-400'>
                {tariffToDelete.customer_type} | {tariffToDelete.min_units} — {tariffToDelete.max_units ?? '∞'} m³
              </Text>
            </div>
          )}
          
          <Group grow>
            <Button
              variant='outline'
              radius='md'
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              color='red'
              radius='md'
              loading={deleting}
              onClick={handleDelete}
              className='bg-red-600 hover:bg-red-700'
            >
              {deleting ? 'Deleting...' : 'Yes, Delete Permanently'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  )
}

// TextInput component
function TextInput ({
  label,
  placeholder,
  value,
  onChange,
  disabled
}: any) {
  return (
    <div>
      <label className='block text-sm font-medium text-text-500 mb-1'>
        {label}
      </label>
      <input
        type='text'
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:bg-gray-50 disabled:text-text-300'
      />
    </div>
  )
}