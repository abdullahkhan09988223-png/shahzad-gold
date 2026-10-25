import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'

export async function GET() {
  try {
    // پاک کردن همه داده‌های قبلی (به ترتیب وابستگی‌ها)
    await prisma.payment.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.salaryPayment.deleteMany()
    await prisma.cashBox.deleteMany()
    await prisma.reminder.deleteMany()
    await prisma.guarantor.deleteMany()
    await prisma.metalRate.deleteMany()
    await prisma.inventoryAdjustment.deleteMany()
    await prisma.trade.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.employee.deleteMany()

    // ساخت کارمندان
    const emp1 = await prisma.employee.create({
      data: {
        fullName: 'احمد کریمی',
        phone: '0700123456',
        position: 'مدیر',
        hireDate: new Date('2024-01-01'),
        salaryAmount: 100000,
        salaryCurrency: 'AFN',
      },
    })

    const emp2 = await prisma.employee.create({
      data: {
        fullName: 'محمد محمدی',
        phone: '0700999888',
        position: 'فروشنده',
        hireDate: new Date('2024-06-01'),
        salaryAmount: 15000,
        salaryCurrency: 'AFN',
      },
    })

    // ساخت مشتریان
    const cust1 = await prisma.customer.create({
      data: {
        fullName: 'علی جان',
        phone: '0700555666',
        customerType: 'BUYER',
        address: 'هرات',
      },
    })

    await prisma.customer.create({
      data: {
        fullName: 'قاسم رحیمی',
        phone: '0700777888',
        customerType: 'SELLER',
        address: 'مزار شریف',
      },
    })

    // ثبت نرخ امروز با واحدهای جدید (توله و کیلو)
    await prisma.metalRate.create({
      data: {
        dateTime: new Date(),
        usdToAfn: 75,
        goldBuyPerTolaUsd: 1500,
        goldSellPerTolaUsd: 1520,
        silverBuyPerKgUsd: 30,
        silverSellPerKgUsd: 32,
      },
    })

    // ثبت یک ترید باز نمونه
    await prisma.trade.create({
      data: {
        type: 'BUY',
        metal: 'GOLD',
        lotSize: 0.5,
        entryPriceUsd: 2000,
        status: 'OPEN',
      }
    })

    // ثبت معامله نمونه (طلا با واحد توله)
    await prisma.transaction.create({
      data: {
        invoiceNumber: 'INV-TEST-001',
        customerId: cust1.id,
        employeeId: emp1.id,
        type: 'SELL',
        metal: 'GOLD',
        unit: 'TOLA',
        quantity: 2, // ۲ توله
        pricePerUnitUsd: 1520,
        pricePerUnitAfn: 1520 * 75,
        usdRate: 75,
        totalUsd: 2 * 1520,
        totalAfn: 2 * 1520 * 75,
        commission: 5,
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        paidUsd: 2 * 1520,
        paidAfn: 2 * 1520 * 75,
        profitLoss: 20 * 2 - 5, // فرض می‌کنیم نرخ خرید ۱۵۰۰ بوده
      },
    })

    return NextResponse.json({
      success: true,
      message: '✅ اطلاعات تستی با ساختار جدید اضافه شد',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}