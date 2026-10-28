import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    // 👇 دریافت نرخ کابل دستی از فرانت‌اند 👇
    const { actionType, exitOuncePrice, kabulRate, spreadUsd, commissionUsd, swapUsd } = body

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
      
      const totalOunces = lotSize * 100

      if (trade.type === 'BUY') {
        grossProfit = (exitOunce - entryOunce) * totalOunces
      } else {
        grossProfit = (entryOunce - exitOunce) * totalOunces
      }

      const spread = Number(spreadUsd) || 0
      const commission = Number(commissionUsd) || 0
      const swap = Number(swapUsd) || 0
      
      netProfit = grossProfit - spread - commission - swap

      // نرخ توله محاسبه شده از اونس
      const calculatedTolaPrice = (exitOunce / 31.1035) * 12.15
      
      // 👇 اگر کاربر نرخ کابل دستی وارد کرده باشد، از آن استفاده میکنیم 👇
      const finalKabulPrice = kabulRate ? Number(kabulRate) : calculatedTolaPrice

      await prisma.trade.update({
        where: { id: Number(id) },
        data: {
          exitOuncePrice: exitOunce,
          exitPriceUsd: trade.metal === 'GOLD' ? finalKabulPrice : exitOunce, // ثبت نرخ کابل دستی
          grossProfitUsd: grossProfit,
          spreadUsd: spread,
          commissionUsd: commission,
          swapUsd: swap,
          netProfitUsd: netProfit,
          status: 'CLOSED',
          closedAt: new Date()
        }
      })

      if (trade.linkedTransactions.length > 0) {
        for (const tx of trade.linkedTransactions) {
          let physicalProfit = 0
          const txQty = Number(tx.quantity)
          const txPrice = Number(tx.pricePerUnitUsd)

          // 👇 محاسبه سود فیزیکی بر اساس نرخ کابلِ دستیِ وارد شده 👇
          if (trade.type === 'BUY') {
            physicalProfit = (txPrice - finalKabulPrice) * txQty
          } else {
            physicalProfit = (finalKabulPrice - txPrice) * txQty
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