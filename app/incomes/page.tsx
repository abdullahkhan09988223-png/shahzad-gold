'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { Menu, Banknote, Plus, X, TrendingUp } from 'lucide-react'

type Income = {
  id: number
  title: string
  amountUsd: string
  notes: string | null
  date: string
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function IncomesPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [incomes, setIncomes] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const [isMounted, setIsMounted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    title: '',
    amountUsd: '',
    notes: ''
  })

  useEffect(() => {
    setIsMounted(true)

    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('incomes')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }
      setUser(authData.user)
      await load()
    }
    init()
  }, [])

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/incomes', { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setIncomes(data.incomes)
    setLoading(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/incomes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ title: '', amountUsd: '', notes: '' })
    setShowForm(false)
    setSaving(false)
    load()
  }

  const fmt = (n: string | number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  
  const totalIncome = incomes.reduce((sum, i) => sum + Number(i.amountUsd), 0)

  if (!isMounted) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>
  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      
      <Sidebar user={user} activePath="/incomes" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]">
                <Menu size={24} />
              </button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium">
                <Banknote size={18} className="text-[var(--accent)]" />
                <span>عواید متفرقه</span>
              </div>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all glow-button shadow-lg">
              {showForm ? <X size={16} /> : <Plus size={16} />} 
              {showForm ? 'بستن' : 'ثبت عواید جدید'}
            </button>
          </div>
        </header>

        <main className="p-6 max-w-5xl mx-auto">
          
          <div className="glass-card rounded-3xl p-6 mb-8 flex items-center gap-5 border-t-4 border-t-green-500">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
              <TrendingUp size={28} />
            </div>
            <div>
              <div className="text-sm text-[var(--text-secondary)] mb-1 font-medium">مجموع کل عواید متفرقه</div>
              <div className="text-3xl font-extrabold text-green-500" dir="ltr">${fmt(totalIncome)}</div>
            </div>
          </div>

          {showForm && (
            <form onSubmit={submit} className="glass-card rounded-3xl p-6 mb-8 border-t-4 border-t-[var(--accent)]">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
                <Banknote size={22} className="text-[var(--accent)]"/> 
                ثبت عواید جدید
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">عنوان / منبع عواید</label>
                  <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="مثلاً: کرایه دکان، سود حواله" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مبلغ ($)</label>
                  <input type="number" step="0.01" value={form.amountUsd} onChange={e => setForm({...form, amountUsd: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">یادداشت (اختیاری)</label>
                  <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold glow-button">
                {saving ? 'در حال ثبت...' : '💾 ثبت عواید'}
              </button>
            </form>
          )}

          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border-base)]">
              <h2 className="font-bold text-lg">تاریخچه عواید متفرقه</h2>
            </div>
            {loading ? (
              <div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>
            ) : incomes.length === 0 ? (
              <div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ عوایدی ثبت نشده است</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr>
                      <th className="p-4 text-right font-bold">تاریخ</th>
                      <th className="p-4 text-right font-bold">عنوان</th>
                      <th className="p-4 text-right font-bold">مبلغ ($)</th>
                      <th className="p-4 text-right font-bold">یادداشت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomes.map(inc => (
                      <tr key={inc.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-4 text-xs text-[var(--text-secondary)]" dir="ltr">
                          {new Date(inc.date).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="p-4 font-bold text-[var(--text-primary)]">{inc.title}</td>
                        <td className="p-4 font-bold text-green-500" dir="ltr">${fmt(inc.amountUsd)}</td>
                        <td className="p-4 text-xs text-[var(--text-muted)]">{inc.notes || '-'}</td>
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