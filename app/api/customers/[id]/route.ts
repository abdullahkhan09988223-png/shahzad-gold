import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id: Number(id) },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' }
        },
        ledger: { // 👈 دریافت دفتر معین
          orderBy: { date: 'desc' }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ success: false, error: 'مشتری یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ success: true, customer })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const customer = await prisma.customer.update({
      where: { id: Number(id) },
      data: {
        fullName: body.fullName,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
        nationalId: body.nationalId || null,
        customerType: body.customerType,
        notes: body.notes || null,
      }
    })

    return NextResponse.json({ success: true, customer })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.customer.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}