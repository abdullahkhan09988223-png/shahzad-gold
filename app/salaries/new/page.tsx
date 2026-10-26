'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { ArrowRight, Home, Menu, Save, Coins } from 'lucide-react'

type Employee = { id: number; fullName: string; salaryAmount: string; salaryCurrency: string }
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function NewSalaryPage() {
  const { language } = useI18n()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [form, setForm] = useState({
    employeeId: '',
    amount: '',
    currency: 'AFN',
    bonus: '',
    deduction: '',
    forMonth: '', // 👈 مقدار اولیه خالی است تا بیلد ارور ندهد
    notes: ''
  })

  // 👇 مقداردهی اولیه تاریخ در useEffect (بعد از باز شدن صفحه) 👇
  useEffect(() => {
    // دریافت تاریخ ماه جاری
    const d = new Date()
    const faDate = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit'
    }).format(d)
    
    setForm(prev => ({ ...prev, forMonth: faDate }))

    const init = async () => {
      try {
        const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
        const authData = await authRes.json()
        if (!authData.success) return window.location.href = '/login'
        setUser(authData.user)

        const empRes = await fetch('/api/employees', { cache: 'no-store' })
        const empData = await empRes.json()
        if (empData.success) setEmployees(empData.employees)
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  // وقتی کارمند انتخاب می‌شود، مبلغ معاش پیش‌فرض او پر می‌شود
  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const empId = e.target.value
    const selectedEmp = employees.find(emp => emp.id === Number(empId))
    
    setForm(prev => ({
      ...prev,
      employeeId: empId,
      amount: selectedEmp ? selectedEmp.salaryAmount : '',
      currency: selectedEmp ? selectedEmp.salaryCurrency : 'AFN'
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch('/api/salaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) router.push('/salaries')
      else setError(data.error || 'خطا در ثبت معاش')
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
      <Sidebar user={user} activePath="/salaries" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)]"><Home size={14} /> داشبورد</Link>
              <Link href="/salaries" className="text-sm text-[var(--text-secondary)] flex items-center gap-2 font-medium"><ArrowRight size={16} /> بازگشت</Link>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-3xl mx-auto">
          <div className="glass-card rounded-3xl p-8 border-t-4 border-t-[var(--accent)] shadow-2xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><Coins size={24} className="text-[var(--accent)]"/> ثبت پرداخت معاش</h1>
            
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">کارمند</label>
                  <select value={form.employeeId} onChange={handleEmployeeChange} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="">انتخاب کنید...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">ماه پرداخت</label>
                  <input type="text" value={form.forMonth} onChange={e => setForm({...form, forMonth: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مبلغ معاش</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">واحد پول</label>
                  <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="AFN">افغانی (؋)</option>
                    <option value="USD">دالر ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوعیت</label>
                  <div className="text-xs text-[var(--text-muted)] mt-3">پرداخت نقدی</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-green-500 mb-2">پاداش (اختیاری)</label>
                  <input type="number" step="0.01" value={form.bonus} onChange={e => setForm({...form, bonus: e.target.value})} dir="ltr" className="w-full bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-red-500 mb-2">کسرات (اختیاری)</label>
                  <input type="number" step="0.01" value={form.deduction} onChange={e => setForm({...form, deduction: e.target.value})} dir="ltr" className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">یادداشت (اختیاری)</label>
                <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 bg-[var(--accent)] text-white py-3.5 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save size={20} /> {saving ? 'در حال ثبت...' : 'ثبت معاش'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}