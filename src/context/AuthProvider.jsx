import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

const USERS = {
    'Adwait': { name: 'Adwait', role: 'admin' },
    'Avani': { name: 'Avani', role: 'admin' },
    'Binay': { name: 'Binay', role: 'staff' }
}

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [userProfile, setUserProfile] = useState(() => {
        const saved = localStorage.getItem('poshakh-user')
        return saved ? JSON.parse(saved) : null
    })
    const [loading, setLoading] = useState(false)

    const login = async (name) => {
        const normalizedName = name.trim()
        const user = USERS[normalizedName]

        if (!user) {
            return { ok: false, message: 'User not found. Please use: Adwait, Avani, or Binay' }
        }

        setUserProfile(user)
        localStorage.setItem('poshakh-user', JSON.stringify(user))
        return { ok: true }
    }

    const logout = async () => {
        setUserProfile(null)
        localStorage.removeItem('poshakh-user')
    }

    const value = {
        userProfile,
        loading,
        login,
        logout,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
