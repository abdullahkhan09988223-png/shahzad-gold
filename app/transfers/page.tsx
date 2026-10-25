'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { Menu, ArrowLeftRight, CheckCircle2 } from 'lucide-react'

type Customer = { 
  id: number; 
  fullName: string; 
  balanceUsd: string; 
  balanceGoldGram: string;
  balanceSilverGram: string;
}
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function TransfersPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [form, setForm] = useState({
    debtorId: '', creditorId: '', amount: '', assetType: 'USD', unit: 'TOLA', notes: ''
  })

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('customers')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }
      setUser(authData.user)

      const res = await fetch('/api/customers', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setCustomers(data.customers)
      setLoading(false)
    }
    init()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setSuccess(''); setSaving(true)
    
    // تبدیل واحد به گرام برای طلا و نقره
    let finalAmount = Number(form.amount)
    if (form.assetType === 'GOLD' || form.assetType === 'SILVER') {
      if (form.unit === 'TOLA') finalAmount = finalAmount * 11.6638
      if (form.unit === 'KG') finalAmount = finalAmount * 1000
      // اگر گرام باشد، همان عدد می‌ماند
    }

    const payload = {
      debtorId: form.debtorId,
      creditorId: form.creditorId,
      amount: finalAmount,
      assetType: form.assetType,
      notes: form.notes
    }

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (data.success) {
        setSuccess('انتقال با موفقیت انجام شد و حساب‌ها تسویه شدند.')
        setForm({ debtorId: '', creditorId: '', amount: '', assetType: 'USD', unit: 'TOLA', notes: '' })
        
        // رفرش لیست
        const cRes = await fetch('/api/customers', { cache: 'no-store' })
        const cData = await cRes.json()
        if (cData.success) setCustomers(cData.customers)
      } else {
        setError(data.error || 'خطا در انجام انتقال')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n: string | number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // تابع برای نمایش موجودی مشتری در منوی کشویی بر اساس نوع دارایی انتخاب شده
  const getBalanceLabel = (c: Customer) => {
    if (form.assetType === 'USD') return `$${fmt(c.balanceUsd)}`;
    if (form.assetType === 'GOLD') return `${fmt(c.balanceGoldGram)} گرام طلا`;
    if (form.assetType === 'SILVER') return `${fmt(c.balanceSilverGram)} گرام نقره`;
    return '';
  }

  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/transfers" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><ArrowLeftRight size={18} className="text-[var(--accent)]" /><span>انتقال معامله / تهاتر</span></div>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-3xl mx-auto">
          <div className="glass-card rounded-3xl p-6 md:p-8 border-t-4 border-t-[var(--accent)] shadow-2xl">
            <h1 className="text-xl font-bold mb-2">🔄 انتقال حساب (تهاتر)</h1>
            <p className="text-sm text-[var(--text-secondary)] mb-8">حساب‌های دالر، طلا و نقره را می‌توانید با هم تهاتر کنید.</p>

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium">{error}</div>}
            {success && <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2"><CheckCircle2 size={18}/> {success}</div>}

            <form onSubmit={submit} className="space-y-5">
              
              {/* انتخاب نوع دارایی */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { id: 'USD', label: '💵 دالر' },
                  { id: 'GOLD', label: '🥇 طلا' },
                  { id: 'SILVER', label: '🥈 نقره' },
                ].map((asset) => (
                  <button
                    key={asset.id} type="button"
                    onClick={() => setForm({ ...form, assetType: asset.id as any })}
                    className={`py-3 rounded-xl font-bold text-sm transition ${form.assetType === asset.id ? 'bg-[var(--accent)] text-white shadow-lg' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-base)]'}`}
                  >
                    {asset.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مشتری بدهکار (کسی که از ما قرض دارد)</label>
                <select value={form.debtorId} onChange={e => setForm({...form, debtorId: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                  <option value="">-- انتخاب کنید --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} (باقی حساب: {getBalanceLabel(c)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مشتری طلبکار (کسی که ما از او قرضدار هستیم)</label>
                <select value={form.creditorId} onChange={e => setForm({...form, creditorId: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                  <option value="">-- انتخاب کنید --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} (باقی حساب: {getBalanceLabel(c)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مبلغ / مقدار انتقال</label>
                  <input type="number" step="0.0001" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
                
                {/* انتخاب واحد فقط برای طلا و نقره */}
                {form.assetType !== 'USD' && (
                  <div className="w-32">
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">واحد</label>
                    <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]">
                      <option value="TOLA">توله</option>
                      <option value="GRAM">گرام</option>
                      <option value="KG">کیلو</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">یادداشت (اختیاری)</label>
                <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>

              <div className="pt-4 border-t border-[var(--border-base)]">
                <button type="submit" disabled={saving} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 rounded-xl font-bold text-lg transition-all glow-button shadow-lg disabled:opacity-50">
                  {saving ? 'در حال انتقال...' : '🔄 ثبت انتقال و تسویه'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}