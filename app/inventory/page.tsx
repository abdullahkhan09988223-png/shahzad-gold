'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import {
  Menu, Scale, Gem, Coins, DollarSign, Wallet, RotateCw, FileText, Plus, X
} from 'lucide-react'

type Inventory = { 
  goldTola: number; 
  goldGrams: number; 
  silverKg: number; 
  silverGrams: number; 
  cashUsd: number;
}
type Adjustment = { id: number; metal: string; quantity: string; unit: string; reason: string; createdAt: string }
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function InventoryPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [inventory, setInventory] = useState<Inventory | null>(null)
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ metal: 'GOLD', quantity: '', unit: 'TOLA', reason: '', notes: '' })

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('inventory')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      setUser(authData.user)
      await load()
    }
    init()
  }, [])

  const load = async () => {
    try {
      const [iRes, aRes] = await Promise.all([
        fetch('/api/inventory', { cache: 'no-store' }), 
        fetch('/api/adjustments', { cache: 'no-store' })
      ])
      const iData = await iRes.json(); 
      const aData = await aRes.json()
      if (iData.success) setInventory(iData.inventory)
      if (aData.success) setAdjustments(aData.adjustments)
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  const fmt = (n: number | string, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const set = (k: string, v: string) => setForm({ ...form, [k]: v })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const res = await fetch('/api/adjustments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.success) { 
        setForm({ metal: 'GOLD', quantity: '', unit: 'TOLA', reason: '', notes: '' }); 
        setShowForm(false); 
        load() 
      } else setError(data.error)
    } catch (err) { setError(String(err)) } finally { setSaving(false) }
  }

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/inventory" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><Wallet size={18} className="text-[var(--accent)]" /><span>مدیریت خزانه (موجودی فیزیکی)</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={load} className="bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"><RotateCw size={16} /></button>
              <button onClick={() => setShowForm(!showForm)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all glow-button shadow-lg">{showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'بستن' : 'تعدیل موجودی'}</button>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          {showForm && (
            <form onSubmit={submit} className="glass-card rounded-3xl p-6 mb-8 border-t-4 border-t-[var(--accent)] shadow-2xl">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-2"><Scale size={22} className="text-[var(--accent)]"/> تعدیل موجودی (اصلاح دستی)</h2>
              <p className="text-xs text-[var(--text-secondary)] mb-6">برای اصلاح موجودی (مثلاً هنگام شمارش مجدد گاوصندوق) از این بخش استفاده کنید.</p>
              {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium border border-red-500/20">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">فلز</label><select value={form.metal} onChange={(e) => set('metal', e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="GOLD">🥇 طلا</option><option value="SILVER">🥈 نقره</option></select></div>
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مقدار (منفی = کم کردن)</label><input type="number" step="0.0001" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" /></div>
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">واحد</label><select value={form.unit} onChange={(e) => set('unit', e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="TOLA">توله</option><option value="GRAM">گرام</option><option value="KG">کیلوگرام</option></select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">دلیل تعدیل *</label><input type="text" value={form.reason} onChange={(e) => set('reason', e.target.value)} required placeholder="مثلاً: شمارش مجدد" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" /></div>
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">یادداشت</label><input type="text" value={form.notes} onChange={(e) => set('notes', e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" /></div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold glow-button">{saving ? '...' : '💾 ثبت تعدیل'}</button>
            </form>
          )}

          {loading || !inventory ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال محاسبه...</div>) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* کارت طلا */}
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group border-t-4 border-t-yellow-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-yellow-500/20 transition-all"></div>
                  <div className="flex items-center gap-3 mb-5 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center text-yellow-500"><Coins size={24}/></div>
                    <h2 className="text-xl font-bold">خزانه طلا</h2>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 relative z-10" dir="ltr">{fmt(inventory.goldTola, 3)} <span className="text-lg font-medium text-yellow-500">توله</span></div>
                  <div className="text-sm text-[var(--text-secondary)] mb-5 relative z-10" dir="ltr">معادل {fmt(inventory.goldGrams, 2)} گرم</div>
                </div>

                {/* کارت نقره */}
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group border-t-4 border-t-slate-400">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-slate-500/20 transition-all"></div>
                  <div className="flex items-center gap-3 mb-5 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-slate-500/20 flex items-center justify-center text-slate-300"><Gem size={24}/></div>
                    <h2 className="text-xl font-bold">خزانه نقره</h2>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 relative z-10" dir="ltr">{fmt(inventory.silverKg, 3)} <span className="text-lg font-medium text-slate-300">کیلو</span></div>
                  <div className="text-sm text-[var(--text-secondary)] mb-5 relative z-10" dir="ltr">معادل {fmt(inventory.silverGrams, 2)} گرم</div>
                </div>

                {/* کارت دالر */}
                <div className="glass-card rounded-3xl p-6 relative overflow-hidden group border-t-4 border-t-blue-500">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-blue-500/20 transition-all"></div>
                  <div className="flex items-center gap-3 mb-5 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-500"><DollarSign size={24}/></div>
                    <h2 className="text-xl font-bold">موجودی نقدی دالر</h2>
                  </div>
                  <div className="text-4xl font-extrabold mb-2 relative z-10 text-blue-500" dir="ltr">${fmt(inventory.cashUsd)}</div>
                  <div className="text-sm text-[var(--text-secondary)] mb-5 relative z-10">آخرین موجودی ثبت شده در صندوق</div>
                </div>
              </div>

              <div className="glass-card rounded-3xl overflow-hidden">
                <div className="p-5 border-b border-[var(--border-base)]"><h2 className="font-bold text-lg flex items-center gap-2"><FileText size={20} className="text-[var(--accent)]"/> تاریخچه تعدیل‌ها</h2></div>
                {adjustments.length === 0 ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">تعدیلی ثبت نشده است</div>) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                        <tr><th className="p-4 text-right font-bold">تاریخ</th><th className="p-4 text-right font-bold">فلز</th><th className="p-4 text-right font-bold">مقدار</th><th className="p-4 text-right font-bold">دلیل</th></tr>
                      </thead>
                      <tbody>
                        {adjustments.map((a) => {
                          const q = Number(a.quantity)
                          return (
                            <tr key={a.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                              <td className="p-4 text-xs text-[var(--text-secondary)]" dir="ltr">{new Date(a.createdAt).toLocaleDateString('fa-IR')}</td>
                              <td className="p-4 text-xs font-medium">{a.metal === 'GOLD' ? '🥇 طلا' : '🥈 نقره'}</td>
                              <td className={`p-4 text-xs font-bold ${q >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">{q >= 0 ? '+' : ''}{fmt(q, 3)} {a.unit === 'TOLA' ? 'توله' : a.unit === 'KG' ? 'کیلو' : 'گرام'}</td>
                              <td className="p-4 text-xs text-[var(--text-secondary)]">{a.reason}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}