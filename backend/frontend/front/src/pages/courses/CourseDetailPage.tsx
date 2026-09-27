/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { request } from '../../lib/api'
import Link from '../../components/Link'
import Notice from '../../components/Notice'
import PageLoader from '../../components/PageLoader'
export default function CourseDetailPage({ slug }: { slug: string }) {
  const [course, setCourse] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    request(`/courses/${slug}/`)
      .then(setCourse)
      .catch(reason => setError(reason.message))
  }, [slug])

  if (error) {
    return (
      <section className="page">
        <Notice text={error} error />
      </section>
    )
  }

  if (!course) return <PageLoader label="Открываем курс…" />

  const progress = course.progress || {}

  return (
    <section className="page">
      <Link to="/courses">← Все курсы</Link>
      <h1>{course.title}</h1>
      <p className="lead">{course.description}</p>

      <section className="card">
        <h2>Прогресс курса: {progress.percent || 0}%</h2>
        <p>
          {progress.completed_items || 0} из {progress.total_items || 0} элементов выполнено. Уроки:{' '}
          {progress.completed_lessons || 0}/{progress.total_lessons || 0}; задания проверены:{' '}
          {progress.reviewed_assignments || 0}/{progress.total_assignments || 0}.
        </p>
        <div className="progress" aria-label={`Прогресс курса: ${progress.percent || 0}%`}>
          <i style={{ width: `${progress.percent || 0}%` }} />
        </div>
      </section>

      {(course.modules || []).map((module: any) => (
        <article className="module card" key={module.id}>
          <h2>
            {module.order}. {module.title}
          </h2>
          <ul>
            {(module.lessons || []).map((lesson: any) => (
              <li key={lesson.id}>
                <Link to={`/lessons/${lesson.id}`}>
                  {lesson.lesson_type === 'task' ? '📝' : '📄'} {lesson.title}
                </Link>{' '}
                — {lesson.is_completed ? '✓ Пройден' : '◦ Не пройден'}
              </li>
            ))}
          </ul>
        </article>
      ))}

      {(course.assignment_progress || []).length > 0 && (
        <section className="card">
          <h2>Самостоятельные задания</h2>
          {course.assignment_progress.map((assignment: any) => (
            <Link className="assignment" key={assignment.id} to={`/assignments/${assignment.id}`}>
              {assignment.is_completed
                ? '✓ Проверено'
                : assignment.status === 'submitted'
                  ? '◔ На проверке'
                  : '◦ Не отправлено'}{' '}
              · {assignment.title}
            </Link>
          ))}
        </section>
      )}
    </section>
  )
}



