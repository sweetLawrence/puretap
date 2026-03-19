import { useState } from 'react'
import { Paper, Title, Text, Button, Alert, Group } from '@mantine/core'
import api from '../utils/api'

export default function Notifications() {
  const [invoiceId, setInvoiceId] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [overdueId, setOverdueId] = useState('')
  const [readingId, setReadingId] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, string>>({})

  const send = async (type: string, id: string, endpoint: string) => {
    if (!id) { setResults({ ...results, [type]: 'Please enter an ID' }); return }
    setLoading(type)
    try {
      await api.post(`/notifications/${endpoint}/${id}`)
      setResults({ ...results, [type]: 'Sent successfully' })
    } catch (err: any) {
      setResults({ ...results, [type]: err.response?.data?.message || 'Failed to send' })
    } finally {
      setLoading(null)
    }
  }

  const NotifCard = ({
    type, title, description, placeholder, value,
    onChange, endpoint, color
  }: {
    type: string, title: string, description: string,
    placeholder: string, value: string, onChange: (v: string) => void,
    endpoint: string, color: string
  }) => (
    <Paper shadow="xs" radius="lg" p="lg" className="bg-white">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </div>
      <Text fw={600} size="sm" className="text-text-600 mb-1">{title}</Text>
      <Text size="xs" className="text-text-300 mb-3">{description}</Text>
      {results[type] && (
        <Alert
          color={results[type].includes('success') ? 'green' : 'red'}
          radius="md" variant="light" mb="sm" >
          {results[type]}
        </Alert>
      )}
      <Group gap="sm">
        <input
          type="text" placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
        <Button radius="md" size="sm" loading={loading === type}
          onClick={() => send(type, value, endpoint)}
          className="bg-primary-500 hover:bg-primary-600">
          Send
        </Button>
      </Group>
    </Paper>
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title order={3} className="text-text-700 font-bold">Notifications</Title>
        <Text size="sm" className="text-text-300 mt-1">
          Manually trigger Telegram and email notifications
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NotifCard
          type="invoice" title="Invoice Notification"
          description="Send invoice details to customer via Telegram and email"
          placeholder="Invoice ID e.g. 1"
          value={invoiceId} onChange={setInvoiceId}
          endpoint="invoice" color="bg-primary-500"
        />
        <NotifCard
          type="payment" title="Payment Confirmation"
          description="Send payment confirmation to customer"
          placeholder="Payment ID e.g. 1"
          value={paymentId} onChange={setPaymentId}
          endpoint="payment" color="bg-secondary-300"
        />
        <NotifCard
          type="overdue" title="Overdue Reminder"
          description="Send overdue invoice reminder to customer"
          placeholder="Invoice ID e.g. 4"
          value={overdueId} onChange={setOverdueId}
          endpoint="overdue" color="bg-accent-600"
        />
        <NotifCard
          type="flagged" title="Flagged Reading Alert"
          description="Alert all admins about a flagged reading"
          placeholder="Reading ID e.g. 10"
          value={readingId} onChange={setReadingId}
          endpoint="flagged" color="bg-red-400"
        />
      </div>
    </div>
  )
}
