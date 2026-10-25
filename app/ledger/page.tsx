'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import {
  FileText, Printer, Search, Menu, Link as LinkIcon
} from 'lucide-react'

type Transaction = {
  id: number
  invoiceNumber: string
  type: string
  metal: string
  unit: string
  quantity: string
  pricePerUnitUsd: string
  totalUsd: string
  totalAfn: string
  commission: string
  paidUsd: string
  remainingUsd: string
  profitLoss: string
  paymentStatus: string
  transactionDate: string
  customer: { id: number; fullName: string; phone: string }
  employee: { id: number; fullName: string }
  linkedTrade: { id: number } | null
}

type Totals = {
  count: number
  totalBuy: number
  totalSell: number
  totalPreBuy: number
  totalPreSell: number
  totalProfit: number
  totalLoss: number
  totalCommission: number
  totalRemaining: number
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function LedgerPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [items, setItems] = useState<Transaction[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // 👈 استیت‌ها برای جلوگیری از خطای new Date()
  const [isMounted, setIsMounted] = useState(false)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [type, setType] = useState('ALL')
  const [metal, setMetal] = useState('ALL')

  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    setFrom(firstDay.toISOString().split('T')[0])
    setTo(today.toISOString().split('T')[0])
    setIsMounted(true)

    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('ledger')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      setUser(authData.user)
    }
    init()
  }, [])

  // 👈 گرفتن دیتا فقط وقتی تاریخ‌ها تنظیم شدند
  useEffect(() => {
    if (!from || !to) return
    load()
  }, [from, to, type, metal])

  const load = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (type !== 'ALL') params.set('type', type)
    if (metal !== 'ALL') params.set('metal', metal)

    const res = await fetch(`/api/ledger?${params}`, { cache: 'no-store' })
    const data = await res.json()
    if (data.success) {
      setItems(data.transactions)
      setTotals(data.totals)
    }
    setLoading(false)
  }

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  const typeLabel = (txType: string) => {
    if (txType === 'BUY') return '🛒 خرید'
    if (txType === 'SELL') return '💰 فروش'
    if (txType === 'PRE_BUY') return '📥 پیش‌خرید'
    if (txType === 'PRE_SELL') return '📤 پیش‌فروش'
    return txType
  }

  const typeColor = (txType: string) => {
    if (txType === 'BUY') return 'bg-green-500/10 text-green-500 border-green-500/20'
    if (txType === 'SELL') return 'bg-red-500/10 text-red-500 border-red-500/20'
    if (txType === 'PRE_BUY') return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    if (txType === 'PRE_SELL') return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
    return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  }

  const unitLabel = (u: string) => u === 'TOLA' ? 'توله' : u === 'KG' ? 'کیلو' : u === 'GRAM' ? 'گرام' : 'ماشا'

  if (!isMounted) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>
  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/ledger" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><FileText size={18} className="text-[var(--accent)]" /><span>روزنامچه معاملات</span></div>
            </div>
            <Link href={`/ledger/print?from=${from}&to=${to}&type=${type}&metal=${metal}`} target="_blank" className="bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"><Printer size={16} /> پرینت لیست</Link>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="glass-card rounded-3xl p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">از تاریخ</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" /></div>
              <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">تا تاریخ</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" /></div>
              <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوع</label><select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="ALL">همه</option><option value="BUY">خرید</option><option value="SELL">فروش</option><option value="PRE_BUY">پیش‌خرید</option><option value="PRE_SELL">پیش‌فروش</option></select></div>
              <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">فلز</label><select value={metal} onChange={(e) => setMetal(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="ALL">همه</option><option value="GOLD">طلا</option><option value="SILVER">نقره</option></select></div>
              <div className="flex items-end"><button onClick={load} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all glow-button"><Search size={16} /> نمایش</button></div>
            </div>
          </div>

          {totals && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card rounded-2xl p-5"><div className="text-[10px] text-[var(--text-secondary)] mb-1 font-medium">🛒 کل خرید</div><div className="text-xl font-bold text-green-500" dir="ltr">${fmt(totals.totalBuy)}</div></div>
              <div className="glass-card rounded-2xl p-5"><div className="text-[10px] text-[var(--text-secondary)] mb-1 font-medium">💰 کل فروش</div><div className="text-xl font-bold text-red-500" dir="ltr">${fmt(totals.totalSell)}</div></div>
              <div className="glass-card rounded-2xl p-5"><div className="text-[10px] text-[var(--text-secondary)] mb-1 font-medium">📊 سود</div><div className="text-xl font-bold text-green-500" dir="ltr">${fmt(totals.totalProfit)}</div></div>
              <div className="glass-card rounded-2xl p-5"><div className="text-[10px] text-[var(--text-secondary)] mb-1 font-medium">⚠️ باقی‌مانده</div><div className="text-xl font-bold text-red-500" dir="ltr">${fmt(totals.totalRemaining)}</div></div>
            </div>
          )}

          <div className="glass-card rounded-3xl overflow-hidden">
            {loading ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>) : items.length === 0 ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ معامله‌ای یافت نشد</div>) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr><th className="p-4 text-right font-bold">#</th><th className="p-4 text-right font-bold">فاکتور</th><th className="p-4 text-right font-bold">تاریخ</th><th className="p-4 text-right font-bold">مشتری</th><th className="p-4 text-right font-bold">نوع</th><th className="p-4 text-right font-bold">فلز</th><th className="p-4 text-right font-bold">مقدار</th><th className="p-4 text-right font-bold">جمع ($)</th><th className="p-4 text-right font-bold">باقی ($)</th><th className="p-4 text-right font-bold">ترید</th></tr>
                  </thead>
                  <tbody>
                    {items.map((tx, i) => (
                      <tr key={tx.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-4 text-xs text-[var(--text-muted)]">{i + 1}</td>
                        <td className="p-4 text-xs font-bold" dir="ltr"><Link href={`/transactions/${tx.id}`} className="text-blue-500 hover:underline">{tx.invoiceNumber}</Link></td>
                        <td className="p-4 text-xs text-[var(--text-secondary)]" dir="ltr">{new Date(tx.transactionDate).toLocaleDateString('fa-IR')}</td>
                        <td className="p-4 text-xs font-medium">{tx.customer.fullName}</td>
                        <td className="p-4"><span className={`text-[10px] px-2 py-1 rounded-md font-bold border ${typeColor(tx.type)}`}>{typeLabel(tx.type)}</span></td>
                        <td className="p-4 text-xs">{tx.metal === 'GOLD' ? '🥇' : '🥈'}</td>
                        <td className="p-4 text-xs text-[var(--text-secondary)]" dir="ltr">{Number(tx.quantity).toFixed(3)} <span className="text-[10px] text-[var(--text-muted)]">{unitLabel(tx.unit)}</span></td>
                        <td className="p-4 text-xs font-bold" dir="ltr">${fmt(tx.totalUsd)}</td>
                        <td className={`p-4 text-xs font-bold ${Number(tx.remainingUsd) > 0 ? 'text-red-500' : 'text-[var(--text-muted)]'}`} dir="ltr">{Number(tx.remainingUsd) > 0 ? `$${fmt(tx.remainingUsd)}` : '-'}</td>
                        <td className="p-4 text-xs">{tx.linkedTrade ? (<span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md border border-blue-500/20 font-bold"><LinkIcon size={12} /> T-{tx.linkedTrade.id}</span>) : '-'}</td>
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