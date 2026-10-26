'use client'

export const dynamic = 'force-dynamic'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { ArrowRight, Home, Menu, Save, User } from 'lucide-react'

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

function EditCustomerContent() {
  const { language } = useI18n()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '', nationalId: '', customerType: 'BOTH', notes: '' })

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
        const authData = await authRes.json()
        if (!authData.success) return window.location.href = '/login'
        setUser(authData.user)

        const res = await fetch(`/api/customers/${id}`, { cache: 'no-store' })
        const data = await res.json()
        
        if (data.success && data.customer) {
          setForm({
            fullName: data.customer.fullName || '', phone: data.customer.phone || '', email: data.customer.email || '',
            address: data.customer.address || '', nationalId: data.customer.nationalId || '',
            customerType: data.customer.customerType || 'BOTH', notes: data.customer.notes || '',
          })
        } else setError('مشتری یافت نشد')
      } catch (err) { setError(String(err)) } finally { setLoading(false) }
    }
    init()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (data.success) router.push(`/customers/${id}`)
      else setError(data.error || 'خطا در ویرایش مشتری')
    } catch (err) { setError(String(err)) } finally { setSaving(false) }
  }

  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

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
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)]"><Home size={14} /> داشبورد</Link>
              <Link href={`/customers/${id}`} className="text-sm text-[var(--text-secondary)] flex items-center gap-2 font-medium"><ArrowRight size={16} /> بازگشت</Link>
            </div>
          </div>
        </header>
        <main className="p-6 max-w-3xl mx-auto">
          <div className="glass-card rounded-3xl p-8 border-t-4 border-t-[var(--accent)] shadow-2xl">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><User size={24} className="text-[var(--accent)]"/> ویرایش اطلاعات مشتری</h1>
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نام و تخلص</label><input type="text" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none" /></div>
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">شماره تلفن</label><input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوعیت مشتری</label><select value={form.customerType} onChange={e => setForm({...form, customerType: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none"><option value="BUYER">خریدار</option><option value="SELLER">فروشنده</option><option value="BOTH">هر دو</option></select></div>
                <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">شماره تذکره</label><input type="text" value={form.nationalId} onChange={e => setForm({...form, nationalId: e.target.value})} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none" /></div>
              </div>
              <div><label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">آدرس</label><input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none" /></div>
              <div className="flex gap-4 pt-4"><button type="submit" disabled={saving} className="flex-1 bg-[var(--accent)] text-white py-3.5 rounded-xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2"><Save size={20} /> {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</button></div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function EditCustomerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>}>
      <EditCustomerContent />
    </Suspense>
  )
}