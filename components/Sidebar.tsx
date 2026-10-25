'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import {
  ArrowLeftRight, Users, FileText, Wallet, CreditCard, TrendingUp,
  Coins, DollarSign, Settings, Home, LogOut, UserCog, Activity,
  X, Palette, Handshake, Receipt, ShieldAlert, RefreshCcw, ShieldCheck, HeartHandshake, Banknote, Zap, FileSpreadsheet
} from 'lucide-react'

type UserType = {
  id: number
  username: string
  role: string
  employeeName: string | null
  permissions?: string[]
}

type SidebarProps = {
  user: UserType | null
  activePath: string
  showMobileMenu: boolean
  setShowMobileMenu: (show: boolean) => void
}

export default function Sidebar({ user, activePath, showMobileMenu, setShowMobileMenu }: SidebarProps) {
  const { t, language } = useI18n()

  const logout = async () => {
    if (!confirm(t('logout_confirm'))) return
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  const allMainMenu = [
    { href: '/', key: 'home', label: t('menu_home'), icon: Home },
    { href: '/quick-entry', key: 'quick-entry', label: 'ثبت فوق‌سریع ⚡', icon: Zap },
    { href: '/transactions', key: 'transactions', label: 'خرید و فروش', icon: ArrowLeftRight }, 
    { href: '/transfers', key: 'transfers', label: 'انتقال / تهاتر', icon: RefreshCcw }, 
    { href: '/trades', key: 'trades', label: t('menu_trades'), icon: Activity },
    { href: '/market', key: 'market', label: 'بازار جهانی (انس)', icon: TrendingUp },
    { href: '/customers', key: 'customers', label: t('menu_customers'), icon: Users },
    { href: '/debts', key: 'debts', label: 'قرض‌ها', icon: Coins },
    { href: '/reports', key: 'reports', label: t('menu_reports'), icon: FileText },
    { href: '/reports/matrix', key: 'reports', label: 'دفتر کل جامع (اکسل)', icon: FileSpreadsheet }, // 👈 منوی جدید
  ]

  const allManageMenu = [
    { href: '/ledger', key: 'ledger', label: 'روزنامچه', icon: FileText },
    { href: '/inventory', key: 'inventory', label: t('menu_inventory'), icon: Wallet },
    { href: '/expenses', key: 'expenses', label: 'مصارف و عواید', icon: Receipt }, 
    { href: '/trusts', key: 'trusts', label: 'امانت‌ها و قروض', icon: ShieldCheck },
    { href: '/cashbox', key: 'cashbox', label: t('menu_cashbox'), icon: DollarSign },
    { href: '/salaries', key: 'salaries', label: t('menu_salaries'), icon: Coins },
    { href: '/employees', key: 'employees', label: t('menu_employees'), icon: UserCog },
    { href: '/partners', key: 'partners', label: 'شرکا', icon: Handshake },
    { href: '/partners/transactions', key: 'partner_transactions', label: 'معاملات شرکا', icon: FileText },
    { href: '/users', key: 'users', label: t('menu_users'), icon: Settings },
    { href: '/settings', key: 'settings', label: 'تنظیمات و تم‌ها', icon: Palette },
    { href: '/logs', key: 'logs', label: 'لاگ فعالیت‌ها', icon: ShieldAlert },
  ]

  const hasAccess = (key: string) => {
    if (!user) return false
    if (user.role === 'ADMIN') return true
    return user.permissions?.includes(key) || false
  }

  const mainMenu = allMainMenu.filter(item => hasAccess(item.key))
  const manageMenu = allManageMenu.filter(item => hasAccess(item.key))

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const sideClass = language === 'fa' ? 'right-0' : 'left-0'
  const drawerClass = language === 'fa' ? 'right-0' : 'left-0'

  return (
    <>
      <aside className={sideClass + ' hidden lg:flex w-64 h-screen glass-card border-l border-[var(--border-base)] flex-col fixed inset-y-0 z-40'}>
        <div className="p-6 flex items-center gap-3 border-b border-[var(--border-base)]">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-black shadow-lg border border-[var(--border-base)]">
            <img src="https://i.ibb.co/Z1LnH2NF/be92f52f-1593-4384-86f0-c7ebd960e446.jpg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-widest">SHAHZAD GOLD</div>
            <div className="text-[var(--accent)] text-[10px] uppercase font-bold tracking-wider mt-1">Trust in Every Trade</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          {mainMenu.map((item) => {
            const Icon = item.icon
            const active = activePath === item.href
            return (
              <Link key={item.href} href={item.href} className={'flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-300 ' + (active ? 'bg-[var(--accent-bg)] text-[var(--accent)] border-r-2 border-[var(--accent)] shadow-[var(--accent-glow)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]')}>
                <Icon size={18} className={active ? 'text-[var(--accent)]' : ''} />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            )
          })}
          
          {manageMenu.length > 0 && (
            <div className="text-[var(--text-muted)] text-[10px] font-bold px-4 py-3 mt-4 uppercase tracking-widest border-t border-[var(--border-base)]">{t('menu_management')}</div>
          )}
          
          {manageMenu.map((item) => {
            const Icon = item.icon
            const active = activePath === item.href
            return (
              <Link key={item.href} href={item.href} className={'flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-300 ' + (active ? 'bg-[var(--accent-bg)] text-[var(--accent)] border-r-2 border-[var(--accent)] shadow-[var(--accent-glow)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]')}>
                <Icon size={18} className={active ? 'text-[var(--accent)]' : ''} />
                <span className="text-sm font-semibold">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-[var(--border-base)]">
          <div className="flex items-center gap-3 mb-4 bg-[var(--bg-input)] p-3 rounded-2xl border border-[var(--border-base)]">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]">
              <img src="https://i.ibb.co/Z1LnH2NF/be92f52f-1593-4384-86f0-c7ebd960e446.jpg" alt="User" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[var(--text-primary)] text-xs font-bold truncate">{user?.employeeName || user?.username}</div>
              <div className="text-[var(--accent)] text-[10px] font-medium">{user?.role === 'ADMIN' ? t('admin') : t('employee')}</div>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2.5 rounded-xl text-xs font-bold transition-colors">
            <LogOut size={16} /> {t('logout')}
          </button>
        </div>
      </aside>

      {showMobileMenu && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={() => setShowMobileMenu(false)} />
          <aside className={'lg:hidden fixed inset-y-0 w-72 glass-card z-50 shadow-2xl overflow-y-auto ' + drawerClass}>
            <div className="p-4 border-b border-[var(--border-base)] flex items-center justify-between bg-[var(--bg-surface-solid)]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-black border border-[var(--border-base)]"><img src="https://i.ibb.co/Z1LnH2NF/be92f52f-1593-4384-86f0-c7ebd960e446.jpg" alt="Logo" className="w-full h-full object-cover" /></div>
                <div className="font-bold text-sm">SHAHZAD GOLD</div>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-lg transition"><X size={20} /></button>
            </div>
            <div className="p-3">
              {mainMenu.map((item) => {
                const Icon = item.icon; const active = activePath === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)} className={'flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition ' + (active ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)]')}>
                    <Icon size={18} /><span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
              {manageMenu.length > 0 && (
                <div className="text-[var(--text-muted)] text-[10px] font-bold px-3 py-3 mt-4 uppercase tracking-widest border-t border-[var(--border-base)]">{t('menu_management')}</div>
              )}
              {manageMenu.map((item) => {
                const Icon = item.icon; const active = activePath === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)} className={'flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition ' + (active ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)]')}>
                    <Icon size={18} /><span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </aside>
        </>
      )}
    </>
  )
}