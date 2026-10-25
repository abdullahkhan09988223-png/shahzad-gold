'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar' // 👈 ایمپورت سایدبار جدید
import {
  CreditCard, Menu, Plus, Search, X, Receipt, DollarSign, Wallet
} from 'lucide-react'

type Payment = {
  id: number
  amount: string
  currency: string
  method: string
  paymentDate: string
  referenceNo: string | null
  notes: string | null
  transaction: {
    id: number
    invoiceNumber: string
    customer: { id: number; fullName: string }
  }
}

type UnpaidTx = {
  id: number
  invoiceNumber: string
  remainingUsd: string
  remainingAfn: string
  customer: { id: number; fullName: string }
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function PaymentsPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [unpaidTxs, setUnpaidTxs] = useState<UnpaidTx[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    transactionId: '', amount: '', currency: 'USD', method: 'CASH', referenceNo: '', notes: ''
  })

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      // 👈 قفل امنیتی: اگر ادمین نبود و به پرداخت‌ها دسترسی نداشت، بیرونش کن
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('payments')) {
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
    const [pRes, uRes] = await Promise.all([
      fetch('/api/payments', { cache: 'no-store' }),
      fetch('/api/transactions/unpaid', { cache: 'no-store' })
    ])
    const pData = await pRes.json()
    const uData = await uRes.json()
    if (pData.success) setPayments(pData.payments)
    if (uData.success) setUnpaidTxs(uData.transactions)
    setLoading(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setForm({ transactionId: '', amount: '', currency: 'USD', method: 'CASH', referenceNo: '', notes: '' })
        setShowForm(false)
        load()
      } else setError(data.error)
    } catch (err) { setError(String(err)) } finally { setSaving(false) }
  }

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const methodLabel = (m: string) => m === 'CASH' ? '💵 نقد' : m === 'CARD' ? '💳 کارت' : m === 'BANK' ? '🏦 بانک' : m === 'CHEQUE' ? '📝 چک' : '📋 اعتباری'
  
  const filtered = payments.filter((p) => p.transaction.customer.fullName.includes(search) || p.transaction.invoiceNumber.includes(search))
  const totalUsd = filtered.filter((p) => p.currency === 'USD').reduce((s, p) => s + Number(p.amount), 0)
  const totalAfn = filtered.filter((p) => p.currency === 'AFN').reduce((s, p) => s + Number(p.amount), 0)

  const handleTxChange = (txId: string) => {
    const selectedTx = unpaidTxs.find(t => t.id === Number(txId))
    if (selectedTx) {
      setForm({
        ...form,
        transactionId: txId,
        amount: form.currency === 'USD' ? selectedTx.remainingUsd : selectedTx.remainingAfn
      })
    } else {
      setForm({ ...form, transactionId: '', amount: '' })
    }
  }

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      
      {/* 👈 استفاده از سایدبار جدید */}
      <Sidebar 
        user={user} 
        activePath="/payments" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      {/* Main Content */}
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* 👈 دکمه منوی موبایل */}
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><CreditCard size={18} className="text-[var(--accent)]" /><span>مدیریت پرداخت‌ها و اقساط</span></div>
            </div>
            <button onClick={() => setShowForm(true)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all glow-button shadow-lg">
              <Plus size={16} /> ثبت پرداخت جدید
            </button>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-card rounded-3xl p-6 flex items-center gap-5 border-t-4 border-t-green-500">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500"><DollarSign size={28} /></div>
              <div><div className="text-sm text-[var(--text-secondary)] mb-1 font-medium">کل دریافتی (دالر)</div><div className="text-3xl font-extrabold text-green-500" dir="ltr">${fmt(totalUsd)}</div></div>
            </div>
            <div className="glass-card rounded-3xl p-6 flex items-center gap-5 border-t-4 border-t-blue-500">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Wallet size={28} /></div>
              <div><div className="text-sm text-[var(--text-secondary)] mb-1 font-medium">کل دریافتی (افغانی)</div><div className="text-3xl font-extrabold text-blue-500" dir="ltr">{fmt(totalAfn, 0)} ؋</div></div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5 mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"><Search size={18} className="text-[var(--text-muted)]" /></div>
              <input type="text" placeholder="جستجو بر اساس نام مشتری یا شماره فاکتور..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-11 pl-4 py-3 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            {loading ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>) : filtered.length === 0 ? (<div className="p-10 text-center text-[var(--text-muted)] flex flex-col items-center gap-2"><Receipt size={32} className="text-[var(--text-muted)]" /><div>هیچ پرداختی یافت نشد</div></div>) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr><th className="p-5 text-right font-bold">تاریخ</th><th className="p-5 text-right font-bold">شماره فاکتور</th><th className="p-5 text-right font-bold">مشتری</th><th className="p-5 text-right font-bold">مبلغ پرداختی</th><th className="p-5 text-right font-bold">روش پرداخت</th><th className="p-5 text-right font-bold">شماره مرجع</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => (
                      <tr key={p.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-5 text-xs text-[var(--text-secondary)]" dir="ltr">{new Date(p.paymentDate).toLocaleDateString('fa-IR')}</td>
                        <td className="p-5 text-xs font-bold" dir="ltr"><Link href={`/transactions/${p.transaction.id}`} className="text-blue-500 hover:underline">{p.transaction.invoiceNumber}</Link></td>
                        <td className="p-5 font-bold">{p.transaction.customer.fullName}</td>
                        <td className="p-5 font-bold text-green-500" dir="ltr">{p.currency === 'USD' ? '$' : ''}{fmt(p.amount)}{p.currency === 'AFN' ? ' ؋' : ''}</td>
                        <td className="p-5 text-xs text-[var(--text-secondary)]">{methodLabel(p.method)}</td>
                        <td className="p-5 text-xs text-[var(--text-muted)]" dir="ltr">{p.referenceNo || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal: ثبت پرداخت جدید */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card border border-[var(--border-base)] rounded-3xl p-8 w-full max-w-lg my-8 shadow-2xl border-t-4 border-t-[var(--accent)]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard size={22} className="text-[var(--accent)]"/> ثبت پرداخت (قسط)</h2>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-lg transition"><X size={20} /></button>
            </div>
            
            {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium border border-red-500/20">{error}</div>}
            
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">انتخاب فاکتور بدهکار *</label>
                <select value={form.transactionId} onChange={(e) => handleTxChange(e.target.value)} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                  <option value="">-- انتخاب کنید --</option>
                  {unpaidTxs.map(tx => (
                    <option key={tx.id} value={tx.id}>
                      {tx.invoiceNumber} | {tx.customer.fullName} (باقی: ${fmt(tx.remainingUsd)})
                    </option>
                  ))}
                </select>
                {unpaidTxs.length === 0 && <p className="text-xs text-yellow-500 mt-2">⚠️ هیچ فاکتور پرداخت‌نشده‌ای وجود ندارد.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مبلغ پرداختی *</label>
                  <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">واحد پول</label>
                  <select value={form.currency} onChange={(e) => setForm({...form, currency: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="USD">دالر ($)</option>
                    <option value="AFN">افغانی (؋)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">روش پرداخت</label>
                  <select value={form.method} onChange={(e) => setForm({...form, method: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="CASH">💵 نقد</option>
                    <option value="CARD">💳 کارت</option>
                    <option value="BANK">🏦 انتقال بانکی</option>
                    <option value="CHEQUE">📝 چک</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">شماره مرجع (اختیاری)</label>
                  <input type="text" value={form.referenceNo} onChange={(e) => setForm({...form, referenceNo: e.target.value})} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">یادداشت (اختیاری)</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={saving || !form.transactionId} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white py-3.5 rounded-xl font-bold glow-button transition-all">
                  {saving ? 'در حال ثبت...' : '💾 ثبت پرداخت'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] py-3.5 rounded-xl font-bold">لغو</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}