import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const customerId = Number(id)
    const body = await request.json()
    const { fromAsset, toAsset, amount, rate } = body

    const numAmount = Number(amount)
    const numRate = Number(rate)

    if (!numAmount || numAmount <= 0 || !numRate || numRate <= 0) {
      return NextResponse.json({ success: false, error: 'مقادیر وارد شده معتبر نیستند' }, { status: 400 })
    }

    // محاسبه مقدار تبدیل شده
    let convertedAmount = 0
    if (fromAsset === 'USD' && toAsset === 'GOLD') {
      convertedAmount = numAmount / numRate // مثلاً 1600 دالر / 1600 = 1 توله
    } else if (fromAsset === 'GOLD' && toAsset === 'USD') {
      convertedAmount = numAmount * numRate
    } else {
      return NextResponse.json({ success: false, error: 'تبدیل این دو دارایی پشتیبانی نمی‌شود' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // ۱. کسر دارایی مبدا
      if (fromAsset === 'USD') {
        await tx.customer.update({ where: { id: customerId }, data: { balanceUsd: { decrement: numAmount } } })
      } else if (fromAsset === 'GOLD') {
        await tx.customer.update({ where: { id: customerId }, data: { balanceGoldGram: { decrement: numAmount } } })
      }

      // ۲. اضافه کردن دارایی مقصد
      if (toAsset === 'USD') {
        await tx.customer.update({ where: { id: customerId }, data: { balanceUsd: { increment: convertedAmount } } })
      } else if (toAsset === 'GOLD') {
        await tx.customer.update({ where: { id: customerId }, data: { balanceGoldGram: { increment: convertedAmount } } })
      }

      // ۳. ثبت در دفتر معین (Ledger)
      await tx.customerLedger.create({
        data: {
          customerId,
          type: 'CONVERT',
          description: `تبدیل ${fromAsset === 'USD' ? 'دالر' : 'طلا'} به ${toAsset === 'USD' ? 'دالر' : 'طلا'}`,
          debitUsd: fromAsset === 'USD' ? numAmount : 0,
          creditUsd: toAsset === 'USD' ? convertedAmount : 0,
          goldAmount: fromAsset === 'GOLD' ? -numAmount : (toAsset === 'GOLD' ? convertedAmount : 0)
        }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}