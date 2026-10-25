import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const customerId = Number(id)
    const body = await request.json()
    const { assetType, amount, direction, description } = body

    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'مقدار وارد شده معتبر نیست' }, { status: 400 })
    }

    // direction:
    // CUSTOMER_OWES = مشتری بدهکار است (باید به ما بدهد)
    // I_OWE = ما بدهکار هستیم (باید به مشتری بدهیم)

    await prisma.$transaction(async (tx) => {
      let ledgerData: any = {
        customerId,
        type: 'DEBT_ADJUSTMENT',
        description: description || (direction === 'CUSTOMER_OWES' ? 'ثبت بدهی مشتری' : 'ثبت طلب مشتری'),
      }

      // ۱. آپدیت کیف پول مشتری
      if (assetType === 'USD') {
        // اگر مشتری بدهکار است، موجودی کیف پول (balanceUsd) مثبت می‌شود
        // اگر ما بدهکار هستیم، موجودی کیف پول منفی می‌شود
        const change = direction === 'CUSTOMER_OWES' ? numAmount : -numAmount
        await tx.customer.update({ where: { id: customerId }, data: { balanceUsd: { increment: change } } })
        
        if (direction === 'CUSTOMER_OWES') ledgerData.debitUsd = numAmount
        else ledgerData.creditUsd = numAmount

      } else if (assetType === 'GOLD') {
        const change = direction === 'CUSTOMER_OWES' ? numAmount : -numAmount
        await tx.customer.update({ where: { id: customerId }, data: { balanceGoldGram: { increment: change } } })
        ledgerData.goldAmount = change

      } else if (assetType === 'SILVER') {
        const change = direction === 'CUSTOMER_OWES' ? numAmount : -numAmount
        await tx.customer.update({ where: { id: customerId }, data: { balanceSilverGram: { increment: change } } })
        ledgerData.silverAmount = change
      }

      // ۲. ثبت در دفتر معین
      await tx.customerLedger.create({ data: ledgerData })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}