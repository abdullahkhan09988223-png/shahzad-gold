'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar' // 👈 ایمپورت سایدبار جدید
import { ShieldAlert, Menu, Search } from 'lucide-react'

type Log = {
  id: number
  action: string
  tableName: string
  createdAt: string
  user: { 
    username: string; 
    role: string; 
    employee: { fullName: string } | null 
  }
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function LogsPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      // 👈 قفل امنیتی: اگر ادمین نبود و به لاگ‌ها دسترسی نداشت، بیرونش کن
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('logs')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      setUser(authData.user)

      const res = await fetch('/api/logs', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setLogs(data.logs)
      
      setLoading(false)
    }
    init()
  }, [])

  const filtered = logs.filter(
    (log) => 
      (log.user.employee?.fullName || log.user.username).includes(search) || 
      log.action.includes(search)
  )

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      
      {/* 👈 استفاده از سایدبار جدید */}
      <Sidebar 
        user={user} 
        activePath="/logs" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      {/* Main Content */}
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* 👈 دکمه منوی موبایل */}
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium">
                <ShieldAlert size={18} className="text-red-500" />
                <span>لاگ فعالیت‌های سیستم (مخصوص مدیر)</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-7xl mx-auto">
          {/* Search */}
          <div className="glass-card rounded-3xl p-4 mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <Search size={18} className="text-[var(--text-muted)]" />
              </div>
              <input
                type="text"
                placeholder="جستجو بر اساس نام کاربر یا نوع فعالیت..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pr-11 pl-4 py-3 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
              />
            </div>
          </div>

          {/* Table */}
          <div className="glass-card rounded-3xl overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ لاگی یافت نشد</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr>
                      <th className="p-4 text-right font-bold">تاریخ و ساعت</th>
                      <th className="p-4 text-right font-bold">کاربر</th>
                      <th className="p-4 text-right font-bold">نقش</th>
                      <th className="p-4 text-right font-bold">فعالیت</th>
                      <th className="p-4 text-right font-bold">بخش</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log) => (
                      <tr key={log.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-4 text-xs text-[var(--text-muted)]" dir="ltr">
                          {new Date(log.createdAt).toLocaleDateString('fa-IR')} - {new Date(log.createdAt).toLocaleTimeString('fa-IR')}
                        </td>
                        <td className="p-4 font-bold text-[var(--text-primary)]">
                          {log.user.employee?.fullName || log.user.username}
                        </td>
                        <td className="p-4 text-xs">
                          {log.user.role === 'ADMIN' ? (
                            <span className="bg-[var(--accent-bg)] text-[var(--accent)] px-3 py-1.5 rounded-lg font-bold">مدیر</span>
                          ) : (
                            <span className="bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-lg font-bold">کارمند</span>
                          )}
                        </td>
                        <td className="p-4 text-xs font-bold text-[var(--accent)]">
                          {log.action === 'CREATE_TRANSACTION' && 'ثبت معامله جدید'}
                          {log.action === 'LOGIN' && 'ورود به سیستم'}
                          {log.action !== 'CREATE_TRANSACTION' && log.action !== 'LOGIN' && log.action}
                        </td>
                        <td className="p-4 text-xs text-[var(--text-secondary)]">
                          {log.tableName}
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