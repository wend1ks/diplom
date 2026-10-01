import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { request } from '../../lib/api'
import Notice from '../../components/Notice'
import Link from '../../components/Link'

type Item = Record<string, any>

type Resource =
  | 'courses'
  | 'modules'
  | 'lessons'
  | 'testcases'
  | 'assignments'
  | 'submissions'
  | 'teacher-requests'

type Field = {
  name: string
  label: string
  type?:
    | 'text'
    | 'textarea'
    | 'number'
    | 'datetime-local'
    | 'select'
  options?: {
    value: string
    label: string
  }[]
}

type Config = {
  title: string
  fields: Field[]
  canCreate?: boolean
  canDelete?: boolean
}

const configs: Record<Resource, Config> = {
  courses: {
    title: 'Курсы',
    canCreate: true,
    canDelete: true,
    fields: [
      { name: 'title', label: 'Название' },
      { name: 'slug', label: 'URL курса' },
      {
        name: 'description',
        label: 'Описание',
        type: 'textarea',
      },
    ],
  },

  modules: {
    title: 'Модули',
    canCreate: true,
    canDelete: true,
    fields: [
      {
        name: 'course',
        label: 'Курс',
        type: 'select',
      },
      {
        name: 'title',
        label: 'Название',
      },
    ],
  },

  lessons: {
    title: 'Уроки',
    canCreate: true,
    canDelete: true,
    fields: [
      {
        name: 'module',
        label: 'Модуль',
        type: 'select',
      },
      {
        name: 'title',
        label: 'Название',
      },
      {
        name: 'lesson_type',
        label: 'Тип урока',
        type: 'select',
        options: [
          {
            value: 'text',
            label: 'Текст',
          },
          {
            value: 'video',
            label: 'Видео',
          },
          {
            value: 'task',
            label: 'Задача',
          },
        ],
      },
      {
        name: 'content',
        label: 'Содержание',
        type: 'textarea',
      },
      {
        name: 'code_template',
        label: 'Шаблон кода',
        type: 'textarea',
      },
      {
        name: 'video_url',
        label: 'Ссылка на YouTube',
        type: 'text',
      },
    ],
  },

  testcases: {
    title: 'Тест-кейсы',
    canCreate: true,
    canDelete: true,
    fields: [
      {
        name: 'lesson',
        label: 'Урок',
        type: 'select',
      },
      {
        name: 'input_data',
        label: 'Входные данные',
        type: 'textarea',
      },
      {
        name: 'expected_output',
        label: 'Ожидаемый результат',
        type: 'textarea',
      },
    ],
  },

  assignments: {
    title: 'Самостоятельные работы',
    canCreate: true,
    canDelete: true,
    fields: [
      {
        name: 'course',
        label: 'Курс',
        type: 'select',
      },
      {
        name: 'title',
        label: 'Название',
      },
      {
        name: 'description',
        label: 'Описание',
        type: 'textarea',
      },
      {
        name: 'deadline',
        label: 'Срок сдачи',
        type: 'datetime-local',
      },
    ],
  },

  submissions: {
    title: 'Отправленные работы',
    fields: [
      {
        name: 'score',
        label: 'Оценка',
        type: 'select',
        options: [
          { value: '1', label: '1' },
          { value: '2', label: '2' },
          { value: '3', label: '3' },
          { value: '4', label: '4' },
          { value: '5', label: '5' },
        ],
      },
      {
        name: 'teacher_comment',
        label: 'Комментарий преподавателя',
        type: 'textarea',
      },
    ],
  },

  'teacher-requests': {
    title: 'Заявки преподавателей',
    fields: [],
  },
}

const resources = Object.keys(configs) as Resource[]

async function fetchAll(path: string): Promise<Item[]> {
  const items: Item[] = []
  let page = 1

  while (true) {
    const data = await request(`${path}?page=${page}`)
    if (Array.isArray(data)) return [...items, ...data]

    items.push(...(data.results || []))
    if (!data.next) return items
    page += 1
  }
}
const titleFor = (item: Item) =>
  String(
    item.title ||
      item.user?.username ||
      item.student ||
      item.expected_output ||
      `Запись #${item.id}`,
  )

export default function AdminCrudPage({
  resource = 'courses',
  role,
}: {
  resource?: string
  role?: string
}) {
  const visibleResources = role === 'teacher'
    ? resources.filter(key => key !== 'teacher-requests')
    : resources
  const current = (
    resources.includes(resource as Resource) ? resource : 'courses'
  ) as Resource

  const config = configs[current]

  const [items, setItems] = useState<Item[]>([])
  const [references, setReferences] = useState<Record<string, Item[]>>({})
  const [form, setForm] = useState<Item>({})
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Item | null>(null)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const show = (text: string, error = false) => {
    setMessage(text)
    setIsError(error)
  }

  const canManage = (item: Item) => item.can_manage !== false

  const openEditor = (item: Item = {}) => {
    setForm(item)
    setIsEditorOpen(true)
  }

  const closeEditor = () => {
    setForm({})
    setIsEditorOpen(false)
    setSelectedRequest(null)
  }

  const load = async () => {
    setItems(await fetchAll(`/${current}/`))
  }

  const relation = config.fields.find(field =>
    ['course', 'module', 'lesson'].includes(field.name),
  )?.name

  useEffect(() => {
    setForm({})
    setIsEditorOpen(false)
    fetchAll(`/${current}/`)
      .then(setItems)
      .catch(error => show(error.message, true))

    if (relation) {
      fetchAll(`/${relation === 'course' ? 'courses' : `${relation}s`}/`)
        .then(items => setReferences({ [relation]: items }))
        .catch(() => undefined)
    }
  }, [current, relation])

  const idFor = (item: Item) =>
    current === 'courses' ? item.slug : item.id

  const update = (field: Field, value: string) => {
    setForm(old => ({
      ...old,
      [field.name]:
        field.type === 'number' && value
          ? Number(value)
          : value,
    }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()

    try {
      const payload = Object.fromEntries(
        config.fields
          .filter(field => {
            const value = form[field.name]
            return value !== '' && value !== undefined
          })
          .map(field => [field.name, form[field.name]]),
      )

      await request(
        `/${current}/${form.id ? `${idFor(form)}/` : ''}`,
        {
          method: form.id ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        },
      )

      closeEditor()
      show('Изменения сохранены.')
      await load()
    } catch (error) {
      show((error as Error).message, true)
    }
  }

  async function remove(item: Item) {
    if (!window.confirm(`Удалить «${titleFor(item)}»?`)) {
      return
    }

    try {
      await request(`/${current}/${idFor(item)}/`, {
        method: 'DELETE',
      })

      show('Запись удалена.')
      await load()
    } catch (error) {
      show((error as Error).message, true)
    }
  }

  async function review(
    item: Item,
    status: 'approved' | 'rejected',
  ) {
    try {
      const updatedRequest = await request(
        `/teacher-requests/${item.id}/review/`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        },
      )

      setSelectedRequest(updatedRequest)
      show('Заявка обработана.')
      await load()
    } catch (error) {
      show((error as Error).message, true)
    }
  }

  return (
    <section className="page admin">
      <h1>{config.title}</h1>

      <div className="admin-tabs">
        {visibleResources.map(key => (
          <Link
            className={key === current ? 'active' : ''}
            to={`/admin/${key}`}
            key={key}
          >
            {configs[key].title}
          </Link>
        ))}
      </div>

      {message && (
        <Notice
          text={message}
          error={isError}
        />
      )}

      {config.canCreate && (
        <button
          className="button primary"
          type="button"
          onClick={() => openEditor()}
        >
          + Новая запись
        </button>
      )}

      <div className="admin-layout">
        <div>
          {items.map(item => (
            <article
              className={`row card${current === 'teacher-requests' ? ' request-row' : ''}`}
              key={item.id}
              onClick={() => {
                if (current === 'teacher-requests') {
                  setSelectedRequest(item)
                } else if (canManage(item) && config.fields.length > 0) {
                  openEditor(item)
                }
              }}
            >
              <span>
                <strong>{titleFor(item)}</strong>

                <small>
                  #{item.id}
                  {item.status
                    ? ` · ${item.status}`
                    : ''}
                </small>

                {current === 'submissions' && (
                  <>
                    <p>
                      Комментарий ученика:{' '}
                      {item.answer || '—'}
                    </p>

                    {item.attachment_url ? (
                      <a
                        className="button outline"
                        href={item.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        download
                      >
                        Скачать файл
                      </a>
                    ) : (
                      <p>
                        Файл не прикреплён.
                      </p>
                    )}
                  </>
                )}
              </span>

              {current === 'teacher-requests' &&
              item.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation()
                      review(item, 'approved')
                    }}
                  >
                    Одобрить
                  </button>

                  <button
                    type="button"
                    onClick={event => {
                      event.stopPropagation()
                      review(item, 'rejected')
                    }}
                  >
                    Отклонить
                  </button>
                </>
              ) : (
                <>
                  {canManage(item) &&
                    config.fields.length > 0 && (
                      <button
                        type="button"
                        onClick={() => openEditor(item)}
                      >
                        {current === 'submissions' ? 'Оценить' : 'Изменить'}
                      </button>
                    )}

                  {canManage(item) &&
                    config.canDelete && (
                      <button
                        type="button"
                        onClick={() => remove(item)}
                      >
                        Удалить
                      </button>
                    )}
                </>
              )}
            </article>
          ))}

          {!items.length && (
            <div className="admin-empty">
              Записей пока нет.
            </div>
          )}
        </div>

        {current === 'teacher-requests' && selectedRequest && (
          <aside className="card editor request-review">
            <div className="request-review-header">
              <h2>Рассмотрение заявки</h2>
              <button
                type="button"
                className="request-review-close"
                onClick={() => setSelectedRequest(null)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <p><strong>Пользователь:</strong> {titleFor(selectedRequest)}</p>
            <p><strong>Статус:</strong> {({
              pending: 'На рассмотрении',
              approved: 'Одобрена',
              rejected: 'Отклонена',
            } as Record<string, string>)[selectedRequest.status] || selectedRequest.status}</p>
            <p><strong>Сообщение:</strong></p>
            <p className="request-review-message">{selectedRequest.message || 'Пользователь не оставил сообщение.'}</p>

            {selectedRequest.status === 'pending' && (
              <div className="request-review-actions">
                <button
                  className="button primary"
                  type="button"
                  onClick={() => review(selectedRequest, 'approved')}
                >
                  Принять
                </button>
                <button
                  className="button danger"
                  type="button"
                  onClick={() => review(selectedRequest, 'rejected')}
                >
                  Отклонить
                </button>
              </div>
            )}
          </aside>
        )}

        {isEditorOpen &&
          (config.canCreate ||
            config.fields.length > 0) && (
          <form
            className="card editor"
            onSubmit={save}
          >
            <h2>
              {current === 'submissions'
                ? 'Оценивание работы'
                : form.id
                  ? 'Редактирование'
                  : 'Новая запись'}
            </h2>

            {config.fields.map(field => (
              <label key={field.name}>
                {field.label}

                {field.type === 'textarea' ? (
                  <textarea
                    value={String(
                      form[field.name] || '',
                    )}
                    onChange={event =>
                      update(
                        field,
                        event.target.value,
                      )
                    }
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={String(
                      form[field.name] || '',
                    )}
                    onChange={event =>
                      update(
                        field,
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Выберите значение
                    </option>

                    {(field.options ||
                      references[field.name] ||
                      [])
                      .filter(
                        option =>
                          field.options ||
                          canManage(option as Item),
                      )
                      .map(option => (
                        <option
                          key={String(
                            (option as Item).id ??
                              (
                                option as {
                                  value: string
                                }
                              ).value,
                          )}
                          value={String(
                            (option as Item).id ??
                              (
                                option as {
                                  value: string
                                }
                              ).value,
                          )}
                        >
                          {option.label ??
                            titleFor(option)}
                        </option>
                      ))}
                  </select>
                ) : (
                  <input
                    type={field.type || 'text'}
                    value={
                      field.type === 'datetime-local' &&
                      form[field.name]
                        ? String(
                            form[field.name],
                          ).slice(0, 16)
                        : String(
                            form[field.name] || '',
                          )
                    }
                    onChange={event =>
                      update(
                        field,
                        event.target.value,
                      )
                    }
                  />
                )}
              </label>
            ))}

            <div>
              <button className="button primary">
                Сохранить
              </button>

              <button
                className="button ghost"
                type="button"
                onClick={closeEditor}
              >
                Отмена
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
