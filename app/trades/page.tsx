'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import {
  Activity, Menu, Plus, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp,
  Link as LinkIcon, Globe
} from 'lucide-react'

type Trade = {
  id: number
  type: string
  metal: string
  lotSize: string
  entryPriceUsd: string
  entryOuncePrice: string
  exitPriceUsd: string | null
  exitOuncePrice: string | null
  status: string
  grossProfitUsd: string
  netProfitUsd: string
  createdAt: string
  linkedTransactions: {
    id: number
    invoiceNumber: string
    quantity: string
    unit: string
    type: string
    totalUsd: string
    profitLoss: string
    status: string
    customer: { fullName: string }
  }[]
}

type Customer = { id: number; fullName: string }
type Employee = { id: number; fullName: string }
type Rate = { usdToAfn: string }
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function TradesPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [trades, setTrades] = useState<Trade[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [latestRate, setLatestRate] = useState<Rate | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  const [showNewForm, setShowNewForm] = useState(false)
  const [showCloseForm, setShowCloseForm] = useState<Trade | null>(null)
  const [showModifyForm, setShowModifyForm] = useState<Trade | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const newTradeScrollRef = useRef<HTMLDivElement>(null)
  const closeTradeScrollRef = useRef<HTMLDivElement>(null)

  const [calcData, setCalcData] = useState({ ouncePrice: '', kabulPrice: '' })

  const [form, setForm] = useState({
    type: 'BUY', metal: 'GOLD', lotSize: '', entryOuncePrice: '',
    hasPhysical: false,
    physicalCustomerId: '', physicalType: 'SELL', physicalQuantity: '', physicalPrice: '', physicalUnit: 'TOLA'
  })

  const [closeForm, setCloseForm] = useState({
    actionType: 'BOTH', exitOuncePrice: '', kabulRate: '', spreadUsd: '', commissionUsd: '', swapUsd: ''
  })

  const [modifyForm, setModifyForm] = useState({
    customerId: '', type: 'SELL', quantity: '', price: '', unit: 'TOLA'
  })

  useEffect(() => {
    setIsMounted(true)

    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('trades')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      setUser(authData.user)

      const [cRes, eRes, rRes] = await Promise.all([
        fetch('/api/customers', { cache: 'no-store' }),
        fetch('/api/employees', { cache: 'no-store' }),
        fetch('/api/rates', { cache: 'no-store' }),
      ])
      const cData = await cRes.json()
      const eData = await eRes.json()
      const rData = await rRes.json()
      
      if (cData.success) setCustomers(cData.customers)
      if (eData.success) setEmployees(eData.employees)
      if (rData.success && rData.latest) setLatestRate(rData.latest)

      await load()
    }
    init()
  }, [])

  const load = async () => {
    setLoading(true)
    const tRes = await fetch('/api/trades', { cache: 'no-store' })
    const tData = await tRes.json()
    if (tData.success) setTrades(tData.trades)
    setLoading(false)
  }

  const submitNewTrade = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const payload = {
        type: form.type, metal: form.metal, lotSize: form.lotSize, entryOuncePrice: form.entryOuncePrice,
        physicalData: form.hasPhysical ? {
          customerId: form.physicalCustomerId, employeeId: employees[0]?.id || 1, type: form.physicalType,
          metal: form.metal, unit: form.physicalUnit, quantity: form.physicalQuantity,
          usdRate: latestRate ? Number(latestRate.usdToAfn) : 75
        } : null
      }
      const res = await fetch('/api/trades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (data.success) {
        setShowNewForm(false)
        setForm({ ...form, lotSize: '', entryOuncePrice: '', hasPhysical: false, physicalCustomerId: '', physicalQuantity: '', physicalPrice: '' })
        load()
      } else setError(data.error)
    } catch (err) { setError(String(err)) } finally { setSaving(false) }
  }

  const submitCloseTrade = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showCloseForm) return
    setError(''); setSaving(true)
    try {
      const res = await fetch(`/api/trades/${showCloseForm.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(closeForm) })
      const data = await res.json()
      if (data.success) { 
        setShowCloseForm(null); 
        setCloseForm({ actionType: 'BOTH', exitOuncePrice: '', kabulRate: '', spreadUsd: '', commissionUsd: '', swapUsd: '' }); 
        load() 
      } else setError(data.error)
    } catch (err) { setError(String(err)) } finally { setSaving(false) }
  }

  // 👇 تابع اصلاح شده (اضافه کردن روش پرداخت و وضعیت) 👇
  const submitModify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showModifyForm) return
    setError(''); setSaving(true)
    try {
      const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        customerId: modifyForm.customerId, 
        employeeId: employees[0]?.id || 1, 
        type: modifyForm.type,
        metal: showModifyForm.metal, 
        unit: modifyForm.unit, 
        quantity: modifyForm.quantity,
        pricePerUnitUsd: modifyForm.price, 
        usdRate: latestRate ? Number(latestRate.usdToAfn) : 75, 
        linkedTradeId: showModifyForm.id,
        // 👇 این ۳ خط برای رفع خطا اضافه شدند 👇
        paymentMethod: 'CASH',
        paymentStatus: 'UNPAID',
        paidUsd: 0
      })})
      const data = await res.json()
      if (data.success) { setShowModifyForm(null); setModifyForm({ customerId: '', type: 'SELL', quantity: '', price: '', unit: 'TOLA' }); load() } else setError(data.error)
    } catch (err) { setError(String(err)) } finally { setSaving(false) }
  }

  const fmt = (n: any, digits = 2) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  const calculateDifference = () => {
    const ounce = Number(calcData.ouncePrice) || 0
    const kabul = Number(calcData.kabulPrice) || 0
    if (ounce === 0) return 0
    const globalTola = (ounce / 31.1035) * 12.15
    return globalTola - kabul
  }

  const rateDiff = calculateDifference()

  const getCalculations = () => {
    if (!showCloseForm || !closeForm.exitOuncePrice) return null
    
    const entryOunce = Number(showCloseForm.entryOuncePrice)
    const exitOunce = Number(closeForm.exitOuncePrice)
    const lot = Number(showCloseForm.lotSize)
    const kabulRate = Number(closeForm.kabulRate) || 0
    
    let ounces = lot * 100 
    let grossTradeProfit = 0
    
    if (showCloseForm.type === 'BUY') {
      grossTradeProfit = (exitOunce - entryOunce) * ounces
    } else {
      grossTradeProfit = (entryOunce - exitOunce) * ounces
    }

    const spread = Number(closeForm.spreadUsd) || 0
    const commission = Number(closeForm.commissionUsd) || 0
    const swap = Number(closeForm.swapUsd) || 0
    const netTradeProfit = grossTradeProfit - spread - commission - swap

    const physicalProfit = showCloseForm.linkedTransactions.reduce((s, tx) => s + Number(tx.profitLoss), 0)
    const totalProfit = netTradeProfit + physicalProfit

    const globalTolaPrice = (exitOunce / 31.1035) * 12.15
    const diffWithKabul = globalTolaPrice - kabulRate

    return { entryOunce, exitOunce, lot, ounces, grossTradeProfit, netTradeProfit, physicalProfit, totalProfit, globalTolaPrice, diffWithKabul, kabulRate }
  }

  const calcs = getCalculations()

  if (!isMounted) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>
  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'
  
  const openTrades = trades.filter(t => t.status === 'OPEN')
  const closedTrades = trades.filter(t => t.status === 'CLOSED')

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/trades" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><Activity size={18} className="text-[var(--accent)]" /><span>مرکز معاملات (فیکسنگ و فیزیکی)</span></div>
            </div>
            <button onClick={() => setShowNewForm(true)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all duration-300 glow-button shadow-lg"><Plus size={16} /> باز کردن معامله جدید</button>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            <div>
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><ShieldAlert size={20} className="text-yellow-500" />معاملات باز ({openTrades.length})</h2>
              <div className="space-y-5">
                {openTrades.length === 0 ? (<div className="glass-card rounded-3xl p-10 text-center text-[var(--text-muted)] text-sm">هیچ معامله بازی وجود ندارد.</div>) : openTrades.map(tr => (
                  <div key={tr.id} className="glass-card rounded-3xl p-6 hover:border-[var(--accent)] transition-all duration-300 border-t-4 border-t-[var(--accent)]">
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <div className="flex items-center gap-3 mb-2"><span className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${tr.type === 'BUY' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{tr.type === 'BUY' ? 'خرید (Buy)' : 'فروش (Sell)'}</span><span className="text-base font-bold">{tr.metal === 'GOLD' ? '🥇 طلا' : '🥈 نقره'}</span></div>
                        <div className="text-xs text-[var(--text-secondary)]">شناسه: <span className="font-bold" dir="ltr">T-{tr.id}</span></div>
                      </div>
                      <div className="text-right"><div className="text-xs text-[var(--text-secondary)] mb-1">لات</div><div className="text-2xl font-extrabold text-[var(--accent)]" dir="ltr">{fmt(tr.lotSize, 2)}</div></div>
                    </div>

                    <div className="bg-[var(--bg-input)] p-4 rounded-2xl mb-5 border border-[var(--border-base)] space-y-3">
                      <div className="flex justify-between text-xs text-[var(--text-secondary)]">
                        <span>نرخ ورود (اونس):</span>
                        <span className="font-bold text-[var(--text-primary)]" dir="ltr">${fmt(tr.entryOuncePrice)}</span>
                      </div>
                      {tr.linkedTransactions.length > 0 ? (tr.linkedTransactions.map(tx => (
                        <div key={tx.id} className="flex items-center justify-between text-xs bg-[var(--bg-surface-solid)] p-3 rounded-xl border border-[var(--border-base)]">
                          <div><span className="text-blue-500 flex items-center gap-1 font-bold mb-1"><LinkIcon size={14}/> {tx.customer.fullName}</span><span className="text-[var(--text-muted)]">{fmt(tx.quantity)} {tx.unit}</span></div>
                          {tx.status === 'COMPLETED' ? (<span className="text-green-500 text-[10px] flex items-center gap-1 bg-green-500/10 px-2.5 py-1.5 rounded-lg font-bold border border-green-500/20"><CheckCircle2 size={14}/> تسویه شده</span>) : (<span className="text-yellow-500 text-[10px] bg-yellow-500/10 px-2.5 py-1.5 rounded-lg font-bold border border-yellow-500/20">در انتظار تسویه</span>)}
                        </div>
                      ))) : (
                        <div className="flex items-center justify-between text-xs"><span className="text-[var(--text-muted)]">بدون پوشش فیزیکی</span><button onClick={() => setShowModifyForm(tr)} className="text-[var(--accent)] hover:underline bg-[var(--accent-bg)] px-3 py-1.5 rounded-lg font-bold">+ افزودن فیزیکی</button></div>
                      )}
                    </div>

                    <button onClick={() => { setShowCloseForm(tr); setError(''); }} className="w-full py-3 bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm font-bold transition-colors">مدیریت و بستن معامله</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2"><CheckCircle2 size={20} className="text-green-500" />تاریخچه معاملات بسته ({closedTrades.length})</h2>
              <div className="space-y-4">
                {closedTrades.length === 0 ? (<div className="glass-card rounded-3xl p-10 text-center text-[var(--text-muted)] text-sm">هیچ معامله بسته‌ای وجود ندارد.</div>) : closedTrades.map(tr => {
                  const physicalProfit = tr.linkedTransactions.reduce((s, tx) => s + Number(tx.profitLoss), 0)
                  const totalProfit = Number(tr.netProfitUsd) + physicalProfit
                  return (
                    <div key={tr.id} className="glass-card rounded-3xl overflow-hidden">
                      <div onClick={() => setExpandedTrade(expandedTrade === tr.id ? null : tr.id)} className="p-5 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-input)] transition-colors">
                        <div className="flex items-center gap-3"><span className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${tr.type === 'BUY' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{tr.type}</span><span className="text-sm font-bold" dir="ltr">T-{tr.id}</span></div>
                        <div className="flex items-center gap-5">
                          <div className="text-right"><div className={`text-base font-extrabold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">${fmt(totalProfit)}</div><div className="text-[10px] text-[var(--text-muted)]">سود کل (هج)</div></div>
                          {expandedTrade === tr.id ? <ChevronUp size={20} className="text-[var(--text-secondary)]" /> : <ChevronDown size={20} className="text-[var(--text-secondary)]" />}
                        </div>
                      </div>
                      {expandedTrade === tr.id && (
                        <div className="bg-[var(--bg-input)] p-5 border-t border-[var(--border-base)] text-sm space-y-5">
                          <div className="flex justify-between text-xs font-medium text-[var(--text-secondary)]"><span>سود خالص ترید:</span><span className={Number(tr.netProfitUsd) >= 0 ? 'text-green-500' : 'text-red-500'} dir="ltr">${fmt(tr.netProfitUsd)}</span></div>
                          <div className="border-t border-[var(--border-base)] pt-4">
                            <h4 className="text-xs font-bold text-blue-500 mb-3">معاملات فیزیکی هج شده:</h4>
                            {tr.linkedTransactions.length === 0 ? (<div className="text-xs text-[var(--text-muted)]">هیچ معامله‌ای لینک نشده.</div>) : (tr.linkedTransactions.map(tx => (
                              <div key={tx.id} className="flex justify-between items-center bg-[var(--bg-surface-solid)] p-3 rounded-xl mb-2 border border-[var(--border-base)]"><span className="text-xs font-bold">{tx.customer.fullName} ({fmt(tx.quantity)} {tx.unit})</span><span className={`text-xs font-bold ${Number(tx.profitLoss) >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">${fmt(tx.profitLoss)}</span></div>
                            )))}
                          </div>
                          <div className="border-t border-[var(--border-base)] pt-3"><div className="flex justify-between items-center bg-[var(--accent-bg)] p-4 rounded-2xl border border-[var(--accent)]"><span className="text-sm font-bold text-[var(--accent)]">سود کل نهایی (هج):</span><span className={`text-xl font-extrabold ${totalProfit >= 0 ? 'text-[var(--accent)]' : 'text-red-500'}`} dir="ltr">${fmt(totalProfit)}</span></div></div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* فرم باز کردن ترید جدید */}
      {showNewForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border border-[var(--border-base)] rounded-3xl p-6 md:p-8 w-full max-w-lg relative max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-xl font-bold">باز کردن معامله جدید</h2>
              <button onClick={() => setShowNewForm(false)} className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-lg"><ChevronDown size={20} className="rotate-180" /></button>
            </div>

            {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-4 text-sm shrink-0">{error}</div>}

            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
              <button type="button" onClick={() => newTradeScrollRef.current?.scrollBy({ top: -150, behavior: 'smooth' })} className="bg-[var(--accent)] text-white p-2 rounded-full shadow-lg opacity-80 hover:opacity-100"><ChevronUp size={20} /></button>
              <button type="button" onClick={() => newTradeScrollRef.current?.scrollBy({ top: 150, behavior: 'smooth' })} className="bg-[var(--accent)] text-white p-2 rounded-full shadow-lg opacity-80 hover:opacity-100"><ChevronDown size={20} /></button>
            </div>

            <div ref={newTradeScrollRef} className="overflow-y-auto pr-2 custom-scrollbar flex-1">
              <form onSubmit={submitNewTrade} className="space-y-6 pb-4">
                <div className="bg-[var(--bg-input)] p-5 rounded-2xl border border-[var(--border-base)]">
                  <h3 className="text-xs font-bold text-[var(--text-secondary)] mb-4 flex items-center gap-2"><Activity size={16} className="text-[var(--accent)]"/> بخش فیکسنگ (آنلاین)</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">نوع</label><select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"><option value="BUY">خرید (Buy)</option><option value="SELL">فروش (Sell)</option></select></div>
                    <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">فلز</label><select value={form.metal} onChange={e => setForm({...form, metal: e.target.value})} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"><option value="GOLD">طلا</option><option value="SILVER">نقره</option></select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">لات</label><input type="number" step="0.01" value={form.lotSize} onChange={e => setForm({...form, lotSize: e.target.value})} required className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none" /></div>
                    <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">نرخ ورود (اونس) ($)</label><input type="number" step="0.01" value={form.entryOuncePrice} onChange={e => setForm({...form, entryOuncePrice: e.target.value})} required className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none" /></div>
                  </div>
                </div>

                <div className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/20">
                  <h3 className="text-xs font-bold text-blue-500 mb-4 flex items-center gap-2"><Globe size={16}/> محاسبه اختلاف نرخ جهانی و کابل</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">قیمت اونس جهانی ($)</label><input type="number" value={calcData.ouncePrice} onChange={e => setCalcData({...calcData, ouncePrice: e.target.value})} placeholder="مثلاً 4000" className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none" /></div>
                    <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">نرخ کابل (توله) ($)</label><input type="number" value={calcData.kabulPrice} onChange={e => setCalcData({...calcData, kabulPrice: e.target.value})} placeholder="مثلاً 3990" className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none" /></div>
                  </div>
                  <div className="bg-[var(--bg-surface-solid)] rounded-xl p-3 flex justify-between items-center border border-[var(--border-base)]">
                    <span className="text-xs text-[var(--text-secondary)] font-bold">تفاوت در هر توله:</span>
                    <span className={`text-lg font-extrabold ${rateDiff >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">{rateDiff >= 0 ? '+' : ''}${fmt(rateDiff)}</span>
                  </div>
                </div>

                <div className="bg-[var(--accent-bg)] p-5 rounded-2xl border border-[var(--accent)]">
                  <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={form.hasPhysical} onChange={e => setForm({...form, hasPhysical: e.target.checked})} className="w-5 h-5 accent-[var(--accent)]" /><span className="text-sm font-bold text-[var(--accent)]">افزودن معامله فیزیکی همزمان (پوشش ریسک)</span></label>
                  {form.hasPhysical && (
                    <div className="grid grid-cols-2 gap-4 mt-5 pt-5 border-t border-[var(--accent)]">
                      <div className="col-span-2"><label className="block text-[10px] text-[var(--text-secondary)] mb-1">مشتری</label><select value={form.physicalCustomerId} onChange={e => setForm({...form, physicalCustomerId: e.target.value})} required={form.hasPhysical} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"><option value="">انتخاب کنید...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select></div>
                      <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">نوع فیزیکی</label><select value={form.physicalType} onChange={e => setForm({...form, physicalType: e.target.value})} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"><option value="SELL">فروش</option><option value="BUY">خرید</option></select></div>
                      <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">واحد</label><select value={form.physicalUnit} onChange={e => setForm({...form, physicalUnit: e.target.value})} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none"><option value="TOLA">توله</option><option value="KG">کیلو</option></select></div>
                      <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">مقدار</label><input type="number" step="0.01" value={form.physicalQuantity} onChange={e => setForm({...form, physicalQuantity: e.target.value})} required={form.hasPhysical} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none" /></div>
                      <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">نرخ فیزیکی ($)</label><input type="number" step="0.01" value={form.physicalPrice} onChange={e => setForm({...form, physicalPrice: e.target.value})} required={form.hasPhysical} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none" /></div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4"><button type="submit" disabled={saving} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold glow-button">{saving ? '...' : 'ثبت معامله'}</button><button type="button" onClick={() => setShowNewForm(false)} className="flex-1 bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] py-3.5 rounded-xl font-bold">لغو</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* فرم بستن ترید */}
      {showCloseForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border border-[var(--border-base)] rounded-3xl p-6 w-full max-w-md relative max-h-[90vh] flex flex-col">
            
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-xl font-bold">مدیریت و بستن (T-{showCloseForm.id})</h2>
              <button onClick={() => setShowCloseForm(null)} className="text-gray-400 hover:text-white bg-gray-800 p-2 rounded-lg"><ChevronDown size={20} className="rotate-180" /></button>
            </div>
            
            {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-4 text-sm shrink-0">{error}</div>}

            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
              <button type="button" onClick={() => closeTradeScrollRef.current?.scrollBy({ top: -150, behavior: 'smooth' })} className="bg-[var(--accent)] text-white p-2 rounded-full shadow-lg opacity-80 hover:opacity-100"><ChevronUp size={20} /></button>
              <button type="button" onClick={() => closeTradeScrollRef.current?.scrollBy({ top: 150, behavior: 'smooth' })} className="bg-[var(--accent)] text-white p-2 rounded-full shadow-lg opacity-80 hover:opacity-100"><ChevronDown size={20} /></button>
            </div>

            <div ref={closeTradeScrollRef} className="overflow-y-auto pr-2 custom-scrollbar flex-1">
              <form onSubmit={submitCloseTrade} className="space-y-5 pb-4">
                <div className="bg-[var(--bg-input)] p-5 rounded-2xl border border-[var(--border-base)]">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-4">چه چیزی را می‌خواهید ببندید؟</label>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-2 text-sm font-medium bg-[var(--bg-surface-solid)] p-3 rounded-xl border border-[var(--border-base)] ${showCloseForm.linkedTransactions.length === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="radio" name="actionType" value="PHYSICAL" checked={closeForm.actionType === 'PHYSICAL'} onChange={e => setCloseForm({...closeForm, actionType: e.target.value})} disabled={showCloseForm.linkedTransactions.length === 0} className="w-4 h-4 accent-blue-500" />
                      فقط فیزیکی (ترید باز بماند)
                    </label>
                    
                    <label className={`flex items-center gap-2 text-sm font-medium bg-[var(--bg-surface-solid)] p-3 rounded-xl border border-[var(--border-base)] ${showCloseForm.linkedTransactions.length === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="radio" name="actionType" value="BOTH" checked={closeForm.actionType === 'BOTH'} onChange={e => setCloseForm({...closeForm, actionType: e.target.value})} disabled={showCloseForm.linkedTransactions.length === 0} className="w-4 h-4 accent-[var(--accent)]" />
                      هر دو را با هم ببند
                    </label>

                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer bg-[var(--bg-surface-solid)] p-3 rounded-xl border border-[var(--border-base)]">
                      <input type="radio" name="actionType" value="TRADE" checked={closeForm.actionType === 'TRADE'} onChange={e => setCloseForm({...closeForm, actionType: e.target.value})} className="w-4 h-4 accent-red-500" />
                      فقط ترید را ببند
                    </label>
                  </div>
                </div>
                
                {closeForm.actionType !== 'PHYSICAL' && (
                  <div className="space-y-4 bg-[var(--bg-input)] p-5 rounded-2xl border border-[var(--border-base)]">
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-2">نرخ خروج (اونس جهانی) $</label>
                      <input type="number" step="0.01" value={closeForm.exitOuncePrice} onChange={e => setCloseForm({...closeForm, exitOuncePrice: e.target.value})} required={closeForm.actionType !== 'PHYSICAL'} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
                    </div>

                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-2">نرخ کابل (دستی) $</label>
                      <input type="number" step="0.01" value={closeForm.kabulRate} onChange={e => setCloseForm({...closeForm, kabulRate: e.target.value})} required={closeForm.actionType !== 'PHYSICAL'} placeholder="نرخ دستی کابل را وارد کنید" className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
                    </div>
                    
                    {calcs && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 space-y-3 text-sm">
                        <div className="flex justify-between text-[var(--text-secondary)]">
                          <span>حجم ترید:</span>
                          <span className="font-bold" dir="ltr">{calcs.lot} لات ({calcs.ounces} اونس)</span>
                        </div>
                        
                        <div className="flex justify-between text-[var(--text-secondary)] border-b border-blue-500/20 pb-2">
                          <span>سود گروس (قبل از هزینه):</span>
                          <span className={`${calcs.grossTradeProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">${fmt(calcs.grossTradeProfit)}</span>
                        </div>

                        <div className="flex justify-between text-[var(--text-primary)] font-bold pt-1">
                          <span>سود خالص ترید:</span>
                          <span className={`${calcs.netTradeProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">${fmt(calcs.netTradeProfit)}</span>
                        </div>
                        
                        <div className="bg-[var(--bg-base)] p-2 rounded text-[10px] text-[var(--text-secondary)] text-center" dir="rtl">
                          📐 فرمول خالص: (گروس ${fmt(calcs.grossTradeProfit)}) - (اسپرد+کمیشن+سوآپ)
                        </div>

                        <div className="bg-[var(--bg-base)] p-2 rounded text-[10px] text-[var(--text-secondary)] text-center" dir="rtl">
                          📐 تبدیل اونس به توله: ({calcs.exitOunce} ÷ ۳۱.۱۰۳۵) × ۱۲.۱۵ = ${fmt(calcs.globalTolaPrice)}
                        </div>

                        <div className="bg-[var(--bg-base)] p-2 rounded text-[10px] text-red-400 text-center font-bold" dir="rtl">
                          📐 اختلاف با نرخ کابل دستی (${fmt(calcs.kabulRate)}): ${fmt(calcs.diffWithKabul)}
                        </div>

                        <div className="flex justify-between text-[var(--text-primary)] font-bold pt-2 border-t border-blue-500/30">
                          <span>سود فیزیکی (هج شده):</span>
                          <span className={`${calcs.physicalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">${fmt(calcs.physicalProfit)}</span>
                        </div>

                        <div className="flex justify-between text-lg pt-2 border-t border-blue-500/30 bg-[var(--bg-base)] p-2 rounded-lg mt-2">
                          <span className="text-[var(--accent)] font-extrabold">سود کل نهایی:</span>
                          <span className={`font-extrabold ${calcs.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">${fmt(calcs.totalProfit)}</span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">اسپرد ($)</label><input type="number" value={closeForm.spreadUsd} onChange={e => setCloseForm({...closeForm, spreadUsd: e.target.value})} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-3 py-2 text-sm focus:outline-none" /></div>
                      <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">کمیسیون ($)</label><input type="number" value={closeForm.commissionUsd} onChange={e => setCloseForm({...closeForm, commissionUsd: e.target.value})} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-3 py-2 text-sm focus:outline-none" /></div>
                      <div><label className="block text-[10px] text-[var(--text-secondary)] mb-1">سوآپ ($)</label><input type="number" value={closeForm.swapUsd} onChange={e => setCloseForm({...closeForm, swapUsd: e.target.value})} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-xl px-3 py-2 text-sm focus:outline-none" /></div>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2"><button type="submit" disabled={saving} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold glow-button">{saving ? '...' : 'تایید و بستن'}</button><button type="button" onClick={() => setShowCloseForm(null)} className="flex-1 bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] py-3.5 rounded-xl font-bold">لغو</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* فرم افزودن معامله فیزیکی به ترید باز */}
      {showModifyForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border border-[var(--border-base)] rounded-3xl p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2">افزودن فیزیکی به T-{showModifyForm.id}</h2>
            <p className="text-xs text-[var(--text-secondary)] mb-6">شما در حال اضافه کردن یک معامله فیزیکی به این ترید باز هستید.</p>
            {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-4 text-sm">{error}</div>}
            <form onSubmit={submitModify} className="space-y-5">
              <div><label className="block text-xs text-[var(--text-secondary)] mb-2">مشتری</label><select value={modifyForm.customerId} onChange={e => setModifyForm({...modifyForm, customerId: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none"><option value="">انتخاب کنید...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-[var(--text-secondary)] mb-2">نوع فیزیکی</label><select value={modifyForm.type} onChange={e => setModifyForm({...modifyForm, type: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none"><option value="SELL">فروش</option><option value="BUY">خرید</option></select></div>
                <div><label className="block text-xs text-[var(--text-secondary)] mb-2">واحد</label><select value={modifyForm.unit} onChange={e => setModifyForm({...modifyForm, unit: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none"><option value="TOLA">توله</option><option value="KG">کیلو</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs text-[var(--text-secondary)] mb-2">مقدار</label><input type="number" value={modifyForm.quantity} onChange={e => setModifyForm({...modifyForm, quantity: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none" /></div>
                <div><label className="block text-xs text-[var(--text-secondary)] mb-2">نرخ واحد ($)</label><input type="number" value={modifyForm.price} onChange={e => setModifyForm({...modifyForm, price: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none" /></div>
              </div>
              <div className="flex gap-3 pt-3"><button type="submit" disabled={saving} className="flex-1 bg-blue-500 text-white py-3.5 rounded-xl font-bold">{saving ? '...' : 'ذخیره و لینک'}</button><button type="button" onClick={() => setShowModifyForm(null)} className="flex-1 bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] py-3.5 rounded-xl font-bold">لغو</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}