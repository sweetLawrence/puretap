import { useEffect, useState } from 'react'
import { Paper, Title, Text, Button, Alert, Stack, Badge, Tabs, Skeleton } from '@mantine/core'
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

interface Reading {
  id: number
  reading_date: string
  status: string
  meters: { serial_no: string }
}

export default function Notifications() {
  const [result, setResult] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<string | null>(null)

  const [customerSearch, setCustomerSearch] = useState<Record<string, string>>({})
  const [customerResults, setCustomerResults] = useState<Record<string, Customer[]>>({})
  const [customerLoading, setCustomerLoading] = useState<Record<string, boolean>>({})
  const [selectedCustomer, setSelectedCustomer] = useState<Record<string, Customer | null>>({})

  const [invoices, setInvoices] = useState<Record<string, Invoice[]>>({})
  const [invoicesLoading, setInvoicesLoading] = useState<Record<string, boolean>>({})
  const [selectedInvoice, setSelectedInvoice] = useState<Record<string, Invoice | null>>({})

  const [flaggedReadings, setFlaggedReadings] = useState<Reading[]>([])
  const [flaggedLoading, setFlaggedLoading] = useState(false)
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null)

  useEffect(() => {
    const load = async () => {
      setFlaggedLoading(true)
      try {
        const res = await api.get('/readings/flagged')
        setFlaggedReadings(res.data.data)
      } catch { }
      finally { setFlaggedLoading(false) }
    }
    load()
  }, [])

  const searchCustomers = async (section: string, query: string) => {
    setCustomerSearch(prev => ({ ...prev, [section]: query }))
    setSelectedCustomer(prev => ({ ...prev, [section]: null }))
    setSelectedInvoice(prev => ({ ...prev, [section]: null }))
    setInvoices(prev => ({ ...prev, [section]: [] }))
    if (query.length < 2) { setCustomerResults(prev => ({ ...prev, [section]: [] })); return }
    setCustomerLoading(prev => ({ ...prev, [section]: true }))
    try {
      const res = await api.get(`/customers/search?q=${query}`)
      setCustomerResults(prev => ({ ...prev, [section]: res.data.data }))
    } catch {
      setCustomerResults(prev => ({ ...prev, [section]: [] }))
    } finally {
      setCustomerLoading(prev => ({ ...prev, [section]: false }))
    }
  }

  const selectCustomer = async (section: string, customer: Customer) => {
    setSelectedCustomer(prev => ({ ...prev, [section]: customer }))
    setCustomerSearch(prev => ({ ...prev, [section]: customer.full_name }))
    setCustomerResults(prev => ({ ...prev, [section]: [] }))
    setSelectedInvoice(prev => ({ ...prev, [section]: null }))
    setInvoicesLoading(prev => ({ ...prev, [section]: true }))
    try {
      const res = await api.get(`/invoices/customer/${customer.id}`)
      const all = res.data.data
      const filtered = section === 'overdue'
        ? all.filter((inv: Invoice) => ['unpaid', 'overdue'].includes(inv.status))
        : all
      setInvoices(prev => ({ ...prev, [section]: filtered }))
    } catch {
      setInvoices(prev => ({ ...prev, [section]: [] }))
    } finally {
      setInvoicesLoading(prev => ({ ...prev, [section]: false }))
    }
  }

  const send = async (type: string, id: number, endpoint: string) => {
    setLoading(type)
    setResult(prev => ({ ...prev, [type]: '' }))
    try {
      await api.post(`/notifications/${endpoint}/${id}`)
      setResult(prev => ({ ...prev, [type]: 'Sent successfully' }))
    } catch (err: any) {
      setResult(prev => ({ ...prev, [type]: err.response?.data?.message || 'Failed to send' }))
    } finally {
      setLoading(null)
    }
  }

  const CustomerSearch = ({ section }: { section: string }) => (
    <div>
      <Text size="sm" fw={500} className="text-text-500 mb-1">Search Customer</Text>
      <input type="text" placeholder="Type name, phone or account no..."
        value={customerSearch[section] || ''}
        onChange={e => searchCustomers(section, e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
      />
      {customerLoading[section] && <Text size="xs" className="text-text-300 mt-1">Searching...</Text>}
      {(customerResults[section] || []).length > 0 && (
        <div className="border border-gray-100 rounded-lg mt-1 overflow-hidden shadow-sm">
          {(customerResults[section] || []).map(c => (
            <button key={c.id} onClick={() => selectCustomer(section, c)}
              className="w-full text-left px-3 py-2.5 hover:bg-primary-50 border-b border-gray-50 last:border-0 transition-colors">
              <Text size="sm" fw={500} className="text-text-600">{c.full_name}</Text>
              <Text size="xs" className="text-text-300">{c.account_no} · {c.phone}</Text>
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const InvoiceSelect = ({ section }: { section: string }) => {
    if (!selectedCustomer[section]) return null
    return (
      <div>
        <Text size="sm" fw={500} className="text-text-500 mb-2">Select Invoice</Text>
        {invoicesLoading[section] ? <Skeleton height={60} radius="md" /> :
          (invoices[section] || []).length === 0 ? (
            <Alert color="blue" radius="md" variant="light">No invoices found</Alert>
          ) : (
            <Stack gap="xs">
              {(invoices[section] || []).map(inv => (
                <button key={inv.id}
                  onClick={() => setSelectedInvoice(prev => ({ ...prev, [section]: inv }))}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${selectedInvoice[section]?.id === inv.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}>
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
                        color={inv.status === 'overdue' ? 'red' : inv.status === 'paid' ? 'green' : 'yellow'}>
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
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title order={3} className="text-text-700 font-bold">Notifications</Title>
        <Text size="sm" className="text-text-300 mt-1">Send Telegram and email notifications</Text>
      </div>

      <Tabs defaultValue="invoice" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="invoice">Invoice</Tabs.Tab>
          <Tabs.Tab value="payment">Payment</Tabs.Tab>
          <Tabs.Tab value="overdue">Overdue</Tabs.Tab>
          <Tabs.Tab value="flagged">Flagged Reading</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="invoice">
          <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <Text fw={600} size="sm" className="text-text-600 mb-1">Invoice Notification</Text>
            <Text size="xs" className="text-text-300 mb-4">Send invoice details via Telegram and email</Text>
            {result['invoice'] && (
              <Alert color={result['invoice'].includes('success') ? 'green' : 'red'}
                radius="md" variant="light" mb="md">{result['invoice']}</Alert>
            )}
            <Stack gap="md">
              <CustomerSearch section="invoice" />
              <InvoiceSelect section="invoice" />
              {selectedInvoice['invoice'] && (
                <Button radius="md" loading={loading === 'invoice'}
                  onClick={() => send('invoice', selectedInvoice['invoice']!.id, 'invoice')}
                  className="bg-primary-500 hover:bg-primary-600">
                  Send Invoice Notification
                </Button>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="payment">
          <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
            <div className="w-10 h-10 rounded-xl bg-secondary-300 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <Text fw={600} size="sm" className="text-text-600 mb-1">Payment Confirmation</Text>
            <Text size="xs" className="text-text-300 mb-4">Send payment confirmation to customer</Text>
            {result['payment'] && (
              <Alert color={result['payment'].includes('success') ? 'green' : 'red'}
                radius="md" variant="light" mb="md">{result['payment']}</Alert>
            )}
            <Stack gap="md">
              <CustomerSearch section="payment" />
              {selectedCustomer['payment'] && (
                <PaymentSelect
                  customerId={selectedCustomer['payment'].id}
                  onSend={(id) => send('payment', id, 'payment')}
                  loading={loading === 'payment'}
                />
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="overdue">
          <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
            <div className="w-10 h-10 rounded-xl bg-accent-600 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <Text fw={600} size="sm" className="text-text-600 mb-1">Overdue Reminder</Text>
            <Text size="xs" className="text-text-300 mb-4">Send overdue invoice reminder to customer</Text>
            {result['overdue'] && (
              <Alert color={result['overdue'].includes('success') ? 'green' : 'red'}
                radius="md" variant="light" mb="md">{result['overdue']}</Alert>
            )}
            <Stack gap="md">
              <CustomerSearch section="overdue" />
              <InvoiceSelect section="overdue" />
              {selectedInvoice['overdue'] && (
                <Button radius="md" loading={loading === 'overdue'}
                  onClick={() => send('overdue', selectedInvoice['overdue']!.id, 'overdue')}
                  className="bg-accent-600 hover:bg-accent-700 text-white">
                  Send Overdue Reminder
                </Button>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="flagged">
          <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
            <div className="w-10 h-10 rounded-xl bg-red-400 flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <Text fw={600} size="sm" className="text-text-600 mb-1">Flagged Reading Alert</Text>
            <Text size="xs" className="text-text-300 mb-4">Alert all admins about a flagged reading</Text>
            {result['flagged'] && (
              <Alert color={result['flagged'].includes('success') ? 'green' : 'red'}
                radius="md" variant="light" mb="md">{result['flagged']}</Alert>
            )}
            <Stack gap="md">
              <Text size="sm" fw={500} className="text-text-500">Select Flagged Reading</Text>
              {flaggedLoading ? <Skeleton height={60} radius="md" /> :
                flaggedReadings.length === 0 ? (
                  <Alert color="green" radius="md" variant="light">No flagged readings at the moment</Alert>
                ) : (
                  <Stack gap="xs">
                    {flaggedReadings.map(r => (
                      <button key={r.id} onClick={() => setSelectedReading(r)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${selectedReading?.id === r.id
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <Text size="sm" fw={600} className="text-text-600">{r.meters?.serial_no}</Text>
                            <Text size="xs" className="text-text-300">{r.reading_date}</Text>
                          </div>
                          <Badge size="xs" radius="sm" variant="light" color="red">
                            {r.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </Stack>
                )}
              {selectedReading && (
                <Button radius="md" loading={loading === 'flagged'}
                  onClick={() => send('flagged', selectedReading.id, 'flagged')}
                  className="bg-red-400 hover:bg-red-500 text-white">
                  Alert Admins
                </Button>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}

function PaymentSelect({ customerId, onSend, loading }: {
  customerId: number
  onSend: (id: number) => void
  loading: boolean
}) {
  const [payments, setPayments] = useState<any[]>([])
  const [fetching, setFetching] = useState(false)
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      setFetching(true)
      try {
        const res = await api.get(`/payments/customer/${customerId}`)
        setPayments(res.data.data)
      } catch { }
      finally { setFetching(false) }
    }
    load()
  }, [customerId])

  if (fetching) return <Skeleton height={60} radius="md" />
  if (payments.length === 0) return (
    <Alert color="blue" radius="md" variant="light">No payments found</Alert>
  )

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500} className="text-text-500">Select Payment</Text>
      {payments.map(p => (
        <button key={p.id} onClick={() => setSelected(p)}
          className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${selected?.id === p.id
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}>
          <div className="flex justify-between items-center">
            <div>
              <Text size="sm" fw={600} className="text-text-600">{p.invoices?.invoice_no}</Text>
              <Text size="xs" className="text-text-300">
                {new Date(p.payment_date).toLocaleDateString()} · {p.method}
              </Text>
            </div>
            <div className="text-right">
              <Text size="sm" fw={700} className="text-primary-600">
                KES {Number(p.amount).toLocaleString()}
              </Text>
              <Badge size="xs" radius="sm" variant="light"
                color={p.status === 'completed' ? 'green' : 'yellow'}>
                {p.status}
              </Badge>
            </div>
          </div>
        </button>
      ))}
      {selected && (
        <Button radius="md" loading={loading}
          onClick={() => onSend(selected.id)}
          className="bg-primary-500 hover:bg-primary-600">
          Send Payment Confirmation
        </Button>
      )}
    </Stack>
  )
}
