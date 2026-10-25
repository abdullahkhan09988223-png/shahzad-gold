'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import {
  Menu, TrendingUp, DollarSign, Wallet, Users,
  ArrowLeftRight, Zap, Landmark, Plus, ArrowRight
} from 'lucide-react'

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function DashboardPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [todaySales, setTodaySales] = useState(0)
  const [todayProfit, setTodayProfit] = useState(0)
  const [cashUsd, setCashUsd] = useState(0)
  const [cashGold, setCashGold] = useState(0)
  const [goldRate, setGoldRate] = useState(0)
  const [silverRate, setSilverRate] = useState(0)
  const [recentTxs, setRecentTxs] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      setUser(authData.user)

      const today = new Date().toISOString().split('T')[0]

      // 👇 استفاده از allSettled: اگر یکی خراب شد، بقیه را متوقف نکن 👇
      const results = await Promise.allSettled([
        fetch(`/api/reports?from=${today}&to=${today}`, { cache: 'no-store' }),
        fetch('/api/cashbox', { cache: 'no-store' }),
        fetch('/api/live-rates', { cache: 'no-store' }),
        fetch('/api/transactions', { cache: 'no-store' })
      ])

      // پردازش گزارشات
      if (results[0].status === 'fulfilled') {
        const repData = await results[0].value.json()
        if (repData.success) {
          setTodaySales(repData.summary.totalSellUsd + repData.summary.totalBuyUsd)
          setTodayProfit(repData.summary.netProfit)
        }
      }

      // پردازش صندوق
      if (results[1].status === 'fulfilled') {
        const cashData = await results[1].value.json()
        if (cashData.success && cashData.cashBoxes.length > 0) {
          const latestBox = cashData.cashBoxes[0]
          setCashUsd(Number(latestBox.closingUsd))
          setCashGold(Number(latestBox.closingGold))
        }
      }

      // پردازش نرخ‌ها
      if (results[2].status === 'fulfilled') {
        const rateData = await results[2].value.json()
        if (rateData.success) {
          setGoldRate(rateData.gold.current)
          setSilverRate(rateData.silver.current)
        }
      }

      // پردازش معاملات
      if (results[3].status === 'fulfilled') {
        const txData = await results[3].value.json()
        if (txData.success) {
          setRecentTxs(txData.transactions.slice(0, 5))
        }
      }

      setLoading(false) // در هر صورت لودینگ تمام می‌شود
    }
    init()
  }, [])

  const fmt = (n: number, digits = 2) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium">
                <span>خوش آمدید، {user?.employeeName || user?.username} عزیز 👋</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto space-y-6">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/quick-entry" className="bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-all rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-yellow-500 group">
              <Zap size={28} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">ثبت فوق‌سریع</span>
            </Link>
            <Link href="/transactions/new" className="bg-[var(--accent-bg)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-all rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-[var(--accent)] group">
              <Plus size={28} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">معامله جدید</span>
            </Link>
            <Link href="/cashbox" className="bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-blue-500 group">
              <Landmark size={28} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">صندوق روزانه</span>
            </Link>
            <Link href="/customers" className="bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-purple-500 group">
              <Users size={28} className="group-hover:scale-110 transition-transform" />
              <span className="font-bold text-sm">مشتریان</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-3xl p-6 border-t-4 border-t-green-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full blur-xl -mr-5 -mt-5"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-bold text-[var(--text-secondary)]">گردش امروز ($)</div>
                <div className="p-2 bg-green-500/10 rounded-xl text-green-500"><ArrowLeftRight size={18}/></div>
              </div>
              <div className="text-3xl font-extrabold text-green-500 mb-1" dir="ltr">${fmt(todaySales)}</div>
              <div className="text-[10px] text-[var(--text-muted)]">مجموع خرید و فروش امروز</div>
            </div>

            <div className="glass-card rounded-3xl p-6 border-t-4 border-t-blue-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl -mr-5 -mt-5"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-bold text-[var(--text-secondary)]">سود خالص امروز ($)</div>
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500"><TrendingUp size={18}/></div>
              </div>
              <div className={`text-3xl font-extrabold mb-1 ${todayProfit >= 0 ? 'text-blue-500' : 'text-red-500'}`} dir="ltr">
                ${fmt(todayProfit)}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">سود (یا ضرر) ناشی از معاملات</div>
            </div>

            <div className="glass-card rounded-3xl p-6 border-t-4 border-t-yellow-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl -mr-5 -mt-5"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-bold text-[var(--text-secondary)]">موجودی نقدی صندوق ($)</div>
                <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-500"><Wallet size={18}/></div>
              </div>
              <div className="text-3xl font-extrabold text-yellow-500 mb-1" dir="ltr">${fmt(cashUsd)}</div>
              <div className="text-[10px] text-[var(--text-muted)]">آخرین بسته‌شدن صندوق</div>
            </div>

            <div className="glass-card rounded-3xl p-6 border-t-4 border-t-orange-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-xl -mr-5 -mt-5"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="text-sm font-bold text-[var(--text-secondary)]">موجودی طلای صندوق</div>
                <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">🥇</div>
              </div>
              <div className="text-3xl font-extrabold text-orange-500 mb-1" dir="ltr">{fmt(cashGold, 3)}</div>
              <div className="text-[10px] text-[var(--text-muted)]">گرم (عیار استاندارد)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-3xl p-6 lg:col-span-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2"><TrendingUp size={18} className="text-[var(--accent)]"/> بازار جهانی</h3>
                <Link href="/market" className="text-xs text-[var(--accent)] hover:underline">مشاهده چارت</Link>
              </div>
              
              <div className="space-y-4">
                <div className="bg-[var(--bg-input)] p-4 rounded-2xl border border-[var(--border-base)] flex justify-between items-center">
                  <div className="flex items-center gap-2 font-bold text-sm text-yellow-500">🥇 طلا (انس)</div>
                  <div className="text-lg font-extrabold text-[var(--text-primary)]" dir="ltr">${fmt(goldRate)}</div>
                </div>
                <div className="bg-[var(--bg-input)] p-4 rounded-2xl border border-[var(--border-base)] flex justify-between items-center">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-400">🥈 نقره (انس)</div>
                  <div className="text-lg font-extrabold text-[var(--text-primary)]" dir="ltr">${fmt(silverRate)}</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-3xl overflow-hidden lg:col-span-2">
              <div className="p-5 border-b border-[var(--border-base)] bg-[var(--bg-surface-solid)] flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2">آخرین معاملات ثبت شده</h3>
                <Link href="/transactions" className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1">مشاهده همه <ArrowRight size={14}/></Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center">
                  <thead className="bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr>
                      <th className="p-3 text-right font-bold">فاکتور / مشتری</th>
                      <th className="p-3 font-bold">نوعیت</th>
                      <th className="p-3 font-bold">مقدار</th>
                      <th className="p-3 font-bold">جمع ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTxs.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-[var(--text-muted)]">هنوز معامله‌ای ثبت نشده است.</td></tr>
                    ) : (
                      recentTxs.map((tx) => (
                        <tr key={tx.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                          <td className="p-3 text-right">
                            <Link href={`/transactions/${tx.id}`} className="font-bold text-blue-500 hover:underline block">{tx.invoiceNumber}</Link>
                            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{tx.customer.fullName}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${tx.type === 'BUY' || tx.type === 'PRE_BUY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              {tx.type === 'BUY' || tx.type === 'PRE_BUY' ? 'خرید' : 'فروش'}
                            </span>
                          </td>
                          <td className="p-3 text-xs font-bold" dir="ltr">{fmt(Number(tx.quantity), 3)} {tx.unit === 'TOLA' ? 'توله' : 'گرام'}</td>
                          <td className="p-3 font-bold text-[var(--accent)]" dir="ltr">${fmt(Number(tx.totalUsd))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}