import axios from 'axios'

const api = axios.create({
  baseURL: 'https://0f7b-102-212-236-165.ngrok-free.app/api/v1',
  // baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
     'ngrok-skip-browser-warning': 'true'
  },
})



// attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// handle expired token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api