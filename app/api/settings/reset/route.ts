import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function POST() {
  try {
    // پاک کردن تمام جداول به ترتیب وابستگی (تا خطای Foreign Key ندهد)
    await prisma.$transaction([
      prisma.payment.deleteMany(),
      prisma.transactionPartner.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.trade.deleteMany(),
      prisma.expense.deleteMany(),
      prisma.cashBox.deleteMany(),
      prisma.inventoryAdjustment.deleteMany(),
      prisma.salaryPayment.deleteMany(),
      prisma.guarantor.deleteMany(),
      prisma.reminder.deleteMany(),
      prisma.customer.deleteMany(),
      prisma.partner.deleteMany(),
      prisma.metalRate.deleteMany(),
      prisma.activityLog.deleteMany(),
      // 👈 جدول User و Employee را پاک نمی‌کنیم تا ادمین از سیستم بیرون نیفتد
    ])

    return NextResponse.json({ success: true, message: 'تمام اطلاعات با موفقیت حذف شد' })
  } catch (error) {
    console.error('Reset DB Error:', error)
    return NextResponse.json({ success: false, error: 'خطا در پاکسازی دیتابیس' }, { status: 500 })
  }
}