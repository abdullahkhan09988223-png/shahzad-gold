'use client'

import {
  createContext, useContext, useEffect, useState, ReactNode,
} from 'react'

type Language = 'fa' | 'en'
type Theme = 'light' | 'dark'
type ColorTheme = 'green' | 'blue' | 'rose' | 'violet'

type I18nContextType = {
  language: Language
  setLanguage: (l: Language) => void
  theme: Theme
  toggleTheme: () => void
  colorTheme: ColorTheme
  setColorTheme: (c: ColorTheme) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

const translations: Record<Language, Record<string, string>> = {
  fa: {
    dashboard: 'داشبورد', dashboard_subtitle: 'خلاصه وضعیت تجارت شما',
    business_name: 'SHAHZAD GOLD', business_sub: 'اعتماد در هر معامله',
    loading: 'در حال بارگذاری...', logout: 'خروج', logout_confirm: 'از سیستم خارج می‌شوید؟',
    admin: 'مدیر', employee: 'کارمند', save: 'ذخیره', cancel: 'لغو', delete: 'حذف',
    menu_home: 'خانه', menu_transactions: 'خرید و فروش', menu_trades: 'فیکسنگ', // 👈 اینجا تغییر کرد
    menu_customers: 'مشتریان', menu_reports: 'گزارشات', menu_ledger: 'روزنامچه',
    menu_inventory: 'دارایی', menu_rates: 'نرخ‌ها', menu_payments: 'پرداخت‌ها',
    menu_salaries: 'معاشات', menu_cashbox: 'صندوق', menu_employees: 'کارمندان',
    menu_users: 'کاربران', menu_main: 'اصلی', menu_management: 'مدیریت',
    balance_account: 'موجودی حساب', today_profit: 'سود امروز', today_expenses: 'مصارف امروز',
    transactions_count: 'تعداد معاملات', vs_yesterday: 'نسبت به دیروز',
    transactions_trend: 'روند معاملات', total: 'جمع کل', profit: 'سود', count: 'تعداد',
    quick_deal: 'معامله سریع', new_transaction: 'معامله جدید', buy: 'خرید', sell: 'فروش',
    recent_transactions: 'آخرین معاملات', no_transactions: 'هنوز معامله‌ای ثبت نشده',
    date: 'تاریخ', type: 'نوع', amount: 'مقدار', rate: 'نرخ', profit_loss: 'سود/زیان',
    status: 'وضعیت', view_all_transactions: 'مشاهده همه معاملات', paid: 'تسویه شده',
    partial: 'در جریان', unpaid: 'پرداخت نشده', accounts_summary: 'خلاصه حساب‌ها',
    gold_balance: 'موجودی طلا', silver_balance: 'موجودی نقره', usd_balance: 'موجودی دالر',
    afn_balance: 'موجودی افغانی', gram: 'گرم', manage_assets: 'مدیریت دارایی‌ها',
    login: 'ورود به سیستم', logging_in: 'در حال ورود...', username: 'نام کاربری',
    password: 'رمز عبور', login_error: 'خطا در ورود', copyright: 'تمام حقوق محفوظ است',
    menu_settings: 'تنظیمات و تم‌ها',
  },
  en: {
    dashboard: 'Dashboard', dashboard_subtitle: 'Summary of your business',
    business_name: 'SHAHZAD GOLD', business_sub: 'Trust in Every Trade',
    loading: 'Loading...', logout: 'Logout', logout_confirm: 'Are you sure you want to logout?',
    admin: 'Admin', employee: 'Employee', save: 'Save', cancel: 'Cancel', delete: 'Delete',
    menu_home: 'Home', menu_transactions: 'Physical Tx', menu_trades: 'Fixing', // 👈 اینجا تغییر کرد
    menu_customers: 'Customers', menu_reports: 'Reports', menu_ledger: 'Daily Book',
    menu_inventory: 'Inventory', menu_rates: 'Rates', menu_payments: 'Payments',
    menu_salaries: 'Salaries', menu_cashbox: 'Cash Box', menu_employees: 'Employees',
    menu_users: 'Users', menu_main: 'Main', menu_management: 'Management',
    balance_account: 'Account Balance', today_profit: "Today's Profit", today_expenses: "Today's Expenses",
    transactions_count: 'Transactions', vs_yesterday: 'vs yesterday',
    transactions_trend: 'Transactions Trend', total: 'Total', profit: 'Profit', count: 'Count',
    quick_deal: 'Quick Deal', new_transaction: 'New Transaction', buy: 'Buy', sell: 'Sell',
    recent_transactions: 'Recent Transactions', no_transactions: 'No transactions yet',
    date: 'Date', type: 'Type', amount: 'Amount', rate: 'Rate', profit_loss: 'P/L',
    status: 'Status', view_all_transactions: 'View all transactions', paid: 'Paid',
    partial: 'In Progress', unpaid: 'Unpaid', accounts_summary: 'Accounts Summary',
    gold_balance: 'Gold Balance', silver_balance: 'Silver Balance', usd_balance: 'USD Balance',
    afn_balance: 'AFN Balance', gram: 'g', manage_assets: 'Manage assets',
    login: 'Sign In', logging_in: 'Signing in...', username: 'Username',
    password: 'Password', login_error: 'Login error', copyright: 'All rights reserved',
    menu_settings: 'Settings & Themes',
  },
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fa')
  const [theme, setTheme] = useState<Theme>('dark')
  const [colorTheme, setColorThemeState] = useState<ColorTheme>('green')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language
    const savedTheme = localStorage.getItem('theme') as Theme
    const savedColor = localStorage.getItem('colorTheme') as ColorTheme
    
    if (savedLang === 'fa' || savedLang === 'en') setLanguageState(savedLang)
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme)
    if (savedColor) setColorThemeState(savedColor)
    
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const html = document.documentElement
    if (theme === 'dark') {
      html.classList.add('dark')
      html.classList.remove('light')
    } else {
      html.classList.remove('dark')
      html.classList.add('light')
    }
    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted) return
    const html = document.documentElement
    html.setAttribute('lang', language)
    html.setAttribute('dir', language === 'fa' ? 'rtl' : 'ltr')
    localStorage.setItem('language', language)
  }, [language, mounted])

  useEffect(() => {
    if (!mounted) return
    document.documentElement.setAttribute('data-color-theme', colorTheme)
    localStorage.setItem('colorTheme', colorTheme)
  }, [colorTheme, mounted])

  const setLanguage = (l: Language) => setLanguageState(l)
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')
  const setColorTheme = (c: ColorTheme) => setColorThemeState(c)
  const t = (key: string) => translations[language][key] || key

  return (
    <I18nContext.Provider value={{ language, setLanguage, theme, toggleTheme, colorTheme, setColorTheme, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}