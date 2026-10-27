import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

const OUNCE_TO_GRAMS = 31.1035;
const TOLA_TO_GRAMS = 12.15;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { actionType, exitOuncePrice, spreadUsd, commissionUsd, swapUsd } = body

    const trade = await prisma.trade.findUnique({ 
      where: { id: Number(id) }, 
      include: { linkedTransactions: true } 
    })
    
    if (!trade) {
      return NextResponse.json({ success: false, error: 'ترید یافت نشد' }, { status: 404 })
    }

    let grossProfit = 0
    let netProfit = 0

    if (actionType !== 'PHYSICAL') {
      const entryOunce = Number(trade.entryOuncePrice) 
      const exitOunce = Number(exitOuncePrice) 
      const lotSize = Number(trade.lotSize)
      
      const totalOunces = lotSize * 100 // 👈 ۱ لات = ۱۰۰ اونس

      if (trade.type === 'BUY') {
        grossProfit = (exitOunce - entryOunce) * totalOunces
      } else {
        grossProfit = (entryOunce - exitOunce) * totalOunces
      }

      const spread = Number(spreadUsd) || 0
      const commission = Number(commissionUsd) || 0
      const swap = Number(swapUsd) || 0
      
      netProfit = grossProfit - spread - commission - swap

      // 👇 نرخ توله کابل در لحظه بستن با فرمول دقیق 👇
      const globalTolaPrice = (exitOunce / OUNCE_TO_GRAMS) * TOLA_TO_GRAMS

      await prisma.trade.update({
        where: { id: Number(id) },
        data: {
          exitOuncePrice: exitOunce,
          exitPriceUsd: trade.metal === 'GOLD' ? globalTolaPrice : exitOunce,
          grossProfitUsd: grossProfit, spreadUsd: spread, commissionUsd: commission, swapUsd: swap, netProfitUsd: netProfit,
          status: 'CLOSED', closedAt: new Date()
        }
      })

      // 👇 محاسبه سود/ضرر معاملات فیزیکی هج شده (برای هر دو حالت) 👇
      if (trade.linkedTransactions.length > 0) {
        for (const tx of trade.linkedTransactions) {
          let physicalProfit = 0
          const txQty = Number(tx.quantity)
          const txPrice = Number(tx.pricePerUnitUsd)

          // اگر ترید BUY بوده (هج برای فروش فیزیکی)
          if (trade.type === 'BUY') {
            physicalProfit = (txPrice - globalTolaPrice) * txQty
          } 
          // اگر ترید SELL بوده (هج برای خرید فیزیکی)
          else {
            physicalProfit = (globalTolaPrice - txPrice) * txQty
          }

          await prisma.transaction.update({
            where: { id: tx.id },
            data: { profitLoss: physicalProfit }
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Close Trade Error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}