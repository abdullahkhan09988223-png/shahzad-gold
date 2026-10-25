'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar' // 👈 ایمپورت سایدبار جدید
import {
  Menu, Printer, UserPlus, Bell, ShieldCheck, ArrowRight
} from 'lucide-react'

type Statement = {
  id: number
  fullName: string
  phone: string
  address: string | null
  balanceUsd: string
  balanceAfn: string
  transactions: any[]
  guarantors: any[]
  reminders: any[]
}

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function StatementPage() {
  const { t, language } = useI18n()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [data, setData] = useState<Statement | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const [showGForm, setShowGForm] = useState(false)
  const [showRForm, setShowRForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [gForm, setGForm] = useState({ fullName: '', phone: '', relation: '', nationalId: '' })
  const [rForm, setRForm] = useState({ message: '', method: 'MANUAL', remindAt: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      // 👈 قفل امنیتی
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('debts')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }
      setUser(authData.user)
      await load()
    }
    init()
  }, [id])

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/statements/${id}`, { cache: 'no-store' })
    const d = await res.json()
    if (d.success) setData(d.customer)
    setLoading(false)
  }

  const addGuarantor = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await fetch('/api/guarantors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...gForm, customerId: id }) })
    setGForm({ fullName: '', phone: '', relation: '', nationalId: '' })
    setShowGForm(false); setSaving(false); load()
  }

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await fetch('/api/reminders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...rForm, customerId: id }) })
    setRForm({ message: '', method: 'MANUAL', remindAt: new Date().toISOString().split('T')[0] })
    setShowRForm(false); setSaving(false); load()
  }

  const delGuarantor = async (gid: number) => {
    if (!confirm('حذف ضامن؟')) return
    await fetch(`/api/guarantors/${gid}`, { method: 'DELETE' }); load()
  }

  const delReminder = async (rid: number) => {
    if (!confirm('حذف یادآوری؟')) return
    await fetch(`/api/reminders/${rid}`, { method: 'DELETE' }); load()
  }

  const toggleReminder = async (rid: number, isDone: boolean) => {
    await fetch(`/api/reminders/${rid}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDone: !isDone }) }); load()
  }

  const fmt = (n: string | number, digits = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>
  if (!data) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-red-500">مشتری یافت نشد</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden print:block print:bg-white print:text-black" dir={dir}>
      
      {/* 👈 سایدبار (در پرینت مخفی می‌شود) */}
      <div className="print:hidden">
        <Sidebar 
          user={user} 
          activePath="/debts" 
          showMobileMenu={showMobileMenu} 
          setShowMobileMenu={setShowMobileMenu} 
        />
      </div>

      {/* Main Content */}
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20 print:overflow-visible print:h-auto print:m-0 print:p-0 print:w-full'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)] print:hidden">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <Link href="/debts" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition font-medium">
                <ArrowRight size={16} /> بازگشت به لیست بدهکاران
              </Link>
            </div>
            <button onClick={() => window.print()} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all glow-button shadow-lg">
              <Printer size={16} /> پرینت صورتحساب
            </button>
          </div>
        </header>

        <main className="p-6 max-w-5xl mx-auto print:p-0 print:max-w-full">
          
          {/* Print Header */}
          <div className="hidden print:block mb-6 text-center border-b pb-4">
            <h1 className="text-2xl font-bold">SHAHZAD GOLD</h1>
            <p className="text-sm text-gray-600">Trust in Every Trade</p>
            <hr className="my-2" />
            <h2 className="text-lg font-bold">صورتحساب بدهی مشتری</h2>
          </div>

          {/* Customer Info */}
          <div className="glass-card rounded-3xl p-6 md:p-8 mb-6 print:border-gray-300 print:bg-white print:text-black print:shadow-none">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">{data.fullName}</h1>
                <div className="flex flex-col gap-1 text-sm text-[var(--text-secondary)] print:text-gray-600">
                  <span dir="ltr">{data.phone}</span>
                  {data.address && <span>{data.address}</span>}
                </div>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center print:border-red-500 print:bg-red-50">
                <div className="text-xs text-red-500 mb-1 font-bold">کل بدهی</div>
                <div className="text-2xl font-bold text-red-500" dir="ltr">${fmt(data.balanceUsd)}</div>
                <div className="text-xs text-red-500 mt-1 font-bold" dir="ltr">{fmt(data.balanceAfn, 0)} ؋</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:hidden">
            {/* Guarantors */}
            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><ShieldCheck size={18} className="text-blue-500"/> ضامن‌ها ({data.guarantors.length})</h2>
                <button onClick={() => setShowGForm(!showGForm)} className="text-xs bg-[var(--bg-input)] hover:bg-[var(--bg-surface-solid)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg transition flex items-center gap-1 font-bold border border-[var(--border-base)]"><UserPlus size={14}/> افزودن</button>
              </div>
              
              {showGForm && (
                <form onSubmit={addGuarantor} className="bg-[var(--bg-input)] p-4 rounded-xl mb-4 space-y-3 border border-[var(--border-base)]">
                  <input type="text" placeholder="نام ضامن *" value={gForm.fullName} onChange={e => setGForm({...gForm, fullName: e.target.value})} required className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                  <input type="text" placeholder="تلفن ضامن *" value={gForm.phone} onChange={e => setGForm({...gForm, phone: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                  <input type="text" placeholder="نسبت (اختیاری)" value={gForm.relation} onChange={e => setGForm({...gForm, relation: e.target.value})} className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                  <button type="submit" disabled={saving} className="w-full bg-blue-500 text-white py-2 rounded-lg text-xs font-bold">ذخیره</button>
                </form>
              )}

              {data.guarantors.length === 0 ? <div className="text-xs text-[var(--text-muted)] text-center py-4">ضامنی ثبت نشده است</div> : (
                <div className="space-y-2">
                  {data.guarantors.map(g => (
                    <div key={g.id} className="flex items-center justify-between bg-[var(--bg-input)] p-3 rounded-xl border border-[var(--border-base)]">
                      <div>
                        <div className="text-sm font-bold text-[var(--text-primary)]">{g.fullName} {g.relation && <span className="text-[10px] text-[var(--text-muted)]">({g.relation})</span>}</div>
                        <div className="text-xs text-[var(--text-secondary)]" dir="ltr">{g.phone}</div>
                      </div>
                      <button onClick={() => delGuarantor(g.id)} className="text-red-500 text-xs hover:text-red-400 font-bold">حذف</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reminders */}
            <div className="glass-card rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[var(--text-primary)] flex items-center gap-2"><Bell size={18} className="text-yellow-500"/> یادآوری‌ها ({data.reminders.length})</h2>
                <button onClick={() => setShowRForm(!showRForm)} className="text-xs bg-[var(--bg-input)] hover:bg-[var(--bg-surface-solid)] text-[var(--text-primary)] px-3 py-1.5 rounded-lg transition flex items-center gap-1 font-bold border border-[var(--border-base)]"><Bell size={14}/> جدید</button>
              </div>

              {showRForm && (
                <form onSubmit={addReminder} className="bg-[var(--bg-input)] p-4 rounded-xl mb-4 space-y-3 border border-[var(--border-base)]">
                  <input type="text" placeholder="متن پیام *" value={rForm.message} onChange={e => setRForm({...rForm, message: e.target.value})} required className="w-full bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                  <div className="flex gap-2">
                    <select value={rForm.method} onChange={e => setRForm({...rForm, method: e.target.value})} className="w-1/2 bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]">
                      <option value="MANUAL">دستی</option>
                      <option value="SMS">پیامک</option>
                      <option value="CALL">تماس</option>
                    </select>
                    <input type="date" value={rForm.remindAt} onChange={e => setRForm({...rForm, remindAt: e.target.value})} dir="ltr" className="w-1/2 bg-[var(--bg-surface-solid)] border border-[var(--border-base)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]" />
                  </div>
                  <button type="submit" disabled={saving} className="w-full bg-yellow-500 text-black py-2 rounded-lg text-xs font-bold">ذخیره</button>
                </form>
              )}

              {data.reminders.length === 0 ? <div className="text-xs text-[var(--text-muted)] text-center py-4">یادآوری ثبت نشده</div> : (
                <div className="space-y-2">
                  {data.reminders.map(r => (
                    <div key={r.id} className={`flex items-center justify-between p-3 rounded-xl border ${r.isDone ? 'bg-green-500/10 border-green-500/20' : 'bg-[var(--bg-input)] border-[var(--border-base)]'}`}>
                      <div>
                        <div className="text-sm text-[var(--text-primary)] font-medium">{r.message}</div>
                        <div className="text-[10px] text-[var(--text-muted)]" dir="ltr">{new Date(r.remindAt).toLocaleDateString('fa-IR')} | {r.method}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleReminder(r.id, r.isDone)} className={`text-xs px-2 py-1 rounded font-bold ${r.isDone ? 'bg-green-500 text-black' : 'bg-[var(--bg-surface-solid)] text-[var(--text-primary)] border border-[var(--border-base)]'}`}>{r.isDone ? '✓' : 'انجام'}</button>
                        <button onClick={() => delReminder(r.id)} className="text-red-500 text-xs font-bold">حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <div className="glass-card rounded-3xl overflow-hidden print:border-gray-300 print:bg-white print:shadow-none">
            <div className="p-5 border-b border-[var(--border-base)] print:border-gray-300">
              <h2 className="font-bold text-[var(--text-primary)] print:text-black">سابقه معاملات بدهی</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-surface-solid)] text-xs text-[var(--text-secondary)] border-b border-[var(--border-base)] print:bg-gray-100 print:text-black">
                  <tr>
                    <th className="p-3 text-right font-bold">فاکتور</th>
                    <th className="p-3 text-right font-bold">تاریخ</th>
                    <th className="p-3 text-right font-bold">نوع</th>
                    <th className="p-3 text-right font-bold">جمع کل ($)</th>
                    <th className="p-3 text-right font-bold">باقی‌مانده ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.filter((t: any) => Number(t.remainingUsd) > 0).map((t: any) => (
                    <tr key={t.id} className="border-t border-[var(--border-base)] hover:bg-[var(--bg-input)] print:border-gray-200">
                      <td className="p-3 text-xs font-bold text-blue-500 print:text-black" dir="ltr">{t.invoiceNumber}</td>
                      <td className="p-3 text-xs text-[var(--text-secondary)] print:text-gray-600" dir="ltr">{new Date(t.transactionDate).toLocaleDateString('fa-IR')}</td>
                      <td className="p-3 text-xs text-[var(--text-primary)] print:text-black">{t.type === 'BUY' ? 'خرید' : 'فروش'}</td>
                      <td className="p-3 text-xs text-[var(--text-primary)] print:text-black" dir="ltr">${fmt(t.totalUsd)}</td>
                      <td className="p-3 text-xs font-bold text-red-500 print:text-red-600" dir="ltr">${fmt(t.remainingUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}