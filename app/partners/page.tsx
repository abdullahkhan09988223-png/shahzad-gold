'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import {
  ArrowLeftRight, Users, FileText, Wallet, CreditCard, TrendingUp,
  Coins, DollarSign, Settings, Home, LogOut, UserCog, Activity,
  Menu, X, Handshake, Palette, Plus, Search, Trash2, Phone, Eye
} from 'lucide-react'

type Partner = {
  id: number
  fullName: string
  phone: string | null
  notes: string | null
  createdAt: string
  _count: { transactions: number }
}

type User = { id: number; username: string; role: string; employeeName: string | null }

export default function PartnersPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // استیت‌های مربوط به فرم افزودن شریک
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPartner, setNewPartner] = useState({ fullName: '', phone: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      setUser(authData.user)
      await loadPartners()
    }
    init()
  }, [])

  const loadPartners = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/partners', { cache: 'no-store' })
      const data = await res.json()
      if (data.success) setPartners(data.partners)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner)
      })
      const data = await res.json()
      if (data.success) {
        setShowAddModal(false)
        setNewPartner({ fullName: '', phone: '', notes: '' })
        loadPartners() // رفرش لیست
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`آیا از حذف شریک "${name}" مطمئن هستید؟`)) return
    try {
      const res = await fetch(`/api/partners/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) loadPartners()
      else alert(data.error)
    } catch (err) {
      alert('خطا در حذف شریک')
    }
  }

  const logout = async () => {
    if (!confirm(t('logout_confirm'))) return
    await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/login'
  }

  const filteredPartners = partners.filter(p => p.fullName.includes(search) || (p.phone && p.phone.includes(search)))

  const mainMenu = [
    { href: '/', label: t('menu_home'), icon: Home },
    { href: '/transactions', label: t('menu_transactions'), icon: ArrowLeftRight },
    { href: '/trades', label: t('menu_trades'), icon: Activity },
    { href: '/customers', label: t('menu_customers'), icon: Users },
    { href: '/debts', label: 'قرض‌ها', icon: Coins },
    { href: '/reports', label: t('menu_reports'), icon: FileText },
  ]

  const manageMenu = [
    { href: '/ledger', label: t('menu_ledger'), icon: FileText },
    { href: '/inventory', label: t('menu_inventory'), icon: Wallet },
    { href: '/rates', label: t('menu_rates'), icon: TrendingUp },
    { href: '/payments', label: t('menu_payments'), icon: CreditCard },
    { href: '/salaries', label: t('menu_salaries'), icon: Coins },
    { href: '/cashbox', label: t('menu_cashbox'), icon: DollarSign },
    { href: '/employees', label: t('menu_employees'), icon: UserCog },
    { href: '/partners', label: 'شرکا', icon: Handshake },
    { href: '/users', label: t('menu_users'), icon: Settings },
    { href: '/settings', label: 'تنظیمات و تم‌ها', icon: Palette },
  ]

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const sideClass = language === 'fa' ? 'right-0' : 'left-0'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'
  const drawerClass = language === 'fa' ? 'right-0' : 'left-0'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      
      {/* Desktop Sidebar */}
      <aside className={sideClass + ' hidden lg:flex w-64 h-screen glass-card border-l border-[var(--border-base)] flex-col fixed inset-y-0 z-40'}>
        <div className="p-6 flex items-center gap-3 border-b border-[var(--border-base)]">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-black shadow-lg border border-[var(--border-base)]"><img src="https://i.ibb.co/Z1LnH2NF/be92f52f-1593-4384-86f0-c7ebd960e446.jpg" alt="Logo" className="w-full h-full object-cover" /></div>
          <div><div className="font-bold text-sm tracking-widest">SHAHZAD GOLD</div><div className="text-[var(--accent)] text-[10px] uppercase font-bold tracking-wider mt-1">Trust in Every Trade</div></div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
          {mainMenu.map((item) => {
            const Icon = item.icon; const active = item.href === '/partners'
            return (<Link key={item.href} href={item.href} className={'flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-300 ' + (active ? 'bg-[var(--accent-bg)] text-[var(--accent)] border-r-2 border-[var(--accent)] shadow-[var(--accent-glow)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]')}><Icon size={18} className={active ? 'text-[var(--accent)]' : ''} /><span className="text-sm font-semibold">{item.label}</span></Link>)
          })}
          <div className="text-[var(--text-muted)] text-[10px] font-bold px-4 py-3 mt-4 uppercase tracking-widest border-t border-[var(--border-base)]">{t('menu_management')}</div>
          {manageMenu.map((item) => {
            const Icon = item.icon; const active = item.href === '/partners'
            return (<Link key={item.href} href={item.href} className={'flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-300 ' + (active ? 'bg-[var(--accent-bg)] text-[var(--accent)] border-r-2 border-[var(--accent)] shadow-[var(--accent-glow)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]')}><Icon size={18} className={active ? 'text-[var(--accent)]' : ''} /><span className="text-sm font-semibold">{item.label}</span></Link>)
          })}
        </div>
        <div className="p-4 border-t border-[var(--border-base)]">
          <div className="flex items-center gap-3 mb-4 bg-[var(--bg-input)] p-3 rounded-2xl border border-[var(--border-base)]">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[var(--accent)] shadow-[0_0_10px_var(--accent-glow)]"><img src="https://i.ibb.co/Z1LnH2NF/be92f52f-1593-4384-86f0-c7ebd960e446.jpg" alt="User" className="w-full h-full object-cover" /></div>
            <div className="flex-1 min-w-0"><div className="text-[var(--text-primary)] text-xs font-bold truncate">{user?.employeeName || user?.username}</div><div className="text-[var(--accent)] text-[10px] font-medium">{user?.role === 'ADMIN' ? t('admin') : t('employee')}</div></div>
          </div>
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-2.5 rounded-xl text-xs font-bold transition-colors"><LogOut size={16} /> {t('logout')}</button>
        </div>
      </aside>

      {/* Mobile Menu */}
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
                const Icon = item.icon; const active = item.href === '/partners'
                return (
                  <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)} className={'flex items-center gap-3 px-3 py-3 rounded-xl mb-1 transition ' + (active ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)]')}>
                    <Icon size={18} /><span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
              <div className="text-[var(--text-muted)] text-[10px] font-bold px-3 py-3 mt-4 uppercase tracking-widest border-t border-[var(--border-base)]">{t('menu_management')}</div>
              {manageMenu.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.href} href={item.href} onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-[var(--text-secondary)] hover:bg-[var(--bg-input)] transition">
                    <Icon size={18} /><span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium">
                <Handshake size={18} className="text-[var(--accent)]" />
                <span>مدیریت شرکا</span>
              </div>
            </div>
            <button onClick={() => setShowAddModal(true)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all glow-button shadow-lg">
              <Plus size={16} /> شریک جدید
            </button>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto space-y-6">
          {/* نوار جستجو */}
          <div className="glass-card rounded-3xl p-5">
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"><Search size={18} className="text-[var(--text-muted)]" /></div>
              <input type="text" placeholder="جستجوی شریک بر اساس نام یا شماره تماس..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pr-11 pl-4 py-3 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
            </div>
          </div>

          {/* لیست شرکا */}
          {loading ? (
            <div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>
          ) : filteredPartners.length === 0 ? (
            <div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ شریکی یافت نشد.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPartners.map((partner) => (
                <div key={partner.id} className="glass-card rounded-3xl p-6 hover:-translate-y-1 transition-transform duration-300 group flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent-bg)] flex items-center justify-center text-[var(--accent)]">
                      <Handshake size={24} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(partner.id, partner.fullName)} className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg transition" title="حذف">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{partner.fullName}</h3>
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4" dir="ltr">
                    <Phone size={14} /> {partner.phone || 'بدون شماره'}
                  </div>

                  <div className="mt-auto pt-4 border-t border-[var(--border-base)] flex items-center justify-between">
                    <div className="text-xs text-[var(--text-muted)]">
                      تعداد معاملات: <span className="font-bold text-[var(--text-primary)]">{partner._count.transactions}</span>
                    </div>
                    <Link href={`/partners/${partner.id}`} className="flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:text-white bg-[var(--accent)]/10 hover:bg-[var(--accent)] px-3 py-2 rounded-lg transition-colors">
                      <Eye size={14} /> مشاهده جزئیات
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal افزودن شریک جدید */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 left-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Plus size={20} className="text-[var(--accent)]" /> ثبت شریک جدید</h2>
            
            {error && <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm mb-4">{error}</div>}
            
            <form onSubmit={handleAddPartner} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نام شریک</label>
                <input type="text" value={newPartner.fullName} onChange={e => setNewPartner({...newPartner, fullName: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" placeholder="مثلا: احمد رضایی" />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">شماره تماس (اختیاری)</label>
                <input type="text" value={newPartner.phone} onChange={e => setNewPartner({...newPartner, phone: e.target.value})} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" placeholder="+93..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">یادداشت (اختیاری)</label>
                <textarea value={newPartner.notes} onChange={e => setNewPartner({...newPartner, notes: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" rows={2}></textarea>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3 rounded-xl font-bold text-sm transition-all glow-button mt-4 disabled:opacity-50">
                {saving ? 'در حال ثبت...' : 'ثبت شریک'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}