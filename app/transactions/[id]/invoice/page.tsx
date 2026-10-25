'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Transaction = {
  id: number
  invoiceNumber: string
  type: string
  metal: string
  unit: string
  quantity: string
  pricePerUnitUsd: string
  pricePerUnitAfn: string
  usdRate: string
  totalUsd: string
  totalAfn: string
  commission: string
  paidUsd: string
  paidAfn: string
  remainingUsd: string
  remainingAfn: string
  profitLoss: string
  paymentMethod: string
  paymentStatus: string
  transactionDate: string
  notes: string | null
  customer: {
    id: number
    fullName: string
    phone: string
    address: string | null
  }
  employee: { id: number; fullName: string }
}

export default function InvoicePage() {
  const params = useParams()
  const id = params.id as string

  const [tx, setTx] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      // 👈 قفل امنیتی: چک کردن لاگین و دسترسی
      const authRes = await fetch('/api/auth/me', { cache: 'no-store' })
      const authData = await authRes.json()
      
      if (!authData.success) {
        return window.location.href = '/login'
      }
      
      if (authData.user.role !== 'ADMIN' && !authData.user.permissions?.includes('transactions')) {
        alert('شما به این صفحه دسترسی ندارید!')
        return window.location.href = '/'
      }

      // گرفتن اطلاعات فاکتور
      try {
        const res = await fetch(`/api/transactions/${id}`, { cache: 'no-store' })
        const data = await res.json()
        if (data.success) setTx(data.transaction)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  const fmt = (n: string | number) =>
    Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })

  const fmtQty = (n: string | number) =>
    Number(n).toLocaleString('en-US', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    })

  const methodLabel = (m: string) => {
    if (m === 'CASH') return 'نقد'
    if (m === 'CARD') return 'کارت'
    if (m === 'BANK') return 'انتقال بانکی'
    if (m === 'CHEQUE') return 'چک'
    if (m === 'CREDIT') return 'اعتباری'
    return m
  }

  const unitLabel = (u: string) => {
    if (u === 'TOLA') return 'توله'
    if (u === 'GRAM') return 'گرام'
    if (u === 'KG') return 'کیلوگرام'
    return u
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-500" dir="rtl">
        در حال بارگذاری...
      </div>
    )
  }

  if (!tx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-red-600" dir="rtl">
        معامله یافت نشد یا دسترسی ندارید
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 print:p-0 print:bg-white" dir="rtl">
      {/* دکمه‌های بالای صفحه (توی پرینت نمیان) */}
      <div className="max-w-3xl mx-auto mb-4 flex gap-2 print:hidden">
        <Link
          href={`/transactions/${id}`}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition"
        >
          بازگشت
        </Link>
        <button
          onClick={() => window.print()}
          className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-bold transition"
        >
          پرینت / ذخیره PDF
        </button>
      </div>

      {/* فاکتور اصلی */}
      <div className="max-w-3xl mx-auto bg-white p-8 shadow-sm print:shadow-none print:max-w-full">
        {/* هدر */}
        <div className="flex items-start justify-between border-b-2 border-amber-500 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              تجارت طلا و نقره
            </h1>
            <p className="text-sm text-gray-600 mt-1">حاجی بهرام</p>
            <p className="text-xs text-gray-500 mt-1">کابل، افغانستان</p>
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-500">شماره فاکتور</div>
            <div className="text-lg font-bold text-gray-800" dir="ltr">
              {tx.invoiceNumber}
            </div>
            <div className="text-xs text-gray-500 mt-2">تاریخ</div>
            <div className="text-sm font-medium" dir="ltr">
              {new Date(tx.transactionDate).toLocaleDateString('fa-IR')}
            </div>
          </div>
        </div>

        {/* اطلاعات مشتری */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-2 bg-gray-100 px-3 py-1.5">
            اطلاعات مشتری
          </h2>
          <div className="grid grid-cols-2 gap-4 px-3 text-sm">
            <div>
              <span className="text-gray-500">نام: </span>
              <span className="font-medium">{tx.customer.fullName}</span>
            </div>
            <div>
              <span className="text-gray-500">تلفن: </span>
              <span className="font-medium" dir="ltr">
                {tx.customer.phone}
              </span>
            </div>
            {tx.customer.address && (
              <div className="col-span-2">
                <span className="text-gray-500">آدرس: </span>
                <span className="font-medium">{tx.customer.address}</span>
              </div>
            )}
          </div>
        </div>

        {/* جدول معامله */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-2 bg-gray-100 px-3 py-1.5">
            جزئیات معامله
          </h2>
          <table className="w-full text-sm border border-gray-200">
            <thead>
              <tr className="bg-amber-50">
                <th className="text-right p-2 border border-gray-200">
                  نوع معامله
                </th>
                <th className="text-right p-2 border border-gray-200">فلز</th>
                <th className="text-right p-2 border border-gray-200">مقدار</th>
                <th className="text-right p-2 border border-gray-200">
                  قیمت واحد ($)
                </th>
                <th className="text-right p-2 border border-gray-200">
                  جمع ($)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border border-gray-200">
                  {tx.type === 'BUY' ? 'خرید از مشتری' : 'فروش به مشتری'}
                </td>
                <td className="p-2 border border-gray-200">
                  {tx.metal === 'GOLD' ? 'طلا' : 'نقره'}
                </td>
                <td className="p-2 border border-gray-200" dir="ltr">
                  {fmtQty(tx.quantity)} {unitLabel(tx.unit)}
                </td>
                <td className="p-2 border border-gray-200" dir="ltr">
                  ${fmt(tx.pricePerUnitUsd)}
                </td>
                <td className="p-2 border border-gray-200 font-bold" dir="ltr">
                  ${fmt(tx.totalUsd)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* خلاصه مالی */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 mb-2 bg-gray-100 px-3 py-1.5">
            خلاصه مالی
          </h2>
          <div className="space-y-1 px-3 text-sm">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">جمع کل (دالر):</span>
              <span className="font-bold" dir="ltr">
                ${fmt(tx.totalUsd)}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">نرخ دالر:</span>
              <span className="font-medium" dir="ltr">
                {fmt(tx.usdRate)} ؋
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">جمع کل (افغانی):</span>
              <span className="font-bold" dir="ltr">
                {fmt(tx.totalAfn)} ؋
              </span>
            </div>
            {Number(tx.commission) > 0 && (
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-600">کارمزد:</span>
                <span className="font-medium" dir="ltr">
                  ${fmt(tx.commission)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-600">پرداخت شده:</span>
              <span className="font-medium text-green-700" dir="ltr">
                ${fmt(tx.paidUsd)}
              </span>
            </div>
            {Number(tx.remainingUsd) > 0.01 && (
              <div className="flex justify-between py-1.5 border-b border-gray-100 bg-red-50 px-2">
                <span className="text-red-700 font-medium">باقی‌مانده:</span>
                <span className="font-bold text-red-700" dir="ltr">
                  ${fmt(tx.remainingUsd)}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5">
              <span className="text-gray-600">روش پرداخت:</span>
              <span className="font-medium">
                {methodLabel(tx.paymentMethod)}
              </span>
            </div>
          </div>
        </div>

        {tx.notes && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-2 bg-gray-100 px-3 py-1.5">
              یادداشت
            </h2>
            <p className="text-sm text-gray-700 px-3">{tx.notes}</p>
          </div>
        )}

        {/* امضا */}
        <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-12 mx-8">
              <p className="text-xs text-gray-500">امضای فروشنده</p>
              <p className="text-xs text-gray-400 mt-1">
                {tx.employee.fullName}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2 mt-12 mx-8">
              <p className="text-xs text-gray-500">امضای مشتری</p>
              <p className="text-xs text-gray-400 mt-1">
                {tx.customer.fullName}
              </p>
            </div>
          </div>
        </div>

        {/* فوتر */}
        <div className="text-center mt-8 pt-4 border-t border-gray-200 text-xs text-gray-400">
          با تشکر از معامله شما - تجارت حاجی بهرام
        </div>
      </div>
    </div>
  )
}