export const getCustomer = () => {
  const c = localStorage.getItem('customer')
  return c ? JSON.parse(c) : null
}

export const saveAuth = (token: string, customer: object) => {
  localStorage.setItem('customer_token', token)
  localStorage.setItem('customer', JSON.stringify(customer))
}

export const clearAuth = () => {
  localStorage.removeItem('customer_token')
  localStorage.removeItem('customer')
}

export const isAuthenticated = () => !!localStorage.getItem('customer_token')