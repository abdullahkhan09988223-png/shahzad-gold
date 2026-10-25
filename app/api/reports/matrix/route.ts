import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    // دریافت تمام مشتریان به همراه تمام معاملاتشان
    const customers = await prisma.customer.findMany({
      include: {
        transactions: {
          where: { status: { not: 'CANCELLED' } }
        }
      },
      orderBy: { fullName: 'asc' }
    })

    // پردازش داده‌ها برای ساخت جدول اکسل
    const matrixData = customers.map(c => {
      let buyUsd = 0
      let sellUsd = 0
      let preBuyUsd = 0
      let preSellUsd = 0
      let totalProfit = 0
      let goldBalance = 0
      let silverBalance = 0

      c.transactions.forEach(tx => {
        const amount = Number(tx.totalUsd)
        const profit = Number(tx.profitLoss)
        const qty = Number(tx.standardWeight || tx.quantity)
        
        totalProfit += profit

        if (tx.type === 'BUY') {
          buyUsd += amount
          if (tx.metal === 'GOLD') goldBalance += qty
          if (tx.metal === 'SILVER') silverBalance += qty
        } else if (tx.type === 'SELL') {
          sellUsd += amount
          if (tx.metal === 'GOLD') goldBalance -= qty
          if (tx.metal === 'SILVER') silverBalance -= qty
        } else if (tx.type === 'PRE_BUY') {
          preBuyUsd += amount
        } else if (tx.type === 'PRE_SELL') {
          preSellUsd += amount
        }
      })

      // موجودی نهایی از جدول مشتری خوانده می‌شود (چون شامل کیف پول و قرضه هم هست)
      const finalBalanceUsd = Number(c.balanceUsd)

      return {
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        buyUsd,
        sellUsd,
        preBuyUsd,
        preSellUsd,
        totalProfit,
        finalBalanceUsd,
        goldBalance: Number(c.balanceGoldGram) // موجودی طلا از کیف پول
      }
    })

    return NextResponse.json({ success: true, data: matrixData })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}