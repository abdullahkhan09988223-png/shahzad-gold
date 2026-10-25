'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import {
  Settings, Menu, Plus, Shield, Key, Trash2, CheckCircle, XCircle, X, ShieldCheck
} from 'lucide-react'

type UserType = { id: number; username: string; role: string; isActive: boolean; employee: any; permissions: string[] }
type Employee = { id: number; fullName: string; position: string }
type CurrentUser = { id: number; username: string; role: string; employeeName: string | null, permissions?: string[] }

const ALL_MODULES = [
  { key: 'transactions', label: 'معاملات فیزیکی' },
  { key: 'trades', label: 'فیکسنگ' },
  { key: 'customers', label: 'مشتریان' },
  { key: 'debts', label: 'قرض‌ها' },
  { key: 'reports', label: 'گزارشات' },
  { key: 'partners', label: 'شرکا' },
  { key: 'ledger', label: 'روزنامچه' },
  { key: 'inventory', label: 'دارایی' },
  { key: 'rates', label: 'نرخ‌ها' },
  { key: 'payments', label: 'پرداخت‌ها' },
  { key: 'salaries', label: 'معاشات' },
  { key: 'cashbox', label: 'صندوق' },
  { key: 'employees', label: 'کارمندان' },
  { key: 'users', label: 'کاربران' },
  { key: 'settings', label: 'تنظیمات' },
]

export default function UsersPage() {
  const { t, language } = useI18n()
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [users, setUsers] = useState<UserType[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ username: '', password: '', employeeId: '', role: 'EMPLOYEE' })

  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [savingPermissions, setSavingPermissions] = useState(false)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN') {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      setCurrentUser(authData.user)
      await load()
    }
    init()
  }, [])

  const load = async () => {
    setLoading(true)
    const [uRes, eRes] = await Promise.all([fetch('/api/users', { cache: 'no-store' }), fetch('/api/employees', { cache: 'no-store' })])
    const uData = await uRes.json(); const eData = await eRes.json()
    if (uData.success) setUsers(uData.users)
    if (eData.success) setEmployees(eData.employees)
    setLoading(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.success) { setForm({ username: '', password: '', employeeId: '', role: 'EMPLOYEE' }); setShowForm(false); load() }
      else setError(data.error)
    } catch (err) { setError(String(err)) } finally { setSaving(false) }
  }

  const toggleActive = async (u: UserType) => {
    await fetch(`/api/users/${u.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !u.isActive }) })
    load()
  }

  const resetPassword = async (u: UserType) => {
    const newPass = prompt(`رمز جدید برای "${u.username}":`)
    if (!newPass) return
    const res = await fetch(`/api/users/${u.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPass }) })
    if ((await res.json()).success) alert('رمز تغییر کرد')
  }

  const handleDelete = async (u: UserType) => {
    if (!confirm(`حذف کاربر "${u.username}"؟`)) return
    await fetch(`/api/users/${u.id}`, { method: 'DELETE' })
    load()
  }

  const openPermissionsModal = (u: UserType) => {
    setEditingUser(u)
    setSelectedPermissions(u.permissions || [])
  }

  const togglePermission = (key: string) => {
    if (selectedPermissions.includes(key)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== key))
    } else {
      setSelectedPermissions([...selectedPermissions, key])
    }
  }

  const savePermissions = async () => {
    if (!editingUser) return
    setSavingPermissions(true)
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: selectedPermissions })
      })
      const data = await res.json()
      if (data.success) {
        setEditingUser(null)
        load()
      } else {
        alert('خطا در ذخیره دسترسی‌ها')
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور')
    } finally {
      setSavingPermissions(false)
    }
  }

  if (!isMounted) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>
  if (loading && !currentUser) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      
      <Sidebar user={currentUser} activePath="/users" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium"><Settings size={18} className="text-[var(--accent)]" /><span>مدیریت کاربران سیستم</span></div>
            </div>
            <button onClick={() => setShowForm(!showForm)} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all duration-300 glow-button shadow-lg">{showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'بستن فرم' : 'کاربر جدید'}</button>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          {showForm && (
            <form onSubmit={submit} className="glass-card rounded-3xl p-8 mb-8 border-t-4 border-t-[var(--accent)] shadow-2xl">
              <h2 className="font-bold text-xl mb-6 flex items-center gap-2"><Shield size={22} className="text-[var(--accent)]"/> ایجاد کاربر جدید</h2>
              {error && <div className="bg-red-500/10 text-red-500 p-4 rounded-xl mb-6 text-sm font-medium border border-red-500/20">{error}</div>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نام کاربری *</label><input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" /></div>
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">رمز عبور *</label><input type="text" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" /></div>
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">لینک به کارمند</label><select value={form.employeeId} onChange={(e) => setForm({...form, employeeId: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"><option value="">-- بدون لینک --</option>{employees.map((emp) => (<option key={emp.id} value={emp.id}>{emp.fullName} - {emp.position}</option>))}</select></div>
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نقش (سطح دسترسی)</label><select value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"><option value="EMPLOYEE">کارمند</option><option value="ACCOUNTANT">حسابدار</option><option value="MANAGER">مدیر</option><option value="ADMIN">ادمین</option></select></div>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold transition-all duration-300 glow-button">{saving ? 'در حال ذخیره...' : '💾 ذخیره کاربر'}</button>
            </form>
          )}

          <div className="glass-card rounded-3xl overflow-hidden">
            {loading ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">در حال بارگذاری...</div>) : users.length === 0 ? (<div className="p-10 text-center text-[var(--text-muted)] text-sm">هیچ کاربری یافت نشد</div>) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)]">
                    <tr><th className="p-5 text-right font-bold">نام کاربری</th><th className="p-5 text-right font-bold">کارمند مرتبط</th><th className="p-5 text-right font-bold">نقش</th><th className="p-5 text-right font-bold">وضعیت</th><th className="p-5 text-right font-bold">عملیات</th></tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] transition-colors">
                        <td className="p-5 font-bold text-[var(--text-primary)]" dir="ltr">{u.username}</td>
                        <td className="p-5 text-[var(--text-secondary)]">{u.employee ? (<span>{u.employee.fullName} <span className="text-[var(--text-muted)] text-xs">({u.employee.position})</span></span>) : (<span className="text-[var(--text-muted)]">-</span>)}</td>
                        <td className="p-5">{u.role === 'ADMIN' && <span className="bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent)] text-[10px] px-3 py-1.5 rounded-lg font-bold"><Shield size={12} className="inline mr-1"/>ادمین</span>}{u.role === 'MANAGER' && <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] px-3 py-1.5 rounded-lg font-bold">مدیر</span>}{u.role === 'ACCOUNTANT' && <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] px-3 py-1.5 rounded-lg font-bold">حسابدار</span>}{u.role === 'EMPLOYEE' && <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 text-[10px] px-3 py-1.5 rounded-lg font-bold">کارمند</span>}</td>
                        <td className="p-5">{u.isActive ? (<span className="flex items-center gap-1.5 text-green-500 text-xs font-bold"><CheckCircle size={16}/> فعال</span>) : (<span className="flex items-center gap-1.5 text-red-500 text-xs font-bold"><XCircle size={16}/> غیرفعال</span>)}</td>
                        <td className="p-5 flex flex-wrap gap-2 text-xs">
                          {u.role !== 'ADMIN' && (
                            <button onClick={() => openPermissionsModal(u)} className="text-purple-400 hover:text-purple-300 flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-lg transition">
                              <ShieldCheck size={14}/> دسترسی‌ها
                            </button>
                          )}
                          <button onClick={() => resetPassword(u)} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-lg transition"><Key size={14}/> رمز</button>
                          <button onClick={() => toggleActive(u)} className="text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1.5 rounded-lg transition">{u.isActive ? 'غیرفعال' : 'فعال'}</button>
                          {u.username !== 'admin' && (<button onClick={() => handleDelete(u)} className="text-red-400 hover:text-red-300 flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg transition"><Trash2 size={14}/> حذف</button>)}
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

      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 left-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={20} /></button>
            
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><ShieldCheck className="text-[var(--accent)]" size={24} /> مدیریت دسترسی‌های کاربر</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">تعیین کنید کاربر <strong className="text-[var(--text-primary)]">"{editingUser.username}"</strong> به کدام بخش‌های سیستم دسترسی داشته باشد.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
              {ALL_MODULES.map(mod => (
                <label key={mod.key} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedPermissions.includes(mod.key) ? 'bg-[var(--accent-bg)] border-[var(--accent)] text-[var(--accent)]' : 'bg-[var(--bg-input)] border-[var(--border-base)] text-[var(--text-secondary)] hover:border-[var(--accent)]'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedPermissions.includes(mod.key)}
                    onChange={() => togglePermission(mod.key)}
                    className="w-5 h-5 accent-[var(--accent)] rounded"
                  />
                  <span className="text-sm font-bold">{mod.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-4">
              <button onClick={savePermissions} disabled={savingPermissions} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3 rounded-xl font-bold transition-all glow-button disabled:opacity-50">
                {savingPermissions ? 'در حال ذخیره...' : '💾 ذخیره دسترسی‌ها'}
              </button>
              <button onClick={() => setEditingUser(null)} className="px-6 py-3 bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] rounded-xl font-bold transition hover:bg-[var(--bg-surface-solid)]">لغو</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}