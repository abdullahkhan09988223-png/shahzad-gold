'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { exportToExcel } from '@/lib/excel'
import {
  ArrowLeftRight, TrendingUp, DollarSign, Plus, Search, Link as LinkIcon, Menu, Download
} from 'lucide-react'

type Transaction = {
  id: number
  invoiceNumber: string
  type: string
  metal: string
  unit: string
  quantity: string
  totalUsd: string
  profitLoss: string
  paymentStatus: string
  transactionDate: string
  customer: { id: number; fullName: string; phone: string }
  linkedTrade: { id: number; lotSize: string; type: string } | null
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function TransactionsPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

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
      await load()
    }
    init()
  }, [])

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/transactions', { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setTransactions(data.transactions)
    setLoading(false)
  }

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  const totalSell = transactions.filter((tx) => tx.type === 'SELL').reduce((sum, tx) => sum + Number(tx.totalUsd), 0)
  const totalBuy = transactions.filter((tx) => tx.type === 'BUY').reduce((sum, tx) => sum + Number(tx.totalUsd), 0)
  const totalProfit = transactions.reduce((sum, tx) => sum + Number(tx.profitLoss), 0)

  const filtered = transactions.filter((tx) => {
    const matchType = filter === 'ALL' || (filter === 'BUY' && (tx.type === 'BUY' || tx.type === 'PRE_BUY')) || (filter === 'SELL' && (tx.type === 'SELL' || tx.type === 'PRE_SELL'))
    const matchSearch = search === '' || tx.customer.fullName.includes(search) || tx.invoiceNumber.includes(search)
    return matchType && matchSearch
  })

  const handleExportExcel = () => {
    const dataToExport = filtered.map(tx => ({
      'شماره فاکتور': tx.invoiceNumber,
      'تاریخ': new Date(tx.transactionDate).toLocaleDateString('fa-IR'),
      'مشتری': tx.customer.fullName,
      'نوعیت': tx.type === 'BUY' || tx.type === 'PRE_BUY' ? 'خرید' : 'فروش',
      'فلز': tx.metal === 'GOLD' ? 'طلا' : 'نقره',
      'مقدار': Number(tx.quantity).toFixed(3),
      'واحد': tx.unit === 'TOLA' ? 'توله' : tx.unit === 'KG' ? 'کیلو' : 'گرام',
      'جمع کل ($)': Number(tx.totalUsd),
      'سود/ضرر ($)': Number(tx.profitLoss),
      'وضعیت پرداخت': tx.paymentStatus === 'PAID' ? 'پرداخت شده' : tx.paymentStatus === 'PARTIAL' ? 'جزئی' : 'پرداخت نشده'
    }))
    exportToExcel(dataToExport, `لیست_معاملات_${new Date().toLocaleDateString('fa-IR')}`, 'معاملات')
  }

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

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
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium">
                <ArrowLeftRight size={18} className="text-[var(--accent)]" />
                <span>لیست خرید و فروش</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleExportExcel} className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
                <Download size={16} /> خروجی اکسل
              </button>
              <Link href="/transactions/new" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all duration-300 glow-button shadow-lg">
                <Plus size={16} /> معامله جدید
              </Link>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card rounded-3xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent)]"><TrendingUp size={28} /></div>
              <div><div className="text-xs text-[var(--text-secondary)] mb-1 font-medium">کل فروش</div><div className="text-2xl font-bold" dir="ltr">${fmt(totalSell)}</div></div>
            </div>
            <div className="glass-card rounded-3xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><ArrowLeftRight size={28} /></div>
              <div><div className="text-xs text-[var(--text-secondary)] mb-1 font-medium">کل خرید</div><div className="text-2xl font-bold" dir="ltr">${fmt(totalBuy)}</div></div>
            </div>
            <div className="glass-card rounded-3xl p-6 flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500"><DollarSign size={28} /></div>
              <div><div className="text-xs text-[var(--text-secondary)] mb-1 font-medium">کل سود / ضرر</div><div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">${fmt(totalProfit)}</div></div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5 mb-8 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"><Search size={18} className="text-[var(--text-muted)]" /></div>
              <input type="text" placeholder="جستجو بر اساس نام مشتری یا شماره فاکتور..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-11 pl-4 py-3 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
            <div className="flex gap-2 bg-[var(--bg-input)] p-1.5 rounded-xl border border-[var(--border-base)]">
              {[{ id: 'ALL', label: 'همه' },{ id: 'SELL', label: t('sell') },{ id: 'BUY', label: t('buy') }].map((f) => (
                <button key={f.id} onClick={() => setFilter(f.id)} className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${filter === f.id ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>{f.label}</button>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            {loading ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>) : filtered.length === 0 ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ معامله‌ای یافت نشد</div>) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr><th className="p-5 text-right font-bold">فاکتور</th><th className="p-5 text-right font-bold">تاریخ</th><th className="p-5 text-right font-bold">مشتری</th><th className="p-5 text-right font-bold">نوع</th><th className="p-5 text-right font-bold">فلز / مقدار</th><th className="p-5 text-right font-bold">جمع ($)</th><th className="p-5 text-right font-bold">سود/ضرر</th><th className="p-5 text-right font-bold">ترید</th><th className="p-5 text-right font-bold">وضعیت</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx) => (
                      <tr key={tx.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-5 text-xs font-bold" dir="ltr"><Link href={`/transactions/${tx.id}`} className="text-blue-500 hover:underline">{tx.invoiceNumber}</Link></td>
                        <td className="p-5 text-xs text-[var(--text-secondary)]" dir="ltr">{new Date(tx.transactionDate).toLocaleDateString('fa-IR')}</td>
                        <td className="p-5 font-bold">{tx.customer.fullName}</td>
                        <td className="p-5">
                          {tx.type === 'BUY' || tx.type === 'PRE_BUY' ? (
                            <span className="bg-green-500/10 text-green-500 text-xs px-3 py-1.5 rounded-lg font-bold border border-green-500/20">{t('buy')}</span>
                          ) : (
                            <span className="bg-red-500/10 text-red-500 text-xs px-3 py-1.5 rounded-lg font-bold border border-red-500/20">{t('sell')}</span>
                          )}
                        </td>
                        <td className="p-5 text-xs" dir="ltr">
                          {tx.metal === 'GOLD' ? '🥇 طلا' : '🥈 نقره'} <br/>
                          <span className="text-[var(--text-muted)]">{fmt(tx.quantity, 3)} {tx.unit === 'TOLA' ? 'توله' : tx.unit === 'KG' ? 'کیلو' : tx.unit === 'MASHA' ? 'ماشا' : 'گرام'}</span>
                        </td>
                        <td className="p-5 font-bold" dir="ltr">${fmt(tx.totalUsd)}</td>
                        <td className={`p-5 font-bold ${Number(tx.profitLoss) >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                          {Number(tx.profitLoss) >= 0 ? '+' : ''}${fmt(tx.profitLoss)}
                        </td>
                        <td className="p-5 text-xs">
                          {tx.linkedTrade ? (
                            <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg font-bold"><LinkIcon size={14} /> T-{tx.linkedTrade.id}</span>
                          ) : (
                            <span className="text-[var(--text-muted)]">-</span>
                          )}
                        </td>
                        <td className="p-5">
                          {tx.paymentStatus === 'PAID' ? (
                            <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1.5 rounded-lg font-bold">{t('paid')}</span>
                          ) : tx.paymentStatus === 'PARTIAL' ? (
                            <span className="text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-lg font-bold">{t('partial')}</span>
                          ) : (
                            <span className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg font-bold">{t('unpaid')}</span>
                          )}
                        </td>
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