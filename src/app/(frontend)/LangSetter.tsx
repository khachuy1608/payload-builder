'use client'

import { useLayoutEffect } from 'react'

/** Đặt <html lang> theo ngôn ngữ của trang (layout gốc không biết đường dẫn) */
export function LangSetter({ lang }: { lang: string }) {
  useLayoutEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  return null
}
