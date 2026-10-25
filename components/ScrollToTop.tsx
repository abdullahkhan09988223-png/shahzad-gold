'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollToTop() {
  const pathname = usePathname()

  useEffect(() => {
    // به مرورگر میگیم که موقعیت اسکرول قبلی رو ذخیره نکنه
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    // یک تاخیر خیلی کوتاه تا مطمئن بشیم صفحه جدید کاملاً رندر شده
    setTimeout(() => {
      window.scrollTo(0, 0)
      
      const scrollables = document.querySelectorAll('.custom-scrollbar')
      scrollables.forEach((el) => {
        el.scrollTop = 0
      })
      
      const main = document.querySelector('main')
      if (main) main.scrollTop = 0
    }, 10)
  }, [pathname])

  return null
}