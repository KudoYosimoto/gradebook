import { useAuth } from "@/auth/AuthContext"
import { CRUMBS, ROLE_LABEL } from "@/auth/roles"
import { usePathname } from "next/navigation"
import { Button } from "../UI/primitives"

export default function TopBar(){
    const {user, logout} = useAuth()
    const pathname = usePathname().split('/').filter(Boolean).at(-1)
    const crumbs = CRUMBS[pathname] || ["Система", "Страница"]

    if (!user) return null

    return (
        <header className="topbar">
        <div className="crumbs">
            {crumbs.map((crumb, index) => (
                <p
                    key= {crumb}
                    className={index === crumbs.length - 1 ? "" : "subtitle"}
                >
                    {index !== 0 && '/ '}
                    {crumb}
                </p>
            ))}
        </div>
        <div className="user">
            <p className='subtitle'>{ROLE_LABEL[user.role]}</p>
            <strong>{user.name}</strong>
            {/* После выхода user = null, и каркас кабинета сам перекинет на /login */}
            <Button className='subtitle' onClick={() => logout()}>Выйти</Button>
        </div>
        </header>
    )
}
