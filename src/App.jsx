import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Navbar } from './components/shared/Navbar'
import { Login } from './pages/Login'
import { Portfolio } from './pages/Portfolio'
import { Expenses } from './pages/Expenses'
import { Combined } from './pages/Combined'
import { Notes } from './pages/Notes'
import { Dates } from './pages/Dates'
import { ToastProvider } from './components/shared/Toast'
import { supabase } from './lib/supabase'
import { useEffect, useState } from 'react'

function ProtectedLayout({ user, onSignOut }) {
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    if (!user) return
    supabase
      .from('user_settings')
      .select('display_name')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setDisplayName(data.display_name)
      })
  }, [user])

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Navbar
        onSignOut={onSignOut}
        displayName={displayName}
        userId={user?.id}
        onNameUpdated={setDisplayName}
      />
      {/* Spacer for fixed floating nav: mobile=2 pills (112px), desktop=1 pill (64px) */}
      <main className="pt-28 md:pt-20">
        <Routes>
          <Route path="/portfolio" element={<Portfolio user={user} />} />
          <Route path="/expenses" element={<Expenses user={user} />} />
          <Route path="/combined" element={<Combined user={user} />} />
          <Route path="/notes" element={<Notes user={user} />} />
          <Route path="/dates" element={<Dates user={user} />} />
          <Route path="*" element={<Navigate to="/portfolio" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const { user, loading, signIn, signOut } = useAuth()

  // Apply stored theme on mount
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary-400 dot-pulse"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login onSignIn={signIn} user={user} />} />
        <Route
          path="/*"
          element={
            user
              ? <ProtectedLayout user={user} onSignOut={signOut} />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  )
}
