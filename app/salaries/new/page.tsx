'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar' // 👈 ایمپورت سایدبار
import { ArrowRight, Banknote, Menu } from 'lucide-react'

type Employee = {
  id: number
  fullName: string
  position: string
  salaryAmount: string
  salaryCurrency: string
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function NewSalaryPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // تاریخ شمسی فعلی برای پیش‌فرض
  const getCurrentMonth = () => {
    const d = new Date()
    const faDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
    }).format(d)
    return faDate.replace('/', '-')
  }

  const [form, setForm] = useState({
    employeeId: '',
    amount: '',
    currency: 'AFN',
    bonus: '',
    deduction: '',
    forMonth: getCurrentMonth(),
    notes: '',
  })

  useEffect(() => {
    const init = async () => {
      // ۱. بررسی لاگین و دسترسی
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      // 👈 قفل امنیتی
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('salaries')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }
      setUser(authData.user)

      // ۲. گرفتن لیست کارمندان
      try {
        const res = await fetch('/api/employees', { cache: 'no-store' })
        const data = await res.json()
        if (data.success) setEmployees(data.employees)
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => {
      const updated = { ...prev, [name]: value }

      // وقتی کارمند انتخاب شد، معاشش رو خودکار پر کن
      if (name === 'employeeId') {
        const emp = employees.find((e) => e.id === Number(value))
        if (emp) {
          updated.amount = emp.salaryAmount
          updated.currency = emp.salaryCurrency
        }
      }
      return updated
    })
  }

  const amount = Number(form.amount) || 0
  const bonus = Number(form.bonus) || 0
  const deduction = Number(form.deduction) || 0
  const netPay = amount + bonus - deduction

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch('/api/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        window.location.href = '/salaries'
      } else {
        setError(data.error || 'خطا در ثبت معاش')
        setSaving(false)
      }
    } catch (err) {
      setError(String(err))
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
        activePath="/salaries" 
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
                <Banknote size={18} className="text-[var(--accent)]" />
                <span>ثبت پرداخت معاش جدید</span>
              </div>
            </div>
            <Link href="/salaries" className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition font-medium">
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
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">کارمند <span className="text-red-500">*</span></label>
                <select name="employeeId" value={form.employeeId} onChange={handleChange} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors">
                  <option value="">-- انتخاب کارمند --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName} - {e.position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">ماه (شمسی) <span className="text-red-500">*</span></label>
                <input type="text" name="forMonth" value={form.forMonth} onChange={handleChange} required placeholder="مثلاً: 1404-07" dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">فرمت: سال-ماه (مثلاً 1404-07)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">واحد پول</label>
                <select name="currency" value={form.currency} onChange={handleChange} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors">
                  <option value="AFN">افغانی (؋)</option>
                  <option value="USD">دالر ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مبلغ معاش <span className="text-red-500">*</span></label>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} required step="0.01" min="0" dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">🎁 پاداش (اختیاری)</label>
                <input type="number" name="bonus" value={form.bonus} onChange={handleChange} step="0.01" min="0" placeholder="0" dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">✂️ کسرات (اختیاری)</label>
                <input type="number" name="deduction" value={form.deduction} onChange={handleChange} step="0.01" min="0" placeholder="0" dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">یادداشت (اختیاری)</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"></textarea>
              </div>
            </div>

            {/* خلاصه پرداخت */}
            <div className="bg-[var(--accent-bg)] border border-[var(--accent)] rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-[var(--accent)] text-sm mb-2 flex items-center gap-2">💡 خلاصه پرداخت</h3>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">معاش اصلی:</span>
                <span className="font-bold text-[var(--text-primary)]" dir="ltr">{amount.toFixed(2)} {form.currency === 'USD' ? '$' : '؋'}</span>
              </div>
              {bonus > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">پاداش:</span>
                  <span className="font-bold text-green-500" dir="ltr">+ {bonus.toFixed(2)}</span>
                </div>
              )}
              {deduction > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">کسرات:</span>
                  <span className="font-bold text-red-500" dir="ltr">− {deduction.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-[var(--accent)]/30 pt-3 mt-3 font-bold text-lg">
                <span className="text-[var(--text-primary)]">خالص پرداختی:</span>
                <span className="text-[var(--accent)]" dir="ltr">{netPay.toFixed(2)} {form.currency === 'USD' ? '$' : '؋'}</span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-[var(--border-base)]">
              <button type="submit" disabled={saving} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold text-sm transition-all glow-button shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                {saving ? 'در حال ذخیره...' : '💾 ثبت پرداخت معاش'}
              </button>
              <Link href="/salaries" className="px-8 py-3.5 bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] rounded-xl font-bold text-sm transition flex items-center justify-center">
                لغو
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}