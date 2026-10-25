import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const incomes = await prisma.miscIncome.findMany({
      orderBy: { date: 'desc' }
    })
    return NextResponse.json({ success: true, incomes })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const income = await prisma.miscIncome.create({
      data: {
        title: body.title,
        amountUsd: Number(body.amountUsd),
        notes: body.notes || null,
        date: body.date ? new Date(body.date) : new Date()
      }
    })

    return NextResponse.json({ success: true, income })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}