import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { password, isActive, role, employeeId, permissions } = body

    const data: any = {}
    
    if (password) {
      if (password.length < 4) {
        return NextResponse.json({ success: false, error: 'رمز باید حداقل 4 کاراکتر باشد' }, { status: 400 })
      }
      data.password = await bcrypt.hash(password, 10)
    }
    if (typeof isActive === 'boolean') data.isActive = isActive
    if (role) data.role = role
    if (employeeId !== undefined) {
      data.employeeId = employeeId ? Number(employeeId) : null
    }
    
    // 👈 ذخیره دسترسی‌ها در دیتابیس
    if (permissions && Array.isArray(permissions)) {
      data.permissions = permissions
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data,
    })

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({ where: { id: Number(id) } })

    if (user?.username === 'admin') {
      return NextResponse.json({ success: false, error: 'کاربر admin را نمی‌توان حذف کرد' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id: Number(id) } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}