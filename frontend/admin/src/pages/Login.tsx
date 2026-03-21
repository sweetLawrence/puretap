import { useState } from 'react'
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Alert
} from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { saveAuth } from '../utils/auth'

export default function Login () {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e?: React.FormEvent) => {
    // ✅ Prevent page reload
    if (e) e.preventDefault()

    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await api.post('/auth/login', { email, password })

      // ✅ Clean console logging
      // console.log('FULL RESPONSE:', res)
      // console.log('RESPONSE DATA:', res.data)
      // console.log('USER:', res.data.data.user)
      // console.log('TOKEN:', res.data.data.accessToken)

      const { accessToken, user } = res.data.data

      saveAuth(accessToken, user)

      if (user.role === 'admin') {
        navigate('/dashboard')
      } else if (user.role === 'field_staff') {
        navigate('/submit-reading')
      }
    } catch (err: any) {
      console.log('full error:', err.response?.data)
      setError(err.response?.data?.message || 'Login failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-back-500 flex items-center justify-center px-4'>
      <div className='w-full max-w-md sm:max-w-lg'>
        {/* Logo / Brand */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-500 mb-4'>
            <svg width='28' height='28' viewBox='0 0 24 24' fill='none'>
              <path
                d='M12 2C8 7 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-7-8-12z'
                fill='white'
              />
            </svg>
          </div>

          <Title order={2} className='text-text-700 font-bold'>
            PureTap
          </Title>

          <Text size='sm' className='text-text-300 mt-1'>
            Water Billing Management System
          </Text>
        </div>

        {/* Card */}
        <Paper shadow='xs' radius='lg' p='xl' className='bg-white w-full'>
          <Title order={4} className='text-text-600 mb-1'>
            Welcome back
          </Title>

          <Text size='sm' className='text-text-300 mb-6'>
            Sign in to your account to continue
          </Text>

          {error && (
            <Alert color='red' radius='md' className='mb-4' variant='light'>
              {error}
            </Alert>
          )}

          {/* ✅ FORM prevents refresh */}
          <form onSubmit={handleLogin} className='flex flex-col gap-4'>
            <TextInput
              label='Email address'
              placeholder='you@puretap.co.ke'
              value={email}
              onChange={e => setEmail(e.currentTarget.value)}
              radius='md'
              size='md'
              required
            />

            <PasswordInput
              label='Password'
              placeholder='Enter your password'
              value={password}
              onChange={e => setPassword(e.currentTarget.value)}
              radius='md'
              size='md'
              required
            />

            <Button
              type='submit'
              fullWidth
              size='md'
              radius='md'
              loading={loading}
              className='bg-primary-500 hover:bg-primary-600 mt-2'
            >
              Sign in
            </Button>
          </form>
        </Paper>

        <Text size='xs' className='text-text-200 text-center mt-6 px-2'>
          PureTap &copy; {new Date().getFullYear()} — Gitaru Town Water Services
        </Text>
      </div>
    </div>
  )
}
