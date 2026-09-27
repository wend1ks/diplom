/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { request } from '../../lib/api'
import Notice from '../../components/Notice'

function findSubmission(data: any, assignmentId: string) {
  const submissions = Array.isArray(data) ? data : data?.results
  if (!Array.isArray(submissions)) return null
  return submissions.find((item: any) => String(item.assignment) === String(assignmentId)) || null
}

export default function AssignmentDetailPage({ assignmentId }: { assignmentId: string }) {
  const [assignment, setAssignment] = useState<any>(null)
  const [submission, setSubmission] = useState<any>(null)
  const [isStudent, setIsStudent] = useState(false)
  const [comment, setComment] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    Promise.all([request(`/assignments/${assignmentId}/`), request('/auth/me/')])
      .then(async ([assignmentData, me]) => {
        setAssignment(assignmentData)
        const student = me.role === 'student'
        setIsStudent(student)
        if (student) {
          const data = await request(`/submissions/?assignment=${assignmentId}`)
          setSubmission(findSubmission(data, assignmentId))
        }
      })
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
      const response = await request(`/submissions/?assignment=${assignmentId}`)
      setSubmission(findSubmission(response, assignmentId))
      setMessage('Работа отправлена. Оценка появится после проверки преподавателем.')
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

      {isStudent && submission && <section className="card">
        <h2>Статус работы: {submission.status === 'reviewed' ? 'Проверена' : 'На проверке'}</h2>
        {submission.score != null && <p><strong>Оценка: {submission.score} из 5</strong></p>}
        {submission.teacher_comment && <p>Комментарий преподавателя: {submission.teacher_comment}</p>}
        {submission.status !== 'reviewed' && <p>Преподаватель ещё не проверил работу.</p>}
      </section>}

      {(!isStudent || !submission) && <form className="card" onSubmit={submit}>
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
      </form>}
    </section>
  )
}

