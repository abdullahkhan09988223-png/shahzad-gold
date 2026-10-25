'use client'

import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { Globe } from 'lucide-react'

export default function LoginPage() {
  const { t, language, setLanguage } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ username: '', password: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (data.success) {
        window.location.href = '/'
      } else {
        setError(data.error || t('login_error'))
        setLoading(false)
      }
    } catch (err) {
      setError(String(err))
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-base)] transition-colors duration-500" dir={language === 'fa' ? 'rtl' : 'ltr'}>
      {/* پس‌زمینه (Cover Page) */}
      <div className="absolute inset-0 z-0">
        <img src="https://i.ibb.co/mrP08vdB/IMG-1802.jpg" alt="Cover" className="w-full h-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/80 to-transparent"></div>
      </div>

      {/* دکمه تغییر زبان */}
      <div className="absolute top-6 right-6 z-20 flex gap-2">
        <button onClick={() => setLanguage(language === 'fa' ? 'en' : 'fa')} className="w-10 h-10 rounded-full bg-[var(--bg-surface)] backdrop-blur-md border border-[var(--border-base)] flex items-center justify-center text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition shadow-sm">
          <Globe size={16} />
        </button>
      </div>

      {/* فرم ورود (Glassmorphism) */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-3xl overflow-hidden mb-5 border-2 border-[var(--accent)] shadow-[0_0_30px_var(--accent-glow)]">
            <img src="https://i.ibb.co/Z1LnH2NF/be92f52f-1593-4384-86f0-c7ebd960e446.jpg" alt="SHAHZAD GOLD" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-widest">
            {t('business_name')}
          </h1>
          <p className="text-sm text-[var(--accent)] font-bold tracking-wider mt-2 uppercase">
            {t('business_sub')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 shadow-2xl space-y-5 border-t-4 border-t-[var(--accent)]">
          <h2 className="text-lg font-bold text-center text-[var(--text-primary)] mb-2">
            🔐 {t('login')}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl text-xs text-center font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 px-1">
              {t('username')}
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoFocus
              dir="ltr"
              placeholder="admin"
              className="w-full px-4 py-3.5 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 px-1">
              {t('password')}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              dir="ltr"
              placeholder="••••••••"
              className="w-full px-4 py-3.5 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 rounded-xl font-bold text-sm transition-all duration-300 glow-button transform hover:scale-[1.02] mt-4"
          >
            {loading ? t('logging_in') : t('login')}
          </button>
        </form>

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-8">
          © 1404 {t('business_name')} - {t('copyright')}
        </p>
      </div>
    </main>
  )
}