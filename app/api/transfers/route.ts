import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { debtorId, creditorId, amount, assetType, notes } = body

    if (!debtorId || !creditorId || !amount || !assetType) {
      return NextResponse.json({ success: false, error: 'تمام اطلاعات الزامی است' }, { status: 400 })
    }

    const numAmount = Number(amount)

    if (debtorId === creditorId) {
      return NextResponse.json({ success: false, error: 'مشتری بدهکار و طلبکار نمی‌توانند یکی باشند' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // تنظیمات فیلدها بر اساس نوع دارایی
      let field: any = 'balanceUsd'
      if (assetType === 'GOLD') field = 'balanceGoldGram'
      if (assetType === 'SILVER') field = 'balanceSilverGram'

      // ۱. کم کردن از حساب مشتری بدهکار (چون بدهی‌اش پرداخت/تهاتر شد)
      await tx.customer.update({
        where: { id: Number(debtorId) },
        data: { [field]: { decrement: numAmount } }
      })

      // ۲. اضافه کردن به حساب مشتری طلبکار
      await tx.customer.update({
        where: { id: Number(creditorId) },
        data: { [field]: { increment: numAmount } }
      })
    })

    return NextResponse.json({ success: true, message: 'انتقال با موفقیت انجام شد' })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}