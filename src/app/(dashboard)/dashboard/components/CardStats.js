// src/app/(dashboard)/dashboard/components/CardStats.js
'use client'

export default function CardStats({ titulo, valor, cor, icone }) {
  return (
    <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000] text-center">
      <div className={`text-4xl font-black ${cor}`}>{valor}</div>
      <div className="text-[10px] font-black uppercase mt-1">{icone} {titulo}</div>
    </div>
  )
}
