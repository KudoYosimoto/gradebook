import Link from 'next/link'
import { useAuth } from '@/auth/AuthContext'
import { Icon } from '../UI/Icon'
import { MENU, ROLE_LABEL } from '@/auth/roles'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
    const { user } = useAuth()
    const items = MENU.filter((item) => item.roles.includes(user.role))
    const pathname = usePathname()

    return (
      <aside className="sidebar">
        <div className='brand'>
          <div className="header">
            <div className="logo"> <Icon name="cap" /></div>
              <div className="title">
                <h1>Успеваемость</h1>
            </div>
          </div>
        </div>
        <nav>
            {items.map(item => (
              <Link
                key={item.id}
                href={item.to}
                className= {item.to === pathname ? 'block active' :'block'}
              >
                <Icon name={item.icon} />
                <p>{item.label}</p>
              </Link>
            ))}
        </nav>
        <div className='user'>
            <div className='avatar'><h2>{user.short}</h2></div>
            <div className='block'>
                <h2 className='name'>{user.name}</h2>
                <p className='subtitle'>{ROLE_LABEL[user.role]}</p>
            </div>
        </div>
      </aside>
    )
}
