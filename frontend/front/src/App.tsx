import {useEffect,useState} from 'react'
import type { ReactNode } from 'react'
import { HashRouter, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import './App.css'
import './pages/adminpanel/css/admin.css'
import './pages/courses/css/learning.css'
import './pages/users/css/auth.css'
import './pages/landing/css/landing.css'
import './design.css'
import './theme.css'
import {request} from './lib/api'
import PageLoader from './components/PageLoader'
import SiteLayout from './layouts/SiteLayout'
import Landing from './pages/landing/landing'
import SigninPage from './pages/users/signin'
import SignupPage from './pages/users/signup'
import PasswordResetPage from './pages/users/PasswordResetPage'
import GitHubCallbackPage from './pages/users/GitHubCallbackPage'
import ProfilePage from './pages/users/profile'
import ProfileEditPage from './pages/users/ProfileEdit'
import TeacherRequestPage from './pages/users/TeacherRequestPage'
import CourseListPage from './pages/courses/CourseListPage'
import CourseDetailPage from './pages/courses/CourseDetailPage'
import LessonDetailPage from './pages/courses/LessonDetailPage'
import AssignmentDetailPage from './pages/courses/AssignmentDetailPage'
import AdminDashboardPage from './pages/adminpanel/AdminDashboardPage'
import AdminCrudPage from './pages/adminpanel/AdminCrudPage'

function CourseRoute(){ const { slug = '' } = useParams(); return <CourseDetailPage slug={slug}/> }
function LessonRoute(){ const { lessonId = '' } = useParams(); return <LessonDetailPage lessonId={lessonId}/> }
function AssignmentRoute(){ const { assignmentId = '' } = useParams(); return <AssignmentDetailPage assignmentId={assignmentId}/> }
function AdminCrudRoute({ role }: { role?: string }){ const { resource = 'courses' } = useParams(); if (resource === 'teacher-requests' && role !== 'admin') return <Navigate to="/admin" replace />; return <AdminCrudPage key={resource} resource={resource} role={role}/> }
function ProtectedRoute({ me, loading, children }: { me: any; loading: boolean; children: ReactNode }) {
  if (loading) return <PageLoader />
  return me ? <>{children}</> : <Navigate to="/signin" replace />
}

function AppRoutes() {
  const [me,setMe]=useState<any>(null)
  const [loading,setLoading]=useState(true) 
  const [theme, setTheme] = useState<'dark' | 'light'>(() => localStorage.getItem('theme') === 'light' ? 'light' : 'dark')
  const navigate = useNavigate()
  useEffect(()=>{const access=localStorage.getItem('access');if(!access){setLoading(false);return}request('/auth/me/').then(setMe).catch(()=>{localStorage.removeItem('access');localStorage.removeItem('refresh');setMe(null)}).finally(()=>setLoading(false))},[])
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme) }, [theme])
  const logout=()=>{localStorage.removeItem('access');localStorage.removeItem('refresh');setMe(null);navigate('/')}
  const refreshMe=()=>request('/auth/me/').then(user=>{setMe(user);setLoading(false)})
  return <SiteLayout me={me} onLogout={logout}><><button className="theme-toggle" type="button" onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему'} title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>{theme === 'dark' ? '☀' : '☾'}</button><Routes>
    <Route path="/" element={<Landing/>}/>
    <Route path="/signin" element={<SigninPage onAuth={refreshMe}/>}/>
    <Route path="/signup" element={<SignupPage onAuth={refreshMe}/>}/>
    <Route path="/forgot-password" element={<PasswordResetPage/>}/>
    <Route path="/auth/github/callback" element={<GitHubCallbackPage onAuth={refreshMe}/>}/>
    <Route path="/courses" element={<ProtectedRoute me={me} loading={loading}><CourseListPage/></ProtectedRoute>}/>
    <Route path="/courses/:slug" element={<ProtectedRoute me={me} loading={loading}><CourseRoute/></ProtectedRoute>}/>
    <Route path="/lessons/:lessonId" element={<ProtectedRoute me={me} loading={loading}><LessonRoute/></ProtectedRoute>}/>
    <Route path="/assignments/:assignmentId" element={<ProtectedRoute me={me} loading={loading}><AssignmentRoute/></ProtectedRoute>}/>
    <Route path="/profile" element={<ProtectedRoute me={me} loading={loading}><ProfilePage/></ProtectedRoute>}/>
    <Route path="/profile/edit" element={<ProtectedRoute me={me} loading={loading}><ProfileEditPage/></ProtectedRoute>}/>
    <Route path="/teacher-request" element={<ProtectedRoute me={me} loading={loading}>{me?.role === 'student' ? <TeacherRequestPage/> : <Navigate to="/profile" replace/>}</ProtectedRoute>}/>
    <Route path="/admin" element={<ProtectedRoute me={me} loading={loading}>{['admin', 'teacher'].includes(me?.role) ? <AdminDashboardPage role={me.role}/> : <Navigate to="/profile" replace/>}</ProtectedRoute>}/>
    <Route path="/admin/:resource" element={<ProtectedRoute me={me} loading={loading}>{['admin', 'teacher'].includes(me?.role) ? <AdminCrudRoute role={me.role}/> : <Navigate to="/profile" replace/>}</ProtectedRoute>}/>
    <Route path="*" element={<Landing/>}/>
  </Routes></></SiteLayout>
}

export default function App() { return <HashRouter><AppRoutes/></HashRouter> }
