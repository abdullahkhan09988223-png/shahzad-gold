import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const customerId = Number(id)
    const body = await request.json()
    const { actionType, assetType, amount, description } = body 
    // actionType: DEPOSIT (واریز) یا WITHDRAW (برداشت)

    const numAmount = Number(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'مبلغ نامعتبر است' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({ where: { id: customerId } })
      if (!customer) throw new Error('مشتری یافت نشد')

      let updateData: any = {}
      let ledgerData: any = {
        customerId,
        type: actionType,
        description: description || (actionType === 'DEPOSIT' ? 'واریز به حساب' : 'برداشت از حساب'),
        debitUsd: 0,
        creditUsd: 0,
        goldAmount: 0,
        silverAmount: 0
      }

      if (assetType === 'USD') {
        // واریز: مشتری طلبکار می‌شود (بالانس منفی)
        // برداشت: مشتری بدهکار می‌شود (بالانس مثبت)
        const change = actionType === 'DEPOSIT' ? -numAmount : numAmount
        updateData.balanceUsd = { increment: change }
        
        if (actionType === 'DEPOSIT') ledgerData.creditUsd = numAmount
        else ledgerData.debitUsd = numAmount

      } else if (assetType === 'GOLD') {
        const change = actionType === 'DEPOSIT' ? -numAmount : numAmount 
        updateData.balanceGoldGram = { increment: change }
        ledgerData.goldAmount = actionType === 'DEPOSIT' ? numAmount : -numAmount
        ledgerData.description = `${actionType === 'DEPOSIT' ? 'واریز' : 'برداشت'} ${numAmount} توله طلا - ${description || ''}`

      } else if (assetType === 'SILVER') {
        const change = actionType === 'DEPOSIT' ? -numAmount : numAmount 
        updateData.balanceSilverGram = { increment: change }
        ledgerData.silverAmount = actionType === 'DEPOSIT' ? numAmount : -numAmount
        ledgerData.description = `${actionType === 'DEPOSIT' ? 'واریز' : 'برداشت'} ${numAmount} گرم نقره - ${description || ''}`
      }

      await tx.customer.update({
        where: { id: customerId },
        data: updateData
      })

      await tx.customerLedger.create({
        data: ledgerData
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}