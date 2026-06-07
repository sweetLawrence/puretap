


import { useEffect, useState } from 'react'
import { Paper, Title, Text, Badge, Stack, Skeleton, Alert, Button, Modal } from '@mantine/core'
import api from '../utils/api'
import { getCustomer } from '../utils/auth'

const STATUS_COLORS: Record<string, string> = {
  unpaid: 'yellow', 
  paid: 'green', 
  overdue: 'red',
  disputed: 'orange', 
  cancelled: 'gray', 
  partial: 'blue'
}

export default function Invoices() {
  const customer = getCustomer()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [creditBalance, setCreditBalance] = useState<number>(0)

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch invoices with balance calculation
        const invRes = await api.get(`/invoices/customer/${customer.id}`)
        const invoicesData = invRes.data.data
        
        // Fetch all payments to calculate accurate totals
        const payRes = await api.get('/payments')
        const allPayments = payRes.data.data || []
        
        // Create a map of invoice_id -> total paid (only successful payments)
        const paymentMap = new Map<number, number>()
        allPayments.forEach((payment: any) => {
          if (payment.status === 'successful') {
            const current = paymentMap.get(payment.invoice_id) || 0
            paymentMap.set(payment.invoice_id, current + Number(payment.amount))
          }
        })
        
        // Fetch customer credit balance
        try {
          const creditRes = await api.get(`/payments/credit/balance/${customer.id}`)
          setCreditBalance(Number(creditRes.data.data?.credit_balance || 0))
        } catch (err) {
          console.error('Failed to fetch credit balance:', err)
          setCreditBalance(0)
        }
        
        // Process invoices with calculated total paid from all payments
        const processedInvoices = invoicesData.map((inv: any) => {
          const totalPaid = paymentMap.get(inv.id) || Number(inv.amount_paid || 0)
          const total = Number(inv.total_amount)
          const remaining = total - totalPaid
          // Consider partial if paid > 0 AND remaining > 0 AND not fully paid
          const isPartiallyPaid = totalPaid > 0 && remaining > 0 && inv.status !== 'paid'
          const percentPaid = total > 0 ? (totalPaid / total) * 100 : 0
          
          return {
            ...inv,
            amount_paid: totalPaid,
            remaining_balance: remaining > 0 ? remaining : 0,
            is_partial: isPartiallyPaid,
            percent_paid: Math.round(percentPaid),
            display_status: isPartiallyPaid ? 'partial' : inv.status
          }
        })
        
        setInvoices(processedInvoices)
      } catch (err) {
        console.error('Load error:', err)
        setError('Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [customer.id])

  const handleDownload = async (invoiceId: number, invoiceNo: string) => {
    setDownloading(invoiceId)
    try {
      const res = await api.get(`/invoices/${invoiceId}/download`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${invoiceNo}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('Failed to download invoice')
    } finally {
      setDownloading(null)
    }
  }

  const getStatusBadge = (inv: any) => {
    if (inv.is_partial) {
      return (
        <Badge size="xs" radius="sm" variant="light" color="blue">
          PARTIAL ({inv.percent_paid}%)
        </Badge>
      )
    }
    return (
      <Badge size="xs" radius="sm" variant="light" color={STATUS_COLORS[inv.status] || 'gray'}>
        {inv.status === 'paid' ? 'PAID' : inv.status.toUpperCase()}
      </Badge>
    )
  }

  // Calculate totals
  const totalOutstanding = invoices.reduce((sum, inv) => {
    if (inv.is_partial) return sum + inv.remaining_balance
    if (inv.status !== 'paid') return sum + Number(inv.total_amount)
    return sum
  }, 0)

  const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.amount_paid || 0), 0)

  return (
    <div className="p-4 pb-8">
      <div className="mb-5">
        <Title order={3} className="text-text-700 font-bold text-lg">My Invoices</Title>
        <Text size="xs" className="text-text-300 mt-0.5">Your billing history</Text>
      </div>

      {/* Summary Cards including Credit Balance */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Paper shadow="xs" radius="lg" p="md" className="bg-white">
            <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
              Total Outstanding
            </Text>
            <Text fw={700} className={`text-lg leading-tight ${totalOutstanding > 0 ? 'text-red-500' : 'text-secondary-400'}`}>
              KES {totalOutstanding.toLocaleString()}
            </Text>
            <Text size="xs" className="text-text-200 mt-1">
              Across {invoices.filter(i => i.status !== 'paid' || i.is_partial).length} invoices
            </Text>
          </Paper>

          <Paper shadow="xs" radius="lg" p="md" className="bg-white">
            <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
              Total Paid
            </Text>
            <Text fw={700} className="text-lg leading-tight text-green-600">
              KES {totalPaid.toLocaleString()}
            </Text>
            <Text size="xs" className="text-text-200 mt-1">
              Lifetime payments
            </Text>
          </Paper>

          <Paper shadow="xs" radius="lg" p="md" className="bg-white">
            <Text size="xs" className="text-text-300 uppercase tracking-wide mb-1 leading-tight">
              Credit Balance
            </Text>
            <Text fw={700} className={`text-lg leading-tight ${creditBalance > 0 ? 'text-teal-600' : 'text-text-300'}`}>
              KES {creditBalance.toLocaleString()}
            </Text>
            <Text size="xs" className="text-text-200 mt-1">
              Available credit
            </Text>
          </Paper>
        </div>
      )}

      {error && <Alert color="red" radius="md" variant="light" mb="md">{error}</Alert>}

      {loading ? (
        <Stack gap="sm">
          {[...Array(4)].map((_, i) => <Skeleton key={i} height={120} radius="lg" />)}
        </Stack>
      ) : invoices.length === 0 ? (
        <Paper shadow="xs" radius="lg" p="xl" className="bg-white text-center">
          <Text size="sm" className="text-text-300">No invoices found</Text>
        </Paper>
      ) : (
        <Stack gap="sm">
          {invoices.map(inv => {
            const hasPayments = inv.amount_paid > 0
            const isFullyPaid = inv.status === 'paid'
            const isPartiallyPaid = inv.is_partial && !isFullyPaid && inv.remaining_balance > 0
            const isOverdue = inv.status === 'overdue'
            
            // What to show as the main amount
            let displayAmount = inv.total_amount
            let showStrikethrough = false
            
            if (isFullyPaid) {
              displayAmount = 0
              showStrikethrough = true
            } else if (isPartiallyPaid) {
              displayAmount = inv.remaining_balance
              showStrikethrough = true
            }
            
            return (
              <Paper key={inv.id} shadow="xs" radius="lg" p="md" className="bg-white"
                onClick={() => setSelected(inv)}
                style={{ cursor: 'pointer' }}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0 mr-3 flex-1">
                    <Text size="sm" fw={700} className="text-text-700">{inv.invoice_no}</Text>
                    <Text size="xs" className="text-text-300 mt-0.5">
                      {inv.units_consumed} m³ · Due {inv.due_date}
                    </Text>
                    
                    {/* Show payment info for any invoice with payments */}
                    {hasPayments && (
                      <div className="mt-2 space-y-0.5">
                        <div className="flex justify-between">
                          <Text size="xs" className="text-green-600">Amount Paid:</Text>
                          <Text size="xs" fw={600} className="text-green-600">KES {inv.amount_paid.toLocaleString()}</Text>
                        </div>
                        {isPartiallyPaid && (
                          <div className="flex justify-between">
                            <Text size="xs" className="text-orange-500">Remaining Balance:</Text>
                            <Text size="xs" fw={600} className="text-orange-500">KES {inv.remaining_balance.toLocaleString()}</Text>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Show if credit was applied */}
                    {inv.credit_applied > 0 && (
                      <Text size="xs" className="text-teal-600 mt-1">
                        Credit Applied: KES {Number(inv.credit_applied).toLocaleString()}
                      </Text>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isFullyPaid ? (
                      <Text size="sm" fw={700} className="text-green-600">PAID</Text>
                    ) : (
                      <Text size="sm" fw={700} className={isOverdue ? 'text-red-500' : 'text-primary-600'}>
                        KES {displayAmount.toLocaleString()}
                      </Text>
                    )}
                    {showStrikethrough && (
                      <Text size="xs" className="text-text-300 line-through">
                        KES {Number(inv.total_amount).toLocaleString()}
                      </Text>
                    )}
                    <div className="mt-1">
                      {getStatusBadge(inv)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={e => { e.stopPropagation(); setSelected(inv) }}
                    className="text-xs text-primary-500 font-medium">
                    View Details
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      handleDownload(inv.id, inv.invoice_no)
                    }}
                    disabled={downloading === inv.id}
                    className="text-xs text-secondary-400 font-medium disabled:opacity-50">
                    {downloading === inv.id ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
              </Paper>
            )
          })}
        </Stack>
      )}

      {/* Invoice detail modal */}
      <Modal opened={!!selected} onClose={() => setSelected(null)}
        title={<Text fw={600} size="sm" className="text-text-600">{selected?.invoice_no}</Text>}
        radius="lg" size="sm" fullScreen={false}>
        {selected && (
          <Stack gap="sm">
            <div className="bg-gray-50 rounded-xl p-4">
              {[
                ['Billing Period', `${selected.billing_period_start} — ${selected.billing_period_end}`],
                ['Units Consumed', `${selected.units_consumed} m³`],
                ['Amount Due', `KES ${Number(selected.amount_due).toLocaleString()}`],
                ['Tax', `KES ${Number(selected.tax_amount).toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label}
                  className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <Text size="xs" className="text-text-300">{label}</Text>
                  <Text size="xs" fw={600} className="text-text-600 text-right ml-4">{value}</Text>
                </div>
              ))}
              
              {/* Credit Applied (if any) */}
              {Number(selected.credit_applied) > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <Text size="xs" className="text-text-300">Credit Applied</Text>
                  <Text size="xs" fw={600} className="text-teal-600">
                    - KES {Number(selected.credit_applied).toLocaleString()}
                  </Text>
                </div>
              )}
              
              {/* Payment breakdown */}
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex justify-between py-2">
                  <Text size="xs" className="text-text-300">Total Amount</Text>
                  <Text size="xs" fw={600} className="text-text-600">
                    KES {Number(selected.total_amount).toLocaleString()}
                  </Text>
                </div>
                {Number(selected.amount_paid || 0) > 0 && (
                  <div className="flex justify-between py-2">
                    <Text size="xs" className="text-text-300">Amount Paid</Text>
                    <Text size="xs" fw={600} className="text-green-600">
                      KES {Number(selected.amount_paid).toLocaleString()}
                    </Text>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <Text size="xs" className="text-text-300">Remaining Balance</Text>
                  <Text size="xs" fw={700} className={selected.remaining_balance > 0 ? 'text-red-500' : 'text-green-600'}>
                    KES {Number(selected.remaining_balance || selected.total_amount).toLocaleString()}
                  </Text>
                </div>
              </div>
              
              {[
                ['Due Date', selected.due_date],
              ].map(([label, value]) => (
                <div key={label}
                  className="flex justify-between py-2 border-b border-gray-100 last:border-0">
                  <Text size="xs" className="text-text-300">{label}</Text>
                  <Text size="xs" fw={600} className="text-text-600 text-right ml-4">{value}</Text>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Badge size="sm" radius="md" variant="light"
                color={selected.is_partial ? 'blue' : (STATUS_COLORS[selected.status] || 'gray')} 
                className="self-start">
                {selected.is_partial ? `PARTIAL (${selected.percent_paid}%)` : selected.status.toUpperCase()}
              </Badge>
              {selected.is_partial && (
                <Badge size="sm" radius="md" variant="light" color="yellow">
                  {selected.percent_paid}% Paid
                </Badge>
              )}
              {Number(selected.credit_applied) > 0 && (
                <Badge size="sm" radius="md" variant="light" color="teal">
                  Credit Used: KES {Number(selected.credit_applied).toLocaleString()}
                </Badge>
              )}
            </div>
            
            <Button fullWidth radius="md" loading={downloading === selected.id}
              onClick={() => handleDownload(selected.id, selected.invoice_no)}
              className="bg-primary-500 hover:bg-primary-600">
              Download PDF
            </Button>
          </Stack>
        )}
      </Modal>
    </div>
  )
}