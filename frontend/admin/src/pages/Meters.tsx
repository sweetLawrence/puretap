import { useEffect, useState, useRef } from 'react'
import {
  Paper, Title, Text, TextInput, Select, Button, Badge, Modal,
  Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip, Tabs
} from '@mantine/core'
import api from '../utils/api'

interface Customer { id: number; full_name: string; account_no: string }
interface Meter {
  id: number
  serial_no: string
  customer_id: number
  installation_address: string
  qr_code_url: string
  is_active: boolean
  installed_at: string
  customers: Customer
}

export default function Meters() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [filtered, setFiltered] = useState<Meter[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [qrMeters, setQrMeters] = useState<Meter[]>([])
  const [loading, setLoading] = useState(true)
  const [qrLoading, setQrLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ serial_no: '', customer_id: '', installation_address: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const printRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    try {
      const [metersRes, customersRes] = await Promise.all([
        api.get('/meters'),
        api.get('/customers')
      ])
      setMeters(metersRes.data.data)
      setFiltered(metersRes.data.data)
      setCustomers(customersRes.data.data)
    } catch {
      setError('Failed to load meters')
    } finally {
      setLoading(false)
    }
  }

  const loadQR = async () => {
    setQrLoading(true)
    try {
      const res = await api.get('/meters/qrcodes')
      setQrMeters(res.data.data)
    } catch {
      setError('Failed to load QR codes')
    } finally {
      setQrLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = [...meters]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(m =>
        m.serial_no.toLowerCase().includes(q) ||
        m.customers?.full_name?.toLowerCase().includes(q) ||
        m.customers?.account_no?.toLowerCase().includes(q)
      )
    }
    if (statusFilter) data = data.filter(m =>
      statusFilter === 'active' ? m.is_active : !m.is_active
    )
    setFiltered(data)
  }, [search, statusFilter, meters])

  const handleSave = async () => {
    if (!form.serial_no || !form.customer_id) {
      setFormError('Serial number and customer are required')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      await api.post('/meters', {
        ...form,
        customer_id: Number(form.customer_id)
      })
      setModalOpen(false)
      setForm({ serial_no: '', customer_id: '', installation_address: '' })
      load()
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create meter')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this meter?')) return
    try {
      await api.patch(`/meters/${id}/deactivate`)
      load()
    } catch {
      alert('Failed to deactivate meter')
    }
  }

  const handleRegenerateQR = async (id: number) => {
    try {
      await api.patch(`/meters/${id}/regenerate-qr`)
      loadQR()
      alert('QR code regenerated')
    } catch {
      alert('Failed to regenerate QR')
    }
  }

  const handlePrintAll = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const content = printRef.current?.innerHTML || ''
    win.document.write(`
      <html><head><title>PureTap QR Codes</title>
      <style>
        body { font-family: sans-serif; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .card { border: 1px solid #eee; border-radius: 12px; padding: 16px; text-align: center; page-break-inside: avoid; }
        .card img { width: 140px; height: 140px; }
        .card h4 { margin: 8px 0 4px; font-size: 13px; }
        .card p { margin: 0; font-size: 11px; color: #666; }
        @media print { body { padding: 10px; } }
      </style></head>
      <body><div class="grid">${content}</div></body></html>
    `)
    win.document.close()
    win.print()
  }

  const handlePrintOne = (meter: Meter) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><head><title>QR - ${meter.serial_no}</title>
      <style>
        body { font-family: sans-serif; display: flex; justify-content: center; padding: 40px; }
        .card { border: 1px solid #eee; border-radius: 12px; padding: 24px; text-align: center; width: 200px; }
        img { width: 160px; height: 160px; }
        h4 { margin: 10px 0 4px; font-size: 14px; }
        p { margin: 0; font-size: 12px; color: #666; }
      </style></head>
      <body>
        <div class="card">
          <img src="${meter.qr_code_url}" />
          <h4>${meter.serial_no}</h4>
          <p>${meter.customers?.full_name}</p>
          <p>${meter.customers?.account_no}</p>
        </div>
      </body></html>
    `)
    win.document.close()
    win.print()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title order={3} className="text-text-700 font-bold">Meters</Title>
          <Text size="sm" className="text-text-300 mt-1">Manage meters and QR codes</Text>
        </div>
        <Button radius="md" onClick={() => { setFormError(''); setModalOpen(true) }} className="bg-primary-500 hover:bg-primary-600">
          + Add Meter
        </Button>
      </div>

      <Tabs defaultValue="list" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="list">All Meters</Tabs.Tab>
          <Tabs.Tab value="qrcodes" onClick={loadQR}>QR Codes</Tabs.Tab>
        </Tabs.List>

        {/* List Tab */}
        <Tabs.Panel value="list">
          <Paper shadow="xs" radius="lg" p="md" className="bg-white mb-4">
            <Group gap="md" wrap="wrap">
              <TextInput
                placeholder="Search serial, customer, account..."
                value={search}
                onChange={e => setSearch(e.currentTarget.value)}
                radius="md" className="flex-1 min-w-[200px]"
              />
              <Select
                placeholder="Status" value={statusFilter}
                onChange={setStatusFilter} clearable radius="md" w={140}
                data={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
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
                      <Table.Th className="text-text-400 text-xs uppercase">Serial No</Table.Th>
                      <Table.Th className="text-text-400 text-xs uppercase">Customer</Table.Th>
                      <Table.Th className="text-text-400 text-xs uppercase">Address</Table.Th>
                      <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
                      <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {filtered.length === 0 ? (
                      <Table.Tr>
                        <Table.Td colSpan={5} className="text-center text-text-300 py-8">No meters found</Table.Td>
                      </Table.Tr>
                    ) : filtered.map(m => (
                      <Table.Tr key={m.id}>
                        <Table.Td className="text-text-600 font-semibold text-sm">{m.serial_no}</Table.Td>
                        <Table.Td>
                          <Text size="sm" className="text-text-500">{m.customers?.full_name}</Text>
                          <Text size="xs" className="text-text-300">{m.customers?.account_no}</Text>
                        </Table.Td>
                        <Table.Td className="text-text-400 text-sm">{m.installation_address || '—'}</Table.Td>
                        <Table.Td>
                          <Badge size="sm" radius="sm" variant="light" color={m.is_active ? 'green' : 'gray'}>
                            {m.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="Regenerate QR">
                              <ActionIcon variant="light" color="blue" radius="md" size="sm"
                                onClick={() => handleRegenerateQR(m.id)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="23 4 23 10 17 10" />
                                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                </svg>
                              </ActionIcon>
                            </Tooltip>
                            {m.is_active && (
                              <Tooltip label="Deactivate">
                                <ActionIcon variant="light" color="red" radius="md" size="sm"
                                  onClick={() => handleDeactivate(m.id)}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            )}
          </Paper>
        </Tabs.Panel>

        {/* QR Tab */}
        <Tabs.Panel value="qrcodes">
          <div className="flex justify-end mb-4">
            <Button radius="md" variant="outline" onClick={handlePrintAll}
              className="border-primary-500 text-primary-600">
              Print All QR Codes
            </Button>
          </div>
          {qrLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => <Skeleton key={i} height={220} radius="lg" />)}
            </div>
          ) : (
            <div ref={printRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {qrMeters.map(m => (
                <Paper key={m.id} shadow="xs" radius="lg" p="md" className="bg-white text-center">
                  <img src={m.qr_code_url} alt={m.serial_no} className="w-32 h-32 mx-auto mb-3" />
                  <Text size="sm" fw={600} className="text-text-600">{m.serial_no}</Text>
                  <Text size="xs" className="text-text-400">{m.customers?.full_name}</Text>
                  <Text size="xs" className="text-text-300 mb-3">{m.customers?.account_no}</Text>
                  <Button size="xs" radius="md" variant="light" fullWidth
                    onClick={() => handlePrintOne(m)}>
                    Print
                  </Button>
                </Paper>
              ))}
            </div>
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Create Modal */}
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)}
        title={<Text fw={600} className="text-text-600">Add Meter</Text>}
        radius="lg" size="md">
        <Stack gap="sm">
          {formError && <Alert color="red" radius="md" variant="light">{formError}</Alert>}
          <TextInput label="Serial Number" placeholder="MTR-GT-00016" radius="md"
            value={form.serial_no} onChange={e => setForm({ ...form, serial_no: e.currentTarget.value })} />
          <Select label="Customer" placeholder="Select customer" radius="md"
            value={form.customer_id}
            onChange={val => setForm({ ...form, customer_id: val || '' })}
            searchable
            data={customers.filter(c => c).map(c => ({
              value: String(c.id),
              label: `${c.full_name} — ${c.account_no}`
            }))} />
          <TextInput label="Installation Address" placeholder="Plot 1 Gitaru Town" radius="md"
            value={form.installation_address}
            onChange={e => setForm({ ...form, installation_address: e.currentTarget.value })} />
          <Button fullWidth radius="md" loading={saving} onClick={handleSave}
            className="bg-primary-500 hover:bg-primary-600 mt-2">
            Create Meter
          </Button>
        </Stack>
      </Modal>
    </div>
  )
}
