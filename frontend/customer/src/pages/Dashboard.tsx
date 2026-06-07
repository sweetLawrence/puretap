


import { useEffect, useState } from 'react'
import { Paper, Title, Text, Badge, Skeleton, Alert, Stack } from '@mantine/core'
import api from '../utils/api'
import { getCustomer } from '../utils/auth'

export default function Dashboard() {
  const customer = getCustomer()
  const [invoices, setInvoices] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [readings, setReadings] = useState<any[]>([])
  const [customerData, setCustomerData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch all payments to calculate accurate totals (SAME as Invoices component)
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
        
        const [invRes, payRes, meterRes, custRes] = await Promise.all([
          api.get(`/invoices/customer/${customer.id}`),
          api.get(`/payments/customer/${customer.id}`),
          api.get(`/meters/customer/${customer.id}`),
          api.get(`/customers/${customer.id}`)
        ])
        
        // Process invoices using paymentMap (SAME logic as Invoices component)
        const processedInvoices = invRes.data.data.map((inv: any) => {
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
            percent_paid: Math.round(percentPaid),
            display_amount: isPartiallyPaid ? remaining : total
          }
        })
        
        setInvoices(processedInvoices)
        setPayments(payRes.data.data)
        setCustomerData(custRes.data.data)
        
        if (meterRes.data.data.length > 0) {
          const meter = meterRes.data.data[0]
          const readRes = await api.get(`/readings/meter/${meter.id}`)
          setReadings(readRes.data.data)
        }
      } catch (err) {
        console.error('Load error:', err)
        setError('Failed to load account data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Calculate outstanding balance (considering partial payments)
  // Now using the calculated remaining_balance from processed invoices
  const unpaidInvoices = invoices.filter(i => 
    ['unpaid', 'overdue'].includes(i.status) || i.is_partial
  )
  
  const totalOutstanding = unpaidInvoices.reduce((sum, i) => {
    // Use the calculated remaining_balance directly
    return sum + Number(i.remaining_balance || 0)
  }, 0)
  
  // Calculate total paid this month using 'successful' status (SAME as Invoices)
  const totalPaidThisMonth = payments
    .filter(p => {
      const paymentDate = new Date(p.payment_date)
      const now = new Date()
      return paymentDate.getMonth() === now.getMonth() && 
             paymentDate.getFullYear() === now.getFullYear() &&
             p.status === 'successful'  // Changed from 'completed' to 'successful'
    })
    .reduce((sum, p) => sum + Number(p.amount), 0)
  
  const lastPayment = payments[0]
  const lastReading = readings[0]
  const creditBalance = Number(customerData?.credit_balance || 0)

  if (loading) return (
    <div className="p-4">
      <Skeleton height={24} width={160} mb="sm" radius="md" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} height={90} radius="lg" />)}
      </div>
    </div>
  )

  return (
    <div className="p-4 pb-8">
      {/* greeting */}
      <div className="mb-5">
        <Title order={3} className="text-text-700 font-bold text-lg">
          Hi, {customer?.full_name?.split(' ')[0]}
        </Title>
        <Text size="xs" className="text-text-300 mt-0.5">Account {customer?.account_no}</Text>
      </div>

      {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

      {/* stat cards — 2 col grid on all screens */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
            Outstanding
          </Text>
          <Text fw={700} className={`text-lg leading-tight ${totalOutstanding > 0 ? 'text-red-500' : 'text-secondary-400'}`}>
            KES {totalOutstanding.toLocaleString()}
          </Text>
          <Text size="xs" className="text-text-200 mt-1">
            {unpaidInvoices.length} unpaid
          </Text>
        </Paper>

        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
            Credit Balance
          </Text>
          <Text fw={700} className={`text-lg leading-tight ${creditBalance > 0 ? 'text-green-600' : 'text-text-300'}`}>
            KES {creditBalance.toLocaleString()}
          </Text>
          <Text size="xs" className="text-text-200 mt-1">
            {creditBalance > 0 ? 'Available for next bill' : 'No credit'}
          </Text>
        </Paper>

        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
            Last Payment
          </Text>
          {lastPayment ? (
            <>
              <Text fw={700} className="text-lg text-text-700 leading-tight">
                KES {Number(lastPayment.amount).toLocaleString()}
              </Text>
              <Text size="xs" className="text-text-200 mt-1">
                {new Date(lastPayment.payment_date).toLocaleDateString()}
              </Text>
            </>
          ) : (
            <Text size="xs" className="text-text-300 mt-2">No payments yet</Text>
          )}
        </Paper>

        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
            Last Reading
          </Text>
          {lastReading ? (
            <>
              <Text fw={700} className="text-lg text-text-700 leading-tight">
                {lastReading.current_reading} m³
              </Text>
              <Text size="xs" className="text-text-200 mt-1">{lastReading.reading_date}</Text>
            </>
          ) : (
            <Text size="xs" className="text-text-300 mt-2">No readings yet</Text>
          )}
        </Paper>
      </div>

      {/* second row of stats - show payment summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
            Paid This Month
          </Text>
          <Text fw={700} className="text-lg text-green-600 leading-tight">
            KES {totalPaidThisMonth.toLocaleString()}
          </Text>
          <Text size="xs" className="text-text-200 mt-1">
            Total payments this month
          </Text>
        </Paper>

        <Paper shadow="xs" radius="lg" p="md" className="bg-white">
          <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
            Account Type
          </Text>
          <Text fw={700} className="text-lg text-text-700 leading-tight capitalize">
            {customer?.customer_type}
          </Text>
          <Badge size="xs" radius="sm" variant="light" color="green" mt={4}>Active</Badge>
        </Paper>
      </div>

      {/* unpaid invoices with partial payment support - using calculated values */}
      {unpaidInvoices.length > 0 && (
        <Paper shadow="xs" radius="lg" className="bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <Text size="sm" fw={600} className="text-text-600">Pending Invoices</Text>
          </div>
          {unpaidInvoices.slice(0, 5).map(inv => {
            const isPartial = inv.is_partial
            // Use the calculated values from processed invoices
            const displayAmount = isPartial ? inv.remaining_balance : inv.total_amount
            const percentPaid = inv.percent_paid || 0
            
            return (
              <div key={inv.id}
                className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="min-w-0 mr-3">
                  <Text size="sm" fw={600} className="text-text-600 truncate">{inv.invoice_no}</Text>
                  <Text size="xs" className="text-text-300">Due: {inv.due_date}</Text>
                  {isPartial && (
                    <Text size="xs" className="text-blue-600 mt-1">
                      Paid: KES {inv.amount_paid.toLocaleString()} ({percentPaid}%)
                    </Text>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <Text size="sm" fw={700} className={inv.status === 'overdue' ? 'text-red-500' : 'text-primary-600'}>
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
                        Partial ({percentPaid}%)
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
            )
          })}
        </Paper>
      )}

      {/* Show message if no unpaid invoices but has credit */}
      {unpaidInvoices.length === 0 && creditBalance > 0 && (
        <Paper shadow="xs" radius="lg" p="md" className="bg-green-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <Text size="sm" fw={600} className="text-green-700">You have credit!</Text>
              <Text size="xs" className="text-green-600">
                KES {creditBalance.toLocaleString()} credit available. It will be applied to your next invoice.
              </Text>
            </div>
          </div>
        </Paper>
      )}

      {/* Show recent payments summary - now showing partial payment info */}
      {payments.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <Text size="xs" fw={600} className="text-text-500 uppercase tracking-wide">
              Recent Activity
            </Text>
            <Text size="xs" className="text-text-300">
              Last {Math.min(payments.length, 3)} payments
            </Text>
          </div>
          <Stack gap="xs">
            {payments.slice(0, 3).map(p => {
              // Find the associated invoice to show remaining balance
              const associatedInvoice = invoices.find(inv => inv.id === p.invoice_id)
              
              return (
                <Paper key={p.id} shadow="xs" radius="lg" p="sm" className="bg-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <Text size="xs" fw={600} className="text-text-600">
                        {p.invoices?.invoice_no || 'Payment'}
                      </Text>
                      <Text size="xs" className="text-text-300">
                        {new Date(p.payment_date).toLocaleDateString()}
                      </Text>
                      {associatedInvoice?.is_partial && associatedInvoice?.remaining_balance > 0 && (
                        <Text size="xs" className="text-orange-500 mt-0.5">
                          Remaining: KES {associatedInvoice.remaining_balance.toLocaleString()}
                        </Text>
                      )}
                    </div>
                    <div className="text-right">
                      <Text size="sm" fw={700} className="text-green-600">
                        + KES {Number(p.amount).toLocaleString()}
                      </Text>
                      <Badge size="xs" variant="light" 
                        color={p.status === 'successful' ? 'green' : 'yellow'} 
                        radius="sm">
                        {p.method}
                      </Badge>
                      {associatedInvoice?.is_partial && (
                        <Badge size="xs" variant="light" color="blue" radius="sm" className="ml-1">
                          Partial
                        </Badge>
                      )}
                    </div>
                  </div>
                </Paper>
              )
            })}
          </Stack>
        </div>
      )}
    </div>
  )
}