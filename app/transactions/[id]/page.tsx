'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import {
  ArrowLeftRight, FileText, Menu, Link as LinkIcon, Handshake, Trash2, AlertTriangle, Home
} from 'lucide-react'

const WhatsAppIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" />
    <path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
  </svg>
)

type TransactionPartner = {
  id: number
  sharePercentage: string
  profitLossShare: string
  partner: { fullName: string }
}

type Transaction = {
  id: number
  invoiceNumber: string
  type: string
  metal: string
  unit: string
  quantity: string
  pricePerUnitUsd: string
  usdRate: string
  totalUsd: string
  totalAfn: string
  commission: string
  paidUsd: string
  paidAfn: string
  remainingUsd: string
  remainingAfn: string
  profitLoss: string
  paymentMethod: string
  paymentStatus: string
  status: string
  transactionDate: string
  notes: string | null
  customer: { id: number; fullName: string; phone: string }
  employee: { id: number; fullName: string } | null
  linkedTrade: { id: number } | null
  partners: TransactionPartner[]
  payments: {
    id: number
    amount: string
    currency: string
    method: string
    paymentDate: string
    referenceNo: string | null
    notes: string | null
  }[]
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

function TransactionDetailContent() {
  const { t, language } = useI18n()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [tx, setTx] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
  }, [id])

  const load = async () => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setTx(data.transaction)
      else setError(data.error)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('⚠️ هشدار جدی!\n\nآیا مطمئن هستید که می‌خواهید این معامله را کاملاً حذف کنید؟\nبا این کار اثرات مالی آن (بدهی مشتری، پرداخت‌ها) برگشت خورده و فاکتور برای همیشه پاک می‌شود.\n\nاین عمل غیرقابل بازگشت است!')) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        window.location.href = '/transactions'
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert(String(err))
    } finally {
      setDeleting(false)
    }
  }

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  const handleWhatsApp = () => {
    if (!tx) return
    let phone = tx.customer.phone.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = phone.substring(1)
    if (!phone.startsWith('93')) phone = '93' + phone

    const typeStr = tx.type === 'BUY' || tx.type === 'PRE_BUY' ? 'خرید' : 'فروش'
    const metalStr = tx.metal === 'GOLD' ? 'طلا' : 'نقره'
    const unitStr = tx.unit === 'TOLA' ? 'توله' : tx.unit === 'GRAM' ? 'گرام' : tx.unit === 'MASHA' ? 'ماشا' : 'کیلو'
    
    const text = `*🏢 SHAHZAD GOLD* 🏢\n` +
      `_Trust in every trade_\n\n` +
      `سلام ${tx.customer.fullName} عزیز،\n` +
      `فاکتور ${typeStr} شما به شرح زیر صادر گردید:\n\n` +
      `🔖 *شماره فاکتور:* ${tx.invoiceNumber}\n` +
      `📅 *تاریخ:* ${new Date(tx.transactionDate).toLocaleDateString('fa-IR')}\n` +
      `⚖️ *نوعیت:* ${metalStr} (${typeStr})\n` +
      `📦 *مقدار:* ${Number(tx.quantity).toFixed(3)} ${unitStr}\n` +
      `💵 *قیمت واحد:* $${fmt(tx.pricePerUnitUsd)}\n` +
      `-----------------------------\n` +
      `💰 *جمع کل:* $${fmt(tx.totalUsd)}\n` +
      `✅ *پرداخت شده:* $${fmt(tx.paidUsd)}\n` +
      `⚠️ *باقی‌مانده:* $${fmt(tx.remainingUsd)}\n` +
      `-----------------------------\n` +
      `با تشکر از معامله شما.\n` +
      `📍 کابل، افغانستان`

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>
  if (error || !tx) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-red-500">معامله یافت نشد</div>

  const remaining = Number(tx.remainingUsd)
  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'
  const isCancelled = tx.status === 'CANCELLED'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/transactions" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20 relative'}>
        
        {isCancelled && (
          <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center opacity-10 overflow-hidden">
            <div className="text-[150px] md:text-[250px] font-extrabold text-red-500 rotate-[-30deg]">باطل</div>
          </div>
        )}

        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] transition-colors">
                <Home size={14} /> داشبورد
              </Link>

              <Link href="/transactions" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition font-medium">
                <ArrowLeftRight size={16} className="rotate-180" /> بازگشت به لیست
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              <button onClick={handleWhatsApp} className="bg-green-500 hover:bg-green-600 text-white border border-green-600 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-green-500/20">
                <WhatsAppIcon size={16} /> ارسال به واتسپ
              </button>

              <button onClick={handleDelete} disabled={deleting} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50">
                <Trash2 size={16} /> {deleting ? 'در حال حذف...' : 'حذف کامل'}
              </button>
              
              <Link href={`/transactions/${tx.id}/invoice`} target="_blank" className="bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm">
                <FileText size={16} /> پرینت فاکتور
              </Link>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-4xl mx-auto relative z-10">
          <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              فاکتور {tx.invoiceNumber}
              {tx.linkedTrade && <span className="text-xs bg-blue-500/10 text-blue-500 px-3 py-1 rounded-lg border border-blue-500/20"><LinkIcon size={12} className="inline mr-1"/> T-{tx.linkedTrade.id}</span>}
            </h1>
            <div className="flex gap-2">
              {isCancelled && (
                <span className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg flex items-center gap-1">
                  <AlertTriangle size={14} /> این معامله باطل شده است
                </span>
              )}
              {!isCancelled && (
                <span className={`text-xs px-3 py-1.5 rounded-lg font-bold border ${
                    tx.paymentStatus === 'PAID' ? 'bg-green-500/10 text-green-500 border-green-500/20' : tx.paymentStatus === 'PARTIAL' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                    {tx.paymentStatus === 'PAID' && 'پرداخت‌شده'}
                    {tx.paymentStatus === 'PARTIAL' && 'پرداخت جزئی'}
                    {tx.paymentStatus === 'UNPAID' && 'پرداخت‌نشده'}
                </span>
              )}
            </div>
          </div>

          <div className={`glass-card rounded-3xl p-6 mb-6 ${isCancelled ? 'opacity-50 grayscale' : ''}`}>
            <h2 className="font-bold text-lg mb-5 flex items-center gap-2"><FileText size={18} className="text-[var(--accent)]" /> اطلاعات معامله</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
              <Info label="نوع" value={tx.type === 'BUY' || tx.type === 'PRE_BUY' ? 'خرید' : 'فروش'} />
              <Info label="فلز" value={tx.metal === 'GOLD' ? 'طلا' : 'نقره'} />
              <Info label="مقدار" value={`${Number(tx.quantity).toFixed(3)} ${tx.unit === 'TOLA' ? 'توله' : tx.unit === 'GRAM' ? 'گرام' : tx.unit === 'MASHA' ? 'ماشا' : 'کیلو'}`} />
              <Info label="قیمت هر واحد" value={`$${fmt(tx.pricePerUnitUsd)}`} />
              <Info label="کارمزد" value={`$${fmt(tx.commission)}`} />
              <Info label="مشتری" value={tx.customer.fullName} link={`/customers/${tx.customer.id}`} />
              <Info label="کارمند" value={tx.employee?.fullName || 'سیستم'} />
              <Info label="تاریخ" value={new Date(tx.transactionDate).toLocaleDateString('fa-IR')} />
            </div>
            {tx.notes && (
              <div className="mt-5 pt-4 border-t border-[var(--border-base)] text-sm">
                <span className="text-[var(--text-secondary)]">یادداشت: </span>
                {tx.notes}
              </div>
            )}
          </div>

          {tx.partners && tx.partners.length > 0 && (
            <div className={`glass-card rounded-3xl p-6 mb-6 border-l-4 border-l-purple-500 ${isCancelled ? 'opacity-50 grayscale' : ''}`}>
              <h2 className="font-bold text-lg mb-5 flex items-center gap-2"><Handshake size={18} className="text-purple-500" /> شرکای این معامله</h2>
              <div className="space-y-3">
                {tx.partners.map((p) => (
                  <div key={p.id} className="flex justify-between items-center bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-base)]">
                    <div>
                      <div className="font-bold text-sm text-[var(--text-primary)]">{p.partner.fullName}</div>
                      <div className="text-xs text-[var(--text-secondary)] mt-1">سهم: {Number(p.sharePercentage).toFixed(0)}%</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-sm ${Number(p.profitLossShare) >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                        ${fmt(p.profitLossShare)}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-1">سهم از سود/ضرر</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 ${isCancelled ? 'opacity-50 grayscale' : ''}`}>
            <MoneyCard label="جمع کل" value={`$${fmt(tx.totalUsd)}`} sub={`${fmt(tx.totalAfn)} ؋`} color="blue" />
            <MoneyCard label="پرداخت‌شده" value={`$${fmt(tx.paidUsd)}`} sub={`${fmt(tx.paidAfn)} ؋`} color="green" />
            <MoneyCard label="باقی‌مانده" value={`$${fmt(tx.remainingUsd)}`} sub={`${fmt(tx.remainingAfn)} ؋`} color={remaining > 0 ? 'red' : 'gray'} />
            <MoneyCard label="سود/ضرر" value={`$${fmt(tx.profitLoss)}`} sub={Number(tx.profitLoss) >= 0 ? 'سود' : 'ضرر'} color={Number(tx.profitLoss) >= 0 ? 'green' : 'red'} />
          </div>

          <div className={`glass-card rounded-3xl overflow-hidden ${isCancelled ? 'opacity-50 grayscale' : ''}`}>
            <div className="p-5 border-b border-[var(--border-base)] flex items-center justify-between">
              <h2 className="font-bold text-lg">📜 سابقه پرداخت‌ها</h2>
              <span className="text-sm text-[var(--text-muted)]">{tx.payments.length} پرداخت</span>
            </div>
            {tx.payments.length === 0 ? (
              <div className="p-10 text-center text-[var(--text-muted)] text-sm">هنوز پرداختی ثبت نشده</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr><th className="p-4 text-right font-bold">تاریخ</th><th className="p-4 text-right font-bold">مبلغ</th><th className="p-4 text-right font-bold">روش</th><th className="p-4 text-right font-bold">مرجع</th><th className="p-4 text-right font-bold">یادداشت</th></tr>
                  </thead>
                  <tbody>
                    {tx.payments.map((p) => (
                      <tr key={p.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-4 text-xs text-[var(--text-secondary)]" dir="ltr">{new Date(p.paymentDate).toLocaleDateString('fa-IR')}</td>
                        <td className="p-4 text-xs font-bold text-green-500" dir="ltr">{p.currency === 'USD' ? '$' : ''}{fmt(p.amount)}{p.currency === 'AFN' ? ' ؋' : ''}</td>
                        <td className="p-4 text-xs">{methodLabel(p.method)}</td>
                        <td className="p-4 text-xs text-[var(--text-secondary)]" dir="ltr">{p.referenceNo || '-'}</td>
                        <td className="p-4 text-xs text-[var(--text-secondary)]">{p.notes || '-'}</td>
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

function Info({ label, value, link }: { label: string; value: string; link?: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-secondary)] mb-1">{label}</div>
      {link ? (
        <Link href={link} className="font-bold text-blue-500 hover:underline">{value}</Link>
      ) : (
        <div className="font-bold">{value}</div>
      )}
    </div>
  )
}

function MoneyCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color: 'blue' | 'green' | 'red' | 'gray' }) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-500',
    green: 'bg-green-500/10 border-green-500/20 text-green-500',
    red: 'bg-red-500/10 border-red-500/20 text-red-500',
    gray: 'bg-gray-500/10 border-gray-500/20 text-gray-500',
  }
  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <div className="text-xs font-bold opacity-80 mb-2">{label}</div>
      <div className="text-xl font-extrabold" dir="ltr">{value}</div>
      {sub && <div className="text-[10px] opacity-70 mt-1" dir="ltr">{sub}</div>}
    </div>
  )
}

const methodLabel = (m: string) => {
  if (m === 'CASH') return 'نقد'
  if (m === 'CARD') return 'کارت'
  if (m === 'BANK') return 'بانک'
  if (m === 'CHEQUE') return 'چک'
  if (m === 'CREDIT') return 'اعتباری'
  if (m === 'WALLET') return 'کیف پول'
  return m
}

export default function TransactionDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>}>
      <TransactionDetailContent />
    </Suspense>
  )
}