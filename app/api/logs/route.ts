import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit')) || 100

    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { 
          select: { 
            username: true, 
            role: true, 
            employee: { select: { fullName: true } } 
          } 
        }
      }
    })
    return NextResponse.json({ success: true, logs })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}