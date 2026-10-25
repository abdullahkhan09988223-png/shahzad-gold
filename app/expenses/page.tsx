'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { Menu, Receipt, Plus, X, Calendar } from 'lucide-react'

type Expense = { id: number; category: string; amountUsd: string; description: string | null; date: string }
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function ExpensesPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ category: 'غذا', amountUsd: '', description: '' })

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      // موقتا فقط ادمین دسترسی دارد (یا می‌توانید کلید expenses را در پنل کاربران اضافه کنید)
      if (authData.user.role !== 'ADMIN') {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }
      setUser(authData.user)

      const res = await fetch('/api/expenses', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setExpenses(data.expenses)
      setLoading(false)
    }
    init()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await fetch('/api/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ category: 'غذا', amountUsd: '', description: '' })
    setShowForm(false); setSaving(false)
    
    // رفرش لیست
    const res = await fetch('/api/expenses', { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setExpenses(data.expenses)
  }

  const fmt = (n: string | number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/expenses" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><Receipt size={18} className="text-[var(--accent)]" /><span>مدیریت مصارف</span></div>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all glow-button shadow-lg">
              {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'بستن' : 'ثبت مصرف جدید'}
            </button>
          </div>
        </header>

        <main className="p-6 max-w-5xl mx-auto">
          {showForm && (
            <form onSubmit={submit} className="glass-card rounded-3xl p-6 mb-8 border-t-4 border-t-[var(--accent)]">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-2"><Receipt size={22} className="text-[var(--accent)]"/> ثبت مصرف جدید</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوعیت مصرف</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="غذا">🍲 غذا</option>
                    <option value="کرایه">🏢 کرایه</option>
                    <option value="آب">💧 آب</option>
                    <option value="برق">⚡ برق</option>
                    <option value="متفرقه">📦 متفرقه</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مبلغ ($)</label>
                  <input type="number" step="0.01" value={form.amountUsd} onChange={e => setForm({...form, amountUsd: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">توضیحات (اختیاری)</label>
                  <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold glow-button">{saving ? 'در حال ذخیره...' : '💾 ثبت مصرف'}</button>
            </form>
          )}

          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border-base)]"><h2 className="font-bold text-lg">تاریخچه مصارف</h2></div>
            {expenses.length === 0 ? (
              <div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ مصرفی ثبت نشده است</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr><th className="p-4 text-right font-bold">تاریخ</th><th className="p-4 text-right font-bold">نوعیت</th><th className="p-4 text-right font-bold">مبلغ ($)</th><th className="p-4 text-right font-bold">توضیحات</th></tr>
                  </thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-4 text-xs text-[var(--text-secondary)]" dir="ltr">{new Date(e.date).toLocaleDateString('fa-IR')}</td>
                        <td className="p-4 text-xs font-bold">{e.category}</td>
                        <td className="p-4 text-xs font-bold text-red-500" dir="ltr">${fmt(e.amountUsd)}</td>
                        <td className="p-4 text-xs text-[var(--text-muted)]">{e.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}