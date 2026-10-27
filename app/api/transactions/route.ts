import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type')
    const metal = searchParams.get('metal')
    const customerId = searchParams.get('customerId')
    const hideLinked = searchParams.get('hideLinked') === 'true' // 👈 پارامتر جدید

    const where: any = { status: { not: 'CANCELLED' } }
    
    if (hideLinked) {
      where.linkedTradeId = null // فقط معاملاتی که به ترید لینک نیستند
    }
    
    if (from || to) {
      where.transactionDate = {}
      if (from) where.transactionDate.gte = new Date(from + 'T00:00:00.000Z')
      if (to) where.transactionDate.lte = new Date(to + 'T23:59:59.999Z')
    }
    
    if (type) where.type = type
    if (metal) where.metal = metal
    if (customerId) where.customerId = Number(customerId)

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      include: { customer: true, employee: true, linkedTrade: true, partners: true },
    })
    
    return NextResponse.json({ success: true, transactions })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { 
      customerId, employeeId, type, metal, unit, quantity, 
      ayar, standardWeight, deliveryDate, 
      pricePerUnitUsd, usdRate, commission, paymentMethod, paymentStatus, paidUsd, notes,
      linkedTradeId, partners
    } = body

    if (!customerId) {
      return NextResponse.json({ success: false, error: 'انتخاب مشتری الزامی است' }, { status: 400 })
    }

    const numQty = Number(quantity) || 0
    const numPrice = Number(pricePerUnitUsd) || 0
    const numRate = Number(usdRate) || 1 
    
    const subtotalUsd = numQty * numPrice
    const comm = Number(commission) || 0
    const totalUsd = subtotalUsd
    
    const paid = paymentMethod === 'WALLET' ? totalUsd : (paymentStatus === 'PAID' ? totalUsd : (Number(paidUsd) || 0))
    const remainingUsd = totalUsd - paid
    
    const count = await prisma.transaction.count()
    const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}-${Date.now().toString().slice(-4)}`

    const usdBalanceChange = type === 'SELL' || type === 'PRE_SELL' ? remainingUsd : -remainingUsd
    const metalAmount = metal === 'GOLD' ? Number(standardWeight || quantity) : Number(quantity)
    const metalBalanceChange = type === 'SELL' || type === 'PRE_SELL' ? -metalAmount : metalAmount

    const result = await prisma.$transaction(async (tx) => {
      
      const transaction = await tx.transaction.create({
        data: {
          invoiceNumber, customerId: Number(customerId),
          employeeId: (employeeId && employeeId !== '') ? Number(employeeId) : undefined, 
          type, metal, unit, quantity: numQty,
          ayar: ayar ? Number(ayar) : null, standardWeight: standardWeight ? Number(standardWeight) : null,
          deliveryDate: (deliveryDate && deliveryDate !== '') ? new Date(deliveryDate) : null,
          pricePerUnitUsd: numPrice, pricePerUnitAfn: numPrice * numRate, usdRate: numRate,
          totalUsd, totalAfn: totalUsd * numRate, commission: comm,
          paymentMethod, paymentStatus: paymentMethod === 'WALLET' ? 'PAID' : paymentStatus,
          paidUsd: paid, paidAfn: paid * numRate, remainingUsd, remainingAfn: remainingUsd * numRate,
          notes: notes || null, linkedTradeId: linkedTradeId ? Number(linkedTradeId) : null,
        }
      })

      let updateData: any = {}
      if (paymentMethod === 'WALLET') updateData.balanceUsd = { increment: paid } 
      else if (remainingUsd !== 0) updateData.balanceUsd = { increment: usdBalanceChange }
      if (metal === 'GOLD') updateData.balanceGoldGram = { increment: metalBalanceChange }
      else if (metal === 'SILVER') updateData.balanceSilverGram = { increment: metalBalanceChange }

      if (Object.keys(updateData).length > 0) await tx.customer.update({ where: { id: Number(customerId) }, data: updateData })

      await tx.customerLedger.create({
        data: {
          customerId: Number(customerId),
          type: paymentMethod === 'WALLET' ? 'WALLET_PAYMENT' : 'TRANSACTION',
          referenceId: transaction.id,
          description: paymentMethod === 'WALLET' ? `پرداخت از کیف پول بابت فاکتور ${invoiceNumber}` : `فاکتور ${type === 'SELL' || type === 'PRE_SELL' ? 'فروش' : 'خرید'} شماره ${invoiceNumber}`,
          debitUsd: (type === 'SELL' || type === 'PRE_SELL') ? (paymentMethod === 'WALLET' ? paid : remainingUsd) : 0,
          creditUsd: (type === 'BUY' || type === 'PRE_BUY') ? remainingUsd : 0,
          goldAmount: metal === 'GOLD' ? metalBalanceChange : 0,
          silverAmount: metal === 'SILVER' ? metalBalanceChange : 0,
        }
      })

      if (partners && partners.length > 0) {
        for (const p of partners) {
          await tx.transactionPartner.create({
            data: { transactionId: transaction.id, partnerId: Number(p.partnerId), sharePercentage: Number(p.sharePercentage), profitLossShare: (Number(commission) || 0) * (Number(p.sharePercentage) / 100) }
          })
        }
      }
      return transaction
    })

    return NextResponse.json({ success: true, transaction: result })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}