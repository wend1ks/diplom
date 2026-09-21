import { useState } from 'react'
import type { FormEvent } from 'react'
import { request } from '../../lib/api'
import Notice from '../../components/Notice'

export default function TeacherRequestPage() {
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const text = (form.elements.namedItem('message') as HTMLTextAreaElement).value
    try {
      await request('/teacher-requests/', { method: 'POST', body: JSON.stringify({ message: text }) })
      form.reset(); setMessage('Заявка отправлена на рассмотрение.'); setIsError(false)
    } catch (error) { setMessage((error as Error).message); setIsError(true) }
  }
  return <section className="page card narrow"><h1>Заявка преподавателя</h1><form onSubmit={submit}><textarea name="message" required placeholder="Расскажите о себе"/><button className="button primary">Отправить заявку</button></form><Notice text={message} error={isError}/></section>
}
