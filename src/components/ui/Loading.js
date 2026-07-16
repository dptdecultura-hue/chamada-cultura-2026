// src/components/ui/Loading.js
'use client'

export default function Loading({ mensagem = 'Carregando...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner animado */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🎵</span>
          </div>
        </div>
        {/* Texto */}
        <p className="text-sm font-black uppercase text-gray-500 tracking-wider animate-pulse">
          {mensagem}
        </p>
        {/* Barra de progresso animada */}
        <div className="w-48 h-1 bg-gray-200 overflow-hidden border border-black">
          <div className="h-full bg-black animate-loading-bar"></div>
        </div>
      </div>

      {/* Estilos da animação */}
      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
