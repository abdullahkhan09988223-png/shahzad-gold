'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { exportToExcel } from '@/lib/excel' // 👈 ایمپورت تابع اکسل
import {
  Search, Menu, AlertTriangle, ChevronRight, Calendar, Users, DollarSign, Wallet, Download
} from 'lucide-react'

type Debtor = {
  id: number
  fullName: string
  phone: string
  balanceUsd: string
  balanceAfn: string
  unpaidTransactions: number
  daysSinceOldest: number
}

type Totals = { count: number; totalUsd: number; totalAfn: number; overdue: number }
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function DebtsPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [debtors, setDebtors] = useState<Debtor[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('debts')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      setUser(authData.user)

      const res = await fetch('/api/debts', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) { setDebtors(data.debtors); setTotals(data.totals) }
      setLoading(false)
    }
    init()
  }, [])

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const filtered = debtors.filter((d) => d.fullName.includes(search) || d.phone.includes(search))

  // 👇 تابع خروجی اکسل 👇
  const handleExportExcel = () => {
    const dataToExport = filtered.map(d => ({
      'نام مشتری': d.fullName,
      'شماره تلفن': d.phone,
      'مبلغ بدهی ($)': Number(d.balanceUsd),
      'تعداد معاملات پرداخت نشده': d.unpaidTransactions,
      'قدمت بدهی (روز)': d.daysSinceOldest,
    }))
    exportToExcel(dataToExport, `لیست_بدهکاران_${new Date().toLocaleDateString('fa-IR')}`, 'بدهکاران')
  }

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  const getStatusColor = (days: number) => {
    if (days > 60) return 'bg-red-500/10 text-red-500 border-red-500/20'
    if (days > 30) return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
    if (days > 7) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    return 'bg-green-500/10 text-green-500 border-green-500/20'
  }

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/debts" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><AlertTriangle size={18} className="text-red-500" /><span>مدیریت قرض‌ها و بدهکاران</span></div>
            </div>
            {/* 👇 دکمه اکسل 👇 */}
            <button onClick={handleExportExcel} className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
              <Download size={16} /> خروجی اکسل
            </button>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          {totals && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
              <div className="glass-card rounded-3xl p-6"><div className="text-xs text-[var(--text-secondary)] mb-2 flex items-center gap-1 font-medium"><Users size={16}/> تعداد بدهکاران</div><div className="text-3xl font-extrabold">{totals.count}</div></div>
              <div className="glass-card rounded-3xl p-6"><div className="text-xs text-[var(--text-secondary)] mb-2 flex items-center gap-1 font-medium"><DollarSign size={16} className="text-red-500"/> کل بدهی (دالر)</div><div className="text-3xl font-extrabold text-red-500" dir="ltr">${fmt(totals.totalUsd)}</div></div>
              <div className="glass-card rounded-3xl p-6"><div className="text-xs text-[var(--text-secondary)] mb-2 flex items-center gap-1 font-medium"><Wallet size={16} className="text-red-500"/> کل بدهی (افغانی)</div><div className="text-3xl font-extrabold text-red-500" dir="ltr">{fmt(totals.totalAfn, 0)} ؋</div></div>
              <div className="glass-card rounded-3xl p-6 border-t-4 border-t-red-500"><div className="text-xs text-red-500 mb-2 flex items-center gap-1 font-bold"><AlertTriangle size={16}/> معوق (بالای ۳۰ روز)</div><div className="text-3xl font-extrabold text-red-500">{totals.overdue} <span className="text-sm font-normal text-red-400/70">نفر</span></div></div>
            </div>
          )}

          <div className="glass-card rounded-3xl p-5 mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"><Search size={18} className="text-[var(--text-muted)]" /></div>
              <input type="text" placeholder="جستجو بر اساس نام یا تلفن..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-11 pl-4 py-3 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            {loading ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>) : filtered.length === 0 ? (<div className="p-10 text-center text-[var(--text-muted)] flex flex-col items-center gap-2"><div className="text-4xl">🎉</div><div>هیچ کسی بدهکار نیست!</div></div>) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr><th className="p-5 text-right font-bold">مشتری</th><th className="p-5 text-right font-bold">تلفن</th><th className="p-5 text-right font-bold">مبلغ بدهی ($)</th><th className="p-5 text-right font-bold">مبلغ بدهی (؋)</th><th className="p-5 text-right font-bold">تعداد معامله</th><th className="p-5 text-right font-bold">قدمت بدهی</th><th className="p-5 text-right font-bold">عملیات</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => (
                      <tr key={d.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-5 font-bold text-[var(--text-primary)]">{d.fullName}</td>
                        <td className="p-5 text-[var(--text-secondary)] text-xs" dir="ltr">{d.phone}</td>
                        <td className="p-5 font-bold text-red-500" dir="ltr">${fmt(d.balanceUsd)}</td>
                        <td className="p-5 text-red-500 text-xs" dir="ltr">{fmt(d.balanceAfn, 0)} ؋</td>
                        <td className="p-5 text-[var(--text-secondary)] text-xs">{d.unpaidTransactions} معامله</td>
                        <td className="p-5"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border ${getStatusColor(d.daysSinceOldest)}`}><Calendar size={14} />{d.daysSinceOldest} روز پیش</span></td>
                        <td className="p-5"><Link href={`/debts/${d.id}`} className="inline-flex items-center gap-1.5 bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] text-xs px-4 py-2 rounded-xl transition">صورتحساب <ChevronRight size={16} className="rotate-180" /></Link></td>
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