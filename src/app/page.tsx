'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// LOGOS EM BASE64 (MANTENHA AS STRINGS COMPLETAS DO SEU ARQUIVO)
const LOGO_PREFEITURA = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERG..." 
const LOGO_CULTURA = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERG..."

export default function CasaDaCultura2026() {
  const [idAtivo, setIdAtivo] = useState<any>(null)
  const [mes] = useState(new Date().getMonth())
  // AQUI ESTÁ A CORREÇÃO: Definindo as listas como 'any[]' para o TypeScript não travar
  const [turmas, setTurmas] = useState<any[]>([])
  const [alunosLocais, setAlunosLocais] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const mesesNomes = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]

  useEffect(() => {
    fetchDados()
  }, [idAtivo])

  async function fetchDados() {
    setLoading(true)
    const { data: t } = await supabase.from('turmas').select('*').order('horario')
    if (t) setTurmas(t as any[])
    
    if (idAtivo) {
      const { data: a } = await supabase.from('alunos').select('*').eq('turma_id', idAtivo).order('nome')
      if (a) setAlunosLocais(a as any[])
    }
    setLoading(false)
  }

  const curso = turmas.find(t => t.id === idAtivo)

  return (
    <div className="min-h-screen bg-white font-sans text-black">
      {/* INTERFACE DE GESTÃO (OCULTA NA IMPRESSÃO) */}
      <div className="no-print p-4 bg-gray-100 border-b flex gap-4">
        <select 
          onChange={(e) => setIdAtivo(e.target.value)} 
          className="p-2 border border-gray-400 rounded font-bold text-black"
        >
          <option value="">Selecione a Turma</option>
          {turmas.map((t: any) => (
            <option key={t.id} value={t.id}>{t.oficina} - {t.horario}</option>
          ))}
        </select>
        <button 
          onClick={() => window.print()} 
          className="bg-black text-white px-4 py-2 font-black uppercase text-xs"
        >
          Imprimir Chamada
        </button>
      </div>

      {/* ÁREA DA FOLHA (ESTRUTURA A4 DO PREVIEW) */}
      <div className="print:block p-0 sm:p-8">
        <div className="bg-white w-[210mm] mx-auto overflow-hidden">
          
          <div className="flex items-stretch border border-black h-[110px] mb-4">
            <div className="flex-1 flex items-center justify-end px-4">
              <img src={LOGO_PREFEITURA} alt="Prefeitura" className="h-[85px] object-contain" />
            </div>
            <div className="w-[380px] border-x border-black flex flex-col items-center justify-center text-center p-2">
              <h1 className="font-black text-[18px] uppercase">Lista de Chamada</h1>
              <div className="w-full border-b border-black my-1"></div>
              <p className="text-[12px] font-black uppercase">{curso?.oficina || 'OFICINA'}</p>
            </div>
            <div className="flex-1 flex items-center justify-start px-4">
              <img src={LOGO_CULTURA} alt="Cultura" className="h-[85px] object-contain" />
            </div>
          </div>

          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-50 font-black text-[10px] uppercase">
                <th className="border border-black p-1 w-8">Nº</th>
                <th className="border border-black p-1 text-left px-2">NOME DO ALUNO</th>
                {[...Array(31)].map((_, i) => (
                  <th key={i} className="border border-black text-[9px] w-[22px]">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alunosLocais.map((aluno: any, index: number) => (
                <tr key={aluno.id} className="h-7">
                  <td className="border border-black text-center text-[10px] font-bold">{index + 1}</td>
                  <td className="border border-black px-2 text-[10px] font-black uppercase truncate max-w-[200px]">
                    {aluno.nome}
                  </td>
                  {[...Array(31)].map((_, i) => (
                    <td key={i} className="border border-black"></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <footer className="mt-12 px-2">
            <div className="flex justify-between items-end gap-4">
              <div className="text-center">
                <div className="w-[260px] border-b border-black mb-1"></div>
                <p className="text-[9px] font-black uppercase">Coordenador(a) Pedagógico(a)</p>
              </div>
              <p className="text-[8px] text-gray-400 italic text-center leading-relaxed max-w-[340px]">
                A Secretaria de Cultura e Turismo deseja ao professor do curso de {curso?.oficina || 'oficina'} um ótimo mês de {mesesNomes[mes]}.
              </p>
              <div className="text-center">
                <div className="w-[260px] border-b border-black mb-1"></div>
                <p className="text-[9px] font-black uppercase">Professor(a): {curso?.professor || 'ASSINATURA'}</p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}

