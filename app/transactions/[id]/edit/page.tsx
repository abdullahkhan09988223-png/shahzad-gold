'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { ArrowRight, Home, Menu, Save, FileText } from 'lucide-react'

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }
type Customer = { id: number; fullName: string }

function EditTransactionContent() {
  const { language } = useI18n()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [form, setForm] = useState<any>({
    customerId: '', type: 'SELL', metal: 'GOLD', unit: 'TOLA', quantity: '', ayar: '23.88',
    pricePerUnitUsd: '', commission: '', paymentMethod: 'CASH', paymentStatus: 'PAID', paidUsd: '', notes: '', transactionDate: ''
  })

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
        const authData = await authRes.json()
        if (!authData.success) return window.location.href = '/login'
        setUser(authData.user)

        const [custRes, txRes] = await Promise.all([
          fetch('/api/customers', { cache: 'no-store' }),
          fetch(`/api/transactions/${id}`, { cache: 'no-store' })
        ])
        
        const custData = await custRes.json()
        const txData = await txRes.json()

        if (custData.success) setCustomers(custData.customers)

        if (txData.success && txData.transaction) {
          const tx = txData.transaction
          setForm({
            customerId: tx.customerId.toString(),
            type: tx.type,
            metal: tx.metal,
            unit: tx.unit,
            quantity: tx.quantity,
            ayar: tx.ayar || '23.88',
            pricePerUnitUsd: tx.pricePerUnitUsd,
            commission: tx.commission,
            paymentMethod: tx.paymentMethod,
            paymentStatus: tx.paymentStatus,
            paidUsd: tx.paidUsd,
            notes: tx.notes || '',
            transactionDate: new Date(tx.transactionDate).toISOString().split('T')[0]
          })
        }
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      const payload = { ...form, usdRate: 1 }
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) router.push(`/transactions/${id}`)
      else setError(data.error)
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
      <Sidebar user={user} activePath="/transactions" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />
      
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)]"><Home size={14} /> داشبورد</Link>
              <Link href={`/transactions/${id}`} className="text-sm text-[var(--text-secondary)] flex items-center gap-2 font-medium"><ArrowRight size={16} /> بازگشت به فاکتور</Link>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-8 border-t-4 border-t-[var(--accent)] shadow-2xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><FileText size={24} className="text-[var(--accent)]"/> ویرایش کامل معامله</h1>
            
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">تاریخ معامله</label>
                  <input type="date" value={form.transactionDate} onChange={e => setForm({...form, transactionDate: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مشتری</label>
                  <select value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="">انتخاب کنید...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوعیت</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="BUY">خرید</option>
                    <option value="SELL">فروش</option>
                    <option value="PRE_BUY">پیش‌خرید</option>
                    <option value="PRE_SELL">پیش‌فروش</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">فلز</label>
                  <select value={form.metal} onChange={e => setForm({...form, metal: e.target.value, unit: e.target.value === 'GOLD' ? 'TOLA' : 'GRAM'})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="GOLD">طلا</option>
                    <option value="SILVER">نقره</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">واحد</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    {form.metal === 'GOLD' ? (<><option value="TOLA">توله</option><option value="GRAM">گرام</option><option value="MASHA">ماشا</option></>) : (<><option value="GRAM">گرام</option><option value="KG">کیلو</option></>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مقدار</label>
                  <input type="number" step="0.001" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">قیمت واحد ($)</label>
                  <input type="number" step="0.01" value={form.pricePerUnitUsd} onChange={e => setForm({...form, pricePerUnitUsd: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>

              {form.metal === 'GOLD' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">عیار</label>
                  <input type="number" step="0.01" value={form.ayar} onChange={e => setForm({...form, ayar: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">روش پرداخت</label>
                  <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="CASH">نقد</option>
                    <option value="BANK">بانک</option>
                    <option value="WALLET">کیف پول</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">وضعیت</label>
                  <select value={form.paymentStatus} onChange={e => setForm({...form, paymentStatus: e.target.value})} disabled={form.paymentMethod === 'WALLET'} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] disabled:opacity-50">
                    <option value="PAID">پرداخت کامل</option>
                    <option value="PARTIAL">پرداخت جزئی</option>
                    <option value="UNPAID">پرداخت نشده</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مبلغ پرداخت شده ($)</label>
                  <input type="number" step="0.01" value={form.paidUsd} onChange={e => setForm({...form, paidUsd: e.target.value})} disabled={form.paymentStatus !== 'PARTIAL' || form.paymentMethod === 'WALLET'} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] disabled:opacity-50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">یادداشت</label>
                <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={saving} className="flex-1 bg-[var(--accent)] text-white py-3.5 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2">
                  <Save size={20} /> {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function EditTransactionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>}>
      <EditTransactionContent />
    </Suspense>
  )
}