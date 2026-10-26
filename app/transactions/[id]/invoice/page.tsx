'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Printer, ArrowRight } from 'lucide-react'

type Transaction = {
  id: number
  invoiceNumber: string
  type: string
  metal: string
  unit: string
  quantity: string
  ayar: string | null
  standardWeight: string | null
  pricePerUnitUsd: string
  totalUsd: string
  commission: string
  paidUsd: string
  remainingUsd: string
  paymentMethod: string
  paymentStatus: string
  transactionDate: string
  notes: string | null
  customer: { fullName: string; phone: string }
  employee: { fullName: string } | null
}

function InvoiceContent() {
  const params = useParams()
  const id = params.id as string
  const [tx, setTx] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
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
    load()
  }, [id])

  const fmt = (n: string | number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtQty = (n: string | number) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold">در حال آماده‌سازی فاکتور...</div>
  if (!tx) return <div className="min-h-screen flex items-center justify-center text-red-500 font-bold">فاکتور یافت نشد</div>

  const unitLabel = tx.unit === 'TOLA' ? 'توله' : tx.unit === 'GRAM' ? 'گرام' : tx.unit === 'KG' ? 'کیلوگرام' : 'ماشا'
  const typeLabel = tx.type === 'BUY' || tx.type === 'PRE_BUY' ? 'خرید' : 'فروش'
  const metalLabel = tx.metal === 'GOLD' ? 'طلا' : 'نقره'

  return (
    <div className="min-h-screen bg-gray-100 text-black py-10 print:py-0 print:bg-white" dir="rtl">
      
      {/* 👇 دکمه‌های بالای صفحه (در پرینت مخفی می‌شوند) 👇 */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden px-4">
        <button onClick={() => window.close()} className="flex items-center gap-2 text-gray-600 hover:text-black transition font-bold">
          <ArrowRight size={20} /> بستن صفحه
        </button>
        <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition">
          <Printer size={20} /> چاپ فاکتور (Print)
        </button>
      </div>

      {/* 👇 برگه A4 فاکتور 👇 */}
      <div className="max-w-[210mm] mx-auto bg-white p-10 shadow-xl print:shadow-none print:p-0 print:m-0">
        
        {/* هدر فاکتور */}
        <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">SHAHZAD GOLD</h1>
            <p className="text-gray-500 text-sm mt-1 font-medium" dir="ltr">TRUST IN EVERY TRADE</p>
            <div className="mt-4 text-sm text-gray-700 space-y-1">
              <p>کابل، افغانستان</p>
              <p dir="ltr">+93 70 000 0000</p>
            </div>
          </div>
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">فاکتور رسمی</h2>
            <div className="text-sm space-y-1 text-gray-700">
              <p><span className="font-bold">شماره:</span> <span className="font-mono">{tx.invoiceNumber}</span></p>
              <p><span className="font-bold">تاریخ:</span> {new Date(tx.transactionDate).toLocaleDateString('fa-IR')}</p>
              <p><span className="font-bold">نوعیت:</span> <span className={typeLabel === 'خرید' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{typeLabel}</span></p>
            </div>
          </div>
        </div>

        {/* اطلاعات مشتری */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-8 flex justify-between items-center print:bg-white print:border-gray-300">
          <div>
            <p className="text-xs text-gray-500 mb-1">صادر شده برای:</p>
            <p className="font-bold text-lg">{tx.customer.fullName}</p>
            <p className="text-sm text-gray-600" dir="ltr">{tx.customer.phone}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500 mb-1">ثبت کننده:</p>
            <p className="font-bold text-sm">{tx.employee?.fullName || 'سیستم'}</p>
          </div>
        </div>

        {/* جدول اقلام */}
        <table className="w-full mb-8 border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white print:bg-gray-200 print:text-black">
              <th className="p-3 text-right text-sm rounded-tr-lg">شرح کالا</th>
              <th className="p-3 text-center text-sm">مقدار / وزن</th>
              <th className="p-3 text-center text-sm">عیار</th>
              <th className="p-3 text-center text-sm">قیمت واحد ($)</th>
              <th className="p-3 text-left text-sm rounded-tl-lg">جمع کل ($)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="p-4 text-right">
                <p className="font-bold">{metalLabel} {typeLabel === 'خرید' ? '(خریداری شده)' : '(فروخته شده)'}</p>
              </td>
              <td className="p-4 text-center" dir="ltr">
                <span className="font-bold">{fmtQty(tx.quantity)}</span> <span className="text-xs text-gray-500">{unitLabel}</span>
              </td>
              <td className="p-4 text-center">{tx.ayar || '-'}</td>
              <td className="p-4 text-center" dir="ltr">${fmt(tx.pricePerUnitUsd)}</td>
              <td className="p-4 text-left font-bold" dir="ltr">${fmt(tx.totalUsd)}</td>
            </tr>
            {tx.standardWeight && (
              <tr className="border-b border-gray-200 text-sm text-gray-500">
                <td colSpan={5} className="p-2 text-right text-xs">
                  * وزن معادل عیار استاندارد (کابل ۲۳.۸۸): {fmtQty(tx.standardWeight)} گرم
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* خلاصه مالی */}
        <div className="flex justify-end mb-10">
          <div className="w-1/2 md:w-1/3 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>جمع کل:</span>
              <span className="font-bold text-black" dir="ltr">${fmt(tx.totalUsd)}</span>
            </div>
            {Number(tx.commission) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>کمیشن:</span>
                <span className="font-bold text-black" dir="ltr">${fmt(tx.commission)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-green-600">
              <span>پرداخت شده:</span>
              <span className="font-bold" dir="ltr">${fmt(tx.paidUsd)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold border-t-2 border-gray-800 pt-3">
              <span>باقی‌مانده:</span>
              <span className={Number(tx.remainingUsd) > 0 ? 'text-red-600' : 'text-gray-800'} dir="ltr">
                ${fmt(tx.remainingUsd)}
              </span>
            </div>
          </div>
        </div>

        {/* یادداشت */}
        {tx.notes && (
          <div className="mb-10 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-200 print:bg-white print:border-gray-300">
            <span className="font-bold text-black">یادداشت: </span> {tx.notes}
          </div>
        )}

        {/* فوتر (امضاها) */}
        <div className="flex justify-between items-end mt-20 pt-8 border-t border-gray-300">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-8">امضای مشتری</p>
            <div className="w-40 border-b border-gray-400"></div>
          </div>
          <div className="text-center text-xs text-gray-400">
            <p>این فاکتور به صورت سیستمی صادر شده است.</p>
            <p className="mt-1">با تشکر از معامله شما - SHAHZAD GOLD</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-8">مهر و امضای فروشگاه</p>
            <div className="w-40 border-b border-gray-400"></div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold">در حال آماده‌سازی فاکتور...</div>}>
      <InvoiceContent />
    </Suspense>
  )
}