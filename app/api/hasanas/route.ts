import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const hasanas = await prisma.hasana.findMany({
      orderBy: { date: 'desc' }
    })
    return NextResponse.json({ success: true, hasanas })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const hasana = await prisma.hasana.create({
      data: {
        customerName: body.customerName,
        type: body.type, // GOLD, SILVER, USD, AFN
        amount: Number(body.amount),
        direction: body.direction, // GIVEN (ما دادیم), TAKEN (ما گرفتیم)
        notes: body.notes || null,
        date: body.date ? new Date(body.date) : new Date()
      }
    })

    return NextResponse.json({ success: true, hasana })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}