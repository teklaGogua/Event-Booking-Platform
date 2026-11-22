import { createContext, useContext, useEffect, useState } from 'react'
import { auth } from '../api/index.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auth.me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const value = {
    user,
    loading,
    login: async (credentials) => {
      const data = await auth.login(credentials)
      setUser(data.user)
    },
    register: async (details) => {
      const data = await auth.register(details)
      setUser(data.user)
    },
    logout: async () => {
      await auth.logout()
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)