'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import {
  ArrowLeftRight, Menu, Link as LinkIcon, Handshake, Plus, Trash2, Calculator, CalendarClock, ChevronDown, ChevronUp, Home
} from 'lucide-react'

type Customer = { id: number; fullName: string; phone: string }
type Employee = { id: number; fullName: string; position: string }
type Trade = { id: number; type: string; metal: string; lotSize: string; entryPriceUsd: string }
type Partner = { id: number; fullName: string }
type Rate = { goldBuyPerTolaUsd: string; goldSellPerTolaUsd: string; silverBuyPerKgUsd: string; silverSellPerKgUsd: string }
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

function NewTransactionForm() {
  const { t, language } = useI18n()
  const searchParams = useSearchParams()
  const initialPartnerId = searchParams.get('partnerId')

  const [user, setUser] = useState<User | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [openTrades, setOpenTrades] = useState<Trade[]>([])
  const [availablePartners, setAvailablePartners] = useState<Partner[]>([])
  const [latestRate, setLatestRate] = useState<Rate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showPartners, setShowPartners] = useState(false)

  const [form, setForm] = useState({
    customerId: '', employeeId: '', type: 'BUY', metal: 'GOLD', unit: 'TOLA',
    quantity: '', ayar: '23.88', 
    pricePerUnitUsd: '', commission: '',
    paymentMethod: 'CASH', paymentStatus: 'PAID', paidUsd: '', notes: '',
    isTradeIn: false, tradeInMetal: 'GOLD', tradeInQuantity: '', tradeInUnit: 'TOLA', tradeInPricePerUnitUsd: '',
    linkedTradeId: '',
    deliveryDate: '' 
  })

  const [partners, setPartners] = useState<{ partnerId: string; sharePercentage: string }[]>([])

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('transactions')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      setUser(authData.user)

      const [c, e, r, tr, p] = await Promise.all([
        fetch('/api/customers', { cache: 'no-store' }),
        fetch('/api/employees', { cache: 'no-store' }),
        fetch('/api/rates', { cache: 'no-store' }),
        fetch('/api/trades', { cache: 'no-store' }),
        fetch('/api/partners', { cache: 'no-store' }),
      ])
      const cd = await c.json(); const ed = await e.json(); const rd = await r.json(); const trd = await tr.json(); const pd = await p.json()

      if (cd.success) setCustomers(cd.customers)
      if (ed.success) setEmployees(ed.employees)
      if (trd.success) setOpenTrades(trd.trades.filter((tx: any) => tx.status === 'OPEN'))
      
      if (pd.success) {
        setAvailablePartners(pd.partners)
        if (initialPartnerId && pd.partners.find((x: any) => x.id === Number(initialPartnerId))) {
          setPartners([{ partnerId: initialPartnerId, sharePercentage: '50' }])
          setShowPartners(true)
        }
      }
      
      if (rd.success && rd.latest) {
        setLatestRate(rd.latest)
        setForm(prev => ({
          ...prev,
          pricePerUnitUsd: prev.type === 'SELL' ? rd.latest.goldSellPerTolaUsd : rd.latest.goldBuyPerTolaUsd,
          tradeInPricePerUnitUsd: rd.latest.goldBuyPerTolaUsd
        }))
      }
      setLoading(false)
    }
    init()
  }, [initialPartnerId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement
    const { name, value, type, checked } = target
    
    setForm(prev => {
      const updated: any = { ...prev, [name]: type === 'checkbox' ? checked : value }
      if (!latestRate) return updated

      if (name === 'type' || name === 'metal') {
        const isBuy = name === 'type' ? value === 'BUY' : prev.type === 'BUY'
        const metal = name === 'metal' ? value : prev.metal
        if (metal === 'GOLD') {
          updated.unit = 'TOLA'
          updated.pricePerUnitUsd = isBuy ? latestRate.goldBuyPerTolaUsd : latestRate.goldSellPerTolaUsd
        } else {
          updated.unit = 'GRAM'
          updated.pricePerUnitUsd = isBuy ? (Number(latestRate.silverBuyPerKgUsd) / 1000) : (Number(latestRate.silverSellPerKgUsd) / 1000)
        }
      }
      return updated
    })
  }

  const addPartnerRow = () => {
    setPartners([...partners, { partnerId: '', sharePercentage: '' }])
    setShowPartners(true)
  }
  const removePartnerRow = (index: number) => setPartners(partners.filter((_, i) => i !== index))
  const handlePartnerChange = (index: number, field: string, value: string) => {
    const newPartners = [...partners]
    newPartners[index] = { ...newPartners[index], [field]: value }
    setPartners(newPartners)
  }
  const totalShare = partners.reduce((sum, p) => sum + (Number(p.sharePercentage) || 0), 0)
  const shopShare = 100 - totalShare

  const qty = Number(form.quantity) || 0
  const priceUsd = Number(form.pricePerUnitUsd) || 0
  const ayar = Number(form.ayar) || 23.88
  
  const standardWeight = form.metal === 'GOLD' ? (qty / 23.88) * ayar : qty

  const subtotalUsd = qty * priceUsd
  const totalUsd = subtotalUsd 
  
  const paid = form.paymentMethod === 'WALLET' ? totalUsd : (Number(form.paidUsd) || 0)
  const remainingUsd = totalUsd - paid

  const unitLabel = (u: string) => u === 'TOLA' ? 'توله' : u === 'KG' ? 'کیلو' : u === 'GRAM' ? 'گرام' : 'ماشا'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (totalShare > 100) {
      setError('مجموع فیصدی شرکا نمی‌تواند بیشتر از ۱۰۰ باشد.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        standardWeight: standardWeight.toFixed(4),
        paidUsd: form.paymentMethod === 'WALLET' ? totalUsd : (form.paymentStatus === 'PAID' ? totalUsd : paid),
        paymentStatus: form.paymentMethod === 'WALLET' ? 'PAID' : form.paymentStatus,
        partners: partners.filter(p => p.partnerId && p.sharePercentage)
      }
      const res = await fetch('/api/transactions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) window.location.href = '/transactions'
      else setError(data.error)
    } catch (err) { setError(String(err)) } finally { setSaving(false) }
  }

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'
  const isPreOrder = form.type === 'PRE_BUY' || form.type === 'PRE_SELL'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/transactions" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] transition-colors">
                <Home size={14} /> داشبورد
              </Link>

              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <ArrowLeftRight size={18} className="text-[var(--accent)]" />
                <span className="hidden md:inline">ثبت خرید و فروش جدید</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/transactions" className="flex items-center gap-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] transition-colors">
                لیست معاملات
              </Link>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-4xl mx-auto">
          <form onSubmit={submit} className="space-y-6">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-medium">{error}</div>}

            <div className="glass-card rounded-3xl p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {[
                  { v: 'BUY', l: '🛒 خرید' },
                  { v: 'SELL', l: '💰 فروش' },
                  { v: 'PRE_BUY', l: '📥 پیش‌خرید' },
                  { v: 'PRE_SELL', l: '📤 پیش‌فروش' },
                ].map((opt) => (
                  <button key={opt.v} type="button" onClick={() => handleChange({ target: { name: 'type', value: opt.v, type: 'text' } } as any)} className={`py-3 rounded-xl font-bold text-sm transition ${form.type === opt.v ? 'bg-[var(--accent)] text-white shadow-lg glow-button' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-base)] hover:bg-[var(--bg-surface-hover)]'}`}>
                    {opt.l}
                  </button>
                ))}
              </div>

              {isPreOrder && (
                <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center shrink-0"><CalendarClock size={20}/></div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-yellow-500 mb-1">تاریخ تحویل (تعهد)</label>
                    <input type="date" name="deliveryDate" value={form.deliveryDate} onChange={handleChange} required={isPreOrder} dir="ltr" className="w-full bg-[var(--bg-surface-solid)] border border-yellow-500/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-yellow-500 text-yellow-500 font-bold" />
                  </div>
                </div>
              )}

              <div className="bg-[var(--bg-input)] border border-[var(--border-base)] rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-[var(--accent)]">
                  <LinkIcon size={20} />
                  <div>
                    <div className="text-sm font-bold">لینک به ترید (پوشش ریسک)</div>
                    <div className="text-xs opacity-70">آیا این معامله فیزیکی مربوط به یک ترید باز است؟</div>
                  </div>
                </div>
                <select name="linkedTradeId" value={form.linkedTradeId} onChange={handleChange} className="bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] min-w-[200px]">
                  <option value="">بدون لینک</option>
                  {openTrades.map(tx => (
                    <option key={tx.id} value={tx.id}>T-{tx.id} | {tx.type} {tx.lotSize} Lot ({tx.metal})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6 space-y-6">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مشتری</label>
                  <select name="customerId" value={form.customerId} onChange={handleChange} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]">
                    <option value="">انتخاب کنید...</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوعیت فلز</label>
                  <select name="metal" value={form.metal} onChange={handleChange} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="GOLD">🥇 طلا</option>
                    <option value="SILVER">🥈 نقره</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">واحد</label>
                  <select name="unit" value={form.unit} onChange={handleChange} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    {form.metal === 'GOLD' ? (
                      <>
                        <option value="TOLA">توله</option>
                        <option value="GRAM">گرام</option>
                        <option value="MASHA">ماشا</option>
                      </>
                    ) : (
                      <>
                        <option value="GRAM">گرام</option>
                        <option value="KG">کیلوگرام</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مقدار (وزن)</label>
                  <input type="number" step="0.001" name="quantity" value={form.quantity} onChange={handleChange} required placeholder="0.000" dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">قیمت هر {unitLabel(form.unit)} ($)</label>
                  <input type="number" step="0.01" name="pricePerUnitUsd" value={form.pricePerUnitUsd} onChange={handleChange} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>
              </div>

              {form.metal === 'GOLD' && (
                <div className="bg-[var(--bg-surface-solid)] border border-[var(--accent)]/30 rounded-2xl p-5">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-[var(--accent)]"><Calculator size={18}/> محاسبه عیار</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end mb-3">
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">عیار مشتری</label>
                      <input type="number" step="0.01" name="ayar" value={form.ayar} onChange={handleChange} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">عیار استاندارد (کابل)</label>
                      <input type="text" value="23.88" readOnly dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm text-[var(--text-muted)] cursor-not-allowed" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-green-500 mb-2">وزن معادل عیار ۲۳.۸۸</label>
                      <div className="w-full bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-lg font-bold text-green-500" dir="ltr">
                        {standardWeight.toFixed(4)} گرم
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] bg-[var(--bg-base)] p-2 rounded-lg text-center" dir="rtl">
                    📐 فرمول: (وزن {qty || 0} ÷ ۲۳.۸۸) × عیار {ayar || 0} = {standardWeight.toFixed(4)} گرم
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-end gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">کمیشن ($)</label>
                  <input type="number" step="0.01" name="commission" value={form.commission} onChange={handleChange} placeholder="0.00" dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
                </div>

                <button
                  type="button"
                  onClick={() => setShowPartners(!showPartners)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm border transition-all ${showPartners || partners.length > 0 ? 'bg-purple-500/10 border-purple-500 text-purple-500' : 'bg-[var(--bg-input)] border-[var(--border-base)] text-[var(--text-secondary)] hover:text-purple-500 hover:border-purple-500/50'}`}
                >
                  <Handshake size={16} />
                  <span>شرکا</span>
                  {partners.length > 0 && (
                    <span className="bg-purple-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                      {partners.length}
                    </span>
                  )}
                </button>
              </div>

              {showPartners && (
                <div className="bg-[var(--bg-surface-solid)] border border-purple-500/30 rounded-2xl p-5 mt-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-purple-500 flex items-center gap-2">
                      <Handshake size={18}/> شرکای این معامله
                    </h3>
                    <button type="button" onClick={addPartnerRow} className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 px-3 py-1.5 rounded-lg transition font-bold flex items-center gap-1">
                      <Plus size={14} /> افزودن
                    </button>
                  </div>
                  
                  {partners.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic text-center py-2">هیچ شریکی اضافه نشده است.</p>
                  ) : (
                    <div className="space-y-3">
                      {partners.map((p, index) => (
                        <div key={index} className="flex gap-3 items-end bg-[var(--bg-input)] p-3 rounded-xl border border-[var(--border-base)]">
                          <div className="flex-1">
                            <label className="block text-[10px] text-[var(--text-secondary)] mb-1">شریک</label>
                            <select value={p.partnerId} onChange={(e) => handlePartnerChange(index, 'partnerId', e.target.value)} required className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]">
                              <option value="">انتخاب شریک...</option>
                              {availablePartners.map(ap => <option key={ap.id} value={ap.id}>{ap.fullName}</option>)}
                            </select>
                          </div>
                          <div className="w-24">
                            <label className="block text-[10px] text-[var(--text-secondary)] mb-1">فیصدی</label>
                            <input type="number" min="1" max="100" value={p.sharePercentage} onChange={(e) => handlePartnerChange(index, 'sharePercentage', e.target.value)} required dir="ltr" className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" placeholder="%" />
                          </div>
                          <button type="button" onClick={() => removePartnerRow(index)} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2 rounded-lg transition"><Trash2 size={18} /></button>
                        </div>
                      ))}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--border-base)] text-sm font-bold">
                        <span className="text-[var(--text-secondary)]">سهم دکان:</span>
                        <span className={shopShare < 0 ? 'text-red-500' : 'text-green-500'} dir="ltr">{shopShare}%</span>
                      </div>
                      {totalShare > 100 && <div className="text-xs text-red-500 mt-2">⚠️ مجموع فیصدی‌ها نمی‌تواند بیشتر از ۱۰۰ باشد.</div>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="glass-card rounded-3xl p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">روش پرداخت</label>
                  <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none">
                    <option value="CASH">💵 نقد (Cash)</option>
                    <option value="BANK">🏦 حواله / بانک (Transfer)</option>
                    <option value="WALLET">👛 پرداخت از حساب مشتری (Wallet)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">وضعیت پرداخت</label>
                  <select name="paymentStatus" value={form.paymentStatus} onChange={handleChange} disabled={form.paymentMethod === 'WALLET'} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none disabled:opacity-50">
                    <option value="PAID">✅ پرداخت کامل</option>
                    <option value="PARTIAL">⚠️ پرداخت جزئی</option>
                    <option value="UNPAID">❌ پرداخت نشده</option>
                  </select>
                </div>
              </div>
              
              {form.paymentStatus === 'PARTIAL' && form.paymentMethod !== 'WALLET' && (
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مبلغ پرداخت شده ($)</label>
                  <input type="number" step="0.01" name="paidUsd" value={form.paidUsd} onChange={handleChange} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none" />
                </div>
              )}
              
              <div className="bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">جمع کل ($):</span><span className="font-bold text-[var(--accent)] text-lg" dir="ltr">${totalUsd.toFixed(2)}</span></div>
                {form.paymentStatus !== 'PAID' && form.paymentMethod !== 'WALLET' && (
                  <div className="flex justify-between text-sm border-t border-[var(--border-base)] pt-3">
                    <span className="font-bold text-red-500">باقی‌مانده ($):</span>
                    <span className="font-bold text-red-500" dir="ltr">${remainingUsd.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button type="submit" disabled={saving} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-4 rounded-2xl font-bold text-lg transition-all glow-button shadow-lg disabled:opacity-50">{saving ? 'در حال ثبت...' : '💾 ثبت معامله'}</button>
              <Link href="/transactions" className="px-8 py-4 bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] rounded-2xl font-bold transition flex items-center justify-center">لغو</Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}

export default function NewTransactionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>}>
      <NewTransactionForm />
    </Suspense>
  )
}