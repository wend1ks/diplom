import { useEffect, useState } from 'react'

import { request } from '../../lib/api'
import Link from '../../components/Link'

type Stats = {
  courses: number
  modules: number
  lessons: number
  projects: number
}

type Lesson = {
  icon: string
  title: string
  done?: boolean
}

type CourseModule = {
  number: string
  title: string
  section: 'free' | 'standard' | 'pro'
  lessons: Lesson[]
  description: string
  progress: number
  button: string
  link?: string
  pro?: boolean
}

type SectionLabelProps = {
  type: 'free' | 'standard' | 'pro'
  title: string
  description: string
  time: string
}

type ModuleCardProps = {
  module: CourseModule
  isOpen: boolean
  onToggle: () => void
}

type TariffCardProps = {
  name: string
  description: string
  price: string
  period: string
  features: string[]
  featured?: boolean
  buttonText: string
  filled?: boolean
}

const modules: CourseModule[] = [
  {
    number: '01',
    title: 'Основы Python',
    section: 'free',
    lessons: [
      {
        icon: '📄',
        title: 'Введение в Python',
        done: true,
      },
      {
        icon: '📄',
        title: 'Циклы и условия',
        done: true,
      },
      {
        icon: '📝',
        title: 'Функции',
      },
      {
        icon: '📝',
        title: 'Словари и множества',
      },
    ],
    description:
      'Напишите своё первое приложение в интерактивной среде.',
    progress: 50,
    button: 'Начать бесплатно',
    link: '/courses',
  },

  {
    number: '02',
    title: 'Базы данных и Flask',
    section: 'standard',
    lessons: [
      {
        icon: '📄',
        title: 'SQL и PostgreSQL',
      },
      {
        icon: '📄',
        title: 'SQLAlchemy ORM',
      },
      {
        icon: '🎥',
        title: 'Веб-приложения на Flask',
      },
      {
        icon: '📝',
        title: 'Проект: REST API на Flask',
      },
    ],
    description:
      '4 практических проекта · 3 проверки экспертов',
    progress: 0,
    button: 'Перейти к модулю',
    link: '/courses',
  },

  {
    number: '03',
    title: 'Django',
    section: 'standard',
    lessons: [
      {
        icon: '📄',
        title: 'Структура проекта Django',
      },
      {
        icon: '📄',
        title: 'Модели, представления и шаблоны',
      },
      {
        icon: '🎥',
        title: 'Django REST Framework',
      },
      {
        icon: '📝',
        title: 'Аутентификация и права доступа',
      },
    ],
    description:
      'Создайте полноценное веб-приложение для реального проекта.',
    progress: 0,
    button: 'Перейти к модулю',
    link: '/courses',
  },

  {
    number: '04',
    title: 'API и микросервисы',
    section: 'pro',
    lessons: [
      {
        icon: '📄',
        title: 'Проектирование REST и GraphQL API',
      },
      {
        icon: '📄',
        title: 'FastAPI и асинхронность',
      },
      {
        icon: '📝',
        title: 'Celery и очереди задач',
      },
    ],
    description:
      '3 продвинутых проекта · живые сессии с наставником',
    progress: 0,
    button: 'Входит в Профи',
    pro: true,
  },

  {
    number: '05',
    title: 'Docker, CI/CD и деплой',
    section: 'pro',
    lessons: [
      {
        icon: '📄',
        title: 'Docker и Docker Compose',
      },
      {
        icon: '🎥',
        title: 'GitHub Actions для CI/CD',
      },
      {
        icon: '📝',
        title: 'Деплой на VPS и облачные платформы',
      },
    ],
    description:
      'Выполните деплой приложения в рабочем окружении.',
    progress: 0,
    button: 'Входит в Профи',
    pro: true,
  },
]

const sidebarModules: string[] = [
  'Основы Python',
  'Базы данных и Flask',
  'Django',
  'API и микросервисы',
  'Docker и деплой',
  'Итоговый проект',
]

function SectionLabel({
  type,
  title,
  description,
  time,
}: SectionLabelProps) {
  const icon =
    type === 'free'
      ? '▲'
      : type === 'standard'
        ? '✦'
        : '◆'

  const iconClass =
    type === 'free'
      ? 'icon-free'
      : type === 'standard'
        ? 'icon-base'
        : 'icon-pro'

  return (
    <div className="section-label">
      <div className={`section-icon ${iconClass}`}>
        {icon}
      </div>

      <div className="section-info">
        <h3>{title}</h3>

        <p>{description}</p>

        <div className="time-badge">
          ⏱ {time}
        </div>
      </div>
    </div>
  )
}

function ModuleCard({
  module,
  isOpen,
  onToggle,
}: ModuleCardProps) {
  return (
    <div
      className={`module-card ${isOpen ? 'open' : ''}`}
    >
      <div
        className="module-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {
            event.preventDefault()
            onToggle()
          }
        }}
      >
        <div className="module-title">
          <span className="module-title-tag">
            {module.number}
          </span>

          {module.title}
        </div>

        <span className="module-chevron">
          ▾
        </span>
      </div>

      {isOpen && (
        <div className="module-body">
          <ul className="lesson-list">
            {module.lessons.map((lesson) => (
              <li
                className={`lesson-item ${
                  lesson.done ? 'done' : ''
                }`}
                key={lesson.title}
              >
                <span className="lesson-icon">
                  {lesson.icon}
                </span>

                {lesson.title}

                {lesson.done && (
                  <span
                    className="done-check"
                    style={{
                      marginLeft: 'auto',
                    }}
                  >
                    ✓
                  </span>
                )}
              </li>
            ))}
          </ul>

          <div className="module-footer">
            <p>{module.description}</p>

            <div>
              <div className="prog-bar">
                <div
                  className="prog-bar-fill"
                  style={{
                    width: `${module.progress}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {module.pro ? (
            <button
              className="try-btn"
              type="button"
              style={{
                background: 'var(--orange-dim)',
                borderColor: 'var(--orange)',
                color: 'var(--orange)',
              }}
            >
              {module.button}
            </button>
          ) : (
            <Link
              to={module.link ?? '/courses'}
              className="try-btn"
            >
              {module.button}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function TariffCard({
  name,
  description,
  price,
  period,
  features,
  featured = false,
  buttonText,
  filled = false,
}: TariffCardProps) {
  return (
    <div
      className={`tariff-card ${
        featured ? 'featured' : ''
      }`}
    >
      {featured && (
        <div className="tariff-badge">
          Популярно
        </div>
      )}

      <div className="tariff-name">
        {name}
      </div>

      <div className="tariff-desc">
        {description}
      </div>

      <div className="tariff-price">
        {price}

        <span>
          {period}
        </span>
      </div>

      <ul className="tariff-features">
        {features.map((feature) => (
          <li key={feature}>
            {feature}
          </li>
        ))}
      </ul>

      <Link
        to="/courses"
        className={
          filled
            ? 'tariff-btn tariff-btn-filled'
            : 'tariff-btn tariff-btn-outline'
        }
      >
        {buttonText}
      </Link>
    </div>
  )
}

export default function LandingView() {
  const [stats, setStats] = useState<Stats>({
    courses: 0,
    modules: 0,
    lessons: 0,
    projects: 4,
  })

  const [openModule, setOpenModule] =
    useState<number | null>(0)

  useEffect(() => {
    Promise.all([
      request('/courses/'),
      request('/modules/'),
      request('/lessons/'),
    ])
      .then(
        ([
          courses,
          modulesResponse,
          lessons,
        ]) => {
          const coursesCount =
            courses.count ??
            courses.results?.length ??
            courses.length ??
            0

          const modulesCount =
            modulesResponse.count ??
            modulesResponse.results?.length ??
            modulesResponse.length ??
            0

          const lessonsCount =
            lessons.count ??
            lessons.results?.length ??
            lessons.length ??
            0

          setStats({
            courses: coursesCount,
            modules: modulesCount,
            lessons: lessonsCount,
            projects: Math.max(
              4,
              coursesCount
            ),
          })
        }
      )
      .catch(() => {
        // Если API недоступен,
        // оставляем значения по умолчанию.
      })
  }, [])

  const handleModuleToggle = (
    index: number
  ) => {
    setOpenModule((current) =>
      current === index ? null : index
    )
  }

  return (
    <>
      {/* =========================
          PROMO BANNER
      ========================== */}

      <div className="promo-banner">
        <span>Скидка 15%</span>
        {' — '}
        запишитесь до 31 июля и сохраните цену
      </div>

      {/* =========================
          HERO
      ========================== */}

      <section
        className="hero"
        id="career"
      >
        <div className="hero-badge">
          <span>✦</span>
          {' '}
          Доверяют тысячам студентов
        </div>

        <h1>
          Стань
          <br />
          <em>
            Python-разработчиком
          </em>
        </h1>

        <p className="hero-sub">
          Изучи Python с нуля, создавай реальные
          проекты и готовься к работе с помощью
          живых проверок кода и практических
          заданий.
        </p>

        <div className="hero-actions">
          <Link
            to="/courses"
            className="btn btn-primary"
          >
            ▶ Начать бесплатно
          </Link>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <div className="stat-value">
              {stats.courses}
            </div>

            <div className="stat-label">
              КУРСОВ
            </div>
          </div>

          <div className="stat">
            <div className="stat-value">
              {stats.modules}
            </div>

            <div className="stat-label">
              МОДУЛЕЙ
            </div>
          </div>

          <div className="stat">
            <div className="stat-value">
              {stats.lessons}+
            </div>

            <div className="stat-label">
              УРОКОВ
            </div>
          </div>

          <div className="stat">
            <div className="stat-value">
              {stats.projects}
            </div>

            <div className="stat-label">
              ПРОЕКТОВ
            </div>
          </div>
        </div>
      </section>

      {/* =========================
          COURSE CONTENT
      ========================== */}

      <section
        className="page-layout"
        id="courses"
      >
        {/* SIDEBAR */}

        <aside className="sidebar">
          <div className="sidebar-section">
            <h4>
              Содержание курса
            </h4>

            <div className="sidebar-item done">
              <div className="sidebar-dot" />
              Бесплатный доступ
            </div>

            <div className="sidebar-item active">
              <div className="sidebar-dot" />
              Стандартный план
            </div>

            <div className="sidebar-item">
              <div className="sidebar-dot" />
              Профи
            </div>
          </div>

          <div
            className="sidebar-section"
            id="curriculum"
          >
            <h4>
              Модули
            </h4>

            {sidebarModules.map(
              (item, index) => (
                <div
                  className={`sidebar-item ${
                    index < 2
                      ? 'done'
                      : index === 2
                        ? 'active'
                        : ''
                  }`}
                  key={item}
                >
                  <div className="sidebar-dot" />

                  {item}
                </div>
              )
            )}
          </div>
        </aside>

        {/* MAIN */}

        <main>
          {/* FREE PLAN */}

          <SectionLabel
            type="free"
            title="Бесплатный доступ"
            description="Изучите курс, создайте первое приложение на Python и убедитесь, что он вам подходит."
            time="5 часов обучения"
          />

          <ModuleCard
            module={modules[0]}
            isOpen={openModule === 0}
            onToggle={() =>
              handleModuleToggle(0)
            }
          />

          <hr className="section-divider" />

          {/* STANDARD PLAN */}

          <SectionLabel
            type="standard"
            title="Стандартный план"
            description="Всё, что нужно для уверенного старта в Python-разработке."
            time="10 месяцев"
          />

          <ModuleCard
            module={modules[1]}
            isOpen={openModule === 1}
            onToggle={() =>
              handleModuleToggle(1)
            }
          />

          <ModuleCard
            module={modules[2]}
            isOpen={openModule === 2}
            onToggle={() =>
              handleModuleToggle(2)
            }
          />

          <hr className="section-divider" />

          {/* PRO PLAN */}

          <SectionLabel
            type="pro"
            title="План «Профи»"
            description="Продвинутая разработка с наставничеством и карьерной поддержкой."
            time="12 месяцев"
          />

          <ModuleCard
            module={modules[3]}
            isOpen={openModule === 3}
            onToggle={() =>
              handleModuleToggle(3)
            }
          />

          <ModuleCard
            module={modules[4]}
            isOpen={openModule === 4}
            onToggle={() =>
              handleModuleToggle(4)
            }
          />
        </main>
      </section>

      {/* =========================
          TARIFFS
      ========================== */}

      <section
        className="tariffs"
        id="pricing"
      >
        <h2>
          Выберите путь обучения
        </h2>

        <div className="tariff-grid">
          <TariffCard
            name="▲ Бесплатно"
            description="Ознакомьтесь с Python до покупки."
            price="0 ₽"
            period="навсегда"
            features={[
              'Основы Python',
              'Интерактивные задания',
              'Сертификат о прохождении',
            ]}
            buttonText="Начать бесплатно"
          />

          <TariffCard
            name="✦ Профессионал"
            description="Всё, чтобы вывести карьеру Python-разработчика на новый уровень."
            price="2490 ₽"
            period="/месяц"
            features={[
              'Профессиональная программа Python',
              'Реальные проекты для портфолио',
              'Проверки экспертов',
              'Карьера и поддержка',
              'Сертификат о завершении',
            ]}
            buttonText="Записаться"
            featured
            filled
          />

          <TariffCard
            name="◆ Профи"
            description="Продвинутый курс с личным наставником."
            price="4490 ₽"
            period="/месяц"
            features={[
              'Всё из Профессионала',
              'Индивидуальный наставник',
              'Технические симуляции',
              'Коучинг по карьере',
              'Приоритетная поддержка',
            ]}
            buttonText="Перейти на Профи"
          />
        </div>
      </section>


      <div className="floating-cta">
        <p>
          <strong>
            Скидка 15%
          </strong>
          {' — '}
          предложение до 31 июля
        </p>

        <Link
          to="/courses"
          className="btn btn-primary"
        >
          Начать бесплатно
        </Link>

        <Link
          to="#"
          className="btn btn-ghost"
          style={{
            padding: '8px',
            fontSize: '13px',
          }}
        >
          💬
        </Link>
      </div>
    </>
  )
                }
