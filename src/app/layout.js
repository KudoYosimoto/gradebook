import { Golos_Text } from 'next/font/google'
import AuthProvider from '@/auth/AuthContext'
import ToastProvider from '@/components/UI/Toast'
import './global.css'

const golos = Golos_Text({
  subsets: ['cyrillic', 'latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-golos',
  display: 'swap',
})

export const metadata = {
  title: 'Успеваемость',
  description: 'Информационная система учёта успеваемости студентов',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={golos.variable}>
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
