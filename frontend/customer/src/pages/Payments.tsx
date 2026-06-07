

import { useEffect, useState } from 'react'
import { Paper, Title, Text, Badge, Stack, Skeleton, Alert, Button, Modal } from '@mantine/core'
import api from '../utils/api'
import { getCustomer } from '../utils/auth'

// TypeScript interfaces
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
  amount_paid: number
  remaining_balance: number
  status: string
  due_date: string
  billing_period_start: string
  billing_period_end: string
  is_partial?: boolean
  percent_paid?: number
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
  invoices?: {
    invoice_no: string
    total_amount: number
    amount_paid?: number
    remaining_balance?: number
    is_partial?: boolean
    percent_paid?: number
  }
}

export default function Payments() {
  const customer = getCustomer() as Customer
  const [payments, setPayments] = useState<Payment[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payModal, setPayModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [payMode, setPayMode] = useState<'full' | 'partial'>('full')
  const [partialAmount, setPartialAmount] = useState('')
  const [phone, setPhone] = useState(customer?.phone || '')
  const [sending, setSending] = useState(false)
  const [payError, setPayError] = useState('')
  const [paySuccess, setPaySuccess] = useState(false)

  const load = async () => {
    try {
      // Fetch all payments to calculate accurate totals (same as Invoices component)
      const allPaymentsRes = await api.get('/payments')
      const allPayments = allPaymentsRes.data.data || []
      
      // Create a map of invoice_id -> total paid (only successful payments)
      // This is the SAME logic used in the Invoices component
      const paymentMap = new Map<number, number>()
      allPayments.forEach((payment: any) => {
        if (payment.status === 'successful') {
          const current = paymentMap.get(payment.invoice_id) || 0
          paymentMap.set(payment.invoice_id, current + Number(payment.amount))
        }
      })
      
      // Fetch invoices for this customer
      const invRes = await api.get(`/invoices/customer/${customer.id}`)
      const invoicesData = invRes.data.data || []
      
      // Process invoices with calculated totals (SAME logic as Invoices component)
      const processedInvoices = invoicesData.map((inv: any) => {
        const totalPaid = paymentMap.get(inv.id) || Number(inv.amount_paid || 0)
        const total = Number(inv.total_amount)
        const remaining = total - totalPaid
        const isPartiallyPaid = totalPaid > 0 && remaining > 0 && inv.status !== 'paid'
        const percentPaid = total > 0 ? (totalPaid / total) * 100 : 0
        
        return {
          ...inv,
          amount_paid: totalPaid,
          remaining_balance: remaining > 0 ? remaining : 0,
          is_partial: isPartiallyPaid,
          percent_paid: Math.round(percentPaid)
        }
      })
      
      // Only filter invoices that have a remaining balance > 0 and are not fully paid
      const unpaidInvoices = processedInvoices.filter((inv: Invoice) => {
        const remainingBalance = Number(inv.remaining_balance || 0)
        return remainingBalance > 0 && inv.status !== 'paid'
      })
      
      // Get payments for display (only those belonging to this customer)
      const payRes = await api.get(`/payments/customer/${customer.id}`)
      const customerPayments = payRes.data.data || []
      
      // Enrich payments with calculated invoice data
      const enrichedPayments = customerPayments.map((payment: any) => {
        const invoice = processedInvoices.find((inv: Invoice) => inv.id === payment.invoice_id)
        return {
          ...payment,
          invoices: invoice ? {
            invoice_no: invoice.invoice_no,
            total_amount: invoice.total_amount,
            amount_paid: invoice.amount_paid,
            remaining_balance: invoice.remaining_balance,
            is_partial: invoice.is_partial,
            percent_paid: invoice.percent_paid
          } : payment.invoices
        }
      })
      
      setInvoices(unpaidInvoices)
      setPayments(enrichedPayments)
      
    } catch (err) {
      console.error('Load error:', err)
      setError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv)
    // Use the calculated remaining_balance
    const remainingToPay = Number(inv.remaining_balance || 0)
    setPartialAmount(String(remainingToPay))
    setPayMode('full')
    setPayError('')
  }

  const getPayAmount = () => {
    if (payMode === 'full') return Number(selectedInvoice?.remaining_balance || 0)
    return Number(partialAmount || 0)
  }

  const getMaxPayable = () => {
    return Number(selectedInvoice?.remaining_balance || 0)
  }

  const refreshData = async () => {
    await load()
  }

  const handlePay = async () => {
    if (!selectedInvoice || !phone) {
      setPayError('Please select an invoice and confirm your phone number')
      return
    }
    const amount = getPayAmount()
    const maxAmount = getMaxPayable()
    
    if (amount <= 0) {
      setPayError('Please enter a valid amount')
      return
    }
    if (amount > maxAmount) {
      setPayError(`Amount cannot exceed remaining balance of KES ${maxAmount.toLocaleString()}`)
      return
    }

    setSending(true)
    setPayError('')
    try {
      const cleaned = String(phone).replace(/\D/g, '')
      const formatted = cleaned.startsWith('254')
        ? cleaned
        : cleaned.startsWith('0')
          ? `254${cleaned.slice(1)}`
          : `254${cleaned}`

      await api.post('/payments/mpesa/initiate', {
        invoice_id: selectedInvoice.id,
        phone: formatted,
        amount: amount
      })
      setPaySuccess(true)
      // Refresh data after successful payment initiation
      setTimeout(() => refreshData(), 3000)
    } catch (err: any) {
      setPayError(err.response?.data?.message || 'Failed to send payment prompt')
    } finally {
      setSending(false)
    }
  }

  const resetModal = () => {
    setPayModal(false)
    setSelectedInvoice(null)
    setPayMode('full')
    setPartialAmount('')
    setPhone(customer?.phone || '')
    setPayError('')
    setPaySuccess(false)
    refreshData()
  }

  const METHOD_COLORS: Record<string, string> = {
    mpesa: 'teal', 
    bank_transfer: 'blue', 
    cash: 'violet'
  }

  const getPaymentStatusColor = (status: string) => {
    if (status === 'successful') return 'green'
    if (status === 'failed') return 'red'
    if (status === 'pending') return 'yellow'
    return 'gray'
  }

  const getPaymentStatusDisplay = (status: string) => {
    if (status === 'successful') return 'Successful'
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  // Calculate total outstanding from invoices with remaining balance
  const totalOutstanding = invoices.reduce((sum, inv) => {
    return sum + Number(inv.remaining_balance || 0)
  }, 0)

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <Title order={3} className="text-text-700 font-bold text-lg">Payments</Title>
          <Text size="xs" className="text-text-300 mt-0.5">Your payment history</Text>
        </div>
        {invoices.length > 0 && (
          <Button radius="md" size="sm" onClick={() => setPayModal(true)}
            className="bg-primary-500 hover:bg-primary-600">
            Pay Now
          </Button>
        )}
      </div>

      {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

      {/* Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Paper shadow="xs" radius="lg" p="md" className="bg-white">
            <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
              Total Outstanding
            </Text>
            <Text fw={700} className={`text-lg leading-tight ${totalOutstanding > 0 ? 'text-red-500' : 'text-secondary-400'}`}>
              KES {totalOutstanding.toLocaleString()}
            </Text>
            <Text size="xs" className="text-text-200 mt-1">
              {invoices.length} unpaid invoice{invoices.length !== 1 ? 's' : ''}
            </Text>
          </Paper>

          <Paper shadow="xs" radius="lg" p="md" className="bg-white">
            <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
              Total Payments
            </Text>
            <Text fw={700} className="text-lg leading-tight text-green-600">
              {payments.length}
            </Text>
            <Text size="xs" className="text-text-200 mt-1">
              Payments made
            </Text>
          </Paper>
        </div>
      )}

      {loading ? (
        <Stack gap="sm">
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={80} radius="lg" />)}
        </Stack>
      ) : payments.length === 0 ? (
        <Paper shadow="xs" radius="lg" p="xl" className="bg-white text-center">
          <Text size="sm" className="text-text-300">No payments yet</Text>
          {invoices.length > 0 && (
            <Button size="sm" radius="md" mt="md" onClick={() => setPayModal(true)}
              className="bg-primary-500 hover:bg-primary-600">
              Make a Payment
            </Button>
          )}
        </Paper>
      ) : (
        <Stack gap="sm">
          {payments.map((p: Payment) => (
            <Paper key={p.id} shadow="xs" radius="lg" p="md" className="bg-white">
              <div className="flex items-start justify-between">
                <div className="min-w-0 mr-3">
                  <Text size="sm" fw={700} className="text-text-700">
                    {p.invoices?.invoice_no || '—'}
                  </Text>
                  <Text size="xs" className="text-text-300 mt-0.5">
                    {new Date(p.payment_date).toLocaleDateString()}
                  </Text>
                  {(p.mpesa_ref || p.bank_ref) && (
                    <Text size="xs" className="text-text-200 mt-0.5 font-mono">
                      Ref: {p.mpesa_ref || p.bank_ref}
                    </Text>
                  )}
                  {/* Show partial payment info if applicable */}
                  {p.invoices?.is_partial && p.invoices?.percent_paid && (
                    <Text size="xs" className="text-blue-600 mt-0.5">
                      Invoice is {p.invoices.percent_paid}% paid
                    </Text>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <Text size="sm" fw={700} className="text-text-700">
                    KES {Number(p.amount).toLocaleString()}
                  </Text>
                  <div className="flex gap-1 justify-end mt-1 flex-wrap">
                    <Badge size="xs" radius="sm" variant="light"
                      color={METHOD_COLORS[p.method] || 'gray'}>
                      {p.method.replace('_', ' ')}
                    </Badge>
                    <Badge size="xs" radius="sm" variant="light"
                      color={getPaymentStatusColor(p.status)}>
                      {getPaymentStatusDisplay(p.status)}
                    </Badge>
                  </div>
                  {p.invoices?.remaining_balance !== undefined && p.invoices.remaining_balance > 0 && (
                    <Text size="xs" className="text-text-300 mt-1">
                      Remaining: KES {p.invoices.remaining_balance.toLocaleString()}
                    </Text>
                  )}
                </div>
              </div>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Pay Modal */}
      <Modal opened={payModal} onClose={resetModal}
        title={<Text fw={600} size="sm" className="text-text-600">Pay with M-Pesa</Text>}
        radius="lg" size="sm" fullScreen={false}>

        {paySuccess ? (
          <Stack align="center" gap="md" py="md">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <Text fw={600} className="text-text-700">Payment Prompt Sent</Text>
            <Text size="sm" className="text-text-400 text-center">
              Check your phone for the M-Pesa prompt for{' '}
              <span className="font-semibold">KES {getPayAmount().toLocaleString()}</span>.
            </Text>
            {payMode === 'partial' && selectedInvoice && (
              <Alert color="blue" radius="md" variant="light">
                Remaining balance after payment: KES {(getMaxPayable() - getPayAmount()).toLocaleString()}
              </Alert>
            )}
            
            <Button fullWidth radius="md" variant="outline" onClick={() => {
              refreshData()
              resetModal()
            }}
              className="border-primary-500 text-primary-500">
              Done
            </Button>
          </Stack>
        ) : (
          <Stack gap="sm">
            {payError && (
              <Alert color="red" radius="md" variant="light">{payError}</Alert>
            )}

            {/* Select Invoice - Using calculated values (same as Invoices component) */}
            <div>
              <Text size="xs" fw={500} className="text-text-500 mb-2">Select Invoice</Text>
              {invoices.length === 0 ? (
                <Alert color="blue" radius="md" variant="light">
                  No unpaid or partially paid invoices found
                </Alert>
              ) : (
                <Stack gap="xs">
                  {invoices.map((inv: Invoice) => {
                    // Use the calculated values (same as Invoices component)
                    const remainingBalance = Number(inv.remaining_balance || 0)
                    const amountPaid = Number(inv.amount_paid || 0)
                    const totalAmount = Number(inv.total_amount || 0)
                    const isPartiallyPaid = inv.is_partial || (amountPaid > 0 && remainingBalance > 0)
                    const percentPaid = inv.percent_paid || (totalAmount > 0 ? Math.round((amountPaid / totalAmount) * 100) : 0)
                    
                    return (
                      <button
                        key={inv.id}
                        onClick={() => handleSelectInvoice(inv)}
                        className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
                          selectedInvoice?.id === inv.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <Text size="sm" fw={600} className="text-text-600">{inv.invoice_no}</Text>
                            <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
                            {isPartiallyPaid && (
                              <>
                                <Text size="xs" className="text-green-600 mt-1">
                                  Paid: KES {amountPaid.toLocaleString()}
                                </Text>
                                <Text size="xs" className="text-orange-500">
                                  Remaining: KES {remainingBalance.toLocaleString()}
                                </Text>
                              </>
                            )}
                            {!isPartiallyPaid && remainingBalance > 0 && (
                              <Text size="xs" className="text-orange-500 mt-1">
                                Balance: KES {remainingBalance.toLocaleString()}
                              </Text>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 ml-3">
                            <Text size="sm" fw={700} className="text-primary-600">
                              KES {remainingBalance.toLocaleString()}
                            </Text>
                            {isPartiallyPaid ? (
                              <Badge size="xs" radius="sm" variant="light" color="blue">
                                Partial ({percentPaid}%)
                              </Badge>
                            ) : (
                              <Badge size="xs" radius="sm" variant="light"
                                color={inv.status === 'overdue' ? 'red' : 'yellow'}>
                                {inv.status === 'overdue' ? 'Overdue' : 'Unpaid'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </Stack>
              )}
            </div>

            {selectedInvoice && (
              <>
                {/* Payment Type Toggle */}
                <div>
                  <Text size="xs" fw={500} className="text-text-500 mb-2">Payment Type</Text>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPayMode('full')
                        const remainingToPay = selectedInvoice.remaining_balance || 0
                        setPartialAmount(String(remainingToPay))
                        setPayError('')
                      }}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        payMode === 'full'
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-gray-100 text-text-600 border border-gray-200 hover:bg-gray-200'
                      }`}>
                      Full <span className="text-xs opacity-90">KES {getMaxPayable().toLocaleString()}</span>
                    </button>
                    <button
                      onClick={() => {
                        setPayMode('partial')
                        const remainingToPay = selectedInvoice.remaining_balance || 0
                        setPartialAmount(String(remainingToPay))
                        setPayError('')
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
                      Amount (KES)
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="Enter amount"
                      value={partialAmount}
                      onChange={e => setPartialAmount(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-base text-text-700 font-semibold focus:outline-none focus:ring-2 focus:ring-primary-300"
                    />
                    {partialAmount && Number(partialAmount) > 0 && Number(partialAmount) !== getMaxPayable() && (
                      <div className="mt-1 flex justify-between text-xs">
                        <Text size="xs" className="text-text-300">
                          {Number(partialAmount) < getMaxPayable() ? 'Remaining after payment:' : 'Overpayment will become credit:'}
                        </Text>
                        <Text size="xs" fw={600} className={Number(partialAmount) < getMaxPayable() ? 'text-yellow-600' : 'text-green-600'}>
                          KES {Math.abs(getMaxPayable() - Number(partialAmount)).toLocaleString()}
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
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0712345678"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-xs mb-1">
                    <Text className="text-text-300">Amount to pay</Text>
                    <Text fw={700} className="text-green-600">KES {getPayAmount().toLocaleString()}</Text>
                  </div>
                  {payMode === 'partial' && getPayAmount() < getMaxPayable() && (
                    <div className="flex justify-between text-xs pt-1 border-t border-gray-200">
                      <Text className="text-text-300">New remaining balance</Text>
                      <Text className="text-yellow-600">KES {(getMaxPayable() - getPayAmount()).toLocaleString()}</Text>
                    </div>
                  )}
                </div>

                <Button fullWidth radius="md" size="md" loading={sending}
                  disabled={!phone || getPayAmount() <= 0 || getPayAmount() > getMaxPayable()}
                  onClick={handlePay}
                  className={`transition-all ${
                    payMode === 'full' ? 'bg-primary-500 hover:bg-primary-600' : 'bg-blue-500 hover:bg-blue-600'
                  }`}>
                  Pay KES {getPayAmount().toLocaleString()}
                </Button>
              </>
            )}
          </Stack>
        )}
      </Modal>
    </div>
  )
}