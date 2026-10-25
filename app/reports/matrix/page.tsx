'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { exportToExcel } from '@/lib/excel'
import { Menu, FileSpreadsheet, Download, Home, RefreshCcw, Search } from 'lucide-react'

type MatrixRow = {
  id: number
  fullName: string
  phone: string
  buyUsd: number
  sellUsd: number
  preBuyUsd: number
  preSellUsd: number
  totalProfit: number
  finalBalanceUsd: number
  goldBalance: number
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function CustomerMatrixPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<MatrixRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      setUser(authData.user)
      await load()
    }
    init()
  }, [])

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/reports/matrix', { cache: 'no-store' })
    const result = await res.json()
    if (result.success) setData(result.data)
    setLoading(false)
  }

  const fmt = (n: number, digits = 2) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  const filteredData = data.filter(d => d.fullName.includes(search) || d.phone.includes(search))

  // محاسبه جمع کل در پایین جدول (مثل اکسل)
  const totals = filteredData.reduce((acc, curr) => ({
    buyUsd: acc.buyUsd + curr.buyUsd,
    sellUsd: acc.sellUsd + curr.sellUsd,
    preBuyUsd: acc.preBuyUsd + curr.preBuyUsd,
    preSellUsd: acc.preSellUsd + curr.preSellUsd,
    totalProfit: acc.totalProfit + curr.totalProfit,
    finalBalanceUsd: acc.finalBalanceUsd + curr.finalBalanceUsd,
    goldBalance: acc.goldBalance + curr.goldBalance,
  }), {
    buyUsd: 0, sellUsd: 0, preBuyUsd: 0, preSellUsd: 0, totalProfit: 0, finalBalanceUsd: 0, goldBalance: 0
  })

  const handleExportExcel = () => {
    const dataToExport = filteredData.map(d => ({
      'نام مشتری': d.fullName,
      'شماره تماس': d.phone,
      'کل خرید ($)': d.buyUsd,
      'کل فروش ($)': d.sellUsd,
      'پیش‌خرید ($)': d.preBuyUsd,
      'پیش‌فروش ($)': d.preSellUsd,
      'سود/ضرر حاصله ($)': d.totalProfit,
      'مانده دالر ($)': d.finalBalanceUsd,
      'مانده طلا (گرام)': d.goldBalance,
    }))
    exportToExcel(dataToExport, `دفتر_کل_مشتریان_${new Date().toLocaleDateString('fa-IR')}`, 'Matrix')
  }

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال محاسبه...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/reports/matrix" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <Link href="/reports" className="flex items-center gap-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] transition-colors">
                <Home size={14} /> گزارشات
              </Link>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><FileSpreadsheet size={18} className="text-[var(--accent)]" /><span>دفتر کل جامع مشتریان</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={load} className="bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-input)] border border-[var(--border-base)] px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"><RefreshCcw size={16} /></button>
              <button onClick={handleExportExcel} className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"><Download size={16} /> خروجی اکسل</button>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-[1400px] mx-auto">
          
          <div className="glass-card rounded-3xl p-5 mb-6">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"><Search size={18} className="text-[var(--text-muted)]" /></div>
              <input type="text" placeholder="جستجوی مشتری..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-11 pl-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-center whitespace-nowrap">
                <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                  <tr>
                    <th className="p-4 text-right font-bold border-l border-[var(--border-base)] min-w-[200px]">نام مشتری</th>
                    <th className="p-4 font-bold border-l border-[var(--border-base)] text-green-500">کل خرید ($)</th>
                    <th className="p-4 font-bold border-l border-[var(--border-base)] text-red-500">کل فروش ($)</th>
                    <th className="p-4 font-bold border-l border-[var(--border-base)] text-blue-500">پیش‌خرید ($)</th>
                    <th className="p-4 font-bold border-l border-[var(--border-base)] text-orange-500">پیش‌فروش ($)</th>
                    <th className="p-4 font-bold border-l border-[var(--border-base)] text-purple-500">سود/ضرر دکان ($)</th>
                    <th className="p-4 font-bold border-l border-[var(--border-base)] bg-[var(--accent-bg)] text-[var(--accent)]">مانده دالر ($)</th>
                    <th className="p-4 font-bold text-yellow-500">مانده طلا (گرام)</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">در حال محاسبه...</td></tr>
                  ) : filteredData.length === 0 ? (
                    <tr><td colSpan={8} className="p-10 text-center text-[var(--text-muted)]">هیچ داده‌ای یافت نشد.</td></tr>
                  ) : (
                    filteredData.map((row) => (
                      <tr key={row.id} className="border-b border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-4 text-right border-l border-[var(--border-base)]">
                          <Link href={`/customers/${row.id}`} className="font-bold text-blue-500 hover:underline">{row.fullName}</Link>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5" dir="ltr">{row.phone}</div>
                        </td>
                        <td className="p-4 border-l border-[var(--border-base)] font-bold text-[var(--text-primary)]" dir="ltr">{fmt(row.buyUsd)}</td>
                        <td className="p-4 border-l border-[var(--border-base)] font-bold text-[var(--text-primary)]" dir="ltr">{fmt(row.sellUsd)}</td>
                        <td className="p-4 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">{fmt(row.preBuyUsd)}</td>
                        <td className="p-4 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">{fmt(row.preSellUsd)}</td>
                        <td className={`p-4 border-l border-[var(--border-base)] font-bold ${row.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                          {row.totalProfit >= 0 ? '+' : ''}{fmt(row.totalProfit)}
                        </td>
                        <td className={`p-4 border-l border-[var(--border-base)] font-extrabold bg-[var(--accent-bg)] ${row.finalBalanceUsd > 0 ? 'text-red-500' : row.finalBalanceUsd < 0 ? 'text-green-500' : 'text-[var(--text-primary)]'}`} dir="ltr">
                          {fmt(row.finalBalanceUsd)}
                          <div className="text-[9px] font-normal mt-1 opacity-70">
                            {row.finalBalanceUsd > 0 ? 'بدهکار' : row.finalBalanceUsd < 0 ? 'طلبکار' : 'تسویه'}
                          </div>
                        </td>
                        <td className={`p-4 font-extrabold ${row.goldBalance > 0 ? 'text-red-500' : row.goldBalance < 0 ? 'text-green-500' : 'text-[var(--text-primary)]'}`} dir="ltr">
                          {fmt(row.goldBalance, 3)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {/* 👇 ردیف جمع کل (مثل اکسل) 👇 */}
                {!loading && filteredData.length > 0 && (
                  <tfoot className="bg-[var(--bg-surface-solid)] border-t-2 border-[var(--border-base)]">
                    <tr className="font-extrabold text-[var(--text-primary)]">
                      <td className="p-4 text-right border-l border-[var(--border-base)] text-lg text-[var(--accent)]">مجموع کل</td>
                      <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(totals.buyUsd)}</td>
                      <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(totals.sellUsd)}</td>
                      <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(totals.preBuyUsd)}</td>
                      <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(totals.preSellUsd)}</td>
                      <td className={`p-4 border-l border-[var(--border-base)] ${totals.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                        {totals.totalProfit >= 0 ? '+' : ''}{fmt(totals.totalProfit)}
                      </td>
                      <td className={`p-4 border-l border-[var(--border-base)] bg-[var(--accent-bg)] text-lg ${totals.finalBalanceUsd > 0 ? 'text-red-500' : totals.finalBalanceUsd < 0 ? 'text-green-500' : ''}`} dir="ltr">
                        {fmt(totals.finalBalanceUsd)}
                      </td>
                      <td className={`p-4 ${totals.goldBalance > 0 ? 'text-red-500' : totals.goldBalance < 0 ? 'text-green-500' : ''}`} dir="ltr">
                        {fmt(totals.goldBalance, 3)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-[var(--text-secondary)] text-center bg-[var(--bg-input)] p-3 rounded-xl border border-[var(--border-base)]">
            💡 راهنما: در ستون «مانده دالر»، اگر عدد <span className="text-red-500 font-bold">قرمز (مثبت)</span> باشد یعنی مشتری به شما بدهکار است. اگر <span className="text-green-500 font-bold">سبز (منفی)</span> باشد یعنی مشتری پیش شما پول دارد.
          </div>

        </main>
      </div>
    </div>
  )
}