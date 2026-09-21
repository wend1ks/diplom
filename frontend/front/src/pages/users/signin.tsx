import AuthPage from './AuthPage'
/** React page for users/templates/signin.html. */
export default function SigninPage({ onAuth = () => undefined }: { onAuth?: () => void }) {
  return <AuthPage signup={false} onAuth={onAuth} />
}
