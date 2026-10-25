'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import {
  Phone, MapPin, Trash2, Menu, Wallet, FileText, ArrowRight, BookOpen, Plus, X, Printer, Eye, Home
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
  employee: { fullName: string } | null
  linkedTrade: { id: number } | null
}

type LedgerEntry = {
  id: number
  type: string
  description: string
  debitUsd: string
  creditUsd: string
  goldAmount: string
  silverAmount: string
  date: string
}

type Customer = {
  id: number
  fullName: string
  phone: string
  email: string | null
  address: string | null
  nationalId: string | null
  customerType: string
  balanceUsd: string
  balanceAfn: string
  balanceGoldGram: string
  balanceSilverGram: string
  totalProfit: string
  totalLoss: string
  notes: string | null
  isActive: boolean
  createdAt: string
  transactions: Transaction[]
  ledger: LedgerEntry[]
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

function CustomerDetailContent() {
  const { t, language } = useI18n()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [showWalletForm, setShowWalletForm] = useState(false)
  const [walletForm, setWalletForm] = useState({ actionType: 'DEPOSIT', assetType: 'USD', amount: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('customers')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }
      setUser(authData.user)
      await load()
    }
    init()
  }, [id])

  const load = async () => {
    const res = await fetch(`/api/customers/${id}`, { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setCustomer(data.customer)
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این مشتری و تمام معاملاتش حذف شوند؟')) return
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) window.location.href = '/customers'
    else alert('خطا: ' + data.error)
  }

  const submitWallet = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await fetch(`/api/customers/${id}/account`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(walletForm)
    })
    setWalletForm({ actionType: 'DEPOSIT', assetType: 'USD', amount: '', description: '' })
    setShowWalletForm(false)
    await load()
    setSaving(false)
  }

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>
  if (!customer) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-red-500">مشتری یافت نشد</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  const calcSummary = (metalType: string) => {
    let buyQty = 0, buyTotalUsd = 0, sellQty = 0, sellTotalUsd = 0, profit = 0
    customer.transactions.forEach(tx => {
      if (tx.metal !== metalType) return
      const qty = Number(tx.quantity), amount = Number(tx.totalUsd), pl = Number(tx.profitLoss)
      if (tx.type === 'BUY' || tx.type === 'PRE_BUY') { buyQty += qty; buyTotalUsd += amount }
      else if (tx.type === 'SELL' || tx.type === 'PRE_SELL') { sellQty += qty; sellTotalUsd += amount }
      profit += pl
    })
    return { buyQty, buyTotalUsd, sellQty, sellTotalUsd, profit }
  }

  const goldStats = calcSummary('GOLD')
  const silverStats = calcSummary('SILVER')
  const totalProfit = goldStats.profit + silverStats.profit
  const balance = Number(customer.balanceUsd)
  const goldBalance = Number(customer.balanceGoldGram)
  const silverBalance = Number(customer.balanceSilverGram)

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/customers" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] transition-colors">
                <Home size={14} /> داشبورد
              </Link>
              
              <Link href="/customers" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition font-medium">
                <ArrowRight size={16} /> بازگشت به لیست
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDelete} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors">
                <Trash2 size={16} /> حذف مشتری
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
          
          <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent)]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl bg-[var(--accent-bg)] border border-[var(--accent)] flex items-center justify-center text-[var(--accent)] text-3xl font-bold shadow-sm">
                  {customer.fullName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{customer.fullName}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1" dir="ltr"><Phone size={14}/> {customer.phone}</span>
                    {customer.address && <span className="flex items-center gap-1"><MapPin size={14}/> {customer.address}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 border-t-4 border-t-blue-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Wallet size={20} className="text-blue-500" /> کیف پول / حساب مالی مشتری
              </h2>
              <button onClick={() => setShowWalletForm(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg">
                <Plus size={16} /> واریز / برداشت
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${balance > 0 ? 'bg-red-500/10 border-red-500/20' : balance < 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-[var(--bg-input)] border-[var(--border-base)]'}`}>
                <div className="text-xs text-[var(--text-secondary)] mb-1 font-bold">موجودی دالر ($)</div>
                <div className={`text-2xl font-extrabold ${balance > 0 ? 'text-red-500' : balance < 0 ? 'text-green-500' : 'text-[var(--text-primary)]'}`} dir="ltr">${fmt(Math.abs(balance))}</div>
                <div className={`text-[10px] mt-1 font-bold ${balance > 0 ? 'text-red-500' : balance < 0 ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                  {balance > 0 ? '⚠️ او از من قرض دار است' : balance < 0 ? '✅ او پیش ما پول دارد' : 'تسویه کامل (صفر)'}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${goldBalance > 0 ? 'bg-red-500/10 border-red-500/20' : goldBalance < 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-[var(--bg-input)] border-[var(--border-base)]'}`}>
                <div className="text-xs text-[var(--text-secondary)] mb-1 font-bold">موجودی طلا (توله)</div>
                <div className={`text-2xl font-extrabold ${goldBalance > 0 ? 'text-red-500' : goldBalance < 0 ? 'text-green-500' : 'text-[var(--text-primary)]'}`} dir="ltr">{fmt(Math.abs(goldBalance), 3)}</div>
                <div className={`text-[10px] mt-1 font-bold ${goldBalance > 0 ? 'text-red-500' : goldBalance < 0 ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                  {goldBalance > 0 ? '⚠️ طلا به ما بدهکار است' : goldBalance < 0 ? '✅ طلا پیش ما دارد' : 'تسویه کامل (صفر)'}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${silverBalance > 0 ? 'bg-red-500/10 border-red-500/20' : silverBalance < 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-[var(--bg-input)] border-[var(--border-base)]'}`}>
                <div className="text-xs text-[var(--text-secondary)] mb-1 font-bold">موجودی نقره (گرام)</div>
                <div className={`text-2xl font-extrabold ${silverBalance > 0 ? 'text-red-500' : silverBalance < 0 ? 'text-green-500' : 'text-[var(--text-primary)]'}`} dir="ltr">{fmt(Math.abs(silverBalance), 3)}</div>
                <div className={`text-[10px] mt-1 font-bold ${silverBalance > 0 ? 'text-red-500' : silverBalance < 0 ? 'text-green-500' : 'text-[var(--text-muted)]'}`}>
                  {silverBalance > 0 ? '⚠️ نقره به ما بدهکار است' : silverBalance < 0 ? '✅ نقره پیش ما دارد' : 'تسویه کامل (صفر)'}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border-base)] bg-[var(--bg-surface-solid)]">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><FileText size={18} className="text-[var(--accent)]" /> خلاصه معاملات</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-input)] border-b border-[var(--border-base)]">
                    <th className="p-4 text-right font-bold text-[var(--text-secondary)] border-l border-[var(--border-base)]">نوعیت فلز</th>
                    <th className="p-4 text-center font-bold text-green-500 border-l border-[var(--border-base)]" colSpan={2}>خریداری شده</th>
                    <th className="p-4 text-center font-bold text-red-500 border-l border-[var(--border-base)]" colSpan={2}>فروش داده شده</th>
                    <th className="p-4 text-center font-bold text-[var(--accent)]">سود / ضرر</th>
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
                  <tr className="border-b border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                    <td className="p-4 text-right font-bold border-l border-[var(--border-base)]">🥇 طلا</td>
                    <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(goldStats.buyQty, 3)}</td>
                    <td className="p-4 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">${fmt(goldStats.buyTotalUsd)}</td>
                    <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(goldStats.sellQty, 3)}</td>
                    <td className="p-4 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">${fmt(goldStats.sellTotalUsd)}</td>
                    <td className={`p-4 font-bold ${goldStats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">{goldStats.profit >= 0 ? '+' : ''}${fmt(goldStats.profit)}</td>
                  </tr>
                  <tr className="border-b border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                    <td className="p-4 text-right font-bold border-l border-[var(--border-base)]">🥈 نقره</td>
                    <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(silverStats.buyQty, 3)}</td>
                    <td className="p-4 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">${fmt(silverStats.buyTotalUsd)}</td>
                    <td className="p-4 border-l border-[var(--border-base)]" dir="ltr">{fmt(silverStats.sellQty, 3)}</td>
                    <td className="p-4 border-l border-[var(--border-base)] text-[var(--text-secondary)]" dir="ltr">${fmt(silverStats.sellTotalUsd)}</td>
                    <td className={`p-4 font-bold ${silverStats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">{silverStats.profit >= 0 ? '+' : ''}${fmt(silverStats.profit)}</td>
                  </tr>
                  <tr className="bg-[var(--accent-bg)]">
                    <td className="p-4 text-right font-bold border-l border-[var(--border-base)] text-[var(--accent)]">مجموع کل</td>
                    <td className="p-4 border-l border-[var(--border-base)]" colSpan={2}></td>
                    <td className="p-4 border-l border-[var(--border-base)]" colSpan={2}></td>
                    <td className={`p-4 font-extrabold text-lg ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`} dir="ltr">{totalProfit >= 0 ? '+' : ''}${fmt(totalProfit)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-5 border-b border-[var(--border-base)] flex items-center justify-between bg-[var(--bg-surface-solid)]">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><FileText size={18} className="text-[var(--accent)]" /> فاکتورهای این مشتری</h2>
              <span className="text-xs bg-[var(--bg-input)] px-3 py-1 rounded-lg text-[var(--text-muted)]">{customer.transactions.length} فاکتور</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                  <tr>
                    <th className="p-4 text-right font-bold">شماره فاکتور</th>
                    <th className="p-4 text-right font-bold">تاریخ</th>
                    <th className="p-4 text-right font-bold">نوع</th>
                    <th className="p-4 text-right font-bold">مقدار</th>
                    <th className="p-4 text-right font-bold">مبلغ کل ($)</th>
                    <th className="p-4 text-center font-bold">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.transactions.map((tx) => (
                    <tr key={tx.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                      <td className="p-4 font-bold font-mono text-xs" dir="ltr">{tx.invoiceNumber}</td>
                      <td className="p-4 text-xs text-[var(--text-secondary)]" dir="ltr">{new Date(tx.transactionDate).toLocaleDateString('fa-IR')}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${tx.type === 'BUY' || tx.type === 'PRE_BUY' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {tx.type === 'BUY' || tx.type === 'PRE_BUY' ? 'خرید' : 'فروش'}
                        </span>
                      </td>
                      <td className="p-4 text-xs" dir="ltr">{fmt(tx.quantity, 3)} {tx.unit === 'TOLA' ? 'توله' : 'گرام'}</td>
                      <td className="p-4 font-bold" dir="ltr">${fmt(tx.totalUsd)}</td>
                      <td className="p-4 flex items-center justify-center gap-2">
                        <Link href={`/transactions/${tx.id}`} title="مشاهده" className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors"><Eye size={16}/></Link>
                        <Link href={`/transactions/${tx.id}/invoice`} target="_blank" title="چاپ" className="p-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 rounded-lg transition-colors"><Printer size={16}/></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden border-t-4 border-t-blue-500">
            <div className="p-5 border-b border-[var(--border-base)] flex items-center justify-between bg-[var(--bg-surface-solid)]">
              <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><BookOpen size={18} className="text-blue-500" /> تاریخچه حساب (کیف پول)</h2>
              <span className="text-xs bg-[var(--bg-input)] px-3 py-1 rounded-lg text-[var(--text-muted)]">{customer.ledger?.length || 0} تراکنش</span>
            </div>
            {!customer.ledger || customer.ledger.length === 0 ? (
              <div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ تراکنشی در دفتر معین ثبت نشده است</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-input)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr>
                      <th className="p-4 text-right font-bold">تاریخ</th>
                      <th className="p-4 text-right font-bold">شرح فعالیت</th>
                      <th className="p-4 text-center font-bold text-red-500">بدهی ($)</th>
                      <th className="p-4 text-center font-bold text-green-500">طلب ($)</th>
                      <th className="p-4 text-center font-bold text-yellow-500">طلا</th>
                      <th className="p-4 text-center font-bold text-slate-400">نقره</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.ledger.map((entry) => (
                      <tr key={entry.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-4 text-xs text-[var(--text-secondary)]" dir="ltr">{new Date(entry.date).toLocaleDateString('fa-IR')}</td>
                        <td className="p-4 text-xs font-medium">{entry.description}</td>
                        <td className="p-4 text-center text-xs font-bold text-red-500" dir="ltr">{Number(entry.debitUsd) > 0 ? `$${fmt(entry.debitUsd)}` : '-'}</td>
                        <td className="p-4 text-center text-xs font-bold text-green-500" dir="ltr">{Number(entry.creditUsd) > 0 ? `$${fmt(entry.creditUsd)}` : '-'}</td>
                        <td className="p-4 text-center text-xs font-bold text-yellow-500" dir="ltr">{Number(entry.goldAmount) !== 0 ? `${fmt(entry.goldAmount, 3)}` : '-'}</td>
                        <td className="p-4 text-center text-xs font-bold text-slate-400" dir="ltr">{Number(entry.silverAmount) !== 0 ? `${fmt(entry.silverAmount, 3)}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>

      {showWalletForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card border border-[var(--border-base)] rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Wallet size={22} className="text-blue-500"/> واریز / برداشت</h2>
              <button onClick={() => setShowWalletForm(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-lg"><X size={20} /></button>
            </div>
            
            <form onSubmit={submitWallet} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">عملیات</label>
                  <select value={walletForm.actionType} onChange={e => setWalletForm({...walletForm, actionType: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="DEPOSIT">⬇️ واریز (مشتری می‌دهد)</option>
                    <option value="WITHDRAW">⬆️ برداشت (مشتری می‌گیرد)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوعیت</label>
                  <select value={walletForm.assetType} onChange={e => setWalletForm({...walletForm, assetType: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]">
                    <option value="USD">💵 دالر</option>
                    <option value="GOLD">🥇 طلا (توله)</option>
                    <option value="SILVER">🥈 نقره (گرام)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">مقدار</label>
                <input type="number" step="0.001" value={walletForm.amount} onChange={e => setWalletForm({...walletForm, amount: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-[var(--accent)]" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">توضیحات (اختیاری)</label>
                <input type="text" value={walletForm.description} onChange={e => setWalletForm({...walletForm, description: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" />
              </div>

              <button type="submit" disabled={saving} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3.5 rounded-xl font-bold glow-button transition-all disabled:opacity-50">
                {saving ? 'در حال ثبت...' : '💾 ثبت تراکنش'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CustomerDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>}>
      <CustomerDetailContent />
    </Suspense>
  )
}