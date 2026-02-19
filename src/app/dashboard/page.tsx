'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CasaDaCulturaPage() {
  const [turma, setTurma] = useState<any>(null)
  const [alunos, setAlunos] = useState<any[]>([])
  const [frequencia, setFrequencia] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [mesSel, setMesSel] = useState(new Date().getMonth())

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  // Configuração Fixa: Apenas 18 linhas por folha
  const totalLinhas = 18

  useEffect(() => {
    fetchDados()
  }, [mesSel])

  async function fetchDados() {
    setLoading(true)
    // Busca a primeira turma encontrada (ajuste o filtro se necessário)
    const { data: turmas } = await supabase.from('turmas').select('*').limit(1)
    if (turmas && turmas[0]) {
      setTurma(turmas[0])
      
      const { data: alunosData } = await supabase
        .from('alunos')
        .select('*')
        .eq('turma_id', turmas[0].id)
        .order('posicao', { ascending: true })
      
      setAlunos(alunosData || [])

      const { data: freqData } = await supabase
        .from('frequencia')
        .select('*')
        .eq('turma_id', turmas[0].id)
        .eq('mes', mesSel)

      const freqMap: any = {}
      freqData?.forEach(f => {
        freqMap[`${f.aluno_posicao}-${f.dia}`] = f.status
      })
      setFrequencia(freqMap)
    }
    setLoading(false)
  }

  const salvarNome = async (posicao: number, nome: string) => {
    if (!turma) return
    const { error } = await supabase
      .from('alunos')
      .upsert({ turma_id: turma.id, posicao, nome }, { onConflict: 'turma_id,posicao' })
    if (error) console.error("Erro ao salvar:", error)
  }

  if (loading) return <div className="p-20 font-black text-center animate-pulse">CARREGANDO...</div>

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 italic font-black uppercase">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { padding: 0 !important; }
          .sheet { border: none !important; box-shadow: none !important; }
        }
      `}</style>

      {/* CONTROLES ADM - NÃO SAEM NA IMPRESSÃO */}
      <div className="no-print mb-8 flex flex-wrap gap-4 bg-slate-100 p-4 border-2 border-black">
        <select 
          value={mesSel} 
          onChange={(e) => setMesSel(Number(e.target.value))}
          className="border-2 border-black p-2 bg-white"
        >
          {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        
        <button 
          onClick={() => window.print()}
          className="bg-black text-white px-6 py-2 hover:bg-blue-600 transition-colors"
        >
          IMPRIMIR CHAMADA
        </button>
      </div>

      {/* FOLHA DE CHAMADA */}
      <div className="sheet max-w-5xl mx-auto border-2 border-gray-200 p-6 shadow-xl bg-white">
        
        {/* CABEÇALHO EM DESTAQUE */}
        <div className="flex justify-between items-start border-b-8 border-black pb-4 mb-6">
          <div className="space-y-3">
            <h2 className="text-4xl tracking-tighter italic">{turma?.oficina}</h2>
            
            <div className="flex gap-2">
              <div className="border-2 border-black px-3 py-1 bg-white">
                <span className="text-[9px] block text-gray-500 font-bold">PROFESSOR(A)</span>
                <span className="text-sm">{turma?.professor}</span>
              </div>

              <div className="border-2 border-black px-3 py-1 bg-white">
                <span className="text-[9px] block text-gray-500 font-bold">HORÁRIO</span>
                <span className="text-sm">{turma?.horario}</span>
              </div>

              {/* DIAS DA SEMANA - DESTAQUE PRETO */}
              <div className="border-4 border-black px-4 py-1 bg-black text-white shadow-[4px_4px_0px_#ccc]">
                <span className="text-[9px] block text-gray-400 font-bold">DIAS DA SEMANA</span>
                <span className="text-lg tracking-widest">
                  {turma?.dias?.includes('TER') ? 'TERÇA E QUINTA' : 'SEGUNDA E QUARTA'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="bg-black text-white px-6 py-2 mb-2">
                <span className="text-2xl">{meses[mesSel]}</span>
            </div>
            <span className="text-[10px] italic">CASA DA CULTURA 2026</span>
          </div>
        </div>

        {/* TABELA DE CHAMADA - SEM COLUNA NAIPE */}
        <table className="w-full border-collapse border-4 border-black">
          <thead>
            <tr className="bg-slate-50">
              <th className="border-2 border-black w-10 p-1 text-[10px]">Nº</th>
              <th className="border-2 border-black p-2 text-left text-xs">NOME DO ALUNO</th>
              {Array.from({ length: 31 }).map((_, i) => (
                <th key={i} className="border-2 border-black w-6 p-0 text-[8px] leading-none">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalLinhas }).map((_, i) => {
              const posicao = i + 1
              const aluno = alunos.find(a => a.posicao === posicao)
              
              return (
                <tr key={posicao} className="h-8">
                  <td className="border-2 border-black text-center text-[10px] font-bold bg-slate-50">
                    {posicao}
                  </td>
                  <td className="border-2 border-black px-2">
                    <input 
                      type="text"
                      defaultValue={aluno?.nome || ''}
                      onBlur={(e) => salvarNome(posicao, e.target.value)}
                      className="w-full outline-none bg-transparent text-sm focus:bg-yellow-50"
                      placeholder="..."
                    />
                  </td>
                  {Array.from({ length: 31 }).map((_, diaIdx) => (
                    <td key={diaIdx} className="border-2 border-black p-0"></td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* RODAPÉ PARA ASSINATURA */}
        <div className="mt-10 flex justify-between items-end">
          <div className="text-[9px] text-gray-400">
            LEGENDA: ( . ) PRESENÇA  |  ( F ) FALTA  |  ( J ) JUSTIFICADO
          </div>
          <div className="w-64 border-t-2 border-black text-center pt-1">
            <p className="text-[10px] font-bold uppercase">Assinatura do Professor</p>
          </div>
        </div>
      </div>
    </div>
  )
}