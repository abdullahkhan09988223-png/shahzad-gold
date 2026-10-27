import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
      include: { customer: true, employee: true, linkedTrade: true, partners: { include: { partner: true } }, payments: true }
    })
    if (!transaction) return NextResponse.json({ success: false, error: 'معامله یافت نشد' }, { status: 404 })
    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const txId = Number(id)
    const body = await request.json()

    const oldTx = await prisma.transaction.findUnique({ where: { id: txId } })
    if (!oldTx) return NextResponse.json({ success: false, error: 'معامله یافت نشد' }, { status: 404 })

    const { 
      customerId, employeeId, type, metal, unit, quantity, 
      ayar, standardWeight, deliveryDate, 
      pricePerUnitUsd, usdRate, commission, paymentMethod, paymentStatus, paidUsd, notes,
      linkedTradeId, partners, transactionDate
    } = body

    const numQty = Number(quantity) || 0
    const numPrice = Number(pricePerUnitUsd) || 0
    const numRate = Number(usdRate) || 1 
    
    const subtotalUsd = numQty * numPrice
    const comm = Number(commission) || 0
    const totalUsd = subtotalUsd
    
    const paid = paymentMethod === 'WALLET' ? totalUsd : (paymentStatus === 'PAID' ? totalUsd : (Number(paidUsd) || 0))
    const remainingUsd = totalUsd - paid

    const result = await prisma.$transaction(async (tx) => {
      
      // ۱. برگرداندن اثرات مالی قبلی به مشتری قدیمی
      let revertUsd = 0
      if (oldTx.paymentMethod !== 'WALLET' && Number(oldTx.remainingUsd) > 0) {
        revertUsd = (oldTx.type === 'SELL' || oldTx.type === 'PRE_SELL') ? -Number(oldTx.remainingUsd) : Number(oldTx.remainingUsd)
      } else if (oldTx.paymentMethod === 'WALLET') {
        revertUsd = Number(oldTx.paidUsd)
      }
      
      const oldMetalAmt = oldTx.metal === 'GOLD' ? Number(oldTx.standardWeight || oldTx.quantity) : Number(oldTx.quantity)
      let revertMetal = (oldTx.type === 'SELL' || oldTx.type === 'PRE_SELL') ? oldMetalAmt : -oldMetalAmt

      let oldUpdateData: any = {}
      if (revertUsd !== 0) oldUpdateData.balanceUsd = { increment: revertUsd }
      if (oldTx.metal === 'GOLD' && revertMetal !== 0) oldUpdateData.balanceGoldGram = { increment: revertMetal }
      if (oldTx.metal === 'SILVER' && revertMetal !== 0) oldUpdateData.balanceSilverGram = { increment: revertMetal }

      if (Object.keys(oldUpdateData).length > 0) {
        await tx.customer.update({ where: { id: oldTx.customerId }, data: oldUpdateData })
      }

      // ۲. پاک کردن لاگ‌های قدیمی
      await tx.customerLedger.deleteMany({ where: { referenceId: txId, type: { in: ['TRANSACTION', 'WALLET_PAYMENT'] } } })
      await tx.transactionPartner.deleteMany({ where: { transactionId: txId } })

      // ۳. آپدیت خود تراکنش
      const updatedTx = await tx.transaction.update({
        where: { id: txId },
        data: {
          customerId: Number(customerId),
          employeeId: (employeeId && employeeId !== '') ? Number(employeeId) : null,
          type, metal, unit,
          quantity: numQty,
          ayar: ayar ? Number(ayar) : null,
          standardWeight: standardWeight ? Number(standardWeight) : null,
          deliveryDate: (deliveryDate && deliveryDate !== '') ? new Date(deliveryDate) : null,
          transactionDate: transactionDate ? new Date(transactionDate) : oldTx.transactionDate,
          pricePerUnitUsd: numPrice,
          pricePerUnitAfn: numPrice * numRate,
          usdRate: numRate,
          totalUsd, totalAfn: totalUsd * numRate, commission: comm,
          paymentMethod,
          paymentStatus: paymentMethod === 'WALLET' ? 'PAID' : paymentStatus,
          paidUsd: paid, paidAfn: paid * numRate,
          remainingUsd, remainingAfn: remainingUsd * numRate,
          notes: notes || null,
          linkedTradeId: linkedTradeId ? Number(linkedTradeId) : null,
        }
      })

      // ۴. اعمال اثرات جدید به مشتری
      const newMetalAmt = metal === 'GOLD' ? Number(standardWeight || quantity) : Number(quantity)
      let newMetalChange = (type === 'SELL' || type === 'PRE_SELL') ? -newMetalAmt : newMetalAmt
      let newUsdChange = (type === 'SELL' || type === 'PRE_SELL') ? remainingUsd : -remainingUsd

      let newUpdateData: any = {}
      if (paymentMethod === 'WALLET') newUpdateData.balanceUsd = { increment: paid }
      else if (remainingUsd !== 0) newUpdateData.balanceUsd = { increment: newUsdChange }

      if (metal === 'GOLD' && newMetalChange !== 0) newUpdateData.balanceGoldGram = { increment: newMetalChange }
      if (metal === 'SILVER' && newMetalChange !== 0) newUpdateData.balanceSilverGram = { increment: newMetalChange }

      if (Object.keys(newUpdateData).length > 0) {
        await tx.customer.update({ where: { id: Number(customerId) }, data: newUpdateData })
      }

      // ۵. ایجاد لاگ جدید
      await tx.customerLedger.create({
        data: {
          customerId: Number(customerId),
          type: paymentMethod === 'WALLET' ? 'WALLET_PAYMENT' : 'TRANSACTION',
          referenceId: txId,
          description: `ویرایش فاکتور شماره ${oldTx.invoiceNumber}`,
          debitUsd: (type === 'SELL' || type === 'PRE_SELL') ? (paymentMethod === 'WALLET' ? paid : remainingUsd) : 0,
          creditUsd: (type === 'BUY' || type === 'PRE_BUY') ? remainingUsd : 0,
          goldAmount: metal === 'GOLD' ? newMetalChange : 0,
          silverAmount: metal === 'SILVER' ? newMetalChange : 0,
        }
      })

      // ۶. ثبت شرکای جدید
      if (partners && partners.length > 0) {
        for (const p of partners) {
          await tx.transactionPartner.create({
            data: {
              transactionId: txId,
              partnerId: Number(p.partnerId),
              sharePercentage: Number(p.sharePercentage),
              profitLossShare: (Number(commission) || 0) * (Number(p.sharePercentage) / 100)
            }
          })
        }
      }

      return updatedTx
    })

    return NextResponse.json({ success: true, transaction: result })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const txId = Number(id)
    const tx = await prisma.transaction.findUnique({ where: { id: txId } })
    if (!tx) return NextResponse.json({ success: false, error: 'معامله یافت نشد' }, { status: 404 })

    await prisma.$transaction(async (prismaTx) => {
      let usdRevert = 0
      if (tx.paymentMethod !== 'WALLET' && Number(tx.remainingUsd) > 0) usdRevert = (tx.type === 'SELL' || tx.type === 'PRE_SELL') ? -Number(tx.remainingUsd) : Number(tx.remainingUsd)
      else if (tx.paymentMethod === 'WALLET') usdRevert = Number(tx.paidUsd)

      const metalAmount = tx.metal === 'GOLD' ? Number(tx.standardWeight || tx.quantity) : Number(tx.quantity)
      const metalRevert = (tx.type === 'SELL' || tx.type === 'PRE_SELL') ? metalAmount : -metalAmount

      let updateData: any = {}
      if (usdRevert !== 0) updateData.balanceUsd = { increment: usdRevert }
      if (tx.metal === 'GOLD' && metalRevert !== 0) updateData.balanceGoldGram = { increment: metalRevert }
      if (tx.metal === 'SILVER' && metalRevert !== 0) updateData.balanceSilverGram = { increment: metalRevert }

      if (Object.keys(updateData).length > 0) await prismaTx.customer.update({ where: { id: tx.customerId }, data: updateData })
      
      await prismaTx.customerLedger.deleteMany({ where: { referenceId: txId, type: { in: ['TRANSACTION', 'WALLET_PAYMENT'] } } })
      await prismaTx.payment.deleteMany({ where: { transactionId: txId } })
      await prismaTx.transactionPartner.deleteMany({ where: { transactionId: txId } })
      await prismaTx.transaction.delete({ where: { id: txId } })
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}