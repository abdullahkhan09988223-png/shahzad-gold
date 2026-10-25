import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      where: { isActive: true },
      include: {
        transactions: {
          where: {
            remainingUsd: { gt: 0 },
          },
          orderBy: { transactionDate: 'desc' },
        },
      },
    })

    const debtors = customers
      .filter((c) => Number(c.balanceUsd) > 0)
      .map((c) => {
        const oldestDebt =
          c.transactions.length > 0
            ? c.transactions[c.transactions.length - 1].transactionDate
            : null
        const daysSinceOldest = oldestDebt
          ? Math.floor(
              (Date.now() - new Date(oldestDebt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0
        return {
          id: c.id,
          fullName: c.fullName,
          phone: c.phone,
          address: c.address,
          balanceUsd: c.balanceUsd,
          balanceAfn: c.balanceAfn,
          unpaidTransactions: c.transactions.length,
          oldestDebtDate: oldestDebt,
          daysSinceOldest,
          totalProfit: c.totalProfit,
          totalLoss: c.totalLoss,
          reminderDate: c.reminderDate,
        }
      })
      .sort((a, b) => b.daysSinceOldest - a.daysSinceOldest)

    const totals = {
      count: debtors.length,
      totalUsd: debtors.reduce((s, d) => s + Number(d.balanceUsd), 0),
      totalAfn: debtors.reduce((s, d) => s + Number(d.balanceAfn), 0),
      overdue: debtors.filter((d) => d.daysSinceOldest > 30).length,
    }

    return NextResponse.json({ success: true, debtors, totals })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}