

import { useEffect, useState } from 'react'
import { Paper, Title, Text, Button, Badge, Alert, Skeleton, Tabs, Table, Group } from '@mantine/core'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import api from '../utils/api'

// Define interfaces for the data structures
interface Payment {
  id: number
  payment_date: string
  amount: number
  method: string
  customers: {
    full_name: string
  }
}

interface RevenueReport {
  total_collected: number
  total_transactions: number
  by_method: {
    mpesa: number
    bank_transfer: number
    cash: number
  }
  payments: Payment[]
}

interface ConsumptionReport {
  total_units_consumed: number
  by_type: {
    domestic: {
      units: number
      count: number
    }
    commercial: {
      units: number
      count: number
    }
  }
}

interface DefaulterInvoice {
  id: number
  invoice_no: string
  total_amount: number
  due_date: string
  status: string
  customers: {
    full_name: string
    account_no: string
  }
}

interface DefaultersReport {
  total_defaulters: number
  total_outstanding: number
  invoices: DefaulterInvoice[]
}

interface FlaggedReading {
  id: number
  reading_date: string
  manual_value: number
  ocr_value: number | null
  status: string
  meters: {
    serial_no: string
    customers: {
      full_name: string
    }
  }
}

interface FlaggedReport {
  total_flagged: number
  by_status: Record<string, number>
  readings: FlaggedReading[]
}

// Props for the PieChart label
// interface PieLabelProps {
//   name: string
//   value: number
// }

const COLORS = ['#71b4c8', '#4da87a', '#e8a838', '#e05252']

export default function Reports() {
  const [from, setFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])
  const [revenue, setRevenue] = useState<RevenueReport | null>(null)
  const [consumption, setConsumption] = useState<ConsumptionReport | null>(null)
  const [defaulters, setDefaulters] = useState<DefaultersReport | null>(null)
  const [flaggedReport, setFlaggedReport] = useState<FlaggedReport | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const fetchRevenue = async () => {
    setLoading('revenue')
    setError('')
    try {
      const res = await api.get(`/reports/revenue?from=${from}&to=${to}`)
      setRevenue(res.data.data)
    } catch { setError('Failed to load revenue report') }
    finally { setLoading(null) }
  }

  const fetchConsumption = async () => {
    setLoading('consumption')
    setError('')
    try {
      const res = await api.get(`/reports/consumption?from=${from}&to=${to}`)
      setConsumption(res.data.data)
    } catch { setError('Failed to load consumption report') }
    finally { setLoading(null) }
  }

  const fetchDefaulters = async () => {
    setLoading('defaulters')
    setError('')
    try {
      const res = await api.get('/reports/defaulters')
      setDefaulters(res.data.data)
    } catch { setError('Failed to load defaulters report') }
    finally { setLoading(null) }
  }

  const fetchFlagged = async () => {
    setLoading('flagged')
    setError('')
    try {
      const res = await api.get('/reports/flagged')
      setFlaggedReport(res.data.data)
    } catch { setError('Failed to load flagged report') }
    finally { setLoading(null) }
  }

  useEffect(() => {
    fetchRevenue()
    fetchConsumption()
    fetchDefaulters()
    fetchFlagged()
  }, [])

  const DateRange = () => (
    <Paper shadow="xs" radius="lg" p="md" className="bg-white mb-4">
      <Group gap="md" wrap="wrap">
        <div>
          <label className="block text-xs text-text-300 mb-1">From</label>
          <input 
            type="date" 
            value={from} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFrom(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300" 
          />
        </div>
        <div>
          <label className="block text-xs text-text-300 mb-1">To</label>
          <input 
            type="date" 
            value={to} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300" 
          />
        </div>
        <div className="flex items-end gap-2">
          <Button size="sm" radius="md" onClick={() => { fetchRevenue(); fetchConsumption() }}
            className="bg-primary-500 hover:bg-primary-600">
            Apply
          </Button>
        </div>
      </Group>
    </Paper>
  )

  // Custom formatter for tooltip
  const formatCurrency = (value: any) => {
    return `KES ${Number(value).toLocaleString()}`
  }

  // Custom label for pie chart
//   const renderPieLabel = ({ name, value }: PieLabelProps) => {
//     return `${name}: ${value} m³`
//   }

const renderPieLabel = ({ name, value }: { name?: string; value?: number }) => {
  return `${name ?? ''}: ${value ?? 0} m³`
}

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title order={3} className="text-text-700 font-bold">Reports</Title>
        <Text size="sm" className="text-text-300 mt-1">Operational analytics and summaries</Text>
      </div>

      {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

      <Tabs defaultValue="revenue" radius="md">
        <Tabs.List mb="md">
          <Tabs.Tab value="revenue">Revenue</Tabs.Tab>
          <Tabs.Tab value="consumption">Consumption</Tabs.Tab>
          <Tabs.Tab value="defaulters">Defaulters</Tabs.Tab>
          <Tabs.Tab value="flagged">Flagged</Tabs.Tab>
        </Tabs.List>

        {/* Revenue */}
        <Tabs.Panel value="revenue">
          <DateRange />
          {loading === 'revenue' ? <Skeleton height={200} radius="lg" /> : revenue && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
                  <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Total Collected</Text>
                  <Text size="xl" fw={700} className="text-text-700">
                    KES {Number(revenue.total_collected).toLocaleString()}
                  </Text>
                </Paper>
                <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
                  <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Transactions</Text>
                  <Text size="xl" fw={700} className="text-text-700">{revenue.total_transactions}</Text>
                </Paper>
                <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
                  <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">M-Pesa</Text>
                  <Text size="xl" fw={700} className="text-text-700">
                    KES {Number(revenue.by_method?.mpesa || 0).toLocaleString()}
                  </Text>
                </Paper>
              </div>
              <Paper shadow="xs" radius="lg" p="lg" className="bg-white mb-4">
                <Text size="sm" fw={600} className="text-text-600 mb-4">Revenue by Method</Text>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'M-Pesa', amount: revenue.by_method?.mpesa || 0 },
                    { name: 'Bank', amount: revenue.by_method?.bank_transfer || 0 },
                    { name: 'Cash', amount: revenue.by_method?.cash || 0 },
                  ]}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={formatCurrency} />
                    <Bar dataKey="amount" fill="#71b4c8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
              <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <Text size="sm" fw={600} className="text-text-600">Payment Transactions</Text>
                </div>
                <div className="table-responsive">
                  <Table striped verticalSpacing="sm" horizontalSpacing="md">
                    <Table.Thead>
                      <Table.Tr className="bg-gray-50">
                        <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">Customer</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">Amount</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">Method</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {revenue.payments?.slice(0, 10).map((p: Payment) => (
                        <Table.Tr key={p.id}>
                          <Table.Td className="text-text-400 text-sm">
                            {new Date(p.payment_date).toLocaleDateString()}
                          </Table.Td>
                          <Table.Td className="text-text-500 text-sm">{p.customers?.full_name}</Table.Td>
                          <Table.Td className="text-text-600 font-semibold text-sm">
                            KES {Number(p.amount).toLocaleString()}
                          </Table.Td>
                          <Table.Td>
                            <Badge size="sm" radius="sm" variant="light" color="teal">
                              {p.method}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </Paper>
            </>
          )}
        </Tabs.Panel>

        {/* Consumption */}
        <Tabs.Panel value="consumption">
          <DateRange />
          {loading === 'consumption' ? <Skeleton height={200} radius="lg" /> : consumption && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
                  <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Total Units</Text>
                  <Text size="xl" fw={700} className="text-text-700">
                    {consumption.total_units_consumed} m³
                  </Text>
                </Paper>
                <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
                  <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Domestic</Text>
                  <Text size="xl" fw={700} className="text-text-700">
                    {consumption.by_type?.domestic?.units || 0} m³
                  </Text>
                </Paper>
                <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
                  <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Commercial</Text>
                  <Text size="xl" fw={700} className="text-text-700">
                    {consumption.by_type?.commercial?.units || 0} m³
                  </Text>
                </Paper>
              </div>
              <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
                <Text size="sm" fw={600} className="text-text-600 mb-4">Domestic vs Commercial</Text>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Domestic', value: consumption.by_type?.domestic?.units || 0 },
                        { name: 'Commercial', value: consumption.by_type?.commercial?.units || 0 },
                      ]}
                      cx="50%" 
                      cy="50%" 
                      outerRadius={80} 
                      dataKey="value"
                      label={renderPieLabel}
                    >
                      {[0, 1].map((i: number) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </>
          )}
        </Tabs.Panel>

        {/* Defaulters */}
        <Tabs.Panel value="defaulters">
          <div className="flex justify-end mb-4">
            <Button size="sm" radius="md" onClick={fetchDefaulters}
              loading={loading === 'defaulters'} variant="outline"
              className="border-primary-500 text-primary-600">
              Refresh
            </Button>
          </div>
          {loading === 'defaulters' ? <Skeleton height={200} radius="lg" /> : defaulters && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
                  <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Total Defaulters</Text>
                  <Text size="xl" fw={700} className="text-red-500">{defaulters.total_defaulters}</Text>
                </Paper>
                <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
                  <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">Outstanding Amount</Text>
                  <Text size="xl" fw={700} className="text-red-500">
                    KES {Number(defaulters.total_outstanding).toLocaleString()}
                  </Text>
                </Paper>
              </div>
              <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
                <div className="table-responsive">
                  <Table striped verticalSpacing="sm" horizontalSpacing="md">
                    <Table.Thead>
                      <Table.Tr className="bg-gray-50">
                        <Table.Th className="text-text-400 text-xs uppercase">Customer</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">Invoice No</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">Amount</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">Due Date</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {defaulters.invoices?.map((inv: DefaulterInvoice) => (
                        <Table.Tr key={inv.id}>
                          <Table.Td>
                            <Text size="sm" className="text-text-500">{inv.customers?.full_name}</Text>
                            <Text size="xs" className="text-text-300">{inv.customers?.account_no}</Text>
                          </Table.Td>
                          <Table.Td className="text-text-400 text-sm">{inv.invoice_no}</Table.Td>
                          <Table.Td className="text-text-600 font-semibold text-sm">
                            KES {Number(inv.total_amount).toLocaleString()}
                          </Table.Td>
                          <Table.Td className="text-red-500 text-sm">{inv.due_date}</Table.Td>
                          <Table.Td>
                            <Badge size="sm" radius="sm" variant="light" color="red">{inv.status}</Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </Paper>
            </>
          )}
        </Tabs.Panel>

        {/* Flagged */}
        <Tabs.Panel value="flagged">
          <div className="flex justify-end mb-4">
            <Button size="sm" radius="md" onClick={fetchFlagged}
              loading={loading === 'flagged'} variant="outline"
              className="border-primary-500 text-primary-600">
              Refresh
            </Button>
          </div>
          {loading === 'flagged' ? <Skeleton height={200} radius="lg" /> : flaggedReport && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {Object.entries(flaggedReport.by_status || {}).map(([key, val]: [string, number]) => (
                  <Paper key={key} shadow="xs" radius="lg" p="lg" className="bg-white">
                    <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">
                      {key.replace(/_/g, ' ')}
                    </Text>
                    <Text size="xl" fw={700} className="text-text-700">{val}</Text>
                  </Paper>
                ))}
              </div>
              <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
                <div className="table-responsive">
                  <Table striped verticalSpacing="sm" horizontalSpacing="md">
                    <Table.Thead>
                      <Table.Tr className="bg-gray-50">
                        <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">Meter</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">Customer</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">Manual</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">OCR</Table.Th>
                        <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {flaggedReport.readings?.map((r: FlaggedReading) => (
                        <Table.Tr key={r.id}>
                          <Table.Td className="text-text-400 text-sm">{r.reading_date}</Table.Td>
                          <Table.Td className="text-text-600 font-semibold text-sm">{r.meters?.serial_no}</Table.Td>
                          <Table.Td className="text-text-500 text-sm">{r.meters?.customers?.full_name}</Table.Td>
                          <Table.Td className="text-text-400 text-sm">{r.manual_value}</Table.Td>
                          <Table.Td className="text-red-500 text-sm">{r.ocr_value ?? '—'}</Table.Td>
                          <Table.Td>
                            <Badge size="sm" radius="sm" variant="light" color="orange">
                              {r.status.replace(/_/g, ' ')}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </div>
              </Paper>
            </>
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}