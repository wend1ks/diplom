import { useEffect, useState } from 'react'
import { request } from '../../lib/api'
import Link from '../../components/Link'
import Notice from '../../components/Notice'
import MarkdownContent from '../../components/MarkdownContent'
import PageLoader from '../../components/PageLoader'

function youtubeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace('www.', '')
    let videoId = ''
    if (host === 'youtu.be') videoId = parsed.pathname.slice(1)
    else if (host === 'youtube.com' || host === 'm.youtube.com') {
      videoId = parsed.searchParams.get('v') || parsed.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1] || ''
    }
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null
  } catch { return null }
}
function indentCode(code: string, start: number, end: number, shift: boolean) {
  const before = code.slice(0, start)
  const selected = code.slice(start, end)
  const after = code.slice(end)
  if (shift) {
    const target = selected || code.slice(start, code.indexOf('\n', start) === -1 ? code.length : code.indexOf('\n', start))
    const changed = target.replace(/^( {1,2}|\t)/gm, '')
    return { value: before + changed + after, start, end: Math.max(start, end - (target.length - changed.length)) }
  }
  if (selected.includes('\n')) {
    const changed = selected.replace(/^/gm, '  ')
    return { value: before + changed + after, start: start + 2, end: end + 2 * changed.split('\n').length }
  }
  return { value: before + '  ' + after, start: start + 2, end: start + 2 }
}

type TestFeedback = { passed?: boolean; input?: string; output?: string; expected?: string }

export default function LessonDetailPage({ lessonId }: { lessonId: string }) {
  const [lesson, setLesson] = useState<any>(null)
  const [nextLesson, setNextLesson] = useState<any>(null)
  const [code, setCode] = useState('')
  const [result, setResult] = useState('')
  const [feedback, setFeedback] = useState<TestFeedback[]>([])
  const [runPassed, setRunPassed] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    setNextLesson(null)
    request(`/lessons/${lessonId}/`)
      .then(data => {
        setLesson(data)
        setCode(data.code_template || '')
        if (data.course_slug) {
          request(`/courses/${data.course_slug}/`)
            .then(course => {
              const lessons = (course.modules || [])
                .flatMap((module: any) =>
                  (module.lessons || []).slice().sort((a: any, b: any) => a.order - b.order || a.id - b.id),
                )
              const currentIndex = lessons.findIndex((item: any) => item.id === data.id)
              setNextLesson(currentIndex >= 0 ? lessons[currentIndex + 1] || null : null)
            })
            .catch(() => setNextLesson(null))
        }
      })
      .catch(reason => setError(reason.message))
  }, [lessonId])

  async function run() {
    setIsRunning(true)
    setResult('')
    setFeedback([])
    setRunPassed(null)

    try {
      const data = await request(`/lessons/${lessonId}/run/`, {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
      const testFeedback = (data.feedback || []) as TestFeedback[]
      const feedbackText = testFeedback
        .map(
          (item: any, index: number) =>
            `Тест ${index + 1}: ${item.passed ? 'пройден' : 'не пройден'}\nВвод: ${item.input || '—'}\nПолучено: ${item.output || '—'}\nОжидалось: ${item.expected || '—'}`,
        )
        .join('\n\n')

      setFeedback(testFeedback)
      setRunPassed(data.result === 'success')
      setResult(feedbackText || (data.result === 'success' ? 'Все тесты пройдены.' : 'Проверка не пройдена.'))
      if (data.result === 'success') setLesson({ ...lesson, is_completed: true })
    } catch (reason) {
      setResult((reason as Error).message)
      setRunPassed(false)
    } finally {
      setIsRunning(false)
    }
  }

  if (error) {
    return <section className="page"><Notice text={error} error /></section>
  }

  if (!lesson) return <PageLoader label="Открываем урок…" />

  const coursePath = lesson.course_slug ? `/courses/${lesson.course_slug}` : '/courses'
  const passedTests = feedback.filter(test => test.passed).length
  const hasResult = Boolean(result)

  if (lesson.lesson_type !== 'task') {
    const embedUrl = lesson.video_url ? youtubeEmbedUrl(lesson.video_url) : null

    return (
      <section className="page lesson-read">
        <Link className="lesson-back" to={coursePath}>
          ← К курсу
        </Link>
        <article className="lesson-article">
          <p className="eyebrow">Урок</p>
          <h1>{lesson.title}</h1>
          <MarkdownContent content={lesson.content || 'Содержание урока скоро появится.'} />
          {lesson.video_url &&
            (embedUrl ? (
              <div className="lesson-video-player">
                <iframe
                  src={embedUrl}
                  title={`Видео: ${lesson.title}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <a className="button outline lesson-video" href={lesson.video_url} target="_blank" rel="noreferrer">
                Открыть видео ↗
              </a>
            ))}
          {nextLesson && (
            <div className="lesson-next-wrap" style={{ marginTop: 32 }}>
              <Link className="button primary" to={`/lessons/${nextLesson.id}`}>
                Следующий урок →
              </Link>
            </div>
          )}
        </article>
      </section>
    )
  }

  return (
    <section className="coding-page">
      <header className="coding-header">
        <Link to={coursePath} className="back-link">
          ← К курсу
        </Link>
        <div className="coding-status"><span className="status-dot" />Задача по Python</div>
      </header>
      <div className="coding-workspace">
        <article className="problem-panel">
          <div className="problem-scroll">
            <p className="problem-kicker">Практика</p>
            <h1>{lesson.title}</h1>
            <div className="problem-copy">
              {lesson.content || 'Напишите решение задачи и запустите проверку на скрытых тестах.'}
            </div>
            {(lesson.input_description || lesson.output_description) && (
              <div className="problem-specs">
                {lesson.input_description && <section><h2>Входные данные</h2><p>{lesson.input_description}</p></section>}
                {lesson.output_description && <section><h2>Результат</h2><p>{lesson.output_description}</p></section>}
              </div>
            )}
            <div className="problem-tip">
              <span>i</span>
              <p>Используйте <code>Tab</code> для отступа, <code>Shift + Tab</code> для обратного отступа. <code>Ctrl + Enter</code> запускает проверку.</p>
            </div>
          </div>
        </article>
        <section className="editor-panel">
          <div className="editor-toolbar">
            <div><span className="language-dot">›_</span><span>Python 3</span></div>
            <span className="editor-hint">Tab — отступ · Ctrl + Enter — проверить</span>
          </div>
          <textarea
            className="leetcode-editor"
            spellCheck="false"
            aria-label="Редактор кода Python"
            value={code}
            onChange={event => setCode(event.target.value)}
            onKeyDown={event => {
              if (event.ctrlKey && event.key === 'Enter') {
                event.preventDefault()
                run()
                return
              }
              if (event.key !== 'Tab') return
              event.preventDefault()
              const editor = event.currentTarget
              const update = indentCode(code, editor.selectionStart, editor.selectionEnd, event.shiftKey)
              setCode(update.value)
              requestAnimationFrame(() => editor.setSelectionRange(update.start, update.end))
            }}
          />
          <div className="run-bar"> 
            <span>{code.split('\n').length} строк</span>
            <div className="run-actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="button primary" disabled={isRunning} onClick={run}>
                {isRunning ? 'Проверка…' : 'Запустить проверку'}
              </button>
              {nextLesson && (
                <Link className="button outline" to={`/lessons/${nextLesson.id}`}>
                  Следующий урок →
                </Link>
              )}
            </div>
          </div>
          <div className={`result-panel ${hasResult ? 'has-result' : ''} ${runPassed === true ? 'result-success' : runPassed === false ? 'result-failure' : ''}`}>
            <div className="result-heading">
              <span>{hasResult ? 'Результат проверки' : 'Консоль'}</span>
              {hasResult && <span className="result-state">{runPassed ? '✓ Решение принято' : '× Есть ошибки'}</span>}
            </div>
            {isRunning ? (
              <div className="result-empty result-loading"><span />Проверяем решение на тестах…</div>
            ) : feedback.length ? (
              <div className="test-results">
                <div className="test-summary"><strong>{runPassed ? 'Решение принято' : 'Нужна доработка'}</strong><span>{passedTests} из {feedback.length} тестов пройдено</span></div>
                {feedback.map((test, index) => (
                  <article className={`test-result ${test.passed ? 'passed' : 'failed'}`} key={index}>
                    <header><span>Тест {index + 1}</span><b>{test.passed ? '✓ Принято' : 'Нужна правка'}</b></header>
                    <div className="test-values">
                      <p><span>Ввод</span><code>{test.input || '—'}</code></p>
                      <p><span>Получено</span><code>{test.output || '—'}</code></p>
                      <p><span>Ожидалось</span><code>{test.expected || '—'}</code></p>
                    </div>
                  </article>
                ))}
              </div>
            ) : hasResult ? <pre>{result}</pre> : <div className="result-empty">Запустите проверку, чтобы увидеть результат.</div>}
          </div>
        </section>
      </div>
    </section>
  )
}
