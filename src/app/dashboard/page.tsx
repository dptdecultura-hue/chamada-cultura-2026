'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardADM() {
  const [turmas, setTurmas] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const mesAtual = new Date().getMonth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const { data: turmasData } = await supabase.from('turmas').select('*').order('oficina', { ascending: true })
      if (turmasData) {
        setTurmas(turmasData)
        const estatisticas: any = {}
        for (const turma of turmasData) {
          const { count: totalAlunos } = await supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('turma_id', turma.id)
          const { data: freqData } = await supabase.from('frequencia').select('aluno_posicao, status').eq('turma_id', turma.id).eq('mes', mesAtual).eq('status', 'F')
          
          const faltasPorAluno: any = {}
          freqData?.forEach(f => {
            faltasPorAluno[f.aluno_posicao] = (faltasPorAluno[f.aluno_posicao] || 0) + 1
          })
          const alertas = Object.values(faltasPorAluno).filter((f: any) => f >= 3).length
          estatisticas[turma.id] = { total: totalAlunos || 0, alertas: alertas }
        }
        setStats(estatisticas)
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (loading) return <div className="p-20 font-black text-center text-xl uppercase animate-pulse">Carregando painel...</div>

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6">
      {/* HEADER LIMPO */}
      <header className="max-w-6xl mx-auto mb-10 flex justify-between items-center border-b-2 border-black pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Gestão de Turmas</h1>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Casa da Cultura 2026</p>
        </div>
        <Link href="/" className="border-2 border-black px-4 py-2 font-black uppercase text-[10px] hover:bg-black hover:text-white transition-all">
          ← Sair do Painel
        </Link>
      </header>

      {/* GRID ORGANIZADA */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {turmas.map((turma) => {
          const info = stats[turma.id] || { total: 0, alertas: 0 }
          const temAlerta = info.alertas > 0

          return (
            <div key={turma.id} className="bg-white border-2 border-black shadow-[4px_4px_0px_#000] flex flex-col">
              {/* TOPO DO CARD: Cor só se tiver alerta */}
              <div className={`p-4 border-b-2 border-black ${temAlerta ? 'bg-red-500 text-white' : 'bg-slate-100 text-black'}`}>
                <h2 className="text-lg font-black uppercase truncate">{turma.oficina}</h2>
                <p className={`text-[10px] font-bold uppercase ${temAlerta ? 'text-white/80' : 'text-slate-500'}`}>
                  Prof. {turma.professor}
                </p>
              </div>

              {/* CORPO DO CARD */}
              <div className="p-4 flex-grow space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400">Matrículas Ativas</span>
                  <span className="font-bold text-sm">{info.total} / 18</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-slate-400">Situação</span>
                  {temAlerta ? (
                    <span className="bg-red-100 text-red-600 px-2 py-0.5 text-[10px] font-black border border-red-600 uppercase animate-pulse">
                      {info.alertas} Alunos com Falta
                    </span>
                  ) : (
                    <span className="text-green-600 text-[10px] font-black uppercase italic">Regular</span>
                  )}
                </div>

                <div className="pt-2">
                   <p className="text-[10px] font-bold text-slate-400 uppercase italic">Horário: {turma.horario}</p>
                </div>
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="p-4 bg-slate-50 border-t-2 border-black grid grid-cols-2 gap-2">
                <Link 
                  href={`/chamada/${turma.id}`} 
                  className="bg-blue-600 text-white text-center py-2 font-black uppercase text-[10px] border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Abrir Chamada
                </Link>
                <button className="bg-white text-black text-center py-2 font-black uppercase text-[10px] border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                  Relatório
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}