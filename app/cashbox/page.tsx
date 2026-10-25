'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { Plus, X, RotateCw, Menu, Landmark, Wallet, Coins, Gem, Calculator, Info, Home } from 'lucide-react'

type CashBox = { 
  id: number; date: string; 
  openingUsd: string; totalInUsd: string; totalOutUsd: string; closingUsd: string;
  openingGold: string; totalInGold: string; totalOutGold: string; closingGold: string;
  openingSilver: string; totalInSilver: string; totalOutSilver: string; closingSilver: string;
}
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function CashBoxPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<CashBox[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [error, setError] = useState('')
  
  const [today, setToday] = useState('')
  const [form, setForm] = useState({ 
    date: '', 
    openingUsd: '', totalInUsd: '', totalOutUsd: '',
    openingGold: '', totalInGold: '', totalOutGold: '',
    openingSilver: '', totalInSilver: '', totalOutSilver: '',
    notes: '' 
  })

  useEffect(() => {
    const d = new Date()
    const formattedDate = d.toISOString().split('T')[0]
    setToday(formattedDate)
    setForm(prev => ({ ...prev, date: formattedDate }))
  }, [])

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('cashbox')) {
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
    const res = await fetch('/api/cashbox', { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setItems(data.cashBoxes)
    setLoading(false)
  }

  const autoCalculate = async () => {
    if (!form.date) return alert('اول تاریخ را مشخص کنید')
    setCalculating(true)
    try {
      const [txRes, expRes, incRes] = await Promise.all([
        fetch(`/api/transactions?from=${form.date}&to=${form.date}`, { cache: 'no-store' }),
        fetch(`/api/expenses?from=${form.date}&to=${form.date}`, { cache: 'no-store' }),
        fetch(`/api/incomes?from=${form.date}&to=${form.date}`, { cache: 'no-store' })
      ])

      const txData = await txRes.json()
      const expData = await expRes.json()
      const incData = await incRes.json()

      if (txData.success && expData.success && incData.success) {
        let inUsd = 0, outUsd = 0
        let inGold = 0, outGold = 0
        let inSilver = 0, outSilver = 0

        txData.transactions.forEach((tx: any) => {
          if (tx.paymentMethod !== 'CASH') return 
          const paid = Number(tx.paidUsd) || 0
          const qty = Number(tx.quantity) || 0
          const weightInTola = tx.metal === 'GOLD' ? qty : 0 
          const weightInGram = tx.metal === 'SILVER' ? (tx.unit === 'KG' ? qty * 1000 : qty) : 0

          if (tx.type === 'SELL' || tx.type === 'PRE_SELL') {
            inUsd += paid; outGold += weightInTola; outSilver += weightInGram
          } else if (tx.type === 'BUY' || tx.type === 'PRE_BUY') {
            outUsd += paid; inGold += weightInTola; inSilver += weightInGram
          }
        })

        if (expData.expenses) {
          expData.expenses.forEach((exp: any) => {
            outUsd += Number(exp.amountUsd) || 0
          })
        }

        if (incData.incomes) {
          incData.incomes.forEach((inc: any) => {
            inUsd += Number(inc.amountUsd) || 0
          })
        }

        setForm(prev => ({
          ...prev,
          totalInUsd: inUsd.toFixed(2),
          totalOutUsd: outUsd.toFixed(2),
          totalInGold: inGold.toFixed(3),
          totalOutGold: outGold.toFixed(3),
          totalInSilver: inSilver.toFixed(2),
          totalOutSilver: outSilver.toFixed(2),
        }))
      }
    } catch (err) {
      alert('خطا در محاسبه خودکار')
    } finally {
      setCalculating(false)
    }
  }

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const set = (k: string, v: string) => setForm({ ...form, [k]: v })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const res = await fetch('/api/cashbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.success) { 
        setForm({ ...form, openingUsd: '', totalInUsd: '', totalOutUsd: '', openingGold: '', totalInGold: '', totalOutGold: '', openingSilver: '', totalInSilver: '', totalOutSilver: '', notes: '' }); 
        setShowForm(false); 
        load() 
      } else setError(data.error)
    } catch (err) { setError(String(err)) } finally { setSaving(false) }
  }

  const closeUsd = (Number(form.openingUsd) || 0) + (Number(form.totalInUsd) || 0) - (Number(form.totalOutUsd) || 0)
  const closeGold = (Number(form.openingGold) || 0) + (Number(form.totalInGold) || 0) - (Number(form.totalOutGold) || 0)
  const closeSilver = (Number(form.openingSilver) || 0) + (Number(form.totalInSilver) || 0) - (Number(form.totalOutSilver) || 0)

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/cashbox" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] transition-colors">
                <Home size={14} /> داشبورد
              </Link>

              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><Landmark size={18} className="text-[var(--accent)]" /><span>مدیریت صندوق روزانه</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={load} className="bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"><RotateCw size={16} /></button>
              <button onClick={() => setShowForm(!showForm)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all glow-button shadow-lg">{showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'بستن' : 'ثبت صندوق جدید'}</button>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          {showForm && (
            <form onSubmit={submit} className="glass-card rounded-3xl p-6 mb-8 border-t-4 border-t-[var(--accent)] shadow-2xl">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-[var(--border-base)] pb-4">
                <div>
                  <h2 className="font-bold text-xl mb-1">📝 ثبت صندوق روزانه</h2>
                  <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1"><Info size={14}/> موجودی اولیه را دستی وارد کنید، بقیه موارد را سیستم محاسبه می‌کند.</p>
                </div>
                <button type="button" onClick={autoCalculate} disabled={calculating} className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg">
                  <Calculator size={18} /> {calculating ? 'در حال محاسبه...' : 'محاسبه خودکار از سیستم'}
                </button>
              </div>

              {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium border border-red-500/20">{error}</div>}
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="bg-[var(--bg-input)] p-5 rounded-2xl border border-[var(--border-base)]">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-blue-500"><Wallet size={18}/> صندوق دالر ($)</h3>
                  <div className="space-y-4">
                    <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">موجودی اولیه (دستی)</label><input type="number" step="0.01" value={form.openingUsd} onChange={(e) => set('openingUsd', e.target.value)} dir="ltr" className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" /></div>
                    <div><label className="block text-xs font-bold text-green-500 mb-2">ورود (دریافتی)</label><input type="number" step="0.01" value={form.totalInUsd} onChange={(e) => set('totalInUsd', e.target.value)} dir="ltr" className="w-full bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" /></div>
                    <div><label className="block text-xs font-bold text-red-500 mb-2">خروج (پرداختی)</label><input type="number" step="0.01" value={form.totalOutUsd} onChange={(e) => set('totalOutUsd', e.target.value)} dir="ltr" className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" /></div>
                  </div>
                </div>

                <div className="bg-[var(--bg-input)] p-5 rounded-2xl border border-[var(--border-base)]">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-yellow-500"><Coins size={18}/> صندوق طلا (توله)</h3>
                  <div className="space-y-4">
                    <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">موجودی اولیه (دستی)</label><input type="number" step="0.001" value={form.openingGold} onChange={(e) => set('openingGold', e.target.value)} dir="ltr" className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" /></div>
                    <div><label className="block text-xs font-bold text-green-500 mb-2">ورود (خریداری شده)</label><input type="number" step="0.001" value={form.totalInGold} onChange={(e) => set('totalInGold', e.target.value)} dir="ltr" className="w-full bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" /></div>
                    <div><label className="block text-xs font-bold text-red-500 mb-2">خروج (فروخته شده)</label><input type="number" step="0.001" value={form.totalOutGold} onChange={(e) => set('totalOutGold', e.target.value)} dir="ltr" className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" /></div>
                  </div>
                </div>

                <div className="bg-[var(--bg-input)] p-5 rounded-2xl border border-[var(--border-base)]">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-slate-400"><Gem size={18}/> صندوق نقره (گرام)</h3>
                  <div className="space-y-4">
                    <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">موجودی اولیه (دستی)</label><input type="number" step="0.01" value={form.openingSilver} onChange={(e) => set('openingSilver', e.target.value)} dir="ltr" className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" /></div>
                    <div><label className="block text-xs font-bold text-green-500 mb-2">ورود (خریداری شده)</label><input type="number" step="0.01" value={form.totalInSilver} onChange={(e) => set('totalInSilver', e.target.value)} dir="ltr" className="w-full bg-green-500/5 border border-green-500/20 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" /></div>
                    <div><label className="block text-xs font-bold text-red-500 mb-2">خروج (فروخته شده)</label><input type="number" step="0.01" value={form.totalOutSilver} onChange={(e) => set('totalOutSilver', e.target.value)} dir="ltr" className="w-full bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" /></div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--accent-bg)] border border-[var(--accent)] rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div><div className="text-xs font-bold text-[var(--text-secondary)] mb-2">تاریخ ثبت</div><input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required dir="ltr" className="bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none" /></div>
                <div className="flex gap-6 md:gap-10">
                  <div className="text-center"><div className="text-xs font-bold text-blue-500 mb-2">پایان روز ($)</div><div className="text-2xl font-extrabold text-blue-500" dir="ltr">${fmt(closeUsd)}</div></div>
                  <div className="text-center"><div className="text-xs font-bold text-yellow-500 mb-2">پایان روز (طلا)</div><div className="text-2xl font-extrabold text-yellow-500" dir="ltr">{fmt(closeGold, 3)}</div></div>
                  <div className="text-center"><div className="text-xs font-bold text-slate-400 mb-2">پایان روز (نقره)</div><div className="text-2xl font-extrabold text-slate-400" dir="ltr">{fmt(closeSilver, 3)}</div></div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 items-center"><input type="text" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="یادداشت (اختیاری)" className="flex-1 w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" /><button type="submit" disabled={saving} className="w-full md:w-auto px-10 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold glow-button">{saving ? '...' : '💾 ذخیره صندوق'}</button></div>
            </form>
          )}

          <div className="glass-card rounded-3xl overflow-hidden">
            {loading ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>) : items.length === 0 ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ صندوقی ثبت نشده است</div>) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr>
                      <th rowSpan={2} className="p-3 border-l border-[var(--border-base)] font-bold">تاریخ</th>
                      <th colSpan={4} className="p-3 border-l border-[var(--border-base)] text-blue-500 font-bold">💵 دالر ($)</th>
                      <th colSpan={4} className="p-3 border-l border-[var(--border-base)] text-yellow-500 font-bold">🥇 طلا (توله)</th>
                      <th colSpan={4} className="p-3 font-bold text-slate-400">🥈 نقره (گرام)</th>
                    </tr>
                    <tr className="bg-[var(--bg-base)] text-[10px] border-b border-[var(--border-base)]">
                      <th className="p-2 border-l border-[var(--border-base)] text-[var(--text-muted)]">اولیه</th>
                      <th className="p-2 border-l border-[var(--border-base)] text-green-500">ورود</th>
                      <th className="p-2 border-l border-[var(--border-base)] text-red-500">خروج</th>
                      <th className="p-2 border-l border-[var(--border-base)] bg-blue-500/10 text-blue-500">پایان</th>
                      <th className="p-2 border-l border-[var(--border-base)] text-[var(--text-muted)]">اولیه</th>
                      <th className="p-2 border-l border-[var(--border-base)] text-green-500">ورود</th>
                      <th className="p-2 border-l border-[var(--border-base)] text-red-500">خروج</th>
                      <th className="p-2 border-l border-[var(--border-base)] bg-yellow-500/10 text-yellow-500">پایان</th>
                      <th className="p-2 border-l border-[var(--border-base)] text-[var(--text-muted)]">اولیه</th>
                      <th className="p-2 border-l border-[var(--border-base)] text-green-500">ورود</th>
                      <th className="p-2 border-l border-[var(--border-base)] text-red-500">خروج</th>
                      <th className="p-2 bg-slate-500/10 text-slate-400">پایان</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((c) => (
                      <tr key={c.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors text-xs">
                        <td className="p-3 font-bold text-[var(--text-primary)] border-l border-[var(--border-base)]" dir="ltr">{new Date(c.date).toLocaleDateString('fa-IR')}</td>
                        <td className="p-3 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">{fmt(c.openingUsd)}</td>
                        <td className="p-3 border-l border-[var(--border-base)] text-green-500" dir="ltr">+{fmt(c.totalInUsd)}</td>
                        <td className="p-3 border-l border-[var(--border-base)] text-red-500" dir="ltr">-{fmt(c.totalOutUsd)}</td>
                        <td className="p-3 border-l border-[var(--border-base)] font-bold bg-blue-500/5 text-blue-500" dir="ltr">{fmt(c.closingUsd)}</td>
                        <td className="p-3 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">{fmt(c.openingGold, 3)}</td>
                        <td className="p-3 border-l border-[var(--border-base)] text-green-500" dir="ltr">+{fmt(c.totalInGold, 3)}</td>
                        <td className="p-3 border-l border-[var(--border-base)] text-red-500" dir="ltr">-{fmt(c.totalOutGold, 3)}</td>
                        <td className="p-3 border-l border-[var(--border-base)] font-bold bg-yellow-500/5 text-yellow-500" dir="ltr">{fmt(c.closingGold, 3)}</td>
                        <td className="p-3 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">{fmt(c.openingSilver, 3)}</td>
                        <td className="p-3 border-l border-[var(--border-base)] text-green-500" dir="ltr">+{fmt(c.totalInSilver, 3)}</td>
                        <td className="p-3 border-l border-[var(--border-base)] text-red-500" dir="ltr">-{fmt(c.totalOutSilver, 3)}</td>
                        <td className="p-3 font-bold bg-slate-500/5 text-slate-400" dir="ltr">{fmt(c.closingSilver, 3)}</td>
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