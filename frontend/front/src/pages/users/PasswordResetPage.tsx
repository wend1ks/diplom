import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Link from '../../components/Link'
import Notice from '../../components/Notice'
import { go, request } from '../../lib/api'

type Step = 'email' | 'code' | 'password'

export default function PasswordResetPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState<string[]>(() => Array(6).fill(''))
  const [password, setPassword] = useState('')
  const [passwordRepeat, setPasswordRepeat] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const [sending, setSending] = useState(false)
  const codeInputs = useRef<Array<HTMLInputElement | null>>([])

  function showMessage(text: string, isError = false) {
    setMessage(text)
    setError(isError)
  }

  async function submitEmail(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    try {
      const data = await request('/auth/password-reset/request/', { method: 'POST', body: JSON.stringify({ email }) })
      showMessage(data.detail)
      setStep('code')
    } catch (requestError) { showMessage((requestError as Error).message, true) } finally { setSending(false) }
  }

  async function submitCode(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    try {
      const data = await request('/auth/password-reset/verify/', { method: 'POST', body: JSON.stringify({ email, code: code.join('') }) })
      setResetToken(data.reset_token)
      showMessage('Код подтверждён. Придумайте новый пароль.')
      setStep('password')
    } catch (requestError) { showMessage((requestError as Error).message, true) } finally { setSending(false) }
  }

  function fillCode(startIndex: number, rawValue: string) {
    const digits = rawValue.replace(/\D/g, '').slice(0, 6 - startIndex).split('')
    if (!digits.length) return
    setCode((current: string[]) => {
      const next = [...current]
      digits.forEach((digit: string, offset: number) => { next[startIndex + offset] = digit })
      return next
    })
    codeInputs.current[Math.min(startIndex + digits.length, 5)]?.focus()
  }

  function changeCodeDigit(index: number, value: string) {
    const digits = value.replace(/\D/g, '')
    if (digits.length > 1) { fillCode(index, digits); return }
    setCode((current: string[]) => current.map((digit: string, digitIndex: number) => digitIndex === index ? digits : digit))
    if (digits && index < 5) codeInputs.current[index + 1]?.focus()
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault()
    if (password !== passwordRepeat) { showMessage('Пароли не совпадают.', true); return }
    setSending(true)
    try {
      const data = await request('/auth/password-reset/confirm/', { method: 'POST', body: JSON.stringify({ email, reset_token: resetToken, password }) })
      showMessage(data.detail)
      window.setTimeout(() => go('/signin'), 1200)
    } catch (requestError) { showMessage((requestError as Error).message, true) } finally { setSending(false) }
  }

  return <section className="auth card">
    <h1>Восстановление пароля</h1>
    {step === 'email' && <form onSubmit={submitEmail}>
      <p>Введите почту, указанную в аккаунте. Мы отправим 6-значный код.</p>
      <label>Электронная почта<input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} /></label>
      <button className="button primary" disabled={sending}>{sending ? 'Отправляем…' : 'Получить код'}</button>
    </form>}
    {step === 'code' && <form onSubmit={submitCode}>
      <fieldset className="otp-field" aria-label="Verification code">
        <div className="otp-inputs" onPaste={event => { event.preventDefault(); fillCode(0, event.clipboardData.getData('text')) }}>
          {code.map((digit: string, index: number) => <input
            key={index}
            ref={element => { codeInputs.current[index] = element }}
            className="otp-input"
            aria-label={`Digit ${index + 1}`}
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={digit}
            onChange={event => changeCodeDigit(index, event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Backspace' && !code[index] && index > 0) {
                event.preventDefault()
                setCode((current: string[]) => current.map((item, itemIndex) => itemIndex === index - 1 ? '' : item))
                codeInputs.current[index - 1]?.focus()
              }
              if (event.key === 'ArrowLeft' && index > 0) codeInputs.current[index - 1]?.focus()
              if (event.key === 'ArrowRight' && index < 5) codeInputs.current[index + 1]?.focus()
            }}
          />)}
        </div>
        <button className="button primary" disabled={sending || code.some((digit: string) => !digit)}>{sending ? 'Проверяем…' : 'Подтвердить код'}</button>
      </fieldset>
      <p>Код отправлен на <strong>{email}</strong>. Он действует 10 минут.</p>
      <label>Код из письма<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code.join('')} onChange={event => setCode(Array.from({ length: 6 }, (_, index) => event.target.value.replace(/\D/g, '').slice(0, 6)[index] || ''))} /></label>
      <button className="button primary" disabled={sending}>{sending ? 'Проверяем…' : 'Подтвердить код'}</button>
      <button className="button ghost" type="button" disabled={sending} onClick={() => { setStep('email'); showMessage('') }}>Изменить почту</button>
    </form>}
    {step === 'password' && <form onSubmit={submitPassword}>
      <p>Введите новый пароль для аккаунта <strong>{email}</strong>.</p>
      <label>Новый пароль<input required type="password" autoComplete="new-password" minLength={8} value={password} onChange={event => setPassword(event.target.value)} /></label>
      <label>Повторите пароль<input required type="password" autoComplete="new-password" minLength={8} value={passwordRepeat} onChange={event => setPasswordRepeat(event.target.value)} /></label>
      <button className="button primary" disabled={sending}>{sending ? 'Сохраняем…' : 'Сменить пароль'}</button>
    </form>}
    <Notice text={message} error={error} />
    <p><Link to="/signin">Вернуться ко входу</Link></p>
  </section>
}
