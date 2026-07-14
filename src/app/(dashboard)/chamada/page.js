// src/app/(dashboard)/chamada/page.js
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChamadaRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/menu')
  }, [router])
  
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="bg-white border-4 border-black p-8 max-w-md w-full shadow-[8px_8px_0px_#000] text-center">
        <h1 className="text-2xl font-black uppercase mb-4">⏳ Redirecionando...</h1>
        <p className="text-gray-500">Aguarde um momento</p>
      </div>
    </div>
  )
}
