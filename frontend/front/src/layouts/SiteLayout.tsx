import type { ReactNode } from 'react'
import type { RecordData } from '../lib/api'
import Link from '../components/Link'
export default function SiteLayout({ children, me, onLogout }: { children: ReactNode; me: RecordData | null; onLogout: () => void }) {
  return <><header className="topbar"><Link to="/" className="brand"><b>Py</b>PyLearn</Link><nav><Link to="/">Карьера</Link><Link to="/courses">Курсы</Link><Link to="/">Программа</Link><Link to="/">Тарифы</Link></nav><div className="actions">{me ? <><Link to="/profile" className="button ghost">Профиль</Link>{(me.role === 'admin' || me.role === 'teacher') && <Link to="/admin" className="button primary">{me.role === 'teacher' ? 'Кабинет преподавателя' : 'Админ-панель'}</Link>}<button className="button ghost" onClick={onLogout}>Выйти</button></> : <><Link to="/signin" className="button ghost">Войти</Link><Link to="/signup" className="button primary">Начать бесплатно</Link></>}</div></header><main>{children}</main></>
}
