/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { request } from '../../lib/api'
import Link from '../../components/Link'
import Notice from '../../components/Notice'

export default function CourseListPage() {
  const [courses, setCourses] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    request('/courses/')
      .then(data => setCourses(data.results || data))
      .catch(reason => setError(reason.message))
  }, [])

  return (
    <section className="page">
      <p className="eyebrow">ОБУЧЕНИЕ</p>
      <h1>Мои курсы</h1>
      <p>Выберите курс и продолжайте с того места, где остановились.</p>
      <Notice text={error} error />

      <div className="grid three">
        {courses.map(course => {
          const progress = course.progress || {}
          const percent = progress.percent || 0

          return (
            <article className="card course" key={course.id}>
              <h2>{course.title}</h2>
              <p>{course.description || 'Практический курс Python-разработчика.'}</p>
              <p>
                {percent}% пройдено · {progress.completed_items || 0} из {progress.total_items || 0} элементов
              </p>
              <div className="progress" aria-label={`Прогресс курса: ${percent}%`}>
                <i style={{ width: `${percent}%` }} />
              </div>
              <Link to={`/courses/${course.slug || course.id}`} className="button outline">
                Открыть курс →
              </Link>
            </article>
          )
        })}

        {!courses.length && !error && <div className="card">Курсов пока нет.</div>}
      </div>
    </section>
  )
}

