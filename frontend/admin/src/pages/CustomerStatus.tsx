import { useEffect, useState } from 'react'
import {
  Title, Text, Badge, Stack, Alert, Skeleton, Tabs
} from '@mantine/core'
// import { useMediaQuery } from '@mantine/hooks'
import api from '../utils/api'

interface Customer {
  id: number
  full_name: string
  phone: string | number
  account_no: string
  customer_type: string
  is_active: boolean
}

interface Invoice {
  id: number
  invoice_no: string
  total_amount: number
  amount_due: number
  status: string
  due_date: string
  customer_id: number
}

interface CustomerWithStatus {
  customer: Customer
  invoices: Invoice[]
  totalOwed: number
  overdueCount: number
  unpaidCount: number
  oldestDueDate: string | null
  status: 'clean' | 'unpaid' | 'overdue'
}

// group by oldest due date month
function groupByMonth(items: CustomerWithStatus[]): { label: string; items: CustomerWithStatus[] }[] {
  const clean = items.filter(i => i.status === 'clean')
  const withDue = items.filter(i => i.status !== 'clean')

  const map = new Map<string, CustomerWithStatus[]>()

  withDue.forEach(item => {
    const raw = item.oldestDueDate
    if (!raw) return
    const d = new Date(raw)
    const label = d.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(item)
  })

  const groups = Array.from(map.entries()).map(([label, items]) => ({ label, items }))

  // add clean customers at the end
  if (clean.length > 0) groups.push({ label: 'All Clear', items: clean })

  return groups
}

const daysOverdue = (dueDate: string) => {
  const due = new Date(dueDate)
  const today = new Date()
  const diff = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export default function CustomerStatus() {
//   const isMobile = useMediaQuery('(max-width: 768px)')

  const [allCustomers, setAllCustomers] = useState<CustomerWithStatus[]>([])
  const [filtered, setFiltered] = useState<CustomerWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('defaulters')

  useEffect(() => {
    const load = async () => {
      try {
        const [custRes, invRes] = await Promise.all([
          api.get('/customers'),
          api.get('/invoices')
        ])

        const customers: Customer[] = custRes.data.data.filter((c: Customer) => c.is_active)
        const invoices: Invoice[] = invRes.data.data

        const result: CustomerWithStatus[] = customers.map(customer => {
          const custInvoices = invoices.filter(inv => inv.customer_id === customer.id)
          const unpaidInvoices = custInvoices.filter(inv =>
            ['unpaid', 'overdue'].includes(inv.status)
          )
          const overdueInvoices = custInvoices.filter(inv => inv.status === 'overdue')

          const totalOwed = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)

          // find oldest unpaid due date
          const dueDates = unpaidInvoices
            .map(inv => inv.due_date)
            .filter(Boolean)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

          const oldestDueDate = dueDates[0] || null

          let status: 'clean' | 'unpaid' | 'overdue' = 'clean'
          if (overdueInvoices.length > 0) status = 'overdue'
          else if (unpaidInvoices.length > 0) status = 'unpaid'

          return {
            customer,
            invoices: unpaidInvoices,
            totalOwed,
            overdueCount: overdueInvoices.length,
            unpaidCount: unpaidInvoices.length,
            oldestDueDate,
            status
          }
        })

        // sort: overdue first, then unpaid, then clean; within each group by oldest due date
        result.sort((a, b) => {
          const order = { overdue: 0, unpaid: 1, clean: 2 }
          if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
          if (a.oldestDueDate && b.oldestDueDate) {
            return new Date(a.oldestDueDate).getTime() - new Date(b.oldestDueDate).getTime()
          }
          return 0
        })

        setAllCustomers(result)
        setFiltered(result)
      } catch {
        setError('Failed to load customer status')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let data = [...allCustomers]
    if (search) {
      const q = search.toLowerCase().trim()
      const qDigits = search.replace(/\D/g, '')
      data = data.filter(item => {
        const nameMatch = item.customer.full_name.toLowerCase().includes(q)
        const accountMatch = item.customer.account_no.toLowerCase().includes(q)
        const phoneMatch = qDigits.length > 0
          ? String(item.customer.phone).replace(/\D/g, '').includes(qDigits)
          : false
        return nameMatch || accountMatch || phoneMatch
      })
    }
    setFiltered(data)
  }, [search, allCustomers])

  const defaulters = filtered.filter(i => i.status !== 'clean')
  const cleanCustomers = filtered.filter(i => i.status === 'clean')
  const totalOwed = defaulters.reduce((sum, i) => sum + i.totalOwed, 0)

  // ── Status badge ──
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'overdue') return (
      <Badge size="sm" radius="sm" variant="filled" color="red">Overdue</Badge>
    )
    if (status === 'unpaid') return (
      <Badge size="sm" radius="sm" variant="light" color="yellow">Unpaid</Badge>
    )
    return <Badge size="sm" radius="sm" variant="light" color="green">Clean</Badge>
  }

  // ── Single customer card ──
  const CustomerCard = ({ item }: { item: CustomerWithStatus }) => {
    const days = item.oldestDueDate ? daysOverdue(item.oldestDueDate) : 0
    const isClean = item.status === 'clean'

    return (
      <div className={`bg-white rounded-2xl shadow-sm overflow-hidden border-l-4 ${
        item.status === 'overdue' ? 'border-l-red-400' :
        item.status === 'unpaid' ? 'border-l-yellow-400' :
        'border-l-green-400'
      }`}>
        <div className="flex items-start justify-between px-4 py-3">
          <div className="min-w-0 mr-3">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <Text fw={700} size="sm" className="text-text-700">
                {item.customer.full_name}
              </Text>
              <StatusBadge status={item.status} />
            </div>
            <Text size="xs" className="text-text-300">{item.customer.account_no}</Text>
            <Text size="xs" className="text-text-400 mt-0.5">{String(item.customer.phone)}</Text>
            <Badge size="xs" radius="sm" variant="light" mt={4}
              color={item.customer.customer_type === 'commercial' ? 'blue' : 'teal'}>
              {item.customer.customer_type}
            </Badge>
          </div>

          {!isClean ? (
            <div className="text-right flex-shrink-0">
              <Text fw={700} size="sm" className="text-red-500">
                KES {item.totalOwed.toLocaleString()}
              </Text>
              <Text size="xs" className="text-text-300 mt-0.5">
                {item.unpaidCount} invoice{item.unpaidCount !== 1 ? 's' : ''}
              </Text>
              {item.oldestDueDate && (
                <Text size="xs" className={`mt-0.5 font-medium ${
                  days > 30 ? 'text-red-500' : days > 0 ? 'text-orange-400' : 'text-text-300'
                }`}>
                  {days > 0 ? `${days}d overdue` : 'Due soon'}
                </Text>
              )}
            </div>
          ) : (
            <div className="text-right flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                  stroke="#22c55e" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* unpaid invoices breakdown */}
        {!isClean && item.invoices.length > 0 && (
          <div className="border-t border-gray-50 px-4 py-2.5">
            <Stack gap={4}>
              {item.invoices.map(inv => (
                <div key={inv.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      inv.status === 'overdue' ? 'bg-red-400' : 'bg-yellow-400'
                    }`} />
                    <Text size="xs" className="text-text-400">{inv.invoice_no}</Text>
                    <Text size="xs" className="text-text-200">· Due {inv.due_date}</Text>
                  </div>
                  <Text size="xs" fw={600} className="text-text-500">
                    KES {Number(inv.total_amount).toLocaleString()}
                  </Text>
                </div>
              ))}
            </Stack>
          </div>
        )}

        {/* action hint for field staff */}
        {item.status === 'overdue' && days > 30 && (
          <div className="bg-red-50 px-4 py-2 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="#ef4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <Text size="xs" className="text-red-500 font-medium">
              Consider meter disconnection — {days} days overdue
            </Text>
          </div>
        )}
      </div>
    )
  }

  // ── Grouped defaulters ──
  const GroupedDefaulters = () => {
    const groups = groupByMonth(defaulters)
    if (defaulters.length === 0) return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="#22c55e" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <Text fw={600} className="text-text-600 mb-1">All Customers are Up to Date</Text>
        <Text size="sm" className="text-text-300">No outstanding balances found</Text>
      </div>
    )

    return (
      <Stack gap="xs">
        {groups.filter(g => g.label !== 'All Clear').map(group => (
          <div key={group.label}>
            {/* month divider */}
            <div className="flex items-center gap-3 mt-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <Text size="xs" fw={700} className="text-text-400 uppercase tracking-widest">
                  Due {group.label}
                </Text>
              </div>
              <div className="flex-1 h-px bg-gray-100" />
              <Text size="xs" className="text-text-200">
                {group.items.length} customer{group.items.length !== 1 ? 's' : ''}
              </Text>
            </div>
            <Stack gap="sm">
              {group.items.map(item => (
                <CustomerCard key={item.customer.id} item={item} />
              ))}
            </Stack>
          </div>
        ))}
      </Stack>
    )
  }

  // ── Clean customers ──
  const CleanCustomers = () => {
    if (cleanCustomers.length === 0) return (
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
        <Text size="sm" className="text-text-300">No customers found</Text>
      </div>
    )

    return (
      <Stack gap="sm">
        {cleanCustomers.map(item => (
          <CustomerCard key={item.customer.id} item={item} />
        ))}
      </Stack>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* header */}
      <div className="mb-5">
        <Title order={3} className="text-text-700 font-bold text-lg md:text-xl">
          Customer Status
        </Title>
        <Text size="sm" className="text-text-300 mt-0.5">
          Payment status for all active customers
        </Text>
      </div>

      {/* summary stats */}
      {!loading && !error && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <Text fw={700} size="xl" className="text-red-500 leading-tight">
              {defaulters.filter(i => i.status === 'overdue').length}
            </Text>
            <Text size="xs" className="text-text-300 mt-0.5">Overdue</Text>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <Text fw={700} size="xl" className="text-yellow-500 leading-tight">
              {defaulters.filter(i => i.status === 'unpaid').length}
            </Text>
            <Text size="xs" className="text-text-300 mt-0.5">Unpaid</Text>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <Text fw={700} size="xl" className="text-secondary-400 leading-tight">
              {cleanCustomers.length}
            </Text>
            <Text size="xs" className="text-text-300 mt-0.5">Clean</Text>
          </div>
        </div>
      )}

      {/* total outstanding */}
      {!loading && totalOwed > 0 && (
        <div className="bg-red-50 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
          <Text size="sm" className="text-red-600 font-medium">Total Outstanding</Text>
          <Text fw={700} size="sm" className="text-red-600">
            KES {totalOwed.toLocaleString()}
          </Text>
        </div>
      )}

      {/* search */}
      <div className="mb-4">
        <input type="text" placeholder="Search customer name, phone or account..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-text-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>

      {loading ? (
        <Stack gap="sm">
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={100} radius="lg" />)}
        </Stack>
      ) : error ? (
        <Alert color="red" radius="md" variant="light">{error}</Alert>
      ) : (
        <Tabs value={activeTab} onChange={val => setActiveTab(val || 'defaulters')} radius="md">
          <Tabs.List mb="md">
            <Tabs.Tab value="defaulters">
              <div className="flex items-center gap-2">
                Defaulters
                {defaulters.length > 0 && (
                  <Badge size="xs" color="red" variant="filled" radius="xl">
                    {defaulters.length}
                  </Badge>
                )}
              </div>
            </Tabs.Tab>
            <Tabs.Tab value="clean">
              <div className="flex items-center gap-2">
                Clean
                {cleanCustomers.length > 0 && (
                  <Badge size="xs" color="green" variant="filled" radius="xl">
                    {cleanCustomers.length}
                  </Badge>
                )}
              </div>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="defaulters">
            <GroupedDefaulters />
          </Tabs.Panel>

          <Tabs.Panel value="clean">
            <CleanCustomers />
          </Tabs.Panel>
        </Tabs>
      )}
    </div>
  )
}
