'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar' // 👈 ایمپورت سایدبار جدید
import {
  Search, Menu, Plus, Edit, Trash2, UserCircle2, X, UserCog
} from 'lucide-react'

type Employee = { id: number; fullName: string; phone: string; position: string; hireDate: string; salaryAmount: string; salaryCurrency: string; isActive: boolean }
type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function EmployeesPage() {
  const { t, language } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const [selected, setSelected] = useState<Employee | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', position: '', hireDate: '', salaryAmount: '', salaryCurrency: 'AFN' })

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      // 👈 قفل امنیتی: اگر ادمین نبود و به کارمندان دسترسی نداشت، بیرونش کن
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('employees')) {
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
    const res = await fetch('/api/employees', { cache: 'no-store' })
    const data = await res.json()
    if (data.success) setEmployees(data.employees)
    setLoading(false)
  }

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  const startEdit = () => {
    if (!selected) return
    setEditForm({ fullName: selected.fullName, phone: selected.phone, position: selected.position, hireDate: selected.hireDate.split('T')[0], salaryAmount: selected.salaryAmount, salaryCurrency: selected.salaryCurrency })
    setEditMode(true); setError('')
  }

  const saveEdit = async () => {
    if (!selected) return
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/employees/${selected.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) })
      const data = await res.json()
      if (data.success) { setSelected(data.employee); setEditMode(false); load() } else setError(data.error || 'خطا در ذخیره تغییرات')
    } catch (err) { setError(String(err)) } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!confirm(`آیا مطمئنی می‌خوای "${selected.fullName}" رو حذف کنی؟`)) return
    const res = await fetch(`/api/employees/${selected.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) { setSelected(null); load() } else alert('خطا: ' + data.error)
  }

  const filtered = employees.filter((e) => e.fullName.includes(search) || e.phone.includes(search))

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'
  const drawerClass = language === 'fa' ? 'right-0' : 'left-0' // 👈 اصلاح شد تا در فارسی از راست باز شود

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      
      {/* 👈 استفاده از سایدبار جدید */}
      <Sidebar 
        user={user} 
        activePath="/employees" 
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
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><UserCog size={18} className="text-[var(--accent)]" /><span>مدیریت کارمندان</span></div>
            </div>
            <Link href="/employees/new" className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all glow-button shadow-lg"><Plus size={16} /> کارمند جدید</Link>
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
            {loading ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>) : filtered.length === 0 ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ کارمندی یافت نشد</div>) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr><th className="p-5 text-right font-bold">نام کارمند</th><th className="p-5 text-right font-bold">تلفن</th><th className="p-5 text-right font-bold">سمت</th><th className="p-5 text-right font-bold">معاش ماهانه</th><th className="p-5 text-right font-bold">تاریخ استخدام</th><th className="p-5 text-center font-bold">عملیات</th></tr>
                  </thead>
                  <tbody>
                    {filtered.map((e) => (
                      <tr key={e.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors cursor-pointer" onClick={() => { setSelected(e); setEditMode(false); }}>
                        <td className="p-5 font-bold text-[var(--text-primary)]">{e.fullName}</td>
                        <td className="p-5 text-[var(--text-secondary)] text-xs" dir="ltr">{e.phone}</td>
                        <td className="p-5 text-xs text-[var(--text-secondary)]">{e.position}</td>
                        <td className="p-5 text-xs font-bold text-[var(--accent)]" dir="ltr">{fmt(e.salaryAmount)} {e.salaryCurrency === 'USD' ? '$' : '؋'}</td>
                        <td className="p-5 text-xs text-[var(--text-muted)]" dir="ltr">{new Date(e.hireDate).toLocaleDateString('fa-IR')}</td>
                        <td className="p-5 text-center"><button className="text-blue-500 hover:text-blue-400 text-xs font-bold bg-blue-500/10 px-4 py-2 rounded-lg transition">مشاهده</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 👈 باکس جزئیات کارمند (Drawer) */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity" onClick={() => setSelected(null)} />
          <div className={'fixed inset-y-0 w-full max-w-sm glass-card border-white/5 z-50 shadow-2xl overflow-y-auto transition-transform ' + drawerClass + (language === 'fa' ? ' border-l' : ' border-r')}>
            <div className="sticky top-0 bg-[var(--bg-surface-solid)] border-b border-[var(--border-base)] p-5 flex items-center justify-between z-10">
              <h2 className="font-bold flex items-center gap-2"><UserCircle2 size={22} className="text-[var(--accent)]"/> جزئیات کارمند</h2>
              <button onClick={() => setSelected(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-input)] p-2 rounded-lg transition"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm font-medium border border-red-500/20">{error}</div>}
              {!editMode ? (
                <>
                  <div className="text-center pb-6 border-b border-[var(--border-base)]">
                    <div className="w-24 h-24 bg-[var(--bg-input)] border-2 border-[var(--accent)] rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-[0_0_20px_var(--accent-glow)]">👤</div>
                    <h3 className="text-xl font-bold mb-1">{selected.fullName}</h3>
                    <p className="text-sm text-[var(--accent)] font-medium">{selected.position}</p>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between items-center bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-base)]"><span className="text-[var(--text-secondary)]">تلفن</span><span className="font-bold" dir="ltr">{selected.phone}</span></div>
                    <div className="flex justify-between items-center bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-base)]"><span className="text-[var(--text-secondary)]">معاش ماهانه</span><span className="font-bold text-[var(--accent)]" dir="ltr">{fmt(selected.salaryAmount)} {selected.salaryCurrency === 'USD' ? 'دالر' : 'افغانی'}</span></div>
                    <div className="flex justify-between items-center bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-base)]"><span className="text-[var(--text-secondary)]">تاریخ استخدام</span><span className="font-bold" dir="ltr">{new Date(selected.hireDate).toLocaleDateString('fa-IR')}</span></div>
                    <div className="flex justify-between items-center bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-base)]"><span className="text-[var(--text-secondary)]">وضعیت</span><span className="font-bold text-green-500">{selected.isActive ? 'فعال' : 'غیرفعال'}</span></div>
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button onClick={startEdit} className="flex-1 bg-[var(--bg-input)] hover:bg-[var(--bg-surface-solid)] border border-[var(--border-base)] text-[var(--text-primary)] py-3.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"><Edit size={16} /> ویرایش</button>
                    <button onClick={handleDelete} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2"><Trash2 size={16} /> حذف</button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-bold border-b border-[var(--border-base)] pb-3">✏️ ویرایش اطلاعات</h3>
                  <div className="space-y-4">
                    <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نام کامل</label><input type="text" value={editForm.fullName} onChange={(e) => setEditForm({...editForm, fullName: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" /></div>
                    <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">تلفن</label><input type="text" value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" /></div>
                    <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">سمت</label><input type="text" value={editForm.position} onChange={(e) => setEditForm({...editForm, position: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" /></div>
                    <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">تاریخ استخدام</label><input type="date" value={editForm.hireDate} onChange={(e) => setEditForm({...editForm, hireDate: e.target.value})} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" /></div>
                    <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">معاش</label><div className="flex gap-3"><input type="number" value={editForm.salaryAmount} onChange={(e) => setEditForm({...editForm, salaryAmount: e.target.value})} dir="ltr" className="flex-1 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)]" /><select value={editForm.salaryCurrency} onChange={(e) => setEditForm({...editForm, salaryCurrency: e.target.value})} className="w-24 bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[var(--accent)]"><option value="AFN">؋</option><option value="USD">$</option></select></div></div>
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button onClick={saveEdit} disabled={saving} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl text-sm font-bold glow-button">{saving ? '...' : '💾 ذخیره'}</button>
                    <button onClick={() => setEditMode(false)} className="flex-1 bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] py-3.5 rounded-xl text-sm font-bold">لغو</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}