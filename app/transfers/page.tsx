'use client'

import { Suspense, useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { Menu, RefreshCcw, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react'

type Customer = { id: number; fullName: string; balanceUsd: number; balanceGoldGram: number; balanceSilverGram: number }
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

function TransfersContent() {
  const { language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [form, setForm] = useState({
    fromCustomerId: '',
    toCustomerId: '',
    assetType: 'USD',
    amount: '',
    notes: ''
  })

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
        const authData = await authRes.json()
        if (!authData.success) return window.location.href = '/login'
        setUser(authData.user)

        const custRes = await fetch('/api/customers', { cache: 'no-store' })
        const custData = await custRes.json()
        if (custData.success) setCustomers(custData.customers)
      } catch (err) {
        setErrorMsg(String(err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setErrorMsg(''); setSuccessMsg('')
    
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      
      if (data.success) {
        setSuccessMsg('✅ عملیات تهاتر با موفقیت ثبت شد و حساب‌ها تسویه شدند.')
        setForm({ ...form, fromCustomerId: '', toCustomerId: '', amount: '', notes: '' })
        
        // آپدیت لیست مشتریان برای نمایش موجودی جدید
        const custRes = await fetch('/api/customers', { cache: 'no-store' })
        const custData = await custRes.json()
        if (custData.success) setCustomers(custData.customers)
        
        setTimeout(() => setSuccessMsg(''), 4000)
      } else {
        setErrorMsg(data.error)
      }
    } catch (err) {
      setErrorMsg(String(err))
    } finally {
      setSaving(false)
    }
  }

  const fmt = (n: string | number, digits = 2) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  const fromCustomer = customers.find(c => c.id === Number(form.fromCustomerId))
  const toCustomer = customers.find(c => c.id === Number(form.toCustomerId))

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

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
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium">
                <RefreshCcw size={18} className="text-[var(--accent)]" />
                <span>انتقال / تهاتر بین مشتریان</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-4xl mx-auto space-y-6">
          
          {successMsg && <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl text-sm font-bold flex items-center gap-2"><CheckCircle2 size={18}/> {successMsg}</div>}
          {errorMsg && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-bold flex items-center gap-2"><AlertCircle size={18}/> {errorMsg}</div>}

          <div className="glass-card rounded-3xl p-8 border-t-4 border-t-[var(--accent)] shadow-2xl">
            <h1 className="text-xl font-bold mb-6 flex items-center gap-2"><ArrowRightLeft size={24} className="text-[var(--accent)]"/> ثبت تهاتر جدید</h1>
            <p className="text-xs text-[var(--text-secondary)] mb-8">در این بخش می‌توانید بدهی یک مشتری را به حساب طلب مشتری دیگر منتقل کنید تا حساب هر دو تسویه شود (بدون اینکه پولی به صندوق دکان بیاید).</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-[var(--bg-input)] p-4 rounded-2xl border border-[var(--border-base)]">
                  <label className="block text-xs font-bold text-red-500 mb-2">مشتری بدهکار (پرداخت کننده)</label>
                  <select value={form.fromCustomerId} onChange={e => setForm({...form, fromCustomerId: e.target.value})} required className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="">انتخاب کنید...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                  {fromCustomer && (
                    <div className="mt-3 text-xs text-[var(--text-secondary)]">
                      موجودی فعلی: <span className={`font-bold ${fromCustomer.balanceUsd > 0 ? 'text-red-500' : 'text-green-500'}`} dir="ltr">${fmt(fromCustomer.balanceUsd)}</span>
                    </div>
                  )}
                </div>

                <div className="bg-[var(--bg-input)] p-4 rounded-2xl border border-[var(--border-base)]">
                  <label className="block text-xs font-bold text-green-500 mb-2">مشتری طلبکار (دریافت کننده)</label>
                  <select value={form.toCustomerId} onChange={e => setForm({...form, toCustomerId: e.target.value})} required className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="">انتخاب کنید...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                  {toCustomer && (
                    <div className="mt-3 text-xs text-[var(--text-secondary)]">
                      موجودی فعلی: <span className={`font-bold ${toCustomer.balanceUsd > 0 ? 'text-red-500' : 'text-green-500'}`} dir="ltr">${fmt(toCustomer.balanceUsd)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوعیت دارایی</label>
                  <select value={form.assetType} onChange={e => setForm({...form, assetType: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="USD">💵 دالر</option>
                    <option value="GOLD">🥇 طلا (گرام)</option>
                    <option value="SILVER">🥈 نقره (گرام)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مقدار</label>
                  <input type="number" step="0.001" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">توضیحات (اختیاری)</label>
                  <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="مثلاً: تسویه بابت معامله قبلی" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full bg-[var(--accent)] text-white py-4 rounded-xl font-bold text-lg transition-all glow-button shadow-lg disabled:opacity-50">
                {saving ? 'در حال ثبت...' : '💾 ثبت و تسویه حساب'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function TransfersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>}>
      <TransfersContent />
    </Suspense>
  )
}