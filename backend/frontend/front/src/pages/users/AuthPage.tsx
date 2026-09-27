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
        <label>Электронная почта<input type="email" placeholder="name@example.com" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
      </>}
      <label>Логин<input required autoComplete="username" placeholder="Введите логин" value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} /></label>
      <label>Пароль<input required type="password" autoComplete={signup ? 'new-password' : 'current-password'} minLength={8} placeholder="Не менее 8 символов" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
      <button className="button primary">{signup ? 'Зарегистрироваться' : 'Войти'}</button>
    </form>
    <div className="auth-divider"><span>или</span></div>
    <button className="button auth-github-button" type="button" onClick={signInWithGitHub}>
      Продолжить с GitHub
    </button>
    <Notice text={message} error />
    <p>{signup ? <>Уже есть аккаунт? <Link to="/signin">Войти</Link></> : <>Нет аккаунта? <Link to="/signup">Зарегистрироваться</Link></>}</p>
  </section>
}
