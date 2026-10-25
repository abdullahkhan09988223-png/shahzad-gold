import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')

    const where = customerId ? { customerId: Number(customerId) } : {}

    const guarantors = await prisma.guarantor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, fullName: true } },
      },
    })
    return NextResponse.json({ success: true, guarantors })
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
    const { customerId, fullName, phone, nationalId, address, relation, notes } = body

    if (!customerId || !fullName || !phone) {
      return NextResponse.json(
        { success: false, error: 'مشتری، نام و تلفن ضامن الزامی است' },
        { status: 400 }
      )
    }

    const guarantor = await prisma.guarantor.create({
      data: {
        customerId: Number(customerId),
        fullName,
        phone,
        nationalId: nationalId || null,
        address: address || null,
        relation: relation || null,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, guarantor }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}