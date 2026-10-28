'use client'

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { HOME_BY_ROLE } from "./roles"
import { loginRequest, logoutRequest, meRequest } from "@/api"

const AuthContext = createContext(null)

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    // ready = «уже спросили сервер». Пока false — не решаем, пускать или редиректить.
    const [ready, setReady] = useState(false)

    useEffect(() => {
        meRequest()
            .then((next) => setUser(next))
            .catch(() => setUser(null))
            .finally(() => setReady(true))
    }, [])

    const value = useMemo(() => ({
        user,
        ready,
        isAuth: Boolean(user),
        homePath: user ? HOME_BY_ROLE[user.role] : '/login',
        async login(login, password){
            const next = await loginRequest(login, password)
            setUser(next)
            return next
        },
        async logout(){
            try { await logoutRequest() } catch { /* cookie всё равно истечёт */ }
            setUser(null)
        },
    }), [user, ready])

    return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth только внутри AuthProvider')
    return ctx
}
