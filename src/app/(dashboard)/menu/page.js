'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { UNIDADES } from '@/lib/constants'

export default function Menu() {
  const [turmas, setTurmas] = useState([])
  const [todosAlunos, setTodosAlunos] = useState([])
  const [contagemAlunos, setContagemAlunos] = useState({})
  const [loading, setLoading] = useState(true)
  const [mes, setMes] = useState(6)

  const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

  const blocosTrimestrais = [
    { inicio: 0, nome: "Jan, Fev e Mar" },
    { inicio: 3, nome: "Abr, Mai e Jun" },
    { inicio: 6, nome: "Jul, Ago e Set" },
    { inicio: 9, nome: "Out, Nov e Dez" }
  ]

  useEffect(() => {
    fetchTurmas()
    fetchDadosGlobais()
  }, [mes])

  async function fetchTurmas() {
    const { data: tData } = await supabase.from('turmas').select('*')
    const { data: aData } = await supabase.from('alunos').select('turma_id')
    const contagem = {}
    aData?.forEach(a => { contagem[a.turma_id] = (contagem[a.turma_id] || 0) + 1 })
    setContagemAlunos(contagem)
    if (tData) setTurmas(tData.sort((a, b) => a.horario.localeCompare(b.horario)))
    setLoading(false)
  }

  async function fetchDadosGlobais() {
    const { data: alu } = await supabase.from('alunos').select('*')
    if (alu) setTodosAlunos(alu)
  }

  if (loading) {
    return <div className="h-screen flex items-center justify-center font-black text-2xl uppercase italic text-black bg-white">CARREGANDO...</div>
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-black uppercase pb-20">
      {/* TOPO */}
      <div className="bg-white border-b-4 border-black p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-black border-l-8 border-black pl-4 italic tracking-tighter">
            CASA DA CULTURA <span className="text-blue-600">TRIMESTRAL</span>
          </h1>
          <div className="flex items-center gap-2 bg-white border-4 border-black p-2 shadow-[4px_4px_0px_#000]">
            <span className="text-[10px] font-black">BLOCO:</span>
            <select
              value={mes}
              onChange={e => setMes(Number(e.target.value))}
              className="bg-black text-white px-4 py-1 text-xs font-black italic outline-none cursor-pointer"
            >
              {blocosTrimestrais.map((b, i) => <option key={i} value={b.inicio}>{b.nome}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* MENU EM CARDS */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link href="/turmas" className="bg-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] transition-all">
            <div className="text-3xl mb-1">⚙</div>
            <div className="text-sm font-black">GERENCIAR</div>
            <div className="text-sm font-black">TURMAS</div>
          </Link>
          <Link href="/alunos" className="bg-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] transition-all">
            <div className="text-3xl mb-1">👤</div>
            <div className="text-sm font-black">PERFIL DO</div>
            <div className="text-sm font-black">ALUNO</div>
          </Link>
          <Link href="/dashboard" className="bg-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] transition-all">
            <div className="text-3xl mb-1">📊</div>
            <div className="text-sm font-black">DASHBOARD</div>
          </Link>
          <Link href="/relatorios/frequencia" className="bg-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] transition-all">
            <div className="text-3xl mb-1">📊</div>
            <div className="text-sm font-black">RELATÓRIO</div>
            <div className="text-sm font-black">FREQUÊNCIA</div>
          </Link>
          <Link href="/previsao-evasao" className="bg-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] transition-all">
            <div className="text-3xl mb-1">🤖</div>
            <div className="text-sm font-black">PREVISÃO</div>
            <div className="text-sm font-black">EVASÃO</div>
          </Link>
          <Link href="/notificacoes" className="bg-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] transition-all">
            <div className="text-3xl mb-1">📱</div>
            <div className="text-sm font-black">NOTIFICAÇÕES</div>
          </Link>
        </div>

        {/* LINHA DIVISÓRIA */}
        <div className="flex items-center gap-4 my-8">
          <div className="flex-1 border-t-2 border-black"></div>
          <span className="text-[10px] text-gray-400 tracking-widest">UNIDADES</span>
          <div className="flex-1 border-t-2 border-black"></div>
        </div>

        {/* BOTÕES DAS UNIDADES */}
        <div className="flex flex-wrap justify-center gap-3">
          {UNIDADES.map(u => (
            <a
              key={u.id}
              href={`#${u.id}`}
              className={`border-4 border-black px-6 py-2 text-sm font-black ${u.accent} bg-white hover:bg-black hover:text-white transition-all`}
            >
              {u.label}
            </a>
          ))}
        </div>

        {/* CONTEÚDO DAS UNIDADES */}
        {UNIDADES.map((u, idx) => {
          const turmasDaUnidade = turmas.filter(t => (t.unidade || 'jardim_europa') === u.id)
          const turmaIdsUnidade = new Set(turmasDaUnidade.map(t => t.id))
          const alunosUnidade = todosAlunos.filter(a => turmaIdsUnidade.has(a.turma_id))

          const listaProfessoresUnidade = [...new Set(turmasDaUnidade.map(t => 
            t.oficina.toUpperCase().includes("PIANO") ? `MICHEL (PIANO)` : t.professor
          ))].sort()

          return (
            <div key={u.id} id={u.id} className="mt-12">
              <div className={`flex items-center gap-3 max-w-5xl mx-auto mb-6 border-l-8 ${u.accent} pl-6 text-left`}>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">{u.nome}</h2>
                <span className="text-sm font-bold italic text-gray-400 normal-case">{alunosUnidade.length} alunos</span>
                <span className="text-sm font-bold italic text-gray-400 normal-case">{turmasDaUnidade.length} turmas</span>
              </div>

              {listaProfessoresUnidade.length === 0 ? (
                <p className="max-w-5xl mx-auto text-left text-[11px] text-gray-400 font-bold italic mb-4">
                  NENHUMA TURMA CADASTRADA NESTA UNIDADE AINDA.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                  {listaProfessoresUnidade.map(p => {
                    const isPiano = p === "MICHEL (PIANO)"
                    const turmasDoProfessor = turmasDaUnidade.filter(t => 
                      isPiano 
                        ? (t.professor === "MICHEL" && t.oficina.toUpperCase().includes("PIANO")) 
                        : (t.professor === p && !t.oficina.toUpperCase().includes("PIANO"))
                    )
                    const totalAlunos = turmasDoProfessor.reduce((acc, t) => acc + (contagemAlunos[t.id] || 0), 0)

                    return (
                      <Link
                        key={p}
                        href={`/lista?professor=${encodeURIComponent(p)}&unidade=${u.id}`}
                        className="border-4 border-black bg-white p-6 text-center shadow-[4px_4px_0px_#000] hover:translate-y-[-2px] transition-all font-black no-underline"
                      >
                        <div className="text-sm leading-tight">{p}</div>
                        <div className={`text-[10px] mt-2 font-bold italic ${u.txt}`}>
                          {totalAlunos} ALUNOS
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}

              {idx < UNIDADES.length - 1 && (
                <div className="max-w-5xl mx-auto border-t-4 border-dashed border-gray-300 my-12"></div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
