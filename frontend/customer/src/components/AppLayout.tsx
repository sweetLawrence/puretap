import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AppShell, Burger, Text, UnstyledButton } from '@mantine/core'
import { clearAuth, getCustomer } from '../utils/auth'

const navItems = [
  {
    label: 'Dashboard', path: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    )
  },
  {
    label: 'Invoices', path: '/invoices',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="12" y1="17" x2="8" y2="17" />
      </svg>
    )
  },
  {
    label: 'Payments', path: '/payments',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    )
  },
  {
    label: 'Consumption', path: '/consumption',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    )
  },
]

export default function AppLayout() {
  const [opened, setOpened] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const customer = getCustomer()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'md', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header className="border-b border-gray-100 bg-white flex items-center px-4 gap-3">
        <Burger opened={opened} onClick={() => setOpened(!opened)} hiddenFrom="md" size="sm" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8 7 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-7-8-12z" />
            </svg>
          </div>
          <Text fw={700} size="sm" className="text-text-700">PureTap</Text>
        </div>
        <div className="ml-auto flex items-center gap-6">
          <Text size="sm" className="text-text-400 hidden sm:block">{customer?.account_no}</Text>
          <UnstyledButton onClick={handleLogout} className="text-text-300 hover:text-red-500 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </UnstyledButton>
        </div>
      </AppShell.Header>

      <AppShell.Navbar p="sm" className="bg-white border-r border-gray-100">
        <div className="flex flex-col gap-6">
          {navItems.map(item => {
            const active = location.pathname === item.path
            return (
              <UnstyledButton key={item.path}
                onClick={() => { navigate(item.path); setOpened(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  active
                    ? 'bg-primary-500 text-white font-semibold'
                    : 'text-text-400 hover:bg-primary-50 hover:text-primary-600'
                }`}>
                <span className={active ? 'text-white' : 'text-text-300'}>{item.icon}</span>
                {item.label}
              </UnstyledButton>
            )
          })}
        </div>

        <div className="border-t border-gray-100 pt-3 mt-auto">
          <div className="px-3 py-2">
            <Text size="xs" fw={600} className="text-text-600">{customer?.full_name}</Text>
            <Text size="xs" className="text-text-200 truncate">{customer?.phone}</Text>
          </div>
        </div>
      </AppShell.Navbar>

      <AppShell.Main className="bg-back-500">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}