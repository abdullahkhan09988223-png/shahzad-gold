export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'توکن یافت نشد' }, { status: 401 })
    }

    // باز کردن توکن با کلید امنیتی
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-key-change-me')
    const { payload } = await jwtVerify(token, secret)

    if (!payload || !payload.id) {
      return NextResponse.json({ success: false, error: 'توکن نامعتبر است' }, { status: 401 })
    }

    // پیدا کردن کاربر در دیتابیس
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.id) },
      include: { employee: true }
    })

    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, error: 'کاربر معتبر نیست' }, { status: 401 })
    }

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        employeeName: user.employee?.fullName || null,
        permissions: user.permissions || []
      }
    })
  } catch (error) {
    console.error("Auth Me Error:", error)
    // برگرداندن ارور 401 به جای کرش کردن سرور
    return NextResponse.json({ success: false, error: 'خطای سرور در احراز هویت' }, { status: 401 })
  }
}