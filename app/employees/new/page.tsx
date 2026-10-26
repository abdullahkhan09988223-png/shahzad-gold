'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { ArrowRight, Home, Menu, Save, UserPlus } from 'lucide-react'

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function NewEmployeePage() {
  const { language } = useI18n()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    position: '',
    hireDate: '', // 👈 خالی گذاشتیم تا در زمان بیلد ارور نده
    salaryAmount: '',
    salaryCurrency: 'AFN',
  })

  // 👇 تاریخ رو فقط زمانی که صفحه در مرورگر باز شد پر میکنیم 👇
  useEffect(() => {
    setForm(prev => ({ ...prev, hireDate: new Date().toISOString().split('T')[0] }))
    
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      setUser(authData.user)
      setLoading(false)
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) router.push('/employees')
      else setError(data.error || 'خطا در ثبت کارمند')
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/employees" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)]"><Home size={14} /> داشبورد</Link>
              <Link href="/employees" className="text-sm text-[var(--text-secondary)] flex items-center gap-2 font-medium"><ArrowRight size={16} /> بازگشت</Link>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-3xl mx-auto">
          <div className="glass-card rounded-3xl p-8 border-t-4 border-t-[var(--accent)] shadow-2xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><UserPlus size={24} className="text-[var(--accent)]"/> ثبت کارمند جدید</h1>
            
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نام و تخلص</label>
                  <input type="text" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">شماره تلفن</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">وظیفه / سمت</label>
                  <input type="text" value={form.position} onChange={e => setForm({...form, position: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">تاریخ استخدام</label>
                  <input type="date" value={form.hireDate} onChange={e => setForm({...form, hireDate: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مبلغ معاش</label>
                  <input type="number" step="0.01" value={form.salaryAmount} onChange={e => setForm({...form, salaryAmount: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">واحد پول</label>
                  <select value={form.salaryCurrency} onChange={e => setForm({...form, salaryCurrency: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="AFN">افغانی (؋)</option>
                    <option value="USD">دالر ($)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 bg-[var(--accent)] text-white py-3.5 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save size={20} /> {saving ? 'در حال ثبت...' : 'ثبت کارمند'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}