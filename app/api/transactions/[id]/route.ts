import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
      include: {
        customer: true,
        employee: true,
        payments: true,
        linkedTrade: true,
        // 👇 واکشی اطلاعات شرکا
        partners: {
          include: {
            partner: true
          }
        }
      },
    })
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'معامله یافت نشد' },
        { status: 404 }
      )
    }
    return NextResponse.json({ success: true, transaction })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
    })

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'معامله یافت نشد' },
        { status: 404 }
      )
    }

    // برگرداندن مانده به مشتری
    const customer = await prisma.customer.findUnique({
      where: { id: transaction.customerId },
    })

    if (customer) {
      await prisma.customer.update({
        where: { id: transaction.customerId },
        data: {
          balanceUsd: Number(customer.balanceUsd) - Number(transaction.remainingUsd),
          balanceAfn: Number(customer.balanceAfn) - Number(transaction.remainingAfn),
        },
      })
    }

    await prisma.transaction.delete({
      where: { id: Number(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}