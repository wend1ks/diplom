import { useEffect, useState } from 'react'
import { request } from '../../lib/api'
import Link from '../../components/Link'

type CountResponse = { count?: number; results?: unknown[] }

function count(data: CountResponse | unknown[]) {
  return Array.isArray(data) ? data.length : data.count ?? data.results?.length ?? 0
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ courses: 0, modules: 0, lessons: 0, requests: 0 })

  useEffect(() => {
    Promise.all([
      request('/courses/'),
      request('/modules/'),
      request('/lessons/'),
      request('/teacher-requests/'),
    ]).then(([courses, modules, lessons, requests]) => {
      setStats({
        courses: count(courses),
        modules: count(modules),
        lessons: count(lessons),
        requests: count(requests),
      })
    }).catch(() => undefined)
  }, [])

  return (
    <section className="admin-area">
      <div className="admin-page">
        <nav className="admin-topbar">
          <Link to="/admin" className="admin-brand"><span className="admin-brand-mark">Py</span> Панель управления</Link>
          <div className="admin-nav">
            <Link to="/admin">Обзор</Link>
            <Link to="/admin/courses">Курсы</Link>
            <Link to="/admin/assignments">Самостоятельные</Link>
            <Link to="/admin/teacher-requests">Заявки</Link>
          </div>
          <div className="admin-user">
            <Link to="/profile">Профиль</Link>
            <Link to="/">Выйти</Link>
          </div>
        </nav>
        <div className="admin-header">
          <div>
            <p className="admin-eyebrow">PyLearn / Панель управления</p>
            <h1 className="admin-heading">Добро пожаловать</h1>
            <p className="admin-subtitle">Управляйте учебной программой из одного места.</p>
          </div>
          <Link to="/admin/courses" className="admin-button">+ Добавить курс</Link>
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
              <strong>Учебные курсы →</strong>
              <p>Добавляйте курсы, меняйте их описание и переходите к структуре модулей.</p>
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
          {stats.requests > 0 && (
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
