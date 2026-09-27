import { useEffect, useState } from 'react'
import { request } from '../../lib/api'
import Link from '../../components/Link'

type CountResponse = { count?: number; results?: unknown[] }

function count(data: CountResponse | unknown[]) {
  return Array.isArray(data) ? data.length : data.count ?? data.results?.length ?? 0
}

export default function AdminDashboardPage({ role = 'admin' }: { role?: string }) {
  const isTeacher = role === 'teacher'
  const [stats, setStats] = useState({ courses: 0, modules: 0, lessons: 0, requests: 0 })

  useEffect(() => {
    const requests = [
      request('/courses/'),
      request('/modules/'),
      request('/lessons/'),
    ]
    if (!isTeacher) requests.push(request('/teacher-requests/'))
    Promise.all(requests).then(([courses, modules, lessons, teacherRequests]) => {
      setStats({
        courses: count(courses),
        modules: count(modules),
        lessons: count(lessons),
        requests: isTeacher ? 0 : count(teacherRequests),
      })
    }).catch(() => undefined)
  }, [isTeacher])

  return (
    <section className="admin-area">
      <div className="admin-page">
        <nav className="admin-topbar">
          <Link to="/admin" className="admin-brand"><span className="admin-brand-mark">Py</span> {isTeacher ? 'Кабинет преподавателя' : 'Панель управления'}</Link>
          <div className="admin-nav">
            <Link to="/admin">{isTeacher ? 'Мой кабинет' : 'Обзор'}</Link>
            <Link to="/admin/courses">{isTeacher ? 'Мои курсы' : 'Курсы'}</Link>
            <Link to="/admin/assignments">Задания</Link>
            {!isTeacher && <Link to="/admin/teacher-requests">Заявки</Link>}
          </div>
          <div className="admin-user">
            <Link to="/profile">Профиль</Link>
            <Link to="/">Выйти</Link>
          </div>
        </nav>
        <div className="admin-header">
          <div>
            <p className="admin-eyebrow">PyLearn / {isTeacher ? 'Кабинет преподавателя' : 'Панель управления'}</p>
            <h1 className="admin-heading">{isTeacher ? 'Ваши курсы и задания' : 'Добро пожаловать'}</h1>
            <p className="admin-subtitle">{isTeacher ? 'Создавайте курсы и проверяйте работы учеников.' : 'Управляйте учебной программой из одного места.'}</p>
          </div>
          <Link to="/admin/courses" className="admin-button">{isTeacher ? '+ Создать курс' : '+ Добавить курс'}</Link>
        </div>

        <section className="admin-grid">
          <div className="admin-stat">
            <div className="admin-stat-label">Курсы</div>
            <div className="admin-stat-value">{stats.courses}</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-label">Модули</div>
            <div className="admin-stat-value">{stats.modules}</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat-label">Уроки</div>
            <div className="admin-stat-value">{stats.lessons}</div>
          </div>
        </section>

        <div className="admin-welcome">
          <p className="admin-eyebrow">Быстрые действия</p>
        </div>
        <div className="admin-card-grid">
          <Link className="admin-quick-link" to="/admin/courses">
            <div className="admin-card">
              <strong>{isTeacher ? 'Мои курсы →' : 'Учебные курсы →'}</strong>
              <p>{isTeacher ? 'Создавайте курсы и управляйте их модулями и уроками.' : 'Добавляйте курсы, меняйте их описание и переходите к структуре модулей.'}</p>
            </div>
          </Link>
        </div>
        <div className="admin-card-grid">
          <Link className="admin-quick-link" to="/admin/assignments">
            <div className="admin-card">
              <strong>Самостоятельные работы →</strong>
              <p>Создавайте задания и проверяйте отправленные решения учеников.</p>
            </div>
          </Link>
          {!isTeacher && stats.requests > 0 && (
            <Link className="admin-quick-link" to="/admin/teacher-requests">
              <div className="admin-card">
                <strong>Заявки преподавателей →</strong>
                <p>На рассмотрении: {stats.requests}.</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
