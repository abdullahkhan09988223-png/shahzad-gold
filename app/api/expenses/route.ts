import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({ 
      orderBy: { date: 'desc' } 
    })
    return NextResponse.json({ success: true, expenses })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const expense = await prisma.expense.create({
      data: {
        category: body.category,
        amountUsd: Number(body.amountUsd),
        description: body.description || null,
        date: body.date ? new Date(body.date) : new Date()
      }
    })
    return NextResponse.json({ success: true, expense })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}