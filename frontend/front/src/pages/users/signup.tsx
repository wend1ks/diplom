import AuthPage from './AuthPage'
/** React page for users/templates/signup.html. */
export default function SignupPage({ onAuth = () => undefined }: { onAuth?: () => void }) {
  return <AuthPage signup onAuth={onAuth} />
}
