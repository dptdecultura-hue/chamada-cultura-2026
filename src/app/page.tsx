'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// 1. LOGOS RENDERIZADAS (BASE64) - IGUAL AO SEU PREVIEW.HTML
const LOGO_PREFEITURA = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERG..." // (mantenha sua string completa)
const LOGO_CULTURA = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERG..."    // (mantenha sua string completa)

export default function CasaDaCultura2026() {
  // 2. TODA A SUA LÓGICA DE ESTADOS (CÓDIGO PERFEITO)
  const [tela, setTela] = useState('menu')
  const [profSel, setProfSel] = useState("")
  const [idAtivo, setIdAtivo] = useState(null)
  const [mes, setMes] = useState(new Date().getMonth())
  const [turmas, setTurmas] = useState([])
  const [alunosLocais, setAlunosLocais] = useState([])
  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  // --- MANTENHA AQUI SUAS FUNÇÕES ORIGINAIS (fetchDados, detectarGenero, etc.) ---

  const curso = turmas.find(t => t.id === idAtivo)

  return (
    <div className="min-h-screen bg-gray-100 p-4 print:p-0 print:bg-white font-sans">
      
      {/* TELA DE GESTÃO (SÓ NO PC) */}
      <div className="no-print mb-8">
         {/* Seus botões de filtro e lista de alunos aqui */}
         <button onClick={() => window.print()} className="bg-black text-white px-4 py-2 font-bold uppercase">Imprimir Chamada</button>
      </div>

      {/* FOLHA DE CHAMADA (SÓ NA IMPRESSÃO) */}
      <div className="hidden print:block bg-white w-[210mm] mx-auto">
        
        {/* CABEÇALHO IDÊNTICO AO PREVIEW */}
        <div className="flex items-stretch border border-black h-[110px] bg-white mb-4">
          <div className="flex-1 flex items-center justify-end px-4">
            <img src={LOGO_PREFEITURA} alt="Prefeitura" className="h-[85px] object-contain" />
          </div>
          <div className="w-[380px] border-x border-black flex flex-col items-center justify-center text-center p-2">
            <h1 className="font-black text-[18px] uppercase leading-tight">Lista de Chamada</h1>
            <div className="w-full border-b border-black my-1"></div>
            <p className="text-[12px] font-black uppercase">{curso?.oficina || 'OFICINA'}</p>
          </div>
          <div className="flex-1 flex items-center justify-start px-4">
            <img src={LOGO_CULTURA} alt="Cultura" className="h-[85px] object-contain" />
          </div>
        </div>

        {/* TABELA COM DADOS DO SEU SISTEMA */}
        <table className="w-full border-collapse border border-black">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 text-[10px] font-black w-8">Nº</th>
              <th className="border border-black p-1 text-[10px] font-black text-left">NOME DO ALUNO</th>
              {[...Array(31)].map((_, i) => (
                <th key={i} className="border border-black text-[9px] w-5 font-black">{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {alunosLocais.map((aluno, index) => (
              <tr key={aluno.id}>
                <td className="border border-black text-center text-[10px] py-1 font-bold">{index + 1}</td>
                <td className="border border-black px-2 text-[10px] font-bold uppercase truncate max-w-[200px]">
                  {aluno.nome}
                </td>
                {[...Array(31)].map((_, i) => (
                  <td key={i} className="border border-black"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* RODAPÉ COM ASSINATURAS E FRASE */}
        <footer className="mt-8 flex flex-col gap-4">
          <div className="flex justify-between items-end gap-4 px-4">
            <div className="text-center">
              <div className="w-[260px] border-b border-black mb-1"></div>
              <p className="text-[9px] font-black uppercase">Coordenador(a) Pedagógico(a)</p>
            </div>
            <p className="text-[8px] text-gray-400 italic text-center leading-relaxed max-w-[340px]">
              A Secretaria de Cultura e Turismo deseja ao professor do curso de {curso?.oficina} um ótimo mês de {mesesNomes[mes].toLowerCase()}.
            </p>
            <div className="text-center">
              <div className="w-[260px] border-b border-black mb-1"></div>
              <p className="text-[9px] font-black uppercase">Professor(a): {curso?.professor || profSel}</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

