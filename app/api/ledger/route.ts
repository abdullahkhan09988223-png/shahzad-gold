import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type')
    const metal = searchParams.get('metal')

    const where: any = {
      status: { not: 'CANCELLED' } // 👈 معاملات باطل شده در روزنامچه نمایش داده نمی‌شوند
    }
    
    if (from || to) {
      where.transactionDate = {}
      if (from) where.transactionDate.gte = new Date(from + 'T00:00:00.000Z')
      if (to) where.transactionDate.lte = new Date(to + 'T23:59:59.999Z')
    }
    if (type && type !== 'ALL') where.type = type
    if (metal && metal !== 'ALL') where.metal = metal

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        employee: { select: { id: true, fullName: true } },
        linkedTrade: { select: { id: true } },
      },
    })

    const totalBuy = transactions
      .filter((t) => t.type === 'BUY' || t.type === 'PRE_BUY')
      .reduce((s, t) => s + Number(t.totalUsd), 0)
      
    const totalSell = transactions
      .filter((t) => t.type === 'SELL' || t.type === 'PRE_SELL')
      .reduce((s, t) => s + Number(t.totalUsd), 0)
      
    const totalPreBuy = transactions
      .filter((t) => t.type === 'PRE_BUY')
      .reduce((s, t) => s + Number(t.totalUsd), 0)
      
    const totalPreSell = transactions
      .filter((t) => t.type === 'PRE_SELL')
      .reduce((s, t) => s + Number(t.totalUsd), 0)

    let totalProfit = 0
    let totalLoss = 0
    transactions.forEach((t) => {
      const p = Number(t.profitLoss)
      if (p > 0) totalProfit += p
      if (p < 0) totalLoss += p
    })

    const totalCommission = transactions.reduce((s, t) => s + Number(t.commission), 0)
    const totalRemaining = transactions.reduce((s, t) => s + Number(t.remainingUsd), 0)

    return NextResponse.json({
      success: true,
      transactions,
      totals: {
        count: transactions.length,
        totalBuy,
        totalSell,
        totalPreBuy,
        totalPreSell,
        totalProfit,
        totalLoss,
        totalCommission,
        totalRemaining,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}