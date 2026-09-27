import type { CSSProperties, ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
export default function Link({ to, children, className = '', style }: { to: string; children: ReactNode; className?: string; style?: CSSProperties }) {
  return <RouterLink className={className} to={to} style={style}>{children}</RouterLink>
}
