import { useState } from 'react'
import { Paper, Title, Text, Button, Alert } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { saveAuth } from '../utils/auth'

export default function Login () {
  const navigate = useNavigate()
  const [form, setForm] = useState({ account_no: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  //   const handleLogin = async () => {
  //     if (!form.account_no || !form.phone) {
  //       setError('Please enter your account number and phone number')
  //       return
  //     }
  //     setLoading(true)
  //     setError('')
  //     try {
  //       const res = await api.post('/auth/customer-login', form)
  //       const { accessToken, customer } = res.data.data
  //       saveAuth(accessToken, customer)
  //       navigate('/dashboard')
  //     } catch (err: any) {
  //       setError(err.response?.data?.message || 'Login failed. Check your details.')
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '')
    if (digits.startsWith('254')) return `+${digits}`
    if (digits.startsWith('0')) return `+254${digits.slice(1)}`
    if (digits.startsWith('7') || digits.startsWith('1')) return `+254${digits}`
    return `+${digits}`
  }

  const handleLogin = async () => {
    if (!form.account_no || !form.phone) {
      setError('Please enter your account number and phone number')
      return
    }

    const normalizedPhone = normalizePhone(form.phone.trim())
    const normalizedAccount = form.account_no.trim().toUpperCase()

    // console.log('RAW INPUT:', {
    //   account_no: form.account_no,
    //   phone: form.phone
    // })
    // console.log('NORMALIZED:', {
    //   account_no: normalizedAccount,
    //   phone: normalizedPhone
    // })

    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/customer-login', {
        account_no: normalizedAccount,
        phone: normalizedPhone
      })
      //   console.log('LOGIN RESPONSE:', res.data)

      if (!res.data?.data?.accessToken) {
        setError('Login failed. Please try again.')
        return
      }
      
      const { accessToken, customer } = res.data.data
      saveAuth(accessToken, customer)
      navigate('/dashboard')
    } catch (err: any) {
      console.log('LOGIN FAILED:', err.response?.status, err.response?.data)
      setError(
        err.response?.data?.message || 'Login failed. Check your details.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-back-500 flex items-center justify-center px-4'>
      <div className='w-full max-w-md'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 mb-4'>
            <svg width='28' height='28' viewBox='0 0 24 24' fill='white'>
              <path d='M12 2C8 7 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-7-8-12z' />
            </svg>
          </div>
          <Title order={2} className='text-text-700 font-bold'>
            PureTap
          </Title>
          <Text size='sm' className='text-text-300 mt-1'>
            Customer Self-Service Portal
          </Text>
        </div>

        <Paper shadow='xs' radius='lg' p='xl' className='bg-white'>
          <Title order={4} className='text-text-600 mb-1'>
            Sign in
          </Title>
          <Text size='sm' className='text-text-300 mb-6'>
            Use your account number and registered phone number
          </Text>

          {error && (
            <Alert color='red' radius='md' variant='light' mb='md'>
              {error}
            </Alert>
          )}

          <div className='flex flex-col gap-4'>
            <div>
              <label className='block text-sm font-medium text-text-500 mb-1'>
                Account Number
              </label>
              <input
                type='text'
                placeholder='e.g. GT-0001'
                value={form.account_no}
                onChange={e => setForm({ ...form, account_no: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className='w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300'
              />
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-text-500 mb-1">Phone Number</label>
              <input type="text" placeholder="e.g. +254700000000"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div> */}

            <div>
              <label className='block text-sm font-medium text-text-500 mb-1'>
                Phone Number
              </label>
              <input
                type='tel'
                placeholder='e.g. 0712345678'
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className='w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-text-600 focus:outline-none focus:ring-2 focus:ring-primary-300'
              />
              <Text size='xs' className='text-text-200 mt-1'>
                Enter your number in any format — 0712..., 254712..., or
                +254712...
              </Text>
            </div>
            <Button
              fullWidth
              size='md'
              radius='md'
              loading={loading}
              onClick={handleLogin}
              className='bg-primary-500 hover:bg-primary-600 mt-2'
            >
              Sign in
            </Button>
          </div>
        </Paper>

        <Text size='xs' className='text-text-200 text-center mt-6'>
          PureTap &copy; {new Date().getFullYear()} — Gitaru Town Water Services
        </Text>
      </div>
    </div>
  )
}
