'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { exportToExcel } from '@/lib/excel'
import { Users, Menu, Plus, Search, Eye, Download, Home } from 'lucide-react'

type Customer = {
  id: number
  fullName: string
  phone: string
  customerType: string
  balanceUsd: string
  balanceAfn: string
  totalProfit: string
  totalLoss: string
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function CustomersPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

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
  }, [])

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/customers', { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setCustomers(data.customers)
    setLoading(false)
  }

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const filtered = customers.filter((c) => c.fullName.includes(search) || c.phone.includes(search))

  const handleExportExcel = () => {
    const dataToExport = filtered.map(c => ({
      'نام مشتری': c.fullName,
      'شماره تلفن': c.phone,
      'نوعیت': c.customerType === 'BUYER' ? 'خریدار' : c.customerType === 'SELLER' ? 'فروشنده' : 'هر دو',
      'مانده حساب ($)': Number(c.balanceUsd),
      'کل سود ($)': Number(c.totalProfit),
      'کل ضرر ($)': Number(c.totalLoss),
    }))
    exportToExcel(dataToExport, `لیست_مشتریان_${new Date().toLocaleDateString('fa-IR')}`, 'مشتریان')
  }

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/customers" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] transition-colors">
                <Home size={14} /> داشبورد
              </Link>

              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><Users size={18} className="text-[var(--accent)]" /><span>مدیریت مشتریان</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleExportExcel} className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
                <Download size={16} /> خروجی اکسل
              </button>
              <Link href="/customers/new" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all duration-300 glow-button shadow-lg">
                <Plus size={16} /> مشتری جدید
              </Link>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="glass-card rounded-3xl p-5 mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"><Search size={18} className="text-[var(--text-muted)]" /></div>
              <input type="text" placeholder="جستجو بر اساس نام یا شماره تلفن..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-11 pl-4 py-3 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
          </div>

          <div className="glass-card rounded-3xl overflow-hidden">
            {loading ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>) : filtered.length === 0 ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ مشتری‌ای یافت نشد</div>) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr><th className="p-5 text-right font-bold">نام مشتری</th><th className="p-5 text-right font-bold">شماره تلفن</th><th className="p-5 text-right font-bold">نوع</th><th className="p-5 text-right font-bold">مانده (دالر)</th><th className="p-5 text-right font-bold">سود</th><th className="p-5 text-right font-bold">ضرر</th><th className="p-5 text-center font-bold">عملیات</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-5 font-bold text-[var(--text-primary)]">{c.fullName}</td>
                        <td className="p-5 text-[var(--text-secondary)]" dir="ltr">{c.phone}</td>
                        <td className="p-5">
                          {c.customerType === 'BUYER' && (<span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] px-3 py-1.5 rounded-lg font-bold">خریدار</span>)}
                          {c.customerType === 'SELLER' && (<span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] px-3 py-1.5 rounded-lg font-bold">فروشنده</span>)}
                          {c.customerType === 'BOTH' && (<span className="bg-green-500/10 text-green-500 border border-green-500/20 text-[10px] px-3 py-1.5 rounded-lg font-bold">هر دو</span>)}
                        </td>
                        <td className={`p-5 font-bold ${Number(c.balanceUsd) > 0 ? 'text-red-500' : 'text-green-500'}`} dir="ltr">${fmt(c.balanceUsd)}</td>
                        <td className="p-5 text-green-500 font-medium" dir="ltr">${fmt(c.totalProfit)}</td>
                        <td className="p-5 text-red-500 font-medium" dir="ltr">${fmt(c.totalLoss)}</td>
                        <td className="p-5 text-center">
                          <Link href={`/customers/${c.id}`} className="inline-flex items-center gap-1.5 bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] text-xs px-4 py-2 rounded-xl transition"><Eye size={16} /> مشاهده</Link>
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