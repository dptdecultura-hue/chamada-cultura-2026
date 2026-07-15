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
    <div className="min-h-screen bg-[#F8FAFC] italic font-black uppercase text-center pb-20">
      <style jsx global>{`html { scroll-behavior: smooth; }`}</style>

      <div className="p-8 pb-4">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto mb-2 gap-6">
          <h1 className="text-4xl font-black border-l-8 border-black pl-6 italic tracking-tighter">
  CASA DA CULTURA <span className="text-blue-600">TRIMESTRAL</span>
  <span className="text-sm text-red-500 ml-4">(NOVA VERSÃO)</span>
</h1>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link
              href="/turmas"
              className="bg-black text-white px-6 py-3 font-black uppercase italic text-sm border-4 border-black shadow-[4px_4px_0px_#000] hover:bg-white hover:text-black transition-all"
            >
              ⚙ GERENCIAR TURMAS
            </Link>
            <Link
              href="/alunos"
              className="bg-purple-600 text-white px-6 py-3 font-black uppercase italic text-sm border-4 border-black shadow-[4px_4px_0px_#000] hover:bg-purple-500 transition-all"
            >
              👤 PERFIL DO ALUNO
            </Link>
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
      </div>

      {/* ATALHOS DE NAVEGAÇÃO ENTRE UNIDADES */}
      <div className="no-print sticky top-0 z-40 bg-black text-white flex flex-wrap items-center justify-center gap-3 px-8 py-3 mb-10 shadow-md">
        <span className="text-[10px] font-black uppercase italic mr-2">IR PARA:</span>
        {UNIDADES.map(u => (
          <a
            key={u.id}
            href={`#${u.id}`}
            className="text-[11px] font-black italic uppercase border-2 border-white px-3 py-1 hover:bg-white hover:text-black transition-all no-underline"
          >
            {u.label}
          </a>
        ))}
      </div>

      {UNIDADES.map((u, idx) => {
        const turmasDaUnidade = turmas.filter(t => (t.unidade || 'jardim_europa') === u.id)
        const turmaIdsUnidade = new Set(turmasDaUnidade.map(t => t.id))
        const alunosUnidade = todosAlunos.filter(a => turmaIdsUnidade.has(a.turma_id))

        const listaProfessoresUnidade = [...new Set(turmasDaUnidade.map(t => 
          t.oficina.toUpperCase().includes("PIANO") ? `MICHEL (PIANO)` : t.professor
        ))].sort()

        return (
          <div key={u.id} id={u.id} className="px-8">
            <div className={`flex items-center gap-3 max-w-6xl mx-auto mb-6 border-l-8 ${u.accent} pl-6 text-left`}>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">{u.nome}</h2>
              <span className="text-sm font-bold italic text-gray-400 normal-case">{alunosUnidade.length} alunos</span>
              <span className="text-sm font-bold italic text-gray-400 normal-case">{turmasDaUnidade.length} turmas</span>
            </div>

            {listaProfessoresUnidade.length === 0 ? (
              <p className="max-w-6xl mx-auto text-left text-[11px] text-gray-400 font-bold italic mb-4">
                NENHUMA TURMA CADASTRADA NESTA UNIDADE AINDA.
              </p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
                      className="border-4 border-black bg-white p-8 text-sm flex flex-col items-center shadow-[6px_6px_0px_#000] hover:translate-y-[-2px] transition-all font-black no-underline"
                    >
                      {p}
                      <span className={`text-[10px] mt-2 font-bold italic ${u.txt}`}>
                        {totalAlunos} ALUNOS
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}

            {idx < UNIDADES.length - 1 && (
              <div className="max-w-6xl mx-auto border-t-4 border-dashed border-gray-300 my-12"></div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// menu/page.js - Versão com perfil do aluno
