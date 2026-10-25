'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type Transaction = {
  id: number
  invoiceNumber: string
  type: string
  metal: string
  unit: string
  quantity: string
  pricePerUnitUsd: string
  totalUsd: string
  totalAfn: string
  profitLoss: string
  paymentStatus: string
  transactionDate: string
  customer: { id: number; fullName: string; phone: string }
  employee: { id: number; fullName: string }
}

function PrintContent() {
  const searchParams = useSearchParams()
  const [items, setItems] = useState<Transaction[]>([])
  const [totals, setTotals] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const type = searchParams.get('type') || 'ALL'
  const metal = searchParams.get('metal') || 'ALL'

  useEffect(() => {
    const init = async () => {
      // 👈 قفل امنیتی: چک کردن لاگین و دسترسی
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()

      if (!authData.success) {
        return window.location.href = '/login'
      }

      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('ledger')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      // گرفتن اطلاعات
      try {
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        if (type !== 'ALL') params.set('type', type)
        if (metal !== 'ALL') params.set('metal', metal)

        const res = await fetch(`/api/ledger?${params}`, { cache: 'no-store' })
        const data = await res.json()
        if (data.success) {
          setItems(data.transactions)
          setTotals(data.totals)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [from, to, type, metal])

  const fmt = (n: number | string, digits = 2) =>
    Number(n).toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })

  const typeLabel = (t: string) => {
    if (t === 'BUY') return 'خرید'
    if (t === 'SELL') return 'فروش'
    if (t === 'PRE_BUY') return 'پیش‌خرید'
    if (t === 'PRE_SELL') return 'پیش‌فروش'
    return t
  }

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-gray-500" dir="rtl">در حال بارگذاری...</div>
  }

  return (
    <div className="min-h-screen bg-white p-6 print:p-2" dir="rtl">
      <div className="max-w-full mx-auto print:hidden mb-4">
        <button
          onClick={() => window.print()}
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium"
        >
          🖨 پرینت / ذخیره PDF
        </button>
        <button
          onClick={() => window.close()}
          className="mr-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium"
        >
          بستن
        </button>
      </div>

      {/* سرصفحه */}
      <div className="border-b-2 border-amber-500 pb-3 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">تجارت طلا و نقره</h1>
            <p className="text-sm text-gray-600">حاجی بهرام</p>
          </div>
          <div className="text-left text-xs text-gray-600">
            <div>روزنامچه معاملات</div>
            <div>
              از {from ? new Date(from).toLocaleDateString('fa-IR') : 'ابتدا'} تا{' '}
              {to ? new Date(to).toLocaleDateString('fa-IR') : 'امروز'}
            </div>
            <div dir="ltr">
              پرینت: {new Date().toLocaleDateString('fa-IR')}
            </div>
          </div>
        </div>
      </div>

      {/* خلاصه */}
      {totals && (
        <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
          <SummaryBox label="تعداد" value={String(totals.count)} />
          <SummaryBox label="خرید" value={`$${fmt(totals.totalBuy)}`} />
          <SummaryBox label="فروش" value={`$${fmt(totals.totalSell)}`} />
          <SummaryBox label="سود" value={`$${fmt(totals.totalProfit)}`} />
        </div>
      )}

      {/* جدول */}
      <table className="w-full text-xs border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-1">#</th>
            <th className="border border-gray-300 p-1">فاکتور</th>
            <th className="border border-gray-300 p-1">تاریخ</th>
            <th className="border border-gray-300 p-1">مشتری</th>
            <th className="border border-gray-300 p-1">نوع</th>
            <th className="border border-gray-300 p-1">فلز</th>
            <th className="border border-gray-300 p-1">مقدار</th>
            <th className="border border-gray-300 p-1">جمع ($)</th>
            <th className="border border-gray-300 p-1">سود/ضرر</th>
          </tr>
        </thead>
        <tbody>
          {items.map((t, i) => (
            <tr key={t.id}>
              <td className="border border-gray-300 p-1 text-center">{i + 1}</td>
              <td className="border border-gray-300 p-1" dir="ltr">
                {t.invoiceNumber}
              </td>
              <td className="border border-gray-300 p-1" dir="ltr">
                {new Date(t.transactionDate).toLocaleDateString('fa-IR')}
              </td>
              <td className="border border-gray-300 p-1">{t.customer.fullName}</td>
              <td className="border border-gray-300 p-1">{typeLabel(t.type)}</td>
              <td className="border border-gray-300 p-1">
                {t.metal === 'GOLD' ? 'طلا' : 'نقره'}
              </td>
              <td className="border border-gray-300 p-1" dir="ltr">
                {Number(t.quantity).toFixed(3)}
              </td>
              <td className="border border-gray-300 p-1 font-bold" dir="ltr">
                ${fmt(t.totalUsd)}
              </td>
              <td className="border border-gray-300 p-1" dir="ltr">
                ${fmt(t.profitLoss)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-xs text-gray-500 text-center">
        پایان روزنامچه - {items.length} معامله
      </div>
    </div>
  )
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gray-300 p-2">
      <div className="text-gray-500">{label}</div>
      <div className="font-bold" dir="ltr">
        {value}
      </div>
    </div>
  )
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-gray-500" dir="rtl">در حال بارگذاری...</div>}>
      <PrintContent />
    </Suspense>
  )
}