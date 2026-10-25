'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import Sidebar from '@/components/Sidebar'
import {
  Menu, Palette, Sun, Moon, CheckCircle2, RotateCcw, DownloadCloud, AlertTriangle, Trash2
} from 'lucide-react'

type User = { id: number; username: string; role: string; employeeName: string | null; permissions?: string[] }

export default function SettingsPage() {
  const { t, language, theme, toggleTheme, colorTheme, setColorTheme } = useI18n()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  const [downloading, setDownloading] = useState(false)
  const [resetText, setResetText] = useState('')
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    const init = async () => {
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      if (!authData.success) return window.location.href = '/login'
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('settings')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      setUser(authData.user)
      setLoading(false)
    }
    init()
  }, [])

  const handleResetPreferences = () => {
    if (!confirm('آیا مطمئن هستید؟ تمام تنظیمات ظاهری به حالت پیش‌فرض برمی‌گردد.')) return
    
    localStorage.removeItem('language')
    localStorage.removeItem('theme')
    localStorage.removeItem('colorTheme')
    
    window.location.reload()
  }

  const handleDownloadBackup = () => {
    setDownloading(true)
    window.location.href = '/api/backup'
    setTimeout(() => setDownloading(false), 3000)
  }

  const handleFactoryReset = async () => {
    if (resetText !== 'حذف') {
      alert('لطفا برای تایید، کلمه حذف را دقیقا تایپ کنید.')
      return
    }
    
    if (!confirm('هشدار جدی! آیا مطمئن هستید؟ تمام مشتریان و معاملات برای همیشه پاک می‌شوند.')) return

    setIsResetting(true)
    try {
      const res = await fetch('/api/settings/reset', { method: 'POST' })
      const data = await res.json()
      
      if (data.success) {
        alert('دیتابیس با موفقیت پاکسازی شد. سیستم آماده شروع مجدد است.')
        window.location.href = '/' 
      } else {
        alert(data.error)
      }
    } catch (err) {
      alert('خطا در ارتباط با سرور')
    } finally {
      setIsResetting(false)
      setResetText('')
    }
  }

  if (loading && !user) return <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center text-[var(--text-main)]">در حال بارگذاری...</div>

  const dir = language === 'fa' ? 'rtl' : 'ltr'
  const mainMargin = language === 'fa' ? 'lg:mr-64' : 'lg:ml-64'

  const themes = [
    { id: 'green', name: 'زمردی (پیش‌فرض)', color: 'bg-[#22C55E]' },
    { id: 'blue', name: 'آبی اقیانوسی', color: 'bg-[#3B82F6]' },
    { id: 'rose', name: 'قرمز یاقوتی', color: 'bg-[#F43F5E]' },
    { id: 'violet', name: 'بنفش سلطنتی', color: 'bg-[#8B5CF6]' },
  ]

  return (
    <div className="min-h-screen w-full bg-[var(--bg-main)] text-[var(--text-main)] flex transition-colors overflow-hidden" dir={dir}>
      
      <Sidebar 
        user={user} 
        activePath="/settings" 
        showMobileMenu={showMobileMenu} 
        setShowMobileMenu={setShowMobileMenu} 
      />

      <div className={mainMargin + ' flex-1 min-w-0 overflow-y-auto h-screen pb-20'}>
        <header className="sticky top-0 z-30 bg-[var(--bg-main)]/80 backdrop-blur-xl border-b border-[var(--border-color)]">
          <div className="px-4 md:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowMobileMenu(true)} className="lg:hidden text-[var(--text-muted)]"><Menu size={24} /></button>
              <div className="text-sm text-[var(--text-muted)] hidden md:flex items-center gap-2">
                <Palette size={18} className="text-[var(--accent)]" />
                <span>تنظیمات ظاهری و سیستم</span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
          
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 md:p-8 shadow-sm">
            <h1 className="text-2xl font-bold mb-2">تنظیمات ظاهری</h1>
            <p className="text-[var(--text-muted)] text-sm mb-8">شما می‌توانید ظاهر سیستم را مطابق با سلیقه خود تغییر دهید.</p>

            <div className="mb-10">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                {theme === 'dark' ? <Moon size={20} className="text-[var(--accent)]" /> : <Sun size={20} className="text-[var(--accent)]" />}
                حالت نمایش (Dark / Light)
              </h2>
              <div className="flex gap-4">
                <button onClick={() => { if(theme === 'light') toggleTheme() }} className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${theme === 'dark' ? 'border-[var(--accent)] bg-[var(--bg-input)] text-[var(--text-main)]' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-gray-500'}`}>
                  <Moon size={24} />
                  <span className="font-bold text-sm">حالت تاریک (Dark)</span>
                </button>
                <button onClick={() => { if(theme === 'dark') toggleTheme() }} className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${theme === 'light' ? 'border-[var(--accent)] bg-gray-200 text-black' : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-gray-500'}`}>
                  <Sun size={24} />
                  <span className="font-bold text-sm">حالت روشن (Light)</span>
                </button>
              </div>
            </div>

            <div>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Palette size={20} className="text-[var(--accent)]" />
                تم رنگی (Color Theme)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {themes.map((th) => (
                  <button key={th.id} onClick={() => setColorTheme(th.id as any)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative ${colorTheme === th.id ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--text-main)]' : 'border-[var(--border-color)] hover:border-gray-500 bg-[var(--bg-input)] text-[var(--text-muted)]'}`}>
                    <div className={`w-10 h-10 rounded-full ${th.color} shadow-lg`}></div>
                    <span className="font-bold text-sm text-center">{th.name}</span>
                    {colorTheme === th.id && (<div className="absolute top-2 right-2 text-[var(--accent)]"><CheckCircle2 size={18} /></div>)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-blue-500 mb-2 flex items-center gap-2">
              <DownloadCloud size={24} /> بکاپ‌گیری از دیتابیس
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-6 leading-relaxed">
              با کلیک روی دکمه زیر، یک نسخه پشتیبان (فایل SQL) از تمام اطلاعات مشتریان، معاملات و حساب‌ها تهیه شده و مستقیماً روی کامپیوتر شما دانلود می‌شود.
            </p>
            <button onClick={handleDownloadBackup} disabled={downloading} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg w-full md:w-auto flex items-center justify-center gap-2 disabled:opacity-50">
              <DownloadCloud size={18} /> {downloading ? 'در حال تهیه فایل...' : 'دانلود فایل بکاپ (SQL)'}
            </button>
          </div>

          <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-orange-500 mb-2 flex items-center gap-2">
              <RotateCcw size={24} /> بازنشانی تنظیمات ظاهری
            </h2>
            <p className="text-[var(--text-muted)] text-sm mb-6 leading-relaxed">
              اگر تنظیمات ظاهری (زبان، تم تاریک/روشن یا رنگ) را تغییر داده‌اید و می‌خواهید همه چیز به حالت اولیه برگردد، از دکمه زیر استفاده کنید. 
            </p>
            <button onClick={handleResetPreferences} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg w-full md:w-auto flex items-center justify-center gap-2">
              <RotateCcw size={18} /> بازگرداندن تنظیمات پیش‌فرض
            </button>
          </div>

          <div className="bg-red-500/10 border-2 border-red-500/30 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-red-500 mb-2 flex items-center gap-2">
              <AlertTriangle size={24} /> منطقه خطر (Danger Zone)
            </h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
              با استفاده از این بخش، می‌توانید تمام اطلاعات مالی سیستم (شامل مشتریان، معاملات، تریدها، صندوق و...) را برای همیشه پاک کنید تا سیستم برای شروع جدید کاملاً خالی شود. 
              <br/>
              <strong className="text-red-500 mt-2 block">توجه: این عمل غیرقابل بازگشت است! (مگر اینکه از فایل بکاپ خود داشته باشید)</strong>
            </p>
            
            <div className="bg-[var(--bg-surface-solid)] p-5 rounded-2xl border border-red-500/20">
              <label className="block text-xs font-bold text-red-500 mb-3">
                برای تایید، کلمه حذف را در کادر زیر بنویسید:
              </label>
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text" 
                  value={resetText} 
                  onChange={(e) => setResetText(e.target.value)} 
                  placeholder="حذف" 
                  className="flex-1 bg-[var(--bg-input)] border border-red-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 text-red-500 font-bold"
                />
                <button 
                  onClick={handleFactoryReset}
                  disabled={isResetting || resetText !== 'حذف'}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  {isResetting ? 'در حال پاکسازی...' : 'پاک کردن کل دیتابیس'}
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}