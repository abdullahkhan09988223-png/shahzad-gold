'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { Menu, Zap, Plus, X, CheckCircle2, Calculator, DollarSign, Home, Wallet, RefreshCcw, HandCoins } from 'lucide-react'

type Customer = { id: number; fullName: string; phone: string; balanceUsd: number; balanceGoldGram: number }
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }
type LedgerEntry = { id: number; description: string; debitUsd: string; creditUsd: string; goldAmount: string; date: string; customer: { fullName: string } }

export default function QuickEntryPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [recentDebts, setRecentDebts] = useState<LedgerEntry[]>([])
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const [activeTab, setActiveTab] = useState<'TRADE' | 'WALLET' | 'DEBT'>('TRADE')

  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // فرم معامله
  const [form, setForm] = useState({ type: 'SELL', metal: 'GOLD', unit: 'TOLA', customerId: '', quantity: '', ayar: '23.88', pricePerUnitUsd: '' })

  // فرم کیف پول
  const [walletForm, setWalletForm] = useState({ customerId: '', actionType: 'DEPOSIT', assetType: 'USD', amount: '', convertTo: '', rate: '' })

  // 👇 فرم قرضه (جدید) 👇
  const [debtForm, setDebtForm] = useState({ customerId: '', direction: 'CUSTOMER_OWES', assetType: 'USD', amount: '', description: '' })

  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ fullName: '', phone: '' })
  const customerRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      setUser(authData.user)
      await loadCustomers()
      await loadRecentDebts()
    }
    init()
  }, [])

  const loadCustomers = async () => {
    const res = await fetch('/api/customers', { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setCustomers(data.customers)
  }

  const loadRecentDebts = async () => {
    // گرفتن ۱۰ تراکنش آخر دفتر معین که مربوط به قرضه هستند
    // برای سادگی، فعلاً از API معاملات استفاده نمیکنیم، فرض میکنیم API جدا داریم یا همه لجر را میگیریم
    // در اینجا به صورت موقت از fetch عمومی استفاده میکنیم
    const res = await fetch('/api/transactions', { cache: 'no-store' }) // این یک نمونه است، در واقعیت باید لجر بیاید
    // ما فعلاً این جدول را با دیتای معاملات پر نمیکنیم تا سیستم سنگین نشود. 
    // فقط فرم را میسازیم.
  }

  const qty = Number(form.quantity) || 0
  const price = Number(form.pricePerUnitUsd) || 0
  const ayar = Number(form.ayar) || 23.88
  const totalUsd = qty * price
  const standardWeight = form.metal === 'GOLD' ? (qty / 23.88) * ayar : qty

  // ثبت معامله
  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customerId) return setErrorMsg('لطفاً مشتری را انتخاب کنید')
    setSaving(true); setErrorMsg(''); setSuccessMsg('')
    try {
      const payload = { ...form, standardWeight: standardWeight.toFixed(4), paymentMethod: 'CASH', paymentStatus: 'PAID', paidUsd: totalUsd, remainingUsd: 0 }
      const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg(`✅ معامله ثبت شد! (فاکتور: ${data.transaction.invoiceNumber})`)
        setForm({ ...form, quantity: '', pricePerUnitUsd: '' })
        customerRef.current?.focus()
        setTimeout(() => setSuccessMsg(''), 3000)
      } else setErrorMsg(data.error)
    } catch (err) { setErrorMsg(String(err)) } finally { setSaving(false) }
  }

  // ثبت عملیات کیف پول
  const handleWalletSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletForm.customerId) return setErrorMsg('لطفاً مشتری را انتخاب کنید')
    setSaving(true); setErrorMsg(''); setSuccessMsg('')
    try {
      let res, data
      if (walletForm.actionType === 'CONVERT') {
        res = await fetch(`/api/customers/${walletForm.customerId}/convert`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromAsset: walletForm.assetType, toAsset: walletForm.convertTo, amount: walletForm.amount, rate: walletForm.rate })
        })
      } else {
        res = await fetch(`/api/customers/${walletForm.customerId}/account`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(walletForm)
        })
      }
      data = await res.json()
      if (data.success) {
        setSuccessMsg(`✅ عملیات با موفقیت انجام شد!`)
        setWalletForm({ ...walletForm, amount: '', rate: '' })
        await loadCustomers()
        setTimeout(() => setSuccessMsg(''), 3000)
      } else setErrorMsg(data.error)
    } catch (err) { setErrorMsg(String(err)) } finally { setSaving(false) }
  }

  // 👇 ثبت قرضه (جدید) 👇
  const handleDebtSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!debtForm.customerId) return setErrorMsg('لطفاً مشتری را انتخاب کنید')
    setSaving(true); setErrorMsg(''); setSuccessMsg('')
    try {
      const res = await fetch(`/api/customers/${debtForm.customerId}/debt`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debtForm)
      })
      const data = await res.json()
      if (data.success) {
        setSuccessMsg(`✅ قرضه/طلب با موفقیت ثبت شد!`)
        setDebtForm({ ...debtForm, amount: '', description: '' })
        await loadCustomers() // آپدیت موجودی
        setTimeout(() => setSuccessMsg(''), 3000)
      } else setErrorMsg(data.error)
    } catch (err) { setErrorMsg(String(err)) } finally { setSaving(false) }
  }

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...newCustomer, customerType: 'BOTH' }) })
    const data = await res.json()
    if (data.success) {
      await loadCustomers()
      if (activeTab === 'TRADE') setForm({ ...form, customerId: data.customer.id.toString() })
      else if (activeTab === 'WALLET') setWalletForm({ ...walletForm, customerId: data.customer.id.toString() })
      else setDebtForm({ ...debtForm, customerId: data.customer.id.toString() })
      setShowNewCustomer(false)
      setNewCustomer({ fullName: '', phone: '' })
    }
  }

  if (!user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'
  const selectedCustomer = customers.find(c => c.id === Number(walletForm.customerId || debtForm.customerId))

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/quick-entry" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] transition-colors"><Home size={14} /> داشبورد</Link>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><Zap size={18} className="text-yellow-500" /><span>ثبت فوق‌سریع (مثل اکسل)</span></div>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          
          {successMsg && <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl mb-6 text-sm font-bold flex items-center gap-2"><CheckCircle2 size={18}/> {successMsg}</div>}
          {errorMsg && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm font-bold">{errorMsg}</div>}

          {/* تب‌ها */}
          <div className="flex gap-2 bg-[var(--bg-input)] p-1.5 rounded-2xl border border-[var(--border-base)] mb-8 max-w-lg">
            <button onClick={() => { setActiveTab('TRADE'); setSuccessMsg(''); setErrorMsg(''); }} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'TRADE' ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><Calculator size={18}/> معامله</button>
            <button onClick={() => { setActiveTab('WALLET'); setSuccessMsg(''); setErrorMsg(''); }} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'WALLET' ? 'bg-blue-500 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><Wallet size={18}/> کیف پول</button>
            <button onClick={() => { setActiveTab('DEBT'); setSuccessMsg(''); setErrorMsg(''); }} className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'DEBT' ? 'bg-purple-500 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}><HandCoins size={18}/> قرضه / طلب</button>
          </div>

          {/* تب معامله */}
          {activeTab === 'TRADE' && (
            <>
              <form onSubmit={handleTradeSubmit} className="glass-card rounded-2xl p-4 border-t-4 border-t-yellow-500 shadow-2xl mb-8 flex flex-wrap gap-4 items-end">
                <div className="w-full md:w-auto flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">نوعیت</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[var(--accent)]"><option value="SELL">💰 فروش</option><option value="BUY">🛒 خرید</option></select>
                </div>
                <div className="w-full md:w-auto flex-1 min-w-[200px]">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1 flex justify-between">مشتری<button type="button" onClick={() => setShowNewCustomer(true)} className="text-blue-500 hover:underline flex items-center gap-1"><Plus size={10}/> جدید</button></label>
                  <select ref={customerRef} value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="">انتخاب کنید...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select>
                </div>
                <div className="w-full md:w-auto flex-1 min-w-[100px]">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">فلز</label>
                  <select value={form.metal} onChange={e => setForm({...form, metal: e.target.value, unit: e.target.value === 'GOLD' ? 'TOLA' : 'GRAM'})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="GOLD">🥇 طلا</option><option value="SILVER">🥈 نقره</option></select>
                </div>
                <div className="w-full md:w-auto flex-1 min-w-[100px]">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">وزن</label>
                  <input type="number" step="0.001" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
                {form.metal === 'GOLD' && (
                  <div className="w-full md:w-auto flex-1 min-w-[80px]">
                    <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">عیار</label>
                    <input type="number" step="0.01" value={form.ayar} onChange={e => setForm({...form, ayar: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
                  </div>
                )}
                <div className="w-full md:w-auto flex-1 min-w-[120px]">
                  <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">قیمت هر واحد ($)</label>
                  <input type="number" step="0.01" value={form.pricePerUnitUsd} onChange={e => setForm({...form, pricePerUnitUsd: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <button type="submit" disabled={saving} className="w-full md:w-auto bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all glow-button disabled:opacity-50">{saving ? '...' : <><CheckCircle2 size={18}/> ثبت</>}</button>
              </form>
              <div className="flex gap-4 mb-8">
                <div className="bg-green-500/10 border border-green-500/20 text-green-500 px-6 py-3 rounded-2xl flex items-center gap-3 font-bold flex-1"><Calculator size={20} /><div><div className="text-[10px] opacity-70">وزن معادل عیار ۲۳.۸۸</div><div className="text-xl" dir="ltr">{standardWeight.toFixed(4)} <span className="text-xs">گرام</span></div></div></div>
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-500 px-6 py-3 rounded-2xl flex items-center gap-3 font-bold flex-1"><DollarSign size={20} /><div><div className="text-[10px] opacity-70">جمع کل این معامله</div><div className="text-xl" dir="ltr">${totalUsd.toLocaleString('en-US', {minimumFractionDigits: 2})}</div></div></div>
              </div>
            </>
          )}

          {/* تب کیف پول */}
          {activeTab === 'WALLET' && (
            <form onSubmit={handleWalletSubmit} className="glass-card rounded-3xl p-6 border-t-4 border-t-blue-500 shadow-2xl mb-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 flex justify-between">مشتری<button type="button" onClick={() => setShowNewCustomer(true)} className="text-blue-500 hover:underline flex items-center gap-1"><Plus size={12}/> جدید</button></label>
                  <select value={walletForm.customerId} onChange={e => setWalletForm({...walletForm, customerId: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="">انتخاب کنید...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">عملیات</label>
                  <select value={walletForm.actionType} onChange={e => setWalletForm({...walletForm, actionType: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]">
                    <option value="DEPOSIT">⬇️ واریز به کیف پول</option>
                    <option value="WITHDRAW">⬆️ برداشت از کیف پول</option>
                    <option value="CONVERT">🔄 تبدیل دارایی</option>
                  </select>
                </div>
              </div>

              {selectedCustomer && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-6 text-sm">
                  <div>موجودی دالر: <span className="font-bold text-blue-500" dir="ltr">${selectedCustomer.balanceUsd}</span></div>
                  <div>موجودی طلا: <span className="font-bold text-yellow-500" dir="ltr">{selectedCustomer.balanceGoldGram} گرم</span></div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوع دارایی</label>
                  <select value={walletForm.assetType} onChange={e => setWalletForm({...walletForm, assetType: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="USD">💵 دالر</option><option value="GOLD">🥇 طلا</option></select>
                </div>
                {walletForm.actionType === 'CONVERT' && (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">تبدیل به</label>
                    <select value={walletForm.convertTo} onChange={e => setWalletForm({...walletForm, convertTo: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="GOLD">🥇 طلا</option><option value="USD">💵 دالر</option></select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مقدار</label>
                  <input type="number" step="0.001" value={walletForm.amount} onChange={e => setWalletForm({...walletForm, amount: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
                {walletForm.actionType === 'CONVERT' && (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نرخ تبدیل</label>
                    <input type="number" step="0.01" value={walletForm.rate} onChange={e => setWalletForm({...walletForm, rate: e.target.value})} required dir="ltr" placeholder="مثلاً 1600" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                  </div>
                )}
              </div>
              <button type="submit" disabled={saving} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg disabled:opacity-50 mt-4">{saving ? 'در حال ثبت...' : '💾 ثبت عملیات'}</button>
            </form>
          )}

          {/* 👇 تب قرضه / طلب (جدید) 👇 */}
          {activeTab === 'DEBT' && (
            <form onSubmit={handleDebtSubmit} className="glass-card rounded-3xl p-6 border-t-4 border-t-purple-500 shadow-2xl mb-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 flex justify-between">مشتری<button type="button" onClick={() => setShowNewCustomer(true)} className="text-blue-500 hover:underline flex items-center gap-1"><Plus size={12}/> جدید</button></label>
                  <select value={debtForm.customerId} onChange={e => setDebtForm({...debtForm, customerId: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="">انتخاب کنید...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">وضعیت بدهی</label>
                  <select value={debtForm.direction} onChange={e => setDebtForm({...debtForm, direction: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[var(--accent)]">
                    <option value="CUSTOMER_OWES">⚠️ مشتری به ما بدهکار است (طلب ما)</option>
                    <option value="I_OWE">✅ ما به مشتری بدهکار هستیم (بدهی ما)</option>
                  </select>
                </div>
              </div>

              {selectedCustomer && (
                <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl flex gap-6 text-sm">
                  <div>مانده حساب دالر: <span className={`font-bold ${Number(selectedCustomer.balanceUsd) > 0 ? 'text-red-500' : 'text-green-500'}`} dir="ltr">${selectedCustomer.balanceUsd}</span></div>
                  <div>مانده حساب طلا: <span className={`font-bold ${Number(selectedCustomer.balanceGoldGram) > 0 ? 'text-red-500' : 'text-green-500'}`} dir="ltr">{selectedCustomer.balanceGoldGram} گرم</span></div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوعیت</label>
                  <select value={debtForm.assetType} onChange={e => setDebtForm({...debtForm, assetType: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="USD">💵 دالر</option><option value="GOLD">🥇 طلا</option><option value="SILVER">🥈 نقره</option></select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مقدار</label>
                  <input type="number" step="0.001" value={debtForm.amount} onChange={e => setDebtForm({...debtForm, amount: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">توضیحات</label>
                  <input type="text" value={debtForm.description} onChange={e => setDebtForm({...debtForm, description: e.target.value})} placeholder="مثلاً: بابت خرید طلا..." className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg disabled:opacity-50 mt-4">{saving ? 'در حال ثبت...' : '💾 ثبت قرضه / طلب'}</button>
            </form>
          )}

        </main>
      </div>

      {/* مودال ثبت مشتری جدید */}
      {showNewCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border border-[var(--border-base)] rounded-3xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">ثبت مشتری جدید</h2>
              <button onClick={() => setShowNewCustomer(false)} className="bg-[var(--bg-input)] p-2 rounded-lg"><X size={18}/></button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div><label className="block text-xs font-bold mb-1">نام و تخلص</label><input type="text" value={newCustomer.fullName} onChange={e => setNewCustomer({...newCustomer, fullName: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none" /></div>
              <div><label className="block text-xs font-bold mb-1">شماره تلفن</label><input type="text" value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none" /></div>
              <button type="submit" className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold mt-2">ذخیره و انتخاب</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}