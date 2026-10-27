'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { exportToExcel } from '@/lib/excel'
import { toPng } from 'html-to-image'
import {
  ArrowLeftRight, TrendingUp, DollarSign, Plus, Search, Menu, Download, Printer, Eye, Calendar, Trash2, Home, Camera
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
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [metalFilter, setMetalFilter] = useState('ALL')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [quickFilter, setQuickFilter] = useState('TODAY')

  const tableRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    applyQuickFilter('TODAY')

    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('transactions')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }
      setUser(authData.user)
    }
    init()
  }, [])

  useEffect(() => {
    if (from && to) load()
  }, [from, to, typeFilter, metalFilter])

  const applyQuickFilter = (type: string) => {
    setQuickFilter(type)
    const today = new Date()
    let start = new Date()
    let end = new Date()

    if (type === 'TODAY') {
      start = today
      end = today
    } else if (type === 'YESTERDAY') {
      start.setDate(today.getDate() - 1)
      end.setDate(today.getDate() - 1)
    } else if (type === 'THIS_MONTH') {
      start = new Date(today.getFullYear(), today.getMonth(), 1)
      end = today
    } else if (type === 'ALL') {
      start = new Date(2020, 0, 1)
      end = today
    }

    setFrom(start.toISOString().split('T')[0])
    setTo(end.toISOString().split('T')[0])
  }

  const load = async () => {
    setLoading(true)
    // 👇 اضافه شدن hideLinked=true برای مخفی کردن معاملات لینک شده 👇
    const url = `/api/transactions?from=${from}&to=${to}&type=${typeFilter === 'ALL' ? '' : typeFilter}&metal=${metalFilter === 'ALL' ? '' : metalFilter}&hideLinked=true`
    const res = await fetch(url, { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setTransactions(data.transactions)
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('⚠️ آیا مطمئن هستید که می‌خواهید این معامله را حذف کنید؟\nبا این کار موجودی مشتری و فاکتور کاملاً پاک می‌شود.')) return
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        load()
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert(String(err))
    }
  }

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  const filtered = transactions.filter((tx) => {
    const matchSearch = search === '' || tx.customer.fullName.includes(search) || tx.invoiceNumber.includes(search)
    return matchSearch
  })

  const totalSell = filtered.filter((tx) => tx.type === 'SELL' || tx.type === 'PRE_SELL').reduce((sum, tx) => sum + Number(tx.totalUsd), 0)
  const totalBuy = filtered.filter((tx) => tx.type === 'BUY' || tx.type === 'PRE_BUY').reduce((sum, tx) => sum + Number(tx.totalUsd), 0)
  const totalProfit = filtered.reduce((sum, tx) => sum + Number(tx.profitLoss), 0)

  const handleExportExcel = () => {
    const dataToExport = filtered.map(tx => ({
      'شماره فاکتور': tx.invoiceNumber,
      'تاریخ': new Date(tx.transactionDate).toLocaleDateString('fa-IR'),
      'مشتری': tx.customer.fullName,
      'نوعیت': tx.type === 'BUY' || tx.type === 'PRE_BUY' ? 'خرید' : 'فروش',
      'فلز': tx.metal === 'GOLD' ? 'طلا' : 'نقره',
      'مقدار': Number(tx.quantity).toFixed(3),
      'واحد': tx.unit === 'TOLA' ? 'توله' : tx.unit === 'KG' ? 'کیلو' : tx.unit === 'MASHA' ? 'ماشا' : 'گرام',
      'جمع کل ($)': Number(tx.totalUsd),
      'سود/ضرر ($)': Number(tx.profitLoss),
      'وضعیت پرداخت': tx.paymentStatus === 'PAID' ? 'پرداخت شده' : tx.paymentStatus === 'PARTIAL' ? 'جزئی' : 'پرداخت نشده'
    }))
    exportToExcel(dataToExport, `لیست_معاملات_${new Date().toLocaleDateString('fa-IR')}`, 'معاملات')
  }

  const handleExportImage = () => {
    if (tableRef.current === null) return
    toPng(tableRef.current, { cacheBust: true, backgroundColor: '#0f172a' })
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = `لیست_معاملات_${new Date().toISOString().split('T')[0]}.png`
        link.href = dataUrl
        link.click()
      })
      .catch((err) => {
        console.error('خطا در گرفتن عکس:', err)
        alert('خطا در گرفتن عکس')
      })
  }

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/transactions" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)] print:hidden">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)]"><Home size={14} /> داشبورد</Link>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium">
                <ArrowLeftRight size={18} className="text-[var(--accent)]" />
                <span>لیست خرید و فروش</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportExcel} className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
                <Download size={16} /> اکسل
              </button>
              <button onClick={handleExportImage} className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 border border-purple-500/20 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
                <Camera size={16} /> عکس
              </button>
              <button onClick={() => window.print()} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 border border-blue-500/20 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
                <Printer size={16} /> پرینت
              </button>
              
              <Link href="/transactions/new" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all duration-300 glow-button shadow-lg">
                <Plus size={16} /> معامله جدید
              </Link>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:hidden">
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

          <div className="glass-card rounded-3xl p-5 mb-8 flex flex-col gap-4 print:hidden">
            <div className="flex flex-wrap gap-2 bg-[var(--bg-input)] p-1.5 rounded-2xl border border-[var(--border-base)]">
              {[
                { id: 'TODAY', label: 'امروز' },
                { id: 'YESTERDAY', label: 'دیروز' },
                { id: 'THIS_MONTH', label: 'این ماه' },
                { id: 'ALL', label: 'کل تاریخچه' },
              ].map(f => (
                <button key={f.id} onClick={() => applyQuickFilter(f.id)} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${quickFilter === f.id ? 'bg-[var(--accent)] text-white shadow-md' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'}`}>
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 flex items-center gap-1"><Calendar size={14}/> از تاریخ</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2 flex items-center gap-1"><Calendar size={14}/> تا تاریخ</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوعیت معامله</label>
                <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]">
                  <option value="ALL">همه (خرید و فروش)</option>
                  <option value="BUY">خرید</option>
                  <option value="SELL">فروش</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوعیت فلز</label>
                <select value={metalFilter} onChange={(e) => setMetalFilter(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--accent)]">
                  <option value="ALL">همه فلزات</option>
                  <option value="GOLD">طلا 🥇</option>
                  <option value="SILVER">نقره 🥈</option>
                </select>
              </div>
            </div>
            
            <div className="relative w-full">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"><Search size={18} className="text-[var(--text-muted)]" /></div>
              <input type="text" placeholder="جستجو بر اساس نام مشتری یا شماره فاکتور..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-11 pl-4 py-3 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden bg-[var(--bg-surface-solid)]" ref={tableRef}>
            {loading ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>) : filtered.length === 0 ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ معامله‌ای با این مشخصات یافت نشد</div>) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr>
                      <th className="p-5 text-right font-bold">فاکتور</th>
                      <th className="p-5 text-right font-bold">تاریخ</th>
                      <th className="p-5 text-right font-bold">مشتری</th>
                      <th className="p-5 text-right font-bold">نوع</th>
                      <th className="p-5 text-right font-bold">فلز / مقدار</th>
                      <th className="p-5 text-right font-bold">جمع ($)</th>
                      <th className="p-5 text-right font-bold">سود/ضرر</th>
                      <th className="p-5 text-right font-bold">وضعیت</th>
                      <th className="p-5 text-center font-bold print:hidden">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx) => (
                      <tr key={tx.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-5 text-xs font-bold" dir="ltr">{tx.invoiceNumber}</td>
                        <td className="p-5 text-xs text-[var(--text-secondary)]" dir="ltr">{new Date(tx.transactionDate).toLocaleDateString('fa-IR')}</td>
                        <td className="p-5 font-bold">{tx.customer.fullName}</td>
                        <td className="p-5">
                          {tx.type === 'BUY' || tx.type === 'PRE_BUY' ? (
                            <span className="bg-green-500/10 text-green-500 text-xs px-3 py-1.5 rounded-lg font-bold border border-green-500/20">خرید</span>
                          ) : (
                            <span className="bg-red-500/10 text-red-500 text-xs px-3 py-1.5 rounded-lg font-bold border border-red-500/20">فروش</span>
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
                        <td className="p-5">
                          {tx.paymentStatus === 'PAID' ? (
                            <span className="text-xs bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1.5 rounded-lg font-bold">تکمیل</span>
                          ) : tx.paymentStatus === 'PARTIAL' ? (
                            <span className="text-xs bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-3 py-1.5 rounded-lg font-bold">جزئی</span>
                          ) : (
                            <span className="text-xs bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1.5 rounded-lg font-bold">نشده</span>
                          )}
                        </td>
                        <td className="p-5 print:hidden">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/transactions/${tx.id}`} title="مشاهده" className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors">
                              <Eye size={16} />
                            </Link>
                            <Link href={`/transactions/${tx.id}/invoice`} target="_blank" title="چاپ" className="p-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 rounded-lg transition-colors">
                              <Printer size={16} />
                            </Link>
                            <button onClick={() => handleDelete(tx.id)} title="حذف معامله" className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
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