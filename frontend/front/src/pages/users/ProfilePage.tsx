/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { request } from '../../lib/api'
import Link from '../../components/Link'
import Notice from '../../components/Notice'
import PageLoader from '../../components/PageLoader'

type Course = { id: number; title: string; slug: string; progress?: { percent?: number; completed_items?: number; total_items?: number; completed_lessons?: number; total_lessons?: number; reviewed_assignments?: number; total_assignments?: number } }

function Avatar({ name, image, className = 'profile-avatar' }: { name: string; image?: string | null; className?: string }) {
  return <div className={className}>{image ? <img src={image} alt={`Фото профиля ${name}`} /> : name[0].toUpperCase()}</div>
}

export default function ProfilePage({ edit = false }: { edit?: boolean }) {
  const [me, setMe] = useState<any>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => { Promise.all([request('/auth/me/'), request('/courses/')]).then(([user, data]) => { setMe(user); setCourses(data.results || data) }).catch(error => { setMessage(error.message); setIsError(true) }) }, [])
  const totals = useMemo(() => courses.reduce((sum, course) => { const progress = course.progress || {}; sum.completed += progress.completed_items || 0; sum.items += progress.total_items || 0; sum.lessonsDone += progress.completed_lessons || 0; sum.lessons += progress.total_lessons || 0; sum.assignmentsDone += progress.reviewed_assignments || 0; sum.assignments += progress.total_assignments || 0; return sum }, { completed: 0, items: 0, lessonsDone: 0, lessons: 0, assignmentsDone: 0, assignments: 0 }), [courses])
  const percent = totals.items ? Math.round(totals.completed * 100 / totals.items) : 0

  async function save(event: FormEvent) {
    event.preventDefault()
    const data = new FormData()
    data.append('first_name', me.first_name || '')
    data.append('last_name', me.last_name || '')
    data.append('email', me.email || '')
    if (photo) data.append('user_image', photo)
    try { setMe(await request('/auth/me/', { method: 'PATCH', body: data })); setPhoto(null); setMessage('Профиль сохранён.'); setIsError(false) }
    catch (error) { setMessage((error as Error).message); setIsError(true) }
  }

  if (!me) return <PageLoader label="Загружаем профиль…" />
  const role = ({ student: 'Ученик', teacher: 'Преподаватель', admin: 'Администратор' } as Record<string, string>)[String(me.role)] || String(me.role)
  const name = `${me.first_name || ''} ${me.last_name || ''}`.trim() || me.username
  const avatarImage = photoPreview || me.user_image

  if (edit) return <section className="page profile-edit-page"><Link className="profile-back" to="/profile">← К профилю</Link><form className="card profile-edit-form" onSubmit={save}><p className="eyebrow">Настройки аккаунта</p><h1>Редактирование профиля</h1><div className="profile-photo-control"><label className="profile-photo-picker" title="Сменить фотографию"><Avatar name={name} image={avatarImage} className="profile-edit-avatar" /><span>Сменить фото</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; if (!file) return; setPhoto(file); setPhotoPreview(URL.createObjectURL(file)) }} /></label><p>PNG, JPG или WebP</p></div><label>Имя<input value={me.first_name || ''} onChange={event => setMe({ ...me, first_name: event.target.value })} /></label><label>Фамилия<input value={me.last_name || ''} onChange={event => setMe({ ...me, last_name: event.target.value })} /></label><label>Электронная почта<input type="email" value={me.email || ''} onChange={event => setMe({ ...me, email: event.target.value })} /></label><button className="button primary">Сохранить изменения</button><Notice text={message} error={isError} /></form></section>

  return <section className="page profile-page"><header className="profile-hero card"><Avatar name={name} image={me.user_image} /><div className="profile-identity"><p className="eyebrow">Личный кабинет</p><h1>{name}</h1><p>@{me.username} · {me.email || 'Почта не указана'}</p><span className="profile-role">{role}</span></div><div className="profile-actions"><Link to="/profile/edit" className="button outline">Редактировать профиль</Link>{me.role === 'student' && <Link to="/teacher-request" className="button ghost">Стать преподавателем</Link>}</div></header><section className="profile-progress card"><div className="profile-progress-main"><p className="eyebrow">Мой прогресс</p><h2>Продолжайте в своём темпе</h2><p>Выполнено {totals.completed} из {totals.items} элементов программы.</p><div className="profile-progress-bar" aria-label={`Общий прогресс: ${percent}%`}><i style={{ width: `${percent}%` }} /></div></div><div className="profile-percent"><strong>{percent}%</strong><span>завершено</span></div></section><section className="profile-stats" aria-label="Статистика обучения"><article className="profile-stat card"><span>◉</span><div><strong>{totals.lessonsDone}/{totals.lessons}</strong><p>уроков пройдено</p></div></article><article className="profile-stat card"><span>✓</span><div><strong>{totals.assignmentsDone}/{totals.assignments}</strong><p>заданий проверено</p></div></article><article className="profile-stat card"><span>▣</span><div><strong>{courses.length}</strong><p>курсов доступно</p></div></article></section><section className="profile-courses"><div className="profile-section-heading"><div><p className="eyebrow">По курсам</p><h2>Прогресс обучения</h2></div><Link to="/courses" className="button ghost">Все курсы →</Link></div><div className="profile-course-list">{courses.map(course => { const progress = course.progress || {}; const coursePercent = progress.percent || 0; return <article className="profile-course card" key={course.id}><div className="profile-course-title"><span className="course-mark">Py</span><div><h3>{course.title}</h3><p>{progress.completed_items || 0} из {progress.total_items || 0} элементов выполнено</p></div></div><div className="profile-course-meter"><strong>{coursePercent}%</strong><div className="progress"><i style={{ width: `${coursePercent}%` }} /></div><small>Уроки: {progress.completed_lessons || 0}/{progress.total_lessons || 0} · Задания: {progress.reviewed_assignments || 0}/{progress.total_assignments || 0}</small></div><Link to={`/courses/${course.slug}`} className="button outline">Открыть</Link></article> })}</div>{!courses.length && <div className="profile-empty card">Пока нет доступных курсов. Начните обучение, чтобы увидеть прогресс.</div>}</section><Notice text={message} error={isError} /></section>
}

