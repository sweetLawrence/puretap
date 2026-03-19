export const getUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export const getToken = () => localStorage.getItem('token')

export const saveAuth = (token: string, user: object) => {
  localStorage.setItem('token', token)
  localStorage.setItem('user', JSON.stringify(user))
}

export const clearAuth = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const isAuthenticated = () => !!getToken()