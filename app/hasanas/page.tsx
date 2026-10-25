'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { Menu, HeartHandshake, Plus, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react'

type Hasana = {
  id: number
  customerName: string
  type: string
  amount: string
  direction: string
  notes: string | null
  date: string
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function HasanatPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [hasanas, setHasanas] = useState<Hasana[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const [isMounted, setIsMounted] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    customerName: '',
    type: 'USD',
    amount: '',
    direction: 'GIVEN',
    notes: ''
  })

  useEffect(() => {
    setIsMounted(true)

    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('hasanas')) {
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
    const res = await fetch('/api/hasanas', { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setHasanas(data.hasanas)
    setLoading(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await fetch('/api/hasanas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setForm({ customerName: '', type: 'USD', amount: '', direction: 'GIVEN', notes: '' })
    setShowForm(false); setSaving(false)
    load()
  }

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const getUnit = (type: string) => type === 'GOLD' ? 'توله' : type === 'SILVER' ? 'گرام' : type === 'USD' ? 'دالر' : 'افغانی'

  if (!isMounted) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>
  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/hasanas" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><HeartHandshake size={18} className="text-[var(--accent)]" /><span>قرض حسنه (بدون سود)</span></div>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all glow-button shadow-lg">
              {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'بستن' : 'ثبت قرض حسنه'}
            </button>
          </div>
        </header>

        <main className="p-6 max-w-5xl mx-auto">
          {showForm && (
            <form onSubmit={submit} className="glass-card rounded-3xl p-6 mb-8 border-t-4 border-t-[var(--accent)]">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-2"><HeartHandshake size={22} className="text-[var(--accent)]"/> ثبت قرض حسنه جدید</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نام شخص</label>
                  <input type="text" value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوعیت قرض</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="USD">💵 دالر</option>
                    <option value="AFN">💴 افغانی</option>
                    <option value="GOLD">🥇 طلا (توله)</option>
                    <option value="SILVER">🥈 نقره (گرام)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">جهت قرض</label>
                  <select value={form.direction} onChange={e => setForm({...form, direction: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="GIVEN">⬆️ ما دادیم (از خزانه کم می‌شود)</option>
                    <option value="TAKEN">⬇️ ما گرفتیم (به خزانه اضافه می‌شود)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مقدار</label>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">یادداشت (اختیاری)</label>
                  <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold glow-button">{saving ? 'در حال ثبت...' : '💾 ثبت قرض حسنه'}</button>
            </form>
          )}

          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border-base)]"><h2 className="font-bold text-lg">تاریخچه قرض‌های حسنه</h2></div>
            {loading ? (
              <div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>
            ) : hasanas.length === 0 ? (
              <div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ قرض حسنه‌ای ثبت نشده است</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr><th className="p-4 text-right font-bold">تاریخ</th><th className="p-4 text-right font-bold">نام شخص</th><th className="p-4 text-right font-bold">نوعیت</th><th className="p-4 text-right font-bold">وضعیت</th><th className="p-4 text-right font-bold">مقدار</th><th className="p-4 text-right font-bold">یادداشت</th></tr>
                  </thead>
                  <tbody>
                    {hasanas.map(h => (
                      <tr key={h.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-4 text-xs text-[var(--text-secondary)]" dir="ltr">{new Date(h.date).toLocaleDateString('fa-IR')}</td>
                        <td className="p-4 font-bold">{h.customerName}</td>
                        <td className="p-4 text-xs font-medium">
                          {h.type === 'GOLD' ? '🥇 طلا' : h.type === 'SILVER' ? '🥈 نقره' : h.type === 'USD' ? '💵 دالر' : '💴 افغانی'}
                        </td>
                        <td className="p-4">
                          {h.direction === 'GIVEN' ? (
                            <span className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-1 rounded-md font-bold flex items-center gap-1 w-fit"><ArrowUpRight size={14}/> ما دادیم</span>
                          ) : (
                            <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded-md font-bold flex items-center gap-1 w-fit"><ArrowDownLeft size={14}/> ما گرفتیم</span>
                          )}
                        </td>
                        <td className="p-4 font-bold" dir="ltr">{fmt(h.amount)} <span className="text-[10px] text-[var(--text-muted)] font-normal">{getUnit(h.type)}</span></td>
                        <td className="p-4 text-xs text-[var(--text-muted)]">{h.notes || '-'}</td>
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