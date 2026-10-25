import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setDate(yesterdayStart.getDate() - 1)

    // واکشی معاملات
    const [todayTx, yesterdayTx] = await Promise.all([
      prisma.transaction.findMany({ where: { transactionDate: { gte: todayStart, lt: todayEnd }, status: { not: 'CANCELLED' } }, include: { partners: true } }),
      prisma.transaction.findMany({ where: { transactionDate: { gte: yesterdayStart, lt: todayStart }, status: { not: 'CANCELLED' } }, include: { partners: true } }),
    ])

    // 👇 واکشی مصارف امروز و دیروز 👇
    const [todayExpenses, yesterdayExpenses] = await Promise.all([
      prisma.expense.findMany({ where: { date: { gte: todayStart, lt: todayEnd } } }),
      prisma.expense.findMany({ where: { date: { gte: yesterdayStart, lt: todayStart } } }),
    ])

    const calc = (txs: any[], expenses: any[]) => {
      const sell = txs.filter((t) => t.type === 'SELL' || t.type === 'PRE_SELL').reduce((s, t) => s + Number(t.totalUsd), 0)
      const buy = txs.filter((t) => t.type === 'BUY' || t.type === 'PRE_BUY').reduce((s, t) => s + Number(t.totalUsd), 0)
      
      let grossProfit = 0
      txs.forEach(t => {
        const partnerShare = t.partners?.reduce((sum: number, p: any) => sum + Number(p.profitLossShare), 0) || 0
        grossProfit += Number(t.profitLoss) - partnerShare
      })

      // 👇 کسر کردن مصارف از سود 👇
      const totalExpense = expenses.reduce((s, e) => s + Number(e.amountUsd), 0)
      const netProfit = grossProfit - totalExpense

      return { count: txs.length, sell, buy, profit: netProfit, expense: totalExpense }
    }

    const todayData = calc(todayTx, todayExpenses)
    const yesterdayData = calc(yesterdayTx, yesterdayExpenses)

    // ... (بقیه کدهای مربوط به نرخ، شمارش مشتریان، لاگ‌ها و نمودار دقیقاً مثل قبل باشد)
    const latestRate = await prisma.metalRate.findFirst({ orderBy: { dateTime: 'desc' } })
    const [customerCount, employeeCount] = await Promise.all([
      prisma.customer.count({ where: { isActive: true } }),
      prisma.employee.count({ where: { isActive: true } }),
    ])
    const lastCashBox = await prisma.cashBox.findFirst({ orderBy: { date: 'desc' } })
    const customers = await prisma.customer.findMany({ select: { balanceUsd: true } })
    const totalDebt = customers.reduce((s, c) => s + (Number(c.balanceUsd) > 0 ? Number(c.balanceUsd) : 0), 0)

    const recentLogs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: { select: { username: true, role: true, employee: { select: { fullName: true } } } } }
    })

    const days = 7
    const chartData: any[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(todayStart)
      d.setDate(d.getDate() - i)
      const dEnd = new Date(d)
      dEnd.setDate(dEnd.getDate() + 1)
      
      const dayTx = await prisma.transaction.findMany({ where: { transactionDate: { gte: d, lt: dEnd }, status: { not: 'CANCELLED' } }, include: { partners: true } })
      const dayExp = await prisma.expense.findMany({ where: { date: { gte: d, lt: dEnd } } })
      
      const total = dayTx.reduce((s, t) => s + Number(t.totalUsd), 0)
      
      let dayGrossProfit = 0
      dayTx.forEach(t => {
        const partnerShare = t.partners?.reduce((sum: number, p: any) => sum + Number(p.profitLossShare), 0) || 0
        dayGrossProfit += Number(t.profitLoss) - partnerShare
      })
      
      const dayExpTotal = dayExp.reduce((s, e) => s + Number(e.amountUsd), 0)
      const dayNetProfit = dayGrossProfit - dayExpTotal

      chartData.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
        total,
        profit: dayNetProfit,
        count: dayTx.length,
      })
    }

    const allTx = await prisma.transaction.findMany({ where: { status: { not: 'CANCELLED' } } })
    let goldTola = 0
    let silverKg = 0

    allTx.forEach((t) => {
      const q = Number(t.quantity)
      const tolaVal = t.unit === 'TOLA' ? q : t.unit === 'GRAM' ? q / 12.15 : t.unit === 'MASHA' ? q / 2.5 : q * 82.304
      const kgVal = t.unit === 'KG' ? q : t.unit === 'GRAM' ? q / 1000 : t.unit === 'TOLA' ? (q * 12.15) / 1000 : (q * 4.6083) / 1000
      const isBuySide = t.type === 'BUY' || t.type === 'PRE_BUY'
      const isSellSide = t.type === 'SELL' || t.type === 'PRE_SELL'
      if (t.metal === 'GOLD') {
        if (isBuySide) goldTola += tolaVal
        if (isSellSide) goldTola -= tolaVal
      } else {
        if (isBuySide) silverKg += kgVal
        if (isSellSide) silverKg -= kgVal
      }
    })

    return NextResponse.json({
      success: true,
      today: todayData,
      yesterday: yesterdayData,
      rate: latestRate ? {
        usdToAfn: latestRate.usdToAfn,
        goldBuyPerTolaUsd: latestRate.goldBuyPerTolaUsd,
        goldSellPerTolaUsd: latestRate.goldSellPerTolaUsd,
        silverBuyPerKgUsd: latestRate.silverBuyPerKgUsd,
        silverSellPerKgUsd: latestRate.silverSellPerKgUsd,
        dateTime: latestRate.dateTime,
      } : null,
      counts: { customers: customerCount, employees: employeeCount },
      cashBox: lastCashBox ? { date: lastCashBox.date, closingUsd: lastCashBox.closingUsd } : null,
      totalDebt,
      chartData,
      recentLogs: recentLogs.map(log => ({
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        user: log.user
      })),
      balances: {
        goldTola,
        silverKg,
        cashUsd: todayData.sell - todayData.buy,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}