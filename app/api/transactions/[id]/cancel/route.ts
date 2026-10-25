import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const txId = Number(id)

    const tx = await prisma.transaction.findUnique({ where: { id: txId } })
    if (!tx) return NextResponse.json({ success: false, error: 'معامله یافت نشد' }, { status: 404 })
    if (tx.status === 'CANCELLED') return NextResponse.json({ success: false, error: 'این معامله قبلا باطل شده است' }, { status: 400 })

    await prisma.$transaction(async (prisma) => {
      // ۱. تغییر وضعیت معامله به باطل شده
      await prisma.transaction.update({
        where: { id: txId },
        data: { status: 'CANCELLED' }
      })

      // ۲. برگرداندن اثر مالی روی حساب مشتری (اگر معامله نسیه یا جزئی بوده)
      // اگر سیستم فاکتور را برای مشتری بدهی ثبت کرده بود، الان بدهی را صفر میکنیم
      const remainingUsd = Number(tx.remainingUsd)
      if (remainingUsd > 0) {
        const balanceChange = tx.type === 'SELL' || tx.type === 'PRE_SELL' ? -remainingUsd : remainingUsd
        
        await prisma.customer.update({
          where: { id: tx.customerId },
          data: { balanceUsd: { increment: balanceChange } }
        })
      }
    })

    return NextResponse.json({ success: true, message: 'معامله با موفقیت باطل شد' })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}