'use client'
import { Icon } from "@/components/UI/Icon"
import { HOME_BY_ROLE } from "@/auth/roles"
import { useRouter } from "next/navigation"
import { useAuth } from "@/auth/AuthContext"
import { useEffect, useState } from "react"
import { Button } from "@/components/UI/primitives"

const DEMOS = [
  { login: 'admin', password: 'admin123', label: 'Админ' },
  { login: 'dean', password: 'dean123', label: 'Деканат' },
  { login: 'teacher1', password: 'teacher123', label: 'Преподаватель' },
  { login: 'student1', password: 'student123', label: 'Студент' },
]

export default function Login() {
    const { login, user, ready } = useAuth()
    const router = useRouter()
    const [loginValue, setLoginValue] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        if (ready && user) router.replace(HOME_BY_ROLE[user.role])
    }, [ready, user, router])

    async function submit(nextLogin, nextPassword) {
        setError('')
        setBusy(true)
        try {
            const next = await login(nextLogin, nextPassword)
            router.replace(HOME_BY_ROLE[next.role])
        } catch (err) {
            setError(err.message)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="loginPage">
            <div className="login">
                <div className="header">
                    <div className="logo"> <Icon name="cap" /></div>
                    <div className="title">
                       <h1>Учет успеваемости</h1>
                       <p className="subtitle">Информационная система деканата</p>
                    </div>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); submit(loginValue, password) }}>
                    <div className="field">
                        <label htmlFor="login">Логин</label>
                        <input id="login" className="input" autoComplete="username" value={loginValue} onChange={(e) => setLoginValue(e.target.value)}/>
                    </div>
                    <div className="field">
                        <label htmlFor="password">Пароль</label>
                        <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}/>
                    </div>
                    {error ? <p className="errorText">{error}</p> : null}
                    <Button type="submit" disabled={busy}>{busy ? 'Вход…' : 'Войти'}</Button>
                </form>
                <div className="demo">
                    <p className="subtitle">Быстрый вход по роли</p>
                    <div className="demoBlock">
                        {DEMOS.map((item) => (
                        <Button
                            key={item.login}
                            variant="ghost"
                            disabled={busy}
                            onClick={() => submit(item.login, item.password)}
                        >
                            {item.label}
                        </Button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
