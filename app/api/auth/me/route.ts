import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-me')
    const { payload } = await jwtVerify(token, secret)

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      include: { employee: true }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true, 
      user: { id: user.id, username: user.username, role: user.role, employeeName: user.employee?.fullName || null, permissions: user.permissions || [] }
    })
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 401 })
  }
}