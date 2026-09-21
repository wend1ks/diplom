/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { request } from '../../lib/api'
import Notice from '../../components/Notice'

export default function AssignmentDetailPage({ assignmentId }: { assignmentId: string }) {
  const [assignment, setAssignment] = useState<any>(null)
  const [comment, setComment] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    request(`/assignments/${assignmentId}/`)
      .then(setAssignment)
      .catch(reason => {
        setMessage(reason.message)
        setIsError(true)
      })
  }, [assignmentId])

  async function submit(event: FormEvent) {
    event.preventDefault()

    if (!file) {
      setMessage('Прикрепите файл с выполненной работой.')
      setIsError(true)
      return
    }

    const data = new FormData()
    data.append('assignment', assignmentId)
    data.append('answer', comment)
    data.append('attachment', file)

    try {
      await request('/submissions/', { method: 'POST', body: data })
      setMessage('Работа с файлом отправлена.')
      setIsError(false)
    } catch (reason) {
      setMessage((reason as Error).message)
      setIsError(true)
    }
  }

  if (!assignment) {
    return (
      <section className="page">
        <Notice text={message} error={isError} />
      </section>
    )
  }

  return (
    <section className="page">
      <h1>{assignment.title}</h1>
      <p className="lead">{assignment.description}</p>

      <form className="card" onSubmit={submit}>
        <label>
          Комментарий к работе
          <textarea
            required
            value={comment}
            onChange={event => setComment(event.target.value)}
            placeholder="Опишите решение или оставьте комментарий преподавателю"
          />
        </label>
        <label>
          Файл с работой
          <input
            required
            type="file"
            onChange={event => setFile(event.target.files?.[0] || null)}
          />
        </label>
        {file && <p>Выбран файл: {file.name}</p>}
        <button className="button primary">Отправить работу</button>
        <Notice text={message} error={isError} />
      </form>
    </section>
  )
}

