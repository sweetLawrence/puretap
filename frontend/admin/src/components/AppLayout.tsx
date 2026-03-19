import { useState } from 'react'
import { AppShell, Burger, ScrollArea, Text, UnstyledButton, Badge } from '@mantine/core'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { getUser, clearAuth } from '../utils/auth'

interface NavItem {
  label: string
  path: string
  roles: string[]
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Customers',
    path: '/customers',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: 'Meters',
    path: '/meters',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4l3 3" />
      </svg>
    ),
  },
  {
    label: 'Readings',
    path: '/readings',
    roles: ['admin', 'field_staff'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Tariffs',
    path: '/tariffs',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: 'Invoices',
    path: '/invoices',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="12" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Payments',
    path: '/payments',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    path: '/reports',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    label: 'Notifications',
    path: '/notifications',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: 'Audit Logs',
    path: '/audit-logs',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: 'Users',
    path: '/users',
    roles: ['admin'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    label: 'Submit Reading',
    path: '/submit-reading',
    roles: ['field_staff'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    label: 'My Readings',
    path: '/my-readings',
    roles: ['field_staff'],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
]

export default function AppLayout() {
  const [opened, setOpened] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = getUser()

  const filtered = navItems.filter((item) =>
    item.roles.includes(user?.role)
  )

  const handleLogout = () => {
    clearAuth()
    navigate('/')
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = location.pathname === item.path
    return (
      <UnstyledButton
        onClick={() => {
          navigate(item.path)
          setOpened(false)
        }}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
          transition-all duration-150
          ${active
            ? 'bg-primary-500 text-white font-semibold'
            : 'text-text-400 hover:bg-primary-50 hover:text-primary-600'
          }
        `}
      >
        <span className={active ? 'text-white' : 'text-text-300'}>
          {item.icon}
        </span>
        {item.label}
      </UnstyledButton>
    )
  }

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: 'md', collapsed: { mobile: !opened } }}
      padding="md"
    >
      {/* Header */}
      <AppShell.Header className="border-b border-gray-100 bg-white flex items-center px-4 gap-3">
        <Burger
          opened={opened}
          onClick={() => setOpened(!opened)}
          hiddenFrom="md"
          size="sm"
        />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8 7 4 10.5 4 14a8 8 0 0016 0c0-3.5-4-7-8-12z" />
            </svg>
          </div>
          <Text fw={700} size="sm" className="text-text-700">
            PureTap
          </Text>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Badge
            color={user?.role === 'admin' ? 'blue' : 'green'}
            variant="light"
            size="sm"
            radius="sm"
          >
            {user?.role === 'admin' ? 'Admin' : 'Field Staff'}
          </Badge>
          <Text size="sm" className="text-text-400 hidden sm:block">
            {user?.full_name}
          </Text>
          <UnstyledButton
            onClick={handleLogout}
            className="text-text-300 hover:text-red-500 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </UnstyledButton>
        </div>
      </AppShell.Header>

      {/* Sidebar */}
      <AppShell.Navbar p="sm" className="bg-white border-r border-gray-100">
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1">
            {filtered.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>
        </ScrollArea>

        {/* Bottom user info */}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <div className="px-3 py-2">
            <Text size="xs" fw={600} className="text-text-600">
              {user?.full_name}
            </Text>
            <Text size="xs" className="text-text-200 truncate">
              {user?.email}
            </Text>
          </div>
        </div>
      </AppShell.Navbar>

      {/* Page content */}
      <AppShell.Main className="bg-back-500">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}































