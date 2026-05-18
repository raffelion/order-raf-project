import { Link } from 'react-router-dom'

export function BrandLockup({
  to = '/',
  className = '',
  subtitle = 'Client workspace',
}: {
  to?: string
  className?: string
  subtitle?: string
}) {
  const value = className ? `brand ${className}` : 'brand'

  return (
    <Link to={to} className={value}>
      <img src="/raf-circle-logo.png" alt="RAF Project logo" className="brand-logo" />
      <div>
        <strong>RAF Project</strong>
        <span>{subtitle}</span>
      </div>
    </Link>
  )
}
