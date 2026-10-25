import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const adjustments = await prisma.inventoryAdjustment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ success: true, adjustments })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { metal, quantity, unit, reason, notes } = body

    if (!metal || !quantity || !reason) {
      return NextResponse.json(
        { success: false, error: 'فلز، مقدار و دلیل الزامی است' },
        { status: 400 }
      )
    }

    const adj = await prisma.inventoryAdjustment.create({
      data: {
        metal,
        quantity: Number(quantity),
        unit: unit || 'GRAM',
        reason,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, adjustment: adj }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}