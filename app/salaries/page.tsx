'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar' // 👈 ایمپورت سایدبار جدید
import {
  Search, Menu, Plus, Banknote, DollarSign, Wallet
} from 'lucide-react'

type Salary = {
  id: number
  amount: string
  currency: string
  bonus: string
  deduction: string
  forMonth: string
  paymentDate: string
  employee: { id: number; fullName: string; position: string }
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function SalariesPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [salaries, setSalaries] = useState<Salary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      // 👈 قفل امنیتی: اگر ادمین نبود و به معاشات دسترسی نداشت، بیرونش کن
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('salaries')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      setUser(authData.user)

      const res = await fetch('/api/salaries', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setSalaries(data.salaries)
      setLoading(false)
    }
    init()
  }, [])

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const filtered = salaries.filter((s) => s.employee.fullName.includes(search) || s.forMonth.includes(search))

  const totalUsd = filtered.filter((s) => s.currency === 'USD').reduce((sum, s) => sum + Number(s.amount) + Number(s.bonus) - Number(s.deduction), 0)
  const totalAfn = filtered.filter((s) => s.currency === 'AFN').reduce((sum, s) => sum + Number(s.amount) + Number(s.bonus) - Number(s.deduction), 0)

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      
      {/* 👈 استفاده از سایدبار جدید */}
      <Sidebar 
        user={user} 
        activePath="/salaries" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      {/* Main Content */}
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* 👈 دکمه منوی موبایل */}
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><Banknote size={18} className="text-[var(--accent)]" /><span>مدیریت معاشات کارمندان</span></div>
            </div>
            <Link href="/salaries/new" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all glow-button shadow-lg"><Plus size={16} /> پرداخت معاش جدید</Link>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-card rounded-3xl p-6 flex items-center gap-5 border-t-4 border-t-green-500">
              <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500"><DollarSign size={28} /></div>
              <div><div className="text-sm text-[var(--text-secondary)] mb-1 font-medium">کل پرداختی (دالر)</div><div className="text-3xl font-extrabold text-green-500" dir="ltr">${fmt(totalUsd)}</div></div>
            </div>
            <div className="glass-card rounded-3xl p-6 flex items-center gap-5 border-t-4 border-t-blue-500">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Wallet size={28} /></div>
              <div><div className="text-sm text-[var(--text-secondary)] mb-1 font-medium">کل پرداختی (افغانی)</div><div className="text-3xl font-extrabold text-blue-500" dir="ltr">{fmt(totalAfn, 0)} ؋</div></div>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-5 mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"><Search size={18} className="text-[var(--text-muted)]" /></div>
              <input type="text" placeholder="جستجو بر اساس نام کارمند یا ماه..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-11 pl-4 py-3 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            {loading ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>) : filtered.length === 0 ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ معاشی پرداخت نشده است</div>) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr><th className="p-5 text-right font-bold">کارمند</th><th className="p-5 text-right font-bold">سمت</th><th className="p-5 text-right font-bold">ماه</th><th className="p-5 text-right font-bold">معاش پایه</th><th className="p-5 text-right font-bold">پاداش</th><th className="p-5 text-right font-bold">کسرات</th><th className="p-5 text-right font-bold bg-[var(--accent-bg)] text-[var(--accent)]">خالص پرداختی</th><th className="p-5 text-right font-bold">تاریخ</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => {
                      const net = Number(s.amount) + Number(s.bonus) - Number(s.deduction)
                      const unit = s.currency === 'USD' ? '$' : '؋'
                      return (
                        <tr key={s.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                          <td className="p-5 font-bold text-[var(--text-primary)]">{s.employee.fullName}</td>
                          <td className="p-5 text-xs text-[var(--text-secondary)]">{s.employee.position}</td>
                          <td className="p-5 text-xs font-medium text-[var(--text-secondary)]" dir="ltr">{s.forMonth}</td>
                          <td className="p-5 text-xs text-[var(--text-secondary)]" dir="ltr">{fmt(s.amount)} {unit}</td>
                          <td className="p-5 text-xs text-green-500" dir="ltr">{Number(s.bonus) > 0 ? `+${fmt(s.bonus)}` : '-'}</td>
                          <td className="p-5 text-xs text-red-500" dir="ltr">{Number(s.deduction) > 0 ? `-${fmt(s.deduction)}` : '-'}</td>
                          <td className="p-5 font-bold text-[var(--accent)] bg-[var(--accent-bg)]" dir="ltr">{fmt(net)} {unit}</td>
                          <td className="p-5 text-xs text-[var(--text-muted)]" dir="ltr">{new Date(s.paymentDate).toLocaleDateString('fa-IR')}</td>
                        </tr>
                      )
                    })}
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