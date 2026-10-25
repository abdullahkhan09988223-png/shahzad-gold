'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { Menu, Handshake, FileText, ArrowRight } from 'lucide-react'

type Transaction = {
  id: number
  invoiceNumber: string
  type: string
  metal: string
  quantity: string
  totalUsd: string
  transactionDate: string
  customer: { fullName: string }
  partners: { sharePercentage: string; partner: { fullName: string } }[]
}
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function PartnerTransactionsPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      setUser(authData.user)

      const res = await fetch('/api/partners/transactions', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setTransactions(data.transactions)
      setLoading(false)
    }
    init()
  }, [])

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  if (!isMounted) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>
  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/partners" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><Handshake size={18} className="text-purple-500" /><span>معاملات مستقل شرکا</span></div>
            </div>
            <Link href="/partners" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition font-medium">
              <ArrowRight size={16} /> بازگشت به لیست شرکا
            </Link>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="glass-card rounded-3xl overflow-hidden border-t-4 border-t-purple-500">
            <div className="p-5 border-b border-[var(--border-base)] bg-[var(--bg-surface-solid)]">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileText size={18} className="text-purple-500" />
                لیست تمام معاملات مشترک (خارج از عاید عمومی)
              </h2>
            </div>

            {transactions.length === 0 ? (
              <div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ معامله مشترکی ثبت نشده است</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr>
                      <th className="p-4 text-right font-bold">فاکتور</th>
                      <th className="p-4 text-right font-bold">تاریخ</th>
                      <th className="p-4 text-right font-bold">مشتری</th>
                      <th className="p-4 text-right font-bold">فلز</th>
                      <th className="p-4 text-right font-bold">جمع کل ($)</th>
                      <th className="p-4 text-right font-bold">شرکا (سهم)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-4 text-xs font-bold text-blue-500" dir="ltr">{tx.invoiceNumber}</td>
                        <td className="p-4 text-xs text-[var(--text-secondary)]" dir="ltr">{new Date(tx.transactionDate).toLocaleDateString('fa-IR')}</td>
                        <td className="p-4 font-bold">{tx.customer.fullName}</td>
                        <td className="p-4 text-xs font-medium">{tx.metal === 'GOLD' ? '🥇 طلا' : '🥈 نقره'} ({fmt(tx.quantity, 3)})</td>
                        <td className="p-4 font-bold text-[var(--text-primary)]" dir="ltr">${fmt(tx.totalUsd)}</td>
                        <td className="p-4 text-xs">
                          {tx.partners.map((p, i) => (
                            <span key={i} className="inline-block bg-purple-500/10 text-purple-500 px-2 py-1 rounded mr-1 mb-1 border border-purple-500/20">
                              {p.partner.fullName} ({Number(p.sharePercentage).toFixed(0)}%)
                            </span>
                          ))}
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