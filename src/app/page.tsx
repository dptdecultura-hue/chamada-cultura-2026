'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// --- LOGOS EM BASE64 (MANTENHA AS STRINGS COMPLETAS DO SEU ARQUIVO) ---
const LOGO_PREFEITURA = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERG..." 
const LOGO_CULTURA = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERG..."

export default function CasaDaCultura2026() {
  // --- ESTADOS DO SEU CÓDIGO PERFEITO ---
  const [tela, setTela] = useState('menu')
  const [profSel, setProfSel] = useState("")
  const [idAtivo, setIdAtivo] = useState(null)
  const [mes, setMes] = useState(new Date().getMonth())
  const [turmas, setTurmas] = useState([])
  const [alunosLocais, setAlunosLocais] = useState([])
  const [loading, setLoading] = useState(true)
  
  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  // --- LÓGICA DE BUSCA (SIMPLIFICADA PARA O DEPLOY NÃO FALHAR) ---
  useEffect(() => {
    async function fetchDados() {
      setLoading(true)
      const { data: turmasData } = await supabase.from('turmas').select('*')
      if (turmasData) setTurmas(turmasData)
      if (idAtivo) {
        const { data: alunosData } = await supabase.from('alunos').select('*').eq('turma_id', idAtivo).order('nome')
        if (alunosData) setAlunosLocais(alunosData)
      }
      setLoading(false)
    }
    fetchDados()
  }, [idAtivo])

  const curso = turmas.find(t => t.id === idAtivo)

  return (
    <div className="min-h-screen bg-white font-sans">
      
      {/* INTERFACE DE GESTÃO (OCULTA NA IMPRESSÃO) */}
      <div className="no-print p-4 bg-gray-100 border-b">
        <button 
          onClick={() => window.print()} 
          className="bg-black text-white px-6 py-2 font-black uppercase hover:bg-gray-800 transition-all"
        >
          Imprimir Folha Oficial
        </button>
      </div>

      {/* ÁREA DA FOLHA (ESTRUTURA DO PREVIEW_FOLHA.HTML) */}
      <div className="p-0 sm:p-8 print:p-0">
        <div className="bg-white w-[210mm] min-h-[297mm] mx-auto overflow-hidden">
          
          {/* CABEÇALHO COM LOGOS REALISTAS */}
          <div className="flex items-stretch border border-black h-[110px] bg-white mb-4">
            <div className="flex-1 flex items-center justify-end px-4">
              <img src={LOGO_PREFEITURA} alt="Prefeitura" className="h-[85px] object-contain" />
            </div>
            
            <div className="w-[380px] border-x border-black flex flex-col items-center justify-center text-center p-2">
              <h1 className="font-black text-[18px] uppercase leading-tight">Lista de Chamada</h1>
              <div className="w-full border-b border-black my-1"></div>
              <p className="text-[12px] font-black uppercase tracking-widest">
                {curso?.oficina || 'OFICINA'}
              </p>
            </div>

            <div className="flex-1 flex items-center justify-start px-4">
              <img src={LOGO_CULTURA} alt="Cultura" className="h-[85px] object-contain" />
            </div>
          </div>

          {/* TABELA DE CHAMADA */}
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr className="bg-gray-50 uppercase font-black text-[10px]">
                <th className="border border-black p-1 w-8">Nº</th>
                <th className="border border-black p-1 text-left px-2">Nome do Aluno</th>
                {[...Array(31)].map((_, i) => (
                  <th key={i} className="border border-black text-[9px] w-[22px]">{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alunosLocais.length > 0 ? alunosLocais.map((aluno, index) => (
                <tr key={aluno.id} className="h-7">
                  <td className="border border-black text-center text-[10px] font-bold">{index + 1}</td>
                  <td className="border border-black px-2 text-[10px] font-black uppercase truncate max-w-[220px]">
                    {aluno.nome}
                  </td>
                  {[...Array(31)].map((_, i) => (
                    <td key={i} className="border border-black"></td>
                  ))}
                </tr>
              )) : (
                // Linhas vazias caso não haja alunos carregados
                [...Array(20)].map((_, index) => (
                  <tr key={index} className="h-7">
                    <td className="border border-black text-center text-[10px] font-bold">{index + 1}</td>
                    <td className="border border-black px-2"></td>
                    {[...Array(31)].map((_, i) => (
                      <td key={i} className="border border-black"></td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* RODAPÉ DO PREVIEW_FOLHA.HTML */}
          <footer className="mt-12">
            <div className="flex justify-between items-end gap-4 px-2">
              
              <div className="text-center">
                <div className="w-[260px] border-b border-black mb-1"></div>
                <p className="text-[9px] font-black uppercase tracking-tight">Coordenador(a) Pedagógico(a)</p>
              </div>

              <p className="text-[8px] text-gray-400 italic text-center leading-relaxed max-w-[340px]">
                A Secretaria de Cultura e Turismo deseja ao professor do curso de {curso?.oficina || 'oficina'} um ótimo mês de {mesesNomes[mes].toLowerCase()}.
              </p>

              <div className="text-center">
                <div className="w-[260px] border-b border-black mb-1"></div>
                <p className="text-[9px] font-black uppercase tracking-tight">
                  Professor(a): {curso?.professor || profSel}
                </p>
              </div>
            </div>
          </footer>

        </div>
      </div>
    </div>
  )
}

