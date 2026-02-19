'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CasaDaCulturaPage() {
  const [turma, setTurma] = useState<any>(null)
  const [alunos, setAlunos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mesSel, setMesSel] = useState(new Date().getMonth())

  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ]

  useEffect(() => {
    fetchDados()
  }, [mesSel])

  async function fetchDados() {
    try {
      setLoading(true)
      const { data: turmas } = await supabase.from('turmas').select('*').limit(1)
      
      if (turmas && turmas.length > 0) {
        const t = turmas[0]
        setTurma(t)
        
        const { data: alunosData } = await supabase
          .from('alunos')
          .select('*')
          .eq('turma_id', t.id)
          .order('posicao', { ascending: true })
        
        setAlunos(alunosData || [])
      }
    } catch (e) {
      console.error("Erro na busca:", e)
    } finally {
      setLoading(false)
    }
  }

  const salvarNome = async (posicao: number, nome: string) => {
    if (!turma?.id) return
    await supabase
      .from('alunos')
      .upsert({ turma_id: turma.id, posicao, nome }, { onConflict: 'turma_id,posicao' })
  }

  if (loading) return <div className="p-20 font-black text-center uppercase italic animate-pulse text-2xl">Carregando Sistema...</div>

  // Se não achar turma, mostra aviso em vez de tela branca
  if (!turma) return <div className="p-20 text-center font-black border-4 border-red-600 m-10">ERRO: Nenhuma turma encontrada no banco de dados. Verifique o Supabase.</div>

  return (
    <div className="min-h-screen bg-white p-4 sm:p-8 italic font-black uppercase">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { padding: 0 !important; }
          .sheet { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; }
        }
      `}</style>

      {/* CONTROLES ADM */}
      <div className="no-print mb-8 flex flex-wrap gap-4 bg-slate-100 p-4 border-4 border-black shadow-[4px_4px_0px_#000]">
        <div className="flex flex-col">
          <label className="text-[10px] mb-1">MÊS DE REFERÊNCIA</label>
          <select 
            value={mesSel} 
            onChange={(e) => setMesSel(Number(e.target.value))}
            className="border-2 border-black p-2 bg-white font-black"
          >
            {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-8 py-2 border-2 border-black hover:bg-black transition-all self-end"
        >
          IMPRIMIR CHAMADA
        </button>
      </div>

      {/* FOLHA DE CHAMADA */}
      <div className="sheet max-w-5xl mx-auto border-4 border-black p-6 bg-white">
        
        <div className="flex justify-between items-start border-b-8 border-black pb-4 mb-6">
          <div className="space-y-3">
            <h2 className="text-4xl tracking-tighter italic leading-none">{turma.oficina || 'OFICINA'}</h2>
            
            <div className="flex gap-2">
              <div className="border-2 border-black px-3 py-1">
                <span className="text-[9px] block text-gray-500 font-bold">PROFESSOR(A)</span>
                <span className="text-sm">{turma.professor || '---'}</span>
              </div>

              <div className="border-2 border-black px-3 py-1">
                <span className="text-[9px] block text-gray-500 font-bold">HORÁRIO</span>
                <span className="text-sm">{turma.horario || '---'}</span>
              </div>

              <div className="border-4 border-black px-4 py-1 bg-black text-white">
                <span className="text-[9px] block text-gray-400 font-bold">DIAS DA SEMANA</span>
                <span className="text-lg tracking-widest">
                  {turma.dias?.toUpperCase().includes('TER') ? 'TERÇA E QUINTA' : 'SEGUNDA E QUARTA'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="bg-black text-white px-6 py-2 mb-1">
                <span className="text-2xl">{meses[mesSel]}</span>
            </div>
            <p className="text-[10px]">CASA DA CULTURA 2026</p>
          </div>
        </div>

        <table className="w-full border-collapse border-4 border-black">
          <thead>
            <tr className="bg-slate-100">
              <th className="border-2 border-black w-10 p-1 text-[10px]">Nº</th>
              <th className="border-2 border-black p-2 text-left text-xs">NOME DO ALUNO</th>
              {Array.from({ length: 31 }).map((_, i) => (
                <th key={i} className="border-2 border-black w-6 text-[8px]">{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 18 }).map((_, i) => {
              const posicao = i + 1
              const aluno = alunos.find(a => a.posicao === posicao)
              
              return (
                <tr key={posicao} className="h-8">
                  <td className="border-2 border-black text-center text-[10px] font-bold bg-slate-50">{posicao}</td>
                  <td className="border-2 border-black px-2">
                    <input 
                      type="text"
                      defaultValue={aluno?.nome || ''}
                      onBlur={(e) => salvarNome(posicao, e.target.value)}
                      className="w-full outline-none bg-transparent text-sm focus:bg-yellow-50"
                      placeholder="..........................................."
                    />
                  </td>
                  {Array.from({ length: 31 }).map((_, d) => (
                    <td key={d} className="border-2 border-black"></td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="mt-12 flex justify-between items-end">
          <div className="text-[9px] text-gray-400 font-bold">
            ( . ) PRESENÇA | ( F ) FALTA | ( J ) JUSTIFICADO
          </div>
          <div className="w-72 border-t-4 border-black text-center pt-2">
            <p className="text-[10px] font-black">ASSINATURA DO PROFESSOR</p>
          </div>
        </div>
      </div>
    </div>
  )
}