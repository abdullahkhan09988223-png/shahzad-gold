export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = { status: { not: 'CANCELLED' } }
    if (from || to) {
      where.transactionDate = {}
      if (from) where.transactionDate.gte = new Date(from + 'T00:00:00.000Z')
      if (to) where.transactionDate.lte = new Date(to + 'T23:59:59.999Z')
    }

    // 👇 ۱. دیتابیس خودش محاسبات را انجام می‌دهد (بسیار سریع) 👇
    const grouped = await prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: {
        totalUsd: true,
        profitLoss: true,
        commission: true,
        remainingUsd: true,
      },
      _count: true
    })

    let totalSellUsd = 0, totalBuyUsd = 0
    let totalProfit = 0, totalLoss = 0
    let totalCommission = 0, totalUnpaid = 0
    let transactionCount = 0

    grouped.forEach(g => {
      transactionCount += g._count
      const sumUsd = Number(g._sum.totalUsd || 0)
      const sumProfit = Number(g._sum.profitLoss || 0)
      
      totalCommission += Number(g._sum.commission || 0)
      totalUnpaid += Number(g._sum.remainingUsd || 0)

      if (g.type === 'SELL' || g.type === 'PRE_SELL') totalSellUsd += sumUsd
      if (g.type === 'BUY' || g.type === 'PRE_BUY') totalBuyUsd += sumUsd
      
      if (sumProfit > 0) totalProfit += sumProfit
      if (sumProfit < 0) totalLoss += sumProfit
    })

    // 👇 ۲. فقط ۵۰ معامله آخر را برای نمایش در جدول می‌گیریم (برای جلوگیری از فریز شدن مرورگر) 👇
    const recentTxs = await prisma.transaction.findMany({
      where,
      take: 50, // فقط 50 رکورد!
      orderBy: { transactionDate: 'desc' },
      include: { customer: { select: { fullName: true } } }
    })

    return NextResponse.json({
      success: true,
      summary: {
        transactionCount,
        totalSellUsd,
        totalBuyUsd,
        totalProfit,
        totalLoss,
        netProfit: totalProfit + totalLoss,
        totalCommission,
        totalUnpaid,
      },
      transactions: recentTxs.map(tx => ({
        id: tx.id,
        invoiceNumber: tx.invoiceNumber,
        date: tx.transactionDate.toISOString(),
        customerName: tx.customer.fullName,
        type: tx.type,
        metal: tx.metal,
        quantity: Number(tx.quantity),
        unit: tx.unit,
        totalUsd: Number(tx.totalUsd),
        profitLoss: Number(tx.profitLoss),
        paymentStatus: tx.paymentStatus
      }))
    })
  } catch (error) {
    console.error("Reports API Error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}