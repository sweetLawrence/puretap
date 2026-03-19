import { useEffect, useState } from 'react'
import {
  Paper, Title, Text, TextInput, Select, Button, Badge, Modal,
  Table, ActionIcon, Group, Stack, Alert, Skeleton, Tooltip, PasswordInput
} from '@mantine/core'
import api from '../utils/api'

interface User {
  id: number
  full_name: string
  phone: string
  email: string
  role: string
  is_active: boolean
  last_login_at: string
  created_at: string
}

const emptyForm = {
  full_name: '', phone: '', email: '',
  password: '', role: 'field_staff'
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const load = async () => {
    try {
      const res = await api.get('/users')
      setUsers(res.data.data)
      setFiltered(res.data.data)
    } catch {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = [...users]
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(u =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.includes(q)
      )
    }
    if (roleFilter) data = data.filter(u => u.role === roleFilter)
    if (statusFilter) data = data.filter(u =>
      statusFilter === 'active' ? u.is_active : !u.is_active
    )
    setFiltered(data)
  }, [search, roleFilter, statusFilter, users])

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyForm)
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (u: User) => {
    setEditTarget(u)
    setForm({
      full_name: u.full_name, phone: u.phone,
      email: u.email, password: '', role: u.role
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.full_name || !form.email || !form.phone) {
      setFormError('Full name, email and phone are required')
      return
    }
    if (!editTarget && !form.password) {
      setFormError('Password is required for new users')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const payload: any = {
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        role: form.role
      }
      if (form.password) payload.password = form.password

      if (editTarget) {
        await api.patch(`/users/${editTarget.id}`, payload)
      } else {
        await api.post('/auth/register', payload)
      }
      setModalOpen(false)
      load()
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this user?')) return
    try {
      await api.patch(`/users/${id}/deactivate`)
      load()
    } catch {
      alert('Failed to deactivate user')
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title order={3} className="text-text-700 font-bold">Users</Title>
          <Text size="sm" className="text-text-300 mt-1">Manage admins and field staff</Text>
        </div>
        <Button radius="md" onClick={openCreate} className="bg-primary-500 hover:bg-primary-600">
          + Add User
        </Button>
      </div>

      <Paper shadow="xs" radius="lg" p="md" className="bg-white mb-4">
        <Group gap="md" wrap="wrap">
          <TextInput
            placeholder="Search name, email, phone..."
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
            radius="md" className="flex-1 min-w-[200px]"
          />
          <Select placeholder="Role" value={roleFilter}
            onChange={setRoleFilter} clearable radius="md" w={160}
            data={[
              { value: 'admin', label: 'Admin' },
              { value: 'field_staff', label: 'Field Staff' }
            ]} />
          <Select placeholder="Status" value={statusFilter}
            onChange={setStatusFilter} clearable radius="md" w={140}
            data={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]} />
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
                  <Table.Th className="text-text-400 text-xs uppercase">Name</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Email</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Phone</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Role</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Last Login</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
                  <Table.Th className="text-text-400 text-xs uppercase">Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7} className="text-center text-text-300 py-8">No users found</Table.Td>
                  </Table.Tr>
                ) : filtered.map(u => (
                  <Table.Tr key={u.id}>
                    <Table.Td className="text-text-600 font-semibold text-sm">{u.full_name}</Table.Td>
                    <Table.Td className="text-text-400 text-sm">{u.email}</Table.Td>
                    <Table.Td className="text-text-400 text-sm">{u.phone}</Table.Td>
                    <Table.Td>
                      <Badge size="sm" radius="sm" variant="light"
                        color={u.role === 'admin' ? 'blue' : 'teal'}>
                        {u.role === 'field_staff' ? 'Field Staff' : 'Admin'}
                      </Badge>
                    </Table.Td>
                    <Table.Td className="text-text-300 text-sm">
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleDateString()
                        : '—'}
                    </Table.Td>
                    <Table.Td>
                      <Badge size="sm" radius="sm" variant="light"
                        color={u.is_active ? 'green' : 'gray'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Tooltip label="Edit">
                          <ActionIcon variant="light" color="blue" radius="md" size="sm"
                            onClick={() => openEdit(u)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </ActionIcon>
                        </Tooltip>
                        {u.is_active && (
                          <Tooltip label="Deactivate">
                            <ActionIcon variant="light" color="red" radius="md" size="sm"
                              onClick={() => handleDeactivate(u.id)}>
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

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)}
        title={<Text fw={600} className="text-text-600">{editTarget ? 'Edit User' : 'Add User'}</Text>}
        radius="lg" size="md">
        <Stack gap="sm">
          {formError && <Alert color="red" radius="md" variant="light">{formError}</Alert>}
          <TextInput label="Full Name" placeholder="Jane Doe" radius="md"
            value={form.full_name} onChange={e => setForm({ ...form, full_name: e.currentTarget.value })} />
          <TextInput label="Phone" placeholder="+254700000000" radius="md"
            value={form.phone} onChange={e => setForm({ ...form, phone: e.currentTarget.value })} />
          <TextInput label="Email" placeholder="jane@puretap.co.ke" radius="md"
            value={form.email} onChange={e => setForm({ ...form, email: e.currentTarget.value })} />
          <Select label="Role" radius="md" value={form.role}
            onChange={val => setForm({ ...form, role: val || 'field_staff' })}
            data={[
              { value: 'admin', label: 'Admin' },
              { value: 'field_staff', label: 'Field Staff' }
            ]} />
          <PasswordInput
            label={editTarget ? 'New Password (leave blank to keep current)' : 'Password'}
            placeholder="Enter password" radius="md"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.currentTarget.value })} />
          <Button fullWidth radius="md" loading={saving} onClick={handleSave}
            className="bg-primary-500 hover:bg-primary-600 mt-2">
            {editTarget ? 'Save Changes' : 'Create User'}
          </Button>
        </Stack>
      </Modal>
    </div>
  )
}
