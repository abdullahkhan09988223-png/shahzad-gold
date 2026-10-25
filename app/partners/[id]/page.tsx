'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import {
  ArrowRight, Handshake, Menu, FileText, ShieldCheck, TrendingUp, Wallet
} from 'lucide-react'

type Transaction = {
  id: number
  invoiceNumber: string
  date: string
  type: string
  metal: string
  quantity: string
  unit: string
  totalUsd: string
  sharePercentage: string
  profitLossShare: string
}

type PartnerData = { id: number; fullName: string; phone: string; notes: string | null }
type Stats = { totalBuyUsd: number; totalSellUsd: number; totalProfit: number; totalLoss: number }
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function PartnerDetailPage() {
  const { t, language } = useI18n()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [partner, setPartner] = useState<PartnerData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('partners')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      setUser(authData.user)

      try {
        const res = await fetch(`/api/partners/${id}`, { cache: 'no-store' })
        const data = await res.json()
        if (data.success) {
          setPartner(data.partner)
          setTransactions(data.transactions)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  const fmt = (n: number | string, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const unitLabel = (u: string) => u === 'TOLA' ? 'توله' : u === 'KG' ? 'کیلو' : u === 'GRAM' ? 'گرام' : 'ماشا'

  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>
  if (!partner) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-red-500">شریک یافت نشد</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  // 👇 محاسبات اکسل‌مانند برای شریک (جدا کردن طلا و نقره) 👇
  const calcPartnerStats = (metalType: string) => {
    let buyQty = 0
    let buyTotalUsd = 0
    let sellQty = 0
    let sellTotalUsd = 0
    let totalProfitLoss = 0

    transactions.forEach(tx => {
      if (tx.metal !== metalType) return

      const qty = Number(tx.quantity)
      const amountUsd = Number(tx.totalUsd) * (Number(tx.sharePercentage) / 100) // محاسبه بر اساس سهم شریک
      const profitShare = Number(tx.profitLossShare)

      if (tx.type === 'BUY' || tx.type === 'PRE_BUY') {
        buyQty += qty
        buyTotalUsd += amountUsd
      } else if (tx.type === 'SELL' || tx.type === 'PRE_SELL') {
        sellQty += qty
        sellTotalUsd += amountUsd
      }
      totalProfitLoss += profitShare
    })

    return { buyQty, buyTotalUsd, sellQty, sellTotalUsd, totalProfitLoss }
  }

  const goldStats = calcPartnerStats('GOLD')
  const silverStats = calcPartnerStats('SILVER')
  const totalPL = goldStats.totalProfitLoss + silverStats.totalProfitLoss

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      
      <Sidebar 
        user={user} 
        activePath="/partners" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <Link href="/partners" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition font-medium">
                <ArrowRight size={16} /> بازگشت به لیست شرکا
              </Link>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
          
          {/* پروفایل شریک */}
          <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="flex items-center gap-5 w-full relative z-10">
              <div className="w-20 h-20 rounded-full bg-[var(--bg-input)] border-2 border-purple-500 flex items-center justify-center text-purple-500 shadow-sm shrink-0">
                <Handshake size={40} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{partner.fullName}</h1>
                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                  <span dir="ltr" className="flex items-center gap-1"><ShieldCheck size={14} /> {partner.phone || 'بدون شماره'}</span>
                  {partner.notes && <span className="opacity-70 text-xs">یادداشت: {partner.notes}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* 👇 جدول اکسل‌مانند (خلاصه معاملات شریک) 👇 */}
          <div className="glass-card rounded-3xl overflow-hidden border-t-4 border-t-purple-500">
            <div className="p-5 border-b border-[var(--border-base)] bg-[var(--bg-surface-solid)]">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileText size={18} className="text-purple-500" />
                خلاصه معاملات شریک (محاسبه بر اساس سهم)
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-input)] border-b border-[var(--border-base)]">
                    <th className="p-4 text-right font-bold text-[var(--text-secondary)] border-l border-[var(--border-base)]">نوعیت فلز</th>
                    <th className="p-4 text-center font-bold text-green-500 border-l border-[var(--border-base)]" colSpan={2}>خریداری شده (سهم شریک)</th>
                    <th className="p-4 text-center font-bold text-red-500 border-l border-[var(--border-base)]" colSpan={2}>فروش داده شده (سهم شریک)</th>
                    <th className="p-4 text-center font-bold text-purple-500">سود / ضرر شریک</th>
                  </tr>
                  <tr className="bg-[var(--bg-surface-solid)] border-b border-[var(--border-base)] text-[10px]">
                    <th className="border-l border-[var(--border-base)]"></th>
                    <th className="p-2 text-center text-[var(--text-secondary)] border-l border-[var(--border-base)]">مقدار</th>
                    <th className="p-2 text-center text-[var(--text-secondary)] border-l border-[var(--border-base)]">مبلغ ($)</th>
                    <th className="p-2 text-center text-[var(--text-secondary)] border-l border-[var(--border-base)]">مقدار</th>
                    <th className="p-2 text-center text-[var(--text-secondary)] border-l border-[var(--border-base)]">مبلغ ($)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {/* ردیف طلا */}
                  <tr className="border-b border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                    <td className="p-4 text-right font-bold border-l border-[var(--border-base)]">🥇 طلا</td>
                    <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(goldStats.buyQty, 3)}</td>
                    <td className="p-4 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">${fmt(goldStats.buyTotalUsd)}</td>
                    <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(goldStats.sellQty, 3)}</td>
                    <td className="p-4 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">${fmt(goldStats.sellTotalUsd)}</td>
                    <td className={`p-4 font-bold ${goldStats.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                      {goldStats.totalProfitLoss >= 0 ? '+' : ''}${fmt(goldStats.totalProfitLoss)}
                    </td>
                  </tr>
                  {/* ردیف نقره */}
                  <tr className="border-b border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                    <td className="p-4 text-right font-bold border-l border-[var(--border-base)]">🥈 نقره</td>
                    <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(silverStats.buyQty, 3)}</td>
                    <td className="p-4 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">${fmt(silverStats.buyTotalUsd)}</td>
                    <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(silverStats.sellQty, 3)}</td>
                    <td className="p-4 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">${fmt(silverStats.sellTotalUsd)}</td>
                    <td className={`p-4 font-bold ${silverStats.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                      {silverStats.totalProfitLoss >= 0 ? '+' : ''}${fmt(silverStats.totalProfitLoss)}
                    </td>
                  </tr>
                  {/* ردیف مجموع */}
                  <tr className="bg-purple-500/10 hover:bg-purple-500/20 transition-colors">
                    <td className="p-4 text-right font-bold border-l border-[var(--border-base)] text-purple-500">مجموع کل شریک</td>
                    <td className="p-4 border-l border-[var(--border-base)]" colSpan={2}></td>
                    <td className="p-4 border-l border-[var(--border-base)]" colSpan={2}></td>
                    <td className={`p-4 font-extrabold text-lg ${totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                      {totalPL >= 0 ? '+' : ''}${fmt(totalPL)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-3 text-xs text-[var(--text-muted)] text-center bg-[var(--bg-surface-solid)] border-t border-[var(--border-base)]">
              * توجه: این محاسبات فقط مربوط به سهم این شریک است و در عواید عمومی دکان لحاظ نشده است.
            </div>
          </div>

          {/* جدول تاریخچه تمام معاملات شریک */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border-base)] flex items-center justify-between">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <TrendingUp size={18} className="text-[var(--accent)]" />
                تاریخچه معاملات مستقل این شریک ({transactions.length})
              </h2>
            </div>

            {transactions.length === 0 ? (
              <div className="p-10 text-center text-[var(--text-muted)] text-sm flex flex-col items-center gap-3">
                <Handshake size={40} className="text-[var(--border-base)]" />
                این شریک تاکنون در هیچ معامله‌ای سهیم نبوده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr>
                      <th className="p-4 text-right font-bold">فاکتور / تاریخ</th>
                      <th className="p-4 text-right font-bold">نوعیت</th>
                      <th className="p-4 text-right font-bold">فلز / مقدار</th>
                      <th className="p-4 text-right font-bold">مبلغ کل ($)</th>
                      <th className="p-4 text-right font-bold">فیصدی سهم</th>
                      <th className="p-4 text-right font-bold">مبلغ سهم ($)</th>
                      <th className="p-4 text-right font-bold">سود / ضرر ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-[var(--text-primary)]">{tx.invoiceNumber}</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-1" dir="ltr">{new Date(tx.date).toLocaleDateString('fa-IR')}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${tx.type === 'BUY' ? 'bg-green-500/10 text-green-500 border-green-500/20' : tx.type === 'SELL' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                            {tx.type === 'BUY' ? 'خرید' : tx.type === 'SELL' ? 'فروش' : tx.type === 'PRE_BUY' ? 'پیش‌خرید' : 'پیش‌فروش'}
                          </span>
                        </td>
                        <td className="p-4 font-medium">
                          {tx.metal === 'GOLD' ? '🥇 طلا' : '🥈 نقره'} 
                          <span className="text-xs text-[var(--text-muted)] ml-1 mr-1">({fmt(tx.quantity, 3)} {unitLabel(tx.unit)})</span>
                        </td>
                        <td className="p-4 font-bold" dir="ltr">${fmt(tx.totalUsd)}</td>
                        <td className="p-4 text-purple-500 font-bold" dir="ltr">{Number(tx.sharePercentage)}%</td>
                        <td className="p-4 font-bold text-[var(--text-primary)]" dir="ltr">
                          ${(Number(tx.totalUsd) * (Number(tx.sharePercentage) / 100)).toFixed(2)}
                        </td>
                        <td className="p-4 font-bold" dir="ltr">
                          <span className={Number(tx.profitLossShare) >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {Number(tx.profitLossShare) >= 0 ? '+' : ''}${Number(tx.profitLossShare).toFixed(2)}
                          </span>
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