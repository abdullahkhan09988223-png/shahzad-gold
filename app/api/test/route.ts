import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    const customers = await prisma.customer.findMany()
    return NextResponse.json({ 
      success: true, 
      count: customers.length,
      customers 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 })
  }
}