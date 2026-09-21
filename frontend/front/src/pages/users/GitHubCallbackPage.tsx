import { useEffect, useState } from 'react'
import { go, request } from '../../lib/api'

export default function GitHubCallbackPage({ onAuth }: { onAuth: () => Promise<void> | void }) {
  const [message, setMessage] = useState('Завершаем вход через GitHub…')

  useEffect(() => {
    const ticket = new URLSearchParams(window.location.hash.split('?')[1] || '').get('ticket')
    if (!ticket) {
      setMessage('Не получен код авторизации GitHub.')
      return
    }
    request('/auth/github/complete/', { method: 'POST', body: JSON.stringify({ ticket }) })
      .then(async tokens => {
        localStorage.setItem('access', tokens.access)
        localStorage.setItem('refresh', tokens.refresh)
        await onAuth()
        go('/courses')
      })
      .catch(error => setMessage(`Не удалось завершить вход: ${(error as Error).message}`))
  }, [onAuth])

  return <section className="auth card"><h1>GitHub</h1><p>{message}</p></section>
}
