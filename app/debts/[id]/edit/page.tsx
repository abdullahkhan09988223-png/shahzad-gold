'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { ArrowRight, Home, Menu, Save } from 'lucide-react'

type UserType = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

function EditDebtContent() {
  const { language } = useI18n()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      setUser(authData.user)
      setLoading(false)
    }
    init()
  }, [])

  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/debts" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)]"><Home size={14} /> داشبورد</Link>
              <Link href="/debts" className="text-sm text-[var(--text-secondary)] flex items-center gap-2 font-medium"><ArrowRight size={16} /> بازگشت</Link>
            </div>
          </div>
        </header>
        <main className="p-6 max-w-3xl mx-auto">
          <div className="glass-card rounded-3xl p-8 border-t-4 border-t-[var(--accent)] shadow-2xl">
            <h1 className="text-2xl font-bold mb-6">ویرایش قرض / طلب (شناسه: {id})</h1>
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-xl mb-6 text-sm">
              این صفحه فعلاً آماده است تا خطای ساخت (Build) در Vercel برطرف شود.
            </div>
            <div className="flex gap-4 pt-4">
              <button className="flex-1 bg-[var(--accent)] text-white py-3.5 rounded-xl font-bold text-lg flex items-center justify-center gap-2">
                <Save size={20} /> ذخیره تغییرات
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function EditDebtPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>}>
      <EditDebtContent />
    </Suspense>
  )
}