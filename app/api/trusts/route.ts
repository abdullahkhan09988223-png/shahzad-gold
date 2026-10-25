import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const trusts = await prisma.trust.findMany({
      orderBy: { date: 'desc' }
    })
    return NextResponse.json({ success: true, trusts })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const trust = await prisma.trust.create({
      data: {
        customerName: body.customerName,
        type: body.type, // GOLD, SILVER, USD, AFN
        amount: Number(body.amount),
        direction: body.direction, // IN (پیش ما امانت است), OUT (ما پیش کسی امانت گذاشتیم)
        notes: body.notes || null,
        date: body.date ? new Date(body.date) : new Date()
      }
    })

    return NextResponse.json({ success: true, trust })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}