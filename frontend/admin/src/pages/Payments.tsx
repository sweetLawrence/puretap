import { useEffect, useState } from 'react'
import {
  Paper, Title, Text, Select, Button, Badge, Modal,
  Table, Stack, Alert, Skeleton
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import api from '../utils/api'

interface Customer {
  id: number
  full_name: string
  phone: string
  account_no: string
  credit_balance?: number
}

interface Invoice {
  id: number
  invoice_no: string
  total_amount: number
  amount_paid?: number
  remaining_balance?: number
  status: string
  due_date: string
  is_partial?: boolean
  percent_paid?: number  // ADD THIS PROPERTY
}

interface Payment {
  id: number
  invoice_id: number
  customer_id: number
  amount: number
  method: string
  status: string
  mpesa_ref: string
  mpesa_phone: string
  bank_ref: string
  payment_date: string
  customers: { full_name: string; account_no: string; credit_balance?: number }
  invoices: { invoice_no: string; total_amount: number; amount_paid?: number; remaining_balance?: number; is_partial?: boolean }
}

// Updated status colors - 'successful' instead of 'completed'
const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow', 
  successful: 'green',
  failed: 'red', 
  reversed: 'gray'
}

const METHOD_COLORS: Record<string, string> = {
  mpesa: 'teal', 
  bank_transfer: 'blue', 
  cash: 'violet'
}

// Helper function to format status display
const getStatusDisplay = (status: string) => {
  if (status === 'successful') return 'Successful'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function Payments() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  const [payments, setPayments] = useState<Payment[]>([])
  const [filtered, setFiltered] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [methodFilter, setMethodFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  // mpesa modal
  const [mpesaModal, setMpesaModal] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [payMode, setPayMode] = useState<'full' | 'partial'>('full')
  const [partialAmount, setPartialAmount] = useState('')
  const [paymentPhone, setPaymentPhone] = useState('')
  const [mpesaSending, setMpesaSending] = useState(false)
  const [mpesaError, setMpesaError] = useState('')
  const [mpesaSuccess, setMpesaSuccess] = useState(false)

  // manual modal
  const [manualModal, setManualModal] = useState(false)
  const [manualCustomerSearch, setManualCustomerSearch] = useState('')
  const [manualCustomers, setManualCustomers] = useState<Customer[]>([])
  const [manualCustomerLoading, setManualCustomerLoading] = useState(false)
  const [manualSelectedCustomer, setManualSelectedCustomer] = useState<Customer | null>(null)
  const [manualInvoices, setManualInvoices] = useState<Invoice[]>([])
  const [manualInvoicesLoading, setManualInvoicesLoading] = useState(false)
  const [manualSelectedInvoice, setManualSelectedInvoice] = useState<Invoice | null>(null)
  const [manualPayMode, setManualPayMode] = useState<'full' | 'partial'>('full')
  const [manualPartialAmount, setManualPartialAmount] = useState('')
  const [manualForm, setManualForm] = useState({ amount: '', method: 'cash', bank_ref: '' })
  const [manualSaving, setManualSaving] = useState(false)
  const [manualError, setManualError] = useState('')

  const load = async () => {
    try {
      // Fetch payments
      const payRes = await api.get('/payments')
      const paymentsData = payRes.data.data || []
      
      // Fetch all invoices to calculate proper remaining balances
      const invRes = await api.get('/invoices')
      const invoicesData = invRes.data.data || []
      
      // Create a map of invoice_id -> total paid (only successful payments)
      // Same logic as Invoices component
      const paymentMap = new Map<number, number>()
      paymentsData.forEach((payment: any) => {
        if (payment.status === 'successful') {
          const current = paymentMap.get(payment.invoice_id) || 0
          paymentMap.set(payment.invoice_id, current + Number(payment.amount))
        }
      })
      
      // Create maps for invoice totals and paid amounts
      const invoiceTotalMap = new Map<number, number>()
      const invoiceAmountPaidMap = new Map<number, number>()
      const invoiceStatusMap = new Map<number, string>()
      const invoiceIsPartialMap = new Map<number, boolean>()
      const invoicePercentPaidMap = new Map<number, number>()
      
      invoicesData.forEach((inv: any) => {
        const total = Number(inv.total_amount)
        const totalPaid = paymentMap.get(inv.id) || Number(inv.amount_paid || 0)
        const remaining = total - totalPaid
        const isPartiallyPaid = totalPaid > 0 && remaining > 0
        const percentPaid = total > 0 ? Math.round((totalPaid / total) * 100) : 0
        
        invoiceTotalMap.set(inv.id, total)
        invoiceAmountPaidMap.set(inv.id, totalPaid)
        invoiceStatusMap.set(inv.id, inv.status)
        invoiceIsPartialMap.set(inv.id, isPartiallyPaid)
        invoicePercentPaidMap.set(inv.id, percentPaid)
      })
      
      // Enrich payments with calculated remaining balance and partial status
      const enrichedPayments = paymentsData.map((payment: any) => {
        const invoiceTotal = invoiceTotalMap.get(payment.invoice_id) || 0
        const invoicePaid = invoiceAmountPaidMap.get(payment.invoice_id) || 0
        const calculatedRemaining = invoiceTotal - invoicePaid
        const isPartial = invoiceIsPartialMap.get(payment.invoice_id) || false
        const invoiceStatus = invoiceStatusMap.get(payment.invoice_id) || ''
        const percentPaid = invoicePercentPaidMap.get(payment.invoice_id) || 0
        
        return {
          ...payment,
          invoices: {
            ...payment.invoices,
            total_amount: invoiceTotal,
            amount_paid: invoicePaid,
            remaining_balance: calculatedRemaining > 0 ? calculatedRemaining : 0,
            status: invoiceStatus,
            is_partial: isPartial,
            percent_paid: percentPaid
          }
        }
      })
      
      setPayments(enrichedPayments)
      setFiltered(enrichedPayments)
    } catch (err) {
      console.error('Load error:', err)
      setError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    let data = [...payments]
    if (methodFilter) data = data.filter(p => p.method === methodFilter)
    if (statusFilter) data = data.filter(p => p.status === statusFilter)
    setFiltered(data)
  }, [methodFilter, statusFilter, payments])

  useEffect(() => {
    if (customerSearch.length < 2) { setCustomers([]); return }
    const timeout = setTimeout(async () => {
      setCustomerLoading(true)
      try {
        const res = await api.get(`/customers/search?q=${customerSearch}`)
        setCustomers(res.data.data)
      } catch { setCustomers([]) }
      finally { setCustomerLoading(false) }
    }, 400)
    return () => clearTimeout(timeout)
  }, [customerSearch])

  useEffect(() => {
    if (manualCustomerSearch.length < 2) { setManualCustomers([]); return }
    const timeout = setTimeout(async () => {
      setManualCustomerLoading(true)
      try {
        const res = await api.get(`/customers/search?q=${manualCustomerSearch}`)
        setManualCustomers(res.data.data)
      } catch { setManualCustomers([]) }
      finally { setManualCustomerLoading(false) }
    }, 400)
    return () => clearTimeout(timeout)
  }, [manualCustomerSearch])

  const selectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setPaymentPhone(customer.phone)
    setCustomers([])
    setCustomerSearch(customer.full_name)
    setSelectedInvoice(null)
    setPayMode('full')
    setPartialAmount('')
    setInvoicesLoading(true)
    try {
      const res = await api.get(`/invoices/customer/${customer.id}`)
      
      // Fetch payments to calculate accurate totals (same logic as Invoices component)
      const payRes = await api.get('/payments')
      const allPayments = payRes.data.data || []
      
      const paymentMap = new Map<number, number>()
      allPayments.forEach((payment: any) => {
        if (payment.status === 'successful') {
          const current = paymentMap.get(payment.invoice_id) || 0
          paymentMap.set(payment.invoice_id, current + Number(payment.amount))
        }
      })
      
      const processedInvoices = res.data.data.map((inv: any) => {
        const total = Number(inv.total_amount)
        const paid = paymentMap.get(inv.id) || Number(inv.amount_paid || 0)
        const remaining = total - paid
        const isPartiallyPaid = paid > 0 && remaining > 0 && inv.status !== 'paid'
        const percentPaid = total > 0 ? Math.round((paid / total) * 100) : 0
        
        return {
          ...inv,
          amount_paid: paid,
          remaining_balance: remaining > 0 ? remaining : 0,
          is_partial: isPartiallyPaid,
          percent_paid: percentPaid
        }
      }).filter((inv: Invoice) => 
        ['unpaid', 'overdue', 'partial'].includes(inv.status) || (inv.remaining_balance || 0) > 0
      )
      
      setUnpaidInvoices(processedInvoices)
    } catch { setUnpaidInvoices([]) }
    finally { setInvoicesLoading(false) }
  }

  const selectManualCustomer = async (customer: Customer) => {
    setManualSelectedCustomer(customer)
    setManualCustomers([])
    setManualCustomerSearch(customer.full_name)
    setManualSelectedInvoice(null)
    setManualPayMode('full')
    setManualPartialAmount('')
    setManualInvoicesLoading(true)
    try {
      const res = await api.get(`/invoices/customer/${customer.id}`)
      
      // Fetch payments to calculate accurate totals (same logic as Invoices component)
      const payRes = await api.get('/payments')
      const allPayments = payRes.data.data || []
      
      const paymentMap = new Map<number, number>()
      allPayments.forEach((payment: any) => {
        if (payment.status === 'successful') {
          const current = paymentMap.get(payment.invoice_id) || 0
          paymentMap.set(payment.invoice_id, current + Number(payment.amount))
        }
      })
      
      const processedInvoices = res.data.data.map((inv: any) => {
        const total = Number(inv.total_amount)
        const paid = paymentMap.get(inv.id) || Number(inv.amount_paid || 0)
        const remaining = total - paid
        const isPartiallyPaid = paid > 0 && remaining > 0 && inv.status !== 'paid'
        const percentPaid = total > 0 ? Math.round((paid / total) * 100) : 0
        
        return {
          ...inv,
          amount_paid: paid,
          remaining_balance: remaining > 0 ? remaining : 0,
          is_partial: isPartiallyPaid,
          percent_paid: percentPaid
        }
      }).filter((inv: Invoice) => 
        ['unpaid', 'overdue', 'partial'].includes(inv.status) || (inv.remaining_balance || 0) > 0
      )
      
      setManualInvoices(processedInvoices)
    } catch { setManualInvoices([]) }
    finally { setManualInvoicesLoading(false) }
  }

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv)
    const remainingToPay = inv.remaining_balance ?? inv.total_amount
    setPartialAmount(String(remainingToPay))
    setPayMode('full')
    setMpesaError('')
  }

  const handleSelectManualInvoice = (inv: Invoice) => {
    setManualSelectedInvoice(inv)
    const remainingToPay = inv.remaining_balance ?? inv.total_amount
    setManualPartialAmount(String(remainingToPay))
    setManualPayMode('full')
    setManualForm({ ...manualForm, amount: String(remainingToPay) })
    setManualError('')
  }

  const getMpesaPayAmount = () => {
    if (!selectedInvoice) return 0
    if (payMode === 'full') return selectedInvoice.remaining_balance ?? selectedInvoice.total_amount
    return Number(partialAmount) || 0
  }

  const getMpesaMaxPayable = () => {
    if (!selectedInvoice) return 0
    return selectedInvoice.remaining_balance ?? selectedInvoice.total_amount
  }

  const getManualPayAmount = () => {
    if (!manualSelectedInvoice) return 0
    if (manualPayMode === 'full') return manualSelectedInvoice.remaining_balance ?? manualSelectedInvoice.total_amount
    return Number(manualPartialAmount) || 0
  }

  const getManualMaxPayable = () => {
    if (!manualSelectedInvoice) return 0
    return manualSelectedInvoice.remaining_balance ?? manualSelectedInvoice.total_amount
  }

  const handleMpesa = async () => {
    if (!selectedInvoice || !paymentPhone) {
      setMpesaError('Please select an invoice and confirm the phone number')
      return
    }
    const amount = getMpesaPayAmount()
    const maxAmount = getMpesaMaxPayable()
    
    if (amount <= 0) {
      setMpesaError('Please enter a valid amount')
      return
    }
    if (amount > maxAmount) {
      setMpesaError(`Amount cannot exceed remaining balance of KES ${maxAmount.toLocaleString()}`)
      return
    }

    setMpesaSending(true)
    setMpesaError('')
    try {
      await api.post('/payments/mpesa/initiate', {
        invoice_id: selectedInvoice.id,
        phone: String(paymentPhone).trim(),
        amount: amount
      })
      setMpesaSuccess(true)
      load()
    } catch (err: any) {
      setMpesaError(err.response?.data?.message || 'Failed to send STK push')
    } finally {
      setMpesaSending(false)
    }
  }

  const handleManual = async () => {
    if (!manualSelectedInvoice) {
      setManualError('Please select an invoice')
      return
    }
    const amount = getManualPayAmount()
    const maxAmount = getManualMaxPayable()
    
    if (amount <= 0) {
      setManualError('Please enter a valid amount')
      return
    }
    if (amount > maxAmount) {
      setManualError(`Amount cannot exceed remaining balance of KES ${maxAmount.toLocaleString()}`)
      return
    }

    setManualSaving(true)
    setManualError('')
    try {
      await api.post('/payments/manual', {
        invoice_id: manualSelectedInvoice.id,
        amount: amount,
        method: manualForm.method,
        bank_ref: manualForm.bank_ref || undefined
      })
      setManualModal(false)
      resetManualModal()
      load()
    } catch (err: any) {
      setManualError(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setManualSaving(false)
    }
  }

  const resetMpesaModal = () => {
    setCustomerSearch('')
    setCustomers([])
    setSelectedCustomer(null)
    setUnpaidInvoices([])
    setSelectedInvoice(null)
    setPayMode('full')
    setPartialAmount('')
    setPaymentPhone('')
    setMpesaError('')
    setMpesaSuccess(false)
  }

  const resetManualModal = () => {
    setManualCustomerSearch('')
    setManualCustomers([])
    setManualSelectedCustomer(null)
    setManualInvoices([])
    setManualSelectedInvoice(null)
    setManualPayMode('full')
    setManualPartialAmount('')
    setManualForm({ amount: '', method: 'cash', bank_ref: '' })
    setManualError('')
  }

  // Invoice picker with remaining balance display
  const InvoicePicker = ({
    invoices, loadingInvoices, selected, onSelect, customerName
  }: {
    invoices: Invoice[]
    loadingInvoices: boolean
    selected: Invoice | null
    onSelect: (inv: Invoice) => void
    customerName: string
  }) => (
    <div>
      <Text size="sm" fw={500} className="text-text-500 mb-2">
        Unpaid Invoices{customerName ? ` for ${customerName}` : ''}
      </Text>
      {loadingInvoices ? (
        <Skeleton height={60} radius="md" />
      ) : invoices.length === 0 ? (
        <Alert color="blue" radius="md" variant="light">
          No unpaid invoices for this customer
        </Alert>
      ) : (
        <Stack gap="xs">
          {invoices.map(inv => {
            const displayAmount = inv.remaining_balance ?? inv.total_amount
            const amountPaid = inv.amount_paid ?? 0
            const isPartial = inv.is_partial || (amountPaid > 0 && displayAmount > 0)
            
            return (
              <button key={inv.id} onClick={() => onSelect(inv)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                  selected?.id === inv.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Text size="sm" fw={600} className="text-text-600">{inv.invoice_no}</Text>
                    <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
                    {isPartial && (
                      <Text size="xs" className="text-blue-600 mt-1">
                        Paid: KES {amountPaid.toLocaleString()}
                      </Text>
                    )}
                  </div>
                  <div className="text-right">
                    <Text size="sm" fw={700} className="text-primary-600">
                      KES {displayAmount.toLocaleString()}
                    </Text>
                    {isPartial && (
                      <Text size="xs" className="text-text-300 line-through">
                        Total: KES {Number(inv.total_amount).toLocaleString()}
                      </Text>
                    )}
                    <div className="mt-1">
                      {isPartial ? (
                        <Badge size="xs" radius="sm" variant="light" color="blue">
                          Partial ({inv.percent_paid || 0}%)
                        </Badge>
                      ) : (
                        <Badge size="xs" radius="sm" variant="light"
                          color={inv.status === 'overdue' ? 'red' : 'yellow'}>
                          {inv.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </Stack>
      )}
    </div>
  )

  // Desktop Table with payment tracking
  const PaymentsTable = () => (
    <div className="table-responsive">
      <Table striped highlightOnHover verticalSpacing="sm" horizontalSpacing="md">
        <Table.Thead>
          <Table.Tr className="bg-gray-50">
            <Table.Th className="text-text-400 text-xs uppercase">Date</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Customer</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Invoice</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Amount</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Method</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Reference</Table.Th>
            <Table.Th className="text-text-400 text-xs uppercase">Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtered.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={7} className="text-center text-text-300 py-8">
                No payments found
              </Table.Td>
            </Table.Tr>
          ) : filtered.map(p => {
            const remainingBalance = p.invoices?.remaining_balance ?? 0
            const creditBalance = p.customers?.credit_balance ?? 0
            const isPartial = p.invoices?.is_partial ?? false
            
            return (
              <Table.Tr key={p.id}>
                <Table.Td className="text-text-400 text-sm">
                  {new Date(p.payment_date).toLocaleDateString()}
                </Table.Td>
                <Table.Td>
                  <Text size="sm" className="text-text-500">{p.customers?.full_name}</Text>
                  <Text size="xs" className="text-text-300">{p.customers?.account_no}</Text>
                  {creditBalance > 0 && (
                    <Text size="xs" className="text-green-600">Credit: KES {creditBalance.toLocaleString()}</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text size="sm" className="text-text-400">{p.invoices?.invoice_no}</Text>
                  {remainingBalance > 0 && (
                    <Text size="xs" className="text-yellow-600">
                      Remaining: KES {remainingBalance.toLocaleString()}
                    </Text>
                  )}
                  {isPartial && (
                    <Text size="xs" className="text-blue-600">
                      Partial Payment
                    </Text>
                  )}
                </Table.Td>
                <Table.Td className="text-text-600 font-semibold text-sm">
                  KES {Number(p.amount).toLocaleString()}
                </Table.Td>
                <Table.Td>
                  <Badge size="sm" radius="sm" variant="light"
                    color={METHOD_COLORS[p.method] || 'gray'}>
                    {p.method.replace('_', ' ')}
                  </Badge>
                </Table.Td>
                <Table.Td className="text-text-300 text-sm">
                  {p.mpesa_ref || p.bank_ref || '—'}
                </Table.Td>
                <Table.Td>
                  <Badge size="sm" radius="sm" variant="light"
                    color={STATUS_COLORS[p.status] || 'gray'}>
                    {getStatusDisplay(p.status)}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            )
          })}
        </Table.Tbody>
      </Table>
    </div>
  )

  // Mobile Cards with payment tracking
  const PaymentCards = () => (
    <>
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <Text size="sm" className="text-text-300">No payments found</Text>
        </div>
      ) : (
        <Stack gap="sm">
          {filtered.map(p => {
            const remainingBalance = p.invoices?.remaining_balance ?? 0
            const isPartial = p.invoices?.is_partial ?? false
            
            return (
              <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-start justify-between px-4 py-3 border-b border-gray-50">
                  <div className="min-w-0 mr-3">
                    <Text fw={700} size="sm" className="text-text-700">
                      {p.customers?.full_name}
                    </Text>
                    <Text size="xs" className="text-text-300 mt-0.5">
                      {p.customers?.account_no}
                    </Text>
                    <Text size="xs" className="text-text-200 mt-0.5">
                      {p.invoices?.invoice_no}
                    </Text>
                    {isPartial && (
                      <Text size="xs" className="text-blue-600 mt-0.5">
                        Partial Payment
                      </Text>
                    )}
                    {remainingBalance > 0 && (
                      <Text size="xs" className="text-yellow-600 mt-0.5">
                        Remaining: KES {remainingBalance.toLocaleString()}
                      </Text>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <Text fw={700} size="sm" className="text-text-700">
                      KES {Number(p.amount).toLocaleString()}
                    </Text>
                    <div className="flex gap-1 justify-end mt-1 flex-wrap">
                      <Badge size="xs" radius="sm" variant="light"
                        color={METHOD_COLORS[p.method] || 'gray'}>
                        {p.method.replace('_', ' ')}
                      </Badge>
                      <Badge size="xs" radius="sm" variant="light"
                        color={STATUS_COLORS[p.status] || 'gray'}>
                        {getStatusDisplay(p.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <Text size="xs" className="text-text-300">
                    {new Date(p.payment_date).toLocaleDateString()}
                  </Text>
                  {(p.mpesa_ref || p.bank_ref) && (
                    <Text size="xs" className="text-text-200 font-mono">
                      {p.mpesa_ref || p.bank_ref}
                    </Text>
                  )}
                </div>
              </div>
            )
          })}
        </Stack>
      )}
    </>
  )

  // Calculate summary stats
  const totalCollected = filtered.reduce((sum, p) => sum + Number(p.amount), 0)
  const successfulPayments = filtered.filter(p => p.status === 'successful').length
  const pendingPayments = filtered.filter(p => p.status === 'pending').length

  return (
    <div className="p-4 md:p-6">
      {/* header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <Title order={3} className="text-text-700 font-bold text-lg md:text-xl">Payments</Title>
          <Text size="sm" className="text-text-300 mt-0.5 hidden sm:block">
            Track and record payments
          </Text>
        </div>
        <div className="flex gap-2">
          <Button radius="md" size="sm" variant="outline"
            onClick={() => { resetMpesaModal(); setMpesaModal(true) }}
            className="border-primary-500 text-primary-600">
            {isMobile ? 'M-Pesa' : 'M-Pesa STK Push'}
          </Button>
          <Button radius="md" size="sm"
            onClick={() => { resetManualModal(); setManualModal(true) }}
            className="bg-primary-500 hover:bg-primary-600">
            {isMobile ? '+ Record' : '+ Record Payment'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Paper shadow="xs" radius="lg" p="md" className="bg-white">
            <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">
              Total Collected
            </Text>
            <Text fw={700} className="text-lg text-green-600">
              KES {totalCollected.toLocaleString()}
            </Text>
            <Text size="xs" className="text-text-200 mt-1">
              Lifetime payments
            </Text>
          </Paper>

          <Paper shadow="xs" radius="lg" p="md" className="bg-white">
            <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">
              Successful
            </Text>
            <Text fw={700} className="text-lg text-text-700">
              {successfulPayments}
            </Text>
            <Text size="xs" className="text-text-200 mt-1">
              Successful transactions
            </Text>
          </Paper>

          <Paper shadow="xs" radius="lg" p="md" className="bg-white">
            <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1">
              Pending
            </Text>
            <Text fw={700} className="text-lg text-yellow-600">
              {pendingPayments}
            </Text>
            <Text size="xs" className="text-text-200 mt-1">
              Awaiting confirmation
            </Text>
          </Paper>
        </div>
      )}

      {/* filters */}
      <Paper shadow="xs" radius="lg" p="sm" className="bg-white mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select 
            placeholder="Method" 
            value={methodFilter}
            onChange={setMethodFilter} 
            clearable 
            radius="md"
            className="flex-1"
            data={[
              { value: 'mpesa', label: 'M-Pesa' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'cash', label: 'Cash' }
            ]} 
          />
          <Select 
            placeholder="Status" 
            value={statusFilter}
            onChange={setStatusFilter} 
            clearable 
            radius="md"
            className="flex-1"
            data={[
              { value: 'pending', label: 'Pending' },
              { value: 'successful', label: 'Successful' },
              { value: 'failed', label: 'Failed' },
              { value: 'reversed', label: 'Reversed' }
            ]} 
          />
        </div>
      </Paper>

      {/* content */}
      {loading ? (
        <Stack gap="sm">
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={60} radius="lg" />)}
        </Stack>
      ) : error ? (
        <Alert color="red" radius="md" variant="light">{error}</Alert>
      ) : isMobile ? (
        <PaymentCards />
      ) : (
        <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
          <PaymentsTable />
        </Paper>
      )}

      {/* M-Pesa Modal with Partial Payment Support */}
      <Modal 
        opened={mpesaModal}
        onClose={() => { setMpesaModal(false); resetMpesaModal() }}
        title={<Text fw={600} className="text-text-600">Send M-Pesa STK Push</Text>}
        radius="lg" 
        size="md">
        {mpesaSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                stroke="#22c55e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <Text fw={600} className="text-text-700 mb-2">STK Push Sent</Text>
            <Text size="sm" className="text-text-400 text-center mb-4">
              Payment prompt sent to {paymentPhone} for KES {getMpesaPayAmount().toLocaleString()}
            </Text>
            {payMode === 'partial' && selectedInvoice && (
              <Alert color="blue" radius="md" variant="light" className="mb-4">
                Remaining balance after payment: KES {(getMpesaMaxPayable() - getMpesaPayAmount()).toLocaleString()}
              </Alert>
            )}
            <Button fullWidth radius="md"
              onClick={() => { setMpesaModal(false); resetMpesaModal() }}
              className="bg-primary-500 hover:bg-primary-600">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {mpesaError && (
              <Alert color="red" radius="md" variant="light">{mpesaError}</Alert>
            )}

            {/* Customer Search */}
            <div>
              <Text size="sm" fw={500} className="text-text-500 mb-1">Search Customer</Text>
              <input type="text" placeholder="Type name, phone or account no..."
                value={customerSearch}
                onChange={e => {
                  setCustomerSearch(e.target.value)
                  setSelectedCustomer(null)
                  setSelectedInvoice(null)
                  setUnpaidInvoices([])
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              {customerLoading && <Text size="xs" className="text-text-300 mt-1">Searching...</Text>}
              {customers.length > 0 && (
                <div className="border border-gray-100 rounded-lg mt-1 overflow-hidden shadow-sm">
                  {customers.map(c => (
                    <button key={c.id} onClick={() => selectCustomer(c)}
                      className="w-full text-left px-3 py-2.5 hover:bg-primary-50 border-b border-gray-50 last:border-0 transition-colors">
                      <Text size="sm" fw={500} className="text-text-600">{c.full_name}</Text>
                      <Text size="xs" className="text-text-300">{c.account_no} · {c.phone}</Text>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomer && (
              <InvoicePicker
                invoices={unpaidInvoices}
                loadingInvoices={invoicesLoading}
                selected={selectedInvoice}
                onSelect={handleSelectInvoice}
                customerName={selectedCustomer.full_name}
              />
            )}

            {selectedInvoice && (
              <>
                {/* Payment Type Toggle */}
                <div>
                  <Text size="xs" fw={500} className="text-text-500 mb-2">Payment Type</Text>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPayMode('full')
                        const remainingToPay = selectedInvoice.remaining_balance ?? selectedInvoice.total_amount
                        setPartialAmount(String(remainingToPay))
                        setMpesaError('')
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        payMode === 'full'
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-gray-100 text-text-600 border border-gray-200 hover:bg-gray-200'
                      }`}>
                      Full <span className="text-xs opacity-90">KES {getMpesaMaxPayable().toLocaleString()}</span>
                    </button>
                    <button
                      onClick={() => {
                        setPayMode('partial')
                        const remainingToPay = selectedInvoice.remaining_balance ?? selectedInvoice.total_amount
                        setPartialAmount(String(remainingToPay))
                        setMpesaError('')
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        payMode === 'partial'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'bg-gray-100 text-text-600 border border-gray-200 hover:bg-gray-200'
                      }`}>
                      Partial
                    </button>
                  </div>
                </div>

                {/* Partial Amount Input */}
                {payMode === 'partial' && (
                  <div>
                    <label className="block text-xs font-medium text-text-500 mb-1">
                      Amount to Pay (KES)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Enter amount"
                      value={partialAmount}
                      onChange={e => setPartialAmount(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base text-text-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                    {partialAmount && Number(partialAmount) > 0 && Number(partialAmount) < getMpesaMaxPayable() && (
                      <div className="mt-1 flex justify-between text-xs">
                        <Text size="xs" className="text-text-300">Remaining after payment:</Text>
                        <Text size="xs" fw={600} className="text-yellow-600">
                          KES {(getMpesaMaxPayable() - Number(partialAmount)).toLocaleString()}
                        </Text>
                      </div>
                    )}
                    {partialAmount && Number(partialAmount) > getMpesaMaxPayable() && (
                      <div className="mt-1 flex justify-between text-xs">
                        <Text size="xs" className="text-red-500">Exceeds remaining balance</Text>
                        <Text size="xs" fw={600} className="text-red-500">
                          Max: KES {getMpesaMaxPayable().toLocaleString()}
                        </Text>
                      </div>
                    )}
                  </div>
                )}

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-medium text-text-500 mb-1">
                    M-Pesa Number
                  </label>
                  <input type="tel" value={paymentPhone}
                    onChange={e => setPaymentPhone(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-1">
                    <Text className="text-text-300">Amount to pay</Text>
                    <Text fw={700} className="text-green-600">KES {getMpesaPayAmount().toLocaleString()}</Text>
                  </div>
                  {payMode === 'partial' && getMpesaPayAmount() < getMpesaMaxPayable() && (
                    <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
                      <Text className="text-text-300">New remaining balance</Text>
                      <Text className="text-yellow-600">KES {(getMpesaMaxPayable() - getMpesaPayAmount()).toLocaleString()}</Text>
                    </div>
                  )}
                </div>

                <Button fullWidth radius="md"
                  disabled={!selectedInvoice || !paymentPhone || getMpesaPayAmount() <= 0 || getMpesaPayAmount() > getMpesaMaxPayable()}
                  loading={mpesaSending}
                  onClick={handleMpesa}
                  className={`transition-all ${payMode === 'full' ? 'bg-primary-500 hover:bg-primary-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                  Send KES {getMpesaPayAmount().toLocaleString()}
                </Button>
              </>
            )}
          </div>
        )}
      </Modal>

      {/* Manual Payment Modal with Partial Payment Support */}
      <Modal 
        opened={manualModal}
        onClose={() => { setManualModal(false); resetManualModal() }}
        title={<Text fw={600} className="text-text-600">Record Manual Payment</Text>}
        radius="lg" 
        size="md">
        <div className="space-y-4">
          {manualError && (
            <Alert color="red" radius="md" variant="light">{manualError}</Alert>
          )}

          {/* Customer Search */}
          <div>
            <Text size="sm" fw={500} className="text-text-500 mb-1">Search Customer</Text>
            <input type="text" placeholder="Type name, phone or account no..."
              value={manualCustomerSearch}
              onChange={e => {
                setManualCustomerSearch(e.target.value)
                setManualSelectedCustomer(null)
                setManualSelectedInvoice(null)
                setManualInvoices([])
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            {manualCustomerLoading && <Text size="xs" className="text-text-300 mt-1">Searching...</Text>}
            {manualCustomers.length > 0 && (
              <div className="border border-gray-100 rounded-lg mt-1 overflow-hidden shadow-sm">
                {manualCustomers.map(c => (
                  <button key={c.id} onClick={() => selectManualCustomer(c)}
                    className="w-full text-left px-3 py-2.5 hover:bg-primary-50 border-b border-gray-50 last:border-0 transition-colors">
                    <Text size="sm" fw={500} className="text-text-600">{c.full_name}</Text>
                    <Text size="xs" className="text-text-300">{c.account_no} · {c.phone}</Text>
                  </button>
                ))}
              </div>
            )}
          </div>

          {manualSelectedCustomer && (
            <InvoicePicker
              invoices={manualInvoices}
              loadingInvoices={manualInvoicesLoading}
              selected={manualSelectedInvoice}
              onSelect={handleSelectManualInvoice}
              customerName={manualSelectedCustomer.full_name}
            />
          )}

          {manualSelectedInvoice && (
            <>
              {/* Payment Type Toggle */}
              <div>
                <Text size="xs" fw={500} className="text-text-500 mb-2">Payment Type</Text>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setManualPayMode('full')
                      const remainingToPay = manualSelectedInvoice.remaining_balance ?? manualSelectedInvoice.total_amount
                      setManualPartialAmount(String(remainingToPay))
                      setManualForm({ ...manualForm, amount: String(remainingToPay) })
                      setManualError('')
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      manualPayMode === 'full'
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 text-text-600 border border-gray-200 hover:bg-gray-200'
                    }`}>
                    Full <span className="text-xs opacity-90">KES {getManualMaxPayable().toLocaleString()}</span>
                  </button>
                  <button
                    onClick={() => {
                      setManualPayMode('partial')
                      const remainingToPay = manualSelectedInvoice.remaining_balance ?? manualSelectedInvoice.total_amount
                      setManualPartialAmount(String(remainingToPay))
                      setManualForm({ ...manualForm, amount: String(remainingToPay) })
                      setManualError('')
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      manualPayMode === 'partial'
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-text-600 border border-gray-200 hover:bg-gray-200'
                    }`}>
                    Partial
                  </button>
                </div>
              </div>

              {/* Partial Amount Input */}
              {manualPayMode === 'partial' && (
                <div>
                  <label className="block text-xs font-medium text-text-500 mb-1">
                    Amount (KES)
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Enter amount"
                    value={manualPartialAmount}
                    onChange={e => {
                      setManualPartialAmount(e.target.value)
                      setManualForm({ ...manualForm, amount: e.target.value })
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base text-text-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  {manualPartialAmount && Number(manualPartialAmount) > 0 && Number(manualPartialAmount) < getManualMaxPayable() && (
                    <div className="mt-1 flex justify-between text-xs">
                      <Text size="xs" className="text-text-300">Remaining after payment:</Text>
                      <Text size="xs" fw={600} className="text-yellow-600">
                        KES {(getManualMaxPayable() - Number(manualPartialAmount)).toLocaleString()}
                      </Text>
                    </div>
                  )}
                  {manualPartialAmount && Number(manualPartialAmount) > getManualMaxPayable() && (
                    <div className="mt-1 flex justify-between text-xs">
                      <Text size="xs" className="text-red-500">Exceeds remaining balance</Text>
                      <Text size="xs" fw={600} className="text-red-500">
                        Max: KES {getManualMaxPayable().toLocaleString()}
                      </Text>
                    </div>
                  )}
                </div>
              )}

              {/* Method Selection */}
              <Select 
                label="Method" 
                radius="md" 
                value={manualForm.method}
                onChange={val => setManualForm({ ...manualForm, method: val || 'cash' })}
                data={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'bank_transfer', label: 'Bank Transfer' }
                ]}
              />

              {manualForm.method === 'bank_transfer' && (
                <div>
                  <label className="block text-xs font-medium text-text-500 mb-1">
                    Bank Reference
                  </label>
                  <input type="text" placeholder="BTR-2026-001"
                    value={manualForm.bank_ref}
                    onChange={e => setManualForm({ ...manualForm, bank_ref: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              )}

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex justify-between text-xs mb-1">
                  <Text className="text-text-300">Amount to record</Text>
                  <Text fw={700} className="text-green-600">KES {getManualPayAmount().toLocaleString()}</Text>
                </div>
                {manualPayMode === 'partial' && getManualPayAmount() < getManualMaxPayable() && (
                  <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
                    <Text className="text-text-300">New remaining balance</Text>
                    <Text className="text-yellow-600">KES {(getManualMaxPayable() - getManualPayAmount()).toLocaleString()}</Text>
                  </div>
                )}
              </div>

              <Button fullWidth radius="md" loading={manualSaving}
                disabled={getManualPayAmount() <= 0 || getManualPayAmount() > getManualMaxPayable()}
                onClick={handleManual}
                className={`transition-all ${manualPayMode === 'full' ? 'bg-primary-500 hover:bg-primary-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
                Record Payment of KES {getManualPayAmount().toLocaleString()}
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}