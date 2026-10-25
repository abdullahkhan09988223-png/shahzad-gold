'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar' // 👈 ایمپورت سایدبار
import { ArrowRight, UserPlus, Menu } from 'lucide-react'

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function NewEmployeePage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // برای چک کردن لاگین
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    position: '',
    hireDate: new Date().toISOString().split('T')[0],
    salaryAmount: '',
    salaryCurrency: 'AFN',
  })

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      // 👈 قفل امنیتی
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('employees')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      setUser(authData.user)
      setLoading(false)
    }
    init()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (data.success) {
        window.location.href = '/employees'
      } else {
        setError(data.error || 'خطا در ثبت کارمند')
        setSaving(false)
      }
    } catch (err) {
      setError('خطای شبکه: ' + String(err))
      setSaving(false)
    }
  }

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      
      {/* 👈 سایدبار */}
      <Sidebar 
        user={user} 
        activePath="/employees" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      {/* محتوای اصلی */}
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium">
                <UserPlus size={18} className="text-[var(--accent)]" />
                <span>ثبت کارمند جدید</span>
              </div>
            </div>
            <Link href="/employees" className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition font-medium">
              <ArrowRight size={16} /> بازگشت به لیست
            </Link>
          </div>
        </header>

        <main className="p-6 max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 md:p-8 shadow-2xl border-t-4 border-t-[var(--accent)] space-y-6">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نام کامل <span className="text-red-500">*</span></label>
                <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required placeholder="مثلاً: محمد محمدی" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">شماره تلفن <span className="text-red-500">*</span></label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange} required placeholder="07XX XXX XXX" dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">سمت <span className="text-red-500">*</span></label>
                <input type="text" name="position" value={form.position} onChange={handleChange} required placeholder="مثلاً: فروشنده، حسابدار، مدیر" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">تاریخ استخدام</label>
                <input type="date" name="hireDate" value={form.hireDate} onChange={handleChange} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">واحد پول معاش</label>
                <select name="salaryCurrency" value={form.salaryCurrency} onChange={handleChange} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors">
                  <option value="AFN">افغانی (؋)</option>
                  <option value="USD">دالر ($)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">معاش ماهانه <span className="text-red-500">*</span></label>
                <input type="number" name="salaryAmount" value={form.salaryAmount} onChange={handleChange} required min="0" step="0.01" dir="ltr" placeholder="15000" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors text-lg font-bold" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-[var(--border-base)]">
              <button type="submit" disabled={saving} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold text-sm transition-all glow-button shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                {saving ? 'در حال ذخیره...' : '💾 ذخیره کارمند'}
              </button>
              <Link href="/employees" className="px-8 py-3.5 bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] rounded-xl font-bold text-sm transition flex items-center justify-center">
                لغو
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}