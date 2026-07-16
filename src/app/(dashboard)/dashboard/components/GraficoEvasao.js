// src/app/(dashboard)/dashboard/components/GraficoEvasao.js
'use client'

export default function GraficoEvasao({ dados, titulo }) {
  const maxValor = Math.max(...dados.map(d => d.total), 1)

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000]">
      <h2 className="text-xl font-black uppercase mb-4">📈 {titulo}</h2>
      <div className="flex items-end h-48 gap-2">
        {dados.map((item, index) => {
          const altura = Math.max(10, (item.total / maxValor) * 100)
          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-red-500 rounded-t"
                style={{ height: `${altura}%`, minHeight: '10px' }}
              ></div>
              <div className="text-[10px] font-black mt-1">{item.mes}</div>
              <div className="text-[8px] font-bold text-gray-500">{item.total}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
