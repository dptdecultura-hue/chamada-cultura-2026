// src/app/(dashboard)/dashboard/components/GraficoOcupacao.js
'use client'

export default function GraficoOcupacao({ dados, titulo }) {
  return (
    <div className="bg-white border-4 border-black p-6 shadow-[4px_4px_0px_#000]">
      <h2 className="text-xl font-black uppercase mb-4">🏆 {titulo}</h2>
      <div className="space-y-2">
        {dados.map((item, index) => {
          const cor = item.percentual >= 90 ? 'bg-red-500' : item.percentual >= 70 ? 'bg-yellow-500' : 'bg-green-500'
          return (
            <div key={index} className="flex items-center gap-4">
              <span className="text-xs font-black w-32 truncate">{item.nome}</span>
              <div className="flex-1 h-6 bg-gray-200 border border-black">
                <div 
                  className={`h-full ${cor} flex items-center justify-end px-2 text-xs font-black text-white`}
                  style={{ width: `${Math.min(item.percentual, 100)}%` }}
                >
                  {item.percentual}%
                </div>
              </div>
              <span className="text-xs font-black w-16 text-right">{item.alunos}/{item.limite}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
