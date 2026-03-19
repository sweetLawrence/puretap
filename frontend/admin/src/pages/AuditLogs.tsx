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
  Code
} from '@mantine/core'
import api from '../utils/api'

interface AuditLog {
  id: number
  user_id: number
  action: string
  table_name: string
  record_id: number
  old_data: any
  new_data: any
  ip_address: string
  created_at: string
  users: { full_name: string; role: string }
}

export default function AuditLogs () {
  const [_logs, setLogs] = useState<AuditLog[]>([])
  const [filtered, setFiltered] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tableFilter, setTableFilter] = useState<string | null>(null)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [detailModal, setDetailModal] = useState(false)
  const [selected, setSelected] = useState<AuditLog | null>(null)

  const load = async () => {
    try {
      const params = new URLSearchParams()
      if (tableFilter) params.append('table_name', tableFilter)
      if (from) params.append('from', from)
      if (to) params.append('to', to)
      const res = await api.get(`/audit-logs?${params.toString()}`)
      setLogs(res.data.data)
      setFiltered(res.data.data)
    } catch {
      setError('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleFilter = () => {
    setLoading(true)
    load()
  }

  const openDetail = (log: AuditLog) => {
    setSelected(log)
    setDetailModal(true)
  }

  const ACTION_COLOR: Record<string, string> = {
    POST: 'blue',
    PATCH: 'yellow',
    DELETE: 'red',
    GET: 'gray'
  }

  const getActionColor = (action: string) => {
    const method = action.split('_')[0]
    return ACTION_COLOR[method] || 'gray'
  }

  return (
    <div className='p-6'>
      <div className='mb-6'>
        <Title order={3} className='text-text-700 font-bold'>
          Audit Logs
        </Title>
        <Text size='sm' className='text-text-300 mt-1'>
          System activity trail
        </Text>
      </div>

      <Paper shadow='xs' radius='lg' p='md' className='bg-white mb-4'>
        <Group gap='md' wrap='wrap'>
          {/* <Select placeholder="Table" value={tableFilter}
                onChange={setTableFilter} clearable radius="md" w={160}
                data={[
                { value: 'customers', label: 'Customers' },
                { value: 'meters', label: 'Meters' },
                { value: 'readings', label: 'Readings' },
                { value: 'invoices', label: 'Invoices' },
                { value: 'payments', label: 'Payments' },
                { value: 'tariffs', label: 'Tariffs' },
                { value: 'users', label: 'Users' },
                ]} /> */}

          <Select
            label='Tables'
            placeholder='Select table'
            value={tableFilter}
            onChange={setTableFilter}
            clearable
            radius='md'
            w={160}
            data={[
              { value: 'customers', label: 'Customers' },
              { value: 'meters', label: 'Meters' },
              { value: 'readings', label: 'Readings' },
              { value: 'invoices', label: 'Invoices' },
              { value: 'payments', label: 'Payments' },
              { value: 'tariffs', label: 'Tariffs' },
              { value: 'users', label: 'Users' }
            ]}
          />
          <div>
            <label className='block text-xs text-text-300 mb-1'>From</label>
            <input
              type='date'
              value={from}
              onChange={e => setFrom(e.target.value)}
              className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300'
            />
          </div>
          <div>
            <label className='block text-xs text-text-300 mb-1'>To</label>
            <input
              type='date'
              value={to}
              onChange={e => setTo(e.target.value)}
              className='border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300'
            />
          </div>
          {/* <div className='flex items-end'>
            
            <Button
              size='sm'
              radius='md'
    
              onClick={handleFilter}
              className='bg-primary-500 hover:bg-primary-600'
            >
              Apply Filter
            </Button>
          </div> */}


          <div>
  <label className="block text-xs text-text-300 mb-1 opacity-0">
    Action
  </label>

  <Button
    size="sm"
    radius="md"
    onClick={handleFilter}
    className="bg-primary-500 hover:bg-primary-600"
  >
    Apply Filter
  </Button>
</div>



        </Group>
      </Paper>

      <Paper shadow='xs' radius='lg' className='bg-white overflow-hidden'>
        {loading ? (
          <Stack p='md' gap='sm'>
            {[...Array(6)].map((_, i) => (
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
                    Time
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    User
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Action
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Table
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Record ID
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    IP
                  </Table.Th>
                  <Table.Th className='text-text-400 text-xs uppercase'>
                    Detail
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.length === 0 ? (
                  <Table.Tr>
                    <Table.Td
                      colSpan={7}
                      className='text-center text-text-300 py-8'
                    >
                      No logs found
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filtered.map(log => (
                    <Table.Tr key={log.id}>
                      <Table.Td className='text-text-300 text-xs'>
                        {new Date(log.created_at).toLocaleString()}
                      </Table.Td>
                      <Table.Td>
                        <Text size='sm' className='text-text-500'>
                          {log.users?.full_name || '—'}
                        </Text>
                        <Text size='xs' className='text-text-300'>
                          {log.users?.role}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size='sm'
                          radius='sm'
                          variant='light'
                          color={getActionColor(log.action)}
                        >
                          {log.action}
                        </Badge>
                      </Table.Td>
                      <Table.Td className='text-text-400 text-sm'>
                        {log.table_name}
                      </Table.Td>
                      <Table.Td className='text-text-300 text-sm'>
                        {log.record_id ?? '—'}
                      </Table.Td>
                      <Table.Td className='text-text-300 text-xs'>
                        {log.ip_address || '—'}
                      </Table.Td>
                      <Table.Td>
                        <Tooltip label='View details'>
                          <ActionIcon
                            variant='light'
                            color='blue'
                            radius='md'
                            size='sm'
                            onClick={() => openDetail(log)}
                          >
                            <svg
                              width='14'
                              height='14'
                              viewBox='0 0 24 24'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2'
                            >
                              <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
                              <circle cx='12' cy='12' r='3' />
                            </svg>
                          </ActionIcon>
                        </Tooltip>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </div>
        )}
      </Paper>

      {/* Detail Modal */}
      <Modal
        opened={detailModal}
        onClose={() => setDetailModal(false)}
        title={
          <Text fw={600} className='text-text-600'>
            Log Detail — #{selected?.id}
          </Text>
        }
        radius='lg'
        size='lg'
      >
        {selected && (
          <Stack gap='md'>
            <Group gap='xl'>
              <div>
                <Text size='xs' className='text-text-300'>
                  Action
                </Text>
                <Badge
                  size='sm'
                  radius='sm'
                  variant='light'
                  color={getActionColor(selected.action)}
                >
                  {selected.action}
                </Badge>
              </div>
              <div>
                <Text size='xs' className='text-text-300'>
                  Table
                </Text>
                <Text size='sm' fw={600} className='text-text-600'>
                  {selected.table_name}
                </Text>
              </div>
              <div>
                <Text size='xs' className='text-text-300'>
                  Record ID
                </Text>
                <Text size='sm' fw={600} className='text-text-600'>
                  {selected.record_id ?? '—'}
                </Text>
              </div>
              <div>
                <Text size='xs' className='text-text-300'>
                  User
                </Text>
                <Text size='sm' fw={600} className='text-text-600'>
                  {selected.users?.full_name || '—'}
                </Text>
              </div>
              <div>
                <Text size='xs' className='text-text-300'>
                  IP
                </Text>
                <Text size='sm' className='text-text-400'>
                  {selected.ip_address || '—'}
                </Text>
              </div>
              <div>
                <Text size='xs' className='text-text-300'>
                  Time
                </Text>
                <Text size='sm' className='text-text-400'>
                  {new Date(selected.created_at).toLocaleString()}
                </Text>
              </div>
            </Group>

            {selected.new_data && (
              <div>
                <Text
                  size='xs'
                  fw={600}
                  className='text-text-400 uppercase mb-1'
                >
                  New Data
                </Text>
                <Code block className='text-xs bg-gray-50 rounded-lg p-3'>
                  {JSON.stringify(selected.new_data, null, 2)}
                </Code>
              </div>
            )}

            {selected.old_data && (
              <div>
                <Text
                  size='xs'
                  fw={600}
                  className='text-text-400 uppercase mb-1'
                >
                  Old Data
                </Text>
                <Code block className='text-xs bg-gray-50 rounded-lg p-3'>
                  {JSON.stringify(selected.old_data, null, 2)}
                </Code>
              </div>
            )}
          </Stack>
        )}
      </Modal>
    </div>
  )
}
