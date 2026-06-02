import { useState } from 'react'
import { Navigate } from 'react-router-dom'

export function Login({ onSignIn, user }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (user) return <Navigate to="/portfolio" replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await onSignIn({ email, password })
    if (err) setError('Incorrect email or password.')
    setLoading(false)
  }

  const inputClass = `w-full px-4 py-3 text-sm rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100 placeholder-surface-300 dark:placeholder-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 dark:focus:border-primary-500 transition-shadow [color-scheme:light] dark:[color-scheme:dark]`

  return (
    <div className="min-h-screen flex">

      {/* Left panel — warm espresso brand */}
      <div className="hidden lg:flex lg:w-[44%] flex-col justify-between bg-surface-900 dark:bg-surface-950 relative overflow-hidden p-12">
        {/* Electric indigo dot grid */}
        <div
          className="absolute inset-0 opacity-[0.18] pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(oklch(0.60 0.26 280 / 0.9) 1px, transparent 1px)', backgroundSize: '22px 22px' }}
          aria-hidden="true"
        />
        {/* Electric glow orb */}
        <div
          className="absolute bottom-[-60px] left-[-60px] w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.60 0.26 280 / 0.30) 0%, transparent 68%)' }}
          aria-hidden="true"
        />
        {/* Secondary glow top-right */}
        <div
          className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(0.64 0.19 150 / 0.15) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        {/* Top: wordmark */}
        <div className="relative z-10">
          <span className="text-2xl font-bold text-white tracking-tight">spaceeeee</span>
        </div>
        {/* Bottom: tagline */}
        <div className="relative z-10">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-[0.07em]st mb-4">Personal finance</p>
          <p className="text-white text-[1.65rem] font-semibold leading-snug max-w-[260px]">
            Track what you own and what you spend, together.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 bg-surface-50 dark:bg-surface-950">
        {/* Mobile wordmark */}
        <div className="lg:hidden mb-10 text-center">
          <span className="text-2xl font-bold text-surface-900 dark:text-surface-100 tracking-tight">spaceeeee</span>
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-xl font-semibold text-surface-900 dark:text-surface-100 mb-1 tracking-tight">Welcome back</h1>
          <p className="text-sm text-surface-400 dark:text-surface-500 mb-8">Sign in to your space.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-[0.07em]">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                className={inputClass}
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1.5 uppercase tracking-[0.07em]">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                className={inputClass}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <div role="alert" className="px-3 py-2.5 rounded-xl bg-loss-light dark:bg-loss/10 border border-loss/20 text-xs font-medium text-loss">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold rounded-xl bg-primary-500 text-white hover:bg-primary-600 active:scale-[0.99] disabled:opacity-50 transition-all mt-2"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
