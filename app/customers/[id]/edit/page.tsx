'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation' // 👈 useRouter اضافه شد
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar' // 👈 ایمپورت سایدبار
import { ArrowRight, Edit, Menu } from 'lucide-react'

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function EditCustomerPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { t, language } = useI18n()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    nationalId: '',
    customerType: 'BOTH',
    notes: '',
  })

  useEffect(() => {
    const init = async () => {
      // ۱. بررسی لاگین و دسترسی
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('customers')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }
      setUser(authData.user)

      // ۲. گرفتن اطلاعات مشتری
      try {
        const res = await fetch(`/api/customers/${id}`, { cache: 'no-store' })
        const data = await res.json()
        if (data.success) {
          const c = data.customer
          setForm({
            fullName: c.fullName || '',
            phone: c.phone || '',
            email: c.email || '',
            address: c.address || '',
            nationalId: c.nationalId || '',
            customerType: c.customerType || 'BOTH',
            notes: c.notes || '',
          })
        } else {
          setError(data.error || 'خطا در بارگذاری')
        }
      } catch (err) {
        setError('خطای شبکه: ' + String(err))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (data.success) {
        window.location.href = `/customers/${id}`
      } else {
        setError(data.error || 'خطا در ذخیره تغییرات')
        setSaving(false)
      }
    } catch (err) {
      setError('خطای شبکه: ' + String(err))
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      
      {/* 👈 سایدبار */}
      <Sidebar 
        user={user} 
        activePath="/customers" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      {/* محتوای اصلی */}
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-secondary)] hidden md:flex items-center gap-2 font-medium">
                <Edit size={18} className="text-[var(--accent)]" />
                <span>ویرایش اطلاعات مشتری</span>
              </div>
            </div>
            <Link href={`/customers/${id}`} className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm transition font-medium">
              <ArrowRight size={16} /> بازگشت به پروفایل
            </Link>
          </div>
        </header>

        <main className="p-6 max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-6 md:p-8 shadow-2xl border-t-4 border-t-[var(--accent)] space-y-6">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نام کامل <span className="text-red-500">*</span></label>
                <input type="text" name="fullName" value={form.fullName} onChange={handleChange} required className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">شماره تلفن <span className="text-red-500">*</span></label>
                <input type="text" name="phone" value={form.phone} onChange={handleChange} required dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">ایمیل</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">شماره تذکره</label>
                <input type="text" name="nationalId" value={form.nationalId} onChange={handleChange} dir="ltr" className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">نوع مشتری</label>
                <select name="customerType" value={form.customerType} onChange={handleChange} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors">
                  <option value="BUYER">🛒 خریدار</option>
                  <option value="SELLER">💰 فروشنده</option>
                  <option value="BOTH">🔄 هر دو (خریدار و فروشنده)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">آدرس</label>
                <input type="text" name="address" value={form.address} onChange={handleChange} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-2">یادداشت</label>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full bg-[var(--bg-input)] border border-[var(--border-base)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"></textarea>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-[var(--border-base)]">
              <button type="submit" disabled={saving} className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-3.5 rounded-xl font-bold text-sm transition-all glow-button shadow-lg disabled:opacity-50 flex justify-center items-center gap-2">
                {saving ? 'در حال ذخیره...' : '💾 ذخیره تغییرات'}
              </button>
              <Link href={`/customers/${id}`} className="px-8 py-3.5 bg-[var(--bg-input)] border border-[var(--border-base)] text-[var(--text-primary)] rounded-xl font-bold text-sm transition flex items-center justify-center">
                لغو
              </Link>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}