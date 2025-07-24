import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface User {
  id: number
  username: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface LoginResponse {
  message: string
  token: string
  user: User
}

interface LoginCredentials {
  username: string
  password: string
}

interface ForgotPasswordRequest {
  email: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const navigate = useNavigate()

  const login = async (credentials: LoginCredentials) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      const loginData = data as LoginResponse
      
      // Store token in localStorage
      localStorage.setItem('token', loginData.token)
      localStorage.setItem('user', JSON.stringify(loginData.user))
      
      setUser(loginData.user)
      navigate('/dashboard')
      
      return loginData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const forgotPassword = async (email: string) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setSuccess(data.message)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }, [navigate])

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData) as User
        setUser(user)
        return true
      } catch {
        logout()
        return false
      }
    }
    return false
  }, [logout])

  return {
    user,
    loading,
    error,
    success,
    login,
    forgotPassword,
    logout,
    checkAuth,
  }
} 