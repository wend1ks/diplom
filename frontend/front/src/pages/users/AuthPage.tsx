import { useState } from 'react'
import type { FormEvent } from 'react'
import { OAUTH_API, request, go } from '../../lib/api'
import Link from '../../components/Link'
import Notice from '../../components/Notice'

export default function AuthPage({ signup, onAuth }: { signup: boolean; onAuth: () => Promise<void> | void }) {
  const [form, setForm] = useState<Record<string, string>>({ username: '', email: '', password: '', first_name: '', last_name: '' })
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setMessage('')
    try {
      if (signup) await request('/auth/register/', { method: 'POST', body: JSON.stringify(form) })
      const tokens = await request('/auth/token/', { method: 'POST', body: JSON.stringify({ username: form.username.trim(), password: form.password }) })
      localStorage.setItem('access', tokens.access)
      localStorage.setItem('refresh', tokens.refresh)
      await onAuth()
      go('/courses')
    } catch (error) {
      const detail = (error as Error).message
      setMessage(detail.includes('No active account') ? 'Неверный логин или пароль.' : `Ошибка входа: ${detail}`)
    }
  }

  function signInWithGitHub() {
    window.location.assign(`${OAUTH_API}/auth/github/`)
  }

  return <section className="auth card">
    <h1>{signup ? 'Создать аккаунт' : 'Вход'}</h1>
    <p>{signup ? 'Создайте аккаунт — и начните изучать Python в своём темпе.' : 'Введите данные своего аккаунта, чтобы продолжить обучение.'}</p>
    <form onSubmit={submit}>
      {signup && <>
        <label>Имя<input placeholder="Введите имя" value={form.first_name} onChange={event => setForm({ ...form, first_name: event.target.value })} /></label>
        <label>Фамилия<input placeholder="Введите фамилию" value={form.last_name} onChange={event => setForm({ ...form, last_name: event.target.value })} /></label>
        <label>Электронная почта<input required type="email" autoComplete="email" placeholder="name@example.com" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
      </>}
      <label>{signup ? 'Логин' : 'Логин или электронная почта'}<input required autoComplete="username" placeholder={signup ? 'Введите логин' : 'Введите логин или почту'} value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} /></label>
      <label>Пароль<input required type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} placeholder="Не менее 8 символов" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
      <button className="button primary">{signup ? 'Зарегистрироваться' : 'Войти'}</button>
    </form>
    <div className="auth-divider"><span>или</span></div>
    <button className="button auth-github-button" type="button" onClick={signInWithGitHub}>
      <svg className="auth-github-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15 1 1.71 2.63 1.22 3.27.93.1-.72.39-1.22.71-1.5-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.45 3.05-1.15 3.05-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.29-2.62 5.23-5.11 5.51.4.35.76 1.03.76 2.08v3.07c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z" />
      </svg>
      <span>Продолжить с GitHub</span>
    </button>
    <Notice text={message} error />
    <p>{signup ? <>Уже есть аккаунт? <Link to="/signin">Войти</Link></> : <>Нет аккаунта? <Link to="/signup">Зарегистрироваться</Link></>}</p>
    {!signup && <p><Link to="/forgot-password">Забыли пароль?</Link></p>}
  </section>
}
