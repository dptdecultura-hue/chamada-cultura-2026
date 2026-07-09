// src/app/page.js
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    router.push('/menu')
  }, [router])

  return (
    <div className="h-screen flex items-center justify-center">
      <p className="text-lg font-bold">Redirecionando...</p>
    </div>
  )
}
