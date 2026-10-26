'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import { ArrowRight, Home, Menu, Handshake, Phone, FileText } from 'lucide-react'

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

function PartnerDetailContent() {
  const { language } = useI18n()
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [partner, setPartner] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
        const authData = await authRes.json()
        if (!authData.success) return window.location.href = '/login'
        setUser(authData.user)

        // دریافت اطلاعات شریک (اگر API دارید، اینجا آدرسش را تنظیم کنید)
        const res = await fetch(`/api/partners/${id}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.success) setPartner(data.partner)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  if (loading) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>
  if (!partner) return <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-red-500">شریک یافت نشد</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  return (
    <div className="min-h-screen w-full bg-[var(--bg-base)] text-[var(--text-primary)] flex transition-colors duration-500 overflow-hidden" dir={dir}>
      <Sidebar user={user} activePath="/partners" showMobileMenu={showMobileMenu} setShowMobileMenu={setShowMobileMenu} />
      
      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-base)]/60 backdrop-blur-xl border-b border-[var(--border-base)]">
          <div className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-secondary)]"><Menu size={24} /></button>
              <Link href="/" className="flex items-center gap-1.5 bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--text-secondary)] transition-colors">
                <Home size={14} /> داشبورد
              </Link>
              <Link href="/partners" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition font-medium">
                <ArrowRight size={16} /> بازگشت به لیست شرکا
              </Link>
            </div>
          </div>
        </header>

        <main className="p-6 max-w-4xl mx-auto space-y-6">
          <div className="glass-card rounded-3xl p-8 border-t-4 border-t-purple-500 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            
            <div className="flex items-center gap-5 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 text-3xl font-bold shadow-sm">
                <Handshake size={40} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{partner.fullName}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
                  {partner.phone && <span className="flex items-center gap-1" dir="ltr"><Phone size={14}/> {partner.phone}</span>}
                </div>
              </div>
            </div>

            {partner.notes && (
              <div className="bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border-base)] text-sm">
                <span className="font-bold text-[var(--text-secondary)]">یادداشت: </span>
                {partner.notes}
              </div>
            )}
          </div>

          <div className="glass-card rounded-3xl p-8 text-center flex flex-col items-center justify-center border border-dashed border-[var(--border-base)]">
            <FileText size={48} className="text-[var(--text-muted)] mb-4 opacity-50" />
            <h2 className="text-lg font-bold mb-2">معاملات این شریک</h2>
            <p className="text-sm text-[var(--text-secondary)]">در این بخش می‌توانید لیست معاملاتی که این شریک در آن سهم داشته را مشاهده کنید.</p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function PartnerDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center text-[var(--text-primary)]">در حال بارگذاری...</div>}>
      <PartnerDetailContent />
    </Suspense>
  )
}