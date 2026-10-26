'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { Search, Menu, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, AlertCircle, FileSpreadsheet } from 'lucide-react'

export default function ReportsPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<any>(null)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const [isMounted, setIsMounted] = useState(false)
  
  // 👇 مقدار اولیه رشته خالی است تا در زمان بیلد ارور ندهد 👇
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => {
    setIsMounted(true)
    
    // 👇 تاریخ را فقط در مرورگر تنظیم میکنیم 👇
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    setFrom(firstDay.toISOString().split('T')[0])
    setTo(today.toISOString().split('T')[0])

    const init = async () => {
      try {
        const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
        const authData = await authRes.json()
        if (!authData.success) return window.location.href = '/login'
        setUser(authData.user)
      } catch (err) {
        setError('خطا در احراز هویت')
        setLoading(false)
      }
    }
    init()
  }, [])

  // وقتی تاریخ‌ها ست شدند (بعد از باز شدن صفحه)، گزارش را لود میکنیم
  useEffect(() => {
    if (from && to) {
      load()
    }
  }, [from, to])

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/reports?from=${from}&to=${to}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`)
      const d = await res.json()
      if (d.success) setData(d)
      else setError(d.error || 'خطای ناشناخته در دریافت داده‌ها')
    } catch (err: any) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number, digits = 2) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  const typeLabel = (t: string) => {
    if (t === 'BUY') return '🛒 خرید'
    if (t === 'SELL') return '💰 فروش'
    if (t === 'PRE_BUY') return '📥 پیش‌خرید'
    if (t === 'PRE_SELL') return '📤 پیش‌فروش'
    return t
  }

  if (!isMounted) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/reports" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium">
                <BarChart3 size={18} className="text-[var(--accent)]" />
                <span>گزارشات تحلیلی</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="glass-card rounded-3xl p-5 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">از تاریخ</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">تا تاریخ</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>
              <div className="md:col-span-2">
                <button onClick={load} disabled={loading} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all glow-button shadow-lg disabled:opacity-50">
                  <Search size={18} /> {loading ? 'در حال محاسبه...' : 'نمایش گزارش'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl mb-6 flex flex-col items-center justify-center text-center shadow-lg">
              <AlertCircle size={40} className="mb-3" />
              <p className="font-bold text-lg mb-1">مشکلی پیش آمد</p>
              <p className="text-sm opacity-90">{error}</p>
            </div>
          )}

          {loading && !error ? (
            <div className="p-10 text-center text-[var(--text-muted)] text-sm flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
              در حال محاسبه گزارش...
            </div>
          ) : data ? (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-6 shadow-sm">
                  <div className="text-sm text-green-500 mb-2 flex items-center gap-2 font-bold"><ArrowUpRight size={18}/> کل سود (سهم دکان)</div>
                  <div className="text-3xl font-bold" dir="ltr">${fmt(data.summary.totalProfit)}</div>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 shadow-sm">
                  <div className="text-sm text-red-500 mb-2 flex items-center gap-2 font-bold"><ArrowDownRight size={18}/> کل ضرر (سهم دکان)</div>
                  <div className="text-3xl font-bold" dir="ltr">${fmt(Math.abs(data.summary.totalLoss))}</div>
                </div>
                <div className={`bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 shadow-sm ${data.summary.netProfit < 0 ? '!bg-orange-500/10 !border-orange-500/20' : ''}`}>
                  <div className={`text-sm mb-2 flex items-center gap-2 font-bold ${data.summary.netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'}`}><PieChart size={18}/> سود خالص دکان</div>
                  <div className="text-3xl font-bold" dir="ltr">${fmt(data.summary.netProfit)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card rounded-3xl p-5 border-t-4 border-t-blue-500">
                  <div className="text-xs text-[var(--text-secondary)] font-bold mb-1">تعداد معاملات</div>
                  <div className="text-2xl font-bold">{data.summary.transactionCount}</div>
                </div>
                <div className="glass-card rounded-3xl p-5 border-t-4 border-t-red-500">
                  <div className="text-xs text-[var(--text-secondary)] font-bold mb-1">کل فروش ($)</div>
                  <div className="text-2xl font-bold text-red-500" dir="ltr">${fmt(data.summary.totalSellUsd)}</div>
                </div>
                <div className="glass-card rounded-3xl p-5 border-t-4 border-t-green-500">
                  <div className="text-xs text-[var(--text-secondary)] font-bold mb-1">کل خرید ($)</div>
                  <div className="text-2xl font-bold text-green-500" dir="ltr">${fmt(data.summary.totalBuyUsd)}</div>
                </div>
                <div className="glass-card rounded-3xl p-5 border-t-4 border-t-yellow-500">
                  <div className="text-xs text-[var(--text-secondary)] font-bold mb-1">کل کارمزد ($)</div>
                  <div className="text-2xl font-bold text-yellow-500" dir="ltr">${fmt(data.summary.totalCommission)}</div>
                </div>
              </div>

              <div className="glass-card rounded-3xl overflow-hidden mt-6">
                <div className="p-5 border-b border-[var(--border-base)] bg-[var(--bg-surface-solid)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet size={20} className="text-[var(--accent)]" />
                    <h3 className="font-bold text-lg">۵۰ معامله آخر</h3>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-[var(--bg-input)] text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                      <tr>
                        <th className="p-4 font-bold">تاریخ / فاکتور</th>
                        <th className="p-4 font-bold">نوع</th>
                        <th className="p-4 font-bold">مشتری</th>
                        <th className="p-4 font-bold">جمع کل ($)</th>
                        <th className="p-4 font-bold">سود/ضرر ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-base)]">
                      {data.transactions?.map((tx: any) => (
                        <tr key={tx.id} className="hover:bg-[var(--bg-surface-hover)] transition">
                          <td className="p-4">
                            <div className="font-bold">{new Date(tx.date).toLocaleDateString('fa-IR')}</div>
                            <div className="text-[10px] text-[var(--text-muted)] font-mono">{tx.invoiceNumber}</div>
                          </td>
                          <td className="p-4 font-bold">{typeLabel(tx.type)}</td>
                          <td className="p-4">{tx.customerName}</td>
                          <td className="p-4 font-bold text-[var(--accent)]" dir="ltr">${fmt(tx.totalUsd)}</td>
                          <td className={`p-4 font-bold ${tx.profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                            {tx.profitLoss >= 0 ? '+' : ''}{fmt(tx.profitLoss)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}